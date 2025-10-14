'use client';

// src/hooks/useVideoEditor.ts
import { useState, useCallback, useEffect, useRef } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { auth } from '@/lib/firebase';
import CustomToast from '@/components/common/CustomToast';
import logger from '@/utils/logger';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Video metadata interface
 */
interface VideoMetadata {
    duration?: number;
    width?: number;
    height?: number;
    format?: string;
    fileSize?: number;
    [key: string]: unknown;
}

/**
 * Enhanced version data with all fields
 */
interface EnhancedVersionData {
    modelTier: number | undefined;
    version: number;
    videoSignedUrl: string;
    lipsyncVideoSignedUrl?: string;
    prompt?: string;
    generationType?: string;
    seed?: number;
    aspectRatio?: string;
    imageVersion?: number;
    audioVersion?: number;
    isCurrent: boolean;
    lastEditedAt?: string;
    videoMetadata?: VideoMetadata;
}

/**
 * Archived version data
 */
interface ArchivedVersionData extends EnhancedVersionData {
    archivedAt?: string;
}

/**
 * Video edit history item
 */
interface VideoEditHistoryItem {
    timestamp: string;
    fromVersion: number;
    toVersion: number;
    generationType: 'text_to_video' | 'text_to_video_dummy' | 'text_to_video_pending' | 'version_restore' | 'batch_generation';
    previousVideoPath?: string;
    newVideoPath: string;
    prompt?: string;
    seed?: number;
    imageVersion?: number;
    audioVersion?: number;
    restoredFromVersion?: number;
}

/**
 * Video versions structure
 */
interface VideoVersionsStructure {
    current: EnhancedVersionData;
    archived: Record<string, EnhancedVersionData>;
    totalVersions: number;
    totalEdits: number;
    editHistory: VideoEditHistoryItem[];
}

/**
 * Converted video data structure
 */
interface ConvertedVideoData {
    videoSignedUrl: string;
    lipsyncVideoSignedUrl?: string;
    lipsyncVideoUrl?: string;
    thumbnailPath?: string;
    versions: VideoVersionsStructure;
}

/**
 * Video generation request interface
 */
interface GenerateVideoRequest {
    scriptId: string;
    versionId: string;
    prompt: string;
    sceneId: number;
    shotId: number;
    aspectRatio?: string;
    duration?: string;
    seed?: number;
    negativePrompt?: string;
    cfgScale?: number;
}

/**
 * Video generation response interface
 */
interface GenerateVideoResponse {
    // Processing/submitted response fields
    status: 'VideoRequestSubmitted' | 'processing' | 'completed' | 'failed';
    requestId?: string;
    modelType?: string;
    provider?: string;
    estimatedCompletionTime?: string;
    note?: string;

    // Basic request info
    sceneId: number;
    shotId: number;
    prompt: string;
    aspectRatio: string;
    generationType: string;
    imageVersion: number;
    audioVersion?: number;
    hasDialogue: boolean;
    isDummy?: boolean;

    // Optional fields (may not be present for submitted requests)
    seed?: number;
    newCurrentVideoPath?: string;
    newCurrentVersion?: number;
    availableVersions?: number[];

    // Legacy/optional fields
    message?: string;
}

/**
 * Enhanced video versions response interface
 */
export interface EnhancedVideoVersionsResponse {
    editHistory: HistoryItem[] | undefined;
    totalVersions: number;
    currentVersion: number;
    currentVideoVersion: number;

    // Main versions object with signed URLs
    versions: {
        current: EnhancedVersionData;
        archived: Record<string, ArchivedVersionData>;
    };

    // Alias for consistency with storyboard
    videoVersions: VideoVersionsStructure;

    // Metadata
    totalEdits: number;
    sceneId: number;
    shotId: number;
    docId: string;

    // Status information
    videoStatus?: string;
    hasLipsyncVideo: boolean;

    // Convenience fields for backward compatibility
    availableVersions: number[];
    currentVideoSignedUrl: string;
    currentLipsyncVideoSignedUrl?: string;
    currentPrompt?: string;
    currentGenerationType?: string;
    currentVideoMetadata?: VideoMetadata;
}

/**
 * Video versions parameters interface
 */
interface VideoVersionsParams {
    scriptId: string;
    versionId: string;
    sceneId: number;
    shotId: number;
}

/**
 * Video version data
 */
interface VideoVersionData {
    version: number;
    videoPath: string;
    lipsyncVideoPath?: string;
    prompt?: string;
    generationType?: string;
    imageVersion?: number;
    audioVersion?: number;
    isCurrent: boolean;
    lastEditedAt?: string;
    archivedAt?: string;
}

/**
 * Restore version request interface
 */
interface RestoreVideoVersionRequest {
    scriptId: string;
    versionId: string;
    sceneId: number;
    shotId: number;
    targetVersion: number;
}

/**
 * Restore version response interface
 */
interface RestoreVideoVersionResponse {
    restoredVersion: number;
    newCurrentVersion: number;
    restoredVideoPath: string;
    restoredPrompt?: string;
    sceneId: number;
    shotId: number;
    docId: string;
}

/**
 * Video status parameters interface
 */
interface VideoStatusParams {
    scriptId: string;
    versionId: string;
    sceneId: number;
    shotId: number;
}

/**
 * Video status response interface
 */
interface VideoStatusResponse {
    status: 'Pending' | 'VideoRequestSubmitted' | 'VideoGenerationFailed' | 'VideoReady' |
    'LipSyncRequestSubmitted' | 'LipSyncFailed' | 'Completed' | 'Failed';
    sceneId: number;
    shotId: number;
    currentVersion: number;
    videoPath?: string;
    lipsyncVideoPath?: string;
    prompt?: string;
    generationType?: string;
    imageVersion?: number;
    audioVersion?: number;
    lastEditedAt?: string;
    error?: string;
    // Request tracking information
    videoRequestId?: string;
    videoModelType?: string;
    videoProvider?: string;
    lipsyncRequestId?: string;
    lipsyncModelType?: string;
    lipsyncProvider?: string;
}

/**
 * Video history parameters interface
 */
interface VideoHistoryParams {
    scriptId: string;
    versionId: string;
    sceneId: number;
    shotId: number;
}

/**
 * Video history response interface
 */
interface VideoHistoryResponse {
    editHistory: VideoEditHistoryItem[];
    totalEdits: number;
    lastEditedAt?: string;
    currentVersion: number;
    sceneId: number;
    shotId: number;
    docId: string;
}

/**
 * Video prompts parameters interface
 */
interface VideoPromptsParams {
    scriptId: string;
    versionId: string;
    sceneId: number;
    shotId: number;
    videoVersion?: number; // Optional - if not provided, returns all prompts
}

/**
 * Video prompt data interface
 */
interface VideoPromptData {
    prompt: string;
    generationType: 'text_to_video' | 'text_to_video_dummy' | 'text_to_video_pending' | 'version_restore' | 'batch_generation' | 'unknown';
    seed?: number;
    aspectRatio?: string;
    imageVersion?: number;
    audioVersion?: number;
    createdAt: string;
    isCurrent?: boolean;
    fallback?: boolean;
}

/**
 * Single video prompt response
 */
interface SingleVideoPromptResponse {
    prompt: VideoPromptData;
    videoVersion: number;
    sceneId: number;
    shotId: number;
}

/**
 * All video prompts response
 */
interface AllVideoPromptsResponse {
    prompts: Record<string, VideoPromptData>;
    totalPrompts: number;
    sceneId: number;
    shotId: number;
    docId: string;
}

// ===========================
// SERVICE FUNCTIONS
// ===========================

/**
 * Generate video service
 */
async function generateVideoService(request: GenerateVideoRequest): Promise<GenerateVideoResponse> {
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

    if (request.duration && !['5', '8', '10'].includes(request.duration)) {
        throw new Error('Duration must be one of: 5, 8, 10');
    }

    if (request.seed && (request.seed < 0 || request.seed > 2147483647)) {
        throw new Error('Seed must be between 0 and 2147483647');
    }

    if (request.cfgScale && (request.cfgScale < 1 || request.cfgScale > 20)) {
        throw new Error('CFG Scale must be between 1 and 20');
    }

    logger.debug('Generating video', { sceneId: request.sceneId, shotId: request.shotId });

    const response = await fetch(`${API_BASE_URL}/video/v1/generate`, {
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
        throw new Error(result.error || 'Failed to generate video');
    }

    return result.data;
}

/**
 * Fetch video versions service
 */
async function fetchVideoVersionsService(params: VideoVersionsParams): Promise<EnhancedVideoVersionsResponse> {
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

    logger.debug('Fetching video versions', params);

    const response = await fetch(`${API_BASE_URL}/video/versions?${searchParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch video versions');
    }

    return result.data;
}

/**
 * Restore video version service
 */
async function restoreVideoVersionService(request: RestoreVideoVersionRequest): Promise<RestoreVideoVersionResponse> {
    const token = await auth.currentUser?.getIdToken();

    if (!token) {
        throw new Error('No authentication token available');
    }

    logger.info('Restoring video version', {
        sceneId: request.sceneId,
        shotId: request.shotId,
        targetVersion: request.targetVersion
    });

    const response = await fetch(`${API_BASE_URL}/video/restore`, {
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
        throw new Error(result.error || 'Failed to restore video version');
    }

    return result.data;
}

/**
 * Fetch video status service
 */
async function fetchVideoStatusService(params: VideoStatusParams): Promise<VideoStatusResponse> {
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

    logger.debug('Fetching video status', params);

    const response = await fetch(`${API_BASE_URL}/video/status?${searchParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch video status');
    }

    return result.data;
}

/**
 * Fetch video history service
 */
async function fetchVideoHistoryService(params: VideoHistoryParams): Promise<VideoHistoryResponse> {
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

    logger.debug('Fetching video history', params);

    const response = await fetch(`${API_BASE_URL}/video/history?${searchParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch video history');
    }

    return result.data;
}

/**
 * Fetch video prompts service
 */
async function fetchVideoPromptsService(params: VideoPromptsParams): Promise<SingleVideoPromptResponse | AllVideoPromptsResponse> {
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

    logger.debug('Fetching video prompts', params);

    const response = await fetch(`${API_BASE_URL}/video/v1/prompts?${searchParams.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const result = await response.json();

    if (!response.ok) {
        throw new Error(result.error || `HTTP error! status: ${response.status}`);
    }

    if (!result.success) {
        throw new Error(result.error || 'Failed to fetch video prompts');
    }

    return result.data;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get success message for video generation
 */
function getGenerateVideoSuccessMessage(data: GenerateVideoResponse): string {
    if (data.isDummy) {
        return "Demo video generated successfully! Upgrade to Pro for custom video generation.";
    }

    if (data.status === 'VideoRequestSubmitted' || data.status === 'processing') {
        const modelInfo = data.modelType ? ` using ${data.modelType}` : '';
        return `Video generation request submitted successfully${modelInfo}! Check status for completion.`;
    }

    const seedInfo = data.seed ? ` (seed: ${data.seed})` : '';
    const dialogueInfo = data.hasDialogue ? ' with dialogue' : '';

    return `Video generated successfully${dialogueInfo}!${seedInfo}`;
}

/**
 * Get success message for version restore
 */
function getRestoreVideoSuccessMessage(data: RestoreVideoVersionResponse): string {
    return `Video version ${data.restoredVersion} restored successfully as version ${data.newCurrentVersion}!`;
}

/**
 * Get error message for video generation
 */
function getGenerateVideoErrorMessage(error: Error): string {
    const message = error.message;

    if (message.includes('Pro subscription required')) {
        return "Pro subscription required for video generation";
    } else if (message.includes('No token provided')) {
        return "Authentication required";
    } else if (message.includes('Prompt is required')) {
        return "Please enter a prompt to generate a video";
    } else if (message.includes('5000 characters or less')) {
        return "Prompt is too long. Maximum 5000 characters allowed.";
    } else if (message.includes('Invalid aspect ratio')) {
        return "Invalid aspect ratio. Please select a valid option.";
    } else if (message.includes('Duration must be one of')) {
        return "Invalid duration. Must be 5, 8, or 10 seconds.";
    } else if (message.includes('Seed must be between')) {
        return "Invalid seed value. Must be between 0 and 2147483647.";
    } else if (message.includes('CFG Scale must be between')) {
        return "Invalid CFG Scale. Must be between 1 and 20.";
    }

    return message || "Failed to generate video";
}

// ===========================
// MAIN HOOKS
// ===========================

/**
 * Main hook for video editing operations
 */
export function useVideoEditor() {
    const queryClient = useQueryClient();

    const generateVideoMutation = useMutation({
        mutationFn: generateVideoService,
        onSuccess: (data, variables) => {
            const successMessage = getGenerateVideoSuccessMessage(data);

            // Only show immediate success for completed/dummy videos
            if (data.isDummy || data.status === 'completed') {
                CustomToast.success(successMessage);

                // Only invalidate for completed videos (immediate results)
                queryClient.invalidateQueries({
                    queryKey: ['videoVersions', variables.scriptId, variables.versionId, variables.sceneId, variables.shotId]
                });
            } else {
                // For processing videos, show submission confirmation
                CustomToast.info("Video generation request submitted successfully!");

                // DO NOT invalidate queries for processing videos
                // Let the polling mechanism handle the updates with proper timing
                logger.info('Video generation submitted - polling will handle updates');
            }

            logger.info('Video generation response', {
                sceneId: data.sceneId,
                shotId: data.shotId,
                status: data.status,
                generationType: data.generationType,
                newVersion: data.newCurrentVersion,
                hasDialogue: data.hasDialogue,
                isDummy: data.isDummy,
                modelType: data.modelType,
                provider: data.provider,
                requestId: data.requestId,
                willStartPolling: !data.isDummy && data.status !== 'completed',
            });
        },
        onError: (error: Error) => {
            const errorMessage = getGenerateVideoErrorMessage(error);
            CustomToast.error(errorMessage);
            logger.error("Error generating video:", error);
        }
    });

    const restoreVideoVersionMutation = useMutation({
        mutationFn: restoreVideoVersionService,
        onSuccess: (data, variables) => {
            const successMessage = getRestoreVideoSuccessMessage(data);
            CustomToast.success(successMessage);

            logger.info('Video version restored', {
                restoredVersion: data.restoredVersion,
                newCurrentVersion: data.newCurrentVersion,
                sceneId: data.sceneId,
                shotId: data.shotId,
            });

            // Invalidate all related queries for restore operations
            queryClient.invalidateQueries({
                queryKey: ['videoVersions', variables.scriptId, variables.versionId, variables.sceneId, variables.shotId]
            });

            queryClient.invalidateQueries({
                queryKey: ['videoPrompts', variables.scriptId, variables.versionId, variables.sceneId, variables.shotId]
            });

            queryClient.invalidateQueries({
                queryKey: ['videoStatus', variables.scriptId, variables.versionId, variables.sceneId, variables.shotId]
            });

            queryClient.invalidateQueries({
                queryKey: ['videoHistory', variables.scriptId, variables.versionId, variables.sceneId, variables.shotId]
            });
        },
        onError: (error: Error) => {
            const errorMessage = error.message;

            if (errorMessage.includes('Pro subscription required')) {
                CustomToast.error("Pro subscription required for video version restore");
            } else {
                CustomToast.error(errorMessage || "Failed to restore video version");
            }

            logger.error("Error restoring video version:", error);
        }
    });

    return {
        // Generate video
        generateVideo: generateVideoMutation.mutate,
        generateVideoAsync: generateVideoMutation.mutateAsync,
        isGenerating: generateVideoMutation.isPending,
        generateError: generateVideoMutation.error,

        // Restore version
        restoreVideoVersion: restoreVideoVersionMutation.mutate,
        restoreVideoVersionAsync: restoreVideoVersionMutation.mutateAsync,
        isRestoring: restoreVideoVersionMutation.isPending,
        restoreError: restoreVideoVersionMutation.error,

        // Combined states
        isLoading: generateVideoMutation.isPending || restoreVideoVersionMutation.isPending,
        error: generateVideoMutation.error || restoreVideoVersionMutation.error,

        // Reset functions
        resetGenerateMutation: generateVideoMutation.reset,
        resetRestoreMutation: restoreVideoVersionMutation.reset,

        // Enhanced functions
        invalidateVersionsCache: (params: VideoVersionsParams) => {
            queryClient.invalidateQueries({
                queryKey: ['videoVersions', params.scriptId, params.versionId, params.sceneId, params.shotId]
            });
        },
    };
}

/**
 * Check if video generation is in progress
 */
export function isVideoGenerationInProgress(status: string): boolean {
    return ['VideoRequestSubmitted', 'processing', 'text_to_video_pending'].includes(status);
}

/**
 * Convert versions response to video data format
 */
export function convertVersionsToVideoData(
    versionsData: EnhancedVideoVersionsResponse,
    thumbnailPath?: string
): ConvertedVideoData {
    if (!versionsData?.versions) {
        throw new Error('Invalid versions data');
    }

    const { current, archived } = versionsData.versions;

    return {
        videoSignedUrl: current.videoSignedUrl,
        lipsyncVideoSignedUrl: current.lipsyncVideoSignedUrl,
        lipsyncVideoUrl: current.lipsyncVideoSignedUrl, // For compatibility
        thumbnailPath,
        versions: {
            current: {
                version: current.version,
                videoSignedUrl: current.videoSignedUrl,
                lipsyncVideoSignedUrl: current.lipsyncVideoSignedUrl,
                prompt: current.prompt,
                generationType: current.generationType,
                seed: current.seed,
                aspectRatio: current.aspectRatio,
                imageVersion: current.imageVersion,
                audioVersion: current.audioVersion,
                isCurrent: true,
                lastEditedAt: current.lastEditedAt,
                videoMetadata: current.videoMetadata,
            },
            archived,
            totalVersions: versionsData.totalVersions,
            totalEdits: versionsData.totalEdits,
            editHistory: versionsData.videoVersions?.editHistory || [],
        },
    };
}

/**
 * Hook for fetching video versions with optional polling
 */
export function useVideoVersions(
    params: VideoVersionsParams,
    enabled: boolean = true,
    options: {
        enablePolling?: boolean;
        pollingInterval?: number;
        onVersionChange?: (newVersion: EnhancedVideoVersionsResponse) => void;
    } = {}
) {
    const { enablePolling = false, pollingInterval = 10000, onVersionChange } = options;
    const previousVersionRef = useRef<number | null>(null);

    const query = useQuery({
        queryKey: ['videoVersions', params.scriptId, params.versionId, params.sceneId, params.shotId],
        queryFn: () => fetchVideoVersionsService(params),
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.sceneId && !!params.shotId,
        staleTime: enablePolling ? 0 : 1000 * 60 * 5, // No stale time when polling, 5 minutes otherwise
        refetchOnWindowFocus: false,
        refetchInterval: enablePolling ? pollingInterval : false,
    });

    // Monitor version changes
    useEffect(() => {
        // Check if query.data exists before accessing its properties
        if (!query.data) return;

        const currentVersion = query.data.versions?.current?.version;

        if (previousVersionRef.current !== null &&
            currentVersion &&
            previousVersionRef.current !== currentVersion) {

            logger.info('Version change detected via polling', {
                previousVersion: previousVersionRef.current,
                newVersion: currentVersion,
                hasVideo: !!(query.data.versions.current.videoSignedUrl || query.data.versions.current.lipsyncVideoSignedUrl),
                generationType: query.data.versions.current.generationType,
            });

            // Trigger callback if provided
            if (onVersionChange) {
                onVersionChange(query.data);
            }
        }

        previousVersionRef.current = currentVersion || null;
    }, [query.data, onVersionChange]);

    return query;
}

/**
 * Hook for video generation with automatic polling
 */
export function useVideoGenerationWithPolling(
    params: VideoVersionsParams,
    enabled: boolean = true
) {
    const [isAwaitingGeneration, setIsAwaitingGeneration] = useState(false);
    const [generationStartTime, setGenerationStartTime] = useState<Date | null>(null);
    const [pollAttempts, setPollAttempts] = useState(0);
    const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const queryClient = useQueryClient();

    const maxPollAttempts = 12; // 2 minutes of polling
    const initialDelay = 15000; // 15 seconds initial delay
    const pollInterval = 10000; // 10 seconds between polls

    // Cleanup function
    const cleanupPolling = useCallback(() => {
        if (pollTimeoutRef.current) {
            clearTimeout(pollTimeoutRef.current);
            pollTimeoutRef.current = null;
        }
        setIsAwaitingGeneration(false);
        setGenerationStartTime(null);
        setPollAttempts(0);
    }, []);

    // Manual refetch function
    const refetchVersions = useCallback(async (): Promise<EnhancedVideoVersionsResponse | undefined> => {
        try {
            // Trigger refetch
            await queryClient.refetchQueries({
                queryKey: ['videoVersions', params.scriptId, params.versionId, params.sceneId, params.shotId],
            });

            // Get the data after refetch
            const data = queryClient.getQueryData<EnhancedVideoVersionsResponse>([
                'videoVersions',
                params.scriptId,
                params.versionId,
                params.sceneId,
                params.shotId
            ]);

            return data;
        } catch (error) {
            logger.error('Error refetching versions:', error);
            throw error;
        }
    }, [queryClient, params]);

    // Enhanced polling function
    const startPolling = useCallback(async (
        onSuccess?: (data: EnhancedVideoVersionsResponse) => void,
        onTimeout?: () => void
    ) => {
        if (!enabled) return;

        logger.debug(`Polling attempt ${pollAttempts + 1}/${maxPollAttempts} for video generation...`);

        try {
            const versionsData = await refetchVersions();

            if (versionsData?.versions?.current) {
                const currentVersion = versionsData.versions.current;
                const hasNewVideo = !!(currentVersion.videoSignedUrl || currentVersion.lipsyncVideoSignedUrl);
                const isComplete = currentVersion.generationType !== 'text_to_video_pending';

                logger.debug('Poll result', {
                    version: currentVersion.version,
                    hasVideo: hasNewVideo,
                    isComplete,
                    generationType: currentVersion.generationType,
                    elapsed: generationStartTime ?
                        Math.round((Date.now() - generationStartTime.getTime()) / 1000) : 0,
                });

                if (hasNewVideo && isComplete) {
                    logger.info('Video generation completed');

                    const completionTime = generationStartTime ?
                        Math.round((Date.now() - generationStartTime.getTime()) / 1000) : 0;

                    CustomToast.success(`Video generated successfully in ${completionTime}s! Version ${currentVersion.version}`);

                    if (onSuccess) {
                        onSuccess(versionsData);
                    }

                    cleanupPolling();
                    return;
                }
            }

            // Continue polling if not completed and under max attempts
            if (pollAttempts < maxPollAttempts - 1) {
                setPollAttempts(prev => prev + 1);

                pollTimeoutRef.current = setTimeout(() => {
                    startPolling(onSuccess, onTimeout);
                }, pollInterval);
            } else {
                logger.warn('Max polling attempts reached');
                CustomToast.warning("Video generation is taking longer than expected. Please check status manually.");

                if (onTimeout) {
                    onTimeout();
                }

                cleanupPolling();
            }

        } catch (error) {
            logger.error('Error during polling:', error);

            if (pollAttempts < maxPollAttempts - 1) {
                setPollAttempts(prev => prev + 1);

                pollTimeoutRef.current = setTimeout(() => {
                    startPolling(onSuccess, onTimeout);
                }, pollInterval);
            } else {
                cleanupPolling();

                if (onTimeout) {
                    onTimeout();
                }
            }
        }
    }, [pollAttempts, maxPollAttempts, refetchVersions, generationStartTime, cleanupPolling, enabled, pollInterval]);

    // Start generation monitoring
    const startGenerationMonitoring = useCallback((
        onSuccess?: (data: EnhancedVideoVersionsResponse) => void,
        onTimeout?: () => void
    ) => {
        setIsAwaitingGeneration(true);
        setGenerationStartTime(new Date());
        setPollAttempts(0);

        logger.info('Starting video generation monitoring');

        // Start polling after initial delay
        pollTimeoutRef.current = setTimeout(() => {
            startPolling(onSuccess, onTimeout);
        }, initialDelay);

    }, [startPolling, initialDelay]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanupPolling();
        };
    }, [cleanupPolling]);

    return {
        isAwaitingGeneration,
        generationStartTime,
        pollAttempts,
        maxPollAttempts,
        startGenerationMonitoring,
        cleanupPolling,
        refetchVersions,
        getElapsedTime: () => generationStartTime ?
            Math.round((Date.now() - generationStartTime.getTime()) / 1000) : 0,
    };
}

/**
 * Hook for fetching video status with auto-polling
 */
export function useVideoStatus(params: VideoStatusParams, enabled: boolean = true) {
    return useQuery({
        queryKey: ['videoStatus', params.scriptId, params.versionId, params.sceneId, params.shotId],
        queryFn: () => fetchVideoStatusService(params),
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.sceneId && !!params.shotId,
        staleTime: 1000 * 30, // 30 seconds (shorter for status polling)
        refetchOnWindowFocus: true,
        refetchInterval: (query) => {
            // Auto-refresh for pending/submitted statuses
            const data = query.state.data;
            if (data?.status === 'VideoRequestSubmitted' ||
                data?.status === 'LipSyncRequestSubmitted' ||
                data?.status === 'Pending') {
                return 10000; // Poll every 10 seconds
            }
            return false; // Don't auto-refresh for completed statuses
        },
    });
}

/**
 * Hook for fetching video history
 */
export function useVideoHistory(params: VideoHistoryParams, enabled: boolean = false) {
    return useQuery({
        queryKey: ['videoHistory', params.scriptId, params.versionId, params.sceneId, params.shotId],
        queryFn: () => fetchVideoHistoryService(params),
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.sceneId && !!params.shotId,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook for fetching video prompts
 */
export function useVideoPrompts(params: VideoPromptsParams, enabled: boolean = true) {
    return useQuery({
        queryKey: ['videoPrompts', params.scriptId, params.versionId, params.sceneId, params.shotId, params.videoVersion],
        queryFn: () => fetchVideoPromptsService(params),
        enabled: enabled && !!params.scriptId && !!params.versionId && !!params.sceneId && !!params.shotId,
        staleTime: 1000 * 60 * 10, // 10 minutes
        refetchOnWindowFocus: false,
    });
}

/**
 * Hook for managing video version selection state
 */
export function useVideoVersionSelection() {
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

/**
 * Hook for managing video generation settings
 */
export function useVideoGenerationSettings() {
    const [prompt, setPrompt] = useState<string>('');
    const [aspectRatio, setAspectRatio] = useState<string>('16:9');
    const [duration, setDuration] = useState<string>('5');
    const [seed, setSeed] = useState<number | undefined>(undefined);
    const [negativePrompt, setNegativePrompt] = useState<string>('');
    const [cfgScale, setCfgScale] = useState<number | undefined>(undefined);

    const resetToDefaults = useCallback(() => {
        setPrompt('');
        setAspectRatio('16:9');
        setDuration('5');
        setSeed(undefined);
        setNegativePrompt('');
        setCfgScale(undefined);
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
        duration,
        seed,
        negativePrompt,
        cfgScale,

        // Setters
        setPrompt,
        setAspectRatio,
        setDuration,
        setSeed,
        setNegativePrompt,
        setCfgScale,

        // Utility functions
        resetToDefaults,
        generateRandomSeed,

        // Validation helpers
        isValidPrompt: prompt.trim().length > 0 && prompt.length <= 5000,
        isValidSeed: seed === undefined || (seed >= 0 && seed <= 2147483647),
        isValidAspectRatio: ['16:9', '1:1', '4:3', '3:4', '9:16'].includes(aspectRatio),
        isValidDuration: ['5', '8', '10'].includes(duration),
        isValidCfgScale: cfgScale === undefined || (cfgScale >= 1 && cfgScale <= 20),
    };
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Get video prompt for specific version
 */
export function getVideoPromptForVersion(prompts: Record<string, VideoPromptData>, version: number): VideoPromptData | null {
    return prompts[version.toString()] || null;
}

/**
 * Get all video prompt versions sorted by version number
 */
export function getAllVideoPromptVersions(prompts: Record<string, VideoPromptData>): Array<{ version: number; data: VideoPromptData }> {
    return Object.entries(prompts)
        .map(([version, data]) => ({ version: parseInt(version), data }))
        .sort((a, b) => b.version - a.version); // Sort by version descending
}

/**
 * Get latest video prompt
 */
export function getLatestVideoPrompt(prompts: Record<string, VideoPromptData>): { version: number; data: VideoPromptData } | null {
    const versions = getAllVideoPromptVersions(prompts);
    return versions.length > 0 ? versions[0] : null;
}

/**
 * Type guard for single video prompt response
 */
export function isSingleVideoPromptResponse(response: SingleVideoPromptResponse | AllVideoPromptsResponse): response is SingleVideoPromptResponse {
    return 'videoVersion' in response;
}

/**
 * Type guard for all video prompts response
 */
export function isAllVideoPromptsResponse(response: SingleVideoPromptResponse | AllVideoPromptsResponse): response is AllVideoPromptsResponse {
    return 'totalPrompts' in response;
}

/**
 * Check if video is still processing
 */
export function isVideoProcessing(status: VideoStatusResponse['status']): boolean {
    return ['Pending', 'VideoRequestSubmitted', 'LipSyncRequestSubmitted'].includes(status);
}

/**
 * Check if video has failed
 */
export function isVideoFailed(status: VideoStatusResponse['status']): boolean {
    return ['VideoGenerationFailed', 'LipSyncFailed', 'Failed'].includes(status);
}

/**
 * Check if video is completed
 */
export function isVideoCompleted(status: VideoStatusResponse['status']): boolean {
    return status === 'Completed' || status === 'VideoReady';
}

/**
 * Get user-friendly status message
 */
export function getVideoStatusMessage(status: VideoStatusResponse['status']): string {
    switch (status) {
        case 'Pending':
            return 'Video generation is pending...';
        case 'VideoRequestSubmitted':
            return 'Video generation in progress...';
        case 'VideoReady':
            return 'Video generated successfully';
        case 'LipSyncRequestSubmitted':
            return 'Lip sync processing in progress...';
        case 'Completed':
            return 'Video completed successfully';
        case 'VideoGenerationFailed':
            return 'Video generation failed';
        case 'LipSyncFailed':
            return 'Lip sync processing failed';
        case 'Failed':
            return 'Video processing failed';
        default:
            return 'Unknown status';
    }
}