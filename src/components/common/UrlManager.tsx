"use client";

/**
 * URL Manager Component
 * Compact, smart URL management with validation and type detection
 * @version 1.0.0
 */

import React, { useState, useCallback, useMemo } from "react";
import {
  Box,
  Paper,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  Chip,
  Typography,
  Tooltip,
  Collapse,
  Alert,
  InputAdornment,
  Divider,
  Button,
  Stack,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Link as LinkIcon,
  Warning as WarningIcon,
  Inventory as ProductIcon,
  Storefront as BrandIcon,
  Image as ImageIcon,
  AttachMoney as MoneyIcon,
  YouTube as YouTubeIcon,
  LinkedIn as LinkedInIcon,
  X as XIcon,
  Facebook as FacebookIcon,
  Instagram as InstagramIcon,
  Analytics as AnalyticsIcon,
  Extension as ExtensionIcon,
  ContentCopy as CopyIcon,
  OpenInNew as OpenIcon,
  FileDownload as ExportIcon,
  FileUpload as ImportIcon,
} from "@mui/icons-material";

import {
  UrlEntry,
  UrlType,
  UrlManagerProps,
  URL_TYPE_LABELS,
  DEFAULT_CONFIG,
} from "@/types/urlManagerTypes";
import {
  validateUrl,
  validateCustomTypeLabel,
  isDuplicateUrl,
  sanitizeUrlForDisplay,
  generateUrlEntryId,
  suggestUrlType,
  validateUrlEntries,
} from "@/utils/urlValidationUtils";

/**
 * Icon mapping for URL types
 */
const URL_TYPE_ICON_COMPONENTS: Record<UrlType, React.ReactNode> = {
  [UrlType.GENERIC]: <LinkIcon />,
  [UrlType.PRODUCT]: <ProductIcon />,
  [UrlType.BRAND]: <BrandIcon />,
  [UrlType.LOGO]: <ImageIcon />,
  [UrlType.FINANCIALS]: <MoneyIcon />,
  [UrlType.YOUTUBE]: <YouTubeIcon />,
  [UrlType.LINKEDIN]: <LinkedInIcon />,
  [UrlType.TWITTER]: <XIcon />,
  [UrlType.FACEBOOK]: <FacebookIcon />,
  [UrlType.INSTAGRAM]: <InstagramIcon />,
  [UrlType.COMPARATIVE]: <AnalyticsIcon />,
  [UrlType.CUSTOM]: <ExtensionIcon />,
};

/**
 * Single URL entry display component
 */
interface UrlEntryItemProps {
  entry: UrlEntry;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}

const UrlEntryItem: React.FC<UrlEntryItemProps> = ({
  entry,
  onEdit,
  onDelete,
  readOnly = false,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(entry.url);
  }, [entry.url]);

  const handleOpen = useCallback(() => {
    window.open(entry.url, "_blank", "noopener,noreferrer");
  }, [entry.url]);

  const typeLabel =
    entry.type === UrlType.CUSTOM && entry.customTypeLabel
      ? entry.customTypeLabel
      : URL_TYPE_LABELS[entry.type];

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        borderRadius: `${brand.borderRadius}px`,
        border: `1px solid ${theme.palette.divider}`,
        transition: theme.transitions.create([
          "border-color",
          "background-color",
        ]),
        "&:hover": {
          borderColor: theme.palette.primary.main,
          bgcolor: `${theme.palette.primary.main}05`,
        },
      }}
    >
      {/* Type Icon */}
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: `${brand.borderRadius / 2}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: `${theme.palette.primary.main}15`,
          color: "primary.main",
          flexShrink: 0,
        }}
      >
        {URL_TYPE_ICON_COMPONENTS[entry.type]}
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={typeLabel}
            size="small"
            sx={{
              height: 20,
              fontSize: "0.75rem",
              bgcolor: `${theme.palette.primary.main}10`,
              color: "primary.main",
              fontWeight: 600,
            }}
          />
          {entry.label && (
            <Typography
              variant="caption"
              sx={{
                color: "text.secondary",
                fontWeight: 500,
              }}
            >
              {entry.label}
            </Typography>
          )}
        </Stack>
        <Tooltip title={entry.url} placement="top">
          <Typography
            variant="body2"
            sx={{
              color: "text.primary",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              mt: 0.5,
              fontSize: "0.875rem",
            }}
          >
            {sanitizeUrlForDisplay(entry.url, 50)}
          </Typography>
        </Tooltip>
      </Box>

      {/* Actions */}
      {!readOnly && (
        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Copy URL">
            <IconButton
              size="small"
              onClick={handleCopy}
              sx={{ color: "text.secondary" }}
            >
              <CopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Open in new tab">
            <IconButton
              size="small"
              onClick={handleOpen}
              sx={{ color: "text.secondary" }}
            >
              <OpenIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={onEdit}
              sx={{ color: "primary.main" }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={onDelete}
              sx={{
                color: "error.main",
                "&:hover": { bgcolor: `${theme.palette.error.main}15` },
              }}
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      )}
    </Paper>
  );
};

/**
 * Main UrlManager Component
 */
export const UrlManager: React.FC<UrlManagerProps> = ({
  value = [],
  onChange,
  config,
  disabled = false,
  error,
  helperText,
  label = "URLs",
  required = false,
}) => {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Merge config with defaults
  const finalConfig = useMemo(
    () => ({ ...DEFAULT_CONFIG, ...config }),
    [config]
  );

  // State
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [typeInput, setTypeInput] = useState<UrlType>(UrlType.GENERIC);
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(
    null
  );

  // Check if at max capacity
  const isAtMaxCapacity = value.length >= finalConfig.maxUrls;

  // Import/Export handlers
  const handleExport = useCallback(() => {
    const dataStr = JSON.stringify(value, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `urls-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [value]);

  const handleImport = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(
            e.target?.result as string
          ) as UrlEntry[];

          // Validate imported data
          if (!Array.isArray(importedData)) {
            alert("Invalid file format: Expected an array of URLs");
            return;
          }

          // Convert dates from strings to Date objects
          const processedData = importedData.map((entry) => ({
            ...entry,
            createdAt: new Date(entry.createdAt),
            updatedAt: new Date(entry.updatedAt),
          }));

          // Validate the imported entries
          const validation = validateUrlEntries(
            processedData,
            finalConfig.maxUrls
          );
          if (!validation.isValid) {
            alert(`Import validation failed:\n${validation.errors.join("\n")}`);
            return;
          }

          // Import successful
          onChange(processedData);
        } catch (error) {
          alert(
            "Failed to parse JSON file. Please ensure it's a valid URL export file."
          );
        }
      };
      reader.readAsText(file);

      // Reset input so same file can be imported again
      event.target.value = "";
    },
    [onChange, finalConfig.maxUrls]
  );

  // Reset form
  const resetForm = useCallback(() => {
    setUrlInput("");
    setLabelInput("");
    setTypeInput(UrlType.GENERIC);
    setCustomTypeInput("");
    setValidationError(null);
    setValidationWarning(null);
    setIsAdding(false);
    setEditingId(null);
  }, []);

  // Validate current input
  const validateCurrentInput = useCallback((): boolean => {
    // Validate URL
    const urlValidation = validateUrl(urlInput, finalConfig.enforceHttps);

    if (!urlValidation.isValid) {
      setValidationError(urlValidation.error || "Invalid URL");
      setValidationWarning(null);
      return false;
    }

    // Check for type mismatch warnings
    let warning = urlValidation.warning || null;

    // If user selected a social media type, check if URL matches that platform
    if (
      typeInput === UrlType.YOUTUBE &&
      !urlInput.toLowerCase().includes("youtube.com") &&
      !urlInput.toLowerCase().includes("youtu.be")
    ) {
      warning =
        "This URL doesn't appear to be from YouTube. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.LINKEDIN &&
      !urlInput.toLowerCase().includes("linkedin.com")
    ) {
      warning =
        "This URL doesn't appear to be from LinkedIn. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.TWITTER &&
      !urlInput.toLowerCase().includes("twitter.com") &&
      !urlInput.toLowerCase().includes("x.com")
    ) {
      warning =
        "This URL doesn't appear to be from X/Twitter. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.FACEBOOK &&
      !urlInput.toLowerCase().includes("facebook.com")
    ) {
      warning =
        "This URL doesn't appear to be from Facebook. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.INSTAGRAM &&
      !urlInput.toLowerCase().includes("instagram.com")
    ) {
      warning =
        "This URL doesn't appear to be from Instagram. Please verify the URL or select a different type.";
    }

    // Set warning if present (non-blocking)
    setValidationWarning(warning);

    // Check for duplicates (exclude current editing entry)
    const existingUrls = editingId
      ? value.filter((e) => e.id !== editingId)
      : value;

    if (isDuplicateUrl(urlInput, existingUrls)) {
      setValidationError("This URL already exists");
      setValidationWarning(null);
      return false;
    }

    // Validate custom type label if needed
    if (typeInput === UrlType.CUSTOM) {
      const labelError = validateCustomTypeLabel(customTypeInput);
      if (labelError) {
        setValidationError(labelError);
        setValidationWarning(null);
        return false;
      }
    }

    setValidationError(null);
    return true;
  }, [
    urlInput,
    typeInput,
    customTypeInput,
    value,
    editingId,
    finalConfig.enforceHttps,
  ]);

  // Handle URL input change with auto-detection
  const handleUrlInputChange = useCallback(
    (newUrl: string) => {
      setUrlInput(newUrl);
      setValidationError(null);
      setValidationWarning(null);

      // Auto-suggest type if URL is valid
      if (newUrl.trim().length > 10) {
        const suggested = suggestUrlType(newUrl);
        if (suggested && typeInput === UrlType.GENERIC) {
          setTypeInput(suggested);
        }
      }
    },
    [typeInput]
  );

  // Check for warnings when URL or type changes (real-time feedback)
  React.useEffect(() => {
    if (!urlInput.trim() || urlInput.trim().length < 10) {
      setValidationWarning(null);
      return;
    }

    // Check for type mismatch warnings
    let warning: string | null = null;

    // If user selected a social media type, check if URL matches that platform
    if (
      typeInput === UrlType.YOUTUBE &&
      !urlInput.toLowerCase().includes("youtube.com") &&
      !urlInput.toLowerCase().includes("youtu.be")
    ) {
      warning =
        "This URL doesn't appear to be from YouTube. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.LINKEDIN &&
      !urlInput.toLowerCase().includes("linkedin.com")
    ) {
      warning =
        "This URL doesn't appear to be from LinkedIn. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.TWITTER &&
      !urlInput.toLowerCase().includes("twitter.com") &&
      !urlInput.toLowerCase().includes("x.com")
    ) {
      warning =
        "This URL doesn't appear to be from X/Twitter. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.FACEBOOK &&
      !urlInput.toLowerCase().includes("facebook.com")
    ) {
      warning =
        "This URL doesn't appear to be from Facebook. Please verify the URL or select a different type.";
    } else if (
      typeInput === UrlType.INSTAGRAM &&
      !urlInput.toLowerCase().includes("instagram.com")
    ) {
      warning =
        "This URL doesn't appear to be from Instagram. Please verify the URL or select a different type.";
    }

    setValidationWarning(warning);
  }, [urlInput, typeInput]);

  // Add or update entry
  const handleSave = useCallback(() => {
    if (!validateCurrentInput()) {
      return;
    }

    const newEntry: UrlEntry = {
      id: editingId || generateUrlEntryId(),
      url: urlInput.trim(),
      type: typeInput,
      label: labelInput.trim() || undefined,
      customTypeLabel:
        typeInput === UrlType.CUSTOM ? customTypeInput.trim() : undefined,
      createdAt: editingId
        ? value.find((e) => e.id === editingId)?.createdAt || new Date()
        : new Date(),
      updatedAt: new Date(),
    };

    if (editingId) {
      // Update existing
      onChange(value.map((e) => (e.id === editingId ? newEntry : e)));
    } else {
      // Add new
      onChange([...value, newEntry]);
    }

    resetForm();
  }, [
    validateCurrentInput,
    urlInput,
    typeInput,
    labelInput,
    customTypeInput,
    editingId,
    value,
    onChange,
    resetForm,
  ]);

  // Start editing
  const handleEdit = useCallback((entry: UrlEntry) => {
    setEditingId(entry.id);
    setUrlInput(entry.url);
    setLabelInput(entry.label || "");
    setTypeInput(entry.type);
    setCustomTypeInput(entry.customTypeLabel || "");
    setIsAdding(true);
    setValidationError(null);
    setValidationWarning(null);
  }, []);

  // Delete entry
  const handleDelete = useCallback(
    (id: string) => {
      onChange(value.filter((e) => e.id !== id));
    },
    [value, onChange]
  );

  // Start adding
  const handleStartAdding = useCallback(() => {
    if (isAtMaxCapacity) return;
    setIsAdding(true);
  }, [isAtMaxCapacity]);

  return (
    <Box>
      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography
          variant="subtitle2"
          sx={{
            fontFamily: brand.fonts.heading,
            fontWeight: 600,
            color: "text.primary",
          }}
        >
          {label}
          {required && (
            <span style={{ color: theme.palette.error.main }}> *</span>
          )}
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          {/* Import Button */}
          {!finalConfig.readOnly &&
            !disabled &&
            value.length < finalConfig.maxUrls && (
              <Tooltip title="Import URLs from JSON">
                <IconButton
                  size="small"
                  component="label"
                  sx={{
                    color: "primary.main",
                    "&:hover": { bgcolor: `${theme.palette.primary.main}15` },
                  }}
                >
                  <ImportIcon fontSize="small" />
                  <input
                    type="file"
                    hidden
                    accept=".json"
                    onChange={handleImport}
                  />
                </IconButton>
              </Tooltip>
            )}

          {/* Export Button */}
          {value.length > 0 && (
            <Tooltip title="Export URLs to JSON">
              <IconButton
                size="small"
                onClick={handleExport}
                sx={{
                  color: "primary.main",
                  "&:hover": { bgcolor: `${theme.palette.primary.main}15` },
                }}
              >
                <ExportIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {/* Counter Chip */}
          <Chip
            label={`${value.length} / ${finalConfig.maxUrls}`}
            size="small"
            color={isAtMaxCapacity ? "error" : "default"}
            sx={{ fontWeight: 600 }}
          />
        </Stack>
      </Stack>

      {/* Helper Text */}
      {helperText && !error && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block" }}
        >
          {helperText}
        </Typography>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* URL List */}
      <Stack spacing={1} mb={2}>
        {value.map((entry) => (
          <UrlEntryItem
            key={entry.id}
            entry={entry}
            onEdit={() => handleEdit(entry)}
            onDelete={() => handleDelete(entry.id)}
            readOnly={finalConfig.readOnly || disabled}
          />
        ))}
      </Stack>

      {/* Add/Edit Form */}
      <Collapse in={isAdding}>
        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: `${brand.borderRadius}px`,
            border: `2px dashed ${theme.palette.primary.main}`,
            bgcolor: `${theme.palette.primary.main}05`,
            mb: 2,
          }}
        >
          <Stack spacing={2}>
            {/* URL Input */}
            <TextField
              fullWidth
              size="small"
              label="URL"
              value={urlInput}
              onChange={(e) => handleUrlInputChange(e.target.value)}
              placeholder={finalConfig.urlPlaceholder}
              required
              error={!!validationError}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: `${brand.borderRadius / 2}px`,
                },
              }}
            />

            {/* Type and Label Row */}
            <Stack direction="row" spacing={2}>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <Select
                  value={typeInput}
                  onChange={(e) => setTypeInput(e.target.value as UrlType)}
                  sx={{
                    borderRadius: `${brand.borderRadius / 2}px`,
                  }}
                >
                  {Object.entries(URL_TYPE_LABELS)
                    .filter(
                      ([key]) =>
                        finalConfig.allowCustomTypes || key !== UrlType.CUSTOM
                    )
                    .map(([key, label]) => (
                      <MenuItem key={key} value={key}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {URL_TYPE_ICON_COMPONENTS[key as UrlType]}
                          <span>{label}</span>
                        </Stack>
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>

              {finalConfig.showLabels && (
                <TextField
                  fullWidth
                  size="small"
                  label="Label (Optional)"
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder={finalConfig.labelPlaceholder}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: `${brand.borderRadius / 2}px`,
                    },
                  }}
                />
              )}
            </Stack>

            {/* Custom Type Input */}
            {typeInput === UrlType.CUSTOM && (
              <TextField
                fullWidth
                size="small"
                label="Custom Type Name"
                value={customTypeInput}
                onChange={(e) => setCustomTypeInput(e.target.value)}
                placeholder="e.g., Press Release, Case Study"
                required
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius / 2}px`,
                  },
                }}
              />
            )}

            {/* Validation Error */}
            {validationError && (
              <Alert severity="error" icon={<WarningIcon />}>
                {validationError}
              </Alert>
            )}

            {/* Validation Warning */}
            {!validationError && validationWarning && (
              <Alert severity="warning" icon={<WarningIcon />}>
                {validationWarning}
              </Alert>
            )}

            {/* Actions */}
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button
                variant="outlined"
                size="small"
                startIcon={<CloseIcon />}
                onClick={resetForm}
                sx={{ borderRadius: `${brand.borderRadius / 2}px` }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<CheckIcon />}
                onClick={handleSave}
                disabled={!urlInput.trim()}
                sx={{ borderRadius: `${brand.borderRadius / 2}px` }}
              >
                {editingId ? "Update" : "Add"}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Collapse>

      {/* Add Button */}
      {!isAdding && !finalConfig.readOnly && !disabled && (
        <Button
          fullWidth
          variant="outlined"
          startIcon={<AddIcon />}
          onClick={handleStartAdding}
          disabled={isAtMaxCapacity}
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            borderStyle: "dashed",
            borderWidth: 2,
            py: 1.5,
            "&:hover": {
              borderStyle: "dashed",
              borderWidth: 2,
              bgcolor: `${theme.palette.primary.main}10`,
            },
          }}
        >
          {isAtMaxCapacity
            ? `Maximum ${finalConfig.maxUrls} URLs reached`
            : "Add URL"}
        </Button>
      )}
    </Box>
  );
};

export default UrlManager;
