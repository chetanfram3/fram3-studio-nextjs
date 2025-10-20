"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  Typography,
  Collapse,
  IconButton,
  Stack,
  Chip,
  InputAdornment,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import {
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Add as AddIcon,
  Close as CloseIcon,
} from "@mui/icons-material";

export interface ProjectMetadataType {
  title: string;
  description?: string;
  imageCategory?: string;
  tags: string[];
  projectName?: string;
  notes?: string;
}

interface ProjectMetadataProps {
  value: ProjectMetadataType;
  onChange: (metadata: ProjectMetadataType) => void;
  compact?: boolean;
}

export function ProjectMetadata({
  value,
  onChange,
  compact = true,
}: ProjectMetadataProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [expanded, setExpanded] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const handleChange = (
    field: keyof ProjectMetadataType,
    newValue: string | string[]
  ) => {
    onChange({
      ...value,
      [field]: newValue,
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !value.tags.includes(tagInput.trim())) {
      handleChange("tags", [...value.tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    handleChange(
      "tags",
      value.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Box
      sx={{
        width: compact ? { xs: "100%", sm: "480px" } : "100%",
        bgcolor: "background.paper",
        borderRadius: `${brand.borderRadius}px`,
        border: 1,
        borderColor: "divider",
        p: 2,
      }}
    >
      <Stack spacing={2}>
        {/* Required Field - Always Visible */}
        <Box>
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
              mb: 0.5,
              display: "block",
            }}
          >
            Title *
          </Typography>
          <TextField
            fullWidth
            required
            size="small"
            value={value.title}
            onChange={(e) => handleChange("title", e.target.value)}
            placeholder="Enter collection title"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius / 2}px`,
                "&:hover fieldset": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "primary.main",
                },
              },
            }}
          />
        </Box>

        {/* Expand/Collapse Toggle */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            pt: 0.5,
            borderTop: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontFamily: brand.fonts.body,
            }}
          >
            {expanded ? "Hide" : "Show"} additional fields
          </Typography>
          <IconButton
            size="small"
            onClick={() => setExpanded(!expanded)}
            sx={{
              color: "primary.main",
              "&:hover": {
                bgcolor:
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.04)",
              },
            }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Collapsible Optional Fields */}
        <Collapse in={expanded} timeout="auto">
          <Stack spacing={2}>
            {/* Description */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                  mb: 0.5,
                  display: "block",
                }}
              >
                Description
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                value={value.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter image collection description"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius / 2}px`,
                  },
                }}
              />
            </Box>

            {/* Image Category */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                  mb: 0.5,
                  display: "block",
                }}
              >
                Category
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={value.imageCategory || ""}
                onChange={(e) => handleChange("imageCategory", e.target.value)}
                placeholder="e.g., Product, Landscape, Portrait"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius / 2}px`,
                  },
                }}
              />
            </Box>

            {/* Tags */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                  mb: 0.5,
                  display: "block",
                }}
              >
                Tags
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Add tags (press Enter)"
                InputProps={{
                  endAdornment: tagInput.trim() && (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={handleAddTag}
                        sx={{ color: "primary.main" }}
                      >
                        <AddIcon fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius / 2}px`,
                  },
                }}
              />
              {value.tags.length > 0 && (
                <Box
                  sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}
                >
                  {value.tags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      onDelete={() => handleRemoveTag(tag)}
                      deleteIcon={<CloseIcon />}
                      sx={{
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(255,255,255,0.08)"
                            : "rgba(0,0,0,0.04)",
                        color: "text.primary",
                        borderRadius: `${brand.borderRadius / 2}px`,
                        "& .MuiChip-deleteIcon": {
                          color: "text.secondary",
                          "&:hover": {
                            color: "primary.main",
                          },
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
            </Box>

            {/* Project Name */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                  mb: 0.5,
                  display: "block",
                }}
              >
                Project Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                value={value.projectName || ""}
                onChange={(e) => handleChange("projectName", e.target.value)}
                placeholder="Enter project name"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius / 2}px`,
                  },
                }}
              />
            </Box>

            {/* Notes */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                  mb: 0.5,
                  display: "block",
                }}
              >
                Notes
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={3}
                size="small"
                value={value.notes || ""}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Add any additional notes"
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: `${brand.borderRadius / 2}px`,
                  },
                }}
              />
            </Box>
          </Stack>
        </Collapse>
      </Stack>
    </Box>
  );
}
