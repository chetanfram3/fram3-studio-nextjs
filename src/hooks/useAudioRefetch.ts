'use client';

import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import logger from '@/utils/logger';

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Audio types supported by the system
 */
type AudioType = 'dialogue' | 'sceneSummary' | 'foley' | 'roomTone' | 'music';

/**
 * Options for unified audio refetch operations
 */
interface UnifiedAudioRefetchOptions {
  scriptId: string;
  versionId: string;
  audioType?: AudioType;
  sceneId?: number;
  dialogueId?: number;
  foleyId?: number;
  roomToneId?: number;
  musicId?: number;
  includeAnalytics?: boolean;
  includeStatus?: boolean;
  includeConfigs?: boolean;
}

/**
 * Config change options with additional metadata
 */
interface ConfigChangeOptions extends UnifiedAudioRefetchOptions {
  actorId?: string;
  isNarrator?: boolean;
  regenerationTriggered?: boolean;
}

/**
 * Return type for the hook
 */
interface UseAudioRefetchReturn {
  // Primary functions - reduced API calls
  refetchCombinedAudioData: () => Promise<void>;
  refetchSpecificVersions: (
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number
  ) => Promise<void>;
  refetchBatchAudioQueries: (audioTypes: AudioType[]) => Promise<void>;

  // Strategy-based refetch functions
  refetchAfterPromptEdit: (options: UnifiedAudioRefetchOptions) => Promise<void>;
  refetchAfterAudioGeneration: (options: UnifiedAudioRefetchOptions) => Promise<void>;
  refetchAfterVersionRestore: (options: UnifiedAudioRefetchOptions) => Promise<void>;
  refetchAfterConfigChange: (options: ConfigChangeOptions) => Promise<void>;
  refetchAfterBatchProcessing: (options: UnifiedAudioRefetchOptions) => Promise<void>;
  refetchMinimalSystem: (options: UnifiedAudioRefetchOptions) => Promise<void>;

  // Smart refetch dispatcher
  smartRefetch: (
    action:
      | 'prompt_edit'
      | 'audio_generation'
      | 'version_restore'
      | 'config_change'
      | 'batch_processing'
      | 'minimal_system_refresh',
    options: ConfigChangeOptions
  ) => Promise<void>;

  // Convenience functions for common scenarios
  refetchAfterPromptOperation: (
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number,
    audioGenerated?: boolean
  ) => Promise<void>;
  refetchAfterProcessingOperation: (
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number
  ) => Promise<void>;
  refetchAfterConfigOperation: (
    actorId?: string,
    isNarrator?: boolean,
    regenerationTriggered?: boolean
  ) => Promise<void>;

  // Emergency fallback
  emergencyRefetchAll: () => Promise<void>;

  // System information
  isUnifiedSystem: boolean;
  isOptimized: boolean;
  scriptId: string;
  versionId: string;
}

// ===========================
// MAIN HOOK
// ===========================

/**
 * Optimized audio refetch hook with reduced API calls
 * Focus on targeted invalidations instead of broad refreshes
 * 
 * @param scriptId - Script identifier
 * @param versionId - Version identifier
 * @returns Object with refetch functions and system metadata
 */
export function useAudioRefetch(scriptId: string, versionId: string): UseAudioRefetchReturn {
  const queryClient = useQueryClient();

  // ==========================================
  // OPTIMIZED TARGETED REFETCH FUNCTIONS
  // ==========================================

  /**
   * Refetch only the combined audio data call instead of individual types
   */
  const refetchCombinedAudioData = useCallback(async () => {
    logger.debug('Refetching combined audio data', { scriptId, versionId });

    await queryClient.invalidateQueries({
      queryKey: ['audioData', scriptId, versionId, 'unified'],
      exact: false
    });
  }, [queryClient, scriptId, versionId]);

  /**
   * Refetch specific version data only when needed
   */
  const refetchSpecificVersions = useCallback(async (
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number
  ) => {
    logger.debug('Refetching specific audio versions', {
      audioType,
      sceneId,
      dialogueId,
      foleyId,
      roomToneId,
      musicId
    });

    await queryClient.invalidateQueries({
      queryKey: ['audioVersions', scriptId, versionId, audioType, sceneId, dialogueId, foleyId, roomToneId, musicId, 'unified'],
      exact: true
    });
  }, [queryClient, scriptId, versionId]);

  /**
   * Batch invalidate related queries
   */
  const refetchBatchAudioQueries = useCallback(async (audioTypes: AudioType[]) => {
    logger.debug('Batch refetching audio queries', { audioTypes, scriptId, versionId });

    const invalidatePromises = audioTypes.map(audioType =>
      queryClient.invalidateQueries({
        queryKey: ['audioData', audioType, scriptId, versionId, 'unified'],
        exact: false
      })
    );

    await Promise.all([
      ...invalidatePromises,
      queryClient.invalidateQueries({
        queryKey: ['audioData', scriptId, versionId, 'unified'],
        exact: false
      })
    ]);
  }, [queryClient, scriptId, versionId]);

  // ==========================================
  // OPTIMIZED INTELLIGENT REFETCH STRATEGIES
  // ==========================================

  /**
   * Strategy 1: Prompt Edit Only (creates draft version)
   * - Refetch specific versions (to show new draft version)
   * - Refetch combined audio data (single call instead of multiple)
   */
  const refetchAfterPromptEdit = useCallback(async (options: UnifiedAudioRefetchOptions) => {
    const { audioType, sceneId, dialogueId, foleyId, roomToneId, musicId } = options;

    if (!audioType || sceneId === undefined) {
      logger.warn('Missing required parameters for prompt edit refetch', { audioType, sceneId });
      return;
    }

    logger.debug('Refetching after prompt edit (creates draft version)', {
      audioType,
      sceneId,
      scriptId,
      versionId
    });

    await Promise.all([
      refetchSpecificVersions(audioType, sceneId, dialogueId, foleyId, roomToneId, musicId),
      refetchCombinedAudioData(),
    ]);
  }, [refetchSpecificVersions, refetchCombinedAudioData, scriptId, versionId]);

  /**
   * Strategy 2: Audio Generation (creates audio for existing draft or new version)
   * - Refetch specific versions (new audio added to version)
   * - Refetch combined audio data (single call)
   * - Skip status and playlist updates for single audio items
   */
  const refetchAfterAudioGeneration = useCallback(async (options: UnifiedAudioRefetchOptions) => {
    const { audioType, sceneId, dialogueId, foleyId, roomToneId, musicId } = options;

    if (!audioType || sceneId === undefined) {
      logger.warn('Missing required parameters for audio generation refetch', { audioType, sceneId });
      return;
    }

    logger.debug('Refetching after audio generation (adds audio to version)', {
      audioType,
      sceneId,
      scriptId,
      versionId
    });

    await Promise.all([
      refetchSpecificVersions(audioType, sceneId, dialogueId, foleyId, roomToneId, musicId),
      refetchCombinedAudioData(),
    ]);
  }, [refetchSpecificVersions, refetchCombinedAudioData, scriptId, versionId]);

  /**
   * Strategy 3: Version Restore (changes current version)
   * - Refetch specific versions (current version changed)
   * - Refetch combined audio data (current audio changed)
   */
  const refetchAfterVersionRestore = useCallback(async (options: UnifiedAudioRefetchOptions) => {
    const { audioType, sceneId, dialogueId, foleyId, roomToneId, musicId } = options;

    if (!audioType || sceneId === undefined) {
      logger.warn('Missing required parameters for version restore refetch', { audioType, sceneId });
      return;
    }

    logger.debug('Refetching after version restore (changes current version)', {
      audioType,
      sceneId,
      scriptId,
      versionId
    });

    await Promise.all([
      refetchSpecificVersions(audioType, sceneId, dialogueId, foleyId, roomToneId, musicId),
      refetchCombinedAudioData(),
    ]);
  }, [refetchSpecificVersions, refetchCombinedAudioData, scriptId, versionId]);

  /**
   * Strategy 4: Config Change (may trigger regeneration)
   * - Only refetch if regeneration occurred, otherwise skip
   */
  const refetchAfterConfigChange = useCallback(async (options: ConfigChangeOptions) => {
    const { isNarrator, regenerationTriggered } = options;

    logger.debug('Config change detected', {
      isNarrator: isNarrator ?? false,
      regenerationTriggered: regenerationTriggered ?? false,
      scriptId,
      versionId
    });

    if (regenerationTriggered) {
      logger.info('Regeneration triggered, refetching audio data');
      await refetchCombinedAudioData();
    } else {
      logger.debug('No regeneration triggered, skipping refetch');
    }
  }, [refetchCombinedAudioData, scriptId, versionId]);

  /**
   * Strategy 5: Batch Processing (multiple items affected)
   * - Single combined audio data refetch
   */
  const refetchAfterBatchProcessing = useCallback(async (options: UnifiedAudioRefetchOptions) => {
    logger.debug('Refetching after batch processing', { scriptId, versionId });

    // Single refetch for all audio data
    await refetchCombinedAudioData();
  }, [refetchCombinedAudioData, scriptId, versionId]);

  /**
   * Strategy 6: Minimal System Refresh
   * - Only refetch essential audio data, skip analytics and configs
   */
  const refetchMinimalSystem = useCallback(async (options: UnifiedAudioRefetchOptions) => {
    logger.debug('Minimal system refetch (audio elements only)', { scriptId, versionId });

    await refetchCombinedAudioData();
  }, [refetchCombinedAudioData, scriptId, versionId]);

  // ==========================================
  // OPTIMIZED SMART REFETCH DISPATCHER
  // ==========================================

  /**
   * Smart refetch with reduced API calls
   * Dispatches to appropriate strategy based on action type
   */
  const smartRefetch = useCallback(async (
    action:
      | 'prompt_edit'
      | 'audio_generation'
      | 'version_restore'
      | 'config_change'
      | 'batch_processing'
      | 'minimal_system_refresh',
    options: ConfigChangeOptions
  ) => {
    logger.debug('Smart refetch dispatching', { action, scriptId, versionId });

    switch (action) {
      case 'prompt_edit':
        return refetchAfterPromptEdit(options);

      case 'audio_generation':
        return refetchAfterAudioGeneration(options);

      case 'version_restore':
        return refetchAfterVersionRestore(options);

      case 'config_change':
        return refetchAfterConfigChange(options);

      case 'batch_processing':
        return refetchAfterBatchProcessing(options);

      case 'minimal_system_refresh':
        return refetchMinimalSystem(options);

      default:
        logger.warn('Unknown refetch action', { action });
    }
  }, [
    refetchAfterPromptEdit,
    refetchAfterAudioGeneration,
    refetchAfterVersionRestore,
    refetchAfterConfigChange,
    refetchAfterBatchProcessing,
    refetchMinimalSystem
  ]);

  // ==========================================
  // OPTIMIZED CONVENIENCE FUNCTIONS
  // ==========================================

  /**
   * Minimal refetch after audio operations
   */
  const refetchAfterPromptOperation = useCallback(async (
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number,
    audioGenerated?: boolean
  ) => {
    const action = audioGenerated ? 'audio_generation' : 'prompt_edit';

    logger.debug('Refetching after prompt operation', {
      action,
      audioType,
      sceneId,
      audioGenerated
    });

    await smartRefetch(action, {
      scriptId,
      versionId,
      audioType,
      sceneId,
      dialogueId,
      foleyId,
      roomToneId,
      musicId,
    });
  }, [smartRefetch, scriptId, versionId]);

  /**
   * Minimal refetch after processing operations
   */
  const refetchAfterProcessingOperation = useCallback(async (
    audioType: AudioType,
    sceneId: number,
    dialogueId?: number,
    foleyId?: number,
    roomToneId?: number,
    musicId?: number
  ) => {
    logger.debug('Refetching after processing operation', {
      audioType,
      sceneId
    });

    await smartRefetch('audio_generation', {
      scriptId,
      versionId,
      audioType,
      sceneId,
      dialogueId,
      foleyId,
      roomToneId,
      musicId,
    });
  }, [smartRefetch, scriptId, versionId]);

  /**
   * Only refetch if regeneration occurred
   */
  const refetchAfterConfigOperation = useCallback(async (
    actorId?: string,
    isNarrator?: boolean,
    regenerationTriggered?: boolean
  ) => {
    logger.debug('Refetching after config operation', {
      actorId,
      isNarrator,
      regenerationTriggered
    });

    await smartRefetch('config_change', {
      scriptId,
      versionId,
      actorId,
      isNarrator,
      regenerationTriggered,
    });
  }, [smartRefetch, scriptId, versionId]);

  // ==========================================
  // EMERGENCY FALLBACK (USE SPARINGLY)
  // ==========================================

  /**
   * Emergency fallback - invalidates all audio queries
   * USE ONLY when other strategies fail
   */
  const emergencyRefetchAll = useCallback(async () => {
    logger.warn('EMERGENCY: Full audio refetch triggered', { scriptId, versionId });

    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: ['audioData'],
        exact: false
      }),
      queryClient.invalidateQueries({
        queryKey: ['audioVersions'],
        exact: false
      })
    ]);
  }, [queryClient, scriptId, versionId]);

  // ==========================================
  // RETURN INTERFACE
  // ==========================================

  return {
    // Primary functions - reduced API calls
    refetchCombinedAudioData,
    refetchSpecificVersions,
    refetchBatchAudioQueries,

    // Strategy-based refetch functions
    refetchAfterPromptEdit,
    refetchAfterAudioGeneration,
    refetchAfterVersionRestore,
    refetchAfterConfigChange,
    refetchAfterBatchProcessing,
    refetchMinimalSystem,

    // Smart refetch dispatcher
    smartRefetch,

    // Convenience functions for common scenarios
    refetchAfterPromptOperation,
    refetchAfterProcessingOperation,
    refetchAfterConfigOperation,

    // Emergency fallback
    emergencyRefetchAll,

    // System information
    isUnifiedSystem: true,
    isOptimized: true,
    scriptId,
    versionId,
  };
}

// ===========================
// EXPORT TYPES
// ===========================

export type {
  AudioType,
  UnifiedAudioRefetchOptions,
  ConfigChangeOptions,
  UseAudioRefetchReturn
};