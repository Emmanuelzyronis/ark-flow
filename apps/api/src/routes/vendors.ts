import type { FastifyInstance } from 'fastify';
import db from '../db/client.js';

export default async function vendorRoutes(app: FastifyInstance) {
  // GET /api/vendors
  app.get('/api/vendors', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;

    const result = await db.query(
      `SELECT v.*,
        SUM(CASE WHEN i.status NOT IN ('PAID','ARCHIVED') THEN i.total_amount ELSE 0 END) as outstanding_total,
        MAX(i.created_at) as last_invoice_date
       FROM vendors v
       LEFT JOIN invoices i ON i.vendor_id = v.id
       WHERE v.org_id = $1
       GROUP BY v.id
       ORDER BY outstanding_total DESC NULLS LAST`,
      [org_id]
    );

    return reply.send({ vendors: result.rows });
  });

  // POST /api/vendors
  app.post('/api/vendors', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const body = req.body as {
      name: string;
      email?: string;
      phone?: string;
      address?: string;
      payment_method?: string;
      preferred_currency?: string;
    };

    if (!body.name) {
      return reply.status(400).send({ error: 'Vendor name is required' });
    }

    const result = await db.query<{ id: string }>(
      `INSERT INTO vendors (org_id, name, email, phone, address, payment_method, preferred_currency)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [org_id, body.name, body.email ?? null, body.phone ?? null, body.address ?? null,
       body.payment_method ?? null, body.preferred_currency ?? 'USD']
    );

    return reply.status(201).send(result.rows[0]);
  });

  // GET /api/vendors/:id
  app.get('/api/vendors/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const { id } = req.params as { id: string };

    const result = await db.query(
      'SELECT * FROM vendors WHERE id = $1 AND org_id = $2',
      [id, org_id]
    );
    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }

    // Get payment timing history
    const history = await db.query(
      `SELECT i.invoice_number, i.invoice_date, i.due_date, i.total_amount, i.currency, p.payment_date,
        EXTRACT(EPOCH FROM (p.payment_date::timestamptz - i.due_date::timestamptz))/(60*60*24) as days_to_pay
       FROM invoices i
       JOIN payments p ON p.invoice_id = i.id
       WHERE i.vendor_id = $1
       ORDER BY i.invoice_date DESC
       LIMIT 12`,
      [id]
    );

    return reply.send({
      ...result.rows[0],
      payment_history: history.rows,
    });
  });

  // PATCH /api/vendors/:id
  app.patch('/api/vendors/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const { id } = req.params as { id: string };
    const body = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      address?: string;
      payment_method?: string;
      preferred_currency?: string;
    };

    const result = await db.query(
      `UPDATE vendors SET
        name = COALESCE($1, name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        payment_method = COALESCE($5, payment_method),
        preferred_currency = COALESCE($6, preferred_currency),
        updated_at = now()
       WHERE id = $7 AND org_id = $8
       RETURNING *`,
      [body.name, body.email, body.phone, body.address, body.payment_method,
       body.preferred_currency, id, org_id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Vendor not found' });
    }

    return reply.send(result.rows[0]);
  });

  // GET /api/vendors/:id/invoices
  app.get('/api/vendors/:id/invoices', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const { id } = req.params as { id: string };
    const query = req.query as { page?: string; limit?: string };

    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    const offset = (page - 1) * limit;

    const result = await db.query(
      `SELECT i.*,
        CASE WHEN i.due_date < CURRENT_DATE AND i.status NOT IN ('PAID','ARCHIVED')
          THEN CURRENT_DATE - i.due_date ELSE NULL END as days_overdue
       FROM invoices i
       WHERE i.vendor_id = $1 AND i.org_id = $2
       ORDER BY i.created_at DESC
       LIMIT $3 OFFSET $4`,
      [id, org_id, limit, offset]
    );

    return reply.send({ invoices: result.rows });
  });
}
