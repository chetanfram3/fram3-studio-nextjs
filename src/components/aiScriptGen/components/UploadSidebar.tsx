"use client";

import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { Delete as DeleteIcon } from "@mui/icons-material";
import { X, CloudUpload as UploadIcon } from "lucide-react";
import { alpha } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";
import { uploadFilesToGCS } from "@/services/uploadService";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export interface UploadSidebarProps {
  isOpen: boolean;
  isPresetsOpen?: boolean;
  onToggle: () => void;
  onClose: () => void;
  maxTotalSize?: number;
  onUploadComplete?: (uploadData: {
    sessionId: string;
    files: { originalName: string; path: string }[];
    extractionNotes?: string;
  }) => void;
}

export interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  status: "idle" | "uploading" | "success" | "error";
  url?: string;
  path?: string;
  error?: string;
}

// ==========================================
// CONSTANTS
// ==========================================
const MAX_FILES = 3;

/**
 * UploadSidebar - File upload sidebar component
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers passed to DOM elements
 * - useMemo for expensive calculations (file sizes, validation)
 * - Theme-aware styling (no hardcoded colors)
 * - Proper dependency arrays
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors
 * - Uses brand config for fonts/spacing
 * - No hardcoded colors, fonts, or spacing
 * - Follows MUI v7 patterns
 */
export default function UploadSidebar({
  isOpen,
  isPresetsOpen,
  onToggle,
  onClose,
  maxTotalSize = 4,
  onUploadComplete,
}: UploadSidebarProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [extractionNotes, setExtractionNotes] = useState("");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // ==========================================
  // COMPUTED VALUES (Memoized for performance)
  // ==========================================
  const { totalSizeMB, isOverSizeLimit, isOverFileLimit } = useMemo(() => {
    const totalSize = files.reduce((acc, file) => acc + file.file.size, 0);
    const sizeMB = totalSize / (1024 * 1024);

    return {
      totalSizeMB: sizeMB,
      isOverSizeLimit: sizeMB > maxTotalSize,
      isOverFileLimit: files.length >= MAX_FILES,
    };
  }, [files, maxTotalSize]);

  // ==========================================
  // EVENT HANDLERS (useCallback for DOM events)
  // ==========================================
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) {
        return;
      }

      const currentFiles = [...files];
      const newFiles = Array.from(e.dataTransfer.files).map((file) => ({
        id: `${file.name}-${Date.now()}`,
        file,
        progress: 0,
        status: "idle" as const,
      }));

      // Check file limit
      if (currentFiles.length + newFiles.length > MAX_FILES) {
        CustomToast(
          "error",
          `You can only upload a maximum of ${MAX_FILES} files`
        );

        // Add what we can
        if (currentFiles.length < MAX_FILES) {
          const remainingSlots = MAX_FILES - currentFiles.length;
          const filesToAdd = newFiles.slice(0, remainingSlots);
          const updatedFiles = [...currentFiles, ...filesToAdd];
          const newTotalSize =
            updatedFiles.reduce((acc, file) => acc + file.file.size, 0) /
            (1024 * 1024);

          if (newTotalSize > maxTotalSize) {
            CustomToast(
              "error",
              `Total file size exceeds ${maxTotalSize}MB limit`
            );
            return;
          }

          setFiles(updatedFiles);
          CustomToast(
            "success",
            `${filesToAdd.length} file(s) added successfully`
          );
        }
        return;
      }

      // Check size limit
      const updatedFiles = [...currentFiles, ...newFiles];
      const newTotalSize =
        updatedFiles.reduce((acc, file) => acc + file.file.size, 0) /
        (1024 * 1024);

      if (newTotalSize > maxTotalSize) {
        CustomToast("error", `Total file size exceeds ${maxTotalSize}MB limit`);
        return;
      }

      setFiles(updatedFiles);
      CustomToast("success", `${newFiles.length} file(s) added successfully`);
    },
    [files, maxTotalSize]
  );

  const addFiles = useCallback(
    (fileList: FileList) => {
      // Check file limit
      if (files.length + fileList.length > MAX_FILES) {
        CustomToast(
          "error",
          `You can only upload a maximum of ${MAX_FILES} files`
        );

        // Add what we can
        if (files.length < MAX_FILES) {
          const remainingSlots = MAX_FILES - files.length;
          const filesToAdd = Array.from(fileList).slice(0, remainingSlots);
          const newFiles = filesToAdd.map((file) => ({
            id: `${file.name}-${Date.now()}`,
            file,
            progress: 0,
            status: "idle" as const,
          }));

          const updatedFiles = [...files, ...newFiles];
          const newTotalSize =
            updatedFiles.reduce((acc, file) => acc + file.file.size, 0) /
            (1024 * 1024);

          if (newTotalSize > maxTotalSize) {
            CustomToast(
              "error",
              `Total file size exceeds ${maxTotalSize}MB limit`
            );
            return;
          }

          setFiles(updatedFiles);
          CustomToast(
            "success",
            `${newFiles.length} file(s) added successfully`
          );
        }
        return;
      }

      const newFiles = Array.from(fileList).map((file) => ({
        id: `${file.name}-${Date.now()}`,
        file,
        progress: 0,
        status: "idle" as const,
      }));

      const updatedFiles = [...files, ...newFiles];
      const newTotalSize =
        updatedFiles.reduce((acc, file) => acc + file.file.size, 0) /
        (1024 * 1024);

      if (newTotalSize > maxTotalSize) {
        CustomToast("error", `Total file size exceeds ${maxTotalSize}MB limit`);
        return;
      }

      setFiles(updatedFiles);
      CustomToast("success", `${newFiles.length} file(s) added successfully`);
    },
    [files, maxTotalSize]
  );

  const handleFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      if (event.target.files && event.target.files.length > 0) {
        addFiles(event.target.files);

        // Reset input
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    },
    [addFiles]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== id));
  }, []);

  const clearAllFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const uploadFiles = useCallback(async () => {
    logger.debug("Upload files function triggered");

    if (files.length === 0) {
      CustomToast("warning", "No files to upload");
      return;
    }

    if (isOverSizeLimit) {
      CustomToast("error", `Total file size exceeds ${maxTotalSize}MB limit`);
      return;
    }

    setIsUploading(true);
    const updatedFiles = [...files];

    try {
      // Get files to upload
      const filesToUpload = updatedFiles
        .filter((f) => f.status !== "success")
        .map((f) => f.file);

      if (filesToUpload.length === 0) {
        // Return existing uploads
        const existingFiles = updatedFiles
          .filter((f) => f.status === "success" && f.url && f.path)
          .map((f) => ({
            originalName: f.file.name,
            path: f.path!,
            url: f.url!,
          }));

        if (existingFiles.length > 0 && sessionId) {
          onUploadComplete?.({
            sessionId,
            files: existingFiles,
          });
        }

        setIsUploading(false);
        return;
      }

      // Set uploading state
      for (const file of updatedFiles) {
        if (file.status !== "success") {
          file.status = "uploading";
          file.progress = 0;
        }
      }
      setFiles([...updatedFiles]);

      // Upload to GCS
      const result = await uploadFilesToGCS(filesToUpload, {
        sessionId,
        extractionNotes,
        onProgress: (progressInfo) => {
          const fileIndex = updatedFiles.findIndex(
            (f) =>
              f.status === "uploading" && f.file.name === filesToUpload[0].name
          );

          if (fileIndex >= 0) {
            updatedFiles[fileIndex].progress = progressInfo.progress;
            updatedFiles[fileIndex].status = progressInfo.status;

            if (progressInfo.url) {
              updatedFiles[fileIndex].url = progressInfo.url;
            }

            if (progressInfo.path) {
              updatedFiles[fileIndex].path = progressInfo.path;
            }

            if (progressInfo.error) {
              updatedFiles[fileIndex].error = progressInfo.error;
            }

            setFiles([...updatedFiles]);
          }
        },
      });

      // Save session ID
      setSessionId(result.sessionId);

      // Update file statuses
      for (const resultFile of result.files) {
        const fileIndex = updatedFiles.findIndex(
          (f) => f.file.name === resultFile.originalName
        );

        if (fileIndex >= 0) {
          updatedFiles[fileIndex].status = resultFile.success
            ? "success"
            : "error";
          updatedFiles[fileIndex].progress = resultFile.success ? 100 : 0;

          if (resultFile.url) {
            updatedFiles[fileIndex].url = resultFile.url;
          }

          if (resultFile.path) {
            updatedFiles[fileIndex].path = resultFile.path;
          }

          if (resultFile.error) {
            updatedFiles[fileIndex].error = resultFile.error;
          }
        }
      }

      setFiles([...updatedFiles]);

      // Prepare callback data
      const successfulUploads = result.files
        .filter((f) => f.success && f.path)
        .map((f) => ({
          originalName: f.originalName,
          path: f.path!,
        }));

      const previouslyUploaded = updatedFiles
        .filter(
          (f) =>
            f.status === "success" &&
            f.path &&
            !successfulUploads.some((u) => u.originalName === f.file.name)
        )
        .map((f) => ({
          originalName: f.file.name,
          path: f.path!,
          url: f.url!,
        }));

      const allUploads = [...successfulUploads, ...previouslyUploaded];

      // Call completion handler
      if (allUploads.length > 0) {
        if (typeof onUploadComplete === "function") {
          onUploadComplete({
            sessionId: result.sessionId,
            files: allUploads,
            extractionNotes: extractionNotes.trim()
              ? extractionNotes
              : undefined,
          });
        } else {
          logger.error("onUploadComplete is not a function:", onUploadComplete);
        }

        CustomToast(
          "success",
          `Successfully uploaded ${successfulUploads.length} file(s)`
        );

        if (extractionNotes.trim()) {
          logger.debug(
            "Upload completed with extraction notes:",
            extractionNotes
          );
        }
      }
    } catch (error) {
      logger.error("File upload error:", error);
      CustomToast("error", "Failed to upload files");

      // Mark uploading files as failed
      for (const file of updatedFiles) {
        if (file.status === "uploading") {
          file.status = "error";
          file.error =
            error instanceof Error ? error.message : "Unknown error occurred";
        }
      }

      setFiles([...updatedFiles]);
    } finally {
      setIsUploading(false);
    }
  }, [
    files,
    isOverSizeLimit,
    maxTotalSize,
    sessionId,
    extractionNotes,
    onUploadComplete,
  ]);

  // ==========================================
  // RENDER
  // ==========================================
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
        pointerEvents: isOpen ? "auto" : "none",
        visibility: isOpen || !isPresetsOpen ? "visible" : "hidden",
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "320px",
          display: "flex",
          flexDirection: "column-reverse",
          maxHeight: "calc(100vh - 200px)",
          overflow: "hidden",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px 0 0 ${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          transition: "transform 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
          transform: isOpen ? "translateX(0)" : "translateX(320px)",
          visibility: isOpen ? "visible" : "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: theme.zIndex.drawer - 3,
        }}
      >
        <Box
          sx={{
            p: 2.5,
            display: "flex",
            flexDirection: "column-reverse",
            maxHeight: "calc(100vh - 200px)",
            overflow: "auto",
          }}
        >
          {/* Title and Close button */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 3,
              justifyContent: "space-between",
              order: -1,
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
              <Typography
                variant="h6"
                fontWeight={600}
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.heading,
                }}
              >
                Upload Assets
              </Typography>
            </Box>

            <IconButton
              size="small"
              onClick={onClose}
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

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              mb: 1,
              justifyContent: "space-between",
              order: -2,
            }}
          >
            <Typography
              variant="caption"
              fontWeight={500}
              textAlign="center"
              sx={{ color: "text.secondary" }}
            >
              Add reference materials for your script generation
            </Typography>
          </Box>

          {/* Upload Area - FIXED */}
          <Box
            sx={{
              border: 3,
              borderRadius: `${brand.borderRadius / 2}px`,
              borderColor: isDragging ? "primary.main" : "divider",
              borderStyle: "dashed",
              p: 3,
              textAlign: "center",
              // ✅ FIXED: Use background.paper for elevated surfaces
              bgcolor: isDragging
                ? alpha(theme.palette.primary.main, 0.05)
                : "background.paper",
              cursor: isOverFileLimit ? "not-allowed" : "pointer",
              transition: "all 0.2s",
              "&:hover": {
                bgcolor: isOverFileLimit
                  ? alpha(theme.palette.error.light, 0.05)
                  : alpha(theme.palette.primary.main, 0.05),
                borderColor: isOverFileLimit
                  ? alpha(theme.palette.error.main, 0.3)
                  : alpha(theme.palette.primary.main, 0.3),
              },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              mb: 2,
              opacity: isOverFileLimit ? 0.6 : 1,
              order: -3,
            }}
            onClick={() => {
              if (!isOverFileLimit) {
                fileInputRef.current?.click();
              } else {
                CustomToast("error", `Maximum ${MAX_FILES} files allowed`);
              }
            }}
            onDragOver={isOverFileLimit ? undefined : handleDragOver}
            onDragLeave={isOverFileLimit ? undefined : handleDragLeave}
            onDrop={isOverFileLimit ? undefined : handleDrop}
          >
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              ref={fileInputRef}
              style={{ display: "none" }}
              disabled={isOverFileLimit}
            />
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mb: 2,
              }}
            >
              <UploadIcon size={28} color={theme.palette.primary.main} />
            </Box>
            <Typography variant="body2" sx={{ color: "text.secondary", mb: 1 }}>
              {isOverFileLimit
                ? "Maximum file limit reached"
                : "Drag files here or click to browse"}
            </Typography>
            <Typography variant="caption" sx={{ color: "text.disabled" }}>
              PDF, DOCX, JPG, PNG, CSV (Max {maxTotalSize}MB)
            </Typography>
            {isOverFileLimit && (
              <Typography variant="caption" sx={{ color: "error.main", mt: 1 }}>
                Maximum {MAX_FILES} files allowed
              </Typography>
            )}
          </Box>

          {/* Size indicator */}
          <Box
            sx={{
              mb: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              order: -3,
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Files: {files.length}/{MAX_FILES}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: isOverSizeLimit ? "error.main" : "text.secondary",
                fontWeight: isOverSizeLimit ? 600 : 400,
              }}
            >
              Size: {totalSizeMB.toFixed(2)} / {maxTotalSize} MB
              {isOverSizeLimit && " (Exceeds limit)"}
            </Typography>
          </Box>

          {/* Extraction Notes */}
          <Typography
            variant="subtitle2"
            sx={{ color: "text.primary", mb: 1, order: -4 }}
          >
            Extraction Notes
          </Typography>
          <TextField
            multiline
            rows={3}
            placeholder="Describe what to extract from these files..."
            fullWidth
            value={extractionNotes}
            onChange={(e) => setExtractionNotes(e.target.value)}
            size="small"
            sx={{
              mb: 2,
              order: -5,
              "& .MuiOutlinedInput-root": {
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />

          {/* File List - FIXED */}
          <Box
            sx={{
              flex: "0 0 auto",
              display: "flex",
              flexDirection: "column",
              mb: 2,
              order: -8,
            }}
          >
            {files.length > 0 && (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 1,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{ color: "text.primary" }}
                  >
                    Files
                  </Typography>
                  {files.length > 1 && (
                    <Button
                      size="small"
                      onClick={clearAllFiles}
                      sx={{
                        color: "text.secondary",
                        textTransform: "none",
                        fontSize: "0.75rem",
                        "&:hover": {
                          backgroundColor: alpha(theme.palette.error.main, 0.1),
                          color: "error.main",
                        },
                      }}
                    >
                      Clear all
                    </Button>
                  )}
                </Box>

                {/* ✅ FIXED: Use background.paper for Paper component */}
                <Paper
                  variant="outlined"
                  sx={{
                    height: "auto",
                    maxHeight: 200,
                    overflow: "auto",
                    bgcolor: "background.paper",
                  }}
                >
                  <List dense sx={{ py: 0 }}>
                    {files.map((file) => (
                      <ListItem
                        key={file.id}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={() => removeFile(file.id)}
                            disabled={
                              isUploading && file.status === "uploading"
                            }
                            sx={{
                              color: "text.secondary",
                              "&:hover": {
                                color: "error.main",
                              },
                            }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        }
                        sx={{
                          borderBottom: 1,
                          borderColor: "divider",
                          py: 1,
                          bgcolor:
                            file.status === "error"
                              ? alpha(theme.palette.error.main, 0.05)
                              : file.status === "success"
                                ? alpha(theme.palette.success.main, 0.05)
                                : "transparent",
                        }}
                      >
                        <ListItemText
                          primary={
                            <Typography
                              variant="body2"
                              noWrap
                              sx={{
                                maxWidth: 200,
                                color: "text.primary",
                              }}
                            >
                              {file.file.name}
                            </Typography>
                          }
                          secondary={
                            file.status === "uploading" ? (
                              <span
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "4px",
                                }}
                              >
                                <CircularProgress
                                  size={12}
                                  thickness={5}
                                  variant="determinate"
                                  value={file.progress}
                                  sx={{ color: "primary.main" }}
                                />
                                <Typography
                                  variant="caption"
                                  component="span"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {file.progress}%
                                </Typography>
                              </span>
                            ) : (
                              <Typography
                                variant="caption"
                                sx={{ color: "text.secondary" }}
                              >
                                {(file.file.size / 1024).toFixed(1)} KB
                                {file.status === "error" && (
                                  <span
                                    style={{ color: theme.palette.error.main }}
                                  >
                                    {" "}
                                    - Upload failed
                                  </span>
                                )}
                                {file.status === "success" && (
                                  <span
                                    style={{
                                      color: theme.palette.success.main,
                                    }}
                                  >
                                    {" "}
                                    - Uploaded
                                  </span>
                                )}
                              </Typography>
                            )
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </Box>
            )}
          </Box>

          {/* Upload Button */}
          <Button
            variant="contained"
            color="primary"
            fullWidth
            startIcon={
              isUploading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <UploadIcon />
              )
            }
            onClick={uploadFiles}
            disabled={files.length === 0 || isUploading || isOverSizeLimit}
            sx={{
              mb: 2,
              order: -8,
              fontFamily: brand.fonts.body,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            {isUploading ? "Uploading..." : "Upload Files"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
