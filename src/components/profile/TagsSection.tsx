// src/components/profile/TagsSection.tsx
"use client";

import { useState, KeyboardEvent } from "react";
import { Box, Typography, TextField, Button, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import { getCurrentBrand } from "@/config/brandConfig";

interface TagsSectionProps {
  title: string;
  tags: string[];
  onAdd: (tag: string) => void;
  onDelete: (tag: string) => void;
}

export default function TagsSection({
  title,
  tags,
  onAdd,
  onDelete,
}: TagsSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [newTag, setNewTag] = useState("");

  const handleAdd = () => {
    if (newTag.trim()) {
      onAdd(newTag.trim());
      setNewTag("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{
          fontFamily: brand.fonts.heading,
          color: "primary.main",
          fontWeight: 600,
        }}
      >
        {title}
      </Typography>

      {/* Tag Input */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          fullWidth
          size="medium"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}`}
          onKeyPress={handleKeyPress}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: `${brand.borderRadius}px`,
            },
          }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAdd}
          disabled={!newTag.trim()}
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            fontWeight: 600,
            px: 3,
            minWidth: 100,
            fontFamily: brand.fonts.heading,
            "&:disabled": {
              bgcolor: "action.disabledBackground",
              color: "action.disabled",
            },
          }}
        >
          Add
        </Button>
      </Box>

      {/* Tag List */}
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          gap: 1.5,
          minHeight: 50,
          p: 2,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.default",
          border: 1,
          borderColor: "divider",
        }}
      >
        {tags.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontStyle: "italic",
              width: "100%",
              textAlign: "center",
              py: 1,
            }}
          >
            No {title.toLowerCase()} added yet
          </Typography>
        ) : (
          tags.map((tag) => (
            <Chip
              key={tag}
              label={tag}
              onDelete={() => onDelete(tag)}
              sx={{
                borderRadius: `${brand.borderRadius}px`,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                fontWeight: 500,
                fontFamily: brand.fonts.body,
                transition: theme.transitions.create([
                  "transform",
                  "box-shadow",
                ]),
                "&:hover": {
                  transform: "translateY(-2px)",
                  boxShadow: `0 4px 8px ${theme.palette.primary.main}40`,
                },
                "& .MuiChip-deleteIcon": {
                  color: "primary.contrastText",
                  "&:hover": {
                    color: "error.light",
                  },
                },
              }}
            />
          ))
        )}
      </Box>
    </Box>
  );
}
