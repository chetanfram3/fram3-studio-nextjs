"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  useTheme,
  alpha,
  Backdrop,
  Fade,
  Button,
  Link,
  Checkbox,
  FormControlLabel,
  Paper,
  Divider,
} from "@mui/material";
import { InfoOutlined } from "@mui/icons-material";
import CustomToast from "@/components/common/CustomToast";

interface DisclaimerDialogProps {
  open: boolean;
  onClose: () => void;
  disclaimer: string | undefined | null;
}

const DisclaimerDialog: React.FC<DisclaimerDialogProps> = ({
  open,
  onClose,
  disclaimer,
}) => {
  const theme = useTheme();
  const [accepted, setAccepted] = useState(false);

  // If no disclaimer is provided, don't show the dialog
  if (!disclaimer) {
    return null;
  }

  const handleAccept = () => {
    if (!accepted) {
      CustomToast("warning", "Please accept the terms and conditions");
      return;
    }
    onClose();
    CustomToast("success", "Disclaimer accepted");
  };

  return (
    <Backdrop
      open={open}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
      }}
    >
      <Fade
        in={open}
        timeout={{
          enter: 400,
          exit: 400,
        }}
      >
        <Paper
          elevation={5}
          sx={{
            borderRadius: 2,
            width: "90%",
            maxWidth: 600,
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            position: "relative",
            boxShadow: "0px 10px 25px rgba(0, 0, 0, 0.2)",
            border: `1px solid ${alpha(theme.palette.divider, 0.4)}`,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: alpha(theme.palette.secondary.main, 0.05),
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              display: "flex",
              alignItems: "center",
              p: 2,
            }}
          >
            <InfoOutlined
              sx={{
                color: theme.palette.secondary.main,
                mr: 2,
                fontSize: 28,
              }}
            />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: theme.palette.text.primary,
              }}
            >
              Important Disclaimer
            </Typography>
          </Box>

          {/* Content */}
          <Box
            sx={{
              p: 3,
              overflowY: "auto",
              flexGrow: 1,
              bgcolor: alpha(theme.palette.background.paper, 0.9),
            }}
          >
            <Typography
              variant="body2"
              sx={{
                mb: 2,
                color: theme.palette.text.secondary,
                whiteSpace: "pre-wrap",
                fontSize: "0.9rem",
                lineHeight: 1.6,
              }}
            >
              {disclaimer}
            </Typography>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={accepted}
                    onChange={(e) => setAccepted(e.target.checked)}
                    sx={{
                      color: theme.palette.secondary.main,
                      "&.Mui-checked": {
                        color: theme.palette.secondary.main,
                      },
                    }}
                  />
                }
                label={
                  <Typography variant="body2">
                    I have read and agree to the disclaimer and{" "}
                    <Link
                      href="https://fram3studio.io/terms-of-service"
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        color: theme.palette.secondary.main,
                        textDecoration: "none",
                        fontWeight: 500,
                        "&:hover": {
                          textDecoration: "underline",
                        },
                      }}
                    >
                      Terms & Conditions of Service
                    </Link>
                  </Typography>
                }
              />
            </Box>
          </Box>

          {/* Footer with action buttons */}
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "flex-end",
              bgcolor: theme.palette.background.paper,
              borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            }}
          >
            <Button
              variant="contained"
              sx={{
                bgcolor: theme.palette.secondary.main,
                color: theme.palette.secondary.contrastText,
                px: 3,
                "&:hover": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.9),
                },
                "&:disabled": {
                  bgcolor: alpha(theme.palette.secondary.main, 0.5),
                  color: alpha(theme.palette.secondary.contrastText, 0.7),
                },
              }}
              onClick={handleAccept}
              disabled={!accepted}
            >
              Accept & Continue
            </Button>
          </Box>
        </Paper>
      </Fade>
    </Backdrop>
  );
};

export default DisclaimerDialog;
