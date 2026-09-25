// Shared TypeScript types for ArkFlow

export type InvoiceStatus =
  | 'RECEIVED'
  | 'EXTRACTED'
  | 'PENDING'
  | 'MATCHED'
  | 'OVERDUE'
  | 'CHASED'
  | 'PAID'
  | 'ARCHIVED';

export type ChaseTone = 'polite' | 'firm' | 'final';

export interface Organization {
  id: string;
  name: string;
  plan: string;
  created_at: string;
}

export interface User {
  id: string;
  org_id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export interface Vendor {
  id: string;
  org_id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  payment_method?: string;
  preferred_currency: string;
  avg_days_to_pay?: number;
  total_invoiced: number;
  invoice_count: number;
  created_at: string;
}

export interface InvoiceLineItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity?: number;
  unit_price?: number;
  total: number;
  tax_rate?: number;
  tax_amount?: number;
  confidence_score?: number;
}

export interface Invoice {
  id: string;
  org_id: string;
  vendor_id?: string;
  vendor_name?: string;
  status: InvoiceStatus;
  invoice_number?: string;
  po_number?: string;
  total_amount: number;
  currency: string;
  fx_rate_at_creation?: number;
  due_date?: string;
  invoice_date?: string;
  raw_pdf_url: string;
  extraction_confidence?: number;
  extracted_at?: string;
  confirmed_at?: string;
  created_at: string;
  line_items?: InvoiceLineItem[];
}

export interface Payment {
  id: string;
  org_id: string;
  invoice_id: string;
  vendor_id?: string;
  amount: number;
  currency: string;
  payment_date: string;
  reference?: string;
  source: 'manual' | 'bank_webhook' | 'reconciliation';
  created_at: string;
}

export interface BankTransaction {
  id: string;
  org_id: string;
  external_id: string;
  amount: number;
  currency: string;
  transaction_date: string;
  description?: string;
  counterparty?: string;
  reference?: string;
  matched: boolean;
  invoice_id?: string;
  created_at: string;
}

export interface ReconciliationAudit {
  id: string;
  invoice_id: string;
  payment_id: string;
  matched_at: string;
  match_logic: Record<string, unknown>;
  invariants_passed: Record<string, boolean>;
  invariants_count: number;
  trigger_source: string;
  old_status: string;
  new_status: string;
}

export interface InvoiceStateLog {
  id: string;
  invoice_id: string;
  from_state?: string;
  to_state: string;
  trigger_source: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChaseEmail {
  id: string;
  invoice_id: string;
  tone: ChaseTone;
  subject: string;
  body: string;
  recipient_email: string;
  days_overdue: number;
  sent_at?: string;
  created_at: string;
}

export interface DashboardSummary {
  total_outstanding: number;
  total_overdue: number;
  collected_this_month: number;
  invoices_this_month: number;
  pending_count: number;
  overdue_count: number;
}

export interface AgingBuckets {
  bucket_0_30: { count: number; total: number };
  bucket_31_60: { count: number; total: number };
  bucket_61_90: { count: number; total: number };
  bucket_over_90: { count: number; total: number };
}

export interface ExtractionResult {
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
  confidence: number;
  field_confidence: Record<string, number>;
}
