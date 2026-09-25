-- ArkFlow Database Schema
-- Run once to initialize the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL,
  plan varchar(50) NOT NULL DEFAULT 'starter',
  stripe_customer_id varchar(255),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email varchar(255) UNIQUE NOT NULL,
  name varchar(255) NOT NULL DEFAULT '',
  password_hash varchar(255) NOT NULL,
  role varchar(50) NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Vendors
CREATE TABLE IF NOT EXISTS vendors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name varchar(255) NOT NULL,
  email varchar(255),
  phone varchar(50),
  address text,
  payment_method varchar(50),
  preferred_currency varchar(3) DEFAULT 'USD',
  avg_days_to_pay numeric(6,2),
  total_invoiced numeric(15,2) DEFAULT 0,
  invoice_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  vendor_id uuid REFERENCES vendors(id),
  status varchar(50) NOT NULL DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED','EXTRACTED','PENDING','MATCHED','OVERDUE','CHASED','PAID','ARCHIVED')),
  invoice_number varchar(100),
  po_number varchar(100),
  total_amount numeric(15,2) NOT NULL DEFAULT 0,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  fx_rate_at_creation numeric(20,8),
  due_date date,
  invoice_date date,
  raw_pdf_url text NOT NULL DEFAULT '',
  raw_pdf_data text,
  extraction_confidence numeric(3,2),
  extracted_at timestamptz,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz
);

-- Invoice line items
CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity numeric(10,3),
  unit_price numeric(15,4),
  total numeric(15,2) NOT NULL DEFAULT 0,
  tax_rate numeric(5,4),
  tax_amount numeric(15,2),
  confidence_score numeric(3,2),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Bank transactions
CREATE TABLE IF NOT EXISTS bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  external_id varchar(255) NOT NULL,
  amount numeric(15,2) NOT NULL,
  currency varchar(3) NOT NULL,
  transaction_date date NOT NULL,
  description text,
  counterparty varchar(255),
  reference varchar(255),
  matched boolean NOT NULL DEFAULT false,
  invoice_id uuid REFERENCES invoices(id),
  UNIQUE(org_id, external_id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  vendor_id uuid REFERENCES vendors(id),
  amount numeric(15,2) NOT NULL,
  currency varchar(3) NOT NULL,
  payment_date date NOT NULL,
  reference varchar(255),
  source varchar(50) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual','bank_webhook','reconciliation')),
  bank_transaction_id uuid REFERENCES bank_transactions(id),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Reconciliation audit
CREATE TABLE IF NOT EXISTS reconciliation_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  payment_id uuid NOT NULL REFERENCES payments(id),
  matched_at timestamptz NOT NULL DEFAULT now(),
  match_logic jsonb NOT NULL DEFAULT '{}',
  invariants_passed jsonb NOT NULL DEFAULT '{}',
  invariants_count integer NOT NULL DEFAULT 12,
  user_id uuid REFERENCES users(id),
  trigger_source varchar(50) NOT NULL DEFAULT 'manual',
  old_status varchar(50) NOT NULL,
  new_status varchar(50) NOT NULL
);

-- Invoice state log (immutable audit trail)
CREATE TABLE IF NOT EXISTS invoice_state_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  from_state varchar(50),
  to_state varchar(50) NOT NULL,
  triggered_by uuid REFERENCES users(id),
  trigger_source varchar(50) NOT NULL DEFAULT 'user',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Chase emails
CREATE TABLE IF NOT EXISTS chase_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  invoice_id uuid NOT NULL REFERENCES invoices(id),
  vendor_id uuid REFERENCES vendors(id),
  tone varchar(50) NOT NULL CHECK (tone IN ('polite','firm','final')),
  subject text NOT NULL,
  body text NOT NULL,
  recipient_email varchar(255) NOT NULL,
  days_overdue integer NOT NULL,
  sent_at timestamptz,
  opened_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- FX rates
CREATE TABLE IF NOT EXISTS fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency varchar(3) NOT NULL,
  to_currency varchar(3) NOT NULL,
  rate numeric(20,8) NOT NULL,
  source varchar(50) NOT NULL DEFAULT 'ecb',
  stamped_at timestamptz NOT NULL,
  UNIQUE(from_currency, to_currency, stamped_at)
);

-- Recurring templates
CREATE TABLE IF NOT EXISTS recurring_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES organizations(id),
  vendor_id uuid NOT NULL REFERENCES vendors(id),
  name varchar(255) NOT NULL,
  line_items jsonb NOT NULL DEFAULT '[]',
  amount numeric(15,2) NOT NULL,
  currency varchar(3) NOT NULL DEFAULT 'USD',
  frequency varchar(50) NOT NULL CHECK (frequency IN ('weekly','biweekly','monthly','quarterly','annually')),
  next_generation_date date,
  active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_org_id ON invoices(org_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_vendor_id ON invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoice_state_log_invoice_id ON invoice_state_log(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_vendors_org_id ON vendors(org_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_org_id ON bank_transactions(org_id);
CREATE INDEX IF NOT EXISTS idx_bank_transactions_matched ON bank_transactions(matched);
