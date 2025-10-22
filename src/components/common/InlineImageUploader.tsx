"use client";

// InlineImageUploader.tsx - Self-contained inline image upload with preview
// Matches GenericFileUpload and ImageGenerationOverlay styling
import React, { useState, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Stack,
  Chip,
  CircularProgress,
  Alert,
} from "@mui/material";
import {
  CloudUpload as UploadIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import { X } from "lucide-react";
import { alpha, useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import CustomToast from "@/components/common/CustomToast";
import { uploadTempArtifact } from "@/services/firestore/firebaseUploadService";
import logger from "@/utils/logger";

// ============================================
// TYPES
// ============================================

export type DetectedAspectRatio = "16:9" | "9:16" | "1:1" | null;

export interface UploadedImageData {
  file: File;
  url: string;
  aspectRatio: DetectedAspectRatio;
}

interface InlineImageUploaderProps {
  onImageUploaded: (data: UploadedImageData) => void;
  disabled?: boolean;
  maxSizeMB?: number; // Default: 10MB
  showAspectRatio?: boolean; // Default: true
  allowedFormats?: string[]; // Default: ["jpg", "jpeg", "png", "webp", "gif"]
}

// Allowed aspect ratios with tolerance
const ASPECT_RATIOS = [
  { ratio: 16 / 9, label: "16:9" as const, tolerance: 0.1 },
  { ratio: 9 / 16, label: "9:16" as const, tolerance: 0.1 },
  { ratio: 1, label: "1:1" as const, tolerance: 0.1 },
];

// ============================================
// COMPONENT
// ============================================

export default function InlineImageUploader({
  onImageUploaded,
  disabled = false,
  maxSizeMB = 10,
  showAspectRatio = true,
  allowedFormats = ["jpg", "jpeg", "png", "webp", "gif"],
}: InlineImageUploaderProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [detectedAspectRatio, setDetectedAspectRatio] =
    useState<DetectedAspectRatio>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============================================
  // ASPECT RATIO DETECTION
  // ============================================

  const detectAspectRatio = useCallback((imageUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth;
      const height = img.naturalHeight;
      const ratio = width / height;

      logger.info("Image dimensions:", { width, height, ratio });

      // Find closest aspect ratio
      let closest = ASPECT_RATIOS[0];
      let minDiff = Math.abs(ratio - closest.ratio);

      for (const ar of ASPECT_RATIOS) {
        const diff = Math.abs(ratio - ar.ratio);
        if (diff < minDiff) {
          minDiff = diff;
          closest = ar;
        }
      }

      // Check if within tolerance
      if (minDiff <= closest.tolerance) {
        setDetectedAspectRatio(closest.label);
        logger.info("Detected aspect ratio:", closest.label);
      } else {
        setDetectedAspectRatio(closest.label);
        logger.warn(
          `No exact match found. Defaulting to closest: ${closest.label}`
        );
      }
    };

    img.onerror = () => {
      logger.error("Failed to load image for aspect ratio detection");
      setDetectedAspectRatio(null);
    };

    img.src = imageUrl;
  }, []);

  // ============================================
  // FILE VALIDATION
  // ============================================

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file type
      if (!file.type.startsWith("image/")) {
        return { valid: false, error: "Please select an image file" };
      }

      // Check file format
      const extension = file.name.split(".").pop()?.toLowerCase() || "";
      if (!allowedFormats.includes(extension)) {
        return {
          valid: false,
          error: `File format not supported. Allowed: ${allowedFormats.join(", ").toUpperCase()}`,
        };
      }

      // Check file size
      const maxSizeBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        return {
          valid: false,
          error: `File size must be under ${maxSizeMB}MB`,
        };
      }

      return { valid: true };
    },
    [maxSizeMB, allowedFormats]
  );

  // ============================================
  // FILE UPLOAD HANDLER
  // ============================================

  const handleFileUpload = useCallback(
    async (file: File) => {
      // Validate
      const validation = validateFile(file);
      if (!validation.valid) {
        CustomToast("error", validation.error!);
        return;
      }

      try {
        setIsUploading(true);
        setUploadProgress(0);

        // Upload to Firebase with progress
        const uploadResult = await uploadTempArtifact(file, (progress) => {
          setUploadProgress(progress.progress);
          logger.debug(`Upload progress: ${progress.progress}%`);
        });

        if (uploadResult.success && uploadResult.url) {
          setUploadedFile(file);
          setUploadedUrl(uploadResult.url);

          // Detect aspect ratio and notify parent
          if (showAspectRatio) {
            // Create promise to wait for aspect ratio detection
            const aspectRatioPromise = new Promise<DetectedAspectRatio>(
              (resolve) => {
                const img = new Image();
                img.onload = () => {
                  const width = img.naturalWidth;
                  const height = img.naturalHeight;
                  const ratio = width / height;

                  logger.info("Image dimensions:", { width, height, ratio });

                  // Find closest aspect ratio
                  let closest = ASPECT_RATIOS[0];
                  let minDiff = Math.abs(ratio - closest.ratio);

                  for (const ar of ASPECT_RATIOS) {
                    const diff = Math.abs(ratio - ar.ratio);
                    if (diff < minDiff) {
                      minDiff = diff;
                      closest = ar;
                    }
                  }

                  // Check if within tolerance
                  const detectedRatio =
                    minDiff <= closest.tolerance
                      ? closest.label
                      : closest.label;
                  logger.info("Detected aspect ratio:", detectedRatio);
                  setDetectedAspectRatio(detectedRatio);
                  resolve(detectedRatio);
                };

                img.onerror = () => {
                  logger.error(
                    "Failed to load image for aspect ratio detection"
                  );
                  setDetectedAspectRatio(null);
                  resolve(null);
                };

                img.src = uploadResult.url!;
              }
            );

            // Wait for aspect ratio detection to complete
            const aspectRatio = await aspectRatioPromise;

            // Notify parent with correct aspect ratio
            onImageUploaded({
              file,
              url: uploadResult.url!,
              aspectRatio,
            });
          } else {
            // No aspect ratio detection, notify immediately
            onImageUploaded({
              file,
              url: uploadResult.url!,
              aspectRatio: null,
            });
          }

          CustomToast("success", "Image uploaded successfully");
        } else {
          throw new Error(uploadResult.error || "Upload failed");
        }
      } catch (error) {
        logger.error("File upload error:", error);
        CustomToast("error", "Failed to upload image");
        handleClearFile();
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [validateFile, showAspectRatio, onImageUploaded]
  );

  // ============================================
  // EVENT HANDLERS
  // ============================================

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      await handleFileUpload(file);

      // Reset input
      if (event.target) {
        event.target.value = "";
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled && !isUploading) {
        setIsDragging(true);
      }
    },
    [disabled, isUploading]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled || isUploading) return;

      const file = e.dataTransfer.files?.[0];
      if (file) {
        await handleFileUpload(file);
      }
    },
    [disabled, isUploading, handleFileUpload]
  );

  const handleClearFile = useCallback(() => {
    setUploadedFile(null);
    setUploadedUrl("");
    setDetectedAspectRatio(null);
    setUploadProgress(0);
  }, []);

  const handleChangeFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Box>
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
        disabled={disabled || isUploading}
      />

      {/* Upload Zone or Preview */}
      {!uploadedUrl ? (
        // Drop Zone
        <Box
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() =>
            !disabled && !isUploading && fileInputRef.current?.click()
          }
          sx={{
            border: 3,
            borderStyle: "dashed",
            borderColor: isDragging
              ? "primary.main"
              : disabled
                ? "divider"
                : "divider",
            borderRadius: `${brand.borderRadius}px`,
            p: 4,
            textAlign: "center",
            cursor: disabled || isUploading ? "default" : "pointer",
            bgcolor: isDragging
              ? alpha(theme.palette.primary.main, 0.05)
              : theme.palette.background.paper,
            transition: theme.transitions.create([
              "border-color",
              "background-color",
            ]),
            "&:hover": {
              borderColor: disabled || isUploading ? "divider" : "primary.main",
              bgcolor:
                disabled || isUploading
                  ? theme.palette.background.paper
                  : alpha(theme.palette.primary.main, 0.04),
            },
            opacity: disabled ? 0.6 : 1,
          }}
        >
          {isUploading ? (
            // Upload Progress
            <Stack spacing={2} alignItems="center">
              <CircularProgress
                size={48}
                variant="determinate"
                value={uploadProgress}
                sx={{ color: "primary.main" }}
              />
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Uploading {uploadProgress}%
              </Typography>
            </Stack>
          ) : (
            // Upload Instructions
            <>
              <Box
                sx={{
                  width: 56,
                  height: 56,
                  borderRadius: "50%",
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  mx: "auto",
                  mb: 2,
                }}
              >
                <UploadIcon sx={{ color: "primary.main", fontSize: 28 }} />
              </Box>

              <Typography
                variant="body1"
                gutterBottom
                sx={{
                  fontFamily: brand.fonts.body,
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                Drop image here or click to browse
              </Typography>

              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: brand.fonts.body }}
              >
                Supports {allowedFormats.join(", ").toUpperCase()} (max{" "}
                {maxSizeMB}MB)
              </Typography>
            </>
          )}
        </Box>
      ) : (
        // Preview
        <Stack spacing={1.5}>
          {/* Image Preview */}
          <Box
            sx={{
              position: "relative",
              borderRadius: `${brand.borderRadius}px`,
              overflow: "hidden",
              border: 1,
              borderColor: "divider",
              bgcolor: theme.palette.action.hover,
            }}
          >
            <Box
              component="img"
              src={uploadedUrl}
              alt="Uploaded preview"
              sx={{
                width: "100%",
                height: "auto",
                maxHeight: 200,
                objectFit: "contain",
                display: "block",
              }}
            />

            {/* Clear Button Overlay */}
            <IconButton
              onClick={handleClearFile}
              disabled={disabled}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                bgcolor: alpha(theme.palette.background.paper, 0.95),
                boxShadow: theme.shadows[2],
                "&:hover": {
                  bgcolor: theme.palette.background.paper,
                },
              }}
            >
              <X size={20} />
            </IconButton>
          </Box>

          {/* File Info Row */}
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
          >
            {/* Filename Chip */}
            <Chip
              label={uploadedFile?.name || "Uploaded"}
              size="small"
              sx={{
                fontFamily: brand.fonts.body,
                fontSize: "0.75rem",
                bgcolor: theme.palette.action.selected,
              }}
            />

            {/* Aspect Ratio Chip */}
            {showAspectRatio && detectedAspectRatio && (
              <Chip
                label={detectedAspectRatio}
                size="small"
                icon={<InfoIcon fontSize="small" />}
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: "primary.main",
                  borderColor: "primary.main",
                  border: 1,
                  fontFamily: brand.fonts.body,
                  fontSize: "0.75rem",
                  "& .MuiChip-icon": {
                    color: "primary.main",
                  },
                }}
              />
            )}

            {/* Change File Button */}
            <Button
              variant="outlined"
              size="small"
              onClick={handleChangeFile}
              disabled={disabled || isUploading}
              sx={{
                ml: "auto !important",
                borderRadius: `${brand.borderRadius / 2}px`,
                fontFamily: brand.fonts.body,
                textTransform: "none",
                borderColor: "primary.main",
                color: "primary.main",
                "&:hover": {
                  borderColor: "primary.dark",
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              Change File
            </Button>
          </Stack>
        </Stack>
      )}
    </Box>
  );
}
