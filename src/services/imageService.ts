// src/services/imageService.ts

import { auth } from "@/lib/firebase";
import logger from "@/utils/logger";
import type {
    CompleteImageDataApiResponse,
    CompleteImageData,
    ImageType,
    ManualAddImageRequest,
    ManualAddImageResponse,
    ListStandaloneImagesParams,
    ListStandaloneImagesResponse,
    UpdateStandaloneMetadataRequest,
    UpdateStandaloneMetadataResponse,
    MetadataUpdateError
} from "@/types/image/types";
import { isSuccessResponse } from "@/types/image/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Parameters for fetching complete image data
 */
export interface GetCompleteImageDataParams {
    scriptId: string;
    versionId?: string;
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
            type: params.type,
        });

        // CHANGED: Only add versionId if not standalone
        if (params.type !== "standalone") {
            if (!params.versionId) {
                throw new ImageServiceError(
                    "versionId is required for non-standalone image types",
                    "MISSING_VERSION_ID"
                );
            }
            queryParams.append("versionId", params.versionId);
        }

        // Add type-specific parameters (NOT for standalone)
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
        // standalone type needs no additional params

        // Make API request
        const url = `${API_BASE_URL}/images/v1/complete-data?${queryParams.toString()}`;

        logger.info("Fetching complete image data", {
            url,
            type: params.type,
            scriptId: params.scriptId,
            versionId: params.versionId || "N/A (standalone)",
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
        type: params.type,
    });

    // CHANGED: Only add versionId if not standalone
    if (params.type !== "standalone" && params.versionId) {
        queryParams.append("versionId", params.versionId);
    }

    // Add type-specific parameters (NOT for standalone)
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
    // standalone type needs no additional params

    return queryParams;
}

/**
 * Manually add an existing image from a URL to the system with version management.
 * No AI generation - just saves your provided image with metadata.
 * 
 * @param request - The manual add image request parameters
 * @param token - Authentication token
 * @returns Promise containing the response with image data or error
 * 
 * @example
 * ```typescript
 * const result = await manualAddImage({
 *   scriptId: "abc123",
 *   versionId: "v1",
 *   type: "shots",
 *   sceneId: 1,
 *   shotId: 2,
 *   prompt: "A cinematic wide shot",
 *   imageUrl: "https://example.com/image.png",
 *   aspectRatio: "16:9"
 * }, token);
 * 
 * if (result.success) {
 *   console.log('Image URL:', result.data.newCurrentImagePath);
 * }
 * ```
 */
export async function manualAddImage(
    request: ManualAddImageRequest,
    token: string
): Promise<ManualAddImageResponse> {
    try {
        const response = await fetch(
            `${process.env.NEXT_PUBLIC_API_BASE_URL}/images/v1/manual-add`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(request),
            }
        );

        const data: ManualAddImageResponse = await response.json();

        // Handle non-200 status codes
        if (!response.ok) {
            if ('error' in data) {
                return data;
            }
            return {
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
            };
        }

        return data;
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to add image',
        };
    }
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
                fineTuneId: data.versions.current.fineTuneId,
                modelTier: data.versions.current.modelTier,
            },
            archived: data.versions.archived, // This already has imageMetadata from backend
            totalVersions: data.imageStatus.totalVersions,
            totalEdits: data.imageStatus.totalEdits,
            editHistory: data.editHistory,
        },
    };
}

// Helper function to build query parameters (add to your file if not present)
const buildQueryParams = (params: Record<string, any>): string => {
    const queryParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            queryParams.append(key, String(value));
        }
    });

    return queryParams.toString();
};

/**
 * Fetches a paginated list of standalone image assets with optional filters
 * 
 * @param params - Query parameters for filtering and pagination
 * @param token - Authorization bearer token
 * @returns Promise with the list response including assets, pagination, and statistics
 * 
 * @example
 * ```typescript
 * const result = await listStandaloneImages({
 *   page: 1,
 *   limit: 20,
 *   imageCategory: 'character',
 *   hasImage: true,
 *   sortField: 'createdAt',
 *   sortOrder: 'desc'
 * }, userToken);
 * ```
 */
export async function listStandaloneImages(
    params: ListStandaloneImagesParams = {},
    token: string
): Promise<ListStandaloneImagesResponse> {
    try {
        const queryString = buildQueryParams(params);
        const url = `${API_BASE_URL}/images/v1/list-standalone-images${queryString ? `?${queryString}` : ''}`;

        logger.info('Fetching standalone images list', { params });

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            logger.error('Failed to fetch standalone images', {
                status: response.status,
                error: errorData.error,
            });
            throw new ImageServiceError(
                errorData.error || `HTTP ${response.status}: ${response.statusText}`,
                `HTTP_${response.status}`,
                errorData
            );
        }

        const data: ListStandaloneImagesResponse = await response.json();

        logger.info('Successfully fetched standalone images', {
            totalAssets: data.data.statistics.totalAssets,
            currentPage: data.data.pagination.currentPage,
            totalPages: data.data.pagination.totalPages,
        });

        return data;
    } catch (error) {
        if (error instanceof ImageServiceError) {
            throw error;
        }
        logger.error('Unexpected error fetching standalone images', { error, params });
        throw new ImageServiceError(
            error instanceof Error ? error.message : 'Failed to fetch standalone images',
            'UNKNOWN_ERROR',
            error
        );
    }
}

/**
 * Fetches standalone images with default parameters (first page, 20 items)
 * 
 * @param token - Authorization bearer token
 * @returns Promise with the list response
 */
export async function getStandaloneImagesFirstPage(
    token: string
): Promise<ListStandaloneImagesResponse> {
    return listStandaloneImages({ page: 1, limit: 20 }, token);
}

/**
 * Fetches standalone images filtered by category
 * 
 * @param category - Image category to filter by
 * @param token - Authorization bearer token
 * @param additionalParams - Additional query parameters
 * @returns Promise with the list response
 */
export async function getStandaloneImagesByCategory(
    category: ListStandaloneImagesParams['imageCategory'],
    token: string,
    additionalParams: Omit<ListStandaloneImagesParams, 'imageCategory'> = {}
): Promise<ListStandaloneImagesResponse> {
    return listStandaloneImages({ ...additionalParams, imageCategory: category }, token);
}

/**
 * Fetches standalone images filtered by project
 * 
 * @param projectName - Project name to filter by
 * @param token - Authorization bearer token
 * @param additionalParams - Additional query parameters
 * @returns Promise with the list response
 */
export async function getStandaloneImagesByProject(
    projectName: string,
    token: string,
    additionalParams: Omit<ListStandaloneImagesParams, 'projectName'> = {}
): Promise<ListStandaloneImagesResponse> {
    return listStandaloneImages({ ...additionalParams, projectName }, token);
}

/**
 * Fetches only standalone images that have uploaded files
 * 
 * @param token - Authorization bearer token
 * @param additionalParams - Additional query parameters
 * @returns Promise with the list response
 */
export async function getStandaloneImagesWithFiles(
    token: string,
    additionalParams: Omit<ListStandaloneImagesParams, 'hasImage'> = {}
): Promise<ListStandaloneImagesResponse> {
    return listStandaloneImages({ ...additionalParams, hasImage: true }, token);
}

/**
 * Updates metadata fields for a standalone image asset
 * 
 * @param data - Update request containing assetId and fields to update
 * @param token - Authorization bearer token
 * @returns Promise with the update response including updated fields
 * @throws {ImageServiceError} If validation fails or update is unsuccessful
 * 
 * @example
 * ```typescript
 * const result = await updateStandaloneImageMetadata({
 *   assetId: 'abc123xyz',
 *   title: 'Updated Hero Character',
 *   tags: ['hero', 'main', 'final'],
 *   projectName: 'Film2025'
 * }, userToken);
 * ```
 */
export async function updateStandaloneImageMetadata(
    data: UpdateStandaloneMetadataRequest,
    token: string
): Promise<UpdateStandaloneMetadataResponse> {
    try {
        const url = `${API_BASE_URL}/images/v1/standalone-image/metadata`;

        logger.info('Updating standalone image metadata', { assetId: data.assetId });

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData: MetadataUpdateError = await response.json().catch(() => ({
                success: false,
                error: `HTTP ${response.status}: ${response.statusText}`,
            }));
            logger.error('Failed to update standalone image metadata', {
                status: response.status,
                error: errorData.error,
                assetId: data.assetId,
            });
            throw new ImageServiceError(
                errorData.error,
                `HTTP_${response.status}`,
                errorData
            );
        }

        const result: UpdateStandaloneMetadataResponse = await response.json();

        logger.info('Successfully updated standalone image metadata', {
            assetId: result.data.assetId,
            updatedFields: result.data.updatedFields,
        });

        return result;
    } catch (error) {
        if (error instanceof ImageServiceError) {
            throw error;
        }
        logger.error('Unexpected error updating standalone image metadata', { error, data });
        throw new ImageServiceError(
            error instanceof Error ? error.message : 'Failed to update metadata',
            'UNKNOWN_ERROR',
            error
        );
    }
}

/**
 * Updates only the title of a standalone image
 * 
 * @param assetId - Asset identifier
 * @param title - New title (max 200 characters)
 * @param token - Authorization bearer token
 * @returns Promise with the update response
 */
export async function updateStandaloneImageTitle(
    assetId: string,
    title: string,
    token: string
): Promise<UpdateStandaloneMetadataResponse> {
    return updateStandaloneImageMetadata({ assetId, title }, token);
}

/**
 * Updates tags for a standalone image
 * 
 * @param assetId - Asset identifier
 * @param tags - Array of tags (max 20 tags, each max 50 characters)
 * @param token - Authorization bearer token
 * @returns Promise with the update response
 */
export async function updateStandaloneImageTags(
    assetId: string,
    tags: string[],
    token: string
): Promise<UpdateStandaloneMetadataResponse> {
    return updateStandaloneImageMetadata({ assetId, tags }, token);
}

/**
 * Clears optional fields from a standalone image
 * 
 * @param assetId - Asset identifier
 * @param fieldsToClear - Array of field names to clear
 * @param token - Authorization bearer token
 * @returns Promise with the update response
 * 
 * @example
 * ```typescript
 * await clearStandaloneImageFields('abc123', ['description', 'notes'], token);
 * ```
 */
export async function clearStandaloneImageFields(
    assetId: string,
    fieldsToClear: Array<'description' | 'notes' | 'projectName' | 'imageCategory'>,
    token: string
): Promise<UpdateStandaloneMetadataResponse> {
    const updates: UpdateStandaloneMetadataRequest = { assetId };

    fieldsToClear.forEach(field => {
        updates[field] = null;
    });

    return updateStandaloneImageMetadata(updates, token);
}

/**
 * Validates metadata update request before sending to API
 * Useful for client-side validation
 * 
 * @param data - Update request to validate
 * @returns Validation result with any error messages
 */
export function validateMetadataUpdate(
    data: UpdateStandaloneMetadataRequest
): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if at least one field besides assetId is provided
    const updateFields = Object.keys(data).filter(key => key !== 'assetId');
    if (updateFields.length === 0) {
        errors.push('At least one field besides assetId must be provided');
    }

    // Validate title length
    if (data.title !== undefined) {
        if (data.title.length === 0) {
            errors.push('Title cannot be empty');
        } else if (data.title.length > 200) {
            errors.push('Title must be 200 characters or less');
        }
    }

    // Validate description length
    if (data.description !== undefined && data.description !== null) {
        if (data.description.length > 2000) {
            errors.push('Description must be 2000 characters or less');
        }
    }

    // Validate tags
    if (data.tags !== undefined) {
        if (data.tags.length > 20) {
            errors.push('Maximum 20 tags allowed');
        }
        data.tags.forEach((tag, index) => {
            if (typeof tag !== 'string') {
                errors.push(`Tag at index ${index} must be a string`);
            } else if (tag.length > 50) {
                errors.push(`Tag "${tag}" exceeds 50 characters`);
            }
        });
    }

    // Validate projectName length
    if (data.projectName !== undefined && data.projectName !== null) {
        if (data.projectName.length > 100) {
            errors.push('Project name must be 100 characters or less');
        }
    }

    // Validate notes length
    if (data.notes !== undefined && data.notes !== null) {
        if (data.notes.length > 5000) {
            errors.push('Notes must be 5000 characters or less');
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}