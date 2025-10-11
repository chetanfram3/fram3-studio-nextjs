import { auth } from '@/lib/firebase';
import {
  // Updated types for unified system
  AudioType,
  // AudioModel, // Unused - commented out
  // ActorGender, // Unused - commented out

  // Actor Configuration Types
  GetActorConfigParams,
  GetActorConfigResponse,
  UpdateActorConfigParams,
  UpdateActorConfigResponse,
  GetAllActorConfigsResponse,

  // Narrator Configuration Types
  UpdateNarratorConfigParams,
  UpdateNarratorConfigResponse,

  // Individual Processing Types
  ProcessDialogueAudioParams,
  ProcessDialogueAudioResponse,
  ProcessSceneSummaryAudioParams,
  ProcessSceneSummaryAudioResponse,
  ProcessFoleyAudioParams,
  ProcessFoleyAudioResponse,
  ProcessRoomToneAudioParams,
  ProcessRoomToneAudioResponse,
  ProcessMusicAudioParams,
  ProcessMusicAudioResponse,

  // Prompt Management Types
  EditDialoguePromptParams,
  EditSceneSummaryPromptParams,
  EditFoleyPromptParams,
  EditRoomTonePromptParams,
  EditMusicPromptParams,
  EditAudioPromptResponse,

  // Version Management Types
  GetAudioVersionsResponse,
  RestoreAudioVersionParams,
  RestoreAudioVersionResponse,

  // Data Retrieval Types
  FetchAudioDataParams,
  FetchAllAudioDataResponse,
  GetAudioPlaylistResponse,

  // Batch Processing Types
  BatchProcessAudioParams,
  BatchProcessingResult,

  // Analytics Types
  AudioProcessingStatus,
  AudioAnalytics,

  // Migration Types
  MigrationResponse,

  // Base Types
  BaseAudioApiResponse
} from '@/types/audio';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

/**
 * Get authentication token
 */
export async function getAuthToken(): Promise<string> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Authentication required');
  }
  return token;
}

/**
 * Enhanced API response handler with unified error handling
 */
async function handleApiResponse<T = unknown>(
  response: Response,
  defaultErrorMessage: string = 'API request failed'
): Promise<T> {
  const responseData = await response.json();

  if (!response.ok) {
    console.log('🔍 Unified Audio API Error Response:', {
      status: response.status,
      statusText: response.statusText,
      data: responseData,
      unifiedVersioning: responseData.unifiedVersioning || false
    });

    // Check if this is a credit error (status 402 with INSUFFICIENT_CREDITS code)
    if (response.status === 402 && responseData.error?.code === 'INSUFFICIENT_CREDITS') {
      console.log('💰 Credit error detected in unified system');

      // Create an error that mimics axios structure for compatibility
      const creditError = new Error(responseData.error.message || 'Insufficient credits');
      (creditError as Error & { response?: { status: number; data: unknown } }).response = {
        status: response.status,
        data: responseData
      };
      throw creditError;
    }

    // Handle other HTTP error codes with specific messages
    const errorMessage = responseData.error?.message ||
      responseData.error ||
      responseData.message ||
      defaultErrorMessage;

    throw new Error(errorMessage);
  }

  return responseData;
}

// =============================================================================
// ACTOR CONFIGURATION FUNCTIONS
// =============================================================================

/**
 * Get actor audio configuration (unified)
 */
export async function getActorAudioConfig(
  actorId: string,
  params: GetActorConfigParams
): Promise<GetActorConfigResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (params.currentModel) {
    queryParams.append('currentModel', params.currentModel);
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/actor-config/${params.scriptId}/${params.versionId}/${actorId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<GetActorConfigResponse>(
    response,
    'Failed to get actor audio configuration'
  );
}

/**
 * Update actor audio configuration (unified)
 */
export async function updateActorAudioConfig(
  actorId: string,
  params: UpdateActorConfigParams
): Promise<UpdateActorConfigResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/actor-config/${params.scriptId}/${params.versionId}/${actorId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newConfig: params.newConfig,
        regenerateAll: params.regenerateAll || false
      })
    }
  );

  return handleApiResponse<UpdateActorConfigResponse>(
    response,
    'Failed to update actor audio configuration'
  );
}

/**
 * Get all actor configurations (unified)
 */
export async function getAllActorConfigs(
  params: GetActorConfigParams
): Promise<GetAllActorConfigsResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/actor-configs/${params.scriptId}/${params.versionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<GetAllActorConfigsResponse>(
    response,
    'Failed to get all actor configurations'
  );
}

/**
 * Delete actor configuration (unified)
 */
export async function deleteActorConfig(
  actorId: string,
  params: GetActorConfigParams
): Promise<BaseAudioApiResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/actor-config/${params.scriptId}/${params.versionId}/${actorId}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<BaseAudioApiResponse>(
    response,
    'Failed to delete actor configuration'
  );
}

/**
 * Regenerate all audio for a specific actor (unified)
 */
export async function regenerateActorAudio(
  actorId: string,
  params: GetActorConfigParams & { options?: Record<string, unknown> }
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/regenerate-actor/${params.scriptId}/${params.versionId}/${actorId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: params.options || {}
      })
    }
  );

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to regenerate actor audio'
  );
}

// =============================================================================
// NARRATOR CONFIGURATION FUNCTIONS
// =============================================================================

/**
 * Get narrator audio configuration (unified)
 */
export async function getNarratorAudioConfig(
  params: GetActorConfigParams
): Promise<GetActorConfigResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (params.currentModel) {
    queryParams.append('currentModel', params.currentModel);
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/narrator-config/${params.scriptId}/${params.versionId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<GetActorConfigResponse>(
    response,
    'Failed to get narrator audio configuration'
  );
}

/**
 * Update narrator audio configuration (unified)
 */
export async function updateNarratorAudioConfig(
  params: UpdateNarratorConfigParams
): Promise<UpdateNarratorConfigResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/narrator-config/${params.scriptId}/${params.versionId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newConfig: params.newConfig,
        regenerateAll: params.regenerateAll || false
      })
    }
  );

  return handleApiResponse<UpdateNarratorConfigResponse>(
    response,
    'Failed to update narrator audio configuration'
  );
}

/**
 * Regenerate all narrator audio (unified)
 */
export async function regenerateNarratorAudio(
  params: GetActorConfigParams & { options?: Record<string, unknown> }
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/regenerate-narrator/${params.scriptId}/${params.versionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options: params.options || {}
      })
    }
  );

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to regenerate narrator audio'
  );
}

// =============================================================================
// INDIVIDUAL AUDIO PROCESSING FUNCTIONS
// =============================================================================

/**
 * Process individual dialogue audio (unified)
 */
export async function processDialogueAudio(
  params: ProcessDialogueAudioParams
): Promise<ProcessDialogueAudioResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/process-dialogue`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      sceneId: params.sceneId,
      dialogueId: params.dialogueId,
      options: params.options || {}
    })
  });

  return handleApiResponse<ProcessDialogueAudioResponse>(
    response,
    'Failed to process dialogue audio'
  );
}

/**
 * Process individual scene summary audio (unified)
 */
export async function processSceneSummaryAudio(
  params: ProcessSceneSummaryAudioParams
): Promise<ProcessSceneSummaryAudioResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/process-scene-summary`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      sceneId: params.sceneId,
      options: params.options || {}
    })
  });

  return handleApiResponse<ProcessSceneSummaryAudioResponse>(
    response,
    'Failed to process scene summary audio'
  );
}

/**
 * Process individual foley audio (unified)
 */
export async function processFoleyAudio(
  params: ProcessFoleyAudioParams
): Promise<ProcessFoleyAudioResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/process-foley`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      sceneId: params.sceneId,
      foleyId: params.foleyId,
      options: params.options || {}
    })
  });

  return handleApiResponse<ProcessFoleyAudioResponse>(
    response,
    'Failed to process foley audio'
  );
}

/**
 * Process individual room tone audio (unified)
 */
export async function processRoomToneAudio(
  params: ProcessRoomToneAudioParams
): Promise<ProcessRoomToneAudioResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/process-room-tone`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      sceneId: params.sceneId,
      roomToneId: params.roomToneId,
      options: params.options || {}
    })
  });

  return handleApiResponse<ProcessRoomToneAudioResponse>(
    response,
    'Failed to process room tone audio'
  );
}

/**
 * Process individual music audio (unified)
 */
export async function processMusicAudio(
  params: ProcessMusicAudioParams
): Promise<ProcessMusicAudioResponse> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/process-music`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      sceneId: params.sceneId,
      musicId: params.musicId,
      options: params.options || {}
    })
  });

  return handleApiResponse<ProcessMusicAudioResponse>(
    response,
    'Failed to process music audio'
  );
}

// =============================================================================
// BATCH PROCESSING FUNCTIONS
// =============================================================================

/**
 * Main batch audio processing (unified)
 */
export async function batchProcessAudio(
  params: BatchProcessAudioParams
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/batch-process`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      options: params.options || {},
      pipeline: params.pipeline
    })
  });

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to batch process audio'
  );
}

/**
 * Process all dialogues (unified)
 */
export async function batchProcessDialogues(
  params: BatchProcessAudioParams
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/batch-process/dialogues`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      options: params.options || {},
      pipeline: params.pipeline
    })
  });

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to batch process dialogues'
  );
}

/**
 * Process all scene summaries (unified)
 */
export async function batchProcessSceneSummaries(
  params: BatchProcessAudioParams
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/batch-process/scene-summaries`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      options: params.options || {},
      pipeline: params.pipeline
    })
  });

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to batch process scene summaries'
  );
}

/**
 * Process all ambient audio (unified)
 */
export async function batchProcessAmbientAudio(
  params: BatchProcessAudioParams
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/batch-process/ambient`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      options: params.options || {},
      pipeline: params.pipeline
    })
  });

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to batch process ambient audio'
  );
}

/**
 * Process specific scenes (unified)
 */
export async function batchProcessScenes(
  params: BatchProcessAudioParams & { sceneIds: number[] }
): Promise<BatchProcessingResult> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/batch-process/scenes`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      scriptId: params.scriptId,
      versionId: params.versionId,
      sceneIds: params.sceneIds,
      options: params.options || {},
      pipeline: params.pipeline
    })
  });

  return handleApiResponse<BatchProcessingResult>(
    response,
    'Failed to batch process scenes'
  );
}

// =============================================================================
// PROMPT MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Edit dialogue audio prompt (unified)
 */
export async function editDialogueAudioPrompt(
  params: EditDialoguePromptParams
): Promise<EditAudioPromptResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/prompt/dialogue/${params.scriptId}/${params.versionId}/${params.sceneId}/${params.dialogueId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPrompt: params.newPrompt,
        generateAudio: params.generateAudio || false,
        modelTier: params.modelTier
      })
    }
  );

  return handleApiResponse<EditAudioPromptResponse>(
    response,
    'Failed to edit dialogue audio prompt'
  );
}

/**
 * Edit scene summary audio prompt (unified)
 */
export async function editSceneSummaryAudioPrompt(
  params: EditSceneSummaryPromptParams
): Promise<EditAudioPromptResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/prompt/scene-summary/${params.scriptId}/${params.versionId}/${params.sceneId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPrompt: params.newPrompt,
        generateAudio: params.generateAudio || false,
        modelTier: params.modelTier
      })
    }
  );

  return handleApiResponse<EditAudioPromptResponse>(
    response,
    'Failed to edit scene summary audio prompt'
  );
}

/**
 * Edit foley audio prompt (unified)
 */
export async function editFoleyAudioPrompt(
  params: EditFoleyPromptParams
): Promise<EditAudioPromptResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/prompt/foley/${params.scriptId}/${params.versionId}/${params.sceneId}/${params.foleyId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPrompt: params.newPrompt,
        generateAudio: params.generateAudio || false,
        modelTier: params.modelTier
      })
    }
  );

  return handleApiResponse<EditAudioPromptResponse>(
    response,
    'Failed to edit foley audio prompt'
  );
}

/**
 * Edit room tone audio prompt (unified)
 */
export async function editRoomToneAudioPrompt(
  params: EditRoomTonePromptParams
): Promise<EditAudioPromptResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/prompt/room-tone/${params.scriptId}/${params.versionId}/${params.sceneId}/${params.roomToneId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPrompt: params.newPrompt,
        generateAudio: params.generateAudio || false,
        modelTier: params.modelTier
      })
    }
  );

  return handleApiResponse<EditAudioPromptResponse>(
    response,
    'Failed to edit room tone audio prompt'
  );
}

/**
 * Edit music audio prompt (unified)
 */
export async function editMusicAudioPrompt(
  params: EditMusicPromptParams
): Promise<EditAudioPromptResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/prompt/music/${params.scriptId}/${params.versionId}/${params.sceneId}/${params.musicId}`,
    {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        newPrompt: params.newPrompt,
        generateAudio: params.generateAudio || false,
        modelTier: params.modelTier
      })
    }
  );

  return handleApiResponse<EditAudioPromptResponse>(
    response,
    'Failed to edit music audio prompt'
  );
}

/**
 * Get unified prompt history (replaces individual prompt history functions)
 */
export async function getPromptHistory(
  scriptId: string,
  versionId: string,
  audioType: AudioType,
  sceneId: number,
  identifier?: number // dialogueId or foleyId depending on type
): Promise<GetAudioVersionsResponse> {
  const token = await getAuthToken();

  // For types that don't need identifier, use 0 as placeholder
  const identifierParam = identifier ?? 0;

  const response = await fetch(
    `${API_BASE_URL}/audio/prompt/history/${audioType}/${scriptId}/${versionId}/${sceneId}/${identifierParam}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<GetAudioVersionsResponse>(
    response,
    'Failed to get prompt history'
  );
}

/**
 * Get all audio prompts for a script version (unified)
 */
export async function getAllAudioPrompts(
  scriptId: string,
  versionId: string
): Promise<FetchAllAudioDataResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/prompts/${scriptId}/${versionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<FetchAllAudioDataResponse>(
    response,
    'Failed to get all audio prompts'
  );
}

// =============================================================================
// VERSION MANAGEMENT FUNCTIONS
// =============================================================================

/**
 * Get all versions of an audio item (unified)
 */
export async function getAudioVersions(
  scriptId: string,
  versionId: string,
  audioType: AudioType,
  sceneId: number,
  dialogueId?: number,
  foleyId?: number,
  roomToneId?: number,
  musicId?: number
): Promise<GetAudioVersionsResponse> {
  const token = await getAuthToken();

  // For types that don't need identifier, use 0 as placeholder
  let identifier = 0;
  if (audioType === 'dialogue' && dialogueId !== undefined) {
    identifier = dialogueId;
  } else if (audioType === 'foley' && foleyId !== undefined) {
    identifier = foleyId;
  } else if (audioType === 'roomTone' && roomToneId !== undefined) {
    identifier = roomToneId;
  } else if (audioType === 'music' && musicId !== undefined) {
    identifier = musicId;
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/versions/${audioType}/${scriptId}/${versionId}/${sceneId}/${identifier}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<GetAudioVersionsResponse>(
    response,
    'Failed to get audio versions'
  );
}

/**
 * Restore a specific version as current (unified)
 */
export async function restoreAudioVersion(
  params: RestoreAudioVersionParams
): Promise<RestoreAudioVersionResponse> {
  const token = await getAuthToken();

  // FIXED: Include all audio type identifiers
  const identifier = params.dialogueId ?? params.foleyId ?? params.roomToneId ?? params.musicId ?? 0;

  const response = await fetch(
    `${API_BASE_URL}/audio/versions/restore/${params.audioType}/${params.scriptId}/${params.versionId}/${params.sceneId}/${identifier}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        targetVersion: params.targetVersion
      })
    }
  );

  return handleApiResponse<RestoreAudioVersionResponse>(
    response,
    'Failed to restore audio version'
  );
}

/**
 * Generate signed URLs for multiple versions (unified)
 */
export async function generateAudioVersionSignedUrls(
  scriptId: string,
  versionId: string,
  audioType: AudioType,
  sceneId: number,
  versionNumbers: number[] = [],
  dialogueId?: number,
  foleyId?: number
): Promise<{
  success: boolean;
  signedUrls: Record<number, {
    version: number;
    url: string;
    isCurrent: boolean;
    duration?: number;
  }>;
  audioType: AudioType;
  identifiers: unknown;
  unifiedVersioning: true;
  urlMethod: string;
}> {
  const token = await getAuthToken();

  // For types that don't need identifier, use 0 as placeholder
  const identifier = dialogueId ?? foleyId ?? 0;

  const response = await fetch(
    `${API_BASE_URL}/audio/versions/signed-urls/${audioType}/${scriptId}/${versionId}/${sceneId}/${identifier}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        versionNumbers
      })
    }
  );

  return handleApiResponse(response, 'Failed to generate signed URLs');
}

// =============================================================================
// DATA RETRIEVAL FUNCTIONS
// =============================================================================

/**
 * Fetch individual audio data (unified)
 */
export async function fetchIndividualAudioData(
  scriptId: string,
  versionId: string,
  audioType: AudioType,
  sceneId: number,
  identifier?: number, // dialogueId or foleyId
  includeVersions: boolean = false,
  includeActions: boolean = false
): Promise<{
  success: boolean;
  exists: boolean;
  sceneId: number;
  dialogueId?: number;
  foleyId?: number;
  audioData?: unknown;
  unifiedVersioning: true;
  dataMethod: string;
}> {
  const token = await getAuthToken();

  // For types that don't need identifier, use 0 as placeholder
  const identifierParam = identifier ?? 0;

  const queryParams = new URLSearchParams();
  if (includeVersions) {
    queryParams.append('includeVersions', includeVersions.toString());
  }
  if (includeActions) {
    queryParams.append('includeActions', includeActions.toString());
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/data/${audioType}/${scriptId}/${versionId}/${sceneId}/${identifierParam}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse(response, 'Failed to fetch individual audio data');
}

/**
 * Fetch all audio data (unified)
 */
export async function fetchAllAudioData(
  params: FetchAudioDataParams
): Promise<FetchAllAudioDataResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();

  // Add audioTypes if specified
  if (params.audioTypes && params.audioTypes.length > 0) {
    queryParams.append('audioTypes', params.audioTypes.join(','));
  }

  // Add includeActions if specified
  if (params.includeActions !== undefined) {
    queryParams.append('includeActions', params.includeActions.toString());
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/data/all/${params.scriptId}/${params.versionId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<FetchAllAudioDataResponse>(
    response,
    'Failed to fetch all audio data'
  );
}

/**
 * Get audio playlist (unified)
 */
export async function getAudioPlaylist(
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
  } = {}
): Promise<GetAudioPlaylistResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();

  // Only add parameters that are explicitly set to avoid defaults
  if (options.includeDialogues !== undefined) {
    queryParams.append('includeDialogues', options.includeDialogues.toString());
  }
  if (options.includeSceneSummaries !== undefined) {
    queryParams.append('includeSceneSummaries', options.includeSceneSummaries.toString());
  }
  if (options.includeFoley !== undefined) {
    queryParams.append('includeFoley', options.includeFoley.toString());
  }
  if (options.includeRoomTones !== undefined) {
    queryParams.append('includeRoomTones', options.includeRoomTones.toString());
  }
  if (options.includeMusic !== undefined) {
    queryParams.append('includeMusic', options.includeMusic.toString());
  }
  if (options.sortBy) {
    queryParams.append('sortBy', options.sortBy);
  }
  if (options.onlyWithAudio !== undefined) {
    queryParams.append('onlyWithAudio', options.onlyWithAudio.toString());
  }
  if (options.includeDrafts !== undefined) {
    queryParams.append('includeDrafts', options.includeDrafts.toString());
  }

  if (options.filterByScenes && options.filterByScenes.length > 0) {
    queryParams.append('filterByScenes', options.filterByScenes.join(','));
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/playlist/${scriptId}/${versionId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<GetAudioPlaylistResponse>(
    response,
    'Failed to get audio playlist'
  );
}

/**
 * Get audio processing status (unified)
 */
export async function getAudioProcessingStatus(
  scriptId: string,
  versionId: string
): Promise<AudioProcessingStatus> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/status/${scriptId}/${versionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<AudioProcessingStatus>(
    response,
    'Failed to get audio processing status'
  );
}

/**
 * Get audio analytics (unified)
 */
export async function getAudioAnalytics(
  scriptId: string,
  versionId: string
): Promise<AudioAnalytics> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/analytics/${scriptId}/${versionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<AudioAnalytics>(
    response,
    'Failed to get audio analytics'
  );
}

/**
 * Get audio trends (unified)
 */
export async function getAudioTrends(
  scriptId: string,
  versionId: string,
  options: {
    timeframe?: string;
    groupBy?: string;
    audioTypes?: AudioType[];
  } = {}
): Promise<{
  success: boolean;
  trends: unknown;
  unifiedVersioning: true;
  trendsMethod: string;
}> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (options.timeframe) {
    queryParams.append('timeframe', options.timeframe);
  }
  if (options.groupBy) {
    queryParams.append('groupBy', options.groupBy);
  }
  if (options.audioTypes && options.audioTypes.length > 0) {
    queryParams.append('audioTypes', options.audioTypes.join(','));
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/trends/${scriptId}/${versionId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse(response, 'Failed to get audio trends');
}

/**
 * Get audio health score (unified)
 */
export async function getAudioHealthScore(
  scriptId: string,
  versionId: string
): Promise<{
  success: boolean;
  healthScore: {
    overall: number;
    level: string;
    components: Record<string, number>;
    recommendations: string[];
    weights: Record<string, number>;
    calculatedAt: string;
  };
  unifiedVersioning: true;
  healthMethod: string;
}> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/health-score/${scriptId}/${versionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse(response, 'Failed to get audio health score');
}

// =============================================================================
// MIGRATION FUNCTIONS
// =============================================================================

/**
 * Check migration status (unified)
 */
export async function checkAudioMigrationStatus(
  scriptId: string,
  versionId: string,
  migrationType: string = 'audioMigration'
): Promise<MigrationResponse> {
  const token = await getAuthToken();

  const queryParams = new URLSearchParams();
  if (migrationType !== 'audioMigration') {
    queryParams.append('migrationType', migrationType);
  }

  const response = await fetch(
    `${API_BASE_URL}/audio/migration/status/${scriptId}/${versionId}?${queryParams}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<MigrationResponse>(
    response,
    'Failed to check migration status'
  );
}

/**
 * Start migration (unified)
 */
export async function startAudioMigration(
  scriptId: string,
  versionId: string,
  options: Record<string, unknown> = {}
): Promise<MigrationResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/migration/start/${scriptId}/${versionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options
      })
    }
  );

  return handleApiResponse<MigrationResponse>(
    response,
    'Failed to start migration'
  );
}

/**
 * Complete migration (unified)
 */
export async function completeAudioMigration(
  scriptId: string,
  versionId: string,
  options: Record<string, unknown> = {}
): Promise<MigrationResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/migration/complete/${scriptId}/${versionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options
      })
    }
  );

  return handleApiResponse<MigrationResponse>(
    response,
    'Failed to complete migration'
  );
}

/**
 * Rollback migration (unified)
 */
export async function rollbackAudioMigration(
  scriptId: string,
  versionId: string,
  options: Record<string, unknown> = {}
): Promise<MigrationResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/migration/rollback/${scriptId}/${versionId}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        options
      })
    }
  );

  return handleApiResponse<MigrationResponse>(
    response,
    'Failed to rollback migration'
  );
}

/**
 * Validate migration (unified)
 */
export async function validateAudioMigration(
  scriptId: string,
  versionId: string
): Promise<MigrationResponse> {
  const token = await getAuthToken();

  const response = await fetch(
    `${API_BASE_URL}/audio/migration/validate/${scriptId}/${versionId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse<MigrationResponse>(
    response,
    'Failed to validate migration'
  );
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Check if script has processed audio (unified)
 */
export async function hasProcessedAudio(
  scriptId: string,
  versionId: string
): Promise<boolean> {
  try {
    const response = await fetchAllAudioData({
      scriptId,
      versionId,
      includeActions: false
    });

    return response.success &&
      response.audioData &&
      (
        response.audioData.dialogues.length > 0 ||
        response.audioData.sceneSummaries.length > 0 ||
        response.audioData.foley.length > 0 ||
        response.audioData.roomTones.length > 0 ||
        response.audioData.music.length > 0
      );
  } catch (error) {
    console.error('Error checking for processed audio:', error);
    return false;
  }
}

/**
 * Get health check status for unified audio API
 */
export async function getAudioHealthCheck(): Promise<{
  success: boolean;
  message: string;
  services: Record<string, string>;
  timestamp: string;
  version: string;
  unifiedVersioning: true;
  systemStatus: {
    legacyCompatibility: string;
    migrationReady: boolean;
    dataIntegrity: string;
    performanceOptimized: boolean;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/audio/health`);
  return handleApiResponse(response, 'Failed to get audio health check');
}

/**
 * Get unified audio types configuration
 */
export async function getAudioTypesConfig(): Promise<{
  success: boolean;
  audioTypes: Record<string, string>;
  timestamp: string;
  unifiedVersioning: true;
  versioningFeatures: {
    draftSupport: boolean;
    versionHistory: boolean;
    actionTracking: boolean;
    statusIndicators: string[];
    promptAndAudioUnified: boolean;
  };
}> {
  const response = await fetch(`${API_BASE_URL}/audio/config/audio-types`);
  return handleApiResponse(response, 'Failed to get audio types config');
}

/**
 * Get unified system information
 */
export async function getAudioSystemInfo(): Promise<{
  success: boolean;
  systemInfo: {
    unifiedVersioning: {
      enabled: boolean;
      version: string;
      features: string[];
    };
    collections: {
      structure: string;
      audioTypes: string[];
      versionStates: string[];
      actionTypes: string[];
    };
    capabilities: {
      batchProcessing: boolean;
      individualProcessing: boolean;
      promptEditing: boolean;
      versionManagement: boolean;
      analytics: boolean;
      migration: boolean;
      healthScoring: boolean;
      trendAnalysis: boolean;
    };
    compatibility: {
      legacyAPI: boolean;
      backwardCompatible: boolean;
      migrationRequired: boolean;
    };
  };
  timestamp: string;
  unifiedVersioning: true;
}> {
  const token = await getAuthToken();

  const response = await fetch(`${API_BASE_URL}/audio/config/system-info`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  return handleApiResponse(response, 'Failed to get system info');
}

/**
 * Debug route - Get raw unified data structure (development only)
 */
export async function getAudioDebugData(
  scriptId: string,
  versionId: string,
  audioType: AudioType,
  sceneId: number,
  identifier?: number
): Promise<{
  success: boolean;
  rawData: unknown;
  metadata: {
    audioType: AudioType;
    identifiers: unknown;
    dataStructure: string;
    debugMode: boolean;
  };
  timestamp: string;
  unifiedVersioning: true;
}> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Debug endpoints not available in production');
  }

  const token = await getAuthToken();

  // For types that don't need identifier, use 0 as placeholder
  const identifierParam = identifier ?? 0;

  const response = await fetch(
    `${API_BASE_URL}/audio/debug/raw-data/${audioType}/${scriptId}/${versionId}/${sceneId}/${identifierParam}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    }
  );

  return handleApiResponse(response, 'Failed to get debug data');
}

// =============================================================================
// BACKWARDS COMPATIBILITY FUNCTIONS (Legacy Support)
// =============================================================================

/**
 * Legacy function names for backwards compatibility
 * These delegate to the new unified functions
 */

// Actor Configuration (Legacy)
export const getActorDialogues = (actorId: string, params: GetActorConfigParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['dialogue'] });

export const getSceneSummaries = (params: GetActorConfigParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['sceneSummary'] });

export const regenerateActorDialogues = regenerateActorAudio;
export const regenerateSceneSummaries = regenerateNarratorAudio;

// Prompt History (Legacy)
export const getDialoguePromptHistory = (scriptId: string, versionId: string, sceneId: number, dialogueId: number) =>
  getPromptHistory(scriptId, versionId, 'dialogue', sceneId, dialogueId);

export const getSceneSummaryPromptHistory = (scriptId: string, versionId: string, sceneId: number) =>
  getPromptHistory(scriptId, versionId, 'sceneSummary', sceneId);

export const getFoleyPromptHistory = (scriptId: string, versionId: string, sceneId: number, foleyId: number) =>
  getPromptHistory(scriptId, versionId, 'foley', sceneId, foleyId);

export const getRoomTonePromptHistory = (scriptId: string, versionId: string, sceneId: number) =>
  getPromptHistory(scriptId, versionId, 'roomTone', sceneId);

export const getMusicPromptHistory = (scriptId: string, versionId: string, sceneId: number) =>
  getPromptHistory(scriptId, versionId, 'music', sceneId);

// Data Retrieval (Legacy)
export const fetchDialogueAudioData = (params: FetchAudioDataParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['dialogue'] });

export const fetchSceneSummaryAudioData = (params: FetchAudioDataParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['sceneSummary'] });

export const fetchFoleyAudioData = (params: FetchAudioDataParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['foley'] });

export const fetchRoomToneAudioData = (params: FetchAudioDataParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['roomTone'] });

export const fetchMusicAudioData = (params: FetchAudioDataParams) =>
  fetchAllAudioData({ ...params, audioTypes: ['music'] });

// Version Comparison (Legacy placeholder)
export const compareAudioVersions = async (params: {
  scriptId: string;
  versionId: string;
  type: AudioType;
  sceneId: number;
  dialogueId?: number;
  foleyId?: number;
}) => {
  console.warn('compareAudioVersions is deprecated in unified system. Use getAudioVersions instead.');
  return getAudioVersions(
    params.scriptId,
    params.versionId,
    params.type,
    params.sceneId,
    params.dialogueId,
    params.foleyId
  );
};