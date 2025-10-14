import { Country, State } from "country-state-city"
import { countryLanguages, stateLanguages } from "../lib/languageData"

// Map ISO country codes to country names used in languageData.ts
const isoToCountryNameMap: Record<string, string> = {
  // North America
  US: "USA",
  CA: "Canada",
  MX: "Mexico",

  // Europe
  GB: "United Kingdom",
  FR: "France",
  DE: "Germany",
  ES: "Spain",
  IT: "Italy",

  // Asia
  CN: "China",
  IN: "India",
  JP: "Japan",
  RU: "Russia",

  // Africa
  NG: "Nigeria",
  EG: "Egypt",
  ZA: "South Africa",

  // South America
  BR: "Brazil",
  AR: "Argentina",
  CO: "Colombia",

  // Oceania
  AU: "Australia",
  NZ: "New Zealand",

  // Add more mappings as needed
}

// Map ISO state codes to state names used in languageData.ts
// Format: { countryCode: { stateCode: stateName } }
const isoToStateNameMap: Record<string, Record<string, string>> = {
  US: {
    CA: "California",
    TX: "Texas",
    NY: "New York",
    FL: "Florida",
    IL: "Illinois",
    NM: "New Mexico",
    HI: "Hawaii",
    LA: "Louisiana",
    AK: "Alaska",
  },
  CA: {
    QC: "Quebec",
    ON: "Ontario",
    BC: "British Columbia",
    AB: "Alberta",
    MB: "Manitoba",
  },
  IN: {
    TN: "Tamil Nadu",
    MH: "Maharashtra",
    WB: "West Bengal",
    KA: "Karnataka",
    GJ: "Gujarat",
  },
  CN: {
    BJ: "Beijing",
    SH: "Shanghai",
    GD: "Guangdong",
    HK: "Hong Kong",
    XZ: "Tibet",
  },
  DE: {
    BY: "Bavaria",
    BE: "Berlin",
    NW: "North Rhine-Westphalia",
    SN: "Saxony",
  },
  AU: {
    NSW: "New South Wales",
    VIC: "Victoria",
    QLD: "Queensland",
    WA: "Western Australia",
  },
  BR: {
    SP: "São Paulo",
    RJ: "Rio de Janeiro",
    AM: "Amazonas",
    RS: "Rio Grande do Sul",
  },
  // Add more mappings as needed
}

// Get country name from ISO code for language lookup
export function getCountryNameFromISO(isoCode: string): string | undefined {
  // First check our direct mapping
  if (isoToCountryNameMap[isoCode]) {
    return isoToCountryNameMap[isoCode]
  }

  // If not found, try to get the name from country-state-city
  const country = Country.getCountryByCode(isoCode)
  return country?.name
}

// Get state name from ISO code for language lookup
export function getStateNameFromISO(countryCode: string, stateCode: string): string | undefined {
  // First check our direct mapping
  if (isoToStateNameMap[countryCode]?.[stateCode]) {
    return isoToStateNameMap[countryCode][stateCode]
  }

  // If not found, try to get the name from country-state-city
  const state = State.getStateByCodeAndCountry(stateCode, countryCode)
  return state?.name
}

// Get languages for a country using ISO code
export function getLanguagesByCountryISO(countryCode: string): string[] {
  const countryName = getCountryNameFromISO(countryCode)

  if (!countryName) {
    return []
  }

  // Look up languages by country name
  return countryLanguages[countryName] || []
}

// Get languages for a state using ISO codes
export function getLanguagesByStateISO(countryCode: string, stateCode: string): string[] {
  const countryName = getCountryNameFromISO(countryCode)
  const stateName = getStateNameFromISO(countryCode, stateCode)

  if (!countryName || !stateName) {
    // Fallback to country languages if state not found
    return getLanguagesByCountryISO(countryCode)
  }

  // Look up languages by country and state name
  return stateLanguages[countryName]?.[stateName] || getLanguagesByCountryISO(countryCode)
}
