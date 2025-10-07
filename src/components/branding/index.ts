// src/components/branding/index.ts

/**
 * Branding Components Module
 * 
 * This module exports all brand-related components for the multi-brand theme system.
 * 
 * Usage:
 * ```tsx
 * import { BrandLogo, BrandSwitcher } from '@/components/branding';
 * ```
 * 
 * Components:
 * - BrandLogo: Dynamic logo component that adapts to current brand and theme mode
 *   - Supports light/dark mode switching
 *   - Special rendering for FRAM3 with animations
 *   - Configurable size (small, medium, large)
 *   - Optional text display
 *   - Click handler support
 * 
 * - BrandSwitcher: Development-only tool for previewing different brands
 *   - Only renders in development mode
 *   - Visual brand preview with colors and fonts
 *   - Shows instructions for permanent brand switching
 *   - Active brand indicator
 */

// Component exports
export { BrandLogo } from './BrandLogo';
export { BrandSwitcher } from './BrandSwitcher';

// Type exports (if components export any types)
// Add type exports here as needed, for example:
// export type { BrandLogoProps } from './BrandLogo';
// export type { BrandSwitcherProps } from './BrandSwitcher';