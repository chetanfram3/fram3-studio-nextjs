"use client";

import {
  Box,
  Typography,
  Tabs,
  Tab,
  Link,
  Avatar,
  Divider,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useState, useMemo, useCallback } from "react";
import { MarketShareDialog } from "./MarketShareDialog";
import FontDetailsSection from "./FontDetails";
import type { BrandCompetitor } from "@/types/market/types";
import SmIcon from "@mui/icons-material/TagOutlined";
import AdIcon from "@mui/icons-material/ShareOutlined";
import { getLogoUrl } from "@/services/logoService";
import SocialMediaIcons from "./SocialMedia";

interface BrandCompetitorProps {
  data: BrandCompetitor;
}

const isValidUrl = (url?: string | URL): boolean => {
  if (!url) return false;
  try {
    new URL(typeof url === "string" ? url : url.toString());
    return true;
  } catch {
    return false;
  }
};

export function BrandCompetitor({ data }: BrandCompetitorProps) {
  const [selectedTab, setSelectedTab] = useState("mainBrand");
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Memoize brand data extraction
  const { mainBrand, benchmarkBrand, brands } = useMemo(() => {
    const main = data?.brandInformation?.mainBrand;
    const benchmark = data?.brandInformation?.benchmarkBrand;

    return {
      mainBrand: main,
      benchmarkBrand: benchmark,
      brands: {
        mainBrand: main,
        ...(benchmark && { benchmarkBrand: benchmark }),
      },
    };
  }, [data?.brandInformation]);

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: string) => {
      setSelectedTab(newValue);
    },
    []
  );

  if (!mainBrand) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="text.primary">
          No brand information available
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: 3,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mb: 3,
        }}
      >
        <Typography variant="h5" color="text.primary">
          Brand Competitor
        </Typography>
        <MarketShareDialog
          marketShare={data?.marketShare}
          competitorEstablishmentDates={data?.competitorEstablishmentDates}
        />
      </Box>

      {benchmarkBrand && (
        <Box
          sx={{
            borderRadius: `${brand.borderRadius * 0.5}px`,
            p: 0.5,
            bgcolor: "background.paper",
            border: 1,
            borderColor: "divider",
            mb: 3,
          }}
        >
          <Tabs
            value={selectedTab}
            onChange={handleTabChange}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              backgroundColor: "background.paper",
              borderRadius: `${brand.borderRadius * 0.5}px`,
              minHeight: "36px",
              "& .MuiTabs-flexContainer": {
                display: "flex",
                width: "100%",
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
              "& .MuiTab-root": {
                flex: 1,
                fontSize: "0.875rem",
                fontWeight: 500,
                fontFamily: brand.fonts.body,
                color: "text.secondary",
                borderRadius: `${brand.borderRadius * 0.5}px`,
                transition: "color 0.3s, background-color 0.3s",
                textAlign: "center",
                minHeight: "36px",
                maxWidth: "none",
              },
              "& .Mui-selected": {
                backgroundColor: "background.default",
                color: "primary.main",
              },
              "& .MuiTab-root:not(.Mui-selected):hover": {
                backgroundColor: "action.hover",
              },
            }}
          >
            <Tab
              value="mainBrand"
              label={mainBrand?.brandIdentity?.brandName || "Main Brand"}
            />
            <Tab
              value="benchmarkBrand"
              label={
                benchmarkBrand?.brandIdentity?.brandName || "Benchmark Brand"
              }
            />
          </Tabs>
        </Box>
      )}

      {Object.entries(brands).map(
        ([key, brandData]) =>
          brandData && (
            <Box
              key={key}
              sx={{
                display: selectedTab === key ? "block" : "none",
                "& > *:not(:last-child)": { mb: 4 },
              }}
            >
              <Box
                sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3 }}
              >
                <Tooltip
                  title={brandData?.brandIdentity?.brandStory || ""}
                  arrow
                >
                  <Avatar
                    src={
                      isValidUrl(brandData?.logoUrl)
                        ? brandData.logoUrl || undefined
                        : brandData?.websiteUrl
                          ? getLogoUrl(brandData.websiteUrl) || undefined
                          : undefined
                    }
                    alt={brandData?.brandIdentity?.brandName || "Brand Logo"}
                    sx={{ width: 128, height: 128 }}
                  />
                </Tooltip>
                <Box>
                  <Box mb={1} mt={2}>
                    <Typography
                      variant="h6"
                      color="text.primary"
                      sx={{ fontFamily: brand.fonts.heading }}
                    >
                      {brandData?.brandIdentity?.brandName ||
                        "Brand Name Not Available"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {brandData?.slogan || "No slogan available"}
                    </Typography>
                  </Box>
                  {brandData?.socialMediaUrl && (
                    <SocialMediaIcons data={brandData.socialMediaUrl} />
                  )}
                </Box>
              </Box>

              {/* Brand Identity Section */}
              <Box>
                <Typography
                  variant="h5"
                  gutterBottom
                  color="text.primary"
                  sx={{
                    fontWeight: "medium",
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  Brand Identity
                </Typography>
                <Divider />
                <Box
                  sx={{
                    display: "grid",
                    gap: 3,
                    mt: 2,
                    gridTemplateColumns: { sm: "1fr", md: "1fr 1fr" },
                  }}
                >
                  <Box>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Parent Company
                    </Typography>
                    <Typography color="text.primary">
                      {brandData?.parentCompany || "Not available"}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography
                      variant="subtitle1"
                      color="text.secondary"
                      gutterBottom
                    >
                      Website
                    </Typography>
                    {brandData?.websiteUrl ? (
                      <Link
                        href={
                          brandData.websiteUrl.startsWith("http")
                            ? brandData.websiteUrl
                            : `https://${brandData.websiteUrl}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{
                          color: "primary.main",
                          textDecoration: "none",
                          "&:hover": {
                            color: "primary.dark",
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {brandData.websiteUrl}
                      </Link>
                    ) : (
                      <Typography color="text.primary">
                        Not available
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    Mission Statement
                  </Typography>
                  <Typography color="text.primary">
                    {brandData?.brandIdentity?.missionStatement ||
                      "Not available"}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    Vision Statement
                  </Typography>
                  <Typography color="text.primary">
                    {brandData?.brandIdentity?.visionStatement ||
                      "Not available"}
                  </Typography>
                </Box>

                <Box sx={{ mt: 3 }}>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    Brand Personality
                  </Typography>
                  <Typography color="text.primary">
                    {brandData?.brandIdentity?.personality || "Not available"}
                  </Typography>
                </Box>

                <Box
                  sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <AdIcon sx={{ color: "primary.main" }} />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Advertisement
                  </Typography>
                  <Typography color="text.primary">
                    {brandData?.advertisement || "Not available"}
                  </Typography>
                </Box>

                <Box
                  sx={{ mt: 3, display: "flex", alignItems: "center", gap: 1 }}
                >
                  <SmIcon sx={{ color: "primary.main" }} />
                  <Typography
                    variant="subtitle2"
                    color="text.secondary"
                    gutterBottom
                  >
                    Social Media Campaign
                  </Typography>
                  <Typography color="text.primary">
                    {brandData?.socialMediaCampaign || "Not available"}
                  </Typography>
                </Box>
              </Box>

              {/* Visual Aesthetics Section */}
              <Box>
                <Typography
                  variant="h5"
                  gutterBottom
                  color="text.primary"
                  sx={{
                    fontWeight: "medium",
                    fontFamily: brand.fonts.heading,
                  }}
                >
                  Visual Aesthetics
                </Typography>
                <Divider />

                <Box sx={{ mb: 3, mt: 3 }}>
                  <Typography
                    variant="subtitle1"
                    color="text.secondary"
                    gutterBottom
                  >
                    Brand Colors
                  </Typography>
                  <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {(brandData?.brandColors || []).map((color, index) => (
                      <Box
                        key={color?.hex || `color-${index}`}
                        sx={{ textAlign: "center" }}
                      >
                        <Box
                          sx={{
                            width: 96,
                            height: 96,
                            borderRadius: `${brand.borderRadius * 0.5}px`,
                            bgcolor: color?.hex || "#ffffff",
                            border: 1,
                            borderColor: "divider",
                            mb: 1,
                          }}
                        />
                        <Typography
                          variant="subtitle1"
                          display="block"
                          color="text.primary"
                        >
                          {color?.name || "Unnamed Color"}
                        </Typography>
                        <Typography variant="subtitle1" color="text.secondary">
                          {color?.hex || "No hex code"}
                        </Typography>
                      </Box>
                    ))}
                    {(!brandData?.brandColors ||
                      brandData.brandColors.length === 0) && (
                      <Typography color="text.primary">
                        No brand colors available
                      </Typography>
                    )}
                  </Box>
                </Box>

                <Box>
                  <FontDetailsSection
                    fontDetails={brandData?.fontDetails}
                    brandName={brandData?.brandIdentity?.brandName || ""}
                    brandSlogan={brandData?.brandIdentity?.brandStory || ""}
                  />
                </Box>
              </Box>
            </Box>
          )
      )}
    </Box>
  );
}

BrandCompetitor.displayName = "BrandCompetitor";
