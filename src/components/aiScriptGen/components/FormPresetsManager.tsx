import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  TextField,
  IconButton,
  Paper,
  Divider,
  useTheme,
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
import CustomToast from "@/components/common/CustomToast";
import { FormValues } from "../types";
import { defaultFormValues } from "../data/defaultFormValues";
import logger from "@/utils/logger";
import { alpha } from "@mui/material/styles";
import { exportFormValues } from "../utils/presetUtils";

// Default presets that will always be available
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

export interface FormPresetsManagerProps {
  isOpen: boolean;
  isUploadSidebarOpen?: boolean; // Add this prop
  onClose: () => void;
  currentFormValues: FormValues;
  onLoadPreset: (preset: FormValues) => void;
  onExportForm?: () => void;
  onClearForm?: () => void;
}

const FormPresetsManager: React.FC<FormPresetsManagerProps> = ({
  isOpen,
  isUploadSidebarOpen,
  onClose,
  currentFormValues,
  onLoadPreset,
  onExportForm,
  onClearForm,
}) => {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [presetName, setPresetName] = useState("");
  const [userPresets, setUserPresets] = useState<Record<string, FormValues>>(
    {}
  );
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Load presets from localStorage on component mount
  useEffect(() => {
    const savedPresets = localStorage.getItem("adScriptGeneratorPresets");
    if (savedPresets) {
      try {
        setUserPresets(JSON.parse(savedPresets));
      } catch (error) {
        console.error("Failed to parse saved presets:", error);
        CustomToast("error", "There was an issue loading your saved presets");
      }
    }
  }, []);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    if (Object.keys(userPresets).length > 0) {
      localStorage.setItem(
        "adScriptGeneratorPresets",
        JSON.stringify(userPresets)
      );
    }
  }, [userPresets]);

  const saveCurrentAsPreset = () => {
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
  };

  const downloadPreset = (name: string, preset: FormValues) => {
    const dataStr = JSON.stringify(preset, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.download = `${name.replace(/\s+/g, "-").toLowerCase()}-preset.json`;
    link.href = url;
    link.click();

    URL.revokeObjectURL(url);

    CustomToast("success", `"${name}" preset has been downloaded`);
  };

  // Handle exporting current form
  const handleExportCurrentForm = () => {
    if (onExportForm) {
      // Use custom handler if provided
      onExportForm();
    } else {
      // Default export behavior
      exportFormValues(
        currentFormValues,
        `adscript-${currentFormValues.projectName || "untitled"}.json`
      );
      CustomToast("success", "Form configuration exported successfully");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const preset = JSON.parse(event.target?.result as string);

        // Basic validation that it looks like a FormValues object
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
        console.error("Failed to parse preset file:", error);
        CustomToast("error", "The file does not contain a valid preset format");
      }

      // Clear the file input for future use
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    };

    reader.readAsText(file);
  };

  const loadPreset = (preset: FormValues) => {
    onLoadPreset(preset);
    CustomToast(
      "success",
      "Form values have been updated with the selected preset"
    );
  };

  const removePreset = (name: string) => {
    setUserPresets((prev) => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });

    CustomToast("success", `"${name}" preset has been removed`);
  };

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
      {/* Toggle and Action Buttons */}

      {/* Sidebar Container */}
      <Paper
        elevation={2}
        sx={{
          width: "300px",
          maxHeight: "calc(100vh - 200px)",
          overflow: "hidden",
          bgcolor: "background.paper",
          borderRadius: "8px 0 0 8px",
          border: "1px solid",
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
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between", // This pushes items to the edges
              mb: 3,
              width: "100%", // Ensure it takes full width
            }}
          >
            {/* Left side with divider and title grouped together */}
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Divider
                orientation="vertical"
                flexItem
                sx={{
                  height: 30,
                  width: 4,
                  background: (theme) =>
                    `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                  mr: 1, // Changed to 1
                  borderRadius: 2,
                }}
              />
              <Typography variant="h6" fontWeight={600}>
                Form Presets
              </Typography>
            </Box>

            {/* Right side with the buttons grouped together */}
            <Box sx={{ display: "flex", gap: 2 }}>
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
                  onClick={onClose} // This uses the existing onClose prop
                  sx={{
                    color: "text.secondary",
                    "&:hover": {
                      color: "text.primary",
                      bgcolor: alpha(theme.palette.grey[500], 0.1),
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
              bgcolor: theme.palette.background.default,
              borderRadius: 1,
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
                  background: (theme) =>
                    `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                  mr: 1,
                  borderRadius: 2,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={500}
                sx={{ color: "text.primary" }}
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
                  },
                }}
              />
              <Tooltip title="Save Preset">
                <IconButton
                  color="primary"
                  size="small"
                  onClick={saveCurrentAsPreset}
                  sx={{
                    color: theme.palette.secondary.main,
                    "&:hover": {
                      color: theme.palette.secondary.dark,
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
                  background: (theme) =>
                    `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                  mr: 1,
                  borderRadius: 2,
                }}
              />
              <Typography
                variant="subtitle2"
                fontWeight={500}
                sx={{ color: "text.primary" }}
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
                        ? alpha(theme.palette.secondary.main, 0.1)
                        : "background.paper",
                    borderColor:
                      selectedPreset === name
                        ? alpha(theme.palette.secondary.main, 0.3)
                        : "divider",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.1),
                      borderColor: alpha(theme.palette.secondary.main, 0.3),
                    },
                    borderRadius: 1,
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
                        sx={{ color: "secondary.main", fontSize: 18 }}
                      />
                    )}
                    <Typography
                      variant="body2"
                      noWrap
                      sx={{
                        fontWeight: selectedPreset === name ? 600 : 400,
                        color:
                          selectedPreset === name
                            ? "secondary.main"
                            : "text.primary",
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
                    background: (theme) =>
                      `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                    mr: 1,
                    borderRadius: 2,
                  }}
                />
                <Typography
                  variant="subtitle2"
                  fontWeight={500}
                  sx={{ color: "text.primary" }}
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
                          ? alpha(theme.palette.secondary.main, 0.1)
                          : "background.paper",
                      borderColor:
                        selectedPreset === name
                          ? alpha(theme.palette.secondary.main, 0.3)
                          : "divider",
                      "&:hover": {
                        bgcolor: alpha(theme.palette.secondary.main, 0.1),
                        borderColor: alpha(theme.palette.secondary.main, 0.3),
                      },
                      borderRadius: 1,
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
                          sx={{ color: "secondary.main", fontSize: 18 }}
                        />
                      )}
                      <Typography
                        variant="body2"
                        noWrap
                        sx={{
                          fontWeight: selectedPreset === name ? 600 : 400,
                          color:
                            selectedPreset === name
                              ? "secondary.main"
                              : "text.primary",
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
                        color="inherit"
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
                        <X fontSize="small" />
                      </IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Box>
          )}

          {/* Preset Detail View - if a preset is selected */}
          {selectedPreset && (
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                bgcolor: theme.palette.background.default,
                borderRadius: 1,
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
                      background: (theme) =>
                        `linear-gradient(to bottom, ${theme.palette.secondary.main}99, ${theme.palette.secondary.main}40)`,
                      mr: 1,
                      borderRadius: 2,
                    }}
                  />
                  <Typography
                    variant="subtitle2"
                    fontWeight={500}
                    color="secondary.main"
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
              <Box sx={{ color: "text.secondary", pl: 2 }}>
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
};

export default FormPresetsManager;
