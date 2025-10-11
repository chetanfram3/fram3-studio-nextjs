'use client';

// hooks/useAudio.ts - UNIFIED VERSION for Backend v3.0
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import logger from '@/utils/logger';
import {
    // Updated Unified Audio Service Functions
    getActorAudioConfig,
    getNarratorAudioConfig,
    getAllActorConfigs,

    // Data Retrieval Functions (Unified)
    fetchAllAudioData,

    // Version Management Functions (Unified)
    getAudioVersions,
    getAudioPlaylist,
    restoreAudioVersion,

    // Prompt Management Functions (Unified)
    getPromptHistory,
    getAllAudioPrompts,

    // Processing Functions (Unified)
    processDialogueAudio,
    processSceneSummaryAudio,
    processFoleyAudio,
    processRoomToneAudio,
    processMusicAudio,

    // Prompt Editing Functions (Unified)
    editDialogueAudioPrompt,
    editSceneSummaryAudioPrompt,
    editFoleyAudioPrompt,
    editRoomToneAudioPrompt,
    editMusicAudioPrompt,

    // Configuration Functions (Unified)
    updateActorAudioConfig,
    updateNarratorAudioConfig,
    regenerateActorAudio,
    regenerateNarratorAudio,

    // Batch Processing Functions (Unified)
    batchProcessAudio,

    // Status and Analytics (Unified)
    getAudioProcessingStatus,
    getAudioAnalytics,
    getAudioHealthScore,
} from '@/services/audioService';

import {
    // Updated Types for Unified System
    AudioType,
    GetActorConfigParams,
    FetchAudioDataParams,
    ProcessDialogueAudioParams,
    ProcessSceneSummaryAudioParams,
    ProcessFoleyAudioParams,
    ProcessRoomToneAudioParams,
    ProcessMusicAudioParams,
    EditDialoguePromptParams,
    EditSceneSummaryPromptParams,
    EditFoleyPromptParams,
    EditRoomTonePromptParams,
    EditMusicPromptParams,
    UpdateActorConfigParams,
    UpdateNarratorConfigParams,
    RestoreAudioVersionParams,
    BatchProcessAudioParams,
    UnifiedAudioItem,
} from '@/types/audio';

// =============================================================================
// ACTOR/NARRATOR CONFIGURATION HOOKS (Updated for Unified System)
// =============================================================================

/**
 * Regeneration options for audio config
 */
interface RegenerationOptions {
    force?: boolean;
    preserveExisting?: boolean;
    [key: string]: unknown;
}


interface UseActorConfigsOptions {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
}

/**
 * Hook to get all actor configurations for a script version (unified)
 */
export function useActorConfigs(
    scriptId: string,
    versionId: string,
    options: UseActorConfigsOptions = {}
) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['actorConfigs', scriptId, versionId, 'unified'],
        queryFn: () => getAllActorConfigs({ scriptId, versionId }),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 10, // 10 minutes
        refetchInterval: options.refetchInterval,
    });

    // Update actor config mutation (unified)
    const updateActorMutation = useMutation({
        mutationFn: ({ actorId, ...params }: { actorId: string } & UpdateActorConfigParams) =>
            updateActorAudioConfig(actorId, params),
        onSuccess: (data) => {
            // Invalidate relevant queries for unified system
            queryClient.invalidateQueries({ queryKey: ['actorConfigs', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['actorConfig'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });

            // If regeneration was triggered, invalidate more specific queries
            if (data.regenerationTriggered) {
                queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
                queryClient.invalidateQueries({ queryKey: ['audioAnalytics'] });
            }
        },
    });

    // Regenerate actor audio mutation (unified)
    const regenerateAudioMutation = useMutation({
        mutationFn: ({ actorId, ...params }: { actorId: string; options?: RegenerationOptions } & GetActorConfigParams) =>
            regenerateActorAudio(actorId, params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
            queryClient.invalidateQueries({ queryKey: ['audioAnalytics'] });
        },
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['actorConfigs', scriptId, versionId] });
    }, [queryClient, scriptId, versionId]);

    const getActorById = useCallback((actorId: string) => {
        return query.data?.configs[actorId] || null;
    }, [query.data]);

    return {
        // Data
        configs: query.data?.configs || {},
        total: query.data?.total || 0,

        // Query states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Mutations
        updateActor: updateActorMutation.mutate,
        updateActorAsync: updateActorMutation.mutateAsync,
        isUpdatingActor: updateActorMutation.isPending,
        updateActorError: updateActorMutation.error,

        regenerateAudio: regenerateAudioMutation.mutate,
        regenerateAudioAsync: regenerateAudioMutation.mutateAsync,
        isRegeneratingAudio: regenerateAudioMutation.isPending,
        regenerateAudioError: regenerateAudioMutation.error,

        // Helper functions
        refresh,
        getActorById,
        hasActor: useCallback((actorId: string) => {
            return !!query.data?.configs[actorId];
        }, [query.data]),

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
    };
}

/**
 * Hook to get a specific actor configuration (unified)
 */
export function useActorConfig(
    actorId: string,
    scriptId: string,
    versionId: string,
    options: UseActorConfigsOptions = {}
) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['actorConfig', actorId, scriptId, versionId, 'unified'],
        queryFn: () => getActorAudioConfig(actorId, { scriptId, versionId }),
        enabled: options.enabled !== false && !!actorId && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['actorConfig', actorId, scriptId, versionId] });
    }, [queryClient, actorId, scriptId, versionId]);

    return {
        // Actor config data
        config: query.data?.config || null,
        exists: query.data?.exists || false,
        created: query.data?.created || false,

        // Query states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Helper functions
        refresh,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        configMethod: query.data?.configMethod,
    };
}

/**
 * Hook to get narrator configuration (unified)
 */
export function useNarratorConfig(
    scriptId: string,
    versionId: string,
    options: UseActorConfigsOptions = {}
) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['narratorConfig', scriptId, versionId, 'unified'],
        queryFn: () => getNarratorAudioConfig({ scriptId, versionId }),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    // Update narrator config mutation (unified)
    const updateNarratorMutation = useMutation({
        mutationFn: (params: UpdateNarratorConfigParams) => updateNarratorAudioConfig(params),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['narratorConfig', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });

            // If regeneration was triggered, invalidate more specific queries
            if (data.regenerationTriggered) {
                queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
                queryClient.invalidateQueries({ queryKey: ['audioAnalytics'] });
            }
        },
    });

    // Regenerate narrator audio mutation (unified)
    const regenerateAudioMutation = useMutation({
        mutationFn: (params: GetActorConfigParams & { options?: RegenerationOptions }) =>
            regenerateNarratorAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
            queryClient.invalidateQueries({ queryKey: ['audioAnalytics'] });
        },
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['narratorConfig', scriptId, versionId] });
    }, [queryClient, scriptId, versionId]);

    return {
        // Narrator config data
        config: query.data?.config || null,
        exists: query.data?.exists || false,
        created: query.data?.created || false,

        // Query states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Mutations
        updateNarrator: updateNarratorMutation.mutate,
        updateNarratorAsync: updateNarratorMutation.mutateAsync,
        isUpdatingNarrator: updateNarratorMutation.isPending,
        updateNarratorError: updateNarratorMutation.error,

        regenerateAudio: regenerateAudioMutation.mutate,
        regenerateAudioAsync: regenerateAudioMutation.mutateAsync,
        isRegeneratingAudio: regenerateAudioMutation.isPending,
        regenerateAudioError: regenerateAudioMutation.error,

        // Helper functions
        refresh,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        configMethod: query.data?.configMethod,
    };
}

// =============================================================================
// UNIFIED AUDIO DATA RETRIEVAL HOOKS
// =============================================================================

interface UseAudioDataOptions {
    enabled?: boolean;
    includeActions?: boolean;
    audioTypes?: AudioType[];
    refetchInterval?: number;
    staleTime?: number;
}

/**
 * Main hook to get all processed audio data with unified versioning
 */
export function useAudioData(
    scriptId: string,
    versionId: string,
    options: UseAudioDataOptions = {}
) {
    const queryClient = useQueryClient();

    const params: FetchAudioDataParams = useMemo(() => ({
        scriptId,
        versionId,
        includeActions: options.includeActions ?? false,
        audioTypes: options.audioTypes,
    }), [scriptId, versionId, options.includeActions, options.audioTypes]);

    const query = useQuery({
        queryKey: ['audioData', scriptId, versionId, 'unified', params],
        queryFn: () => fetchAllAudioData(params),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 3, // 3 minutes
        gcTime: 1000 * 60 * 8, // 8 minutes
        refetchInterval: options.refetchInterval,
    });

    // Individual processing mutations (unified)
    const processDialogueMutation = useMutation({
        mutationFn: (params: ProcessDialogueAudioParams) => processDialogueAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
        },
    });

    const processSceneSummaryMutation = useMutation({
        mutationFn: (params: ProcessSceneSummaryAudioParams) => processSceneSummaryAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
        },
    });

    const processFoleyMutation = useMutation({
        mutationFn: (params: ProcessFoleyAudioParams) => processFoleyAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
        },
    });

    const processRoomToneMutation = useMutation({
        mutationFn: (params: ProcessRoomToneAudioParams) => processRoomToneAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
        },
    });

    const processMusicMutation = useMutation({
        mutationFn: (params: ProcessMusicAudioParams) => processMusicAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
        },
    });

    // Batch processing mutations (unified)
    const batchProcessMutation = useMutation({
        mutationFn: (params: BatchProcessAudioParams) => batchProcessAudio(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
            queryClient.invalidateQueries({ queryKey: ['audioAnalytics'] });
        },
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
    }, [queryClient, scriptId, versionId]);

    const refreshAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['audioData'] });
        queryClient.invalidateQueries({ queryKey: ['actorConfigs'] });
        queryClient.invalidateQueries({ queryKey: ['narratorConfig'] });
        queryClient.invalidateQueries({ queryKey: ['audioAnalytics'] });
    }, [queryClient]);

    // Helper functions for unified data structure
    const getAudioByType = useCallback((type: AudioType): UnifiedAudioItem[] => {
        if (!query.data?.audioData) return [];

        switch (type) {
            case 'dialogue':
                return query.data.audioData.dialogues || [];
            case 'sceneSummary':
                return query.data.audioData.sceneSummaries || [];
            case 'foley':
                return query.data.audioData.foley || [];
            case 'roomTone':
                return query.data.audioData.roomTones || [];
            case 'music':
                return query.data.audioData.music || [];
            default:
                return [];
        }
    }, [query.data]);

    const getDialogueAudio = useCallback((sceneId: number, dialogueId: number) => {
        const dialogues = getAudioByType('dialogue');
        return dialogues.find(d => d.sceneId === sceneId && d.dialogueId === dialogueId) || null;
    }, [getAudioByType]);

    const getFoleyAudio = useCallback((sceneId: number, foleyId: number) => {
        const foleyItems = getAudioByType('foley');
        return foleyItems.find(f => f.sceneId === sceneId && f.foleyId === foleyId) || null;
    }, [getAudioByType]);

    const getSceneSummaryAudio = useCallback((sceneId: number) => {
        const summaries = getAudioByType('sceneSummary');
        return summaries.find(s => s.sceneId === sceneId) || null;
    }, [getAudioByType]);

    return {
        // Unified data structure
        audioData: query.data?.audioData || {
            dialogues: [],
            sceneSummaries: [],
            foley: [],
            roomTones: [],
            music: [],
        },
        statistics: query.data?.statistics || null,
        summary: query.data?.summary || {},

        // Query states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Individual processing mutations
        processDialogue: processDialogueMutation.mutate,
        processDialogueAsync: processDialogueMutation.mutateAsync,
        isProcessingDialogue: processDialogueMutation.isPending,

        processSceneSummary: processSceneSummaryMutation.mutate,
        processSceneSummaryAsync: processSceneSummaryMutation.mutateAsync,
        isProcessingSceneSummary: processSceneSummaryMutation.isPending,

        processFoley: processFoleyMutation.mutate,
        processFoleyAsync: processFoleyMutation.mutateAsync,
        isProcessingFoley: processFoleyMutation.isPending,

        processRoomTone: processRoomToneMutation.mutate,
        processRoomToneAsync: processRoomToneMutation.mutateAsync,
        isProcessingRoomTone: processRoomToneMutation.isPending,

        processMusic: processMusicMutation.mutate,
        processMusicAsync: processMusicMutation.mutateAsync,
        isProcessingMusic: processMusicMutation.isPending,

        // Batch processing mutations
        batchProcess: batchProcessMutation.mutate,
        batchProcessAsync: batchProcessMutation.mutateAsync,
        isBatchProcessing: batchProcessMutation.isPending,
        batchProcessError: batchProcessMutation.error,

        // Helper functions
        refresh,
        refreshAll,
        getAudioByType,
        getDialogueAudio,
        getFoleyAudio,
        getSceneSummaryAudio,

        // Computed values
        totalDialogues: query.data?.statistics?.totalDialogues || 0,
        totalSceneSummaries: query.data?.statistics?.totalSceneSummaries || 0,
        totalFoley: query.data?.statistics?.totalFoley || 0,
        totalRoomTones: query.data?.statistics?.totalRoomTones || 0,
        totalMusic: query.data?.statistics?.totalMusic || 0,
        totalAudioFiles: query.data?.statistics?.totalAudioFiles || 0,
        hasAudio: (query.data?.statistics?.totalAudioFiles || 0) > 0,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        dataMethod: query.data?.dataMethod,
    };
}

/**
 * Hook for specific audio type data (unified)
 */
export function useAudioByType(
    scriptId: string,
    versionId: string,
    audioType: AudioType,
    options: UseAudioDataOptions = {}
) {
    const params: FetchAudioDataParams = useMemo(() => ({
        scriptId,
        versionId,
        audioTypes: [audioType],
        includeActions: options.includeActions ?? false,
    }), [scriptId, versionId, audioType, options.includeActions]);

    const query = useQuery({
        queryKey: ['audioData', audioType, scriptId, versionId, 'unified', params],
        queryFn: () => fetchAllAudioData(params),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 3,
        gcTime: 1000 * 60 * 8,
    });

    const audioItems = useMemo(() => {
        if (!query.data?.audioData) return [];

        switch (audioType) {
            case 'dialogue':
                return query.data.audioData.dialogues || [];
            case 'sceneSummary':
                return query.data.audioData.sceneSummaries || [];
            case 'foley':
                return query.data.audioData.foley || [];
            case 'roomTone':
                return query.data.audioData.roomTones || [];
            case 'music':
                return query.data.audioData.music || [];
            default:
                return [];
        }
    }, [query.data, audioType]);

    return {
        audioItems,
        audioType,
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,
        refetch: query.refetch,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
    };
}

// Convenience hooks for specific types
export const useDialogueAudio = (scriptId: string, versionId: string, options?: UseAudioDataOptions) =>
    useAudioByType(scriptId, versionId, 'dialogue', options);

export const useSceneSummaryAudio = (scriptId: string, versionId: string, options?: UseAudioDataOptions) =>
    useAudioByType(scriptId, versionId, 'sceneSummary', options);

export const useFoleyAudio = (scriptId: string, versionId: string, options?: UseAudioDataOptions) =>
    useAudioByType(scriptId, versionId, 'foley', options);

export const useRoomToneAudio = (scriptId: string, versionId: string, options?: UseAudioDataOptions) =>
    useAudioByType(scriptId, versionId, 'roomTone', options);

export const useMusicAudio = (scriptId: string, versionId: string, options?: UseAudioDataOptions) =>
    useAudioByType(scriptId, versionId, 'music', options);

// =============================================================================
// UNIFIED VERSION MANAGEMENT HOOKS
// =============================================================================

interface UseAudioVersionsOptions {
    enabled?: boolean;
    staleTime?: number;
}

/**
 * Hook to get all versions of an audio item (unified)
 */
export function useAudioVersions(
    scriptId: string,
    versionId: string,
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number,
    options: UseAudioVersionsOptions = {}
) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['audioVersions', scriptId, versionId, audioType, sceneId, dialogueId, foleyId, roomToneId, musicId, 'unified'],
        queryFn: () => getAudioVersions(scriptId, versionId, audioType, sceneId, dialogueId, foleyId, roomToneId, musicId),
        enabled: options.enabled !== false && !!scriptId && !!versionId && !!audioType && sceneId !== undefined,
        staleTime: options.staleTime || 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    // Restore version mutation (unified)
    const restoreVersionMutation = useMutation({
        mutationFn: (params: RestoreAudioVersionParams) => restoreAudioVersion(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
        },
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: ['audioVersions', scriptId, versionId, audioType, sceneId, dialogueId, foleyId, roomToneId, musicId]
        });
    }, [queryClient, scriptId, versionId, audioType, sceneId, dialogueId, foleyId, roomToneId, musicId]);

    return {
        // Version data (unified structure)
        audioType: query.data?.audioType || audioType,
        totalVersions: query.data?.totalVersions || 0,
        currentVersion: query.data?.currentVersion || 1,
        versions: query.data?.versions || { current: null, archived: {} },
        totalEdits: query.data?.totalEdits || 0,
        summary: query.data?.summary || { versionsWithAudio: 0, draftsOnly: 0, totalDuration: 0 },

        // Query states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Mutations
        restoreVersion: restoreVersionMutation.mutate,
        restoreVersionAsync: restoreVersionMutation.mutateAsync,
        isRestoringVersion: restoreVersionMutation.isPending,
        restoreVersionError: restoreVersionMutation.error,

        // Helper functions
        refresh,
        getVersionByNumber: useCallback((versionNumber: number) => {
            const versions = query.data?.versions;
            if (!versions) return null;

            if (versions.current?.version === versionNumber) {
                return versions.current;
            }
            return versions.archived[versionNumber] || null;
        }, [query.data]),

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        versionsMethod: query.data?.versionsMethod,
    };
}

/**
 * Hook to get audio playlist (unified)
 */
export function useAudioPlaylist(
    scriptId: string,
    versionId: string,
    options: {
        includeDialogues?: boolean;
        includeSceneSummaries?: boolean;
        includeFoley?: boolean;
        includeRoomTones?: boolean;
        includeMusic?: boolean;
        sortBy?: string;
        filterByScenes?: number[];
        onlyWithAudio?: boolean;
        includeDrafts?: boolean;
    } = {},
    queryOptions: UseAudioVersionsOptions = {}
) {
    const query = useQuery({
        queryKey: ['audioPlaylist', scriptId, versionId, 'unified', options],
        queryFn: () => getAudioPlaylist(scriptId, versionId, options),
        enabled: queryOptions.enabled !== false && !!scriptId && !!versionId,
        staleTime: queryOptions.staleTime || 1000 * 60 * 3,
        gcTime: 1000 * 60 * 8,
    });

    return {
        playlist: query.data?.playlist || [],
        statistics: query.data?.statistics || null,
        playlistOptions: query.data?.playlistOptions || options,

        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        playlistMethod: query.data?.playlistMethod,
    };
}

// =============================================================================
// UNIFIED PROMPT MANAGEMENT HOOKS
// =============================================================================

/**
 * Hook to get prompt history for any audio type (unified)
 */
export function usePromptHistory(
    scriptId: string,
    versionId: string,
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    options: UseAudioVersionsOptions = {}
) {
    const query = useQuery({
        queryKey: ['promptHistory', scriptId, versionId, audioType, sceneId, dialogueId, foleyId, 'unified'],
        queryFn: () => getPromptHistory(scriptId, versionId, audioType, sceneId,
            audioType === 'dialogue' ? dialogueId :
                audioType === 'foley' ? foleyId :
                    undefined
        ),
        enabled: options.enabled !== false && !!scriptId && !!versionId && !!audioType && sceneId !== undefined,
        staleTime: options.staleTime || 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    return {
        // Use versions data for prompt history in unified system
        totalVersions: query.data?.totalVersions || 0,
        currentVersion: query.data?.currentVersion || 1,
        versions: query.data?.versions || { current: null, archived: {} },
        totalEdits: query.data?.totalEdits || 0,

        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,
        refetch: query.refetch,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
    };
}

/**
 * Hook to get all audio prompts for a script (unified)
 */
export function useAllAudioPrompts(
    scriptId: string,
    versionId: string,
    options: UseAudioVersionsOptions = {}
) {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['allAudioPrompts', scriptId, versionId, 'unified'],
        queryFn: () => getAllAudioPrompts(scriptId, versionId),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
    });

    // Unified prompt editing mutations
    const editDialogueMutation = useMutation({
        mutationFn: (params: EditDialoguePromptParams) => editDialogueAudioPrompt(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allAudioPrompts', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['promptHistory'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['audioVersions'] });
        },
    });

    const editSceneSummaryMutation = useMutation({
        mutationFn: (params: EditSceneSummaryPromptParams) => editSceneSummaryAudioPrompt(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allAudioPrompts', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['promptHistory'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
        },
    });

    const editFoleyMutation = useMutation({
        mutationFn: (params: EditFoleyPromptParams) => editFoleyAudioPrompt(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allAudioPrompts', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['promptHistory'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
        },
    });

    const editRoomToneMutation = useMutation({
        mutationFn: (params: EditRoomTonePromptParams) => editRoomToneAudioPrompt(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allAudioPrompts', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['promptHistory'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
        },
    });

    const editMusicMutation = useMutation({
        mutationFn: (params: EditMusicPromptParams) => editMusicAudioPrompt(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['allAudioPrompts', scriptId, versionId] });
            queryClient.invalidateQueries({ queryKey: ['promptHistory'] });
            queryClient.invalidateQueries({ queryKey: ['audioData', scriptId, versionId] });
        },
    });

    const refresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ['allAudioPrompts', scriptId, versionId] });
    }, [queryClient, scriptId, versionId]);

    return {
        // Unified audio data instead of separate prompts structure
        audioData: query.data?.audioData || {
            dialogues: [],
            sceneSummaries: [],
            foley: [],
            roomTones: [],
            music: [],
        },
        statistics: query.data?.statistics || {
            totalDialogues: 0,
            totalSceneSummaries: 0,
            totalFoley: 0,
            totalRoomTones: 0,
            totalMusic: 0,
        },

        // Query states
        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Edit mutations
        editDialogue: editDialogueMutation.mutate,
        editDialogueAsync: editDialogueMutation.mutateAsync,
        isEditingDialogue: editDialogueMutation.isPending,

        editSceneSummary: editSceneSummaryMutation.mutate,
        editSceneSummaryAsync: editSceneSummaryMutation.mutateAsync,
        isEditingSceneSummary: editSceneSummaryMutation.isPending,

        editFoley: editFoleyMutation.mutate,
        editFoleyAsync: editFoleyMutation.mutateAsync,
        isEditingFoley: editFoleyMutation.isPending,

        editRoomTone: editRoomToneMutation.mutate,
        editRoomToneAsync: editRoomToneMutation.mutateAsync,
        isEditingRoomTone: editRoomToneMutation.isPending,

        editMusic: editMusicMutation.mutate,
        editMusicAsync: editMusicMutation.mutateAsync,
        isEditingMusic: editMusicMutation.isPending,

        // Helper functions
        refresh,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
    };
}

// =============================================================================
// ANALYTICS AND STATUS HOOKS (New for Unified System)
// =============================================================================

/**
 * Hook to get audio processing status (unified)
 */
export function useAudioProcessingStatus(
    scriptId: string,
    versionId: string,
    options: UseAudioVersionsOptions = {}
) {
    const query = useQuery({
        queryKey: ['audioProcessingStatus', scriptId, versionId, 'unified'],
        queryFn: () => getAudioProcessingStatus(scriptId, versionId),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 2, // 2 minutes
        gcTime: 1000 * 60 * 5,
    });

    return {
        status: query.data?.status || {},
        overall: query.data?.overall || {},
        isComplete: query.data?.isComplete || false,
        isAudioComplete: query.data?.isAudioComplete || false,
        summary: query.data?.summary || {},

        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        statusMethod: query.data?.statusMethod,
    };
}

/**
 * Hook to get audio analytics (unified)
 */
export function useAudioAnalytics(
    scriptId: string,
    versionId: string,
    options: UseAudioVersionsOptions = {}
) {
    const query = useQuery({
        queryKey: ['audioAnalytics', scriptId, versionId, 'unified'],
        queryFn: () => getAudioAnalytics(scriptId, versionId),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 10, // 10 minutes
        gcTime: 1000 * 60 * 20,
    });

    return {
        analytics: query.data?.analytics || null,
        generatedAt: query.data?.generatedAt || null,
        summary: query.data?.summary || {},

        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        analyticsMethod: query.data?.analyticsMethod,
    };
}

/**
 * Hook to get audio health score (unified)
 */
export function useAudioHealthScore(
    scriptId: string,
    versionId: string,
    options: UseAudioVersionsOptions = {}
) {
    const query = useQuery({
        queryKey: ['audioHealthScore', scriptId, versionId, 'unified'],
        queryFn: () => getAudioHealthScore(scriptId, versionId),
        enabled: options.enabled !== false && !!scriptId && !!versionId,
        staleTime: options.staleTime || 1000 * 60 * 15, // 15 minutes
        gcTime: 1000 * 60 * 30,
    });

    return {
        healthScore: query.data?.healthScore || null,

        isLoading: query.isLoading,
        isFetching: query.isFetching,
        error: query.error,
        isError: query.isError,

        // Unified system indicators
        isUnified: true,
        unifiedVersioning: query.data?.unifiedVersioning || false,
        healthMethod: query.data?.healthMethod,
    };
}