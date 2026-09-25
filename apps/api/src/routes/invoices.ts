import type { FastifyInstance } from 'fastify';
import db from '../db/client.js';
import { extractInvoiceFromBase64 } from '../services/ai.service.js';

export default async function invoiceRoutes(app: FastifyInstance) {
  // POST /api/invoices/upload — Upload PDF or image, extract with Claude
  app.post('/api/invoices/upload', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id, sub: user_id } = req.user;
    const body = req.body as {
      file_data: string;
      file_name?: string;
      media_type?: string;
    };

    if (!body.file_data) {
      return reply.status(400).send({ error: 'file_data (base64) is required' });
    }

    const mediaType = (body.media_type ?? 'application/pdf') as
      | 'application/pdf'
      | 'image/jpeg'
      | 'image/png'
      | 'image/webp';

    // Create invoice record in RECEIVED state
    const invoiceResult = await db.query<{ id: string }>(
      `INSERT INTO invoices (org_id, status, raw_pdf_url, raw_pdf_data, currency, total_amount)
       VALUES ($1, 'RECEIVED', $2, $3, 'USD', 0)
       RETURNING id`,
      [org_id, body.file_name ?? 'uploaded-invoice.pdf', body.file_data.substring(0, 100)]
    );
    const invoice_id = invoiceResult.rows[0].id;

    // Log RECEIVED state
    await db.query(
      `INSERT INTO invoice_state_log (invoice_id, to_state, trigger_source, triggered_by)
       VALUES ($1, 'RECEIVED', 'upload', $2)`,
      [invoice_id, user_id]
    );

    // Extract with Claude
    let extracted;
    try {
      extracted = await extractInvoiceFromBase64(body.file_data, mediaType);
    } catch (err) {
      app.log.error({ err }, 'Claude extraction failed');
      return reply.status(422).send({ error: 'Failed to extract invoice data from document' });
    }

    // Find or create vendor
    let vendor_id: string | null = null;
    if (extracted.vendor_name) {
      const vendorCheck = await db.query<{ id: string }>(
        'SELECT id FROM vendors WHERE org_id = $1 AND LOWER(name) = LOWER($2)',
        [org_id, extracted.vendor_name]
      );
      if (vendorCheck.rows.length > 0) {
        vendor_id = vendorCheck.rows[0].id;
      } else {
        const newVendor = await db.query<{ id: string }>(
          `INSERT INTO vendors (org_id, name, preferred_currency)
           VALUES ($1, $2, $3)
           RETURNING id`,
          [org_id, extracted.vendor_name, extracted.currency ?? 'USD']
        );
        vendor_id = newVendor.rows[0].id;
      }
    }

    // Update invoice with extracted data
    await db.query(
      `UPDATE invoices SET
        status = 'EXTRACTED',
        vendor_id = $1,
        invoice_number = $2,
        invoice_date = $3,
        due_date = $4,
        total_amount = $5,
        currency = $6,
        po_number = $7,
        extraction_confidence = $8,
        extracted_at = now(),
        updated_at = now()
       WHERE id = $9`,
      [
        vendor_id,
        extracted.invoice_number ?? null,
        extracted.invoice_date ?? null,
        extracted.due_date ?? null,
        extracted.total_amount ?? 0,
        extracted.currency ?? 'USD',
        extracted.po_number ?? null,
        extracted.confidence,
        invoice_id,
      ]
    );

    // Log EXTRACTED state
    await db.query(
      `INSERT INTO invoice_state_log (invoice_id, from_state, to_state, trigger_source, triggered_by, metadata)
       VALUES ($1, 'RECEIVED', 'EXTRACTED', 'ai_extraction', $2, $3)`,
      [invoice_id, user_id, JSON.stringify({ confidence: extracted.confidence })]
    );

    // Insert line items
    if (extracted.line_items && extracted.line_items.length > 0) {
      for (const item of extracted.line_items) {
        await db.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [invoice_id, item.description, item.quantity ?? null, item.unit_price ?? null, item.total]
        );
      }
    }

    return reply.status(201).send({
      invoice_id,
      extracted,
      vendor_id,
      new_vendor: !vendor_id,
    });
  });

  // GET /api/invoices — paginated list with filters
  app.get('/api/invoices', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const query = req.query as {
      status?: string;
      page?: string;
      limit?: string;
      vendor_id?: string;
    };

    const page = parseInt(query.page ?? '1', 10);
    const limit = Math.min(parseInt(query.limit ?? '20', 10), 100);
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE i.org_id = $1';
    const params: unknown[] = [org_id];
    let paramCount = 1;

    if (query.status && query.status !== 'ALL') {
      paramCount++;
      whereClause += ` AND i.status = $${paramCount}`;
      params.push(query.status);
    }

    if (query.vendor_id) {
      paramCount++;
      whereClause += ` AND i.vendor_id = $${paramCount}`;
      params.push(query.vendor_id);
    }

    const countResult = await db.query<{ count: string }>(
      `SELECT COUNT(*) as count FROM invoices i ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    params.push(limit, offset);
    const result = await db.query(
      `SELECT i.*, v.name as vendor_name,
        CASE
          WHEN i.due_date < CURRENT_DATE AND i.status NOT IN ('PAID', 'ARCHIVED') THEN
            CURRENT_DATE - i.due_date
          ELSE NULL
        END as days_overdue
       FROM invoices i
       LEFT JOIN vendors v ON v.id = i.vendor_id
       ${whereClause}
       ORDER BY i.created_at DESC
       LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`,
      params
    );

    // Summary
    const summaryResult = await db.query(
      `SELECT
        SUM(CASE WHEN status NOT IN ('PAID', 'ARCHIVED') THEN total_amount ELSE 0 END) as total_outstanding,
        SUM(CASE WHEN status IN ('OVERDUE', 'CHASED') THEN total_amount ELSE 0 END) as total_overdue
       FROM invoices
       WHERE org_id = $1`,
      [org_id]
    );

    return reply.send({
      invoices: result.rows,
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
      summary: summaryResult.rows[0],
    });
  });

  // GET /api/invoices/:id
  app.get('/api/invoices/:id', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const { id } = req.params as { id: string };

    const result = await db.query(
      `SELECT i.*, v.name as vendor_name, v.email as vendor_email
       FROM invoices i
       LEFT JOIN vendors v ON v.id = i.vendor_id
       WHERE i.id = $1 AND i.org_id = $2`,
      [id, org_id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    const invoice = result.rows[0];

    // Get line items
    const lineItems = await db.query(
      'SELECT * FROM invoice_line_items WHERE invoice_id = $1 ORDER BY created_at',
      [id]
    );

    // Get state log
    const stateLog = await db.query(
      `SELECT isl.*, u.name as user_name, u.email as user_email
       FROM invoice_state_log isl
       LEFT JOIN users u ON u.id = isl.triggered_by
       WHERE isl.invoice_id = $1
       ORDER BY isl.created_at ASC`,
      [id]
    );

    return reply.send({
      ...invoice,
      line_items: lineItems.rows,
      state_log: stateLog.rows,
    });
  });

  // PATCH /api/invoices/:id/confirm — confirm extracted data, set PENDING
  app.patch('/api/invoices/:id/confirm', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id, sub: user_id } = req.user;
    const { id } = req.params as { id: string };
    const body = req.body as {
      vendor_name?: string;
      invoice_number?: string;
      invoice_date?: string;
      due_date?: string;
      total_amount?: number;
      currency?: string;
      po_number?: string;
      line_items?: Array<{
        description: string;
        quantity?: number;
        unit_price?: number;
        total: number;
      }>;
    };

    const invoiceCheck = await db.query<{ id: string; status: string; vendor_id: string }>(
      'SELECT id, status, vendor_id FROM invoices WHERE id = $1 AND org_id = $2',
      [id, org_id]
    );

    if (invoiceCheck.rows.length === 0) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    const invoice = invoiceCheck.rows[0];
    const oldStatus = invoice.status;

    // Find or create vendor if name provided
    let vendor_id = invoice.vendor_id;
    if (body.vendor_name) {
      const vendorCheck = await db.query<{ id: string }>(
        'SELECT id FROM vendors WHERE org_id = $1 AND LOWER(name) = LOWER($2)',
        [org_id, body.vendor_name]
      );
      if (vendorCheck.rows.length > 0) {
        vendor_id = vendorCheck.rows[0].id;
      } else {
        const newVendor = await db.query<{ id: string }>(
          'INSERT INTO vendors (org_id, name) VALUES ($1, $2) RETURNING id',
          [org_id, body.vendor_name]
        );
        vendor_id = newVendor.rows[0].id;
      }
    }

    await db.query(
      `UPDATE invoices SET
        status = 'PENDING',
        vendor_id = COALESCE($1, vendor_id),
        invoice_number = COALESCE($2, invoice_number),
        invoice_date = COALESCE($3, invoice_date),
        due_date = COALESCE($4, due_date),
        total_amount = COALESCE($5, total_amount),
        currency = COALESCE($6, currency),
        po_number = COALESCE($7, po_number),
        confirmed_at = now(),
        confirmed_by = $8,
        updated_at = now()
       WHERE id = $9`,
      [
        vendor_id,
        body.invoice_number ?? null,
        body.invoice_date ?? null,
        body.due_date ?? null,
        body.total_amount ?? null,
        body.currency ?? null,
        body.po_number ?? null,
        user_id,
        id,
      ]
    );

    // Update line items if provided
    if (body.line_items && body.line_items.length > 0) {
      await db.query('DELETE FROM invoice_line_items WHERE invoice_id = $1', [id]);
      for (const item of body.line_items) {
        await db.query(
          `INSERT INTO invoice_line_items (invoice_id, description, quantity, unit_price, total)
           VALUES ($1, $2, $3, $4, $5)`,
          [id, item.description, item.quantity ?? null, item.unit_price ?? null, item.total]
        );
      }
    }

    // Log state transition
    await db.query(
      `INSERT INTO invoice_state_log (invoice_id, from_state, to_state, trigger_source, triggered_by)
       VALUES ($1, $2, 'PENDING', 'user_confirm', $3)`,
      [id, oldStatus, user_id]
    );

    // Update vendor stats
    if (vendor_id) {
      await db.query(
        `UPDATE vendors SET
          invoice_count = invoice_count + 1,
          total_invoiced = total_invoiced + COALESCE($1, 0),
          updated_at = now()
         WHERE id = $2`,
        [body.total_amount, vendor_id]
      );
    }

    return reply.send({ success: true, invoice_id: id, status: 'PENDING' });
  });

  // GET /api/invoices/:id/audit
  app.get('/api/invoices/:id/audit', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;
    const { id } = req.params as { id: string };

    const invoiceCheck = await db.query(
      'SELECT id FROM invoices WHERE id = $1 AND org_id = $2',
      [id, org_id]
    );
    if (invoiceCheck.rows.length === 0) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    const result = await db.query(
      `SELECT isl.*, u.name as user_name, u.email as user_email
       FROM invoice_state_log isl
       LEFT JOIN users u ON u.id = isl.triggered_by
       WHERE isl.invoice_id = $1
       ORDER BY isl.created_at ASC`,
      [id]
    );

    return reply.send({ audit_trail: result.rows });
  });

  // PATCH /api/invoices/:id/status — manual status override
  app.patch('/api/invoices/:id/status', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id, sub: user_id } = req.user;
    const { id } = req.params as { id: string };
    const { status, reason } = req.body as { status: string; reason?: string };

    const VALID_STATUSES = ['RECEIVED', 'EXTRACTED', 'PENDING', 'MATCHED', 'OVERDUE', 'CHASED', 'PAID', 'ARCHIVED'];
    if (!VALID_STATUSES.includes(status)) {
      return reply.status(400).send({ error: 'Invalid status' });
    }

    const result = await db.query<{ status: string }>(
      'UPDATE invoices SET status = $1, updated_at = now() WHERE id = $2 AND org_id = $3 RETURNING status',
      [status, id, org_id]
    );

    if (result.rows.length === 0) {
      return reply.status(404).send({ error: 'Invoice not found' });
    }

    await db.query(
      `INSERT INTO invoice_state_log (invoice_id, to_state, trigger_source, triggered_by, metadata)
       VALUES ($1, $2, 'manual_override', $3, $4)`,
      [id, status, user_id, JSON.stringify({ reason })]
    );

    return reply.send({ success: true, status });
  });

  // GET /api/dashboard/summary
  app.get('/api/dashboard/summary', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;

    const result = await db.query(
      `SELECT
        SUM(CASE WHEN status NOT IN ('PAID', 'ARCHIVED') THEN total_amount ELSE 0 END) as total_outstanding,
        SUM(CASE WHEN status IN ('OVERDUE', 'CHASED') THEN total_amount ELSE 0 END) as total_overdue,
        SUM(CASE WHEN status = 'PAID' AND confirmed_at >= date_trunc('month', CURRENT_DATE) THEN total_amount ELSE 0 END) as collected_this_month,
        COUNT(CASE WHEN created_at >= date_trunc('month', CURRENT_DATE) THEN 1 END) as invoices_this_month,
        COUNT(CASE WHEN status = 'PENDING' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status IN ('OVERDUE', 'CHASED') THEN 1 END) as overdue_count
       FROM invoices
       WHERE org_id = $1`,
      [org_id]
    );

    return reply.send(result.rows[0]);
  });

  // GET /api/dashboard/aging
  app.get('/api/dashboard/aging', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;

    const result = await db.query(
      `SELECT
        SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 0 AND 30 AND status NOT IN ('PAID','ARCHIVED') THEN total_amount ELSE 0 END) as total_0_30,
        COUNT(CASE WHEN CURRENT_DATE - due_date BETWEEN 0 AND 30 AND status NOT IN ('PAID','ARCHIVED') THEN 1 END) as count_0_30,
        SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 AND status NOT IN ('PAID','ARCHIVED') THEN total_amount ELSE 0 END) as total_31_60,
        COUNT(CASE WHEN CURRENT_DATE - due_date BETWEEN 31 AND 60 AND status NOT IN ('PAID','ARCHIVED') THEN 1 END) as count_31_60,
        SUM(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 AND status NOT IN ('PAID','ARCHIVED') THEN total_amount ELSE 0 END) as total_61_90,
        COUNT(CASE WHEN CURRENT_DATE - due_date BETWEEN 61 AND 90 AND status NOT IN ('PAID','ARCHIVED') THEN 1 END) as count_61_90,
        SUM(CASE WHEN CURRENT_DATE - due_date > 90 AND status NOT IN ('PAID','ARCHIVED') THEN total_amount ELSE 0 END) as total_over_90,
        COUNT(CASE WHEN CURRENT_DATE - due_date > 90 AND status NOT IN ('PAID','ARCHIVED') THEN 1 END) as count_over_90
       FROM invoices
       WHERE org_id = $1 AND due_date IS NOT NULL`,
      [org_id]
    );

    return reply.send(result.rows[0]);
  });

  // GET /api/dashboard/activity
  app.get('/api/dashboard/activity', { preHandler: [app.authenticate] }, async (req, reply) => {
    const { org_id } = req.user;

    const result = await db.query(
      `SELECT isl.*, i.invoice_number, i.total_amount, i.currency, v.name as vendor_name
       FROM invoice_state_log isl
       JOIN invoices i ON i.id = isl.invoice_id
       LEFT JOIN vendors v ON v.id = i.vendor_id
       WHERE i.org_id = $1
       ORDER BY isl.created_at DESC
       LIMIT 20`,
      [org_id]
    );

    return reply.send({ activity: result.rows });
  });
}
