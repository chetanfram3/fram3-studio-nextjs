import { Country, State, City } from "country-state-city"
import type { ICountry, IState, ICity } from "country-state-city"

// Map continents to their ISO region codes
export const continentMap: Record<string, string[]> = {
  Africa: [
    "DZ",
    "AO",
    "BJ",
    "BW",
    "BF",
    "BI",
    "CM",
    "CV",
    "CF",
    "TD",
    "KM",
    "CG",
    "CD",
    "DJ",
    "EG",
    "GQ",
    "ER",
    "ET",
    "GA",
    "GM",
    "GH",
    "GN",
    "GW",
    "CI",
    "KE",
    "LS",
    "LR",
    "LY",
    "MG",
    "MW",
    "ML",
    "MR",
    "MU",
    "MA",
    "MZ",
    "NA",
    "NE",
    "NG",
    "RW",
    "ST",
    "SN",
    "SC",
    "SL",
    "SO",
    "ZA",
    "SS",
    "SD",
    "SZ",
    "TZ",
    "TG",
    "TN",
    "UG",
    "ZM",
    "ZW",
  ],
  Asia: [
    "AF",
    "AM",
    "AZ",
    "BH",
    "BD",
    "BT",
    "BN",
    "KH",
    "CN",
    "CY",
    "GE",
    "HK",
    "IN",
    "ID",
    "IR",
    "IQ",
    "IL",
    "JP",
    "JO",
    "KZ",
    "KW",
    "KG",
    "LA",
    "LB",
    "MO",
    "MY",
    "MV",
    "MN",
    "MM",
    "NP",
    "KP",
    "OM",
    "PK",
    "PS",
    "PH",
    "QA",
    "SA",
    "SG",
    "KR",
    "LK",
    "SY",
    "TW",
    "TJ",
    "TH",
    "TL",
    "TR",
    "TM",
    "AE",
    "UZ",
    "VN",
    "YE",
  ],
  Europe: [
    "AL",
    "AD",
    "AT",
    "BY",
    "BE",
    "BA",
    "BG",
    "HR",
    "CZ",
    "DK",
    "EE",
    "FO",
    "FI",
    "FR",
    "DE",
    "GI",
    "GR",
    "HU",
    "IS",
    "IE",
    "IT",
    "LV",
    "LI",
    "LT",
    "LU",
    "MT",
    "MD",
    "MC",
    "ME",
    "NL",
    "MK",
    "NO",
    "PL",
    "PT",
    "RO",
    "RU",
    "SM",
    "RS",
    "SK",
    "SI",
    "ES",
    "SE",
    "CH",
    "UA",
    "GB",
    "VA",
  ],
  "North America": [
    "AG",
    "BS",
    "BB",
    "BZ",
    "CA",
    "CR",
    "CU",
    "DM",
    "DO",
    "SV",
    "GD",
    "GT",
    "HT",
    "HN",
    "JM",
    "MX",
    "NI",
    "PA",
    "KN",
    "LC",
    "VC",
    "TT",
    "US",
  ],
  "South America": ["AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE"],
  Oceania: ["AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO", "TV", "VU"],
  Antarctica: ["AQ"],
}

// Get all continents
export const getAllContinents = (): string[] => {
  return Object.keys(continentMap)
}

// Get countries by continent
export const getCountriesByContinent = (continent: string): ICountry[] => {
  const countryCodes = continentMap[continent] || []
  return Country.getAllCountries().filter((country) => countryCodes.includes(country.isoCode))
}

// Get all countries
export const getAllCountries = (): ICountry[] => {
  return Country.getAllCountries()
}

// Get states by country
export const getStatesByCountry = (countryCode: string): IState[] => {
  return State.getStatesOfCountry(countryCode)
}

// Get cities by state and country
export const getCitiesByState = (countryCode: string, stateCode: string): ICity[] => {
  return City.getCitiesOfState(countryCode, stateCode)
}

// Get all cities by country (without state filtering)
export const getAllCitiesByCountry = (countryCode: string): ICity[] => {
  return City.getCitiesOfCountry(countryCode)
}

// Find country by name
export const findCountryByName = (name: string): ICountry | undefined => {
  return Country.getAllCountries().find((country) => country.name.toLowerCase() === name.toLowerCase())
}

// Find state by name and country
export const findStateByName = (name: string, countryCode: string): IState | undefined => {
  return State.getStatesOfCountry(countryCode).find((state) => state.name.toLowerCase() === name.toLowerCase())
}

// Get continent for a country
export const getContinentForCountry = (countryCode: string): string | undefined => {
  for (const [continent, countries] of Object.entries(continentMap)) {
    if (countries.includes(countryCode)) {
      return continent
    }
  }
  return undefined
}

// Format location string from country, state, and city
export const formatLocation = (country?: string, state?: string, city?: string): string => {
  const parts = []
  if (city) parts.push(city)
  if (state) parts.push(state)
  if (country) parts.push(country)
  return parts.join(", ")
}
