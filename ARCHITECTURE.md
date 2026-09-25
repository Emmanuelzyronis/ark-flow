# ArkFlow Architecture

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        ArkFlow System                           │
│                                                                 │
│  ┌──────────────────┐         ┌──────────────────────────────┐  │
│  │   Next.js 15     │ ──API── │   Fastify v5 API             │  │
│  │   App Router     │         │   :3001                      │  │
│  │   :3000          │         │                              │  │
│  │                  │         │  ┌──────────────────────┐    │  │
│  │  /               │         │  │ Routes               │    │  │
│  │  /auth/*         │         │  │ /api/auth/*          │    │  │
│  │  /app/dashboard  │         │  │ /api/invoices/*      │    │  │
│  │  /app/invoices/* │         │  │ /api/reconcile/*     │    │  │
│  │  /app/reconcile  │         │  │ /api/chase/*         │    │  │
│  │  /app/vendors/*  │         │  │ /api/vendors/*       │    │  │
│  └──────────────────┘         │  │ /api/dashboard/*     │    │  │
│                               │  └──────────────────────┘    │  │
│                               │                              │  │
│                               │  ┌──────────────────────┐    │  │
│                               │  │ Services             │    │  │
│                               │  │ ai.service.ts        │    │  │
│                               │  │  - extractInvoice()  │    │  │
│                               │  │  - draftChaseEmail() │    │  │
│                               │  └──────────────────────┘    │  │
│                               └──────────┬───────────────────┘  │
│                                          │                       │
│              ┌───────────────────────────┼──────────────┐        │
│              │                           │              │        │
│              ▼                           ▼              ▼        │
│  ┌───────────────────┐  ┌───────────────────┐  ┌──────────────┐ │
│  │  Neon Postgres    │  │  Anthropic Claude  │  │  JWT Auth    │ │
│  │  (arkflow DB)     │  │  API               │  │  (bcrypt)    │ │
│  │                   │  │                    │  └──────────────┘ │
│  │  13 tables        │  │  - Invoice extract │                   │
│  │  audit trail      │  │  - Chase email     │                   │
│  └───────────────────┘  └───────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

## AP/AR Workflow State Machine

```
RECEIVED → EXTRACTED → PENDING → OVERDUE → CHASED → PAID
                    ↘                              ↗
                     MATCHED ────────────────────
                                                 ↘
                                              ARCHIVED
```

## Database Schema

### organizations
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| name | varchar(255) | |
| plan | varchar(50) | DEFAULT 'starter' |
| created_at | timestamptz | |

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK | → organizations |
| email | varchar(255) | UNIQUE |
| name | varchar(255) | |
| password_hash | varchar(255) | bcrypt |
| role | varchar(50) | admin/member |

### vendors
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK | |
| name | varchar(255) | |
| email | varchar(255) | |
| avg_days_to_pay | numeric | computed |
| total_invoiced | numeric | running total |
| invoice_count | integer | |

### invoices
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| org_id | uuid FK | |
| vendor_id | uuid FK | |
| status | varchar(50) | CHECK constraint |
| total_amount | numeric(15,2) | |
| currency | varchar(3) | ISO 4217 |
| due_date | date | |
| extraction_confidence | numeric(3,2) | 0.00-1.00 |
| raw_pdf_url | text | |

### invoice_line_items
Extracted line items per invoice with confidence scores.

### payments
| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| invoice_id | uuid FK | |
| amount | numeric(15,2) | |
| source | varchar(50) | manual/bank_webhook/reconciliation |

### reconciliation_audit
Immutable record of every match: match_logic JSONB + all 12 invariant results.

### invoice_state_log
Append-only audit trail: every state transition with timestamp, user, trigger source.

### chase_emails
Sent chase emails with tone, subject, body, sent_at, opened_at.

### bank_transactions
Open banking webhook data with matched status.

### fx_rates
FX rate history stamped at invoice creation time.

### recurring_templates
Recurring invoice schedule with frequency and next_generation_date.

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Create org + user |
| POST | /api/auth/login | Authenticate |
| GET | /api/auth/me | Current user |

### Invoices
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/invoices/upload | Upload + Claude extraction |
| GET | /api/invoices | Paginated list with filters |
| GET | /api/invoices/:id | Invoice detail |
| PATCH | /api/invoices/:id/confirm | Confirm extracted data |
| PATCH | /api/invoices/:id/status | Manual status override |
| GET | /api/invoices/:id/audit | Full audit trail |

### Dashboard
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/dashboard/summary | KPI tiles |
| GET | /api/dashboard/aging | 30/60/90/90+ buckets |
| GET | /api/dashboard/activity | Recent state transitions |

### Reconciliation
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/reconcile/manual | Record + auto-match payment |
| POST | /api/reconcile/match | Match bank tx to invoice |
| GET | /api/reconcile/unmatched | Unmatched transactions + open invoices |

### Chase
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/chase/draft | Claude-draft chase email |
| POST | /api/chase/send | Save + send chase email |
| GET | /api/chase | Chase email history |

### Vendors
| Method | Path | Description |
|--------|------|-------------|
| GET | /api/vendors | Vendor directory |
| POST | /api/vendors | Create vendor |
| GET | /api/vendors/:id | Vendor profile |
| PATCH | /api/vendors/:id | Update vendor |
| GET | /api/vendors/:id/invoices | Vendor invoice history |

## Frontend Route Map

| Route | Description |
|-------|-------------|
| / | Marketing landing page |
| /auth/login | Sign in |
| /auth/register | Sign up |
| /app/dashboard | AP/AR command center |
| /app/invoices | Invoice list with filters |
| /app/invoices/upload | Upload + AI extraction |
| /app/invoices/:id | Invoice detail + review form |
| /app/invoices/:id/chase | Chase email composer |
| /app/reconcile | Reconciliation workspace |
| /app/vendors | Vendor directory |
| /app/vendors/:id | Vendor profile |

## 12 Reconciliation Invariants

1. Amount within 2% of invoice total
2. Vendor name linked to invoice
3. Currency match
4. Invoice status is payable (PENDING/OVERDUE/CHASED)
5. Payment amount is positive
6. No existing payment on invoice
7. Invoice is not archived
8. Organization boundary check (same org)
9. Currency code is valid ISO format
10. Due date proximity (informational)
11. Single match (no duplicate payment)
12. Audit trail is writable
