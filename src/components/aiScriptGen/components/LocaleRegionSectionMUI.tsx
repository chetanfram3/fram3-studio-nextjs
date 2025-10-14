import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  useTheme,
  Slider,
  Chip,
  Divider,
  Paper,
  Button,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import {
  getCountriesByContinent,
  getStatesByCountry,
} from "../utils/location-utils";
import {
  getLanguagesByCountryISO,
  getLanguagesByStateISO,
} from "../utils/language-mapping";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";

interface Props {
  form: UseFormReturn<FormValues>;
}

const LocaleRegionSectionMUI: React.FC<Props> = ({ form }) => {
  const theme = useTheme();
  const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
  const [statesByCountry, setStatesByCountry] = useState<
    Record<string, string>
  >({});
  const [previousCountry, setPreviousCountry] = useState("");
  const [previousState, setPreviousState] = useState("");
  const [countryMap, setCountryMap] = useState<Record<string, string>>({});
  const [stateMap, setStateMap] = useState<Record<string, string>>({});

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

  // Find the selected country code based on the country name
  const selectedCountryCode =
    Object.keys(countryMap).find(
      (code) => countryMap[code] === selectedCountryName
    ) || "";

  // Find the selected state code based on the state name
  const selectedStateCode =
    Object.keys(stateMap).find(
      (code) => stateMap[code] === selectedStateName
    ) || "";

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
  }, [selectedCountryCode, selectedStateCode, form]);

  const handleContinentChange = (continent: string) => {
    form.setValue("localeRegionLanguage.continent", continent);
    // Reset country and state when continent changes
    form.setValue("localeRegionLanguage.country", "");
    form.setValue("localeRegionLanguage.stateProvince", "");
  };

  const handleCountryChange = (countryCode: string) => {
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
        stateMap[statesByCountry[countryCode]] || statesByCountry[countryCode];
      form.setValue("localeRegionLanguage.stateProvince", stateName);
    } else {
      form.setValue("localeRegionLanguage.stateProvince", "");
    }
  };

  const handleStateChange = (stateCode: string) => {
    const stateName = stateMap[stateCode] || stateCode;
    form.setValue("localeRegionLanguage.stateProvince", stateName);
    if (selectedCountryCode && selectedCountryCode !== "custom") {
      setStatesByCountry((prev) => ({
        ...prev,
        [selectedCountryCode]: stateCode,
      }));
    }
  };

  const handleSpeechModesChange = (
    _event: React.MouseEvent<HTMLElement>,
    newModes: string[]
  ) => {
    // Check if "none" is being selected
    if (newModes.includes("none") && !selectedSpeechModes.includes("none")) {
      // If "none" is selected, clear all other selections
      form.setValue("localeRegionLanguage.speechModes", ["none"]);
    }
    // Check if other options are selected while "none" is already selected
    else if (newModes.length > 1 && newModes.includes("none")) {
      // Remove "none" from the selection
      const filteredModes = newModes.filter((mode) => mode !== "none");
      form.setValue("localeRegionLanguage.speechModes", filteredModes);
    }
    // Normal case - set the selected modes
    else {
      form.setValue("localeRegionLanguage.speechModes", newModes);
    }
  };

  // Function to get country name from code or name
  const getCountryName = (codeOrName: string | null) => {
    if (!codeOrName) return "";
    return countryMap[codeOrName] || codeOrName;
  };

  // Function to get state name from code or name
  const getStateName = (codeOrName: string | null) => {
    if (!codeOrName) return "";
    return stateMap[codeOrName] || codeOrName;
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2,
        borderRadius: 1,
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
            sx={{ fontWeight: 600, mb: 1, display: "block" }}
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
            {[
              "Africa",
              "Asia",
              "Europe",
              "North America",
              "South America",
              "Oceania",
            ].map((continent) => (
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
                      ? alpha(theme.palette.secondary.main, 0.4)
                      : "#1E1E1E",
                  color:
                    selectedContinent === continent
                      ? "secondary.main"
                      : "text.primary",
                  borderColor:
                    selectedContinent === continent
                      ? "secondary.dark"
                      : "divider",
                  "&:hover": {
                    color:
                      selectedContinent === continent
                        ? "secondary.contrastText"
                        : "text.primary",
                    bgcolor:
                      selectedContinent === continent
                        ? "secondary.dark"
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
            sx={{ fontWeight: 600, mb: 1, display: "block" }}
          >
            Country & State
          </Typography>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Country</InputLabel>
            <Select
              value={selectedCountryCode || ""}
              onChange={(e) => handleCountryChange(e.target.value)}
              label="Country"
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
                bgcolor: "#1a1a1a",
                px: 2,
                py: 1,
                borderRadius: 1,
                border: "1px solid",
                borderColor: "divider",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "column",
              }}
            >
              <Typography
                variant="caption"
                sx={{ color: "secondary.main", fontWeight: 600 }}
              >
                {selectedCountryName
                  ? `${getCountryName(selectedCountryName)}`
                  : ""}{" "}
                {selectedStateName
                  ? `› ${getStateName(selectedStateName)}`
                  : ""}
              </Typography>
              <Typography variant="caption" color="text.secondary">
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
        sx={{ fontWeight: 600, mb: 1, display: "block" }}
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
              color: theme.palette.secondary.main,
              "& .MuiSlider-track": { border: "none", height: 8 },
              "& .MuiSlider-rail": {
                height: 8,
                opacity: 0.5,
                backgroundColor: "#333333",
              },
              "& .MuiSlider-thumb": {
                height: 18,
                width: 18,
                border: "2px solid white",
                backgroundColor: "secondary.main",
                "&:focus, &:hover, &.Mui-active, &.Mui-focusVisible": {
                  boxShadow: "inherit",
                },
              },
              "& .MuiSlider-mark": {
                backgroundColor: "secondary.main",
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
                fontSize: "1REM",
                px: 2,
                py: 1,
                color: theme.palette.secondary.dark,
                backgroundColor: alpha(theme.palette.secondary.main, 0.3),
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
              sx={{ fontWeight: "bold", px: 2, py: 1 }}
            />
          </Box>
        </>
      )}

      <Divider sx={{ my: 3 }} />

      {/* Speech Modes */}
      <Typography
        variant="caption"
        sx={{ fontWeight: 600, mb: 1, display: "block" }}
      >
        Speech Modes
      </Typography>
      <Box sx={{ m: 1.5, display: "flex", justifyContent: "center" }}>
        <ToggleButtonGroup
          value={selectedSpeechModes}
          onChange={handleSpeechModesChange}
          aria-label="speech modes"
          color="secondary"
          sx={{ flexWrap: "wrap", justifyContent: "center" }}
        >
          {["conversationalDialogue", "narrativeVoiceOver", "none"].map(
            (mode) => (
              <ToggleButton
                key={mode}
                value={mode}
                sx={{
                  m: 0.5,
                  textTransform: "none",
                  border: 1,
                  bgcolor: selectedSpeechModes.includes(mode)
                    ? alpha(theme.palette.secondary.main, 0.4)
                    : "#1E1E1E",
                  color: selectedSpeechModes.includes(mode)
                    ? "secondary.main"
                    : "text.primary",
                  borderColor: selectedSpeechModes.includes(mode)
                    ? "secondary.dark"
                    : "divider",
                  "&:hover": {
                    bgcolor: selectedSpeechModes.includes(mode)
                      ? alpha(theme.palette.secondary.main, 0.6)
                      : "action.hover",
                  },
                  "&.Mui-selected": {
                    bgcolor: alpha(theme.palette.secondary.main, 0.4),
                    color: "secondary.main",
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.6),
                    },
                  },
                }}
              >
                {mode === "conversationalDialogue"
                  ? "Conversational Dialogue"
                  : mode === "narrativeVoiceOver"
                  ? "Narrative Voice Over"
                  : "None"}
              </ToggleButton>
            )
          )}
        </ToggleButtonGroup>
      </Box>
    </Paper>
  );
};

export default LocaleRegionSectionMUI;
