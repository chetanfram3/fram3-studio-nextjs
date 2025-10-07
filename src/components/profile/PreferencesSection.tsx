// src/components/profile/PreferencesSection.tsx
"use client";

import { Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useThemeMode } from "@/theme";
import { getCurrentBrand } from "@/config/brandConfig";
import Select, { StylesConfig } from "react-select";

interface Preferences {
  theme: string;
  language: string;
}

interface PreferencesSectionProps {
  preferences: Preferences;
  onUpdate: (field: string, value: string) => void;
}

interface Option {
  label: string;
  value: string;
}

export default function PreferencesSection({
  preferences,
  onUpdate,
}: PreferencesSectionProps) {
  const { toggleTheme } = useThemeMode();
  const theme = useTheme();
  const brand = getCurrentBrand();

  const handleThemeChange = (option: Option | null) => {
    if (!option) return;

    const value = option.value;

    // Update both the profile preference and the actual theme
    onUpdate("theme", value);

    // Toggle theme if needed to match selection
    const isDarkMode = localStorage.getItem("theme-mode") === "dark";
    const shouldBeDark = value === "dark";

    if (isDarkMode !== shouldBeDark) {
      toggleTheme();
    }
  };

  const themeOptions: Option[] = [
    { value: "light", label: "Light" },
    { value: "dark", label: "Dark" },
  ];

  const languageOptions: Option[] = [
    { value: "en", label: "English" },
    { value: "es", label: "Spanish" },
    { value: "fr", label: "French" },
  ];

  // Brand-aware select styles
  const selectStyles: StylesConfig<Option, false> = {
    control: (base, state) => ({
      ...base,
      minHeight: "56px",
      background: theme.palette.background.paper,
      borderColor: state.isFocused
        ? theme.palette.primary.main
        : theme.palette.divider,
      borderRadius: `${brand.borderRadius}px`,
      borderWidth: state.isFocused ? 2 : 1,
      boxShadow: state.isFocused
        ? `0 0 0 1px ${theme.palette.primary.main}`
        : "none",
      "&:hover": {
        borderColor: theme.palette.primary.main,
      },
      transition: theme.transitions.create(["border-color", "box-shadow"]),
    }),
    menu: (base) => ({
      ...base,
      background: theme.palette.background.paper,
      color: theme.palette.text.primary,
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: `${brand.borderRadius}px`,
      boxShadow: theme.shadows[3],
      zIndex: 999,
    }),
    option: (base, state) => ({
      ...base,
      padding: "12px 16px",
      cursor: "pointer",
      color: state.isSelected
        ? theme.palette.primary.contrastText
        : theme.palette.text.primary,
      backgroundColor: state.isSelected
        ? theme.palette.primary.main
        : state.isFocused
          ? theme.palette.action.hover
          : "transparent",
      fontFamily: brand.fonts.body,
      transition: theme.transitions.create(["background-color", "color"]),
      "&:active": {
        backgroundColor: theme.palette.action.selected,
      },
    }),
    input: (base) => ({
      ...base,
      color: theme.palette.text.primary,
      fontFamily: brand.fonts.body,
    }),
    singleValue: (base) => ({
      ...base,
      color: theme.palette.text.primary,
      fontFamily: brand.fonts.body,
    }),
    placeholder: (base) => ({
      ...base,
      color: theme.palette.text.secondary,
      fontFamily: brand.fonts.body,
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: theme.palette.action.active,
      "&:hover": {
        color: theme.palette.primary.main,
      },
    }),
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
        Preferences
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Box>
          <Select
            options={themeOptions}
            value={themeOptions.find(
              (option) => option.value === preferences.theme
            )}
            onChange={handleThemeChange}
            placeholder="Select Theme"
            styles={selectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </Box>
        <Box>
          <Select
            options={languageOptions}
            value={languageOptions.find(
              (option) => option.value === preferences.language
            )}
            onChange={(option) => option && onUpdate("language", option.value)}
            placeholder="Select Language"
            styles={selectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </Box>
      </Box>
    </Box>
  );
}
