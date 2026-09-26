# ArkFlow

**AI-native accounts payable and receivable automation — from PDF invoice to reconciled ledger in minutes**

## Demo

> Interactive terminal demo — [view the full case study](https://emmanuelzyronis.vercel.app/work/ark-flow)

```text
$ curl -s -X POST http://localhost:3001/api/invoices/extract \
  -F "file=@invoice_acme.pdf" | jq .

Extracting invoice data from PDF ...

{
  "vendor": { "name": "Acme Supplies Ltd", "vat": "NG-VAT-2819203" },
  "invoice_number": "INV-2026-0847",
  "due_date": "2026-10-20",
  "line_items": [
    { "description": "Office chairs × 10",   "total": 850.00  },
    { "description": "27in 4K monitors × 5", "total": 1600.00 },
    { "description": "Installation",          "total": 150.00  }
  ],
  "total": 2990.00,
  "currency": "USD",
  "extraction_confidence": 0.97,
  "extracted_in_ms": 1243
}
```

## Problem

30M+ SMEs using QuickBooks spend 8+ hours per week manually processing invoices, chasing late payments, and reconciling accounts. $3 trillion in global B2B invoices are still processed manually in 2026. Bill.com targets mid-market at $45-80/user/month; Tipalti is enterprise-only. The sub-$50/month AI-native AP/AR tier is completely vacant.

## Solution

Claude AI extracts structured line items, amounts, due dates, vendor details, and currency from uploaded PDF invoices. A deterministic reconciliation engine (12 enforced invariants) matches extracted invoices to payment records. A Next.js dashboard shows outstanding invoices, aging analysis, and auto-drafted payment-chase emails.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Fastify v5 + TypeScript |
| Frontend | Next.js 15 App Router + Tailwind CSS |
| Database | Neon Postgres |
| AI | Claude (Anthropic API) |
| Monorepo | Turborepo + npm workspaces |

## Quick Start

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.local.example apps/web/.env.local
# Edit both files with your credentials

# 3. Initialize database
cd apps/api && node -e "
const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const schema = fs.readFileSync('src/db/schema.sql', 'utf8');
pool.query(schema).then(() => { console.log('Schema created'); pool.end(); });
"

# 4. Start API (port 3001)
cd apps/api && npx tsx src/index.ts

# 5. Start frontend (port 3000)
cd apps/web && npm run dev
```

## Environment Variables

### apps/api/.env
```
DATABASE_URL=postgresql://...neon.tech/arkflow?sslmode=require
JWT_SECRET=your_secret_here
JWT_EXPIRY=7d
ANTHROPIC_API_KEY=your_api_key
PORT=3001
```

### apps/web/.env.local
```
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Features (MVP)

1. **PDF Invoice Upload + AI Extraction** — Claude extracts vendor name, line items, amounts, due date, currency with confidence scores
2. **One-click Confirm** — Save to Neon Postgres ledger with PENDING status
3. **12-Invariant Reconciliation** — Deterministic payment matching with immutable audit trail
4. **AI Payment Chase Emails** — Claude drafts polite/firm/final-notice emails in one click
5. **Invoice Dashboard** — Paginated list with aging buckets, status filters, outstanding totals

## Hackathon

**Build, Ship, Shape: Amazon Developer Hackathon 2026 — AWS Builder Mini Challenge**

URL: https://amazonappdev2026.devpost.com/

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full system diagram, database schema, and API reference.
