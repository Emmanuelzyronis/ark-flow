import type { FastifyInstance } from 'fastify';
import db from '../db/client.js';
import { draftChaseEmail } from '../services/ai.service.js';

export default async function chaseRoutes(app: FastifyInstance) {
  // POST /api/chase/draft — generate Claude-drafted chase email
  app.post('/api/chase/draft', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const { invoice_id, tone = 'polite' } = req.body as {
      invoice_id: string;
      tone?: 'polite' | 'firm' | 'final';
    };

    const result = await db.query(
      `SELECT i.*, v.name as vendor_name, v.email as vendor_email
       FROM invoices i
       LEFT JOIN vendors v ON v.id = i.vendor_id
       WHERE i.id = $1 AND i.org_id = $2`,
      [invoice_id, org_id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    const invoice = result.rows[0];
    const days_overdue = invoice.due_date
      ? Math.max(0, Math.floor((Date.now() - new Date(invoice.due_date).getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

    const draft = await draftChaseEmail({
      vendor_name: invoice.vendor_name ?? 'Vendor',
      invoice_number: invoice.invoice_number,
      total_amount: Number(invoice.total_amount),
      currency: invoice.currency,
      days_overdue,
      due_date: invoice.due_date,
      tone,
    });

    return reply.send({
      ...draft,
      days_overdue,
      recipient_email: invoice.vendor_email ?? '',
      invoice_id,
      tone,
    });
  });

  // POST /api/chase/send — save chase email record
  app.post('/api/chase/send', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id, sub: user_id } = req.user;
    const body = req.body as {
      invoice_id: string;
      tone: 'polite' | 'firm' | 'final';
      subject: string;
      body: string;
      recipient_email: string;
      days_overdue: number;
    };

    const invoiceCheck = await db.query<{ id: string; vendor_id: string; status: string }>(
      'SELECT id, vendor_id, status FROM invoices WHERE id = $1 AND org_id = $2',
      [body.invoice_id, org_id]
    );
    if (invoiceCheck.rows.length === 0) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }
    const invoice = invoiceCheck.rows[0];

    // Save chase email
    const chaseResult = await db.query<{ id: string }>(
      `INSERT INTO chase_emails (org_id, invoice_id, vendor_id, tone, subject, body, recipient_email, days_overdue, sent_at, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now(), $9)
       RETURNING id`,
      [
        org_id, body.invoice_id, invoice.vendor_id,
        body.tone, body.subject, body.body,
        body.recipient_email, body.days_overdue, user_id,
      ]
    );

    // Update invoice status to CHASED if currently OVERDUE
    if (['OVERDUE', 'PENDING'].includes(invoice.status)) {
      await db.query(
        "UPDATE invoices SET status = 'CHASED', updated_at = now() WHERE id = $1",
        [body.invoice_id]
      );
      await db.query(
        `INSERT INTO invoice_state_log (invoice_id, from_state, to_state, trigger_source, triggered_by, metadata)
         VALUES ($1, $2, 'CHASED', 'chase_email', $3, $4)`,
        [body.invoice_id, invoice.status, user_id, JSON.stringify({ tone: body.tone, chase_id: chaseResult.rows[0].id })]
      );
    }

    return reply.status(201).send({
      success: true,
      chase_id: chaseResult.rows[0].id,
      note: 'Email record saved. Configure SMTP in settings to enable actual sending.',
    });
  });

  // GET /api/chase — list chase email history
  app.get('/api/chase', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;

    const result = await db.query(
      `SELECT ce.*, i.invoice_number, i.total_amount, i.currency, v.name as vendor_name
       FROM chase_emails ce
       JOIN invoices i ON i.id = ce.invoice_id
       LEFT JOIN vendors v ON v.id = ce.vendor_id
       WHERE ce.org_id = $1
       ORDER BY ce.created_at DESC
       LIMIT 50`,
      [org_id]
    );

    return reply.send({ chase_emails: result.rows });
  });
}
