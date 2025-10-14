"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  Tooltip,
} from "@mui/material";
import {
  Save,
  Upload as UploadIcon,
  GetApp as Download,
  Refresh as RefreshCw,
  CheckCircle as CheckIcon,
  FileDownload as FileDownloadIcon,
  DeleteForeverOutlined,
} from "@mui/icons-material";
import { X } from "lucide-react";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import CustomToast from "@/components/common/CustomToast";
import logger from "@/utils/logger";
import type { FormValues } from "../types";
import { defaultFormValues } from "../data/defaultFormValues";
import { exportFormValues } from "../utils/presetUtils";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
export interface FormPresetsManagerProps {
  isOpen: boolean;
  isUploadSidebarOpen?: boolean;
  onClose: () => void;
  currentFormValues: FormValues;
  onLoadPreset: (preset: FormValues) => void;
  onExportForm?: () => void;
  onClearForm?: () => void;
}

// ==========================================
// CONSTANTS
// ==========================================
const DEFAULT_PRESETS: Record<string, FormValues> = {
  "Basic Ad Template": {
    ...defaultFormValues,
    projectName: "Basic Campaign",
    loglineConcept: "Simple and effective promotional messaging",
    brandName: "Brand Example",
    productName: "Product Example",
  },
  "Story-Driven Campaign": {
    ...defaultFormValues,
    projectName: "Story-Driven Campaign",
    loglineConcept: "Emotional journey that connects with audience",
    brandName: "Brand Example",
    productName: "Product Example",
    storyDetails: {
      ...defaultFormValues.storyDetails,
      narrativeStructure: "Hero's Journey",
      mood: "Inspirational",
    },
  },
  "Product Launch": {
    ...defaultFormValues,
    projectName: "Product Launch",
    loglineConcept: "Introducing an innovative solution",
    brandName: "Brand Example",
    productName: "New Product",
    campaignDetails: {
      ...defaultFormValues.campaignDetails,
      campaignName: "Launch Campaign",
      campaignGoal: "Introduce new product to the market",
    },
  },
};

const STORAGE_KEY = "adScriptGeneratorPresets";

/**
 * FormPresetsManager - Form preset management sidebar
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
 * - Proper dependency arrays
 * - Theme-aware styling (no hardcoded colors)
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors (primary instead of secondary)
 * - Uses brand config for fonts/spacing
 * - No hardcoded colors, fonts, or spacing
 * - Follows MUI v7 patterns
 * - Uses logger instead of console
 */
export default function FormPresetsManager({
  isOpen,
  isUploadSidebarOpen,
  onClose,
  currentFormValues,
  onLoadPreset,
  onExportForm,
  onClearForm,
}: FormPresetsManagerProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE & REFS
  // ==========================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presetName, setPresetName] = useState("");
  const [userPresets, setUserPresets] = useState<Record<string, FormValues>>(
    {}
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // ==========================================
  // EFFECTS
  // ==========================================
  // Load presets from localStorage on component mount
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedPresets = localStorage.getItem(STORAGE_KEY);
    if (savedPresets) {
      try {
        setUserPresets(JSON.parse(savedPresets));
      } catch (error) {
        logger.error("Failed to parse saved presets:", error);
        CustomToast("error", "There was an issue loading your saved presets");
      }
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (Object.keys(userPresets).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userPresets));
    }
  }, [userPresets]);

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const saveCurrentAsPreset = useCallback(() => {
    if (!presetName.trim()) {
      CustomToast("error", "Please provide a name for this preset");
      return;
    }

    setUserPresets((prev) => ({
      ...prev,
      [presetName]: { ...currentFormValues },
    }));

    CustomToast("success", `"${presetName}" has been saved for future use`);
    setPresetName("");
  }, [presetName, currentFormValues]);

  const downloadPreset = useCallback((name: string, preset: FormValues) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-preset.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    CustomToast("success", `"${name}" preset has been downloaded`);
  }, []);

  const handleExportCurrentForm = useCallback(() => {
    if (onExportForm) {
      onExportForm();
    } else {
      exportFormValues(
        currentFormValues,
        `adscript-${currentFormValues.projectName || "untitled"}.json`
      );
      CustomToast("success", "Form configuration exported successfully");
    }
  }, [onExportForm, currentFormValues]);

  const handleFileUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const preset = JSON.parse(event.target?.result as string);

          if (!preset.projectName || !preset.brandName || !preset.productName) {
            throw new Error("Invalid preset format");
          }

          const fileName = file.name.replace(/\.(json|txt)$/, "");
          const presetName = fileName
            .replace(/-/g, " ")
            .replace(/preset$/i, "")
            .trim();

          setUserPresets((prev) => ({
            ...prev,
            [presetName]: preset,
          }));

          CustomToast("success", `"${presetName}" has been imported and saved`);
        } catch (error) {
          logger.error("Failed to parse preset file:", error);
          CustomToast(
            "error",
            "The file does not contain a valid preset format"
          );
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      };

      reader.readAsText(file);
    },
    []
  );

  const loadPreset = useCallback(
    (preset: FormValues) => {
      onLoadPreset(preset);
      CustomToast(
        "success",
        "Form values have been updated with the selected preset"
      );
    },
    [onLoadPreset]
  );

  const removePreset = useCallback((name: string) => {
    setUserPresets((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    CustomToast("success", `"${name}" preset has been removed`);
  }, []);

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
        visibility: isOpen || !isUploadSidebarOpen ? "visible" : "hidden",
      }}
    >
      <Paper
        elevation={2}
        sx={{
          width: "300px",
          maxHeight: "calc(100vh - 200px)",
          overflow: "hidden",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px 0 0 ${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
          position: "relative",
          transition: "transform 0.3s cubic-bezier(0.17, 0.67, 0.83, 0.67)",
          transform: isOpen ? "translateX(0)" : "translateX(300px)",
          visibility: isOpen ? "visible" : "hidden",
          pointerEvents: isOpen ? "auto" : "none",
          zIndex: theme.zIndex.drawer,
        }}
      >
        <Box
          sx={{ p: 2.5, overflow: "auto", maxHeight: "calc(100vh - 200px)" }}
        >
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              mb: 3,
              width: "100%",
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
                  mr: 1,
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
                Form Presets
              </Typography>
            </Box>

            <Box sx={{ display: "flex", gap: 1 }}>
              <Tooltip title="Clear Form">
                <IconButton
                  size="small"
                  onClick={onClearForm}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "error.main",
                      bgcolor: alpha(theme.palette.error.main, 0.1),
                    },
                  }}
                >
                  <DeleteForeverOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Download Current Form">
                <IconButton
                  size="small"
                  onClick={handleExportCurrentForm}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "primary.main",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <FileDownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Close Sidebar">
                <IconButton
                  size="small"
                  onClick={onClose}
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: alpha(theme.palette.divider, 0.2),
                    },
                  }}
                >
                  <X size={18} />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Save Current Form as Preset */}
          <Paper
            variant="outlined"
            sx={{
              mb: 2,
              p: 2,
              bgcolor: "background.default",
              borderRadius: `${brand.borderRadius}px`,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: 22,
                  width: 4,
                  background: `linear-gradient(to bottom, ${alpha(
                    theme.palette.primary.main,
                    0.6
                  )}, ${alpha(theme.palette.primary.main, 0.25)})`,
                  mr: 1,
                  borderRadius: `${brand.borderRadius / 4}px`,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={500}
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Save Current Form
              </Typography>
            </Box>
            <Box sx={{ display: "flex", gap: 1 }}>
              <TextField
                id="presetName"
                placeholder="New preset name..."
                size="small"
                fullWidth
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                InputProps={{
                  sx: {
                    height: 36,
                    fontSize: "0.875rem",
                    fontFamily: brand.fonts.body,
                  },
                }}
                sx={{
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
              <Tooltip title="Save Preset">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={saveCurrentAsPreset}
                  sx={{
                    color: "primary.main",
                    "&:hover": {
                      color: "primary.dark",
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                    },
                  }}
                >
                  <Save fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Paper>

          {/* Import Preset */}
          <Box sx={{ mb: 3 }}>
            <input
              type="file"
              id="presetFile"
              accept=".json"
              style={{ display: "none" }}
              onChange={handleFileUpload}
              ref={fileInputRef}
            />
            <Button
              variant="outlined"
              size="medium"
              fullWidth
              startIcon={<UploadIcon fontSize="small" />}
              onClick={() => fileInputRef.current?.click()}
              sx={{
                textTransform: "none",
                height: 36,
                fontSize: "0.875rem",
                fontFamily: brand.fonts.body,
                borderColor: "divider",
                color: "text.primary",
                "&:hover": {
                  borderColor: "primary.main",
                  bgcolor: "action.hover",
                },
              }}
            >
              Import Preset
            </Button>
          </Box>

          {/* Default Presets Section */}
          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mb: 1.5,
              }}
            >
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: 22,
                  width: 4,
                  background: `linear-gradient(to bottom, ${alpha(
                    theme.palette.primary.main,
                    0.6
                  )}, ${alpha(theme.palette.primary.main, 0.25)})`,
                  mr: 1,
                  borderRadius: `${brand.borderRadius / 4}px`,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={500}
                sx={{
                  color: "text.primary",
                  fontFamily: brand.fonts.body,
                }}
              >
                Default Presets
              </Typography>
            </Box>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
              {Object.entries(DEFAULT_PRESETS).map(([name, preset]) => (
                <Paper
                  key={name}
                  variant="outlined"
                  onClick={() => setSelectedPreset(name)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    p: 1.5,
                    cursor: "pointer",
                    bgcolor:
                      selectedPreset === name
                        ? alpha(theme.palette.primary.main, 0.1)
                        : "background.paper",
                    borderColor:
                      selectedPreset === name
                        ? alpha(theme.palette.primary.main, 0.3)
                        : "divider",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: alpha(theme.palette.primary.main, 0.3),
                    },
                    borderRadius: `${brand.borderRadius}px`,
                    transition: "all 0.2s",
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1,
                      maxWidth: "70%",
                    }}
                  >
                    {selectedPreset === name && (
                      <CheckIcon sx={{ color: "primary.main", fontSize: 18 }} />
                    )}
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: selectedPreset === name ? 600 : 400,
                        color:
                          selectedPreset === name
                            ? "primary.main"
                            : "text.primary",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {name}
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", gap: 0.5 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        loadPreset(preset);
                      }}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <RefreshCw fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadPreset(name, preset);
                      }}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          color: "primary.main",
                          bgcolor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <Download fontSize="small" />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Box>
          </Box>

          {/* User Presets Section */}
          {Object.keys(userPresets).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Divider
                  orientation="vertical"
                  flexItem
                  sx={{
                    height: 22,
                    width: 4,
                    background: `linear-gradient(to bottom, ${alpha(
                      theme.palette.primary.main,
                      0.6
                    )}, ${alpha(theme.palette.primary.main, 0.25)})`,
                    mr: 1,
                    borderRadius: `${brand.borderRadius / 4}px`,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={500}
                  sx={{
                    color: "text.primary",
                    fontFamily: brand.fonts.body,
                  }}
                >
                  Your Presets
                </Typography>
              </Box>
              <Box
                sx={{
                  maxHeight: "200px",
                  overflowY: "auto",
                  pr: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                {Object.entries(userPresets).map(([name, preset]) => (
                  <Paper
                    key={name}
                    variant="outlined"
                    onClick={() => setSelectedPreset(name)}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      p: 1.5,
                      cursor: "pointer",
                      bgcolor:
                        selectedPreset === name
                          ? alpha(theme.palette.primary.main, 0.1)
                          : "background.paper",
                      borderColor:
                        selectedPreset === name
                          ? alpha(theme.palette.primary.main, 0.3)
                          : "divider",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderColor: alpha(theme.palette.primary.main, 0.3),
                      },
                      borderRadius: `${brand.borderRadius}px`,
                      transition: "all 0.2s",
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        maxWidth: "70%",
                      }}
                    >
                      {selectedPreset === name && (
                        <CheckIcon
                          sx={{ color: "primary.main", fontSize: 18 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: selectedPreset === name ? 600 : 400,
                          color:
                            selectedPreset === name
                              ? "primary.main"
                              : "text.primary",
                          fontFamily: brand.fonts.body,
                        }}
                      >
                        {name}
                      </Typography>
                    </Box>
                    <Box sx={{ display: "flex", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          loadPreset(preset);
                        }}
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <RefreshCw fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          downloadPreset(name, preset);
                        }}
                        sx={{
                          color: "text.secondary",
                          "&:hover": {
                            color: "primary.main",
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                          },
                        }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          removePreset(name);
                        }}
                        sx={{
                          color: "text.disabled",
                          "&:hover": {
                            color: "error.main",
                            bgcolor: alpha(theme.palette.error.main, 0.1),
                          },
                        }}
                      >
                        <X size={16} />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* Preset Detail View */}
          {selectedPreset && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: "background.default",
                borderRadius: `${brand.borderRadius}px`,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 1.5,
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <Divider
                    orientation="vertical"
                    flexItem
                    sx={{
                      height: 22,
                      width: 4,
                      background: `linear-gradient(to bottom, ${alpha(
                        theme.palette.primary.main,
                        0.6
                      )}, ${alpha(theme.palette.primary.main, 0.25)})`,
                      mr: 1,
                      borderRadius: `${brand.borderRadius / 4}px`,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight={500}
                    sx={{
                      color: "primary.main",
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {selectedPreset}
                  </Typography>
                </Box>
                <Tooltip title="Load Preset">
                  <IconButton
                    color="primary"
                    size="small"
                    onClick={() =>
                      loadPreset(
                        DEFAULT_PRESETS[selectedPreset] ||
                          userPresets[selectedPreset]
                      )
                    }
                    sx={{
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      "&:hover": {
                        bgcolor: alpha(theme.palette.primary.main, 0.2),
                      },
                    }}
                  >
                    <RefreshCw fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Box>
              <Box
                sx={{
                  color: "text.secondary",
                  pl: 2,
                  fontFamily: brand.fonts.body,
                }}
              >
                <Typography variant="body2" display="block" sx={{ mb: 0.5 }}>
                  <strong>Brand:</strong>{" "}
                  {DEFAULT_PRESETS[selectedPreset]?.brandName ||
                    userPresets[selectedPreset]?.brandName}
                </Typography>
                <Typography variant="body2" display="block" sx={{ mb: 0.5 }}>
                  <strong>Product:</strong>{" "}
                  {DEFAULT_PRESETS[selectedPreset]?.productName ||
                    userPresets[selectedPreset]?.productName}
                </Typography>
                <Typography variant="body2" display="block">
                  <strong>Concept:</strong>{" "}
                  {DEFAULT_PRESETS[selectedPreset]?.loglineConcept ||
                    userPresets[selectedPreset]?.loglineConcept}
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>
      </Paper>
    </Box>
  );
}

FormPresetsManager.displayName = "FormPresetsManager";
