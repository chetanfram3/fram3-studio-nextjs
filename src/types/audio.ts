// =============================================================================
// UNIFIED AUDIO API TYPE DEFINITIONS (Version 3.0) - CORRECTED
// =============================================================================

import { ModelTier } from "@/components/common/ModelTierSelector";

/**
 * Audio types supported by the unified system
 */
export type AudioType = 'dialogue' | 'sceneSummary' | 'foley' | 'roomTone' | 'music';

/**
 * Audio processing models
 */
export type AudioModel = 'google-tts' | 'elevenlabs-tts' | 'mmaudio' | 'elevenlabs-sfx';

/**
 * Voice configuration for Google TTS
 */
export interface GoogleVoiceConfig {
  voiceId: string;
  languageCode: string;
}

/**
 * Voice configuration for ElevenLabs TTS
 */
export interface ElevenLabsVoiceConfig {
  voiceId: string;
  modelId: string;
  outputFormat: string;
  voiceSettings: {
    stability: number;
    similarity_boost: number;
    style: number;
    use_speaker_boost: boolean;
  };
}

/**
 * Generic voice configuration (union type)
 */
export type VoiceConfig = GoogleVoiceConfig | ElevenLabsVoiceConfig;

/**
 * Audio metrics for generated audio
 */
export interface AudioMetrics {
  fileSize?: number;
  bitrate?: number;
  format?: string;
  [key: string]: unknown;
}

/**
 * Actor gender options
 */
export type ActorGender = 'Male' | 'Female';

/**
 * Audio version status
 */
export type AudioStatus = 'draft' | 'generated' | 'error';

/**
 * Action types for version history
 */
export type AudioActionType =
  | 'initial_creation'
  | 'prompt_edit'
  | 'audio_generated'
  | 'version_restored'
  | 'content_generation';

// =============================================================================
// UNIFIED VERSION MANAGEMENT TYPES
// =============================================================================

/**
 * Audio action in version history
 */
export interface AudioAction {
  type: AudioActionType;
  timestamp: string;
  previousPrompt?: string | null;
  newPrompt?: string | null;
  audioPath?: string;
  duration?: number;
  model?: AudioModel;
  regenerationReason?: string;
  sourceVersion?: number | null;
  fromVersion?: number;
  toVersion?: number;
  restoredFromVersion?: number;
  restoredPrompt?: string;
  restoredAudioGenerated?: boolean;
  editType?: string;
  [key: string]: unknown;
}

/**
 * Unified audio version data
 */
export interface UnifiedAudioVersion {
  version: number;
  prompt: string;
  destinationPath: string;
  audioGenerated: boolean;
  hasAudio: boolean;
  isDraft: boolean;
  status: AudioStatus;
  duration: number;
  audioMetrics: AudioMetrics;
  model?: AudioModel;
  voiceConfig?: VoiceConfig;
  actorConfigVersion?: number;
  actions: AudioAction[];
  isCurrent: boolean;
  createdAt: string;
  completedAt?: string | null;
  sourceVersion?: number | null;
  // Type-specific fields
  actorId?: string;
  dialogueId?: number;
  narratorId?: string;
  foleyId?: number;
  sceneId: number;
}

/**
 * Unified audio item with all versions
 */
export interface UnifiedAudioItem {
  musicId: number;
  roomToneId: number;
  id: string;
  audioType: AudioType;
  sceneId: number;

  // Current version data
  prompt: string;
  currentVersion: number;
  url?: string | null;
  destinationPath: string;
  duration: number;
  audioMetrics: AudioMetrics;

  // Status indicators  
  audioGenerated: boolean;
  hasAudio: boolean;
  isDraft: boolean;
  status: AudioStatus;

  // Version metadata
  totalVersions: number;
  totalEdits: number;
  createdAt: string;
  completedAt?: string | null;
  lastEditedAt?: string;
  sourceVersion?: number | null;

  // Audio configuration
  model?: AudioModel;
  voiceConfig?: VoiceConfig;

  // Type-specific fields
  dialogueId?: number;
  actorId?: string;
  actorConfigVersion?: number;
  narratorId?: string;
  narratorConfigVersion?: number;
  foleyId?: number;

  // Action history
  actions?: AudioAction[];
  lastAction?: AudioAction | null;

  // Version history (when included)
  versions?: {
    current: UnifiedAudioVersion;
    archived: Record<number, UnifiedAudioVersion>;
  };

  // Version summary
  versionSummary?: {
    current: number;
    total: number;
    withAudio: number;
    draftsOnly: number;
  };
}

// =============================================================================
// ACTOR CONFIGURATION TYPES
// =============================================================================

/**
 * Actor audio configuration for unified system
 */
export interface ActorAudioConfig {
  actorId: string;
  actorName: string;
  gender: ActorGender;
  model: AudioModel;
  voiceConfig: VoiceConfig;
  configVersion: number;
  previousConfigs?: Record<number, ArchivedActorConfig>;
  lastUpdated: string;
  totalUpdates: number;
  isNarrator?: boolean;
  isDefault?: boolean;
  migratedFrom?: string;
}

/**
 * Archived actor configuration
 */
export interface ArchivedActorConfig {
  gender: ActorGender;
  model: AudioModel;
  voiceConfig: VoiceConfig;
  archivedAt: string;
}

/**
 * Parameters for getting actor audio configuration
 */
export interface GetActorConfigParams {
  scriptId: string;
  versionId: string;
  currentModel?: AudioModel;
}

/**
 * Response for getting actor audio configuration
 */
export interface GetActorConfigResponse {
  success: boolean;
  config: ActorAudioConfig;
  exists: boolean;
  created?: boolean;
  unifiedVersioning: true;
  configMethod: string;
}

/**
 * Parameters for updating actor audio configuration
 */
export interface UpdateActorConfigParams {
  scriptId: string;
  versionId: string;
  newConfig: {
    gender: ActorGender;
    model: AudioModel;
    voiceConfig: VoiceConfig;
  };
  regenerateAll?: boolean;
}

/**
 * Regeneration result data
 */
export interface RegenerationResult {
  success: boolean;
  totalAffected: number;
  successful: number;
  failed: number;
  results?: Array<{
    sceneId: number;
    dialogueId?: number;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Response for updating actor audio configuration
 */
export interface UpdateActorConfigResponse {
  success: boolean;
  configUpdated: boolean;
  configVersion: number;
  regenerationTriggered: boolean;
  actorId: string;
  actorName: string;
  affectedItems: Array<{
    sceneId: number;
    dialogueId?: number;
    type: 'dialogue' | 'sceneSummary';
  }>;
  totalAffected: number;
  estimatedCredits: number;
  regenerationResult?: RegenerationResult;
  previousConfigVersion: number;
  unifiedVersioning: true;
  configMethod: string;
  regenerationMethod?: string;
}

/**
 * Response for getting all actor configurations
 */
export interface GetAllActorConfigsResponse {
  success: boolean;
  configs: Record<string, ActorAudioConfig>;
  total: number;
  unifiedVersioning: true;
  configMethod: string;
}

// =============================================================================
// NARRATOR CONFIGURATION TYPES
// =============================================================================

/**
 * Parameters for updating narrator audio configuration
 */
export interface UpdateNarratorConfigParams {
  scriptId: string;
  versionId: string;
  newConfig: {
    gender: ActorGender;
    model: AudioModel;
    voiceConfig: VoiceConfig;
  };
  regenerateAll?: boolean;
}

/**
 * Response for updating narrator audio configuration
 */
export interface UpdateNarratorConfigResponse {
  success: boolean;
  configUpdated: boolean;
  configVersion: number;
  regenerationTriggered: boolean;
  actorId: string;
  actorName: string;
  affectedItems: Array<{
    sceneId: number;
    type: 'sceneSummary';
  }>;
  totalAffected: number;
  estimatedCredits: number;
  regenerationResult?: RegenerationResult;
  previousConfigVersion: number;
  unifiedVersioning: true;
  configMethod: string;
  regenerationMethod?: string;
}

// =============================================================================
// INDIVIDUAL AUDIO PROCESSING TYPES
// =============================================================================

/**
 * Base audio processing options
 */
export interface BaseAudioProcessingOptions {
  sourcePrompt?: string;
  regenerationReason?: string;
  editType?: string;
  actorId?: string;
}

/**
 * Parameters for processing dialogue audio
 */
export interface ProcessDialogueAudioParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  dialogueId: number;
  options?: BaseAudioProcessingOptions;
}

/**
 * Response for processing dialogue audio
 */
export interface ProcessDialogueAudioResponse {
  success: boolean;
  audioPath: string;
  signedUrl?: string;
  duration: number;
  audioMetrics: AudioMetrics;
  actorId: string;
  actorConfig: {
    gender: ActorGender;
    model: AudioModel;
    configVersion: number;
  };
  versionInfo: {
    version: number;
    isNewVersion: boolean;
    wasUpdated: boolean;
  };
  sceneId: number;
  dialogueId: number;
  prompt: string;
  unifiedVersioning: true;
  processingMethod: string;
}

/**
 * Parameters for processing scene summary audio
 */
export interface ProcessSceneSummaryAudioParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  options?: BaseAudioProcessingOptions;
}

/**
 * Response for processing scene summary audio
 */
export interface ProcessSceneSummaryAudioResponse {
  success: boolean;
  audioPath: string;
  signedUrl?: string;
  duration: number;
  audioMetrics: AudioMetrics;
  narratorConfig: {
    gender: ActorGender;
    model: AudioModel;
    configVersion: number;
    actorId: string;
  };
  versionInfo: {
    version: number;
    isNewVersion: boolean;
    wasUpdated: boolean;
  };
  sceneId: number;
  prompt: string;
  unifiedVersioning: true;
  processingMethod: string;
}

/**
 * Parameters for processing foley audio
 */
export interface ProcessFoleyAudioParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  foleyId: number;
  options?: BaseAudioProcessingOptions;
}

/**
 * Response for processing foley audio
 */
export interface ProcessFoleyAudioResponse {
  success: boolean;
  audioPath: string;
  signedUrl?: string;
  duration: number;
  audioMetrics: AudioMetrics;
  model: string;
  versionInfo: {
    version: number;
    isNewVersion: boolean;
    wasUpdated: boolean;
  };
  sceneId: number;
  foleyId: number;
  prompt: string;
  unifiedVersioning: true;
  processingMethod: string;
}

/**
 * Parameters for processing room tone audio
 */
export interface ProcessRoomToneAudioParams {
  roomToneId: number;
  scriptId: string;
  versionId: string;
  sceneId: number;
  options?: BaseAudioProcessingOptions;
}

/**
 * Response for processing room tone audio
 */
export interface ProcessRoomToneAudioResponse {
  success: boolean;
  audioPath: string;
  signedUrl?: string;
  duration: number;
  audioMetrics: AudioMetrics;
  model: string;
  versionInfo: {
    version: number;
    isNewVersion: boolean;
    wasUpdated: boolean;
  };
  sceneId: number;
  prompt: string;
  unifiedVersioning: true;
  processingMethod: string;
}

/**
 * Parameters for processing music audio
 */
export interface ProcessMusicAudioParams {
  musicId: number;
  scriptId: string;
  versionId: string;
  sceneId: number;
  options?: BaseAudioProcessingOptions;
}

/**
 * Response for processing music audio
 */
export interface ProcessMusicAudioResponse {
  success: boolean;
  audioPath: string;
  signedUrl?: string;
  duration: number;
  audioMetrics: AudioMetrics;
  model: string;
  versionInfo: {
    version: number;
    isNewVersion: boolean;
    wasUpdated: boolean;
  };
  sceneId: number;
  prompt: string;
  unifiedVersioning: true;
  processingMethod: string;
}

// =============================================================================
// PROMPT MANAGEMENT TYPES
// =============================================================================

/**
 * Parameters for editing dialogue prompt
 */
export interface EditDialoguePromptParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  dialogueId: number;
  newPrompt: string;
  generateAudio?: boolean;
  modelTier?: ModelTier;
}

/**
 * Parameters for editing scene summary prompt
 */
export interface EditSceneSummaryPromptParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  newPrompt: string;
  generateAudio?: boolean;
  modelTier?: ModelTier;
}

/**
 * Parameters for editing foley prompt
 */
export interface EditFoleyPromptParams {
  scriptId: string;
  versionId: string;
  sceneId: number;
  foleyId: number;
  newPrompt: string;
  generateAudio?: boolean;
  modelTier?: ModelTier;
}

/**
 * Parameters for editing room tone prompt
 */
export interface EditRoomTonePromptParams {
  roomToneId: number;
  scriptId: string;
  versionId: string;
  sceneId: number;
  newPrompt: string;
  generateAudio?: boolean;
  modelTier?: ModelTier;
}

/**
 * Parameters for editing music prompt
 */
export interface EditMusicPromptParams {
  musicId: number;
  scriptId: string;
  versionId: string;
  sceneId: number;
  newPrompt: string;
  generateAudio?: boolean;
  modelTier?: ModelTier;
}

/**
 * Response for editing audio prompt
 */
export interface EditAudioPromptResponse {
  success: boolean;
  message: string;
  promptUpdated: boolean;
  audioGenerated: boolean;
  sceneId: number;
  dialogueId?: number;
  foleyId?: number;
  actorId?: string;
  newPrompt: string;
  previousPrompt?: string;
  versionInfo: {
    version: number;
    isNewVersion: boolean;
    hasAudio: boolean;
    isDraft: boolean;
  };
  unifiedVersioning: true;
  promptMethod: string;
}

// =============================================================================
// VERSION MANAGEMENT TYPES
// =============================================================================

/**
 * Response for getting all audio versions
 */
export interface GetAudioVersionsResponse {
  success: boolean;
  totalVersions: number;
  currentVersion: number;
  versions: {
    current: UnifiedAudioVersion;
    archived: Record<number, UnifiedAudioVersion>;
  };
  totalEdits: number;
  audioType: AudioType;
  summary: {
    versionsWithAudio: number;
    draftsOnly: number;
    totalDuration: number;
  };
  unifiedVersioning: true;
  versionsMethod?: string;
  historyMethod?: string;
}

/**
 * Parameters for restoring audio version
 */
export interface RestoreAudioVersionParams {
  musicId: number;
  roomToneId: number;
  scriptId: string;
  versionId: string;
  audioType: AudioType;
  sceneId: number;
  dialogueId?: number;
  foleyId?: number;
  targetVersion: number;
}

/**
 * Response for restoring audio version
 */
export interface RestoreAudioVersionResponse {
  success: boolean;
  restoredVersion: number;
  newCurrentVersion: number;
  restoredPrompt: string;
  restoredAudioGenerated: boolean;
  restoredPath: string;
  audioType: AudioType;
  identifiers: {
    sceneId: number;
    dialogueId?: number;
    foleyId?: number;
  };
  unifiedVersioning: true;
  restoreMethod: string;
}

// =============================================================================
// DATA RETRIEVAL TYPES
// =============================================================================

/**
 * Parameters for fetching audio data
 */
export interface FetchAudioDataParams {
  scriptId: string;
  versionId: string;
  audioTypes?: AudioType[];
  includeActions?: boolean;
}

/**
 * Enhanced audio statistics
 */
export interface AudioStatistics {
  totalDialogues: number;
  totalSceneSummaries: number;
  totalFoley: number;
  totalRoomTones: number;
  totalMusic: number;
  totalAudioFiles: number;
  totalVersions: number;
  totalEdits: number;
  withAudio: number;
  draftsOnly: number;
  totalDuration: number;
}

/**
 * Audio data summary
 */
export interface AudioDataSummary {
  totalItems: number;
  totalVersions: number;
  totalEdits: number;
  withAudio: number;
  draftsOnly: number;
  totalDuration: number;
}

/**
 * Audio prompts data
 */
export interface AudioPromptsData {
  dialogues: Array<{ sceneId: number; dialogueId: number; prompt: string }>;
  sceneSummaries: Array<{ sceneId: number; prompt: string }>;
  foley: Array<{ sceneId: number; foleyId: number; prompt: string }>;
  roomTones: Array<{ sceneId: number; prompt: string }>;
  music: Array<{ sceneId: number; prompt: string }>;
}

/**
 * Response for fetching all audio data
 */
export interface FetchAllAudioDataResponse {
  success: boolean;
  audioData: {
    dialogues: UnifiedAudioItem[];
    sceneSummaries: UnifiedAudioItem[];
    foley: UnifiedAudioItem[];
    roomTones: UnifiedAudioItem[];
    music: UnifiedAudioItem[];
  };
  statistics: AudioStatistics;
  summary: AudioDataSummary;
  unifiedVersioning: true;
  dataMethod: string;
  promptMethod?: string;
  prompts?: AudioPromptsData;
}

/**
 * Audio playlist item
 */
export interface AudioPlaylistItem {
  id: string;
  audioType: AudioType;
  sceneId: number;
  title: string;

  // Audio data
  url?: string | null;
  destinationPath: string;
  duration: number;

  // Version and status
  currentVersion: number;
  totalVersions: number;
  audioGenerated: boolean;
  hasAudio: boolean;
  isDraft: boolean;
  status: AudioStatus;

  // Content and metadata
  prompt: string;
  createdAt: string;
  completedAt?: string | null;
  lastEditedAt?: string;

  // Audio configuration
  model?: AudioModel;

  // Action info
  lastAction?: AudioAction | null;

  // Type-specific metadata
  dialogueId?: number;
  actorId?: string;
  actorConfigVersion?: number;
  narratorId?: string;
  foleyId?: number;
}

/**
 * Playlist options
 */
export interface PlaylistOptions {
  includeDialogues?: boolean;
  includeSceneSummaries?: boolean;
  includeFoley?: boolean;
  includeRoomTones?: boolean;
  includeMusic?: boolean;
  sortBy?: string;
  filterByScenes?: number[];
  onlyWithAudio?: boolean;
  includeDrafts?: boolean;
}

/**
 * Response for getting audio playlist
 */
export interface GetAudioPlaylistResponse {
  success: boolean;
  playlist: AudioPlaylistItem[];
  statistics: {
    totalTracks: number;
    totalDuration: number;
    withAudio: number;
    draftsOnly: number;
    totalVersions: number;
    byType: Record<string, {
      count: number;
      duration: number;
      withAudio: number;
      drafts: number;
    }>;
  };
  playlistOptions: PlaylistOptions;
  unifiedVersioning: true;
  playlistMethod: string;
}

// =============================================================================
// BATCH PROCESSING TYPES
// =============================================================================

/**
 * Batch processing options
 */
export interface BatchProcessingOptions {
  audioTypes?: AudioType[];
  sceneIds?: number[];
  forceRegenerate?: boolean;
  batchSize?: number;
  includeDialogues?: boolean;
  includeSceneSummaries?: boolean;
  includeFoley?: boolean;
  includeRoomTones?: boolean;
  includeMusic?: boolean;
  onlyMissing?: boolean;
  overrideExisting?: boolean;
  regenerateAll?: boolean;
}

/**
 * Pipeline configuration
 */
export interface PipelineConfig {
  steps: string[];
  options?: Record<string, unknown>;
  parallelization?: boolean;
  errorHandling?: 'continue' | 'stop';
}

/**
 * Parameters for batch audio processing
 */
export interface BatchProcessAudioParams {
  scriptId: string;
  versionId: string;
  options?: BatchProcessingOptions;
  pipeline?: PipelineConfig;
  sceneIds?: number[];
}

/**
 * Batch processing statistics
 */
export interface BatchProcessingStatistics {
  totalItems: number;
  totalSuccessful: number;
  totalFailed: number;
  successRate: number;
  byType: Record<string, {
    total: number;
    successful: number;
    failed: number;
  }>;
  processingTime: number;
  errors: Array<{
    audioType: AudioType;
    sceneId: number;
    error: string;
  }>;
}

/**
 * Credit reconciliation data
 */
export interface CreditReconciliation {
  totalCreditsUsed: number;
  creditsByType: Record<string, number>;
  reservationId?: string;
  timestamp: string;
}

/**
 * Processing results data
 */
export interface ProcessingResultsData {
  completed: number;
  failed: number;
  skipped: number;
  totalTime: number;
  averageTime: number;
}

/**
 * Batch processing result
 */
export interface BatchProcessingResult {
  success: boolean;
  statistics: BatchProcessingStatistics;
  results: {
    successful: Array<{
      audioType: AudioType;
      sceneId: number;
      dialogueId?: number;
      foleyId?: number;
      success: boolean;
      audioPath?: string;
      duration?: number;
      audioMetrics?: AudioMetrics;
      actorId?: string;
      shotId?: number;
      processingTime?: number;
    }>;
    failed: Array<{
      audioType: AudioType;
      sceneId: number;
      dialogueId?: number;
      foleyId?: number;
      success: boolean;
      error: string;
      processingTime?: number;
    }>;
  };
  creditReconciliation?: CreditReconciliation;
  processingTime: number;
  reservationId?: string;
  processingResults?: ProcessingResultsData;
  unifiedVersioning: true;
  processingMethod?: string;
  regenerationMethod?: string;
}

// =============================================================================
// ANALYTICS AND STATUS TYPES
// =============================================================================

/**
 * Audio type status
 */
export interface AudioTypeStatus {
  expected: number;
  created: number;
  withAudio: number;
  draftsOnly: number;
  percentage: number;
  audioPercentage: number;
  totalVersions: number;
  totalEdits: number;
}

/**
 * Status summary
 */
export interface StatusSummary {
  totalExpected: number;
  totalCreated: number;
  totalWithAudio: number;
  totalDrafts: number;
  overallPercentage: number;
  audioPercentage: number;
}

/**
 * Audio processing status
 */
export interface AudioProcessingStatus {
  success: boolean;
  status: Record<string, AudioTypeStatus>;
  overall: AudioTypeStatus;
  isComplete: boolean;
  isAudioComplete: boolean;
  summary: StatusSummary;
  unifiedVersioning: true;
  statusMethod: string;
}

/**
 * Audio type analytics
 */
export interface AudioTypeAnalytics {
  count: number;
  duration: number;
  versions: number;
  edits: number;
  withAudio: number;
  drafts: number;
  models: Record<string, number>;
  averageVersions: number;
  averageEdits: number;
}

/**
 * Scene analytics
 */
export interface SceneAnalytics {
  count: number;
  duration: number;
  versions: number;
  edits: number;
  withAudio: number;
  drafts: number;
  types: Record<string, number>;
}

/**
 * Recent activity item
 */
export interface RecentActivityItem {
  audioType: AudioType;
  sceneId: number;
  identifiers: Record<string, unknown>;
  editedAt: string;
  edits: number;
  versions: number;
  status: AudioStatus;
  hasAudio: boolean;
  prompt: string;
}

/**
 * Timeline metrics
 */
export interface TimelineMetrics {
  oldestItem?: string | null;
  newestItem?: string | null;
  mostRecentEdit?: string | null;
  totalTimeSpan: number;
}

/**
 * Completion metrics
 */
export interface CompletionMetrics {
  overallPercentage: number;
  byType: Record<string, number>;
}

/**
 * Productivity metrics
 */
export interface ProductivityMetrics {
  itemsPerDay: number;
  editsPerDay: number;
  versionsPerDay: number;
  completionRate: number;
}

/**
 * Analytics summary
 */
export interface AnalyticsSummary {
  totalItems: number;
  totalDuration: number;
  totalVersions: number;
  totalEdits: number;
  completionRate: number;
}

/**
 * Audio analytics
 */
export interface AudioAnalytics {
  success: boolean;
  analytics: {
    // Basic metrics
    totalDuration: number;
    totalFiles: number;
    totalVersions: number;
    totalEdits: number;

    // Unified versioning metrics
    totalWithAudio: number;
    totalDrafts: number;
    averageVersionsPerItem: number;
    averageEditsPerItem: number;

    // Breakdown by type
    byType: Record<string, AudioTypeAnalytics>;

    // Breakdown by scene
    byScene: Record<string, SceneAnalytics>;

    // Model usage
    models: Record<string, number>;

    // Voice configuration usage
    voices: Record<string, number>;

    // Recent activity
    recentActivity: RecentActivityItem[];

    // Version distribution
    versionDistribution: Record<string, number>;

    // Status distribution
    statusDistribution: Record<string, number>;

    // Action type distribution
    actionTypes: Record<string, number>;

    // Timeline metrics
    timeline: TimelineMetrics;

    // Completion metrics
    completion: CompletionMetrics;

    // Productivity metrics
    productivity: ProductivityMetrics;
  };
  generatedAt: string;
  summary: AnalyticsSummary;
  unifiedVersioning: true;
  analyticsMethod: string;
}

// =============================================================================
// MIGRATION TYPES
// =============================================================================

/**
 * Migration status
 */
export type MigrationStatus = 'not_started' | 'needed' | 'not_needed' | 'in_progress' | 'completed' | 'failed';

/**
 * Migration statistics
 */
export interface MigrationStatistics {
  totalItems: number;
  migrated: number;
  failed: number;
  skipped: number;
  duration: number;
}

/**
 * Migration needs assessment
 */
export interface MigrationNeeds {
  itemsToMigrate: number;
  estimatedTime: number;
  estimatedCredits?: number;
}

/**
 * Migration results
 */
export interface MigrationResults {
  successful: Array<{ id: string; type: AudioType }>;
  failed: Array<{ id: string; type: AudioType; error: string }>;
  summary: {
    total: number;
    successful: number;
    failed: number;
  };
}

/**
 * Migration response
 */
export interface MigrationResponse {
  success: boolean;
  message?: string;
  status?: MigrationStatus;
  phase?: string | null;
  progress?: number;
  startedAt?: string | null;
  completedAt?: string | null;
  error?: string | null;
  statistics?: MigrationStatistics;
  migrationNeeds?: MigrationNeeds;
  results?: MigrationResults;
  phases?: string[];
}

// =============================================================================
// BASE TYPES
// =============================================================================

/**
 * Base API response
 */
export interface BaseAudioApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  unifiedVersioning?: true;
}