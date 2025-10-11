// hooks/useInvoicePreview.ts - Unified Invoice Preview Hook
import { useState, useCallback } from 'react';
import { useInvoiceDetails } from '@/hooks/useInvoices';

/**
 * Unified hook for invoice preview functionality
 * Used by both Billing component and CustomInvoiceTable
 */
export function useInvoicePreview() {
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Fetch invoice details when an invoice is selected
  const { 
    invoice, 
    isLoading, 
    error 
  } = useInvoiceDetails(selectedInvoiceId || '');

  // Open preview with specific invoice ID
  const openPreview = useCallback((invoiceId: string) => {
    setSelectedInvoiceId(invoiceId);
    setPreviewOpen(true);
  }, []);

  // Close preview and reset state
  const closePreview = useCallback(() => {
    setPreviewOpen(false);
    setSelectedInvoiceId(null);
  }, []);

  return {
    // Invoice data
    invoice,
    selectedInvoiceId,
    
    // UI state
    previewOpen,
    loading: isLoading,
    error,
    
    // Actions
    openPreview,
    closePreview,
    
    // Utility
    isInvoiceSelected: Boolean(selectedInvoiceId),
  };
}