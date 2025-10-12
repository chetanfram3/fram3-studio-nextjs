// src/hooks/useImageEditor.ts
import { useState, useCallback } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import { API_BASE_URL } from '@/config/constants';
import CustomToast from '@/components/common/CustomToast';

interface EditImageRequest {
    scriptId: string;
    versionId: string;
    prompt: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    sourceVersion?: number;
    // NEW: Multi-image support
    additionalImageUrls?: string[];
    // Shot-specific fields
    sceneId?: number;
    shotId?: number;
    // Actor-specific fields
    actorId?: number;
    actorVersionId?: number;
    // Location-specific fields
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

// NEW: Text-to-image generation request interface
interface GenerateImageRequest {
    scriptId: string;
    versionId: string;
    prompt: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    aspectRatio?: string;
    fineTuneId?: string;
    seed?: number;
    // Shot-specific fields
    sceneId?: number;
    shotId?: number;
    // Actor-specific fields
    actorId?: number;
    actorVersionId?: number;
    // Location-specific fields
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

// NEW: Text-to-image generation response interface
interface GenerateImageResponse {
    newCurrentImagePath: string;
    newThumbnailPath: string;
    newCurrentVersion: number;
    availableVersions: number[];
    type: string;
    prompt: string;
    aspectRatio: string;
    seed: number;
    fineTuneId?: string;
    generationType: string;
}

// NEW: Image prompts request interface
interface ImagePromptsParams {
    scriptId: string;
    versionId: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    imageVersion?: number; // Optional - if not provided, returns all prompts
    sceneId?: number;
    shotId?: number;
    actorId?: number;
    actorVersionId?: number;
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

// NEW: Single prompt response interface
interface PromptData {
    prompt: string;
    generationType: 'text_to_image' | 'flux_pro_kontext' | 'upscale_2x' | 'version_restore';
    seed: number;
    aspectRatio?: string;
    fineTuneId?: string;
    createdAt: string;
}

// NEW: Image prompts response interfaces
interface SinglePromptResponse {
    prompt: PromptData;
    imageVersion: number;
    type: string;
}

interface AllPromptsResponse {
    prompts: Record<string, PromptData>;
    totalPrompts: number;
    type: string;
    docId: string;
}

interface RestoreVersionRequest {
    scriptId: string;
    versionId: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    targetVersion: number;
    sceneId?: number;
    shotId?: number;
    actorId?: number;
    actorVersionId?: number;
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

interface ImageVersionsParams {
    scriptId: string;
    versionId: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    sceneId?: number;
    shotId?: number;
    actorId?: number;
    actorVersionId?: number;
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

interface EditImageResponse {
    newCurrentImagePath: string;
    newThumbnailPath: string;
    sourceVersion: number;
    newCurrentVersion: number;
    availableVersions: number[];
    type: string;
    prompt: string;
    aspectRatio: string;
    // Multi-image fields
    isMultiImage?: boolean;
    totalImagesProvided?: number;
    totalImagesUsed?: number;
    additionalImageUrls?: string[];
    fluxModel?: 'pro' | 'max' | 'max-multi';
    imagesIgnored?: number;
}

// NEW: Enhanced error type for multi-image context
interface MultiImageError extends Error {
    multiImageContext?: {
        isMultiImageAttempt: boolean;
        totalImagesAttempted: number;
        subscriptionModel: string;
    };
}

interface UpscaleImageRequest {
    scriptId: string;
    versionId: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    sourceVersion?: number;
    upscaleFactor?: number; // default: 2
    prompt?: string; // optional enhancement prompt
    creativity?: number; // 0-1, default: 0.35
    resemblance?: number; // 0-1, default: 0.6
    guidanceScale?: number; // 1-20, default: 4
    numInferenceSteps?: number; // 1-50, default: 18
    // Shot-specific fields
    sceneId?: number;
    shotId?: number;
    // Actor-specific fields
    actorId?: number;
    actorVersionId?: number;
    // Location-specific fields
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

interface UpscaleImageResponse {
    newCurrentImagePath: string;
    newThumbnailPath: string;
    sourceVersion: number;
    newCurrentVersion: number;
    availableVersions: number[];
    upscaleFactor: number;
    originalDimensions: {
        width: number | null;
        height: number | null;
    };
    newDimensions: {
        width: number;
        height: number;
    };
    fileSize: number;
    type: string;
    prompt: string | null;
    seed: number;
    processingTime: {
        inference?: number;
        total?: number;
    };
    upscaleSettings: {
        creativity: number;
        resemblance: number;
        guidanceScale: number;
        numInferenceSteps: number;
    };
}

export interface OptimizePromptRequest {
    scriptId: string;
    versionId: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    textPrompt: string;
    sourceVersion?: number;
    temperature?: number; // 0.0-1.0, default: 0
    topP?: number; // 0.0-1.0, default: 0
    // Shot-specific fields
    sceneId?: number;
    shotId?: number;
    // Actor-specific fields
    actorId?: number;
    actorVersionId?: number;
    // Location-specific fields
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

interface OptimizePromptResponse {
    optimization: {
        edit_success_assessment?: {
            agent_confidence_score: number;
            potential_issues_flagged: string[];
        };
        executed_prompt_details?: {
            prompt_construction_strategy: string;
            prompt_sent_to_api: string;
            prompt_token_count: number;
        };
        flux_parameters_applied?: {
            guidance_scale: number;
            safety_tolerance: number;
            seed: number;
            steps: number;
        };
        generated_image_uri?: string;
        input_summary?: {
            original_edit_instruction: string;
            original_input_image_uri: string;
        };
        iteration_context?: {
            next_input_image_uri: string;
            updated_editing_history: Array<{
                generated_image_uri: string;
                instruction: string;
                prompt_sent: string;
                step: number;
            }>;
        };
        processing_notes?: string[];
        request_id?: string;
        status: string;
    };
    sourceVersion: number;
    originalTextPrompt: string;
    type: string;
}

export interface OptimisedEditImageRequest {
    scriptId: string;
    versionId: string;
    prompt: string;
    type: 'shots' | 'actor' | 'location' | 'keyVisual';
    sourceVersion?: number;
    additionalImageUrls?: string[];
    temperature?: number;
    topP?: number;
    // Shot-specific fields
    sceneId?: number;
    shotId?: number;
    // Actor-specific fields
    actorId?: number;
    actorVersionId?: number;
    // Location-specific fields
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
}

interface OptimisedEditImageResponse {
    newCurrentImagePath: string;
    newThumbnailPath: string;
    sourceVersion: number;
    newCurrentVersion: number;
    availableVersions: number[];
    type: string;
    aspectRatio: string;
    isMultiImage: boolean;
    totalImagesProvided: number;
    totalImagesUsed: number;
    additionalImageUrls?: string[];
    fluxModel: string;
    imagesIgnored: number;
    originalPrompt: string;
    optimizedPrompt: string;
    promptOptimizationUsed: boolean;
    promptOptimizationData: {
        sourceVersion: number;
        type: string;
    };
}

async function optimisedEditImageService(request: OptimisedEditImageRequest): Promise<OptimisedEditImageResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    // Validate additionalImageUrls on frontend (same as editImageService)
    if (request.additionalImageUrls) {
        if (!Array.isArray(request.additionalImageUrls)) {
            throw new Error('Additional images must be provided as an array of URLs');
        }

        if (request.additionalImageUrls.length > 4) {
            throw new Error('Maximum 4 additional images allowed (5 total including main image)');
        }

        for (let i = 0; i < request.additionalImageUrls.length; i++) {
            const url = request.additionalImageUrls[i];
            if (!url || typeof url !== 'string') {
                throw new Error(`Additional image ${i + 1} must be a valid URL string`);
            }

            try {
                new URL(url);
            } catch (error) {
                throw new Error(`Additional image ${i + 1} is not a valid URL: ${url}`);
            }
        }
    }

    const response = await fetch(`${API_BASE_URL}/images/v1/optimised-edit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
        const error = new Error(result.error || `HTTP error! status: ${response.status}`) as MultiImageError;
        if (result.multiImageContext) {
            error.multiImageContext = result.multiImageContext;
        }
        throw error;
    }

    if (!result.success) {
        const error = new Error(result.error || 'Failed to execute optimised edit') as MultiImageError;
        if (result.multiImageContext) {
            error.multiImageContext = result.multiImageContext;
        }
        throw error;
    }

    return result.data;
}

// Service functions
async function editImageService(request: EditImageRequest): Promise<EditImageResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    // Validate additionalImageUrls on frontend
    if (request.additionalImageUrls) {
        if (!Array.isArray(request.additionalImageUrls)) {
            throw new Error('Additional images must be provided as an array of URLs');
        }

        if (request.additionalImageUrls.length > 4) {
            throw new Error('Maximum 4 additional images allowed (5 total including main image)');
        }

        // Validate each URL format
        for (let i = 0; i < request.additionalImageUrls.length; i++) {
            const url = request.additionalImageUrls[i];
            if (!url || typeof url !== 'string') {
                throw new Error(`Additional image ${i + 1} must be a valid URL string`);
            }

            try {
                new URL(url);
            } catch (error) {
                throw new Error(`Additional image ${i + 1} is not a valid URL: ${url}`);
            }
        }
    }

    const response = await fetch(`${API_BASE_URL}/images/v1/edit`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
        // Enhanced error handling for multi-image scenarios
        const error = new Error(result.error || `HTTP error! status: ${response.status}`) as MultiImageError;

        if (result.multiImageContext) {
            error.multiImageContext = result.multiImageContext;
        }

        throw error;
    }

    if (!result.success) {
        const error = new Error(result.error || 'Failed to edit image') as MultiImageError;

        if (result.multiImageContext) {
            error.multiImageContext = result.multiImageContext;
        }

        throw error;
    }

    return result.data;
}

// NEW: Text-to-image generation service
async function generateImageService(request: GenerateImageRequest): Promise<GenerateImageResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    // Validate prompt
    if (!request.prompt || typeof request.prompt !== 'string' || request.prompt.trim().length === 0) {
        throw new Error('Prompt is required and must be a non-empty string');
    }

    if (request.prompt.length > 5000) {
        throw new Error('Prompt must be 5000 characters or less');
    }

    // Validate optional parameters
    if (request.aspectRatio && !['16:9', '1:1', '4:3', '3:4', '9:16'].includes(request.aspectRatio)) {
        throw new Error('Invalid aspect ratio. Must be one of: 16:9, 1:1, 4:3, 3:4, 9:16');
    }

    if (request.seed && (request.seed < 0 || request.seed > 2147483647)) {
        throw new Error('Seed must be between 0 and 2147483647');
    }

    // Validate type-specific required fields
    if (request.type === 'shots') {
        if (!request.sceneId || !request.shotId) {
            throw new Error('sceneId and shotId are required for shots type');
        }
    } else if (request.type === 'actor') {
        if (!request.actorId || !request.actorVersionId) {
            throw new Error('actorId and actorVersionId are required for actor type');
        }
    } else if (request.type === 'location') {
        if (!request.locationId || !request.locationVersionId) {
            throw new Error('locationId and locationVersionId are required for location type');
        }
    }

    const response = await fetch(`${API_BASE_URL}/images/v1/generate`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to generate image');
    }

    return result.data;
}

// NEW: Image prompts service
async function fetchImagePromptsService(params: ImagePromptsParams): Promise<SinglePromptResponse | AllPromptsResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            searchParams.append(key, value.toString());
        }
    });

    const response = await fetch(`${API_BASE_URL}/images/v1/prompts?${searchParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch image prompts');
    }

    return result.data;
}

async function restoreVersionService(request: RestoreVersionRequest) {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    const response = await fetch(`${API_BASE_URL}/images/restore`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to restore version');
    }

    return result.data;
}

async function fetchImageVersionsService(params: ImageVersionsParams) {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
            searchParams.append(key, value.toString());
        }
    });

    const response = await fetch(`${API_BASE_URL}/images/versions?${searchParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch image versions');
    }

    return result.data;
}

async function upscaleImageService(request: UpscaleImageRequest): Promise<UpscaleImageResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    // Validate upscale parameters on frontend
    if (request.upscaleFactor && (request.upscaleFactor < 1 || request.upscaleFactor > 8)) {
        throw new Error('Upscale factor must be between 1 and 8');
    }

    if (request.creativity !== undefined && (request.creativity < 0 || request.creativity > 1)) {
        throw new Error('Creativity must be between 0 and 1');
    }

    if (request.resemblance !== undefined && (request.resemblance < 0 || request.resemblance > 1)) {
        throw new Error('Resemblance must be between 0 and 1');
    }

    if (request.guidanceScale !== undefined && (request.guidanceScale < 1 || request.guidanceScale > 20)) {
        throw new Error('Guidance scale must be between 1 and 20');
    }

    if (request.numInferenceSteps !== undefined && (request.numInferenceSteps < 1 || request.numInferenceSteps > 50)) {
        throw new Error('Number of inference steps must be between 1 and 50');
    }

    const response = await fetch(`${API_BASE_URL}/images/v1/upscale`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to upscale image');
    }

    return result.data;
}

async function optimizePromptService(request: OptimizePromptRequest): Promise<OptimizePromptResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    // Validate textPrompt on frontend
    if (!request.textPrompt || typeof request.textPrompt !== 'string' || request.textPrompt.trim().length === 0) {
        throw new Error('Text prompt is required and must be a non-empty string');
    }

    if (request.textPrompt.length > 2000) {
        throw new Error('Text prompt must be 2000 characters or less');
    }

    // Validate optional parameters
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 1)) {
        throw new Error('Temperature must be between 0 and 1');
    }

    if (request.topP !== undefined && (request.topP < 0 || request.topP > 1)) {
        throw new Error('Top-p must be between 0 and 1');
    }

    // Validate type-specific required fields
    if (request.type === 'shots') {
        if (!request.sceneId || !request.shotId) {
            throw new Error('sceneId and shotId are required for shots type');
        }
    } else if (request.type === 'actor') {
        if (!request.actorId || !request.actorVersionId) {
            throw new Error('actorId and actorVersionId are required for actor type');
        }
    } else if (request.type === 'location') {
        if (!request.locationId || !request.locationVersionId) {
            throw new Error('locationId and locationVersionId are required for location type');
        }
    }

    const response = await fetch(`${API_BASE_URL}/images/v1/prompt-optimizer`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to optimize prompt');
    }

    return result.data;
}

function getOptimisedEditSuccessMessage(data: OptimisedEditImageResponse): string {
    let message = "Image edited successfully with optimized prompt!";

    if (data.isMultiImage) {
        const usedCount = data.totalImagesUsed || 1;
        const ignoredCount = data.imagesIgnored || 0;

        message = `Image edited successfully using ${usedCount} image${usedCount > 1 ? 's' : ''} with optimized prompt!`;

        if (ignoredCount > 0) {
            message += ` (${ignoredCount} image${ignoredCount > 1 ? 's' : ''} ignored due to subscription limits)`;
        }
    }

    return message;
}

// NEW: Success message function for image generation
function getGenerateSuccessMessage(data: GenerateImageResponse): string {
    const seedInfo = data.seed ? ` (seed: ${data.seed})` : '';
    const fineTuneInfo = data.fineTuneId ? ` with ${data.fineTuneId}` : '';

    return `Image generated successfully${fineTuneInfo}!${seedInfo}`;
}

function getOptimizationSuccessMessage(data: OptimizePromptResponse): string {
    const strategy = data.optimization.executed_prompt_details?.prompt_construction_strategy;
    const confidence = data.optimization.edit_success_assessment?.agent_confidence_score;

    if (strategy && confidence !== undefined) {
        const confidencePercentage = Math.round(confidence * 100);
        return `Prompt optimized successfully! Strategy: ${strategy} (Confidence: ${confidencePercentage}%)`;
    }

    if (strategy) {
        return `Prompt optimized using "${strategy}" strategy!`;
    }

    return "Prompt optimized successfully!";
}

// NEW: Utility function to format multi-image success messages
function getSuccessMessage(data: EditImageResponse): string {
    if (data.isMultiImage) {
        const usedCount = data.totalImagesUsed || 1;
        const providedCount = data.totalImagesProvided || 1;
        const ignoredCount = data.imagesIgnored || 0;

        let message = `Image edited successfully using ${usedCount} image${usedCount > 1 ? 's' : ''}!`;

        if (ignoredCount > 0) {
            message += ` (${ignoredCount} image${ignoredCount > 1 ? 's' : ''} ignored due to subscription limits)`;
        }

        return message;
    }

    return "Image edited successfully!";
}

// NEW: Utility function to format multi-image error messages
function getErrorMessage(error: MultiImageError): string {
    const baseMessage = error.message;

    // Add subscription context for multi-image errors
    if (error.multiImageContext?.isMultiImageAttempt) {
        const { totalImagesAttempted, subscriptionModel } = error.multiImageContext;

        if (baseMessage.includes('subscription required') || baseMessage.includes('Pro subscription')) {
            return `${baseMessage} Multi-image editing (${totalImagesAttempted} images) requires Premium or Ultra subscription.`;
        }

        if (subscriptionModel === 'pro' && totalImagesAttempted > 1) {
            return `${baseMessage} Your Pro subscription supports single image editing only. Consider upgrading for multi-image capabilities.`;
        }
    }

    return baseMessage;
}

function getUpscaleSuccessMessage(data: UpscaleImageResponse): string {
    const { upscaleFactor, originalDimensions, newDimensions } = data;

    if (originalDimensions.width && originalDimensions.height) {
        return `Image upscaled ${upscaleFactor}x successfully! (${originalDimensions.width}×${originalDimensions.height} → ${newDimensions.width}×${newDimensions.height})`;
    }

    return `Image upscaled ${upscaleFactor}x successfully!`;
}

// Main hook for image editing
export function useImageEditor(hookParams: { scriptId: string; versionId: string; type: "shots" | "keyVisual" | "actor" | "location"; } | { sceneId: number | undefined; shotId: number | undefined; scriptId: string; versionId: string; type: "shots" | "keyVisual" | "actor" | "location"; } | { actorId: number | undefined; actorVersionId: number | undefined; scriptId: string; versionId: string; type: "shots" | "keyVisual" | "actor" | "location"; } | { locationId: number | undefined; locationVersionId: number | undefined; promptType: string; scriptId: string; versionId: string; type: "shots" | "keyVisual" | "actor" | "location"; }) {
    const queryClient = useQueryClient();
    const optimisedEditImageMutation = useMutation({
        mutationFn: optimisedEditImageService,
        onSuccess: (data, variables) => {
            const successMessage = getOptimisedEditSuccessMessage(data);
            CustomToast("success", successMessage);

            console.log('Optimised edit completed:', {
                originalPrompt: data.originalPrompt,
                optimizedPrompt: data.optimizedPrompt,
                totalImagesProvided: data.totalImagesProvided,
                totalImagesUsed: data.totalImagesUsed,
                fluxModel: data.fluxModel,
                imagesIgnored: data.imagesIgnored,
                promptOptimizationData: data.promptOptimizationData,
            });

            // Invalidate queries (same as editImage)
            queryClient.invalidateQueries({
                queryKey: ['imageVersions', variables.scriptId, variables.versionId, variables.type]
            });

            queryClient.invalidateQueries({
                queryKey: ['imagePrompts', variables.scriptId, variables.versionId, variables.type]
            });

            queryClient.invalidateQueries({
                queryKey: ['imageHistory', variables.scriptId, variables.versionId, variables.type]
            });
        },
        onError: (error: MultiImageError) => {
            const errorMessage = getErrorMessage(error);
            CustomToast("error", errorMessage || "Failed to execute optimised edit");
            console.error("Error in optimised edit:", error);

            if (error.multiImageContext) {
                console.error("Multi-image context:", error.multiImageContext);
            }
        }
    });
    const editImageMutation = useMutation({
        mutationFn: editImageService,
        onSuccess: (data, variables) => {
            const successMessage = getSuccessMessage(data);
            CustomToast("success", successMessage);

            // Enhanced logging for multi-image edits
            if (data.isMultiImage) {
                console.log('Multi-image edit completed:', {
                    totalImagesProvided: data.totalImagesProvided,
                    totalImagesUsed: data.totalImagesUsed,
                    fluxModel: data.fluxModel,
                    imagesIgnored: data.imagesIgnored,
                });
            }

            // Invalidate and refetch image versions
            queryClient.invalidateQueries({
                queryKey: ['imageVersions', variables.scriptId, variables.versionId, variables.type]
            });

            // NEW: Invalidate image prompts queries
            queryClient.invalidateQueries({
                queryKey: ['imagePrompts', variables.scriptId, variables.versionId, variables.type]
            });

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['imageHistory', variables.scriptId, variables.versionId, variables.type]
            });
        },
        onError: (error: MultiImageError) => {
            const errorMessage = getErrorMessage(error);

            // Handle specific error types
            if (errorMessage.includes('Pro subscription required') || errorMessage.includes('Premium or Ultra subscription')) {
                CustomToast("error", errorMessage);
            } else if (errorMessage.includes('No token provided')) {
                CustomToast("error", "Authentication required");
            } else if (errorMessage.includes('Maximum 4 additional images')) {
                CustomToast("error", "Too many images. Maximum 4 additional images allowed.");
            } else if (errorMessage.includes('not a valid URL')) {
                CustomToast("error", "One or more image URLs are invalid. Please check your URLs.");
            } else {
                CustomToast("error", errorMessage || "Failed to edit image");
            }

            console.error("Error editing image:", error);

            // Log multi-image context for debugging
            if (error.multiImageContext) {
                console.error("Multi-image context:", error.multiImageContext);
            }
        }
    });

    // NEW: Image generation mutation
    const generateImageMutation = useMutation({
        mutationFn: generateImageService,
        onSuccess: (data, variables) => {
            const successMessage = getGenerateSuccessMessage(data);
            CustomToast("success", successMessage);

            console.log('Image generation completed:', {
                type: data.type,
                aspectRatio: data.aspectRatio,
                seed: data.seed,
                fineTuneId: data.fineTuneId,
                generationType: data.generationType,
                newVersion: data.newCurrentVersion,
            });

            // Invalidate and refetch image versions
            queryClient.invalidateQueries({
                queryKey: ['imageVersions', variables.scriptId, variables.versionId, variables.type]
            });

            // NEW: Invalidate image prompts queries
            queryClient.invalidateQueries({
                queryKey: ['imagePrompts', variables.scriptId, variables.versionId, variables.type]
            });

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['imageHistory', variables.scriptId, variables.versionId, variables.type]
            });
        },
        onError: (error: Error) => {
            const errorMessage = error.message;

            // Handle specific error types
            if (errorMessage.includes('Pro subscription required')) {
                CustomToast("error", "Pro subscription required for image generation");
            } else if (errorMessage.includes('No token provided')) {
                CustomToast("error", "Authentication required");
            } else if (errorMessage.includes('Prompt is required')) {
                CustomToast("error", "Please enter a prompt to generate an image");
            } else if (errorMessage.includes('1000 characters or less')) {
                CustomToast("error", "Prompt is too long. Maximum 1000 characters allowed.");
            } else if (errorMessage.includes('Invalid aspect ratio')) {
                CustomToast("error", "Invalid aspect ratio. Please select a valid option.");
            } else if (errorMessage.includes('Seed must be between')) {
                CustomToast("error", "Invalid seed value. Must be between 0 and 2147483647.");
            } else if (errorMessage.includes('sceneId and shotId are required')) {
                CustomToast("error", "Scene ID and Shot ID are required for shot generation");
            } else if (errorMessage.includes('actorId and actorVersionId are required')) {
                CustomToast("error", "Actor ID and Actor Version ID are required for actor generation");
            } else if (errorMessage.includes('locationId and locationVersionId are required')) {
                CustomToast("error", "Location ID and Location Version ID are required for location generation");
            } else {
                CustomToast("error", errorMessage || "Failed to generate image");
            }

            console.error("Error generating image:", error);
        }
    });

    const restoreVersionMutation = useMutation({
        mutationFn: restoreVersionService,
        onSuccess: (data, variables) => {
            CustomToast("success", `Version ${variables.targetVersion} restored successfully!`);

            // Invalidate and refetch image versions
            queryClient.invalidateQueries({
                queryKey: ['imageVersions', variables.scriptId, variables.versionId, variables.type]
            });

            // NEW: Invalidate image prompts queries
            queryClient.invalidateQueries({
                queryKey: ['imagePrompts', variables.scriptId, variables.versionId, variables.type]
            });

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['imageHistory', variables.scriptId, variables.versionId, variables.type]
            });
        },
        onError: (error: Error) => {
            const errorMessage = error.message;

            // Handle specific error types
            if (errorMessage.includes('Pro subscription required')) {
                CustomToast("error", "Pro subscription required for version restore");
            } else {
                CustomToast("error", errorMessage || "Failed to restore version");
            }

            console.error("Error restoring version:", error);
        }
    });

    const upscaleImageMutation = useMutation({
        mutationFn: upscaleImageService,
        onSuccess: (data, variables) => {
            const successMessage = getUpscaleSuccessMessage(data);
            CustomToast("success", successMessage);

            console.log('Image upscale completed:', {
                upscaleFactor: data.upscaleFactor,
                originalDimensions: data.originalDimensions,
                newDimensions: data.newDimensions,
                fileSize: data.fileSize,
                processingTime: data.processingTime,
            });

            // Invalidate and refetch image versions
            queryClient.invalidateQueries({
                queryKey: ['imageVersions', variables.scriptId, variables.versionId, variables.type]
            });

            // NEW: Invalidate image prompts queries
            queryClient.invalidateQueries({
                queryKey: ['imagePrompts', variables.scriptId, variables.versionId, variables.type]
            });

            // Invalidate related queries
            queryClient.invalidateQueries({
                queryKey: ['imageHistory', variables.scriptId, variables.versionId, variables.type]
            });
        },
        onError: (error: Error) => {
            const errorMessage = error.message;

            // Handle specific error types
            if (errorMessage.includes('Pro subscription or higher required')) {
                CustomToast("error", "Pro subscription or higher required for image upscaling");
            } else if (errorMessage.includes('No token provided')) {
                CustomToast("error", "Authentication required");
            } else if (errorMessage.includes('Upscale factor must be')) {
                CustomToast("error", "Invalid upscale factor. Must be between 1 and 8.");
            } else if (errorMessage.includes('Creativity must be') ||
                errorMessage.includes('Resemblance must be') ||
                errorMessage.includes('Guidance scale must be') ||
                errorMessage.includes('inference steps must be')) {
                CustomToast("error", "Invalid upscale settings. Please check your parameters.");
            } else {
                CustomToast("error", errorMessage || "Failed to upscale image");
            }

            console.error("Error upscaling image:", error);
        }
    });

    const optimizePromptMutation = useMutation({
        mutationFn: optimizePromptService,
        onSuccess: (data, variables) => {
            const successMessage = getOptimizationSuccessMessage(data);
            CustomToast("success", successMessage);

            // Enhanced logging with all optimization details
            console.log('Prompt optimization completed:', {
                originalPrompt: data.originalTextPrompt,
                optimizedPrompt: data.optimization.executed_prompt_details?.prompt_sent_to_api,
                strategy: data.optimization.executed_prompt_details?.prompt_construction_strategy,
                confidence: data.optimization.edit_success_assessment?.agent_confidence_score,
                tokenCount: data.optimization.executed_prompt_details?.prompt_token_count,
                potentialIssues: data.optimization.edit_success_assessment?.potential_issues_flagged,
                fluxParameters: data.optimization.flux_parameters_applied,
                processingNotes: data.optimization.processing_notes,
                requestId: data.optimization.request_id,
                sourceVersion: data.sourceVersion,
                type: data.type,
            });
        },
        onError: (error: Error) => {
            const errorMessage = error.message;

            // Handle specific error types based on API spec
            if (errorMessage.includes('Pro subscription or higher required')) {
                CustomToast("error", "Pro subscription or higher required for prompt optimization");
            } else if (errorMessage.includes('No token provided')) {
                CustomToast("error", "Authentication required");
            } else if (errorMessage.includes('Text prompt is required')) {
                CustomToast("error", "Please enter a text prompt to optimize");
            } else if (errorMessage.includes('2000 characters or less')) {
                CustomToast("error", "Text prompt is too long. Maximum 2000 characters allowed.");
            } else if (errorMessage.includes('Temperature must be') || errorMessage.includes('Top-p must be')) {
                CustomToast("error", "Invalid optimization parameters. Please check your settings.");
            } else if (errorMessage.includes('sceneId and shotId are required')) {
                CustomToast("error", "Scene ID and Shot ID are required for shot optimization");
            } else if (errorMessage.includes('actorId and actorVersionId are required')) {
                CustomToast("error", "Actor ID and Actor Version ID are required for actor optimization");
            } else if (errorMessage.includes('locationId and locationVersionId are required')) {
                CustomToast("error", "Location ID and Location Version ID are required for location optimization");
            } else {
                CustomToast("error", errorMessage || "Failed to optimize prompt");
            }

            console.error("Error optimizing prompt:", error);
        }
    });

    return {
        // Edit image
        editImage: editImageMutation.mutate,
        editImageAsync: editImageMutation.mutateAsync,
        isEditing: editImageMutation.isPending,
        editError: editImageMutation.error,

        // NEW: Optimised edit
        optimisedEditImage: optimisedEditImageMutation.mutate,
        optimisedEditImageAsync: optimisedEditImageMutation.mutateAsync,
        isOptimisedEditing: optimisedEditImageMutation.isPending,
        optimisedEditError: optimisedEditImageMutation.error,

        // NEW: Generate image
        generateImage: generateImageMutation.mutate,
        generateImageAsync: generateImageMutation.mutateAsync,
        isGenerating: generateImageMutation.isPending,
        generateError: generateImageMutation.error,

        // Prompt optimization
        optimizePrompt: optimizePromptMutation.mutate,
        optimizePromptAsync: optimizePromptMutation.mutateAsync,
        isOptimizing: optimizePromptMutation.isPending,
        optimizeError: optimizePromptMutation.error,

        // Upscale image
        upscaleImage: upscaleImageMutation.mutate,
        upscaleImageAsync: upscaleImageMutation.mutateAsync,
        isUpscaling: upscaleImageMutation.isPending,
        upscaleError: upscaleImageMutation.error,

        // Restore version
        restoreVersion: restoreVersionMutation.mutate,
        restoreVersionAsync: restoreVersionMutation.mutateAsync,
        isRestoring: restoreVersionMutation.isPending,
        restoreError: restoreVersionMutation.error,

        // Combined states
        isLoading: editImageMutation.isPending || generateImageMutation.isPending || restoreVersionMutation.isPending || upscaleImageMutation.isPending || optimizePromptMutation.isPending ||
            optimisedEditImageMutation.isPending,
        error: editImageMutation.error || generateImageMutation.error || restoreVersionMutation.error || upscaleImageMutation.error || optimizePromptMutation.error ||
            optimisedEditImageMutation.error,

        // Reset functions
        resetEditMutation: editImageMutation.reset,
        resetGenerateMutation: generateImageMutation.reset,
        resetRestoreMutation: restoreVersionMutation.reset,
        resetUpscaleMutation: upscaleImageMutation.reset,
        resetOptimizeMutation: optimizePromptMutation.reset,
        resetOptimisedEditMutation: optimisedEditImageMutation.reset,
    };
}

// Hook for fetching image versions
export function useImageVersions(params: ImageVersionsParams, enabled: boolean = true) {
    return useQuery({
        queryKey: ['imageVersions', params.scriptId, params.versionId, params.type, params.sceneId, params.shotId, params.actorId, params.locationId],
        queryFn: () => fetchImageVersionsService(params),
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.type,
        staleTime: 1000 * 60 * 5, // 5 minutes
        refetchOnWindowFocus: false,
    });
}

// NEW: Hook for fetching image prompts
export function useImagePrompts(params: ImagePromptsParams, enabled: boolean = true) {
    return useQuery({
        queryKey: ['imagePrompts', params.scriptId, params.versionId, params.type, params.imageVersion, params.sceneId, params.shotId, params.actorId, params.locationId],
        queryFn: () => fetchImagePromptsService(params),
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.type,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

// Hook for managing version selection state
export function useImageVersionSelection() {
    const [currentVersion, setCurrentVersion] = useState<number | null>(null);
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null);

    const selectVersion = useCallback((version: number) => {
        setSelectedVersion(version);
    }, []);

    const resetToCurrentVersion = useCallback(() => {
        setSelectedVersion(currentVersion);
    }, [currentVersion]);

    const updateCurrentVersion = useCallback((version: number) => {
        setCurrentVersion(version);
        setSelectedVersion(version);
    }, []);

    return {
        currentVersion,
        selectedVersion,
        selectVersion,
        resetToCurrentVersion,
        updateCurrentVersion,
    };
}

// NEW: Hook for managing additional images state
export function useAdditionalImages() {
    const [additionalImages, setAdditionalImages] = useState<string[]>([]);

    const addImage = useCallback((url: string) => {
        setAdditionalImages(prev => {
            // Prevent duplicates and enforce limit
            if (prev.includes(url)) return prev;
            if (prev.length >= 4) return prev; // Max 4 additional images
            return [...prev, url];
        });
    }, []);

    const removeImage = useCallback((index: number) => {
        setAdditionalImages(prev => prev.filter((_, i) => i !== index));
    }, []);

    const clearImages = useCallback(() => {
        setAdditionalImages([]);
    }, []);

    const reorderImages = useCallback((fromIndex: number, toIndex: number) => {
        setAdditionalImages(prev => {
            const newImages = [...prev];
            const [removed] = newImages.splice(fromIndex, 1);
            newImages.splice(toIndex, 0, removed);
            return newImages;
        });
    }, []);

    return {
        additionalImages,
        addImage,
        removeImage,
        clearImages,
        reorderImages,
        canAddMore: additionalImages.length < 4,
        imageCount: additionalImages.length,
    };
}

// NEW: Hook for managing text-to-image generation settings
export function useImageGenerationSettings() {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [fineTuneId, setFineTuneId] = useState<string>('');
    const [seed, setSeed] = useState<number | undefined>(undefined);

    const resetToDefaults = useCallback(() => {
        setPrompt('');
        setAspectRatio('16:9');
        setFineTuneId('');
        setSeed(undefined);
    }, []);

    const generateRandomSeed = useCallback(() => {
        const randomSeed = Math.floor(Math.random() * 2147483647);
        setSeed(randomSeed);
        return randomSeed;
    }, []);

    return {
        // Settings values
        prompt,
        aspectRatio,
        fineTuneId,
        seed,

        // Setters
        setPrompt,
        setAspectRatio,
        setFineTuneId,
        setSeed,

        // Utility functions
        resetToDefaults,
        generateRandomSeed,

        // Validation helpers
        isValidPrompt: prompt.trim().length > 0 && prompt.length <= 5000,
        isValidSeed: seed === undefined || (seed >= 0 && seed <= 2147483647),
        isValidAspectRatio: ['16:9', '1:1', '4:3', '3:4', '9:16'].includes(aspectRatio),
    };
}

export function useUpscaleSettings() {
    const [upscaleFactor, setUpscaleFactor] = useState<number>(2);
    const [prompt, setPrompt] = useState<string>('');
    const [creativity, setCreativity] = useState<number>(0.35);
    const [resemblance, setResemblance] = useState<number>(0.6);
    const [guidanceScale, setGuidanceScale] = useState<number>(4);
    const [numInferenceSteps, setNumInferenceSteps] = useState<number>(18);

    const resetToDefaults = useCallback(() => {
        setUpscaleFactor(2);
        setPrompt('');
        setCreativity(0.35);
        setResemblance(0.6);
        setGuidanceScale(4);
        setNumInferenceSteps(18);
    }, []);

    const setHighQualityPreset = useCallback(() => {
        setUpscaleFactor(4);
        setPrompt('masterpiece, best quality, highres, ultra detailed, sharp focus');
        setCreativity(0.25);
        setResemblance(0.8);
        setGuidanceScale(6);
        setNumInferenceSteps(25);
    }, []);

    return {
        // Settings values
        upscaleFactor,
        prompt,
        creativity,
        resemblance,
        guidanceScale,
        numInferenceSteps,

        // Setters
        setUpscaleFactor,
        setPrompt,
        setCreativity,
        setResemblance,
        setGuidanceScale,
        setNumInferenceSteps,

        // Utility functions
        resetToDefaults,
        setHighQualityPreset,

        // Validation helpers
        isValidUpscaleFactor: upscaleFactor >= 1 && upscaleFactor <= 8,
        isValidCreativity: creativity >= 0 && creativity <= 1,
        isValidResemblance: resemblance >= 0 && resemblance <= 1,
        isValidGuidanceScale: guidanceScale >= 1 && guidanceScale <= 20,
        isValidInferenceSteps: numInferenceSteps >= 1 && numInferenceSteps <= 50,
    };
}

// Additional hook for image history if needed
export function useImageHistory(params: ImageVersionsParams, enabled: boolean = false) {
    return useQuery({
        queryKey: ['imageHistory', params.scriptId, params.versionId, params.type, params.sceneId, params.shotId, params.actorId, params.locationId],
        queryFn: async () => {
            const token = await auth.currentUser?.getIdToken();

            if (!token) {
                throw new Error('No authentication token available');
            }

            const searchParams = new URLSearchParams();
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) {
                    searchParams.append(key, value.toString());
                }
            });

            const response = await fetch(`${API_BASE_URL}/images/history?${searchParams.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `HTTP error! status: ${response.status}`);
            }

            if (!result.success) {
                throw new Error(result.error || 'Failed to fetch image history');
            }

            return result.data;
        },
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.type,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

export function getOptimizedPrompt(optimizeResponse: OptimizePromptResponse): string | null {
    return optimizeResponse.optimization.executed_prompt_details?.prompt_sent_to_api || null;
}

// Utility function to get optimization insights
export function getOptimizationInsights(optimizeResponse: OptimizePromptResponse) {
    return {
        strategy: optimizeResponse.optimization.executed_prompt_details?.prompt_construction_strategy,
        confidence: optimizeResponse.optimization.edit_success_assessment?.agent_confidence_score,
        tokenCount: optimizeResponse.optimization.executed_prompt_details?.prompt_token_count,
        potentialIssues: optimizeResponse.optimization.edit_success_assessment?.potential_issues_flagged || [],
        processingNotes: optimizeResponse.optimization.processing_notes || [],
        fluxParameters: optimizeResponse.optimization.flux_parameters_applied,
        requestId: optimizeResponse.optimization.request_id,
    };
}

// NEW: Utility functions for prompt management
export function getPromptForVersion(prompts: Record<string, PromptData>, version: number): PromptData | null {
    return prompts[version.toString()] || null;
}

export function getAllPromptVersions(prompts: Record<string, PromptData>): Array<{ version: number; data: PromptData }> {
    return Object.entries(prompts)
        .map(([version, data]) => ({ version: parseInt(version), data }))
        .sort((a, b) => b.version - a.version); // Sort by version descending
}

export function getLatestPrompt(prompts: Record<string, PromptData>): { version: number; data: PromptData } | null {
    const versions = getAllPromptVersions(prompts);
    return versions.length > 0 ? versions[0] : null;
}

// NEW: Type guard functions
export function isSinglePromptResponse(response: SinglePromptResponse | AllPromptsResponse): response is SinglePromptResponse {
    return 'imageVersion' in response;
}

export function isAllPromptsResponse(response: SinglePromptResponse | AllPromptsResponse): response is AllPromptsResponse {
    return 'totalPrompts' in response;
}