"use client";

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
  DragHandle as DragIcon,
} from "@mui/icons-material";
import { alpha, useTheme } from "@mui/material/styles";
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

const AdditionalImagesUpload: React.FC<AdditionalImagesUploadProps> = ({
  isVisible,
  onToggle,
  onImagesUpdate,
  disabled = false,
  maxImages = 3,
  maxSizeMB = 10,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const prevUrlsRef = React.useRef<string[]>([]);

  // Calculate current state
  const successfulImages = images.filter((img) => img.status === "success");
  const hasMaxImages = images.length >= maxImages;
  const totalSizeMB = images.reduce(
    (acc, img) => acc + img.file.size / (1024 * 1024),
    0
  );
  const isOverSizeLimit = totalSizeMB > maxSizeMB;

  // FIX: Correct useEffect with proper dependencies
  const successfulImageUrls = React.useMemo(() => {
    return images
      .filter((img) => img.status === "success" && img.url)
      .map((img) => img.url!);
  }, [images]);

  React.useEffect(() => {
    // Only update parent when component is visible
    if (!isVisible) return;

    // Check if URLs actually changed
    const prevUrls = prevUrlsRef.current;
    const urlsChanged =
      successfulImageUrls.length !== prevUrls.length ||
      successfulImageUrls.some((url, index) => url !== prevUrls[index]);

    if (!urlsChanged) return;

    // Update the ref with current URLs
    prevUrlsRef.current = [...successfulImageUrls];

    console.log("Updating parent with URLs:", successfulImageUrls);
    onImagesUpdate(successfulImageUrls);
  }, [successfulImageUrls, onImagesUpdate, isVisible]);

  const createImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  const validateImageFile = (file: File): string | null => {
    // Check file type
    if (!file.type.startsWith("image/")) {
      return "Only image files are allowed";
    }

    // Check file size (individual file limit)
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > 5) {
      // Individual file limit
      return "Image must be less than 5MB";
    }

    return null;
  };

  const addImages = useCallback(
    (fileList: FileList) => {
      const files = Array.from(fileList);

      // Check total limit
      if (images.length + files.length > maxImages) {
        CustomToast("error", `Maximum ${maxImages} additional images allowed`);
        return;
      }

      // Validate and create image objects
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

        // Check total size
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
    [images, maxImages, maxSizeMB]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !hasMaxImages) {
        setIsDragging(true);
      }
    },
    [disabled, hasMaxImages]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || hasMaxImages) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addImages(e.dataTransfer.files);
      }
    },
    [disabled, hasMaxImages, addImages]
  );

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      addImages(event.target.files);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const removeImage = (id: string) => {
    const imageToRemove = images.find((img) => img.id === id);
    if (imageToRemove) {
      URL.revokeObjectURL(imageToRemove.preview);
    }
    setImages(images.filter((img) => img.id !== id));
  };

  const clearAllImages = () => {
    images.forEach((img) => URL.revokeObjectURL(img.preview));
    setImages([]);
  };

  const uploadImages = async () => {
    const imagesToUpload = images.filter((img) => img.status === "idle");
    if (imagesToUpload.length === 0) {
      CustomToast("warning", "No new images to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Update status to uploading
      const updatedImages = images.map((img) =>
        imagesToUpload.some((upload) => upload.id === img.id)
          ? { ...img, status: "uploading" as const, progress: 0 }
          : img
      );
      setImages(updatedImages);

      // Upload files
      const filesToUpload = imagesToUpload.map((img) => img.file);
      const result = await uploadFilesToGCS(filesToUpload, {
        onProgress: (progressInfo) => {
          // Update progress for all uploading files
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

      console.log("Upload result:", result);

      const finalImages = images.map((img) => {
        const uploadResult = result.files.find(
          (r: any) => r.originalName === img.file.name
        );

        if (uploadResult) {
          // Check if upload was successful and we have a path
          const isSuccess =
            uploadResult.success === true && !!uploadResult.path;

          // Convert the GCS path to a public URL (only if we have a valid path)
          const publicUrl =
            isSuccess && uploadResult.path
              ? convertPathToPublicUrl(uploadResult.path)
              : undefined;

          return {
            ...img,
            status: isSuccess ? ("success" as const) : ("error" as const),
            progress: isSuccess ? 100 : 0,
            url: publicUrl, // Use the converted public URL
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
      console.log("Final images after upload:", finalImages);

      // Count successful uploads
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

      // Mark uploading images as failed
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
  };

  // Cleanup object URLs on unmount
  React.useEffect(() => {
    return () => {
      images.forEach((img) => URL.revokeObjectURL(img.preview));
    };
  }, []);

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
          background:
            "linear-gradient(135deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0.7) 100%)",
          backdropFilter: "blur(15px)",
          borderRadius: "0 0 0 12px",
          border: "1px solid rgba(255,255,255,0.1)",
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
            <ImageIcon sx={{ color: "secondary.main", fontSize: 20 }} />
            <Typography variant="body2" color="white" fontWeight="medium">
              Additional Images
            </Typography>
            <Chip
              label={`${successfulImages.length}/${maxImages}`}
              size="small"
              color="secondary"
              sx={{ height: 20, fontSize: "0.75rem" }}
            />
          </Stack>
          <IconButton
            onClick={onToggle}
            sx={{ color: "white", p: 0.5 }}
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
            bgcolor: "rgba(33, 150, 243, 0.1)",
            color: "white",
            "& .MuiAlert-icon": { color: "info.main" },
            border: "1px solid rgba(33, 150, 243, 0.2)",
          }}
        >
          <Typography variant="caption">
            Add up to {maxImages} reference images for enhanced multi-image
            editing. Premium/Ultra users can use all images simultaneously.
          </Typography>
        </Alert>

        {/* Upload Area */}
        <Box
          sx={{
            border: 2,
            borderRadius: 2,
            borderColor: isDragging
              ? "secondary.main"
              : hasMaxImages
              ? "error.main"
              : "rgba(255,255,255,0.3)",
            borderStyle: "dashed",
            p: 2,
            textAlign: "center",
            bgcolor: isDragging
              ? alpha(theme.palette.secondary.main, 0.1)
              : hasMaxImages
              ? alpha(theme.palette.error.main, 0.05)
              : "rgba(255,255,255,0.02)",
            cursor: disabled || hasMaxImages ? "not-allowed" : "pointer",
            transition: "all 0.3s ease",
            mb: 2,
            opacity: disabled || hasMaxImages ? 0.6 : 1,
          }}
          onClick={() => {
            if (!disabled && !hasMaxImages) {
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
            disabled={disabled || hasMaxImages}
          />

          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              bgcolor: alpha(theme.palette.secondary.main, 0.2),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 1,
            }}
          >
            <AddIcon sx={{ color: "secondary.main", fontSize: 20 }} />
          </Box>

          <Typography variant="body2" color="white" sx={{ mb: 0.5 }}>
            {hasMaxImages
              ? "Maximum images reached"
              : "Drop images or click to browse"}
          </Typography>
          <Typography variant="caption" color="rgba(255,255,255,0.7)">
            JPG, PNG, WebP (Max {maxSizeMB}MB total)
          </Typography>
        </Box>

        {/* Size/Count Info */}
        <Stack
          direction="row"
          justifyContent="space-between"
          sx={{ mb: 2, px: 1 }}
        >
          <Typography variant="caption" color="rgba(255,255,255,0.8)">
            Images: {images.length}/{maxImages}
          </Typography>
          <Typography
            variant="caption"
            color={isOverSizeLimit ? "error.main" : "rgba(255,255,255,0.8)"}
            fontWeight={isOverSizeLimit ? 600 : 400}
          >
            Size: {totalSizeMB.toFixed(1)}/{maxSizeMB}MB
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
                background: "rgba(255,255,255,0.1)",
                borderRadius: "2px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255,255,255,0.3)",
                borderRadius: "2px",
                "&:hover": { background: "rgba(255,255,255,0.5)" },
              },
            }}
          >
            <Stack spacing={1}>
              {images.map((image, index) => (
                <Paper
                  key={image.id}
                  sx={{
                    p: 1.5,
                    bgcolor: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 1,
                    position: "relative",
                    "&:hover": {
                      bgcolor: "rgba(255,255,255,0.08)",
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
                        borderRadius: 1,
                        objectFit: "cover",
                        border: "1px solid rgba(255,255,255,0.2)",
                      }}
                    />

                    {/* File Info */}
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        variant="body2"
                        color="white"
                        noWrap
                        fontWeight="medium"
                      >
                        {image.file.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="rgba(255,255,255,0.7)"
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
                            sx={{ color: "secondary.main" }}
                          />
                          <Typography variant="caption" color="secondary.main">
                            {image.progress}%
                          </Typography>
                        </Box>
                      )}

                      {image.status === "success" && (
                        <Chip
                          label="Uploaded"
                          size="small"
                          color="success"
                          sx={{ mt: 0.5, height: 16, fontSize: "0.7rem" }}
                        />
                      )}

                      {image.status === "error" && (
                        <Chip
                          label="Failed"
                          size="small"
                          color="error"
                          sx={{ mt: 0.5, height: 16, fontSize: "0.7rem" }}
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
                          sx={{ color: "rgba(255,255,255,0.7)" }}
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
              color="secondary"
              onClick={uploadImages}
              disabled={
                isUploading ||
                images.every((img) => img.status === "success") ||
                isOverSizeLimit
              }
              startIcon={
                isUploading ? (
                  <CircularProgress size={16} color="inherit" />
                ) : (
                  <UploadIcon />
                )
              }
              sx={{ flex: 1 }}
            >
              {isUploading ? "Uploading..." : "Upload Images"}
            </Button>

            {images.length > 1 && (
              <Button
                variant="outlined"
                onClick={clearAllImages}
                disabled={isUploading}
                sx={{
                  color: "white",
                  borderColor: "rgba(255,255,255,0.3)",
                  "&:hover": {
                    borderColor: "rgba(255,255,255,0.5)",
                    bgcolor: "rgba(255,255,255,0.05)",
                  },
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
