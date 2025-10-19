"use client";

// GenericFileUpload.tsx - Production-ready multi-file upload with Firebase direct upload
import React, {
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
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
  Divider,
} from "@mui/material";
import {
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Description as FileIcon,
  Image as ImageIcon,
  PictureAsPdf as PdfIcon,
  Article as DocIcon,
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

export type FileFilterType = "all" | "images" | "documents";

interface GenericFileUploadProps {
  isVisible: boolean;
  isPresetsOpen?: boolean;
  onToggle: () => void;
  onClose: () => void;
  onFilesUpdate: (fileUrls: string[]) => void;
  disabled?: boolean;
  maxFiles?: number; // Default: 3
  maxSizeMB?: number; // Total limit, default: 10
  maxFileSizeMB?: number; // Per-file limit, default: 5
  title?: string; // Dialog title
  description?: string; // Help text
  fileFilter?: FileFilterType; // Filter file types: "all" | "images" | "documents"
}

interface UploadedFile {
  id: string;
  file: File;
  preview?: string; // Only for images
  url?: string;
  path?: string; // Storage path for cleanup
  status: "idle" | "uploading" | "success" | "error";
  progress: number;
  error?: string;
}

// ============================================
// CONSTANTS
// ============================================

const IMAGE_TYPES = ["image/"];

const DOCUMENT_TYPES = [
  "application/pdf", // PDF
  "application/msword", // DOC
  "application/vnd.openxmlformats-officedocument", // DOCX, XLSX, PPTX
  "application/vnd.ms-", // XLS, PPT (legacy)
  "text/plain", // TXT
  "application/json", // JSON
];

const ALL_ALLOWED_TYPES = [...IMAGE_TYPES, ...DOCUMENT_TYPES];

const FILE_TYPE_LABELS: Record<string, string> = {
  "image/": "Images",
  "application/pdf": "PDF",
  "application/msword": "DOC",
  "application/vnd.openxmlformats-officedocument": "Office",
  "application/vnd.ms-": "Office",
  "text/plain": "Text",
  "application/json": "JSON",
};

// ============================================
// HELPER FUNCTIONS
// ============================================

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return <ImageIcon />;
  if (fileType === "application/pdf") return <PdfIcon />;
  if (
    fileType.includes("document") ||
    fileType.includes("word") ||
    fileType.includes("sheet") ||
    fileType.includes("presentation")
  )
    return <DocIcon />;
  return <FileIcon />;
};

const isImageFile = (fileType: string) => fileType.startsWith("image/");

const getAllowedTypes = (filter: FileFilterType): string[] => {
  switch (filter) {
    case "images":
      return IMAGE_TYPES;
    case "documents":
      return DOCUMENT_TYPES;
    case "all":
    default:
      return ALL_ALLOWED_TYPES;
  }
};

const getAcceptString = (filter: FileFilterType): string => {
  switch (filter) {
    case "images":
      return "image/*";
    case "documents":
      return ".pdf,.doc,.docx,.xls,.xlsx,.txt,.json";
    case "all":
    default:
      return "image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.json";
  }
};

const getFileTypesLabel = (filter: FileFilterType): string => {
  switch (filter) {
    case "images":
      return "Images (JPG, PNG, WebP, GIF)";
    case "documents":
      return "Documents (PDF, DOC, DOCX, XLS, XLSX, TXT, JSON)";
    case "all":
    default:
      return "Images, PDF, DOC, DOCX, XLS, XLSX, TXT, JSON";
  }
};

// ============================================
// COMPONENT
// ============================================

const GenericFileUpload: React.FC<GenericFileUploadProps> = ({
  isVisible,
  isPresetsOpen = false,
  onToggle,
  onClose,
  onFilesUpdate,
  disabled = false,
  maxFiles = 3,
  maxSizeMB = 10,
  maxFileSizeMB = 5,
  title = "Upload Files",
  description = "Add reference files for processing",
  fileFilter = "all",
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Get allowed types based on filter
  const allowedTypes = useMemo(() => getAllowedTypes(fileFilter), [fileFilter]);

  // ============================================
  // MEMOIZED CALCULATIONS
  // ============================================

  const fileStats = useMemo(() => {
    const successfulFiles = files.filter((f) => f.status === "success");
    const hasMaxFiles = files.length >= maxFiles;
    const totalSizeMB = files.reduce(
      (acc, f) => acc + f.file.size / (1024 * 1024),
      0
    );
    const isOverSizeLimit = totalSizeMB > maxSizeMB;
    const pendingUploads = files.filter((f) => f.status === "idle").length;
    const failedUploads = files.filter((f) => f.status === "error").length;

    return {
      successfulFiles,
      hasMaxFiles,
      totalSizeMB,
      isOverSizeLimit,
      pendingUploads,
      failedUploads,
      successCount: successfulFiles.length,
    };
  }, [files, maxFiles, maxSizeMB]);

  // Memoized successful file URLs
  const successfulFileUrls = useMemo(() => {
    return files
      .filter((f) => f.status === "success" && f.url)
      .map((f) => f.url!);
  }, [files]);

  // ============================================
  // EFFECTS
  // ============================================

  // Update parent when successful URLs change
  useEffect(() => {
    if (!isVisible) return;
    onFilesUpdate(successfulFileUrls);
  }, [successfulFileUrls, onFilesUpdate, isVisible]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      files.forEach((f) => {
        if (f.preview && f.preview.startsWith("blob:")) {
          URL.revokeObjectURL(f.preview);
        }
      });
    };
  }, []); // Only on unmount

  // ============================================
  // FILE VALIDATION
  // ============================================

  const validateFile = useCallback(
    (file: File): string | null => {
      // Check file type
      const isAllowedType = allowedTypes.some((type) =>
        file.type.startsWith(type)
      );

      if (!isAllowedType) {
        return `File type not allowed. Supported: ${getFileTypesLabel(fileFilter)}`;
      }

      // Check file size
      const fileSizeMB = file.size / (1024 * 1024);
      if (fileSizeMB > maxFileSizeMB) {
        return `File must be less than ${maxFileSizeMB}MB`;
      }

      return null;
    },
    [allowedTypes, maxFileSizeMB, fileFilter]
  );

  // ============================================
  // FILE MANAGEMENT
  // ============================================

  const createFilePreview = useCallback((file: File): string | undefined => {
    if (isImageFile(file.type)) {
      return URL.createObjectURL(file);
    }
    return undefined;
  }, []);

  const addFiles = useCallback(
    (fileList: FileList) => {
      const newFilesArray = Array.from(fileList);

      // Check if adding files would exceed max
      if (files.length + newFilesArray.length > maxFiles) {
        CustomToast("error", `Maximum ${maxFiles} files allowed`, {
          details: `You can only add ${maxFiles - files.length} more file(s)`,
        });
        return;
      }

      const newFiles: UploadedFile[] = [];
      let validationErrors = 0;

      for (const file of newFilesArray) {
        const validationError = validateFile(file);
        if (validationError) {
          validationErrors++;
          if (newFilesArray.length === 1) {
            // Only show detailed error for single file
            CustomToast("error", validationError, {
              details: file.name,
            });
          }
          continue;
        }

        newFiles.push({
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          preview: createFilePreview(file),
          status: "idle",
          progress: 0,
        });
      }

      // Show summary error for multiple files
      if (validationErrors > 1) {
        CustomToast("error", `${validationErrors} file(s) rejected`, {
          details: "Check file size and type requirements",
        });
      }

      if (newFiles.length === 0) return;

      // Check total size
      const updatedFiles = [...files, ...newFiles];
      const newTotalSizeMB = updatedFiles.reduce(
        (acc, f) => acc + f.file.size / (1024 * 1024),
        0
      );

      if (newTotalSizeMB > maxSizeMB) {
        newFiles.forEach((f) => {
          if (f.preview) URL.revokeObjectURL(f.preview);
        });
        CustomToast("error", `Total size exceeds ${maxSizeMB}MB limit`, {
          details: `Current: ${newTotalSizeMB.toFixed(1)}MB`,
        });
        return;
      }

      setFiles(updatedFiles);
      CustomToast("success", `Added ${newFiles.length} file(s)`);
    },
    [files, maxFiles, maxSizeMB, validateFile, createFilePreview]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const fileToRemove = prev.find((f) => f.id === id);
      if (fileToRemove?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles((prev) => {
      prev.forEach((f) => {
        if (f.preview?.startsWith("blob:")) {
          URL.revokeObjectURL(f.preview);
        }
      });
      return [];
    });
    CustomToast("info", "All files cleared");
  }, []);

  // ============================================
  // DRAG & DROP HANDLERS
  // ============================================

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled && !fileStats.hasMaxFiles) {
        setIsDragging(true);
      }
    },
    [disabled, fileStats.hasMaxFiles]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      if (disabled || fileStats.hasMaxFiles) return;

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        addFiles(e.dataTransfer.files);
      }
    },
    [disabled, fileStats.hasMaxFiles, addFiles]
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        addFiles(event.target.files);
        // Reset input to allow selecting same file again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [addFiles]
  );

  // ============================================
  // UPLOAD HANDLER - PARALLEL UPLOADS
  // ============================================

  const uploadFiles = useCallback(async () => {
    const filesToUpload = files.filter((f) => f.status === "idle");

    if (filesToUpload.length === 0) {
      CustomToast("warning", "No new files to upload");
      return;
    }

    setIsUploading(true);

    try {
      // Set uploading state
      setFiles((prev) =>
        prev.map((f) =>
          filesToUpload.some((upload) => upload.id === f.id)
            ? { ...f, status: "uploading" as const, progress: 0 }
            : f
        )
      );

      // PARALLEL UPLOADS - Upload all files simultaneously
      const uploadPromises = filesToUpload.map((fileToUpload) =>
        uploadTempArtifact(fileToUpload.file, (progress) => {
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileToUpload.id
                ? { ...f, progress: progress.progress }
                : f
            )
          );
        })
          .then((result) => ({
            fileId: fileToUpload.id,
            result,
          }))
          .catch((error) => ({
            fileId: fileToUpload.id,
            result: {
              success: false,
              error: error instanceof Error ? error.message : "Upload failed",
            },
          }))
      );

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Update files with results
      let successCount = 0;
      let failCount = 0;

      setFiles((prev) =>
        prev.map((f) => {
          const uploadResult = results.find((r) => r.fileId === f.id);
          if (!uploadResult) return f;

          const { result } = uploadResult;

          if (result.success) {
            successCount++;
            return {
              ...f,
              status: "success" as const,
              url: result.url,
              path: result.path,
              progress: 100,
            };
          } else {
            failCount++;
            logger.error("Upload failed for:", f.file.name, result.error);
            return {
              ...f,
              status: "error" as const,
              error: result.error,
              progress: 0,
            };
          }
        })
      );

      // Show appropriate toast based on results
      if (successCount > 0 && failCount === 0) {
        CustomToast("success", `Successfully uploaded ${successCount} file(s)`);
      } else if (successCount > 0 && failCount > 0) {
        CustomToast("warning", "Upload completed with errors", {
          details: `${successCount} succeeded, ${failCount} failed`,
        });
      } else if (failCount > 0) {
        CustomToast("error", `Failed to upload ${failCount} file(s)`, {
          details: "Check console for details",
        });
      }
    } catch (error) {
      logger.error("Upload batch error:", error);
      CustomToast("error", "Upload process failed", {
        details: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUploading(false);
    }
  }, [files]);

  // ============================================
  // RENDER
  // ============================================

  return (
    <Box
      sx={{
        position: "fixed",
        right: 0,
        top: "33%",
        zIndex: theme.zIndex.drawer - 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        pointerEvents: isVisible ? "auto" : "none",
        visibility: isVisible || !isPresetsOpen ? "visible" : "hidden",
      }}
    >
      {/* Sidebar Panel */}
      <Fade in={isVisible}>
        <Paper
          elevation={8}
          sx={{
            width: 350,
            maxHeight: "calc(100vh - 200px)",
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px 0 0 ${brand.borderRadius}px`,
            boxShadow: theme.shadows[10],
            borderLeft: 2,
            borderTop: 2,
            borderBottom: 2,
            borderColor: "primary.main",
            overflow: "hidden",
            transition: theme.transitions.create(["transform", "opacity"], {
              duration: theme.transitions.duration.standard,
            }),
            transform: isVisible ? "translateX(0)" : "translateX(320px)",
            visibility: isVisible ? "visible" : "hidden",
            pointerEvents: isVisible ? "auto" : "none",
          }}
        >
          <Box
            sx={{
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxHeight: "calc(100vh - 200px)",
            }}
          >
            {/* Header */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 2,
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 30,
                    width: 4,
                    background: `linear-gradient(to bottom, ${alpha(
                      theme.palette.primary.main,
                      0.6
                    )}, ${alpha(theme.palette.primary.main, 0.25)})`,
                    mr: 2,
                    borderRadius: `${brand.borderRadius / 4}px`,
                  }}
                />
                <Stack spacing={0.5}>
                  <Typography
                    variant="h6"
                    fontWeight={600}
                    sx={{
                      fontFamily: brand.fonts.heading,
                      color: "text.primary",
                    }}
                  >
                    {title}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {description}
                  </Typography>
                </Stack>
              </Box>
              <IconButton
                size="small"
                onClick={onClose}
                disabled={isUploading}
                sx={{
                  color: "text.secondary",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                  },
                }}
              >
                <X size={18} />
              </IconButton>
            </Box>

            {/* Content Area - Scrollable */}
            <Box sx={{ flex: 1, overflow: "auto", mb: 2 }}>
              {/* Info Alert */}
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Upload up to {maxFiles} files ({maxFileSizeMB}MB each,{" "}
                  {maxSizeMB}MB total). Supported:{" "}
                  {getFileTypesLabel(fileFilter)}
                </Typography>
              </Alert>

              {/* Upload Area */}
              <Box
                sx={{
                  border: 3,
                  borderRadius: `${brand.borderRadius / 2}px`,
                  borderColor: isDragging
                    ? "primary.main"
                    : fileStats.hasMaxFiles
                      ? "error.main"
                      : "divider",
                  borderStyle: "dashed",
                  p: 3,
                  textAlign: "center",
                  bgcolor: isDragging
                    ? alpha(theme.palette.primary.main, 0.05)
                    : "background.paper",
                  cursor:
                    disabled || fileStats.hasMaxFiles
                      ? "not-allowed"
                      : "pointer",
                  transition: "all 0.3s ease",
                  mb: 2,
                  opacity: disabled || fileStats.hasMaxFiles ? 0.6 : 1,
                }}
                onClick={() => {
                  if (!disabled && !fileStats.hasMaxFiles) {
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
                  accept={getAcceptString(fileFilter)}
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  disabled={disabled || fileStats.hasMaxFiles}
                />

                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "50%",
                    bgcolor: alpha(theme.palette.primary.main, 0.15),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    mx: "auto",
                    mb: 1.5,
                  }}
                >
                  <AddIcon sx={{ color: "primary.main", fontSize: 24 }} />
                </Box>

                <Typography
                  variant="body2"
                  color="text.primary"
                  sx={{
                    mb: 0.5,
                    fontFamily: brand.fonts.body,
                    fontWeight: 500,
                  }}
                >
                  {fileStats.hasMaxFiles
                    ? "Maximum files reached"
                    : "Drop files or click to browse"}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  {getFileTypesLabel(fileFilter)}
                </Typography>
              </Box>

              {/* Stats */}
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
                  Files: {files.length}/{maxFiles}
                </Typography>
                <Typography
                  variant="caption"
                  color={
                    fileStats.isOverSizeLimit ? "error.main" : "text.secondary"
                  }
                  fontWeight={fileStats.isOverSizeLimit ? 600 : 400}
                  sx={{ fontFamily: brand.fonts.body }}
                >
                  Size: {fileStats.totalSizeMB.toFixed(1)}/{maxSizeMB}MB
                </Typography>
              </Stack>

              {/* Files List */}
              {files.length > 0 && (
                <Box>
                  <Stack spacing={1}>
                    {files.map((file) => (
                      <Paper
                        key={file.id}
                        sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.background.default, 0.5),
                          border: `1px solid ${theme.palette.divider}`,
                          borderRadius: `${brand.borderRadius}px`,
                          "&:hover": {
                            bgcolor: alpha(theme.palette.action.hover, 0.8),
                          },
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1.5}
                          alignItems="center"
                        >
                          {/* Preview/Icon */}
                          <Box
                            sx={{
                              position: "relative",
                              width: 40,
                              height: 40,
                              borderRadius: `${brand.borderRadius}px`,
                              overflow: "hidden",
                              flexShrink: 0,
                              border: `1px solid ${theme.palette.divider}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                            }}
                          >
                            {file.preview &&
                            file.status === "success" &&
                            file.url ? (
                              <img
                                src={file.url}
                                alt={file.file.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.file.name}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                              />
                            ) : (
                              <Box sx={{ color: "primary.main" }}>
                                {getFileIcon(file.file.type)}
                              </Box>
                            )}
                          </Box>

                          {/* Info */}
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              color="text.primary"
                              noWrap
                              fontWeight="medium"
                              sx={{ fontFamily: brand.fonts.body }}
                            >
                              {file.file.name}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ fontFamily: brand.fonts.body }}
                            >
                              {(file.file.size / (1024 * 1024)).toFixed(1)}MB
                            </Typography>

                            {/* Status */}
                            {file.status === "uploading" && (
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
                                  value={file.progress}
                                  sx={{ color: "primary.main" }}
                                />
                                <Typography
                                  variant="caption"
                                  color="primary.main"
                                >
                                  {file.progress}%
                                </Typography>
                              </Box>
                            )}

                            {file.status === "success" && (
                              <Chip
                                label="Uploaded"
                                size="small"
                                color="success"
                                sx={{
                                  mt: 0.5,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}

                            {file.status === "error" && (
                              <Chip
                                label={file.error || "Failed"}
                                size="small"
                                color="error"
                                sx={{
                                  mt: 0.5,
                                  height: 18,
                                  fontSize: "0.7rem",
                                }}
                              />
                            )}
                          </Box>

                          {/* Actions */}
                          <Tooltip title="Remove">
                            <IconButton
                              size="small"
                              onClick={() => removeFile(file.id)}
                              disabled={
                                isUploading && file.status === "uploading"
                              }
                              sx={{ color: "text.secondary" }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>

            {/* Actions - Fixed at bottom */}
            {files.length > 0 && (
              <Stack direction="row" spacing={1}>
                {files.length > 1 && (
                  <Button
                    variant="outlined"
                    onClick={clearAllFiles}
                    disabled={isUploading}
                    sx={{
                      borderColor: "primary.main",
                      color: "primary.main",
                      borderRadius: `${brand.borderRadius}px`,
                      fontFamily: brand.fonts.body,
                      "&:hover": {
                        borderColor: "primary.dark",
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    Clear All
                  </Button>
                )}

                <Button
                  variant="contained"
                  color="primary"
                  onClick={uploadFiles}
                  disabled={
                    isUploading ||
                    fileStats.pendingUploads === 0 ||
                    fileStats.isOverSizeLimit
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
                  {isUploading
                    ? "Uploading..."
                    : `Upload ${fileStats.pendingUploads} File(s)`}
                </Button>
              </Stack>
            )}
          </Box>
        </Paper>
      </Fade>
    </Box>
  );
};

export default GenericFileUpload;
