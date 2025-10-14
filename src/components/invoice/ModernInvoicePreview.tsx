"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Button,
  Box,
  Typography,
  alpha,
  IconButton,
  Chip,
  CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Download,
  Printer as Print,
  X as Close,
  Palette,
  Receipt,
  Building as Business,
  Mail as Email,
  Phone,
  MapPin as LocationOn,
  CreditCard,
} from "lucide-react";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";
import type { Invoice } from "@/services/invoiceService";
import { COMPANY_DETAILS } from "@/config/details";
import styles from "./ModernInvoicePreview.module.css";
import QRCode from "qrcode";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface ModernInvoicePreviewProps {
  invoice: Invoice;
  open: boolean;
  onClose: () => void;
  scale?: "A4" | "large" | "xl";
  loading?: boolean;
  error?: Error;
}

interface PaymentMethodDetails {
  display: string;
  details: PaymentDetails | null;
}

type PaymentDetails =
  | CardPaymentDetails
  | UPIPaymentDetails
  | NetbankingPaymentDetails
  | WalletPaymentDetails
  | EMIPaymentDetails;

interface CardPaymentDetails {
  network: string;
  last4: string;
  type: string;
  issuer?: string;
  subType?: string;
  methodType: "card";
}

interface UPIPaymentDetails {
  vpa: string;
  provider: string;
  transactionId: string;
  flow: string | null;
  methodType: "upi";
}

interface NetbankingPaymentDetails {
  bank_code: string;
  bank_name: string;
  bank_transaction_id: string;
  methodType: "netbanking";
}

interface WalletPaymentDetails {
  wallet_name: string;
  wallet_transaction_id: string;
  methodType: "wallet";
}

interface EMIPaymentDetails {
  duration: number;
  rate: number;
  issuer: string;
  methodType: "emi";
}

interface ContainerSize {
  width: string;
  height: string;
  maxWidth: string;
  maxHeight: string;
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

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

/**
 * Get payment method display with details
 */
const getPaymentMethodDisplay = (invoice: Invoice): PaymentMethodDetails => {
  if (!invoice.payment) {
    return {
      display: "Payment",
      details: null,
    };
  }

  const payment = invoice.payment;

  switch (payment.method_type) {
    case "card":
      if (payment.card) {
        return {
          display: `${payment.card.network} •••• ${payment.card.last4}`,
          details: {
            network: payment.card.network,
            last4: payment.card.last4,
            type: payment.card.type,
            issuer: payment.card.issuer,
            subType: payment.card.sub_type,
            methodType: "card",
          },
        };
      }
      return { display: "Card Payment", details: null };

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
          freecharge: "Freecharge",
          mobikwik: "MobiKwik",
          airtel: "Airtel Payments Bank",
          ibl: "BHIM",
        };
        const provider = providerMap[domain] || domain.toUpperCase();
        return {
          display: `UPI (${provider})`,
          details: {
            vpa: payment.upi.vpa,
            provider,
            transactionId: payment.upi.transaction_id,
            flow: payment.upi.flow,
            methodType: "upi",
          },
        };
      }
      return { display: "UPI Payment", details: null };

    case "netbanking":
      if (payment.netbanking) {
        return {
          display: `${payment.netbanking.bank_name} NetBanking`,
          details: {
            bank_code: payment.netbanking.bank_code,
            bank_name: payment.netbanking.bank_name,
            bank_transaction_id: payment.netbanking.bank_transaction_id,
            methodType: "netbanking",
          },
        };
      }
      return { display: "Net Banking", details: null };

    case "wallet":
      if (payment.wallet) {
        const walletNames: Record<string, string> = {
          paytm: "Paytm Wallet",
          phonepe: "PhonePe Wallet",
          amazonpay: "Amazon Pay",
          freecharge: "FreeCharge",
          mobikwik: "MobiKwik",
          olamoney: "Ola Money",
          jiomoney: "Jio Money",
        };
        const walletName =
          walletNames[payment.wallet.wallet_name] ||
          `${payment.wallet.wallet_name} Wallet`;
        return {
          display: walletName,
          details: {
            wallet_name: payment.wallet.wallet_name,
            wallet_transaction_id: payment.wallet.wallet_transaction_id,
            methodType: "wallet",
          },
        };
      }
      return { display: "Wallet Payment", details: null };

    case "emi":
      if (payment.emi) {
        return {
          display: `${payment.emi.duration}-month EMI`,
          details: {
            duration: payment.emi.duration,
            rate: payment.emi.rate,
            issuer: payment.emi.issuer,
            methodType: "emi",
          },
        };
      }
      return { display: "EMI Payment", details: null };

    default:
      return {
        display: payment.method || "Payment",
        details: null,
      };
  }
};

/**
 * Get container size based on scale
 */
const getContainerSize = (
  scale: "A4" | "large" | "xl" = "A4"
): ContainerSize => {
  switch (scale) {
    case "large":
      return {
        width: "1000px",
        height: "1415px",
        maxWidth: "90vw",
        maxHeight: "95vh",
      };
    case "xl":
      return {
        width: "1200px",
        height: "1698px",
        maxWidth: "95vw",
        maxHeight: "98vh",
      };
    default:
      return {
        width: "794px",
        height: "1123px",
        maxWidth: "85vw",
        maxHeight: "90vh",
      };
  }
};

// ===========================
// QR CODE COMPONENT
// ===========================

interface InvoiceQRCodeProps {
  invoiceId: string;
  companyUrl?: string;
}

const InvoiceQRCode: React.FC<InvoiceQRCodeProps> = ({
  invoiceId,
  companyUrl = "https://fram3studio.io",
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    const generateQR = async () => {
      try {
        const qrData = `${companyUrl}/invoice/${invoiceId}`;
        const url = await QRCode.toDataURL(qrData, {
          width: 80,
          margin: 1,
          color: {
            dark: "#000000",
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        });
        setQrCodeUrl(url);
        logger.debug("QR code generated successfully", { invoiceId });
      } catch (err) {
        logger.error("Error generating QR code", { invoiceId, error: err });
      }
    };

    generateQR();
  }, [invoiceId, companyUrl]);

  return (
    <Box
      sx={{
        width: 80,
        height: 80,
        border: 1,
        borderColor: "divider",
        borderRadius: 0.5,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.paper",
        boxShadow: 1,
        overflow: "hidden",
      }}
    >
      {qrCodeUrl ? (
        <img
          src={qrCodeUrl}
          alt={`QR Code for invoice ${invoiceId}`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      ) : (
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: 0.5,
            bgcolor: "action.hover",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Typography variant="caption" color="text.secondary">
            QR
          </Typography>
        </Box>
      )}
    </Box>
  );
};

// ===========================
// MAIN COMPONENT
// ===========================

export function ModernInvoicePreview({
  invoice,
  open,
  onClose,
  scale = "A4",
  loading = false,
  error,
}: ModernInvoicePreviewProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsGeneratingPDF(true);
      logger.info("Starting PDF generation", {
        invoiceId: invoice.invoiceId,
        invoiceNumber: invoice.invoiceNumber,
      });

      const [html2canvas, jsPDF] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      if (!invoiceRef.current) {
        throw new Error("Invoice element not found");
      }

      const originalPrintMode = isPrintMode;
      if (!isPrintMode) {
        setIsPrintMode(true);
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const canvas = await html2canvas.default(invoiceRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff",
        logging: false,
        width: invoiceRef.current.offsetWidth,
        height: invoiceRef.current.offsetHeight,
      });

      if (!originalPrintMode) {
        setIsPrintMode(false);
      }

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      const pdf = new jsPDF.jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
      });

      pdf.addImage(
        canvas.toDataURL("image/jpeg", 0.95),
        "JPEG",
        0,
        0,
        imgWidth,
        Math.min(imgHeight, pageHeight),
        undefined,
        "FAST"
      );

      const filename = `invoice-${invoice.invoiceNumber || invoice.invoiceId}.pdf`;
      pdf.save(filename);

      logger.info("PDF generated successfully", { filename });
    } catch (err) {
      logger.error("Failed to generate PDF", { error: err });
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [invoice.invoiceId, invoice.invoiceNumber, isPrintMode]);

  // Handle print
  const handlePrint = useCallback(() => {
    logger.info("Printing invoice", { invoiceId: invoice.invoiceId });
    const originalPrintMode = isPrintMode;
    setIsPrintMode(true);

    setTimeout(() => {
      window.print();
      setTimeout(() => setIsPrintMode(originalPrintMode), 1000);
    }, 100);
  }, [isPrintMode, invoice.invoiceId]);

  // Toggle print mode
  const togglePrintMode = useCallback(() => {
    setIsPrintMode((prev) => !prev);
  }, []);

  // Loading state
  if (loading) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "100vw",
            height: "100vh",
            maxWidth: "none",
            maxHeight: "none",
            margin: 0,
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "none !important",
          },
        }}
      >
        <CircularProgress size={60} color="primary" />
      </Dialog>
    );
  }

  // Error state
  if (error || !invoice) {
    return (
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth={false}
        PaperProps={{
          sx: {
            width: "100vw",
            height: "100vh",
            maxWidth: "none",
            maxHeight: "none",
            margin: 0,
            bgcolor: "background.default",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundImage: "none !important",
          },
        }}
      >
        <Box sx={{ textAlign: "center", color: "text.primary" }}>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ fontFamily: brand.fonts.heading }}
          >
            Failed to load invoice
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {error?.message || "Invoice not found"}
          </Typography>
          <Button
            onClick={onClose}
            variant="outlined"
            color="primary"
            sx={{ mt: 2, fontFamily: brand.fonts.body }}
          >
            Close
          </Button>
        </Box>
      </Dialog>
    );
  }

  // Calculate totals
  const subtotal = invoice.amounts.base;
  const taxAmount = invoice.amounts.gst;
  const total = invoice.amounts.total;

  // Determine tax type
  const cgstAmount = invoice.tax.breakdown.cgst;
  const sgstAmount = invoice.tax.breakdown.sgst;
  const igstAmount = invoice.tax.breakdown.igst;

  const showIGST = igstAmount > 0;
  const showCGSTSGST = !showIGST && (cgstAmount > 0 || sgstAmount > 0);

  // Get payment method display
  const paymentMethod = getPaymentMethodDisplay(invoice);

  // Get container size
  const containerSize = getContainerSize(scale);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={false}
      PaperProps={{
        sx: {
          width: "100vw",
          height: "100vh",
          maxWidth: "none",
          maxHeight: "none",
          margin: 0,
          bgcolor: "background.default",
          backgroundImage:
            "linear-gradient(45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(0,0,0,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(0,0,0,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(0,0,0,0.05) 75%)",
          backgroundSize: "20px 20px",
          backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
          backdropFilter: "blur(10px)",
        },
      }}
    >
      <DialogContent
        sx={{
          p: 0,
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 3, p: 4 }}>
          {/* Invoice Container */}
          <Box
            ref={invoiceRef}
            className={styles.invoiceContainer}
            sx={{
              ...containerSize,
              aspectRatio: "210/297",
              bgcolor: "background.paper",
              borderRadius: `${brand.borderRadius * 0.25}px`,
              overflow: "hidden",
              boxShadow: theme.shadows[24],
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Header Section */}
            <Box
              sx={{
                px: 4,
                py: 3,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: "background.paper",
              }}
            >
              {/* QR Code */}
              <InvoiceQRCode
                invoiceId={invoice.invoiceNumber || invoice.invoiceId}
                companyUrl={COMPANY_DETAILS.website}
              />

              {/* Company Branding */}
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box
                  sx={{
                    width: 96,
                    height: 96,
                    borderRadius: `${brand.borderRadius * 0.25}px`,
                    overflow: "hidden",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "background.paper",
                  }}
                >
                  <img
                    src="/logo512.png"
                    alt="Company Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = "none";
                      if (target.parentElement) {
                        target.parentElement.innerHTML = `
                          <div style="width: 96px; height: 96px; border-radius: ${brand.borderRadius * 0.25}px; background: linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%); display: flex; align-items: center; justify-content: center;">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
                              <path d="M2 17L12 22L22 17" />
                              <path d="M2 12L12 17L22 12" />
                            </svg>
                          </div>
                        `;
                      }
                    }}
                  />
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: "bold",
                      color: "text.primary",
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    {COMPANY_DETAILS.name}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Creative AI Solutions
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Main Content Layout */}
            <Box sx={{ display: "flex", flex: 1 }}>
              {/* Left Sidebar - 32% width */}
              <Box
                className={styles.invoiceSidebar}
                sx={{
                  width: "32%",
                  bgcolor: isPrintMode
                    ? alpha(theme.palette.background.default, 0.5)
                    : "background.default",
                  color: "text.primary",
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                  gap: 3,
                }}
              >
                {/* Date Information */}
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 500,
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      Date:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      {formatDate(invoice.createdAt)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontWeight: 500,
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      Due Date:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "text.primary",
                      }}
                    >
                      {formatDate(invoice.dueDate)}
                    </Typography>
                  </Box>

                  {invoice.paidAt && (
                    <Box sx={{ mt: 2 }}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          fontWeight: 500,
                          mb: 0.5,
                          display: "block",
                        }}
                      >
                        Paid Date:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "success.main",
                        }}
                      >
                        {formatDate(invoice.paidAt)}
                      </Typography>
                    </Box>
                  )}
                </Box>

                {/* Customer Information */}
                <Box
                  sx={{
                    borderTop: 1,
                    borderColor: "divider",
                    pt: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      mb: 1.5,
                      display: "block",
                    }}
                  >
                    Bill To
                  </Typography>
                  <Box sx={{ space: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                        mb: 0.5,
                      }}
                    >
                      {invoice.customer.name || "Customer"}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mb: 0.5,
                      }}
                    >
                      {invoice.customer.phone}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                        mb: 1,
                      }}
                    >
                      {invoice.customer.email}
                    </Typography>

                    {invoice.customer.gstin && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          mb: 1,
                          fontWeight: 500,
                          bgcolor: alpha(theme.palette.success.main, 0.1),
                          px: 1,
                          py: 0.5,
                          borderRadius: `${brand.borderRadius * 0.25}px`,
                          border: 1,
                          borderColor: alpha(theme.palette.success.main, 0.3),
                        }}
                      >
                        GSTIN: {invoice.customer.gstin}
                      </Typography>
                    )}

                    {invoice.customer.address && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          display: "block",
                          lineHeight: 1.4,
                        }}
                      >
                        {invoice.customer.address.line1}
                        {invoice.customer.address.line2 && (
                          <>
                            <br />
                            {invoice.customer.address.line2}
                          </>
                        )}
                        <br />
                        {invoice.customer.address.city},{" "}
                        {invoice.customer.address.state}{" "}
                        {invoice.customer.address.postalCode}
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Payment Method & Status */}
                <Box
                  sx={{
                    borderTop: 1,
                    borderColor: "divider",
                    pt: 2,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      mb: 1.5,
                      display: "block",
                    }}
                  >
                    Payment Details
                  </Typography>
                  <Box sx={{ space: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <CreditCard
                        size={12}
                        color={theme.palette.primary.main}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.primary",
                          fontWeight: 500,
                        }}
                      >
                        {paymentMethod.display}
                      </Typography>
                    </Box>

                    {/* Payment details by type */}
                    {paymentMethod.details && (
                      <Box sx={{ ml: 2, mb: 1 }}>
                        {paymentMethod.details.methodType === "card" && (
                          <>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: "0.7rem",
                              }}
                            >
                              {paymentMethod.details.type
                                ?.charAt(0)
                                .toUpperCase() +
                                paymentMethod.details.type?.slice(1)}{" "}
                              Card
                              {paymentMethod.details.issuer &&
                                ` • ${paymentMethod.details.issuer}`}
                              {paymentMethod.details.subType &&
                                ` • ${paymentMethod.details.subType}`}
                            </Typography>
                          </>
                        )}

                        {paymentMethod.details.methodType === "upi" && (
                          <>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: "0.7rem",
                              }}
                            >
                              VPA: {paymentMethod.details.vpa}
                            </Typography>
                            {paymentMethod.details.transactionId && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  display: "block",
                                  fontSize: "0.7rem",
                                }}
                              >
                                Ref: {paymentMethod.details.transactionId}
                              </Typography>
                            )}
                          </>
                        )}

                        {paymentMethod.details.methodType === "netbanking" && (
                          <>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: "0.7rem",
                              }}
                            >
                              Bank Code: {paymentMethod.details.bank_code}
                            </Typography>
                            {paymentMethod.details.bank_transaction_id && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  display: "block",
                                  fontSize: "0.7rem",
                                }}
                              >
                                Bank Ref:{" "}
                                {paymentMethod.details.bank_transaction_id}
                              </Typography>
                            )}
                          </>
                        )}

                        {paymentMethod.details.methodType === "wallet" && (
                          <>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: "0.7rem",
                              }}
                            >
                              Wallet: {paymentMethod.details.wallet_name}
                            </Typography>
                            {paymentMethod.details.wallet_transaction_id && (
                              <Typography
                                variant="caption"
                                sx={{
                                  color: "text.secondary",
                                  display: "block",
                                  fontSize: "0.7rem",
                                }}
                              >
                                Ref:{" "}
                                {paymentMethod.details.wallet_transaction_id}
                              </Typography>
                            )}
                          </>
                        )}

                        {paymentMethod.details.methodType === "emi" && (
                          <>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: "0.7rem",
                              }}
                            >
                              EMI: {paymentMethod.details.duration} months @{" "}
                              {paymentMethod.details.rate / 100}%
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{
                                color: "text.secondary",
                                display: "block",
                                fontSize: "0.7rem",
                              }}
                            >
                              Issuer: {paymentMethod.details.issuer}
                            </Typography>
                          </>
                        )}
                      </Box>
                    )}

                    <Chip
                      label={invoice.status.toUpperCase()}
                      size="small"
                      sx={{
                        bgcolor:
                          invoice.status === "paid"
                            ? "success.main"
                            : "warning.main",
                        color: "white",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        mb: 1,
                      }}
                    />

                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        display: "block",
                      }}
                    >
                      Total Amount:{" "}
                      {formatAmount(
                        invoice.amounts.total,
                        invoice.amounts.currency
                      )}
                    </Typography>
                  </Box>
                </Box>

                {/* Company Contact */}
                <Box
                  sx={{
                    borderTop: 1,
                    borderColor: "divider",
                    pt: 2,
                    mt: "auto",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontWeight: 500,
                      mb: 1.5,
                      display: "block",
                    }}
                  >
                    Contact
                  </Typography>
                  <Box sx={{ space: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        mb: 1,
                      }}
                    >
                      <Email size={12} color={theme.palette.primary.main} />
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {COMPANY_DETAILS.email}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <LocationOn
                        size={12}
                        color={theme.palette.primary.main}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: "text.secondary" }}
                      >
                        {COMPANY_DETAILS.website}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Right Content Area - 68% width */}
              <Box
                className={styles.invoiceContent}
                sx={{
                  flex: 1,
                  p: 3,
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Invoice Title */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="h2"
                    sx={{
                      fontSize: "3rem",
                      fontWeight: "bold",
                      color: "text.primary",
                      letterSpacing: "-0.025em",
                      mb: 0.5,
                      fontFamily: brand.fonts.heading,
                    }}
                  >
                    INVOICE
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    Document Payment Information
                  </Typography>
                </Box>

                {/* Account Information */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 3,
                    mb: 3,
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      GST Number:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      {COMPANY_DETAILS.gstNumber}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        mb: 0.5,
                        display: "block",
                      }}
                    >
                      Invoice No:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      #{invoice.invoiceNumber || invoice.invoiceId}
                    </Typography>
                  </Box>
                </Box>

                {/* Package/Service Information */}
                <Box sx={{ flex: 1, mb: 3 }}>
                  {/* Table Header */}
                  <Box
                    sx={{
                      p: 1.5,
                      display: "grid",
                      gridTemplateColumns: "2fr 1fr 1fr 1fr",
                      gap: 1.5,
                      bgcolor: isPrintMode
                        ? alpha(theme.palette.background.default, 0.5)
                        : "background.default",
                      color: "text.primary",
                      borderRadius: `${brand.borderRadius * 0.25}px ${brand.borderRadius * 0.25}px 0 0`,
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      Description
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textAlign: "center" }}
                    >
                      HSN/SAC
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textAlign: "center" }}
                    >
                      Credits
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textAlign: "right" }}
                    >
                      Amount
                    </Typography>
                  </Box>

                  {/* Package Row */}
                  <Box
                    sx={{
                      border: 1,
                      borderColor: "divider",
                      borderTop: "none",
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        display: "grid",
                        gridTemplateColumns: "2fr 1fr 1fr 1fr",
                        gap: 1.5,
                        "&:hover": {
                          bgcolor: alpha(theme.palette.action.hover, 0.5),
                        },
                      }}
                    >
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "text.primary",
                          }}
                        >
                          {invoice.package.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: "text.secondary",
                            display: "block",
                          }}
                        >
                          {invoice.package.description}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        {invoice.tax.hsn || "998314"}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "center",
                          color: "text.secondary",
                        }}
                      >
                        {invoice.package.credits.toLocaleString()}
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          textAlign: "right",
                          fontWeight: 600,
                          color: "text.primary",
                        }}
                      >
                        {formatAmount(
                          invoice.amounts.base,
                          invoice.amounts.currency
                        )}
                      </Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Totals Section */}
                <Box sx={{ space: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 0.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: "text.secondary",
                      }}
                    >
                      Subtotal:
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: "text.primary",
                      }}
                    >
                      {formatAmount(subtotal, invoice.amounts.currency)}
                    </Typography>
                  </Box>

                  {/* Tax Breakdown */}
                  {showCGSTSGST && (
                    <>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "text.secondary",
                          }}
                        >
                          CGST ({invoice.tax.rate / 2}%):
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        >
                          {formatAmount(cgstAmount, invoice.amounts.currency)}
                        </Typography>
                      </Box>

                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          py: 0.5,
                        }}
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            color: "text.secondary",
                          }}
                        >
                          SGST ({invoice.tax.rate / 2}%):
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: "text.primary",
                          }}
                        >
                          {formatAmount(sgstAmount, invoice.amounts.currency)}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {showIGST && (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        py: 0.5,
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          color: "text.secondary",
                        }}
                      >
                        IGST ({invoice.tax.rate}%):
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: "text.primary",
                        }}
                      >
                        {formatAmount(igstAmount, invoice.amounts.currency)}
                      </Typography>
                    </Box>
                  )}

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      py: 1,
                      borderTop: 2,
                      borderColor: "text.primary",
                      mt: 1,
                    }}
                  >
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "text.primary",
                        fontFamily: brand.fonts.heading,
                      }}
                    >
                      Total:
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: "text.primary",
                      }}
                    >
                      {formatAmount(total, invoice.amounts.currency)}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* External Action Buttons */}
          <Box
            className={styles.invoiceActions}
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              ml: 2,
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{
                width: 56,
                height: 56,
                borderRadius: `${brand.borderRadius * 0.25}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: "blur(10px)",
                boxShadow: theme.shadows[3],
                "&:hover": {
                  bgcolor: "background.paper",
                },
              }}
            >
              <Close color={theme.palette.text.secondary} />
            </IconButton>

            <IconButton
              onClick={togglePrintMode}
              sx={{
                width: 56,
                height: 56,
                borderRadius: `${brand.borderRadius * 0.25}px`,
                bgcolor: isPrintMode
                  ? theme.palette.primary.main
                  : alpha(theme.palette.background.paper, 0.9),
                backdropFilter: "blur(10px)",
                boxShadow: theme.shadows[3],
                "&:hover": {
                  bgcolor: isPrintMode
                    ? theme.palette.primary.dark
                    : "background.paper",
                },
              }}
            >
              <Palette
                color={
                  isPrintMode
                    ? theme.palette.primary.contrastText
                    : theme.palette.text.secondary
                }
              />
            </IconButton>

            <IconButton
              onClick={handleDownloadPDF}
              disabled={isGeneratingPDF}
              sx={{
                width: 56,
                height: 56,
                borderRadius: `${brand.borderRadius * 0.25}px`,
                bgcolor: isGeneratingPDF
                  ? "action.disabled"
                  : alpha(theme.palette.background.paper, 0.9),
                backdropFilter: "blur(10px)",
                boxShadow: theme.shadows[3],
                "&:hover": {
                  bgcolor: isGeneratingPDF
                    ? "action.disabled"
                    : "background.paper",
                },
                "&:disabled": {
                  bgcolor: "action.disabled",
                },
              }}
            >
              {isGeneratingPDF ? (
                <CircularProgress size={20} sx={{ color: "text.secondary" }} />
              ) : (
                <Download color={theme.palette.text.secondary} />
              )}
            </IconButton>

            <IconButton
              onClick={handlePrint}
              sx={{
                width: 56,
                height: 56,
                borderRadius: `${brand.borderRadius * 0.25}px`,
                bgcolor: alpha(theme.palette.background.paper, 0.9),
                backdropFilter: "blur(10px)",
                boxShadow: theme.shadows[3],
                "&:hover": {
                  bgcolor: "background.paper",
                },
              }}
            >
              <Print color={theme.palette.text.secondary} />
            </IconButton>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

ModernInvoicePreview.displayName = "ModernInvoicePreview";

export default ModernInvoicePreview;
