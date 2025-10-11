// src/types/invoice.ts
export interface InvoiceLineItem {
  id: string;
  description: string;
  hsn_code?: string;
  sac_code?: string;
  quantity: number;
  unit_amount: number; // Amount in paise
  amount: number; // Total amount in paise
  currency: string;
}

export interface InvoiceCustomerDetails {
  customer_name: string;
  customer_email: string;
  customer_contact: string;
  customer_gstin?: string;
}

export interface InvoiceBusinessDetails {
  name: string;
  gstin: string;
  address: string;
  email: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  issued_at: number; // Unix timestamp
  expire_by?: number; // Unix timestamp
  amount: number; // Total amount in paise
  amount_paid: number; // Amount paid in paise
  amount_due: number; // Amount due in paise
  gross_amount: number; // Gross amount in paise
  tax_amount: number; // Tax amount in paise
  currency: string;
  status: 'issued' | 'paid' | 'partially_paid' | 'cancelled' | 'expired';
  line_items: InvoiceLineItem[];
  customer_details: InvoiceCustomerDetails;
  business_details: InvoiceBusinessDetails;
}

// DataGrid row interface
export interface InvoiceGridRow {
  id: string;
  orderId: string;
  invoiceNumber: string;
  date: Date;
  customerName: string;
  customerEmail: string;
  customerType: 'B2B' | 'B2C';
  credits: number;
  baseAmount: number;
  gstAmount: number;
  totalAmount: number;
  taxType: 'IGST' | 'CGST+SGST';
  status: string;
  invoiceEligible: boolean;
  gstCompliant: boolean;
  packageName: string;
}

// Utility type for download actions
export interface DownloadAction {
  type: 'invoice' | 'receipt';
  orderId: string;
  filename: string;
}

// Bulk download options
export interface BulkDownloadOptions {
  format: 'pdf' | 'zip';
  dateRange?: {
    from: Date;
    to: Date;
  };
  customerType?: 'B2B' | 'B2C' | 'all';
  onlyInvoiceEligible?: boolean;
}