// src/config/brandConfig.ts

/**
 * Multi-Brand Configuration System
 * 
 * This file contains all brand definitions for the application.
 * Brands can be switched via the NEXT_PUBLIC_BRAND_KEY environment variable.
 * 
 * To add a new brand:
 * 1. Add brand definition to the brands object
 * 2. Add corresponding CSS variables to globals.css
 * 3. Add brand logos to public/logos/[brand-id]/
 * 4. Test in both light and dark modes
 */

/**
 * Brand color palette for a specific theme mode
 */
export interface BrandColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  secondary: string;
  secondaryLight: string;
  secondaryDark: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent?: string;
}

/**
 * Complete brand configuration
 */
export interface BrandConfig {
  id: string;                    // Unique brand identifier (used in env var)
  name: string;                  // Display name (e.g., "FRAM3 STUDIO")
  tagline: string;               // Brand tagline/slogan
  logo: {
    light: string;               // Light mode logo path
    dark: string;                // Dark mode logo path
    favicon: string;             // Favicon path
    signin?: string;             // Optional signin page specific logo
    headerLogo?: string;
  };
  colors: {
    light: BrandColors;          // Light mode color palette
    dark: BrandColors;           // Dark mode color palette
  };
  fonts: {
    heading: string;             // Font family for headings
    body: string;                // Font family for body text
  };
  borderRadius: number;          // Default border radius in px
  spacing: number;               // Base spacing unit (default: 8)
}

/**
 * All available brand configurations
 */
export const brands: Record<string, BrandConfig> = {
  /**
   * FRAM3 Studio - Default Brand
   * Sophisticated tech aesthetic with bronze/orange-gold palette
   * 
   * LIGHT MODE (UPDATED):
   * - Primary: Bronze-Brown (#8d600d) - midpoint of #1a1a1a → #ffa500 gradient
   * - Secondary: Orange-Gold (#ffa500) for strategic accents and highlights
   * - Background: Gradient with 15% opacity (#8d600d15 → #ffa50015)
   * - Warm, cohesive, accessible (WCAG AAA compliant)
   * 
   * DARK MODE (UNCHANGED):
   * - Primary: Pure Gold (#FFD700) for signature brand look
   * - Secondary: White (#ffffff) for contrast
   * - Classic black and gold aesthetic
   */
  fram3: {
    id: 'fram3',
    name: 'FRAM3 STUDIO',
    tagline: 'From Words to Worlds',
    logo: {
      light: '/logos/fram3/signin.png',
      dark: '/logos/fram3/signin.png',
      favicon: '/logos/fram3/favicon.ico',
      signin: '/logos/fram3/signin.png',
      headerLogo: 'https://storage.googleapis.com/fram3-ext/Web2/logoFavicons/new256.ico'
    },
    colors: {
      light: {
        primary: '#8d600d',           // Bronze-Brown - gradient midpoint
        primaryLight: '#b77d11',      // Lighter bronze
        primaryDark: '#634309',       // Darker bronze
        secondary: '#ffa500',         // Orange-Gold - accents
        secondaryLight: '#ffc04d',    // Light Orange-Gold
        secondaryDark: '#ff8c00',     // Dark Orange-Gold
        background: '#8d600d15',      // Very subtle bronze tint (15% opacity)
        surface: '#e8dece',           // White - cards/surfaces
        text: '#1a1a1a',              // Deep Charcoal - primary text
        textSecondary: '#6b7280',     // Medium Gray - secondary text
        accent: '#ffa500',            // Orange-Gold - strategic highlights
      },
      dark: {
        primary: '#FFD700',           // Gold - signature color
        primaryLight: '#FFE44D',      // Light Gold
        primaryDark: '#FFC000',       // Dark Gold
        secondary: '#ffffff',         // White - contrast
        secondaryLight: '#ffffff',    // Pure White
        secondaryDark: '#e0e0e0',     // Light Gray
        background: '#000000',        // Black - page background
        surface: '#121212',           // Very Dark Gray - cards/surfaces
        text: '#ffffff',              // White - primary text
        textSecondary: '#b3b3b3',     // Light Gray - secondary text
        accent: '#FFD700',            // Gold - highlights
      },
    },
    fonts: {
      heading: '"Orbitron", "Rajdhani", sans-serif',
      body: '"Inter", sans-serif',
    },
    borderRadius: 4,
    spacing: 8,
  },

  /**
   * ACME Corporation - Professional Business Brand
   * Red and orange color scheme with sharp, clean aesthetics
   */
  acme: {
    id: 'acme',
    name: 'ACME CORPORATION',
    tagline: 'Excellence in Every Detail',
    logo: {
      light: '/logos/acme/logo-light.svg',
      dark: '/logos/acme/logo-dark.svg',
      favicon: '/logos/acme/favicon.ico',
    },
    colors: {
      light: {
        primary: '#dc2626',           // Red 600
        primaryLight: '#ef4444',      // Red 500
        primaryDark: '#b91c1c',       // Red 700
        secondary: '#ea580c',         // Orange 600
        secondaryLight: '#f97316',    // Orange 500
        secondaryDark: '#c2410c',     // Orange 700
        background: '#ffffff',        // White
        surface: '#f9fafb',           // Gray 50
        text: '#111827',              // Gray 900
        textSecondary: '#6b7280',     // Gray 500
        accent: '#f59e0b',            // Amber 500
      },
      dark: {
        primary: '#ef4444',           // Red 500
        primaryLight: '#f87171',      // Red 400
        primaryDark: '#dc2626',       // Red 600
        secondary: '#f97316',         // Orange 500
        secondaryLight: '#fb923c',    // Orange 400
        secondaryDark: '#ea580c',     // Orange 600
        background: '#111827',        // Gray 900
        surface: '#1f2937',           // Gray 800
        text: '#f9fafb',              // Gray 50
        textSecondary: '#d1d5db',     // Gray 300
        accent: '#fcd34d',            // Amber 300
      },
    },
    fonts: {
      heading: '"Montserrat", sans-serif',
      body: '"Open Sans", sans-serif',
    },
    borderRadius: 4,
    spacing: 8,
  },

  /**
   * TechCo - Modern Technology Brand
   * Purple and cyan color scheme with rounded, friendly design
   */
  techco: {
    id: 'techco',
    name: 'TECHCO',
    tagline: 'Innovation Simplified',
    logo: {
      light: '/logos/techco/logo-light.svg',
      dark: '/logos/techco/logo-dark.svg',
      favicon: '/logos/techco/favicon.ico',
    },
    colors: {
      light: {
        primary: '#7c3aed',           // Violet 600
        primaryLight: '#a78bfa',      // Violet 400
        primaryDark: '#6d28d9',       // Violet 700
        secondary: '#06b6d4',         // Cyan 600
        secondaryLight: '#22d3ee',    // Cyan 400
        secondaryDark: '#0891b2',     // Cyan 700
        background: '#ffffff',        // White
        surface: '#f8fafc',           // Slate 50
        text: '#0f172a',              // Slate 900
        textSecondary: '#64748b',     // Slate 500
        accent: '#ec4899',            // Pink 500
      },
      dark: {
        primary: '#a78bfa',           // Violet 400
        primaryLight: '#c4b5fd',      // Violet 300
        primaryDark: '#8b5cf6',       // Violet 500
        secondary: '#22d3ee',         // Cyan 400
        secondaryLight: '#67e8f9',    // Cyan 300
        secondaryDark: '#06b6d4',     // Cyan 600
        background: '#0f172a',        // Slate 900
        surface: '#1e293b',           // Slate 800
        text: '#f8fafc',              // Slate 50
        textSecondary: '#cbd5e1',     // Slate 300
        accent: '#f472b6',            // Pink 400
      },
    },
    fonts: {
      heading: '"Space Grotesk", sans-serif',
      body: '"Inter", sans-serif',
    },
    borderRadius: 12,
    spacing: 8,
  },
};

/**
 * Get the current brand configuration from environment variable
 * Falls back to FRAM3 if not set or invalid
 * 
 * @returns {BrandConfig} The current brand configuration
 */
export function getCurrentBrand(): BrandConfig {
  const brandKey = process.env.NEXT_PUBLIC_BRAND_KEY?.toLowerCase() || 'fram3';
  const brand = brands[brandKey];

  if (!brand) {
    console.warn(
      `Invalid brand key "${brandKey}" in NEXT_PUBLIC_BRAND_KEY. ` +
      `Falling back to "fram3". ` +
      `Available brands: ${Object.keys(brands).join(', ')}`
    );
    return brands.fram3;
  }

  return brand;
}

/**
 * Get a specific brand configuration by key
 * 
 * @param {string} key - The brand identifier
 * @returns {BrandConfig | undefined} The brand configuration or undefined if not found
 */
export function getBrandByKey(key: string): BrandConfig | undefined {
  return brands[key.toLowerCase()];
}

/**
 * Get all available brand identifiers
 * 
 * @returns {string[]} Array of brand IDs
 */
export function getAvailableBrands(): string[] {
  return Object.keys(brands);
}

/**
 * Get brand colors for current theme mode
 * 
 * @param {BrandConfig} brand - The brand configuration
 * @param {'light' | 'dark'} mode - The theme mode
 * @returns {BrandColors} The color palette for the specified mode
 */
export function getBrandColors(
  brand: BrandConfig,
  mode: 'light' | 'dark'
): BrandColors {
  return brand.colors[mode];
}

/**
 * Type guard to check if a string is a valid brand key
 * 
 * @param {string} key - The string to check
 * @returns {boolean} True if the key is a valid brand identifier
 */
export function isValidBrandKey(key: string): key is keyof typeof brands {
  return key.toLowerCase() in brands;
}

/**
 * Get brand display information
 * 
 * @param {BrandConfig} brand - The brand configuration
 * @returns {object} Display information for the brand
 */
export function getBrandDisplayInfo(brand: BrandConfig) {
  return {
    id: brand.id,
    name: brand.name,
    tagline: brand.tagline,
  };
}

/**
 * Default export for convenience
 */
export default {
  brands,
  getCurrentBrand,
  getBrandByKey,
  getAvailableBrands,
  getBrandColors,
  isValidBrandKey,
  getBrandDisplayInfo,
};