"use client";

// AdditionalImagesUpload.tsx - Fully theme-compliant and performance-optimized
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  IconButton,
  Paper,
  Stack,
  Chip,
  Fade,
  CircularProgress,
  Tooltip,
  Alert,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Image as ImageIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import CustomToast from "@/components/common/CustomToast";
import { uploadFilesToGCS } from "@/services/uploadService";
import { convertPathToPublicUrl } from "@/utils/imageUtils";

interface AdditionalImagesUploadProps {
  isVisible: boolean;
  onToggle: () => void;
  onImagesUpdate: (imageUrls: string[]) => void;
  disabled?: boolean;
  maxImages?: number;
  maxSizeMB?: number;
}

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  url?: string;
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

interface UploadFileResult {
  success: boolean;
  originalName: string;
  path?: string;
  url?: string;
  error?: string;
}

const AdditionalImagesUpload: React.FC<AdditionalImagesUploadProps> = ({
  isVisible,
  onToggle,
  onImagesUpdate,
  disabled = false,
  maxImages = 3,
  maxSizeMB = 10,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const prevUrlsRef = useRef<string[]>([]);

  // Memoized calculations
  const imageStats = useMemo(() => {
    const successfulImages = images.filter((img) => img.status === "success");
    const hasMaxImages = images.length >= maxImages;
    const totalSizeMB = images.reduce(
      (acc, img) => acc + img.file.size / (1024 * 1024),
      0
    );
    const isOverSizeLimit = totalSizeMB > maxSizeMB;

    return {
      successfulImages,
      hasMaxImages,
      totalSizeMB,
      isOverSizeLimit,
    };
  }, [images, maxImages, maxSizeMB]);

  // Memoized successful image URLs
  const successfulImageUrls = useMemo(() => {
    return images
      .filter((img) => img.status === "success" && img.url)
      .map((img) => img.url!);
  }, [images]);

  // Update parent when URLs change
  React.useEffect(() => {
    if (!isVisible) return;

    const prevUrls = prevUrlsRef.current;
    const urlsChanged =
      successfulImageUrls.length !== prevUrls.length ||
      successfulImageUrls.some((url, index) => url !== prevUrls[index]);

    if (!urlsChanged) return;

    prevUrlsRef.current = [...successfulImageUrls];
    onImagesUpdate(successfulImageUrls);
  }, [successfulImageUrls, onImagesUpdate, isVisible]);

  const createImagePreview = useCallback((file: File): string => {
    return URL.createObjectURL(file);
  }, []);

  const validateImageFile = useCallback((file: File): string | null => {
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed";
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      return "Image must be less than 5MB";
    }

    return null;
  }, []);

  const addImages = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);

      if (images.length + files.length > maxImages) {
        CustomToast("error", `Maximum ${maxImages} additional images allowed`);
        return;
      }

      const newImages: UploadedImage[] = [];
      for (const file of files) {
        const validationError = validateImageFile(file);
        if (validationError) {
          CustomToast("error", `${file.name}: ${validationError}`);
          continue;
        }

        newImages.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          preview: createImagePreview(file),
          status: "idle",
          progress: 0,
        });
      }

      if (newImages.length > 0) {
        const updatedImages = [...images, ...newImages];

        const newTotalSizeMB = updatedImages.reduce(
          (acc, img) => acc + img.file.size / (1024 * 1024),
          0
        );

        if (newTotalSizeMB > maxSizeMB) {
          CustomToast("error", `Total size exceeds ${maxSizeMB}MB limit`);
          return;
        }

        setImages(updatedImages);
        CustomToast("success", `Added ${newImages.length} image(s)`);
      }
    },
    [images, maxImages, maxSizeMB, validateImageFile, createImagePreview]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !imageStats.hasMaxImages) {
        setIsDragging(true);
      }
    },
    [disabled, imageStats.hasMaxImages]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || imageStats.hasMaxImages) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addImages(e.dataTransfer.files);
      }
    },
    [disabled, imageStats.hasMaxImages, addImages]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        addImages(event.target.files);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [addImages]
  );

  const removeImage = useCallback(
    (id: string) => {
      const imageToRemove = images.find((img) => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      setImages(images.filter((img) => img.id !== id));
    },
    [images]
  );

  const clearAllImages = useCallback(() => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  }, [images]);

  const uploadImages = useCallback(async () => {
    const imagesToUpload = images.filter((img) => img.status === "idle");
    if (imagesToUpload.length === 0) {
      CustomToast("warning", "No new images to upload");
      return;
    }

    setIsUploading(true);

    try {
      const updatedImages = images.map((img) =>
        imagesToUpload.some((upload) => upload.id === img.id)
          ? { ...img, status: "uploading" as const, progress: 0 }
          : img
      );
      setImages(updatedImages);

      const filesToUpload = imagesToUpload.map((img) => img.file);
      const result = await uploadFilesToGCS(filesToUpload, {
        onProgress: (progressInfo) => {
          setImages((prev) =>
            prev.map((img) => {
              if (img.status === "uploading") {
                return {
                  ...img,
                  progress: progressInfo.progress,
                };
              }
              return img;
            })
          );
        },
      });

      const finalImages = images.map((img) => {
        const uploadResult = result.files.find(
          (r: UploadFileResult) => r.originalName === img.file.name
        );

        if (uploadResult) {
          const isSuccess =
            uploadResult.success === true && !!uploadResult.path;

          const publicUrl =
            isSuccess && uploadResult.path
              ? convertPathToPublicUrl(uploadResult.path)
              : undefined;

          return {
            ...img,
            status: isSuccess ? ("success" as const) : ("error" as const),
            progress: isSuccess ? 100 : 0,
            url: publicUrl,
            error: !isSuccess ? "Upload failed - no path returned" : undefined,
          };
        }

        return {
          ...img,
          status: "error" as const,
          error: "Upload result not found",
        };
      });

      setImages(finalImages);

      const successCount = finalImages.filter(
        (img) => img.status === "success"
      ).length;
      const failCount = finalImages.filter(
        (img) => img.status === "error"
      ).length;

      if (successCount > 0) {
        CustomToast(
          "success",
          `Uploaded ${successCount} image(s) successfully`
        );
      }

      if (failCount > 0) {
        CustomToast("error", `Failed to upload ${failCount} image(s)`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      CustomToast("error", "Failed to upload images");

      setImages((prev) =>
        prev.map((img) =>
          img.status === "uploading"
            ? {
                ...img,
                status: "error" as const,
                error: error instanceof Error ? error.message : "Upload failed",
              }
            : img
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [images]);

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    const currentImages = images;
    return () => {
      currentImages.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, [images]);

  if (!isVisible) return null;

  return (
    <Fade in={isVisible}>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "350px",
          maxWidth: "45%",
          background: `linear-gradient(135deg, ${theme.palette.background.paper}f0 0%, ${theme.palette.background.paper}cc 50%, ${theme.palette.background.paper}b3 100%)`,
          backdropFilter: "blur(15px)",
          borderRadius: `0 0 0 ${brand.borderRadius * 1.5}px`,
          border: `1px solid ${theme.palette.divider}`,
          p: 2.5,
          maxHeight: "80%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ mb: 2 }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <ImageIcon
              sx={{
                color: "primary.main",
                fontSize: 20,
              }}
            />
            <Typography
              variant="body2"
              color="text.primary"
              fontWeight="medium"
              sx={{ fontFamily: brand.fonts.body }}
            >
              Additional Images
            </Typography>
            <Chip
              label={`${imageStats.successfulImages.length}/${maxImages}`}
              size="small"
              color="primary"
              sx={{
                height: 20,
                fontSize: "0.75rem",
                fontFamily: brand.fonts.body,
              }}
            />
          </Stack>
          <IconButton
            onClick={onToggle}
            color="primary"
            sx={{ p: 0.5 }}
            size="small"
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Info Alert */}
        <Alert
          severity="info"
          sx={{
            mb: 2,
            borderRadius: `${brand.borderRadius}px`,
            "& .MuiAlert-message": {
              fontFamily: brand.fonts.body,
            },
          }}
        >
          <Typography variant="caption" sx={{ fontFamily: brand.fonts.body }}>
            Add up to {maxImages} reference images for enhanced multi-image
            editing. Premium/Ultra users can use all images simultaneously.
          </Typography>
        </Alert>

        {/* Upload Area */}
        <Box
          sx={{
            border: 2,
            borderRadius: `${brand.borderRadius}px`,
            borderColor: isDragging
              ? "primary.main"
              : imageStats.hasMaxImages
                ? "error.main"
                : "divider",
            borderStyle: "dashed",
            p: 2,
            textAlign: "center",
            bgcolor: isDragging
              ? alpha(theme.palette.primary.main, 0.1)
              : imageStats.hasMaxImages
                ? alpha(theme.palette.error.main, 0.05)
                : theme.palette.action.hover,
            cursor:
              disabled || imageStats.hasMaxImages ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            mb: 2,
            opacity: disabled || imageStats.hasMaxImages ? 0.6 : 1,
          }}
          onClick={() => {
            if (!disabled && !imageStats.hasMaxImages) {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: "none" }}
            disabled={disabled || imageStats.hasMaxImages}
          />

          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.primary.main, 0.2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1,
            }}
          >
            <AddIcon sx={{ color: "primary.main", fontSize: 20 }} />
          </Box>

          <Typography
            variant="body2"
            color="text.primary"
            sx={{ mb: 0.5, fontFamily: brand.fonts.body }}
          >
            {imageStats.hasMaxImages
              ? "Maximum images reached"
              : "Drop images or click to browse"}
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            JPG, PNG, WebP (Max {maxSizeMB}MB total)
          </Typography>
        </Box>

        {/* Size/Count Info */}
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 2, px: 1 }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontFamily: brand.fonts.body }}
          >
            Images: {images.length}/{maxImages}
          </Typography>
          <Typography
            variant="caption"
            color={imageStats.isOverSizeLimit ? "error.main" : "text.secondary"}
            fontWeight={imageStats.isOverSizeLimit ? 600 : 400}
            sx={{ fontFamily: brand.fonts.body }}
          >
            Size: {imageStats.totalSizeMB.toFixed(1)}/{maxSizeMB}MB
          </Typography>
        </Stack>

        {/* Images List */}
        {images.length > 0 && (
          <Box
            sx={{
              flex: 1,
              overflow: "auto",
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-track": {
                background: theme.palette.action.hover,
                borderRadius: `${brand.borderRadius}px`,
              },
              "&::-webkit-scrollbar-thumb": {
                background: theme.palette.divider,
                borderRadius: `${brand.borderRadius}px`,
                "&:hover": { background: theme.palette.text.secondary },
              },
            }}
          >
            <Stack spacing={1}>
              {images.map((image) => (
                <Paper
                  key={image.id}
                  sx={{
                    p: 1.5,
                    bgcolor: theme.palette.action.hover,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: `${brand.borderRadius}px`,
                    position: "relative",
                    "&:hover": {
                      bgcolor: theme.palette.action.selected,
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Preview Image */}
                    <Box
                      component="img"
                      src={image.preview}
                      alt={image.file.name}
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: `${brand.borderRadius}px`,
                        objectFit: "cover",
                        border: `1px solid ${theme.palette.divider}`,
                      }}
                    />

                    {/* File Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        color="text.primary"
                        noWrap
                        fontWeight="medium"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        {image.file.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        {(image.file.size / (1024 * 1024)).toFixed(1)}MB
                      </Typography>

                      {/* Status Indicator */}
                      {image.status === "uploading" && (
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            mt: 0.5,
                          }}
                        >
                          <CircularProgress
                            size={12}
                            thickness={4}
                            variant="determinate"
                            value={image.progress}
                            color="primary"
                          />
                          <Typography
                            variant="caption"
                            color="primary.main"
                            sx={{ fontFamily: brand.fonts.body }}
                          >
                            {image.progress}%
                          </Typography>
                        </Box>
                      )}

                      {image.status === "success" && (
                        <Chip
                          label="Uploaded"
                          size="small"
                          color="success"
                          sx={{
                            mt: 0.5,
                            height: 16,
                            fontSize: "0.7rem",
                            fontFamily: brand.fonts.body,
                          }}
                        />
                      )}

                      {image.status === "error" && (
                        <Chip
                          label="Failed"
                          size="small"
                          color="error"
                          sx={{
                            mt: 0.5,
                            height: 16,
                            fontSize: "0.7rem",
                            fontFamily: brand.fonts.body,
                          }}
                        />
                      )}
                    </Box>

                    {/* Actions */}
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Remove image">
                        <IconButton
                          size="small"
                          onClick={() => removeImage(image.id)}
                          disabled={isUploading && image.status === "uploading"}
                          color="primary"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Actions */}
        {images.length > 0 && (
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={uploadImages}
              disabled={
                isUploading ||
                images.every((img) => img.status === "success") ||
                imageStats.isOverSizeLimit
              }
              startIcon={
                isUploading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <UploadIcon />
                )
              }
              sx={{
                flex: 1,
                borderRadius: `${brand.borderRadius}px`,
                fontFamily: brand.fonts.body,
              }}
            >
              {isUploading ? "Uploading..." : "Upload Images"}
            </Button>

            {images.length > 1 && (
              <Button
                variant="outlined"
                color="primary"
                onClick={clearAllImages}
                disabled={isUploading}
                sx={{
                  borderRadius: `${brand.borderRadius}px`,
                  fontFamily: brand.fonts.body,
                }}
              >
                Clear
              </Button>
            )}
          </Stack>
        )}
      </Box>
    </Fade>
  );
};

export default AdditionalImagesUpload;
