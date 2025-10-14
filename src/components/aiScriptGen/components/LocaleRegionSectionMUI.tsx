"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  Chip,
  Divider,
  Paper,
  Button,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { UseFormReturn } from "react-hook-form";
import {
  getCountriesByContinent,
  getStatesByCountry,
} from "../utils/location-utils";
import {
  getLanguagesByCountryISO,
  getLanguagesByStateISO,
} from "../utils/language-mapping";
import type { FormValues } from "../types";

// ==========================================
// TYPE DEFINITIONS
// ==========================================
interface LocaleRegionSectionMUIProps {
  form: UseFormReturn<FormValues>;
}

type ContinentName =
  | "Africa"
  | "Asia"
  | "Europe"
  | "North America"
  | "South America"
  | "Oceania";

type SpeechMode = "conversationalDialogue" | "narrativeVoiceOver" | "none";

// ==========================================
// CONSTANTS
// ==========================================
const CONTINENTS: ContinentName[] = [
  "Africa",
  "Asia",
  "Europe",
  "North America",
  "South America",
  "Oceania",
];

const SPEECH_MODES: SpeechMode[] = [
  "conversationalDialogue",
  "narrativeVoiceOver",
  "none",
];

const SPEECH_MODE_LABELS: Record<SpeechMode, string> = {
  conversationalDialogue: "Conversational Dialogue",
  narrativeVoiceOver: "Narrative Voice Over",
  none: "None",
};

/**
 * LocaleRegionSectionMUI - Locale, region, and language selection component
 *
 * Performance optimizations:
 * - React 19 compiler auto-optimizes (no manual memo needed)
 * - useCallback for event handlers
 * - useMemo for computed values
 * - Theme-aware styling (no hardcoded colors)
 * - Proper dependency arrays
 *
 * Porting standards:
 * - 100% type safe (no any types)
 * - Uses theme palette for all colors (primary instead of secondary)
 * - Uses brand config for fonts/spacing
 * - No hardcoded colors, fonts, or spacing
 * - Follows MUI v7 patterns
 */
export default function LocaleRegionSectionMUI({
  form,
}: LocaleRegionSectionMUIProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // STATE
  // ==========================================
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<
    Record<string, string>
  >({});
  const [previousCountry, setPreviousCountry] = useState("");
  const [previousState, setPreviousState] = useState("");
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [stateMap, setStateMap] = useState<Record<string, string>>({});

  // ==========================================
  // FORM VALUES
  // ==========================================
  const selectedContinent = form.watch("localeRegionLanguage.continent");
  const selectedCountryName = form.watch("localeRegionLanguage.country") || "";
  const selectedStateName =
    form.watch("localeRegionLanguage.stateProvince") || "";
  const selectedLanguage = form.watch("localeRegionLanguage.language");
  const selectedLanguageIndex = form.watch(
    "localeRegionLanguage.languageIndex"
  );
  const selectedSpeechModes =
    form.watch("localeRegionLanguage.speechModes") || [];

  // ==========================================
  // COMPUTED VALUES (Memoized for performance)
  // ==========================================
  const selectedCountryCode = useMemo(
    () =>
      Object.keys(countryMap).find(
        (code) => countryMap[code] === selectedCountryName
      ) || "",
    [countryMap, selectedCountryName]
  );

  const selectedStateCode = useMemo(
    () =>
      Object.keys(stateMap).find(
        (code) => stateMap[code] === selectedStateName
      ) || "",
    [stateMap, selectedStateName]
  );

  // ==========================================
  // EFFECTS
  // ==========================================
  // Create a map of country codes to names
  useEffect(() => {
    if (selectedContinent) {
      const countries = getCountriesByContinent(selectedContinent);
      const countryMapping: Record<string, string> = {};
      countries.forEach((country) => {
        countryMapping[country.isoCode] = country.name;
      });
      setCountryMap(countryMapping);
    }
  }, [selectedContinent]);

  // Create a map of state codes to names when country changes
  useEffect(() => {
    if (selectedCountryCode) {
      const states = getStatesByCountry(selectedCountryCode);
      const stateMapping: Record<string, string> = {};
      states.forEach((state) => {
        stateMapping[state.isoCode] = state.name;
      });
      setStateMap(stateMapping);
    }
  }, [selectedCountryCode]);

  // Update available languages
  useEffect(() => {
    if (selectedCountryCode && selectedCountryCode !== "custom") {
      const languages = selectedStateCode
        ? getLanguagesByStateISO(selectedCountryCode, selectedStateCode)
        : getLanguagesByCountryISO(selectedCountryCode);

      setAvailableLanguages(languages || []);

      if (
        languages?.length > 0 &&
        (selectedCountryCode !== previousCountry ||
          selectedStateCode !== previousState)
      ) {
        form.setValue("localeRegionLanguage.languageIndex", 0);
        form.setValue("localeRegionLanguage.language", languages[0]);
        setPreviousCountry(selectedCountryCode);
        setPreviousState(selectedStateCode ?? "");
      }
    } else {
      setAvailableLanguages([]);
    }
  }, [
    selectedCountryCode,
    selectedStateCode,
    form,
    previousCountry,
    previousState,
  ]);

  // ==========================================
  // EVENT HANDLERS (useCallback for stability)
  // ==========================================
  const handleContinentChange = useCallback(
    (continent: string) => {
      form.setValue("localeRegionLanguage.continent", continent);
      form.setValue("localeRegionLanguage.country", "");
      form.setValue("localeRegionLanguage.stateProvince", "");
    },
    [form]
  );

  const handleCountryChange = useCallback(
    (countryCode: string) => {
      if (
        selectedCountryCode &&
        selectedCountryCode !== "custom" &&
        selectedStateCode
      ) {
        setStatesByCountry((prev) => ({
          ...prev,
          [selectedCountryCode]: selectedStateCode,
        }));
      }
      const countryName = countryMap[countryCode] || countryCode;
      form.setValue("localeRegionLanguage.country", countryName);
      if (statesByCountry[countryCode]) {
        const stateName =
          stateMap[statesByCountry[countryCode]] ||
          statesByCountry[countryCode];
        form.setValue("localeRegionLanguage.stateProvince", stateName);
      } else {
        form.setValue("localeRegionLanguage.stateProvince", "");
      }
    },
    [
      selectedCountryCode,
      selectedStateCode,
      countryMap,
      statesByCountry,
      stateMap,
      form,
    ]
  );

  const handleStateChange = useCallback(
    (stateCode: string) => {
      const stateName = stateMap[stateCode] || stateCode;
      form.setValue("localeRegionLanguage.stateProvince", stateName);
      if (selectedCountryCode && selectedCountryCode !== "custom") {
        setStatesByCountry((prev) => ({
          ...prev,
          [selectedCountryCode]: stateCode,
        }));
      }
    },
    [stateMap, form, selectedCountryCode]
  );

  const handleSpeechModesChange = useCallback(
    (_event: React.MouseEvent<HTMLElement>, newModes: string[]) => {
      if (newModes.includes("none") && !selectedSpeechModes.includes("none")) {
        form.setValue("localeRegionLanguage.speechModes", ["none"]);
      } else if (newModes.length > 1 && newModes.includes("none")) {
        const filteredModes = newModes.filter((mode) => mode !== "none");
        form.setValue("localeRegionLanguage.speechModes", filteredModes);
      } else {
        form.setValue("localeRegionLanguage.speechModes", newModes);
      }
    },
    [selectedSpeechModes, form]
  );

  const getCountryName = useCallback(
    (codeOrName: string | null) => {
      if (!codeOrName) return "";
      return countryMap[codeOrName] || codeOrName;
    },
    [countryMap]
  );

  const getStateName = useCallback(
    (codeOrName: string | null) => {
      if (!codeOrName) return "";
      return stateMap[codeOrName] || codeOrName;
    },
    [stateMap]
  );

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: `${brand.borderRadius}px`,
        bgcolor: "background.default",
        border: 1,
        borderColor: "divider",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 4,
        }}
      >
        {/* Continent Buttons */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              mb: 1,
              display: "block",
              color: "text.primary",
            }}
          >
            Continent
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1,
            }}
          >
            {CONTINENTS.map((continent) => (
              <Button
                key={continent}
                variant={
                  selectedContinent === continent ? "contained" : "outlined"
                }
                onClick={() => handleContinentChange(continent)}
                fullWidth
                sx={{
                  height: 36,
                  textTransform: "none",
                  border: 1,
                  bgcolor:
                    selectedContinent === continent
                      ? alpha(theme.palette.primary.main, 0.4)
                      : "background.paper",
                  color:
                    selectedContinent === continent
                      ? "primary.main"
                      : "text.primary",
                  borderColor:
                    selectedContinent === continent
                      ? "primary.dark"
                      : "divider",
                  fontFamily: brand.fonts.body,
                  "&:hover": {
                    color:
                      selectedContinent === continent
                        ? "primary.contrastText"
                        : "text.primary",
                    bgcolor:
                      selectedContinent === continent
                        ? "primary.dark"
                        : "action.hover",
                  },
                }}
              >
                {continent}
              </Button>
            ))}
          </Box>
        </Box>

        {/* Country & State */}
        <Box sx={{ flex: 1 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              mb: 1,
              display: "block",
              color: "text.primary",
            }}
          >
            Country & State
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Country</InputLabel>
            <Select
              value={selectedCountryCode || ""}
              onChange={(e) => handleCountryChange(e.target.value)}
              label="Country"
              sx={{
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "divider",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: "primary.main",
                },
              }}
            >
              <MenuItem value="">-- Select Country --</MenuItem>
              {getCountriesByContinent(selectedContinent ?? "").map(
                (country) => (
                  <MenuItem key={country.isoCode} value={country.isoCode}>
                    {country.name}
                  </MenuItem>
                )
              )}
              <MenuItem value="custom">Enter Custom Country...</MenuItem>
            </Select>
          </FormControl>

          {selectedCountryCode &&
            selectedCountryCode !== "custom" &&
            getStatesByCountry(selectedCountryCode).length > 0 && (
              <FormControl fullWidth size="small" sx={{ mb: 1 }}>
                <InputLabel>State/Province</InputLabel>
                <Select
                  value={selectedStateCode || ""}
                  onChange={(e) => handleStateChange(e.target.value)}
                  label="State/Province"
                  sx={{
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "divider",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "primary.main",
                    },
                  }}
                >
                  <MenuItem value="">-- Select State --</MenuItem>
                  {getStatesByCountry(selectedCountryCode).map((state) => (
                    <MenuItem key={state.isoCode} value={state.isoCode}>
                      {state.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

          {(selectedCountryName || selectedStateName) && (
            <Box
              sx={{
                mt: 1,
                bgcolor: "background.paper",
                px: 2,
                py: 1,
                borderRadius: `${brand.borderRadius}px`,
                border: 1,
                borderColor: "divider",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: "primary.main",
                  fontWeight: 600,
                  fontFamily: brand.fonts.body,
                }}
              >
                {selectedCountryName
                  ? `${getCountryName(selectedCountryName)}`
                  : ""}{" "}
                {selectedStateName
                  ? `› ${getStateName(selectedStateName)}`
                  : ""}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  fontFamily: brand.fonts.body,
                }}
              >
                {`${
                  getStatesByCountry(selectedCountryCode ?? "").length || 0
                } states/provinces`}
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Divider sx={{ my: 3 }} />

      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          mb: 1,
          display: "block",
          color: "text.primary",
        }}
      >
        Language
      </Typography>

      {selectedCountryCode && availableLanguages.length > 0 ? (
        <Box sx={{ m: 1.5 }}>
          <Slider
            value={selectedLanguageIndex || 0}
            onChange={(e, value) => {
              const index = typeof value === "number" ? value : value[0];
              form.setValue("localeRegionLanguage.languageIndex", index);
              form.setValue(
                "localeRegionLanguage.language",
                availableLanguages[index]
              );
            }}
            min={0}
            max={availableLanguages.length - 1}
            step={1}
            marks={availableLanguages.map((lang, i) => ({
              value: i,
              label: lang,
            }))}
            valueLabelDisplay="off"
            sx={{
              color: "primary.main",
              "& .MuiSlider-track": { border: "none", height: 8 },
              "& .MuiSlider-rail": {
                height: 8,
                opacity: 0.5,
                backgroundColor: alpha(theme.palette.divider, 0.3),
              },
              "& .MuiSlider-thumb": {
                height: 18,
                width: 18,
                border: `2px solid ${theme.palette.primary.contrastText}`,
                backgroundColor: "primary.main",
                "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                  boxShadow: "inherit",
                },
              },
              "& .MuiSlider-mark": {
                backgroundColor: "primary.main",
                height: 8,
                width: 8,
                borderRadius: "50%",
                marginTop: 0,
              },
            }}
          />
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Chip
              label={selectedLanguage || availableLanguages[0]}
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                px: 2,
                py: 1,
                color: "primary.dark",
                backgroundColor: alpha(theme.palette.primary.main, 0.3),
                fontFamily: brand.fonts.body,
              }}
            />
          </Box>
        </Box>
      ) : (
        <>
          <Typography variant="caption" sx={{ mb: 1, color: "text.secondary" }}>
            No languages available
          </Typography>
          <Slider disabled value={0} sx={{ mt: 1 }} />
          <Box sx={{ textAlign: "center", mt: 2 }}>
            <Chip
              label="English"
              color="primary"
              sx={{
                fontWeight: "bold",
                px: 2,
                py: 1,
                fontFamily: brand.fonts.body,
              }}
            />
          </Box>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Speech Modes */}
      <Typography
        variant="caption"
        sx={{
          fontWeight: 600,
          mb: 1,
          display: "block",
          color: "text.primary",
        }}
      >
        Speech Modes
      </Typography>
      <Box sx={{ m: 1.5, display: "flex", justifyContent: "center" }}>
        <ToggleButtonGroup
          value={selectedSpeechModes}
          onChange={handleSpeechModesChange}
          aria-label="speech modes"
          color="primary"
          sx={{ flexWrap: "wrap", justifyContent: "center" }}
        >
          {SPEECH_MODES.map((mode) => (
            <ToggleButton
              key={mode}
              value={mode}
              sx={{
                m: 0.5,
                textTransform: "none",
                border: 1,
                bgcolor: selectedSpeechModes.includes(mode)
                  ? alpha(theme.palette.primary.main, 0.4)
                  : "background.paper",
                color: selectedSpeechModes.includes(mode)
                  ? "primary.main"
                  : "text.primary",
                borderColor: selectedSpeechModes.includes(mode)
                  ? "primary.dark"
                  : "divider",
                fontFamily: brand.fonts.body,
                "&:hover": {
                  bgcolor: selectedSpeechModes.includes(mode)
                    ? alpha(theme.palette.primary.main, 0.6)
                    : "action.hover",
                },
                "&.Mui-selected": {
                  bgcolor: alpha(theme.palette.primary.main, 0.4),
                  color: "primary.main",
                  "&:hover": {
                    bgcolor: alpha(theme.palette.primary.main, 0.6),
                  },
                },
              }}
            >
              {SPEECH_MODE_LABELS[mode]}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
}

LocaleRegionSectionMUI.displayName = "LocaleRegionSectionMUI";
