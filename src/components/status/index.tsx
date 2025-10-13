"use client";

import { useState, useCallback, useMemo } from "react";
import { Box, Typography, Avatar, Chip, Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useRouter } from "next/navigation";
import { ComponentStatus } from "@/components/common/componentStatus/ComponentStatus";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import type { ScriptInfo } from "@/types/storyMain/types";
import { useScriptMutation } from "@/hooks/scripts/useScriptMutation";
import { ScriptContent } from "./components/ScriptContent";
import SocialMediaIcons from "@/components/market/SocialMedia";
import BrandColorsBanner from "./components/brandBanner";
import ExtendedAudioPlaylist from "@/components/common/AudioPlayListExtended";
import VersionZipDownload from "@/components/common/VersionZipDownload";
import ScriptDuplicate from "@/components/common/ScriptDuplicate";
import ScriptCopyTo from "@/components/common/ScriptCopyTo";
import { getLogoUrl } from "@/services/logoService";
import { useSubscription } from "@/hooks/auth/useSubscription";
import CreditErrorDisplay from "@/components/common/CreditErrorDisplay";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";

/**
 * Type-safe interfaces
 */
interface StatusProps {
  scriptInfo?: ScriptInfo;
  refetch: () => void;
}

interface AudioPlaylistItem {
  sceneId: number;
  path: string;
  [key: string]: unknown;
}

interface CreditErrorResponse {
  response?: {
    status?: number;
    data?: unknown;
  };
  name?: string;
  message?: string;
}

/**
 * Helper function to validate URL
 */
const isValidUrl = (url?: string | URL | null): boolean => {
  if (!url) return false;
  try {
    new URL(typeof url === "string" ? url : url.toString());
    return true;
  } catch {
    return false;
  }
};

/**
 * Helper function to validate audio playlist
 */
const isValidAudioPlaylist = (
  playlist: unknown
): playlist is AudioPlaylistItem[] => {
  return (
    Array.isArray(playlist) &&
    playlist.length > 0 &&
    playlist.every(
      (item): item is AudioPlaylistItem =>
        typeof item === "object" &&
        item !== null &&
        "sceneId" in item &&
        "path" in item
    )
  );
};

/**
 * Helper function to check if error is a credit error
 */
const isCreditError = (error: unknown): error is CreditErrorResponse => {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as CreditErrorResponse).response === "object" &&
    (error as CreditErrorResponse).response?.status === 402
  );
};

/**
 * Status Component
 *
 * Main status page displaying script information, brand details,
 * pipeline status, audio playlist, and script content editing.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
export default function Status({ scriptInfo, refetch }: StatusProps) {
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isAdmin, hasFeatureAccess } = useSubscription();

  const {
    updateScript,
    isUpdating,
    error: updateError,
    reset,
  } = useScriptMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");

  // React 19: useMemo for derived script data
  const scriptData = useMemo(() => {
    if (!scriptInfo) return null;

    const {
      scriptId,
      productDetails,
      languages = [],
      brandDetails,
      audioPlaylist,
      version,
    } = scriptInfo;

    const { slogan, tagline, brand: productBrand } = productDetails || {};
    const displaySlogan = slogan && slogan !== "Not applicable";
    const displayTagline = tagline && tagline !== "Not applicable";
    const hasBrandDetails =
      brandDetails && Object.keys(brandDetails || {}).length > 0;

    return {
      scriptId,
      productDetails,
      languages,
      brandDetails,
      audioPlaylist,
      version,
      slogan,
      tagline,
      productBrand,
      displaySlogan,
      displayTagline,
      hasBrandDetails,
    };
  }, [scriptInfo]);

  // React 19: useCallback for retry handler
  const handleRetry = useCallback(() => {
    reset();
    handleUpdate();
  }, [reset]);

  // React 19: useCallback for purchase credits handler
  const handlePurchaseCredits = useCallback(() => {
    router.push("/credits/purchase");
  }, [router]);

  // React 19: useCallback for dismiss error handler
  const handleDismissError = useCallback(() => {
    reset();
  }, [reset]);

  // React 19: useCallback for edit handler
  const handleEdit = useCallback(() => {
    setEditedContent(scriptData?.version?.content || "");
    setIsEditing(true);
  }, [scriptData?.version?.content]);

  // React 19: useCallback for update handler
  const handleUpdate = useCallback(async () => {
    if (!scriptData?.scriptId || !editedContent?.trim()) return;

    updateScript(
      {
        scriptId: scriptData.scriptId,
        scriptContent: editedContent,
      },
      {
        onSuccess: (data) => {
          setIsEditing(false);
          router.push(
            `/dashboard/story/${scriptData.scriptId}/version/${data.versionId}`
          );
        },
        onError: (error) => {
          if (!isCreditError(error)) {
            const errorMessage =
              (error as CreditErrorResponse)?.name &&
              (error as CreditErrorResponse)?.message
                ? `${(error as CreditErrorResponse).name}: ${
                    (error as CreditErrorResponse).message
                  }`
                : "An error occurred";
            CustomToast("error", errorMessage);
          }
        },
      }
    );
  }, [scriptData?.scriptId, editedContent, updateScript, router]);

  // React 19: useCallback for duplicate complete handler
  const handleDuplicateComplete = useCallback(
    (result: { scriptId: string; versionId: string }) => {
      logger.info("Script duplicated successfully:", result);
      router.push(
        `/dashboard/story/${result.scriptId}/version/${result.versionId}`
      );
    },
    [router]
  );

  // React 19: useCallback for duplicate error handler
  const handleDuplicateError = useCallback((error: unknown) => {
    logger.error("Script duplication failed:", error);
  }, []);

  // React 19: useCallback for zip complete handler
  const handleZipComplete = useCallback((result: unknown) => {
    logger.info("Zip created successfully:", result);
  }, []);

  // React 19: useCallback for zip error handler
  const handleZipError = useCallback((error: unknown) => {
    logger.error("Zip creation failed:", error);
  }, []);

  // React 19: useMemo for avatar source
  const avatarSrc = useMemo(() => {
    if (!scriptData) return undefined;

    const { hasBrandDetails, brandDetails } = scriptData;

    if (hasBrandDetails && isValidUrl(brandDetails?.logoUrl)) {
      return brandDetails.logoUrl || undefined;
    }

    if (hasBrandDetails && brandDetails?.websiteUrl) {
      return getLogoUrl(brandDetails.websiteUrl) || undefined;
    }

    return undefined;
  }, [scriptData]);

  // Show loading state
  if (!scriptInfo || !scriptData) {
    return <LoadingAnimation message="Loading status details..." />;
  }

  const {
    scriptId,
    languages,
    brandDetails,
    audioPlaylist,
    version,
    tagline,
    productBrand,
    displaySlogan,
    displayTagline,
    hasBrandDetails,
    slogan,
  } = scriptData;

  return (
    <Box
      sx={{
        display: "flex",
        gap: 1,
        bgcolor: "background.default",
        p: 0,
        flexDirection: { xs: "column", md: "row" },
      }}
    >
      {/* Left Section */}
      <Box
        sx={{
          width: { xs: "100%", md: "20%" },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {/* Brand Details */}
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <Avatar
              src={avatarSrc}
              alt={
                hasBrandDetails
                  ? brandDetails.brandIdentity.brandName
                  : productBrand || "Product"
              }
              sx={{
                width: 128,
                height: 128,
                fontSize: "3rem",
              }}
            >
              {productBrand?.[0]?.toUpperCase() || "P"}
            </Avatar>
            <Box mt={4}>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ fontFamily: brand.fonts.heading }}
              >
                {productBrand || "Product"}
              </Typography>
              {displayTagline && (
                <Typography
                  variant="subtitle1"
                  color="primary.main"
                  gutterBottom
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {tagline}
                </Typography>
              )}
            </Box>
          </Box>

          {hasBrandDetails ? (
            <Box sx={{ mt: 3 }}>
              {brandDetails?.socialMediaUrl && (
                <Box mb={2}>
                  <SocialMediaIcons data={brandDetails.socialMediaUrl} />
                </Box>
              )}
              <Typography
                variant="body1"
                color="text.secondary"
                gutterBottom
                sx={{ fontFamily: brand.fonts.body }}
              >
                {brandDetails.brandIdentity?.missionStatement}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: "italic",
                  mt: 2,
                  fontFamily: brand.fonts.body,
                }}
              >
                {brandDetails.brandIdentity?.brandStory}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  fontStyle: "italic",
                  mt: 2,
                  fontFamily: brand.fonts.body,
                }}
              >
                {brandDetails.brandIdentity?.visionStatement}
              </Typography>
              {displaySlogan && (
                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    fontStyle: "italic",
                    mt: 2,
                    fontFamily: brand.fonts.body,
                  }}
                >
                  {slogan}
                </Typography>
              )}
            </Box>
          ) : (
            displayTagline && (
              <Typography
                variant="body1"
                align="center"
                gutterBottom
                sx={{
                  fontStyle: "italic",
                  mt: 4,
                  fontFamily: brand.fonts.body,
                }}
              >
                {tagline}
              </Typography>
            )
          )}

          {languages.length > 0 && (
            <Stack
              direction="row"
              spacing={1}
              sx={{
                mt: 2,
                justifyContent: "center",
                flexWrap: "wrap",
                gap: 1,
              }}
            >
              {languages.map((language) => (
                <Chip
                  key={language}
                  label={language}
                  color="primary"
                  size="small"
                  sx={{ fontFamily: brand.fonts.body }}
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Audio Playlist */}
        {isValidAudioPlaylist(audioPlaylist) && (
          <Box sx={{ width: "100%" }}>
            <ExtendedAudioPlaylist
              audioPlaylist={audioPlaylist}
              title="Script Narrative"
            />
          </Box>
        )}
      </Box>

      {/* Right Section */}
      <Box
        sx={{
          width: { xs: "100%", md: "80%" },
          display: "flex",
          flexDirection: "column",
          gap: 3,
        }}
      >
        {/* Brand Banner */}
        {hasBrandDetails && brandDetails.brandColors && (
          <BrandColorsBanner
            brandColors={brandDetails.brandColors}
            text={brandDetails.brandIdentity?.personality}
          />
        )}

        {/* Pipeline Status */}
        <ComponentStatus
          refetch={refetch}
          scriptInfo={scriptInfo}
          details={false}
        />

        {/* Action Buttons */}
        <Box sx={{ p: 2, alignSelf: "flex-end", display: "flex", gap: 2 }}>
          <VersionZipDownload
            scriptId={scriptId}
            versionId={version.versionId}
            onComplete={handleZipComplete}
            onError={handleZipError}
            variant="contained"
            size="medium"
          />
          {isAdmin && (
            <ScriptCopyTo
              sourceScriptId={scriptId}
              sourceVersionId={version.versionId}
              sourceTitle={scriptInfo.title}
              variant="contained"
              size="medium"
            />
          )}
          {hasFeatureAccess("enterprise") && (
            <ScriptDuplicate
              sourceScriptId={scriptId}
              sourceVersionId={version.versionId}
              sourceTitle={scriptInfo.title}
              onComplete={handleDuplicateComplete}
              onError={handleDuplicateError}
              variant="contained"
              size="medium"
              showAdvancedOptions={true}
            />
          )}
        </Box>

        {/* Credit Error Display */}
        <CreditErrorDisplay
          open={Boolean(updateError && isCreditError(updateError))}
          onOpenChange={(open) => {
            if (!open) {
              handleDismissError();
            }
          }}
          creditError={
            isCreditError(updateError) ? updateError.response?.data : undefined
          }
          onRetry={handleRetry}
          onPurchaseCredits={handlePurchaseCredits}
        />

        {/* Script Content */}
        <Box
          sx={{
            p: 3,
            mb: 1,
            borderTop: 1,
            borderRadius: `${brand.borderRadius}px`,
            borderColor: "primary.main",
          }}
        >
          <ScriptContent
            content={version?.content}
            isEditing={isEditing}
            isUpdating={isUpdating}
            editedContent={editedContent}
            updateError={updateError instanceof Error ? updateError : null}
            genScriptId={scriptInfo?.genScriptId || ""}
            genScriptVersionNumber={version?.genScriptVersionNumber || 0}
            onEdit={handleEdit}
            onCancel={() => setIsEditing(false)}
            onUpdate={handleUpdate}
            onContentChange={setEditedContent}
          />
        </Box>
      </Box>
    </Box>
  );
}

Status.displayName = "Status";
