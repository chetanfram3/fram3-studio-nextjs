/**
 * URL Validation Utilities
 * Comprehensive URL validation and sanitization
 * @version 1.0.0
 */

import {
    UrlType,
    UrlValidationResult,
    SOCIAL_MEDIA_PATTERNS,
    STRICT_SOCIAL_MEDIA_PATTERNS,
    IMAGE_EXTENSIONS,
    UrlEntry,
    UrlEntryPayload,
} from '@/types/urlManagerTypes';

/**
 * Validates a URL string
 * Checks for proper format, protocol, and security
 */
export function validateUrl(
    url: string,
    enforceHttps: boolean = true,
    urlType?: UrlType
): UrlValidationResult {
    // Empty URL
    if (!url || url.trim().length === 0) {
        return {
            isValid: false,
            error: 'URL is required',
        };
    }

    const trimmedUrl = url.trim();

    // Basic URL format check
    let urlObj: URL;
    try {
        urlObj = new URL(trimmedUrl);
    } catch {
        return {
            isValid: false,
            error: 'Invalid URL format',
        };
    }

    // Protocol validation
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return {
            isValid: false,
            error: 'URL must use HTTP or HTTPS protocol',
        };
    }

    // HTTPS enforcement
    if (enforceHttps && urlObj.protocol !== 'https:') {
        return {
            isValid: false,
            error: 'URL must use HTTPS for security',
        };
    }

    // Hostname validation
    if (!urlObj.hostname || urlObj.hostname.length === 0) {
        return {
            isValid: false,
            error: 'Invalid URL hostname',
        };
    }

    // Check for localhost/internal IPs (security)
    const hostname = urlObj.hostname.toLowerCase();
    if (
        hostname === 'localhost' ||
        hostname.startsWith('127.') ||
        hostname.startsWith('192.168.') ||
        hostname.startsWith('10.') ||
        hostname === '0.0.0.0'
    ) {
        return {
            isValid: false,
            error: 'Internal/localhost URLs are not allowed',
        };
    }

    // Suggest type based on URL pattern
    const suggestedType = suggestUrlType(trimmedUrl);

    // Type-specific warnings (non-blocking)
    let warning: string | undefined;

    if (urlType) {
        // Check social media URLs for typical patterns based on selected type
        if (urlType === UrlType.YOUTUBE && SOCIAL_MEDIA_PATTERNS.youtube.test(trimmedUrl)) {
            if (!STRICT_SOCIAL_MEDIA_PATTERNS.youtube.test(trimmedUrl)) {
                warning = "This doesn't look like a typical YouTube URL (expected: /watch?v=, /channel/, /@username, /shorts/, or youtu.be/). If this is a shortened URL, you can ignore this warning.";
            }
        } else if (urlType === UrlType.LINKEDIN && SOCIAL_MEDIA_PATTERNS.linkedin.test(trimmedUrl)) {
            if (!STRICT_SOCIAL_MEDIA_PATTERNS.linkedin.test(trimmedUrl)) {
                warning = "This doesn't look like a typical LinkedIn profile or company URL (expected: /in/username or /company/name). Verify the URL format.";
            }
        } else if (urlType === UrlType.TWITTER && SOCIAL_MEDIA_PATTERNS.twitter.test(trimmedUrl)) {
            if (!STRICT_SOCIAL_MEDIA_PATTERNS.twitter.test(trimmedUrl)) {
                warning = "This doesn't look like a typical X/Twitter profile URL (expected: /username). Verify the format.";
            }
        } else if (urlType === UrlType.FACEBOOK && SOCIAL_MEDIA_PATTERNS.facebook.test(trimmedUrl)) {
            if (!STRICT_SOCIAL_MEDIA_PATTERNS.facebook.test(trimmedUrl)) {
                warning = "This doesn't look like a typical Facebook page or profile URL. Verify the format.";
            }
        } else if (urlType === UrlType.INSTAGRAM && SOCIAL_MEDIA_PATTERNS.instagram.test(trimmedUrl)) {
            if (!STRICT_SOCIAL_MEDIA_PATTERNS.instagram.test(trimmedUrl)) {
                warning = "This doesn't look like a typical Instagram profile or post URL (expected: /username, /p/postid, or /reel/reelid). Verify the format.";
            }
        }

        // Check logo URLs for image extensions
        else if (urlType === UrlType.LOGO) {
            const pathname = urlObj.pathname.toLowerCase();
            const hasImageExtension = IMAGE_EXTENSIONS.some(ext => pathname.endsWith(ext));

            if (!hasImageExtension) {
                warning = "This URL doesn't appear to point to an image file. Logo URLs typically end with .png, .svg, .jpg, etc. If this is a CDN or dynamic image URL, you can ignore this warning.";
            }
        }
    }

    return {
        isValid: true,
        suggestedType,
        warning,
    };
}

/**
 * Suggests a URL type based on the URL pattern
 */
export function suggestUrlType(url: string): UrlType | undefined {
    const lowerUrl = url.toLowerCase();

    // Check social media patterns
    if (SOCIAL_MEDIA_PATTERNS.youtube.test(url)) {
        return UrlType.YOUTUBE;
    }
    if (SOCIAL_MEDIA_PATTERNS.linkedin.test(url)) {
        return UrlType.LINKEDIN;
    }
    if (SOCIAL_MEDIA_PATTERNS.twitter.test(url)) {
        return UrlType.TWITTER;
    }
    if (SOCIAL_MEDIA_PATTERNS.facebook.test(url)) {
        return UrlType.FACEBOOK;
    }
    if (SOCIAL_MEDIA_PATTERNS.instagram.test(url)) {
        return UrlType.INSTAGRAM;
    }

    // Check for common patterns in URL path/domain
    if (lowerUrl.includes('logo') || lowerUrl.includes('brand-assets')) {
        return UrlType.LOGO;
    }
    if (
        lowerUrl.includes('financials') ||
        lowerUrl.includes('investor') ||
        lowerUrl.includes('annual-report') ||
        lowerUrl.includes('sales')
    ) {
        return UrlType.FINANCIALS;
    }
    if (
        lowerUrl.includes('product') ||
        lowerUrl.includes('/products/') ||
        lowerUrl.includes('shop')
    ) {
        return UrlType.PRODUCT;
    }
    if (lowerUrl.includes('brand') || lowerUrl.includes('about')) {
        return UrlType.BRAND;
    }
    if (
        lowerUrl.includes('compare') ||
        lowerUrl.includes('benchmark') ||
        lowerUrl.includes('analysis')
    ) {
        return UrlType.COMPARATIVE;
    }

    return undefined; // No suggestion, will default to GENERIC
}

/**
 * Validates a custom type label
 */
export function validateCustomTypeLabel(label: string): string | null {
    if (!label || label.trim().length === 0) {
        return 'Custom type label is required';
    }

    const trimmed = label.trim();
    if (trimmed.length < 2) {
        return 'Custom type label must be at least 2 characters';
    }

    if (trimmed.length > 30) {
        return 'Custom type label must be less than 30 characters';
    }

    // Check for special characters (allow letters, numbers, spaces, hyphens, underscores)
    if (!/^[a-zA-Z0-9\s\-_]+$/.test(trimmed)) {
        return 'Custom type label can only contain letters, numbers, spaces, hyphens, and underscores';
    }

    return null; // Valid
}

/**
 * Checks if a URL already exists in the list
 */
export function isDuplicateUrl(url: string, existingUrls: UrlEntry[]): boolean {
    const normalizedUrl = normalizeUrl(url);
    return existingUrls.some(
        (entry) => normalizeUrl(entry.url) === normalizedUrl
    );
}

/**
 * Normalizes a URL for comparison
 * Removes trailing slashes, converts to lowercase
 */
export function normalizeUrl(url: string): string {
    try {
        const urlObj = new URL(url);
        // Normalize: lowercase hostname, remove trailing slash, sort query params
        let normalized = `${urlObj.protocol}//${urlObj.hostname.toLowerCase()}${urlObj.pathname}`;

        // Remove trailing slash
        if (normalized.endsWith('/') && normalized.length > urlObj.origin.length + 1) {
            normalized = normalized.slice(0, -1);
        }

        // Add sorted query string if present
        if (urlObj.search) {
            const params = new URLSearchParams(urlObj.search);
            const sortedParams = new URLSearchParams(
                Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b))
            );
            normalized += `?${sortedParams.toString()}`;
        }

        return normalized;
    } catch {
        return url.toLowerCase().trim();
    }
}

/**
 * Sanitizes URL for display (truncates if too long)
 */
export function sanitizeUrlForDisplay(url: string, maxLength: number = 60): string {
    if (url.length <= maxLength) {
        return url;
    }

    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        const path = urlObj.pathname + urlObj.search;

        if (domain.length + 10 >= maxLength) {
            return `${domain.substring(0, maxLength - 3)}...`;
        }

        const remainingLength = maxLength - domain.length - 6; // 6 for "..." and "://"
        const truncatedPath = path.substring(0, remainingLength);

        return `${domain}...${truncatedPath}`;
    } catch {
        return `${url.substring(0, maxLength - 3)}...`;
    }
}

/**
 * Converts UrlEntry array to backend payload format
 */
export function convertToPayload(entries: UrlEntry[]): UrlEntryPayload[] {
    return entries.map((entry) => ({
        type: entry.type,
        url: entry.url,
        label: entry.label,
        customTypeLabel: entry.customTypeLabel,
    }));
}

/**
 * Converts backend payload to UrlEntry format
 */
export function convertFromPayload(payload: UrlEntryPayload[]): UrlEntry[] {
    return payload.map((item, index) => ({
        id: `url-${Date.now()}-${index}`,
        url: item.url,
        type: item.type as UrlType,
        label: item.label,
        customTypeLabel: item.customTypeLabel,
        createdAt: new Date(),
        updatedAt: new Date(),
    }));
}

/**
 * Generates a unique ID for a URL entry
 */
export function generateUrlEntryId(): string {
    return `url-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Validates the entire URL entries array
 */
export function validateUrlEntries(
    entries: UrlEntry[],
    maxUrls: number = 8
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (entries.length > maxUrls) {
        errors.push(`Maximum ${maxUrls} URLs allowed`);
    }

    // Check for duplicates
    const urls = entries.map((e) => normalizeUrl(e.url));
    const duplicates = urls.filter((url, index) => urls.indexOf(url) !== index);
    if (duplicates.length > 0) {
        errors.push('Duplicate URLs detected');
    }

    // Validate each entry
    entries.forEach((entry, index) => {
        const validation = validateUrl(entry.url);
        if (!validation.isValid) {
            errors.push(`URL ${index + 1}: ${validation.error}`);
        }

        if (entry.type === UrlType.CUSTOM) {
            if (!entry.customTypeLabel) {
                errors.push(`URL ${index + 1}: Custom type label is required`);
            } else {
                const labelError = validateCustomTypeLabel(entry.customTypeLabel);
                if (labelError) {
                    errors.push(`URL ${index + 1}: ${labelError}`);
                }
            }
        }
    });

    return {
        isValid: errors.length === 0,
        errors,
    };
}