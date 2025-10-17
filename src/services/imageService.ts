// src/services/imageService.ts

import { auth } from "@/lib/firebase";
import logger from "@/utils/logger";
import type {
    CompleteImageDataApiResponse,
    CompleteImageData,
    ImageType,
} from "@/types/image/types";
import { isSuccessResponse } from "@/types/image/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Parameters for fetching complete image data
 */
export interface GetCompleteImageDataParams {
    scriptId: string;
    versionId: string;
    type: ImageType;
    // Type-specific parameters
    sceneId?: number;
    shotId?: number;
    actorId?: number;
    actorVersionId?: number;
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

/**
 * Image Service Error
 */
export class ImageServiceError extends Error {
    constructor(
        message: string,
        public code?: string,
        public details?: unknown
    ) {
        super(message);
        this.name = "ImageServiceError";
    }
}

/**
 * Fetch complete image data including versions, history, and analyses
 * 
 * @param params - Parameters including scriptId, versionId, type, and type-specific IDs
 * @returns Complete image data or throws an error
 * 
 * @example
 * // For shots
 * const data = await getCompleteImageData({
 *   scriptId: "123",
 *   versionId: "456",
 *   type: "shots",
 *   sceneId: 1,
 *   shotId: 2
 * });
 * 
 * @example
 * // For actors
 * const data = await getCompleteImageData({
 *   scriptId: "123",
 *   versionId: "456",
 *   type: "actor",
 *   actorId: 5,
 *   actorVersionId: 1
 * });
 * 
 * @example
 * // For locations
 * const data = await getCompleteImageData({
 *   scriptId: "123",
 *   versionId: "456",
 *   type: "location",
 *   locationId: 3,
 *   locationVersionId: 1,
 *   promptType: "wideShotLocationSetPrompt"
 * });
 * 
 * @example
 * // For key visual
 * const data = await getCompleteImageData({
 *   scriptId: "123",
 *   versionId: "456",
 *   type: "keyVisual"
 * });
 */
export async function getCompleteImageData(
    params: GetCompleteImageDataParams
): Promise<CompleteImageData> {
    try {
        // Get Firebase auth token
        const user = auth.currentUser;
        if (!user) {
            throw new ImageServiceError("User not authenticated", "AUTH_REQUIRED");
        }

        const idToken = await user.getIdToken();

        // Build query parameters
        const queryParams = new URLSearchParams({
            scriptId: params.scriptId,
            versionId: params.versionId,
            type: params.type,
        });

        // Add type-specific parameters
        if (params.type === "shots") {
            if (params.sceneId !== undefined) {
                queryParams.append("sceneId", params.sceneId.toString());
            }
            if (params.shotId !== undefined) {
                queryParams.append("shotId", params.shotId.toString());
            }
        } else if (params.type === "actor") {
            if (params.actorId !== undefined) {
                queryParams.append("actorId", params.actorId.toString());
            }
            if (params.actorVersionId !== undefined) {
                queryParams.append("actorVersionId", params.actorVersionId.toString());
            }
        } else if (params.type === "location") {
            if (params.locationId !== undefined) {
                queryParams.append("locationId", params.locationId.toString());
            }
            if (params.locationVersionId !== undefined) {
                queryParams.append(
                    "locationVersionId",
                    params.locationVersionId.toString()
                );
            }
            if (params.promptType) {
                queryParams.append("promptType", params.promptType);
            }
        }

        // Make API request
        const url = `${API_BASE_URL}/images/v1/complete-data?${queryParams.toString()}`;

        logger.info("Fetching complete image data", {
            url,
            type: params.type,
            scriptId: params.scriptId,
            versionId: params.versionId,
        });

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${idToken}`,
            },
        });

        // Parse response
        const data: CompleteImageDataApiResponse = await response.json();

        // Check if request was successful
        if (!response.ok) {
            const errorMessage =
                "error" in data ? data.error : "Failed to fetch image data";

            logger.error("Failed to fetch image data", {
                status: response.status,
                error: errorMessage,
                params,
            });

            throw new ImageServiceError(
                errorMessage,
                `HTTP_${response.status}`,
                data
            );
        }

        // Type guard check
        if (!isSuccessResponse(data)) {
            logger.error("API returned error response", {
                error: data.error,
                params,
            });

            throw new ImageServiceError(
                data.error || "Unknown error occurred",
                "API_ERROR",
                data
            );
        }

        logger.info("Successfully fetched complete image data", {
            type: data.data.type,
            currentVersion: data.data.versions.current.version,
            totalVersions: data.data.imageStatus.totalVersions,
            totalEdits: data.data.imageStatus.totalEdits,
        });

        return data.data;
    } catch (error) {
        // Re-throw ImageServiceError as-is
        if (error instanceof ImageServiceError) {
            throw error;
        }

        // Handle network errors
        if (error instanceof TypeError && error.message.includes("fetch")) {
            logger.error("Network error while fetching image data", { error, params });
            throw new ImageServiceError(
                "Network error. Please check your connection.",
                "NETWORK_ERROR",
                error
            );
        }

        // Handle other errors
        logger.error("Unexpected error fetching image data", { error, params });
        throw new ImageServiceError(
            error instanceof Error ? error.message : "An unexpected error occurred",
            "UNKNOWN_ERROR",
            error
        );
    }
}

/**
 * Build query params helper (for use in other functions)
 */
export function buildImageQueryParams(
    params: GetCompleteImageDataParams
): URLSearchParams {
    const queryParams = new URLSearchParams({
        scriptId: params.scriptId,
        versionId: params.versionId,
        type: params.type,
    });

    if (params.type === "shots") {
        if (params.sceneId !== undefined) {
            queryParams.append("sceneId", params.sceneId.toString());
        }
        if (params.shotId !== undefined) {
            queryParams.append("shotId", params.shotId.toString());
        }
    } else if (params.type === "actor") {
        if (params.actorId !== undefined) {
            queryParams.append("actorId", params.actorId.toString());
        }
        if (params.actorVersionId !== undefined) {
            queryParams.append("actorVersionId", params.actorVersionId.toString());
        }
    } else if (params.type === "location") {
        if (params.locationId !== undefined) {
            queryParams.append("locationId", params.locationId.toString());
        }
        if (params.locationVersionId !== undefined) {
            queryParams.append("locationVersionId", params.locationVersionId.toString());
        }
        if (params.promptType) {
            queryParams.append("promptType", params.promptType);
        }
    }

    return queryParams;
}

/**
 * Transform complete image data to legacy format for backward compatibility
 * Converts to the format expected by existing ImageViewerContainer
 */
export function transformToLegacyImageData(data: CompleteImageData) {
    return {
        signedUrl: data.versions.current.signedUrl,
        thumbnailPath: data.versions.current.thumbnailPath,
        versions: {
            current: {
                version: data.versions.current.version,
                thumbnailPath: data.versions.current.thumbnailPath,
                signedUrl: data.versions.current.signedUrl,
                destinationPath: data.versions.current.destinationPath,
                isCurrent: true,
                lastEditedAt: data.versions.current.lastEditedAt,
                prompt: data.versions.current.prompt || "",
                imageMetadata: data.versions.current.imageMetadata, // ADD THIS LINE
                generationType: data.versions.current.generationType, // ADD THIS LINE (nice to have)
                seed: data.versions.current.seed, // ADD THIS LINE (nice to have)
                aspectRatio: data.versions.current.aspectRatio, // ADD THIS LINE (nice to have)
            },
            archived: data.versions.archived, // This already has imageMetadata from backend
            totalVersions: data.imageStatus.totalVersions,
            totalEdits: data.imageStatus.totalEdits,
            editHistory: data.editHistory,
        },
    };
}