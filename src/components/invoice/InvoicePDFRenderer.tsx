// src/components/invoice/InvoicePDFRenderer.tsx
"use client";

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import type { Invoice } from "@/services/invoiceService";
import { COMPANY_DETAILS } from "@/config/details";

// PDF Color Palette - matching print mode
const PDF_COLORS = {
  black: "#000000",
  white: "#FFFFFF",
  lightGray: "#F5F5F5",
  mediumGray: "#6B7280",
  darkGray: "#374151",
  borderGray: "#E5E7EB",
  success: "#10B981",
  warning: "#F59E0B",
} as const;

// PDF Styles - matching ModernInvoicePreview layout exactly
const styles = StyleSheet.create({
  page: {
    backgroundColor: PDF_COLORS.white,
    fontFamily: "Helvetica",
    fontSize: 10,
  },

  // Header Section (matching your preview header)
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderGray,
    borderBottomStyle: "solid",
    backgroundColor: PDF_COLORS.white,
  },
  headerLeft: {
    width: 60,
    height: 60,
    backgroundColor: PDF_COLORS.lightGray,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  qrPlaceholder: {
    fontSize: 8,
    color: PDF_COLORS.mediumGray,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  companyName: {
    fontSize: 16,
    fontWeight: "bold",
    color: PDF_COLORS.black,
    marginBottom: 2,
  },
  companyTagline: {
    fontSize: 8,
    color: PDF_COLORS.mediumGray,
  },

  // Main Content Layout (32% sidebar + 68% content)
  contentWrapper: {
    flexDirection: "row",
    height: "100%",
  },

  // Left Sidebar - 32% width (matching your layout)
  sidebar: {
    width: "32%",
    backgroundColor: PDF_COLORS.lightGray,
    padding: 24,
    flexDirection: "column",
  },
  sidebarSection: {
    marginBottom: 20,
  },
  sidebarSectionWithBorder: {
    marginBottom: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: PDF_COLORS.borderGray,
    borderTopStyle: "solid",
  },
  sidebarLabel: {
    fontSize: 7,
    color: PDF_COLORS.mediumGray,
    fontWeight: "bold",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  sidebarValue: {
    fontSize: 9,
    color: PDF_COLORS.black,
    fontWeight: 500,
    marginBottom: 12,
  },
  sidebarTitle: {
    fontSize: 7,
    color: PDF_COLORS.mediumGray,
    fontWeight: "bold",
    marginBottom: 12,
    textTransform: "uppercase",
  },
  customerName: {
    fontSize: 10,
    fontWeight: "bold",
    color: PDF_COLORS.black,
    marginBottom: 4,
  },
  customerDetail: {
    fontSize: 8,
    color: PDF_COLORS.mediumGray,
    marginBottom: 4,
  },
  gstBadge: {
    backgroundColor: PDF_COLORS.success,
    color: PDF_COLORS.white,
    padding: "4 8",
    borderRadius: 2,
    fontSize: 7,
    fontWeight: "bold",
    marginTop: 8,
    marginBottom: 8,
    alignSelf: "flex-start",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  paymentMethodText: {
    fontSize: 8,
    color: PDF_COLORS.black,
    fontWeight: 500,
    marginLeft: 4,
  },
  paymentDetailText: {
    fontSize: 7,
    color: PDF_COLORS.mediumGray,
    marginLeft: 16,
    marginBottom: 4,
  },
  statusBadge: {
    padding: "4 8",
    borderRadius: 2,
    fontSize: 7,
    fontWeight: "bold",
    color: PDF_COLORS.white,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 8,
    color: PDF_COLORS.mediumGray,
    marginLeft: 4,
  },

  // Right Content Area - 68% width (matching your layout)
  mainContent: {
    flex: 1,
    padding: 24,
    backgroundColor: PDF_COLORS.white,
    flexDirection: "column",
  },

  // Invoice Title Section
  titleSection: {
    marginBottom: 24,
  },
  invoiceTitle: {
    fontSize: 36,
    fontWeight: "bold",
    color: PDF_COLORS.black,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  invoiceSubtitle: {
    fontSize: 9,
    color: PDF_COLORS.mediumGray,
  },

  // Account Info Grid
  infoGrid: {
    flexDirection: "row",
    gap: 24,
    marginBottom: 24,
  },
  infoColumn: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 7,
    color: PDF_COLORS.mediumGray,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 9,
    color: PDF_COLORS.black,
    fontWeight: "bold",
    marginBottom: 12,
  },

  // Table Section
  table: {
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: PDF_COLORS.lightGray,
    padding: "12 12",
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "12 12",
    borderBottomWidth: 1,
    borderBottomColor: PDF_COLORS.borderGray,
    borderBottomStyle: "solid",
    borderLeftWidth: 1,
    borderLeftColor: PDF_COLORS.borderGray,
    borderLeftStyle: "solid",
    borderRightWidth: 1,
    borderRightColor: PDF_COLORS.borderGray,
    borderRightStyle: "solid",
  },
  tableColDescription: {
    width: "40%",
  },
  tableColHSN: {
    width: "20%",
    textAlign: "center",
  },
  tableColCredits: {
    width: "20%",
    textAlign: "center",
  },
  tableColAmount: {
    width: "20%",
    textAlign: "right",
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: PDF_COLORS.black,
  },
  tableCellTitle: {
    fontSize: 9,
    fontWeight: 500,
    color: PDF_COLORS.black,
    marginBottom: 2,
  },
  tableCellSubtext: {
    fontSize: 7,
    color: PDF_COLORS.mediumGray,
  },
  tableCellText: {
    fontSize: 9,
    color: PDF_COLORS.mediumGray,
  },
  tableCellAmount: {
    fontSize: 9,
    fontWeight: "bold",
    color: PDF_COLORS.black,
  },

  // Totals Section
  totalsSection: {
    marginTop: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  totalLabel: {
    fontSize: 9,
    color: PDF_COLORS.mediumGray,
    fontWeight: 500,
  },
  totalValue: {
    fontSize: 9,
    color: PDF_COLORS.black,
    fontWeight: "bold",
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: PDF_COLORS.black,
    borderTopStyle: "solid",
  },
  grandTotalLabel: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.black,
  },
  grandTotalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: PDF_COLORS.black,
  },
});

// Utility Functions
const formatAmount = (amount: number, currency: string = "INR"): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currency,
  }).format(amount);
};

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const getPaymentMethodDisplay = (invoice: Invoice): string => {
  if (!invoice.payment) return "Payment";

  const payment = invoice.payment;
  switch (payment.method_type) {
    case "card":
      if (payment.card) {
        return `${payment.card.network} •••• ${payment.card.last4}`;
      }
      return "Card Payment";
    case "upi":
      if (payment.upi) {
        const domain = payment.upi.vpa.split("@")[1];
        const providerMap: Record<string, string> = {
          ybl: "PhonePe",
          paytm: "Paytm",
          okaxis: "Google Pay",
          okicici: "Google Pay",
          okhdfcbank: "Google Pay",
          oksbi: "Google Pay",
          amazonpay: "Amazon Pay",
        };
        const provider = providerMap[domain] || domain.toUpperCase();
        return `UPI (${provider})`;
      }
      return "UPI Payment";
    case "netbanking":
      if (payment.netbanking) {
        return `${payment.netbanking.bank_name} NetBanking`;
      }
      return "Net Banking";
    case "wallet":
      if (payment.wallet) {
        return `${payment.wallet.wallet_name} Wallet`;
      }
      return "Wallet Payment";
    case "emi":
      if (payment.emi) {
        return `${payment.emi.duration}-month EMI`;
      }
      return "EMI Payment";
    default:
      return payment.method || "Payment";
  }
};

// PDF Document Component - Matching ModernInvoicePreview layout
interface InvoicePDFDocumentProps {
  invoice: Invoice;
}

const InvoicePDFDocument: React.FC<InvoicePDFDocumentProps> = ({ invoice }) => {
  const cgstAmount = invoice.tax.breakdown.cgst;
  const sgstAmount = invoice.tax.breakdown.sgst;
  const igstAmount = invoice.tax.breakdown.igst;
  const showIGST = igstAmount > 0;
  const showCGSTSGST = !showIGST && (cgstAmount > 0 || sgstAmount > 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header Section */}
        <View style={styles.header}>
          {/* QR Code Placeholder */}
          <View style={styles.headerLeft}>
            <Text style={styles.qrPlaceholder}>QR</Text>
          </View>

          {/* Company Branding */}
          <View style={styles.headerRight}>
            <Text style={styles.companyName}>{COMPANY_DETAILS.name}</Text>
            <Text style={styles.companyTagline}>Creative AI Solutions</Text>
          </View>
        </View>

        {/* Main Content Layout */}
        <View style={styles.contentWrapper}>
          {/* Left Sidebar - 32% */}
          <View style={styles.sidebar}>
            {/* Date Information */}
            <View style={styles.sidebarSection}>
              <Text style={styles.sidebarLabel}>Date:</Text>
              <Text style={styles.sidebarValue}>
                {formatDate(invoice.createdAt)}
              </Text>

              <Text style={styles.sidebarLabel}>Due Date:</Text>
              <Text style={styles.sidebarValue}>
                {formatDate(invoice.dueDate)}
              </Text>

              {invoice.paidAt && (
                <>
                  <Text style={styles.sidebarLabel}>Paid Date:</Text>
                  <Text
                    style={[styles.sidebarValue, { color: PDF_COLORS.success }]}
                  >
                    {formatDate(invoice.paidAt)}
                  </Text>
                </>
              )}
            </View>

            {/* Customer Information */}
            <View style={styles.sidebarSectionWithBorder}>
              <Text style={styles.sidebarTitle}>Bill To</Text>
              <Text style={styles.customerName}>
                {invoice.customer.name || "Customer"}
              </Text>
              <Text style={styles.customerDetail}>
                {invoice.customer.phone}
              </Text>
              <Text style={styles.customerDetail}>
                {invoice.customer.email}
              </Text>

              {invoice.customer.gstin && (
                <View style={styles.gstBadge}>
                  <Text>GSTIN: {invoice.customer.gstin}</Text>
                </View>
              )}

              {invoice.customer.address && (
                <>
                  <Text style={styles.customerDetail}>
                    {invoice.customer.address.line1}
                  </Text>
                  {invoice.customer.address.line2 && (
                    <Text style={styles.customerDetail}>
                      {invoice.customer.address.line2}
                    </Text>
                  )}
                  <Text style={styles.customerDetail}>
                    {invoice.customer.address.city},{" "}
                    {invoice.customer.address.state}{" "}
                    {invoice.customer.address.postalCode}
                  </Text>
                </>
              )}
            </View>

            {/* Payment Details */}
            <View style={styles.sidebarSectionWithBorder}>
              <Text style={styles.sidebarTitle}>Payment Details</Text>
              <View style={styles.paymentMethodRow}>
                <Text style={styles.paymentMethodText}>
                  {getPaymentMethodDisplay(invoice)}
                </Text>
              </View>

              {/* Payment method details */}
              {invoice.payment?.card && (
                <>
                  <Text style={styles.paymentDetailText}>
                    {invoice.payment.card.type?.charAt(0).toUpperCase() +
                      invoice.payment.card.type?.slice(1)}{" "}
                    Card
                    {invoice.payment.card.issuer &&
                      ` • ${invoice.payment.card.issuer}`}
                  </Text>
                </>
              )}

              {invoice.payment?.upi && (
                <>
                  <Text style={styles.paymentDetailText}>
                    VPA: {invoice.payment.upi.vpa}
                  </Text>
                  {invoice.payment.upi.transaction_id && (
                    <Text style={styles.paymentDetailText}>
                      Ref: {invoice.payment.upi.transaction_id}
                    </Text>
                  )}
                </>
              )}

              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor:
                      invoice.status === "paid"
                        ? PDF_COLORS.success
                        : PDF_COLORS.warning,
                  },
                ]}
              >
                <Text>{invoice.status.toUpperCase()}</Text>
              </View>

              <Text style={styles.customerDetail}>
                Total Amount:{" "}
                {formatAmount(invoice.amounts.total, invoice.amounts.currency)}
              </Text>
            </View>

            {/* Contact Information */}
            <View style={styles.sidebarSectionWithBorder}>
              <Text style={styles.sidebarTitle}>Contact</Text>
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>{COMPANY_DETAILS.email}</Text>
              </View>
              <View style={styles.contactRow}>
                <Text style={styles.contactText}>
                  {COMPANY_DETAILS.website}
                </Text>
              </View>
            </View>
          </View>

          {/* Right Content Area - 68% */}
          <View style={styles.mainContent}>
            {/* Invoice Title */}
            <View style={styles.titleSection}>
              <Text style={styles.invoiceTitle}>INVOICE</Text>
              <Text style={styles.invoiceSubtitle}>
                Document Payment Information
              </Text>
            </View>

            {/* Account Information */}
            <View style={styles.infoGrid}>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>GST Number:</Text>
                <Text style={styles.infoValue}>
                  {COMPANY_DETAILS.gstNumber}
                </Text>
              </View>
              <View style={styles.infoColumn}>
                <Text style={styles.infoLabel}>Invoice No:</Text>
                <Text style={styles.infoValue}>
                  #{invoice.invoiceNumber || invoice.invoiceId}
                </Text>
              </View>
            </View>

            {/* Package/Service Table */}
            <View style={styles.table}>
              {/* Table Header */}
              <View style={styles.tableHeader}>
                <View style={styles.tableColDescription}>
                  <Text style={styles.tableHeaderText}>Description</Text>
                </View>
                <View style={styles.tableColHSN}>
                  <Text style={styles.tableHeaderText}>HSN/SAC</Text>
                </View>
                <View style={styles.tableColCredits}>
                  <Text style={styles.tableHeaderText}>Credits</Text>
                </View>
                <View style={styles.tableColAmount}>
                  <Text style={styles.tableHeaderText}>Amount</Text>
                </View>
              </View>

              {/* Package Row */}
              <View style={styles.tableRow}>
                <View style={styles.tableColDescription}>
                  <Text style={styles.tableCellTitle}>
                    {invoice.package.name}
                  </Text>
                  <Text style={styles.tableCellSubtext}>
                    {invoice.package.description}
                  </Text>
                </View>
                <View style={styles.tableColHSN}>
                  <Text style={styles.tableCellText}>
                    {invoice.tax.hsn || "998314"}
                  </Text>
                </View>
                <View style={styles.tableColCredits}>
                  <Text style={styles.tableCellText}>
                    {invoice.package.credits.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.tableColAmount}>
                  <Text style={styles.tableCellAmount}>
                    {formatAmount(
                      invoice.amounts.base,
                      invoice.amounts.currency
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Totals Section */}
            <View style={styles.totalsSection}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Subtotal:</Text>
                <Text style={styles.totalValue}>
                  {formatAmount(invoice.amounts.base, invoice.amounts.currency)}
                </Text>
              </View>

              {showCGSTSGST && (
                <>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      CGST ({invoice.tax.rate / 2}%):
                    </Text>
                    <Text style={styles.totalValue}>
                      {formatAmount(cgstAmount, invoice.amounts.currency)}
                    </Text>
                  </View>
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>
                      SGST ({invoice.tax.rate / 2}%):
                    </Text>
                    <Text style={styles.totalValue}>
                      {formatAmount(sgstAmount, invoice.amounts.currency)}
                    </Text>
                  </View>
                </>
              )}

              {showIGST && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>
                    IGST ({invoice.tax.rate}%):
                  </Text>
                  <Text style={styles.totalValue}>
                    {formatAmount(igstAmount, invoice.amounts.currency)}
                  </Text>
                </View>
              )}

              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>Total:</Text>
                <Text style={styles.grandTotalValue}>
                  {formatAmount(
                    invoice.amounts.total,
                    invoice.amounts.currency
                  )}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

// Export Function
export const generateInvoicePDF = async (invoice: Invoice): Promise<void> => {
  const fileName = `invoice-${invoice.invoiceNumber || invoice.invoiceId}.pdf`;

  try {
    const blob = await pdf(<InvoicePDFDocument invoice={invoice} />).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error("PDF generation error:", error);
    throw error;
  }
};

export default InvoicePDFDocument;
