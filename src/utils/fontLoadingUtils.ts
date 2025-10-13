/**
 * Font Loading Utilities
 * 
 * Next.js Font Loading Strategy:
 * - Primary fonts are loaded in layout.tsx using next/font/google
 * - These utilities handle dynamic font loading for user-generated fonts
 * - Uses CSS Font Loading API (faster than WebFont.load)
 */

import logger from "@/utils/logger";

interface FontLoadOptions {
    weight?: string | string[];
    style?: string;
    display?: "auto" | "block" | "swap" | "fallback" | "optional";
}

/**
 * Load a Google Font dynamically using CSS Font Loading API
 * More performant than WebFont.load()
 */
export async function loadGoogleFont(
    fontFamily: string,
    options: FontLoadOptions = {}
): Promise<void> {
    const {
        weight = "400",
        style = "normal",
        display = "swap",
    } = options;

    // Check if font is already loaded
    if (document.fonts.check(`16px "${fontFamily}"`)) {
        logger.debug(`Font already loaded: ${fontFamily}`);
        return;
    }

    try {
        // Convert weight to array if single value
        const weights = Array.isArray(weight) ? weight : [weight];

        // Build Google Fonts URL
        const weightString = weights.join(";");
        const fontUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
            fontFamily
        )}:wght@${weightString}&display=${display}`;

        // Create and inject link element
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = fontUrl;

        // Wait for font to load
        await new Promise<void>((resolve, reject) => {
            link.onload = () => {
                logger.debug(`Successfully loaded font: ${fontFamily}`);
                resolve();
            };
            link.onerror = () => {
                logger.error(`Failed to load font: ${fontFamily}`);
                reject(new Error(`Failed to load font: ${fontFamily}`));
            };

            document.head.appendChild(link);
        });

        // Wait for font to be ready in document.fonts
        await document.fonts.ready;

    } catch (error) {
        logger.error(`Error loading font ${fontFamily}:`, error);
        throw error;
    }
}

/**
 * Load multiple Google Fonts in parallel
 * Much faster than loading sequentially
 */
export async function loadGoogleFonts(
    fonts: Array<{ family: string; options?: FontLoadOptions }>
): Promise<void> {
    try {
        // Load all fonts in parallel
        await Promise.all(
            fonts.map(({ family, options }) =>
                loadGoogleFont(family, options).catch((error) => {
                    // Don't fail entire batch if one font fails
                    logger.warn(`Failed to load font ${family}, continuing...`, error);
                })
            )
        );

        logger.debug(`Successfully loaded ${fonts.length} fonts`);
    } catch (error) {
        logger.error("Error loading fonts batch:", error);
    }
}

/**
 * Check if a font is available (either system or loaded)
 */
export function isFontAvailable(fontFamily: string): boolean {
    try {
        return document.fonts.check(`16px "${fontFamily}"`);
    } catch (error) {
        logger.error(`Error checking font availability: ${fontFamily}`, error);
        return false;
    }
}

/**
 * Preload fonts when component mounts
 * Use this in useEffect for dynamic font loading
 */
export function useGoogleFonts(
    fontFamilies: string[],
    options: FontLoadOptions = {}
) {
    const loadFonts = async () => {
        const uniqueFonts = [...new Set(fontFamilies)].filter(Boolean);

        if (uniqueFonts.length === 0) {
            return;
        }

        const fontsToLoad = uniqueFonts.map((family) => ({
            family,
            options,
        }));

        await loadGoogleFonts(fontsToLoad);
    };

    return { loadFonts };
}

/**
 * Get font-family CSS string with fallbacks
 */
export function getFontFamilyWithFallbacks(
    fontFamily: string,
    fallbacks: string[] = ["system-ui", "-apple-system", "sans-serif"]
): string {
    return `"${fontFamily}", ${fallbacks.join(", ")}`;
}

/**
 * Sanitize font family name for CSS
 */
export function sanitizeFontFamily(fontFamily: string): string {
    // Remove quotes and trim
    return fontFamily.replace(/['"]/g, "").trim();
}