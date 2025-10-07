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
   * Futuristic tech aesthetic with blue/gold palette
   */
  fram3: {
    id: 'fram3',
    name: 'FRAM3 STUDIO',
    tagline: 'Building the Future of Digital Innovation',
    logo: {
      light: '/logos/fram3/logo-light.svg',
      dark: '/logos/fram3/logo-dark.svg',
      favicon: '/logos/fram3/favicon.ico',
    },
    colors: {
      light: {
        primary: '#1E88E5',           // Blue 600
        primaryLight: '#64B5F6',      // Blue 400
        primaryDark: '#1565C0',       // Blue 800
        secondary: '#FFA000',         // Amber 700
        secondaryLight: '#FFB74D',    // Amber 400
        secondaryDark: '#FF8F00',     // Amber 800
        background: '#FFFFFF',        // White
        surface: '#F5F5F5',           // Light Gray
        text: '#000000',              // Black
        textSecondary: '#424242',     // Dark Gray
        accent: '#D4AF37',            // Gold
      },
      dark: {
        primary: '#FFFFFF',           // White
        primaryLight: '#FFFFFF',      // White
        primaryDark: '#E0E0E0',       // Light Gray
        secondary: '#FFD700',         // Gold
        secondaryLight: '#FFE44D',    // Light Gold
        secondaryDark: '#FFC000',     // Dark Gold
        background: '#000000',        // Black
        surface: '#121212',           // Dark Surface
        text: '#FFFFFF',              // White
        textSecondary: '#B3B3B3',     // Light Gray
        accent: '#FFCB05',            // Bright Gold
      },
    },
    fonts: {
      heading: '"Orbitron", "Rajdhani", sans-serif',
      body: '"Inter", "Roboto", sans-serif',
    },
    borderRadius: 8,
    spacing: 8,
  },

  /**
   * ACME Corporation
   * Corporate professional aesthetic with red/orange palette
   */
  acme: {
    id: 'acme',
    name: 'ACME CORPORATION',
    tagline: 'Excellence in Every Solution',
    logo: {
      light: '/logos/acme/logo-light.svg',
      dark: '/logos/acme/logo-dark.svg',
      favicon: '/logos/acme/favicon.ico',
    },
    colors: {
      light: {
        primary: '#DC2626',           // Red 600
        primaryLight: '#EF4444',      // Red 500
        primaryDark: '#B91C1C',       // Red 700
        secondary: '#EA580C',         // Orange 600
        secondaryLight: '#F97316',    // Orange 500
        secondaryDark: '#C2410C',     // Orange 700
        background: '#FFFFFF',        // White
        surface: '#F9FAFB',           // Gray 50
        text: '#111827',              // Gray 900
        textSecondary: '#6B7280',     // Gray 500
        accent: '#F59E0B',            // Amber 500
      },
      dark: {
        primary: '#EF4444',           // Red 500
        primaryLight: '#F87171',      // Red 400
        primaryDark: '#DC2626',       // Red 600
        secondary: '#F97316',         // Orange 500
        secondaryLight: '#FB923C',    // Orange 400
        secondaryDark: '#EA580C',     // Orange 600
        background: '#111827',        // Gray 900
        surface: '#1F2937',           // Gray 800
        text: '#F9FAFB',              // Gray 50
        textSecondary: '#D1D5DB',     // Gray 300
        accent: '#FCD34D',            // Amber 300
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
   * TechCo
   * Modern tech aesthetic with purple/cyan palette
   */
  techco: {
    id: 'techco',
    name: 'TECHCO',
    tagline: 'Innovation Through Technology',
    logo: {
      light: '/logos/techco/logo-light.svg',
      dark: '/logos/techco/logo-dark.svg',
      favicon: '/logos/techco/favicon.ico',
    },
    colors: {
      light: {
        primary: '#7C3AED',           // Violet 600
        primaryLight: '#A78BFA',      // Violet 400
        primaryDark: '#6D28D9',       // Violet 700
        secondary: '#06B6D4',         // Cyan 600
        secondaryLight: '#22D3EE',    // Cyan 400
        secondaryDark: '#0891B2',     // Cyan 700
        background: '#FFFFFF',        // White
        surface: '#F8FAFC',           // Slate 50
        text: '#0F172A',              // Slate 900
        textSecondary: '#64748B',     // Slate 500
        accent: '#EC4899',            // Pink 500
      },
      dark: {
        primary: '#A78BFA',           // Violet 400
        primaryLight: '#C4B5FD',      // Violet 300
        primaryDark: '#8B5CF6',       // Violet 500
        secondary: '#22D3EE',         // Cyan 400
        secondaryLight: '#67E8F9',    // Cyan 300
        secondaryDark: '#06B6D4',     // Cyan 600
        background: '#0F172A',        // Slate 900
        surface: '#1E293B',           // Slate 800
        text: '#F8FAFC',              // Slate 50
        textSecondary: '#CBD5E1',     // Slate 300
        accent: '#F472B6',            // Pink 400
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
 * Get the current active brand based on environment variable
 * Falls back to 'fram3' if not set or invalid
 * 
 * @returns {BrandConfig} The active brand configuration
 */
export function getCurrentBrand(): BrandConfig {
  const brandKey = process.env.NEXT_PUBLIC_BRAND_KEY || 'fram3';
  const brand = brands[brandKey.toLowerCase()];
  
  if (!brand) {
    console.warn(
      `Invalid brand key "${brandKey}". Falling back to "fram3". ` +
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