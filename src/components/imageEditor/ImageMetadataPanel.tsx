// src/components/imageEditor/metadata/ImageMetadataPanel.tsx
"use client";

import { Box, Typography, Chip, Stack, Divider, alpha } from "@mui/material";
import {
  AspectRatio as AspectRatioIcon,
  PhotoSizeSelectActual as DimensionsIcon,
  Straighten as SizeIcon,
  CalendarToday as DateIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ImageOutlined as FormatIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { format } from "date-fns";

interface ImageMetadata {
  original?: {
    width: number;
    height: number;
    format: string;
    size: number;
    aspectRatio?: string;
    realAspectRatio?: string;
    hasAlpha?: boolean;
    space?: string;
    channels?: number;
    depth?: string;
  };
  processed?: {
    width: number;
    height: number;
    format: string;
    size: number;
    watermarked?: boolean;
  };
  thumbnail?: {
    width: number;
    height: number;
    format: string;
    size: number;
  };
  processing?: {
    watermarkApplied: boolean;
    thumbnailGenerated: boolean;
    processedAt: string;
  };
}

interface ImageMetadataPanelProps {
  metadata: ImageMetadata | null;
  compact?: boolean;
}

/**
 * ImageMetadataPanel - Displays detailed image metadata
 * 
 * Features:
 * - File dimensions and format
 * - File size (human-readable)
 * - Processing information
 * - Aspect ratio
 * - Watermark status
 */
export function ImageMetadataPanel({
  metadata,
  compact = false,
}: ImageMetadataPanelProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  if (!metadata) {
    return (
      <Box
        sx={{
          p: 2,
          textAlign: "center",
          color: "text.secondary",
          fontFamily: brand.fonts.body,
        }}
      >
        <Typography variant="body2">No metadata available</Typography>
      </Box>
    );
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), "MMM dd, yyyy HH:mm");
    } catch {
      return "Unknown";
    }
  };

  const { original, processed, thumbnail, processing } = metadata;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
      }}
    >
      {/* Original Image Info */}
      {original && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "block",
              mb: 1,
              fontFamily: brand.fonts.heading,
            }}
          >
            Original Image
          </Typography>
          <Stack spacing={1}>
            {/* Dimensions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DimensionsIcon
                sx={{ fontSize: 16, color: "primary.main" }}
              />
              <Typography
                variant="body2"
                sx={{ fontFamily: brand.fonts.body, flex: 1 }}
              >
                Dimensions
              </Typography>
              <Chip
                label={`${original.width} × ${original.height}`}
                size="small"
                sx={{
                  fontFamily: brand.fonts.body,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Box>

            {/* Aspect Ratio */}
            {(original.aspectRatio || original.realAspectRatio) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <AspectRatioIcon
                  sx={{ fontSize: 16, color: "primary.main" }}
                />
                <Typography
                  variant="body2"
                  sx={{ fontFamily: brand.fonts.body, flex: 1 }}
                >
                  Aspect Ratio
                </Typography>
                <Chip
                  label={original.aspectRatio || original.realAspectRatio}
                  size="small"
                  color="primary"
                  sx={{
                    fontFamily: brand.fonts.body,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
            )}

            {/* Format & Size */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <FormatIcon sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography
                variant="body2"
                sx={{ fontFamily: brand.fonts.body, flex: 1 }}
              >
                Format & Size
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Chip
                  label={original.format.toUpperCase()}
                  size="small"
                  sx={{
                    fontFamily: brand.fonts.body,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
                <Chip
                  label={formatBytes(original.size)}
                  size="small"
                  sx={{
                    fontFamily: brand.fonts.body,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              </Stack>
            </Box>

            {/* Color Info */}
            {!compact && (original.channels || original.space) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{
                    fontFamily: brand.fonts.body,
                    flex: 1,
                    fontSize: "0.75rem",
                    color: "text.secondary",
                  }}
                >
                  Color
                </Typography>
                <Stack direction="row" spacing={0.5}>
                  {original.space && (
                    <Chip
                      label={original.space.toUpperCase()}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontFamily: brand.fonts.body,
                      }}
                    />
                  )}
                  {original.channels && (
                    <Chip
                      label={`${original.channels} ch`}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontFamily: brand.fonts.body,
                      }}
                    />
                  )}
                  {original.hasAlpha !== undefined && (
                    <Chip
                      label={original.hasAlpha ? "Alpha" : "No Alpha"}
                      size="small"
                      icon={
                        original.hasAlpha ? (
                          <CheckIcon sx={{ fontSize: 12 }} />
                        ) : (
                          <CloseIcon sx={{ fontSize: 12 }} />
                        )
                      }
                      sx={{
                        height: 18,
                        fontSize: "0.65rem",
                        fontFamily: brand.fonts.body,
                      }}
                    />
                  )}
                </Stack>
              </Box>
            )}
          </Stack>
        </Box>
      )}

      {/* Divider */}
      {processed && <Divider />}

      {/* Processed Image Info */}
      {processed && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "block",
              mb: 1,
              fontFamily: brand.fonts.heading,
            }}
          >
            Processed Image
          </Typography>
          <Stack spacing={1}>
            {/* Dimensions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DimensionsIcon
                sx={{ fontSize: 16, color: "primary.main" }}
              />
              <Typography
                variant="body2"
                sx={{ fontFamily: brand.fonts.body, flex: 1 }}
              >
                Dimensions
              </Typography>
              <Chip
                label={`${processed.width} × ${processed.height}`}
                size="small"
                sx={{
                  fontFamily: brand.fonts.body,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Box>

            {/* Format & Size */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <SizeIcon sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography
                variant="body2"
                sx={{ fontFamily: brand.fonts.body, flex: 1 }}
              >
                Format & Size
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Chip
                  label={processed.format.toUpperCase()}
                  size="small"
                  sx={{
                    fontFamily: brand.fonts.body,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  }}
                />
                <Chip
                  label={formatBytes(processed.size)}
                  size="small"
                  sx={{
                    fontFamily: brand.fonts.body,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              </Stack>
            </Box>

            {/* Watermark Status */}
            {processed.watermarked !== undefined && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography
                  variant="body2"
                  sx={{ fontFamily: brand.fonts.body, flex: 1 }}
                >
                  Watermark
                </Typography>
                <Chip
                  label={processed.watermarked ? "Applied" : "None"}
                  size="small"
                  color={processed.watermarked ? "warning" : "success"}
                  icon={
                    processed.watermarked ? (
                      <CheckIcon sx={{ fontSize: 12 }} />
                    ) : (
                      <CloseIcon sx={{ fontSize: 12 }} />
                    )
                  }
                  sx={{
                    fontFamily: brand.fonts.body,
                    fontWeight: 600,
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
            )}
          </Stack>
        </Box>
      )}

      {/* Divider */}
      {thumbnail && <Divider />}

      {/* Thumbnail Info */}
      {thumbnail && !compact && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "block",
              mb: 1,
              fontFamily: brand.fonts.heading,
            }}
          >
            Thumbnail
          </Typography>
          <Stack spacing={1}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: brand.fonts.body,
                  flex: 1,
                  fontSize: "0.75rem",
                }}
              >
                Dimensions & Size
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Chip
                  label={`${thumbnail.width}×${thumbnail.height}`}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
                <Chip
                  label={formatBytes(thumbnail.size)}
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}

      {/* Divider */}
      {processing && <Divider />}

      {/* Processing Info */}
      {processing && (
        <Box>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              color: "text.secondary",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              display: "block",
              mb: 1,
              fontFamily: brand.fonts.heading,
            }}
          >
            Processing
          </Typography>
          <Stack spacing={1}>
            {/* Processed Date */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <DateIcon sx={{ fontSize: 16, color: "primary.main" }} />
              <Typography
                variant="body2"
                sx={{ fontFamily: brand.fonts.body, flex: 1 }}
              >
                Processed
              </Typography>
              <Chip
                label={formatDate(processing.processedAt)}
                size="small"
                sx={{
                  fontFamily: brand.fonts.body,
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            </Box>

            {/* Processing Status */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: brand.fonts.body,
                  flex: 1,
                  fontSize: "0.75rem",
                }}
              >
                Generated Assets
              </Typography>
              <Stack direction="row" spacing={0.5}>
                <Chip
                  label="Thumbnail"
                  size="small"
                  color={processing.thumbnailGenerated ? "success" : "default"}
                  icon={
                    processing.thumbnailGenerated ? (
                      <CheckIcon sx={{ fontSize: 12 }} />
                    ) : (
                      <CloseIcon sx={{ fontSize: 12 }} />
                    )
                  }
                  sx={{
                    height: 18,
                    fontSize: "0.65rem",
                    fontFamily: brand.fonts.body,
                  }}
                />
              </Stack>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );
}