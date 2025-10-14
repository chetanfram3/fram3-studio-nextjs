// src/app/(admin)/layout.tsx
"use client";

import { ReactNode } from "react";
import { Box, Container, Alert, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AdminGuard from "@/components/auth/AdminGuard";
import { Header } from "@/components/header/Header";
import { getCurrentBrand } from "@/config/brandConfig";
import { useSubscription } from "@/hooks/auth/useSubscription";
import { useAuthStore } from "@/store/authStore";
import SecurityIcon from "@mui/icons-material/Security";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

interface AdminLayoutProps {
  children: ReactNode;
}

/**
 * Admin Layout Component
 * Wraps all admin routes with:
 * - Admin authentication guard
 * - Admin-specific header
 * - Admin context indicators
 * - Consistent admin page styling
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();
  const { isAdmin, isSuperAdmin, accessLevel } = useSubscription();

  return (
    <AdminGuard
      requireSuperAdmin={false}
      redirectTo="/signin"
      loadingText="Verifying admin access..."
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        {/* Header */}
        <Header />

        {/* Admin Context Banner */}
        <Box
          sx={{
            position: "sticky",
            top: 64, // Height of header
            zIndex: 1100,
            bgcolor: "background.paper",
            borderBottom: `2px solid ${theme.palette.primary.main}`,
            py: 1,
            px: 3,
          }}
        >
          <Container maxWidth="xl">
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <AdminPanelSettingsIcon
                  sx={{
                    color: "primary.main",
                    fontSize: 28,
                  }}
                />
                <Box>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Chip
                      label={isSuperAdmin ? "SUPER ADMIN" : "ADMIN"}
                      size="small"
                      icon={<SecurityIcon />}
                      sx={{
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        fontWeight: 600,
                        fontSize: "0.75rem",
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              {/* User Info */}
              <Box
                sx={{
                  display: { xs: "none", sm: "flex" },
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box sx={{ textAlign: "right" }}>
                  <Box
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "text.primary",
                    }}
                  >
                    {user?.email}
                  </Box>
                  <Box
                    sx={{
                      fontSize: "0.75rem",
                      color: "text.secondary",
                    }}
                  >
                    Access Level: {accessLevel}
                  </Box>
                </Box>
              </Box>
            </Box>
          </Container>
        </Box>

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            py: { xs: 3, sm: 4, md: 5 },
            px: { xs: 2, sm: 3, md: 4 },
            mt: 2,
          }}
        >
          {children}
        </Box>

        {/* Footer Warning */}
        <Box
          sx={{
            py: 2,
            px: 3,
            bgcolor: "background.paper",
            borderTop: "1px solid",
            borderColor: "divider",
          }}
        >
          <Container maxWidth="xl">
            <Alert
              severity="warning"
              icon={<SecurityIcon />}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiAlert-message": {
                  width: "100%",
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box>
                  <strong>Admin Mode Active:</strong> All actions are logged and
                  audited. Use administrative features responsibly.
                </Box>
                <Chip
                  label={isSuperAdmin ? "Super Admin" : "Admin"}
                  size="small"
                  sx={{
                    bgcolor: "warning.main",
                    color: "warning.contrastText",
                    fontWeight: 600,
                  }}
                />
              </Box>
            </Alert>
          </Container>
        </Box>
      </Box>
    </AdminGuard>
  );
}
