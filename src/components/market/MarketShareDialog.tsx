"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  IconButton,
  Box,
  Typography,
  alpha,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useState, useCallback, useMemo } from "react";
import { useThemeMode } from "@/theme";
import type { MarketShare } from "@/types/market/types";

interface MarketShareDialogProps {
  marketShare?: MarketShare[];
  competitorEstablishmentDates?: Record<string, string>;
}

// Currency symbol mapping
const currencySymbols: Record<string, string> = {
  Rs: "₹",
  USD: "$",
  EUR: "€",
  GBP: "£",
};

const formatNumber = (value: string | undefined): string => {
  if (!value || value === "UNKNOWN") return "-";

  const num = parseFloat(value.replace(/,/g, ""));
  if (isNaN(num)) return "-";

  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toLocaleString();
};

export function MarketShareDialog({
  marketShare = [],
  competitorEstablishmentDates = {},
}: MarketShareDialogProps) {
  const [open, setOpen] = useState(false);
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  const hasMarketShareData = useMemo(
    () => Array.isArray(marketShare) && marketShare.length > 0,
    [marketShare]
  );

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleOpen}
        sx={{
          bgcolor: "background.default",
          borderColor: "primary.main",
          color: "primary.main",
          fontWeight: "bold",
          fontFamily: brand.fonts.body,
          textTransform: "none",
          "&:hover": {
            bgcolor: "primary.main",
            borderColor: "primary.main",
            color: "primary.contrastText",
          },
          transition: "all 0.2s ease-in-out",
        }}
      >
        Market Share
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: isDarkMode
                ? "rgba(0, 0, 0, 0.85)"
                : "rgba(0, 0, 0, 0.7)",
            },
          },
        }}
        PaperProps={{
          sx: {
            bgcolor: "background.paper",
            backgroundImage: "none !important",
            borderRadius: `${brand.borderRadius * 1.5}px`,
            border: 2,
            borderColor: "primary.main",
            boxShadow: theme.shadows[24],
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            pt: 3,
            pb: 2,
            bgcolor: "background.paper",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" color="primary.main">
            Market Share Analysis
          </Typography>
          <IconButton
            onClick={handleClose}
            size="small"
            aria-label="close dialog"
            sx={{ color: "text.secondary" }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 2,
            pb: 3,
            bgcolor: "background.paper",
          }}
        >
          {hasMarketShareData ? (
            <Box
              sx={{
                width: "100%",
                overflow: "hidden",
                bgcolor: "background.paper",
                borderRadius: `${brand.borderRadius * 0.5}px`,
              }}
            >
              <Table>
                <TableHead>
                  <TableRow
                    sx={{
                      "& th": {
                        color: "text.primary",
                        fontWeight: "bold",
                        fontFamily: brand.fonts.body,
                        borderBottom: 2,
                        borderColor: "divider",
                      },
                    }}
                  >
                    <TableCell>Brand</TableCell>
                    <TableCell>Established</TableCell>
                    <TableCell>Market Share</TableCell>
                    <TableCell>Sales Share</TableCell>
                    <TableCell>Market Cap</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {marketShare.map((competitor) => {
                    if (!competitor?.brand) return null;

                    const currencySymbol =
                      currencySymbols[competitor.currency] ||
                      competitor.currency ||
                      "";

                    return (
                      <TableRow
                        key={`competitor-${competitor.brand}`}
                        sx={{
                          "&:last-child td": { border: 0 },
                          "&:hover": {
                            bgcolor: "action.hover",
                            transition: "background-color 0.2s",
                          },
                          "& td": {
                            color: "text.primary",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            fontWeight: "medium",
                            color: "primary.main",
                          }}
                        >
                          {competitor.brand}
                        </TableCell>
                        <TableCell sx={{ color: "text.secondary" }}>
                          {competitorEstablishmentDates[competitor.brand] ||
                            "-"}
                        </TableCell>
                        <TableCell>
                          {competitor.marketSharePercentage === "Unknown"
                            ? "-"
                            : `${competitor.marketSharePercentage}%`}
                        </TableCell>
                        <TableCell>
                          {competitor.salesPercentageWithinMarketShare ===
                          "Unknown"
                            ? "-"
                            : `${competitor.salesPercentageWithinMarketShare}%`}
                        </TableCell>
                        <TableCell>
                          {competitor.marketCap === "Unknown"
                            ? "-"
                            : `${currencySymbol}${formatNumber(
                                competitor.marketCap
                              )}`}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Box>
          ) : (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography color="text.secondary" variant="body2">
                No market share data available
              </Typography>
            </Box>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

MarketShareDialog.displayName = "MarketShareDialog";
