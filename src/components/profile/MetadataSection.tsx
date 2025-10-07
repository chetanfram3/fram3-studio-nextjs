// src/components/profile/MetadataSection.tsx
"use client";

import { Box, Typography, Paper, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { UserProfile } from "@/types/profile";

interface MetadataSectionProps {
  metadata: UserProfile["metadata"];
  providerData: UserProfile["providerData"];
}

export default function MetadataSection({
  metadata,
  providerData,
}: MetadataSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Box
      sx={{
        mb: 4,
        borderRadius: `${brand.borderRadius * 1.5}px`,
        p: 3,
      }}
    >
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontFamily: brand.fonts.heading,
          color: "primary.main",
          fontWeight: 600,
          mb: 3,
        }}
      >
        Account Information
      </Typography>

      {/* Using Box with grid display instead of Grid component */}
      <Box
        sx={{
          display: "grid",
          gap: 3,
        }}
      >
        {/* Timestamps Section */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: "text.primary",
              mb: 2,
            }}
          >
            Timestamps
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" },
              gap: 3,
            }}
          >
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Account Created
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: brand.fonts.body,
                  color: "text.primary",
                }}
              >
                {formatDate(metadata.creationTime)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Last Sign In
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: brand.fonts.body,
                  color: "text.primary",
                }}
              >
                {formatDate(metadata.lastSignInTime)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{
                  color: "text.secondary",
                  fontWeight: 500,
                  mb: 0.5,
                }}
              >
                Last Token Refresh
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  fontFamily: brand.fonts.body,
                  color: "text.primary",
                }}
              >
                {formatDate(metadata.lastRefreshTime)}
              </Typography>
            </Box>
          </Box>
        </Paper>

        {/* Authentication Providers Section */}
        <Paper
          sx={{
            p: 3,
            bgcolor: "background.default",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="subtitle1"
            gutterBottom
            sx={{
              fontFamily: brand.fonts.heading,
              fontWeight: 600,
              color: "text.primary",
              mb: 2,
            }}
          >
            Authentication Providers
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
            {providerData.map((provider) => (
              <Chip
                key={provider.uid}
                label={
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontFamily: brand.fonts.body,
                        fontWeight: 600,
                      }}
                    >
                      {provider.providerId === "password"
                        ? "Email/Password"
                        : provider.providerId === "google.com"
                          ? "Google"
                          : provider.providerId === "facebook.com"
                            ? "Facebook"
                            : provider.providerId === "twitter.com"
                              ? "Twitter"
                              : provider.providerId}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      (
                      {provider.providerId === "phone"
                        ? provider.phoneNumber
                        : provider.email}
                      )
                    </Typography>
                  </Box>
                }
                variant="outlined"
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  borderColor: "primary.main",
                  borderWidth: 1,
                  color: "primary.main",
                  fontWeight: 500,
                  px: 2,
                  py: 1,
                  height: "auto",
                  "& .MuiChip-label": {
                    px: 0,
                  },
                }}
              />
            ))}
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
