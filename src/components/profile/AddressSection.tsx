// src/components/profile/AddressSection.tsx
"use client";

import { TextField, Typography, Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Country, State, City } from "country-state-city";
import Select, { StylesConfig } from "react-select";
import { useEffect, useState } from "react";
import { getCurrentBrand } from "@/config/brandConfig";
import { Address } from "@/types/profile";

interface AddressSectionProps {
  address: Address;
  onUpdate: (field: string, value: string) => void;
}

interface Option {
  label: string;
  value: string;
}

export default function AddressSection({
  address,
  onUpdate,
}: AddressSectionProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const [countries, setCountries] = useState<Option[]>([]);
  const [states, setStates] = useState<Option[]>([]);
  const [cities, setCities] = useState<Option[]>([]);

  // Initialize data on component mount
  useEffect(() => {
    const countryList = Country.getAllCountries().map((country) => ({
      label: country.name,
      value: country.isoCode,
    }));
    setCountries(countryList);

    // If no country selected or invalid country, default to India
    if (!address.country || !Country.getCountryByCode(address.country)) {
      onUpdate("country", "IN");
    }
  }, []);

  // Update states when country changes
  useEffect(() => {
    if (address.country) {
      const stateList = State.getStatesOfCountry(address.country).map(
        (state) => ({
          label: state.name,
          value: state.isoCode,
        })
      );
      setStates(stateList);

      // If no state selected or invalid state for this country, default to Maharashtra for India
      if (
        address.country === "IN" &&
        (!address.state || !State.getStateByCodeAndCountry(address.state, "IN"))
      ) {
        onUpdate("state", "MH");
      }
    }
  }, [address.country]);

  // Update cities when state changes
  useEffect(() => {
    if (address.country && address.state) {
      const cityList = City.getCitiesOfState(
        address.country,
        address.state
      ).map((city) => ({
        label: city.name,
        value: city.name,
      }));
      setCities(cityList);

      // If no city selected for Maharashtra, default to Mumbai
      if (
        address.country === "IN" &&
        address.state === "MH" &&
        (!address.city || !cityList.find((c) => c.value === address.city))
      ) {
        onUpdate("city", "Mumbai");
      }
    }
  }, [address.country, address.state]);

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
    clearIndicator: (base) => ({
      ...base,
      color: theme.palette.action.active,
      "&:hover": {
        color: theme.palette.error.main,
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
        Address Information
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 3,
        }}
      >
        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
          <TextField
            fullWidth
            label="Street"
            value={address.street || ""}
            onChange={(e) => onUpdate("street", e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
        <Box>
          <Select
            options={countries}
            value={countries.find((c) => c.value === address.country)}
            onChange={(option) => option && onUpdate("country", option.value)}
            placeholder="Select Country"
            styles={selectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </Box>
        <Box>
          <Select
            options={states}
            value={states.find((s) => s.value === address.state)}
            onChange={(option) => option && onUpdate("state", option.value)}
            placeholder="Select State"
            isDisabled={!address.country}
            styles={selectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </Box>
        <Box>
          <Select
            options={cities}
            value={cities.find((c) => c.value === address.city)}
            onChange={(option) => option && onUpdate("city", option.value)}
            placeholder="Select City"
            isDisabled={!address.state}
            styles={selectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
        </Box>
        <Box>
          <TextField
            fullWidth
            label="Postal Code"
            value={address.postalCode || ""}
            onChange={(e) => onUpdate("postalCode", e.target.value)}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: `${brand.borderRadius}px`,
              },
            }}
          />
        </Box>
      </Box>
    </Box>
  );
}
