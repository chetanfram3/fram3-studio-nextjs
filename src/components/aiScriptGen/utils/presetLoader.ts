// src/components/aiScriptGen/utils/presetLoader.ts

import logger from "@/utils/logger";
import { validateFormValuesFormat } from "./presetUtils";
import type { FormValues } from "../types";
import type { ContentType } from "@/config/creativeConstants";

/**
 * Firebase Storage bucket for creative presets
 * These are public files stored in GCS
 */
const STORAGE_BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fram3-prod";
const PRESETS_BASE_PATH = "presets/creative"; // Path in GCS bucket

/**
 * Construct the public GCS URL for a preset file
 * @param type - Content type (image, video, audio, text)
 * @param key - Unique key for the preset
 * @returns The public GCS URL
 */
const getPresetUrl = (type: ContentType, key: string): string => {
    const normalizedType = type.toLowerCase();
    const fileName = `${key}.json`;

    // Public GCS URL format
    return `https://storage.googleapis.com/${STORAGE_BUCKET}/${PRESETS_BASE_PATH}/${normalizedType}/${fileName}`;
};

/**
 * Load a creative preset from Firebase Storage (GCS)
 * @param type - Content type (image, video, audio, text)
 * @param key - Unique key for the preset (e.g., "commercial", "blog-post")
 * @returns Promise resolving to FormValues or null if not found/invalid
 */
export const loadCreativePreset = async (
    type: ContentType,
    key: string
): Promise<FormValues | null> => {
    try {
        const presetUrl = getPresetUrl(type, key);

        logger.debug("Loading creative preset from GCS:", {
            type,
            key,
            url: presetUrl
        });

        // Fetch the preset JSON from GCS
        const response = await fetch(presetUrl, {
            method: "GET",
            headers: {
                "Accept": "application/json",
            },
            // Add cache control for better performance
            cache: "force-cache", // Cache the preset files
        });

        if (!response.ok) {
            if (response.status === 404) {
                logger.warn(`Preset not found in GCS: ${presetUrl}`, {
                    status: response.status,
                });
            } else {
                logger.error(`Failed to fetch preset from GCS: ${presetUrl}`, {
                    status: response.status,
                    statusText: response.statusText,
                });
            }
            return null;
        }

        const data = await response.json();

        // Validate the preset format
        if (!validateFormValuesFormat(data)) {
            logger.error("Invalid preset format from GCS:", { type, key, data });
            return null;
        }

        logger.debug("Creative preset loaded successfully from GCS:", { type, key });
        return data as FormValues;
    } catch (error) {
        logger.error("Failed to load creative preset from GCS:", {
            type,
            key,
            error: error instanceof Error ? error.message : String(error),
        });
        return null;
    }
};

/**
 * Check if a creative preset exists in GCS
 * @param type - Content type
 * @param key - Preset key
 * @returns Promise resolving to boolean
 */
export const presetExists = async (
    type: ContentType,
    key: string
): Promise<boolean> => {
    try {
        const presetUrl = getPresetUrl(type, key);
        const response = await fetch(presetUrl, {
            method: "HEAD",
            cache: "no-cache", // Don't cache HEAD requests
        });
        return response.ok;
    } catch (error) {
        logger.error("Error checking preset existence:", { type, key, error });
        return false;
    }
};

/**
 * Get metadata about a preset without loading the full data
 * @param type - Content type
 * @param key - Preset key
 * @returns Promise with basic preset info
 */
export const getPresetMetadata = async (
    type: ContentType,
    key: string
): Promise<{
    exists: boolean;
    type: ContentType;
    key: string;
    url: string;
} | null> => {
    const exists = await presetExists(type, key);

    if (!exists) {
        return null;
    }

    return {
        exists,
        type,
        key,
        url: getPresetUrl(type, key),
    };
};

/**
 * Merge a preset with default values, ensuring all required fields exist
 * @param preset - Loaded preset data
 * @param defaultValues - Default form values
 * @returns Merged FormValues
 */
export const mergePresetWithDefaults = (
    preset: Partial<FormValues>,
    defaultValues: FormValues
): FormValues => {
    return {
        ...defaultValues,
        ...preset,
        // Ensure nested objects are properly merged
        audienceDetails: {
            ...defaultValues.audienceDetails,
            ...preset.audienceDetails,
        },
        storyDetails: {
            ...defaultValues.storyDetails,
            ...preset.storyDetails,
        },
        brandDetails: {
            ...defaultValues.brandDetails,
            ...preset.brandDetails,
        },
        productDetails: {
            ...defaultValues.productDetails,
            ...preset.productDetails,
        },
        campaignDetails: {
            ...defaultValues.campaignDetails,
            ...preset.campaignDetails,
        },
        executionReference: {
            ...defaultValues.executionReference,
            ...preset.executionReference,
            referenceFiles: {
                ...defaultValues.executionReference.referenceFiles,
                ...preset.executionReference?.referenceFiles,
            },
        },
        formatAndCTA: {
            ...defaultValues.formatAndCTA,
            ...preset.formatAndCTA,
        },
        ui: {
            ...defaultValues.ui,
            ...preset.ui,
        },
    };
};

/**
 * Batch load multiple presets (useful for preloading)
 * @param presets - Array of {type, key} to load
 * @returns Promise with array of loaded presets
 */
export const loadMultiplePresets = async (
    presets: Array<{ type: ContentType; key: string }>
): Promise<Array<{ type: ContentType; key: string; data: FormValues | null }>> => {
    const promises = presets.map(async ({ type, key }) => {
        const data = await loadCreativePreset(type, key);
        return { type, key, data };
    });

    return Promise.all(promises);
};