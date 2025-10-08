"use client";

import { useState } from "react";
import { Autocomplete, TextField, InputAdornment, Paper } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import SearchIcon from "@mui/icons-material/SearchSharp";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { API_BASE_URL } from "@/config/constants";
import { getCurrentBrand } from "@/config/brandConfig";

interface SearchResult {
  scriptId: string;
  title: string;
  currentVersion: string;
}

export function ProjectSearch() {
  const router = useRouter();
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [options, setOptions] = useState<SearchResult[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm) {
      setOptions([]);
      return;
    }

    try {
      const token = await auth.currentUser?.getIdToken();
      const response = await fetch(
        `${API_BASE_URL}/scripts/auto-complete?query=${searchTerm}&limit=15`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const { data } = await response.json();
        setOptions(data || []);
      }
    } catch (error) {
      console.error("Search error:", error);
      setOptions([]);
    }
  };

  return (
    <Autocomplete
      sx={{
        width: 300,
        // Autocomplete wrapper styling
        "& .MuiAutocomplete-clearIndicator": {
          color: "text.secondary",
          "&:hover": {
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          },
        },
        "& .MuiAutocomplete-popupIndicator": {
          color: "text.secondary",
          "&:hover": {
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.1),
          },
        },
      }}
      options={options}
      getOptionLabel={(option) => option.title}
      inputValue={inputValue}
      onInputChange={(_, newValue) => {
        setInputValue(newValue);
        handleSearch(newValue);
      }}
      onChange={(_, value) => {
        if (value) {
          router.push(
            `/dashboard/story/${value.scriptId}/version/${value.currentVersion}/3`
          );
        }
      }}
      // Custom dropdown paper styling
      PaperComponent={({ children, ...props }) => (
        <Paper
          {...props}
          elevation={8}
          sx={{
            bgcolor: "background.paper",
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.2),
            mt: 0.5,
            "& .MuiAutocomplete-listbox": {
              maxHeight: "300px",
              "& .MuiAutocomplete-option": {
                borderRadius: `${brand.borderRadius - 2}px`,
                mx: 0.5,
                my: 0.25,
                py: 1.5,
                px: 2,
                fontFamily: brand.fonts.body,
                transition: theme.transitions.create(
                  ["background-color", "color"],
                  { duration: theme.transitions.duration.shorter }
                ),
                '&[aria-selected="true"]': {
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  color: "primary.main",
                  fontWeight: 600,
                },
                "&.Mui-focused": {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                },
                "&:hover": {
                  bgcolor: alpha(theme.palette.primary.main, 0.12),
                },
              },
              "& .MuiAutocomplete-noOptions": {
                color: "text.secondary",
                py: 2,
                fontFamily: brand.fonts.body,
              },
            },
          }}
        >
          {children}
        </Paper>
      )}
      renderInput={(params) => (
        <TextField
          {...params}
          variant="outlined"
          size="small"
          placeholder="Search projects..."
          sx={{
            // Input background - theme-aware
            bgcolor:
              theme.palette.mode === "dark"
                ? alpha(theme.palette.primary.main, 0.05)
                : alpha(theme.palette.primary.main, 0.03),

            borderRadius: `${brand.borderRadius}px`,

            // Input field styling
            "& .MuiOutlinedInput-root": {
              fontFamily: brand.fonts.body,
              color: "text.primary",

              // Border colors
              "& fieldset": {
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.3)
                    : alpha(theme.palette.primary.main, 0.2),
                borderRadius: `${brand.borderRadius}px`,
                transition: theme.transitions.create(["border-color"]),
              },

              // Hover state
              "&:hover fieldset": {
                borderColor:
                  theme.palette.mode === "dark"
                    ? alpha(theme.palette.primary.main, 0.5)
                    : alpha(theme.palette.primary.main, 0.4),
              },

              // Focused state
              "&.Mui-focused fieldset": {
                borderColor: "primary.main",
                borderWidth: 2,
              },
            },

            // Placeholder styling
            "& .MuiOutlinedInput-input::placeholder": {
              color: "text.secondary",
              opacity: 0.7,
            },
          }}
          InputProps={{
            ...params.InputProps,
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon
                  sx={{
                    color: "primary.main",
                    fontSize: "1.25rem",
                  }}
                />
              </InputAdornment>
            ),
          }}
        />
      )}
    />
  );
}
