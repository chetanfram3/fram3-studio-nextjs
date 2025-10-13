"use client";

import { Box, Typography, Chip } from "@mui/material";
import {
  Category as CategoryIcon,
  LocalOffer as ProductIcon,
  Public as RegionIcon,
  Star as StarIcon,
  ChevronRight as ChevronRightIcon,
  X as XIcon,
} from "@mui/icons-material";
import { Clock, UserCircle, Globe, Heart, Users } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useMemo, useCallback } from "react";
import type {
  BrandOverview,
  ScriptRatingSummary,
  TargetAudience,
} from "@/types/market/types";

interface MetricsCardsProps {
  brandOverview?: BrandOverview;
  scriptRating?: ScriptRatingSummary;
  targetAudience?: TargetAudience;
}

export function MetricsCards({
  brandOverview,
  scriptRating,
  targetAudience,
}: MetricsCardsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize location string to avoid recalculation
  const locationString = useMemo(() => {
    if (!brandOverview?.location) return "Location not available";

    return (
      [
        brandOverview.location.city,
        brandOverview.location.state,
        brandOverview.location.country,
      ]
        .filter((item): item is string => Boolean(item))
        .join(", ") || "Location not available"
    );
  }, [brandOverview?.location]);

  // Memoize scroll handler
  const handleReviewClick = useCallback(() => {
    const element = document.getElementById("script-rating");
    element?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Memoize whether we have any data
  const hasData = useMemo(
    () => Boolean(brandOverview || scriptRating || targetAudience),
    [brandOverview, scriptRating, targetAudience]
  );

  if (!hasData) {
    return (
      <Box sx={{ p: 4 }}>
        <Typography color="text.primary">No metrics data available</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: "grid",
        gap: 4,
        gridTemplateColumns: { xs: "1fr", md: "1fr 1fr", lg: "1fr 1fr 1fr" },
      }}
    >
      {/* Brand Overview Card */}
      {brandOverview && (
        <Box
          sx={{
            position: "relative",
            p: 4,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Brand Overview
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <XIcon sx={{ color: "primary.main" }} />
              <Typography color="text.primary">
                Brand: {brandOverview?.brandName || "Not available"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <CategoryIcon sx={{ color: "primary.main" }} />
              <Typography color="text.primary">
                Category: {brandOverview?.category || "Not available"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <ProductIcon sx={{ color: "primary.main" }} />
              <Typography color="text.primary">
                Product: {brandOverview?.subCategory || "Not available"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <RegionIcon sx={{ color: "primary.main" }} />
              <Typography color="text.primary">
                Region: {locationString}
              </Typography>
            </Box>
          </Box>
        </Box>
      )}

      {/* Target Audience Card */}
      {targetAudience && (
        <Box
          sx={{
            position: "relative",
            p: 4,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Target Audience
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Clock size={24} color={theme.palette.primary.main} />
              <Typography color="text.primary">
                Age Range: {targetAudience?.ageRange || "Not specified"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <UserCircle size={24} color={theme.palette.primary.main} />
              <Typography color="text.primary">
                Gender: {targetAudience?.genderFocus || "Not specified"}
              </Typography>
            </Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Globe size={24} color={theme.palette.primary.main} />
              <Typography color="text.primary">
                Cultural Background:{" "}
                {targetAudience?.culturalBackground || "Not specified"}
              </Typography>
            </Box>
            {targetAudience?.emotionalNeeds &&
              targetAudience.emotionalNeeds.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Heart
                    size={24}
                    color={theme.palette.primary.main}
                    style={{ marginTop: 4 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      gutterBottom
                    >
                      Emotional Needs
                    </Typography>
                    <Typography color="text.secondary">
                      {targetAudience.emotionalNeeds.join(", ")}
                    </Typography>
                  </Box>
                </Box>
              )}

            {targetAudience?.commonStereotypes &&
              targetAudience.commonStereotypes.length > 0 && (
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <Users
                    size={24}
                    color={theme.palette.primary.main}
                    style={{ marginTop: 4 }}
                  />
                  <Box>
                    <Typography
                      variant="subtitle2"
                      color="text.primary"
                      gutterBottom
                    >
                      Common Stereotypes
                    </Typography>
                    <Typography color="text.secondary">
                      {targetAudience.commonStereotypes.join(", ")}
                    </Typography>
                  </Box>
                </Box>
              )}
          </Box>
        </Box>
      )}

      {/* Script Rating Card */}
      {scriptRating && (
        <Box
          sx={{
            position: "relative",
            p: 4,
            borderRadius: `${brand.borderRadius}px`,
            bgcolor: "background.default",
            border: 1,
            borderColor: "divider",
            overflow: "hidden",
          }}
        >
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Script Rating
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <StarIcon sx={{ color: "primary.main" }} />
              <Typography color="text.primary">
                {scriptRating?.recommendation || "No recommendation available"}
              </Typography>
            </Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              {scriptRating?.finalScore ?? "N/A"}/100
            </Typography>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Chip
                label="Review"
                onClick={handleReviewClick}
                icon={<ChevronRightIcon />}
                color="primary"
                variant="outlined"
                sx={{
                  cursor: "pointer",
                  borderColor: "primary.main",
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                  },
                }}
              />
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
}

MetricsCards.displayName = "MetricsCards";
