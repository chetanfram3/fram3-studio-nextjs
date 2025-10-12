"use client";

import {
  Box,
  Divider,
  Typography,
  MenuItem,
  Select,
  FormControl,
  SelectChangeEvent,
  Skeleton,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BackButton } from "./BackButton";
import ProcessingModeIcon from "@/components/common/ProcessingModeIcon";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getCurrentBrand } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

type ProcessingMode = "quick" | "moderate" | "normal" | "detailed";

interface Version {
  versionId: string;
  versionNumber: number;
  genScriptVersionNumber?: number;
  processingMode: ProcessingMode;
}

interface ProductDetails {
  productCategory: string;
  product: string;
}

interface Location {
  country: string;
}

interface Timestamp {
  _seconds: number;
  _nanoseconds: number;
}

interface ScriptInfo {
  scriptId: string;
  genScriptId?: string;
  title: string;
  currentVersion: string;
  version: Version;
  lastModifiedAt: Timestamp;
  productDetails: ProductDetails;
  location: Location;
  versions: Version[];
}

interface ScriptHeaderProps {
  scriptInfo: ScriptInfo;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Format Firestore timestamp to readable date string
 */
const formatDate = (timestamp: Timestamp | undefined): string => {
  if (!timestamp?._seconds) return "Date not available";
  return new Date(timestamp._seconds * 1000).toLocaleDateString();
};

// ===========================
// MAIN COMPONENT
// ===========================

export function ScriptHeader({ scriptInfo }: ScriptHeaderProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const router = useRouter();
  const params = useParams();

  const isLoading = scriptInfo.title === "PlaceHolder Title";

  // Get version from URL params or fall back to scriptInfo
  const versionIdParam = params?.versionId as string | undefined;
  const currentVersion =
    versionIdParam ||
    scriptInfo.currentVersion ||
    (scriptInfo.versions?.length > 0 ? scriptInfo.versions[0].versionId : "");

  const [selectedVersion, setSelectedVersion] =
    useState<string>(currentVersion);

  // Update selectedVersion when URL or scriptInfo changes
  useEffect(() => {
    const versionToSelect =
      versionIdParam ||
      scriptInfo.currentVersion ||
      (scriptInfo.versions?.length > 0 ? scriptInfo.versions[0].versionId : "");

    if (versionToSelect) {
      setSelectedVersion(versionToSelect);
    }
  }, [versionIdParam, scriptInfo.currentVersion, scriptInfo.versions]);

  // Handle version change
  const handleVersionChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      const versionId = event.target.value;
      if (!versionId) return;

      setSelectedVersion(versionId);
      router.push(
        `/dashboard/story/${scriptInfo.scriptId}/version/${versionId}`
      );
    },
    [scriptInfo.scriptId, router]
  );

  // Safety check for required data
  if (!scriptInfo?.title && !isLoading) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="error">Script information not available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          flexWrap: { xs: "wrap", md: "nowrap" },
        }}
      >
        {/* Left Section: Back Button, Divider, and Title */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <BackButton />

          <Divider
            orientation="vertical"
            flexItem
            sx={{
              mt: 1,
              borderRightWidth: 2,
              borderColor: "primary.main",
              height: "72px",
            }}
          />

          <Box>
            {isLoading ? (
              <>
                <Skeleton
                  variant="text"
                  width={300}
                  height={30}
                  sx={{ mb: 1 }}
                />
                <Skeleton variant="text" width={200} height={24} />
              </>
            ) : (
              <>
                <Typography
                  variant="h4"
                  sx={{
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    color: "primary.main",
                  }}
                >
                  {scriptInfo.title}
                </Typography>
                <Typography
                  variant="body1"
                  sx={{
                    color: "text.secondary",
                    fontSize: "15px",
                  }}
                >
                  Version {scriptInfo.version?.versionNumber ?? "1"} | Modified:{" "}
                  {formatDate(scriptInfo.lastModifiedAt)}
                </Typography>
              </>
            )}
          </Box>

          {/* Processing Mode Icons */}
          {scriptInfo.version?.processingMode && (
            <ProcessingModeIcon
              mode={scriptInfo.version.processingMode}
              size={24}
              showTooltip={true}
            />
          )}

          {scriptInfo?.genScriptId && (
            <ProcessingModeIcon
              mode="auto"
              genScriptId={scriptInfo.genScriptId}
              size={24}
              showTooltip={true}
            />
          )}
        </Box>

        {/* Right Section: Product Details and Version Selector */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 1,
            mt: 1,
          }}
        >
          {/* Product Details */}
          <Box>
            {isLoading ? (
              <Skeleton variant="text" width={250} height={24} />
            ) : (
              <Typography
                variant="subtitle1"
                sx={{
                  color: "text.secondary",
                }}
              >
                {scriptInfo.productDetails?.productCategory ?? " "} •{" "}
                {scriptInfo.productDetails?.product ?? " "} •{" "}
                {scriptInfo.location?.country ?? " "}
              </Typography>
            )}
          </Box>

          {/* Version Selector */}
          {isLoading ? (
            <Skeleton
              variant="rectangular"
              width={80}
              height={40}
              sx={{ borderRadius: `${brand.borderRadius}px` }}
            />
          ) : (
            <FormControl
              variant="outlined"
              size="small"
              sx={{
                minWidth: 40,
                bgcolor: "background.default",
                borderRadius: `${brand.borderRadius}px`,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.light",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.dark",
                },
              }}
            >
              <Select
                value={selectedVersion}
                onChange={handleVersionChange}
                displayEmpty
                sx={{
                  "& .MuiSelect-select": {
                    padding: "8px 12px",
                  },
                }}
              >
                {(scriptInfo.versions ?? []).map((version) => (
                  <MenuItem key={version.versionId} value={version.versionId}>
                    v {version.versionNumber}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ScriptHeader;
