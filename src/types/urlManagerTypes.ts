/**
 * URL Manager Types
 * Comprehensive type definitions for URL management component
 * @version 1.0.0
 */

/**
 * Supported URL types with predefined categories
 */
export enum UrlType {
    GENERIC = 'generic',
    PRODUCT = 'product',
    BRAND = 'brand',
    LOGO = 'logo',
    FINANCIALS = 'financials',
    YOUTUBE = 'youtube',
    LINKEDIN = 'linkedin',
    TWITTER = 'twitter',
    FACEBOOK = 'facebook',
    INSTAGRAM = 'instagram',
    COMPARATIVE = 'comparative',
    CUSTOM = 'custom',
}

/**
 * Display labels for URL types
 */
export const URL_TYPE_LABELS: Record<UrlType, string> = {
    [UrlType.GENERIC]: 'Generic',
    [UrlType.PRODUCT]: 'Product',
    [UrlType.BRAND]: 'Brand',
    [UrlType.LOGO]: 'Logo',
    [UrlType.FINANCIALS]: 'Financials',
    [UrlType.YOUTUBE]: 'YouTube',
    [UrlType.LINKEDIN]: 'LinkedIn',
    [UrlType.TWITTER]: 'X (Twitter)',
    [UrlType.FACEBOOK]: 'Facebook',
    [UrlType.INSTAGRAM]: 'Instagram',
    [UrlType.COMPARATIVE]: 'Comparative Analysis',
    [UrlType.CUSTOM]: 'Custom Type',
};

export const URL_TYPE_DEFAULT_LABELS: Record<UrlType, string | null> = {
    [UrlType.GENERIC]: 'General Reference',
    [UrlType.PRODUCT]: 'Product Information',
    [UrlType.BRAND]: 'Brand Guidelines',
    [UrlType.LOGO]: 'Logo & Assets',
    [UrlType.FINANCIALS]: 'Financial Data',
    [UrlType.YOUTUBE]: 'Youtube Channel',
    [UrlType.LINKEDIN]: 'Professional Profile',
    [UrlType.TWITTER]: 'Social Media Profile',
    [UrlType.FACEBOOK]: 'Facebook Page',
    [UrlType.INSTAGRAM]: 'Instagram Profile',
    [UrlType.COMPARATIVE]: 'Competitive Analysis & Research',
    [UrlType.CUSTOM]: null, // Custom types don't get default labels
};

/**
 * Icon mapping for URL types (Material-UI icon names)
 */
export const URL_TYPE_ICONS: Record<UrlType, string> = {
    [UrlType.GENERIC]: 'Link',
    [UrlType.PRODUCT]: 'Inventory',
    [UrlType.BRAND]: 'Storefront',
    [UrlType.LOGO]: 'Image',
    [UrlType.FINANCIALS]: 'AttachMoney',
    [UrlType.YOUTUBE]: 'YouTube',
    [UrlType.LINKEDIN]: 'LinkedIn',
    [UrlType.TWITTER]: 'X',
    [UrlType.FACEBOOK]: 'Facebook',
    [UrlType.INSTAGRAM]: 'Instagram',
    [UrlType.COMPARATIVE]: 'Analytics',
    [UrlType.CUSTOM]: 'Extension',
};

/**
 * Social media URL patterns for validation
 */
export const SOCIAL_MEDIA_PATTERNS: Record<string, RegExp> = {
    youtube: /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+$/i,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/.+$/i,
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/.+$/i,
    facebook: /^https?:\/\/(www\.)?facebook\.com\/.+$/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/.+$/i,
};

/**
 * Stricter social media URL patterns for specific formats
 * Used for warnings to help users identify potentially incorrect URLs
 */
export const STRICT_SOCIAL_MEDIA_PATTERNS: Record<string, RegExp> = {
    youtube: /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|channel\/|c\/|@|playlist\?list=|shorts\/)|youtu\.be\/).+$/i,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in\/[a-zA-Z0-9-]+|company\/[a-zA-Z0-9-]+)(\/.*)?$/i,
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?.*$/i,
    facebook: /^https?:\/\/(www\.)?facebook\.com\/(profile\.php\?id=\d+|[a-zA-Z0-9.]+|pages\/[^\/]+\/\d+)(\/.*)?$/i,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/(p\/[a-zA-Z0-9_-]+|reel\/[a-zA-Z0-9_-]+|[a-zA-Z0-9._]+)\/?.*$/i,
};

/**
 * Image file extensions for logo validation
 */
export const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif', '.ico', '.bmp', '.avif'];

/**
 * URL entry data structure
 */
export interface UrlEntry {
    /** Unique identifier for the URL entry */
    id: string;
    /** The URL string (must be valid and secure) */
    url: string;
    /** Type classification of the URL */
    type: UrlType;
    /** Custom type label (required when type is CUSTOM) */
    customTypeLabel?: string;
    /** Optional label/description for the URL */
    label?: string;
    /** Timestamp when entry was created */
    createdAt: Date;
    /** Timestamp when entry was last modified */
    updatedAt: Date;
}

/**
 * Validation result for URL entries
 */
export interface UrlValidationResult {
    /** Whether the URL is valid */
    isValid: boolean;
    /** Error message if invalid */
    error?: string;
    /** Warning message (non-blocking) */
    warning?: string;
    /** Suggested URL type based on pattern matching */
    suggestedType?: UrlType;
}

/**
 * Configuration for URL Manager component
 */
export interface UrlManagerConfig {
    /** Maximum number of URLs allowed (default: 8) */
    maxUrls?: number;
    /** Whether to allow custom types (default: true) */
    allowCustomTypes?: boolean;
    /** Whether to enforce HTTPS (default: true) */
    enforceHttps?: boolean;
    /** Whether to show labels for URLs (default: true) */
    showLabels?: boolean;
    /** Placeholder text for URL input */
    urlPlaceholder?: string;
    /** Placeholder text for label input */
    labelPlaceholder?: string;
    /** Whether the component is in read-only mode */
    readOnly?: boolean;
    /** Custom validation function */
    customValidator?: (url: string) => UrlValidationResult;
}

/**
 * Props for UrlManager component
 */
export interface UrlManagerProps {
    /** Array of URL entries */
    value: UrlEntry[];
    /** Callback when URLs change */
    onChange: (urls: UrlEntry[]) => void;
    /** Configuration options */
    config?: UrlManagerConfig;
    /** Whether the component is disabled */
    disabled?: boolean;
    /** Error message to display */
    error?: string;
    /** Helper text to display */
    helperText?: string;
    /** Component label */
    label?: string;
    /** Whether the field is required */
    required?: boolean;
}

/**
 * Backend payload structure for URL entries
 * Simplified key-value pair format for API transmission
 */
export interface UrlEntryPayload {
    type: string;
    url: string;
    label?: string;
    customTypeLabel?: string;
}

/**
 * Utility type for URL entry creation (without auto-generated fields)
 */
export type UrlEntryInput = Omit<UrlEntry, 'id' | 'createdAt' | 'updatedAt'>;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: Required<Omit<UrlManagerConfig, 'customValidator'>> = {
    maxUrls: 12,
    allowCustomTypes: true,
    enforceHttps: true,
    showLabels: true,
    urlPlaceholder: 'Enter URL (https://...)',
    labelPlaceholder: 'Optional description',
    readOnly: false,
};