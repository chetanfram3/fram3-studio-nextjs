// src/types/image/types.ts

/**
 * Complete Image Data Types
 * Generated from /images/v1/complete-data endpoint response
 */

// Firestore Timestamp type
export interface FirestoreTimestamp {
    _seconds: number;
    _nanoseconds: number;
}

// Type union for timestamps (can be either Firestore object or ISO string)
export type Timestamp = FirestoreTimestamp | string;

// Image type enum
export type ImageType = "shots" | "actor" | "location" | "keyVisual" | "standalone";

// Generation type enum
export type GenerationType =
    | "text_to_image"
    | "flux_pro_kontext"
    | "nano_banana_edit"
    | "upscale_2x"
    | "batch_generation"
    | "manual_upload"
    | null;

// Edit type enum
export type EditType =
    | "text_to_image"
    | "flux_pro_kontext"
    | "nano_banana_edit"
    | "upscale_2x"
    | "version_restore"
    | "batch_generation";

// Identifiers based on image type
export interface ShotsIdentifiers {
    type: "shots";
    sceneId: number;
    shotId: number;
}

export interface ActorIdentifiers {
    type: "actor";
    actorId: number;
    actorVersionId: number;
}

export interface LocationIdentifiers {
    type: "location";
    locationId: number;
    locationVersionId: number;
    promptType: string;
}

export interface KeyVisualIdentifiers {
    type: "keyVisual";
}

export interface StandaloneIdentifiers {
    type: "standalone";
    // Standalone has NO required identifiers beyond type
    // assetId is used as scriptId in API calls
}

export type ImageIdentifiers =
    | ShotsIdentifiers
    | ActorIdentifiers
    | LocationIdentifiers
    | KeyVisualIdentifiers
    | StandaloneIdentifiers;

// Image Status
export interface ImageStatus {
    exists: boolean;
    status: string;
    currentVersion: number;
    totalVersions: number;
    totalEdits: number;
    createdAt: Timestamp;
    lastModifiedAt: Timestamp;
    lastEditedAt: Timestamp;
}

// Image Metadata structures
export interface ImageDimensions {
    width: number;
    height: number;
    format: string;
    size: number;
    hasAlpha: boolean;
    space: string;
    channels: number;
    depth: string;
    density: number;
    chromaSubsampling: string;
    isProgressive: boolean;
    aspectRatio?: string;
    realAspectRatio?: string;
    watermarked?: boolean;
}

export interface ProcessingMetadata {
    watermarkApplied: boolean;
    thumbnailGenerated: boolean;
    originalFileExtension: string;
    finalFileName: string;
    processedAt: string;
}

export interface ImageMetadata {
    original: ImageDimensions;
    processed: ImageDimensions;
    thumbnail: ImageDimensions;
    processing: ProcessingMetadata;
}

// Version Information
export interface CurrentVersion {
    version: number;
    destinationPath: string;
    thumbnailPath: string;
    signedUrl: string;
    imageMetadata: ImageMetadata | null;
    prompt: string | null;
    generationType: GenerationType;
    seed: number | null;
    aspectRatio: string | null;
    fineTuneId: string | null;
    modelTier?: number | null;
    isCurrent: true;
    lastEditedAt: Timestamp;
}

export interface ArchivedVersion {
    version: number;
    destinationPath: string;
    thumbnailPath: string;
    signedUrl: null;
    imageMetadata: ImageMetadata | null;
    prompt: string | null;
    generationType: GenerationType;
    seed: number | null;
    aspectRatio: string | null;
    fineTuneId: string | null;
    modelTier?: number | null;
    isCurrent: false;
    archivedAt: Timestamp;
}

export interface Versions {
    current: CurrentVersion;
    archived: {
        [versionNumber: number]: ArchivedVersion;
    };
}

// Image Analysis structures
export interface UsageMetadata {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    trafficType: string;
    promptTokensDetails: Array<{
        modality: string;
        tokenCount: number;
    }>;
    candidatesTokensDetails: Array<{
        modality: string;
        tokenCount: number;
    }>;
    thoughtsTokenCount: number;
}

export interface AnalysisMetadata {
    agent_version: string;
    analysis_timestamp: string;
    image_hash: string;
    processing_time_seconds: number;
    overall_confidence_score: number;
    warnings_or_issues: string[];
}

export interface Frame {
    aspect_ratio: string;
    confidence_score: number;
    camera_height: string;
    camera_height_units: string;
    inferred: boolean;
}

export interface Lighting {
    time_of_day: string;
    key_light_dir: string;
    tonality: string;
    back_light_dir: string;
    fill_light_dir: string;
}

export interface Composition {
    frame: Frame;
    lighting: Lighting;
    colour_palette_hex: string[];
    artistic_notes: string[];
}

export interface Region {
    country: string;
    state: string;
    city: string;
    neighborhood: string;
}

export interface Setting {
    timePeriod: string;
    region: Region;
    weather: string;
    season: string;
    timeOfDay: string;
    timePeriod_confidence?: number;
}

export interface Location {
    locationId: string;
    locationName: string;
    locationArchetype: string;
    setting: Setting;
    architecturalStyle: string;
    locationClass: string;
    locationType: string;
}

export interface ObjectState {
    condition: string;
    openClose: string;
}

export interface DetectedObject {
    objectId: string;
    objectName: string;
    label: string;
    description: string;
    state: ObjectState;
    confidence_score: number;
    bbox_px: number[];
    color: string;
    materials: string[];
    texture: string;
}

export interface Branding {
    brand_id: string;
    content: string;
    type: string;
    confidence_score: number;
    position_description: string;
}

export interface Relationship {
    subject_id: string;
    predicate: string;
    object_id: string;
    confidence_score: number;
}

export interface SceneGraph {
    relationships: Relationship[];
    complex_interactions_notes: string[];
}

export interface LightSource {
    type: string;
    intensity: string;
    confidence_score: number;
    direction: number[];
}

export interface TechnicalEstimates {
    camera_model: string;
    confidence_score: number;
    aperture: string;
    estimated_light_sources: LightSource[];
    iso: string;
    lens: string;
}

export interface SceneRealismAssessment {
    anomalies_or_conceptual_elements: unknown[];
    realism_level: string;
    is_ai_generated_estimation: boolean;
    ai_estimation_confidence: number;
    overall_assessment_notes: string;
}

export interface AnalysisData {
    actors: unknown[];
    analysis_metadata: AnalysisMetadata;
    composition: Composition;
    location: Location;
    objects: DetectedObject[];
    branding: Branding[];
    scene_graph: SceneGraph;
    technical_estimates: TechnicalEstimates;
    scene_realism_assessment: SceneRealismAssessment;
}

export interface ResponseMetadata {
    createTime: string;
    responseId: string;
    finishReason: string;
    safetyRatings: unknown | null;
}

export interface DetailedUsage {
    cacheTokensDetails: unknown[];
    promptTokensDetails: Array<{
        modality: string;
        tokenCount: number;
    }>;
    candidatesTokensDetails: Array<{
        modality: string;
        tokenCount: number;
    }>;
    thoughtsTokenCount: number;
    toolResponseTokenCount: number;
    trafficType: string;
}

export interface SchemaMetadata {
    schemaType: string;
    analysisType: string;
    hasSchema: boolean;
    autoDetected: boolean;
}

export interface ImageAnalysis {
    usageMetadata: UsageMetadata;
    data: AnalysisData;
    modelVersion: string;
    responseMetadata: ResponseMetadata;
    groundingMetadata: unknown | null;
    retrievalMetadata: unknown | null;
    detailedUsage: DetailedUsage;
    streamed: boolean;
    schemaMetadata: SchemaMetadata;
    analyzedAt: string;
    imageVersion: number;
}

export interface ImageAnalyses {
    [versionNumber: number]: ImageAnalysis;
}

// Edit History
export interface EditHistoryEntry {
    timestamp: Timestamp;
    fromVersion: number;
    toVersion: number;
    editType: EditType;
    previousPath: string;
    newPath: string;
    prompt: string | null;
    seed: number | null;
    restoredFromVersion?: number;
}

// Metadata
export interface ImageMetadataInfo {
    sceneId?: number;
    shotId?: number;
    actorId?: number;
    actorVersionId?: number;
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
    title?: string;                    // For standalone assets
    description?: string;              // For standalone assets
    imageCategory?: string;            // For standalone assets
    tags?: string[];                   // For standalone assets
    projectName?: string;              // For standalone assets
    notes?: string;                    // For standalone assets
    assetId?: string;                  // The unique asset ID for standalone
    lastPromptSavedAt: Timestamp | null;
    lastAnalyzedAt: Timestamp | null;
}

// Complete Image Data (main structure)
export interface CompleteImageData {
    success: boolean;
    type: ImageType;
    docId: string;
    identifiers: ImageIdentifiers;
    imageStatus: ImageStatus;
    versions: Versions;
    imageAnalyses: ImageAnalyses;
    editHistory: EditHistoryEntry[];
    metadata: ImageMetadataInfo;
}

// API Response wrapper
export interface CompleteImageDataResponse {
    message: string;
    success: boolean;
    data: CompleteImageData;
}

// Error response
export interface CompleteImageDataErrorResponse {
    message: string;
    success: false;
    error: string;
    type?: ImageType;
    docId?: string;
    identifiers?: ImageIdentifiers;
}

// Union type for all possible responses
export type CompleteImageDataApiResponse =
    | CompleteImageDataResponse
    | CompleteImageDataErrorResponse;

/**
 * Utility type guards
 */
export function isSuccessResponse(
    response: CompleteImageDataApiResponse
): response is CompleteImageDataResponse {
    return response.success === true;
}

export function isErrorResponse(
    response: CompleteImageDataApiResponse
): response is CompleteImageDataErrorResponse {
    return response.success === false;
}

export function isFirestoreTimestamp(
    timestamp: Timestamp
): timestamp is FirestoreTimestamp {
    return (
        typeof timestamp === "object" &&
        timestamp !== null &&
        "_seconds" in timestamp &&
        "_nanoseconds" in timestamp
    );
}

/**
 * Utility function to convert Firestore timestamp to Date
 */
export function convertFirestoreTimestamp(timestamp: Timestamp): Date {
    if (isFirestoreTimestamp(timestamp)) {
        return new Date(timestamp._seconds * 1000);
    }
    return new Date(timestamp);
}

/**
 * Utility function to convert Firestore timestamp to ISO string
 */
export function timestampToISO(timestamp: Timestamp): string {
    return convertFirestoreTimestamp(timestamp).toISOString();
}

export type ManualAddAspectRatio = '16:9' | '9:16' | '1:1';

export interface BaseManualAddRequest {
    scriptId: string;
    versionId: string;
    prompt: string;
    imageUrl: string;
    aspectRatio?: ManualAddAspectRatio; // Default: "16:9"
}

export interface StandaloneInitData {
    title: string;
    description?: string;
    imageCategory?: string;
    tags?: string[];
    projectName?: string;
    notes?: string;
}

export interface ShotsManualAddRequest extends BaseManualAddRequest, ShotsIdentifiers { }

export interface ActorManualAddRequest extends BaseManualAddRequest, ActorIdentifiers { }

export interface LocationManualAddRequest extends BaseManualAddRequest, LocationIdentifiers { }

export interface KeyVisualManualAddRequest extends BaseManualAddRequest, KeyVisualIdentifiers { }

export interface StandaloneManualAddInitRequest {
    type: "standalone";
    // NO scriptId for initialization
    // NO versionId ever for standalone
    initData: StandaloneInitData;      // REQUIRED for initialization
    prompt: string;
    imageUrl: string;
    aspectRatio?: ManualAddAspectRatio;
}

// For adding to EXISTING standalone asset
export interface StandaloneManualAddRequest extends BaseManualAddRequest {
    type: "standalone";
    // scriptId is actually the assetId (required in BaseManualAddRequest)
    // NO versionId ever for standalone
    // NO initData for existing assets
}

export type ManualAddImageRequest =
    | ShotsManualAddRequest
    | ActorManualAddRequest
    | LocationManualAddRequest
    | KeyVisualManualAddRequest
    | StandaloneManualAddInitRequest
    | StandaloneManualAddRequest;

// ============================================
// MANUAL ADD RESPONSE TYPES
// ============================================

export interface ManualAddImageSuccessData {
    newCurrentImagePath: string;
    newThumbnailPath: string;
    newCurrentVersion: number;
    availableVersions: number[];
    type: ImageType;
    prompt: string;
    aspectRatio: ManualAddAspectRatio;
    seed: number;
    fineTuneId: null;
    generationType: 'manual_upload';
    modelTier: 'ULTRA';
    sourceImageUrl: string;
    assetId?: string;
}

export interface ManualAddImageSuccessResponse {
    message: string;
    success: true;
    data: ManualAddImageSuccessData;
}

export interface ManualAddImageErrorResponse {
    message?: string;
    success: false;
    error: string;
    type?: ImageType;
    modelTier?: 'ULTRA';
}

export type ManualAddImageResponse =
    | ManualAddImageSuccessResponse
    | ManualAddImageErrorResponse;

export type ImageCategory =
    | 'character'
    | 'environment'
    | 'prop'
    | 'concept'
    | 'background'
    | 'vehicle'
    | 'effect'
    | 'ui'
    | 'weapon'
    | 'costume'
    | 'creature'
    | 'architecture'
    | 'other';

// ============================================================
// NEW TYPES FOR STANDALONE IMAGES LIST/UPDATE ENDPOINTS
// ============================================================
// Note: ImageCategory already exists in your types.ts
// Note: GenerationType already exists but may need 'text_to_image' | 'manual_upload' | 'image_edit' added
// Note: ManualAddAspectRatio already exists as '16:9' | '9:16' | '1:1' - reuse it as AspectRatio

export type AssetStatus = 'Initialized' | 'Completed' | 'Unknown';

// ModelTier is a number in your system, not the enum strings from the API docs
// The API may return these as numbers, so we'll use number type

export type SortField = 'createdAt' | 'lastModifiedAt' | 'title';

export type SortOrder = 'asc' | 'desc';

// Reuse existing type
export type AspectRatio = ManualAddAspectRatio;

// Update existing GenerationType to include these if not present:
// 'text_to_image' | 'manual_upload' | 'image_edit'

// ============================================================
// LIST STANDALONE IMAGES
// ============================================================

export interface ListStandaloneImagesParams {
    page?: number;
    limit?: number;
    sortField?: SortField;
    sortOrder?: SortOrder;
    imageCategory?: ImageCategory;
    projectName?: string;
    hasImage?: boolean;
    tags?: string;
    status?: 'Initialized' | 'Completed';
}

export interface StandaloneImageAsset {
    assetId: string;
    title: string;
    description: string | null;
    imageCategory: ImageCategory | null;
    tags: string[];
    projectName: string | null;
    notes: string | null;
    status: AssetStatus;
    hasImage: boolean;
    currentVersion: number;
    totalVersions: number;
    totalEdits: number;
    createdAt: string;
    lastModifiedAt: string;
    lastEditedAt: string | null;
    lastAnalyzedAt: string | null;
    thumbnailPath: string | null;
    aspectRatio: AspectRatio | null;
    generationType: GenerationType | null;
    modelTier: number | null;
}

export interface PaginationMetadata {
    totalCount: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    nextPage: number | null;
    previousPage: number | null;
    sortField: string;
    sortOrder: string;
    appliedFilters: {
        imageCategory: string | null;
        projectName: string | null;
        hasImage: boolean | null;
        tags: string[] | null;
        status: string | null;
    };
}

export interface AssetStatistics {
    totalAssets: number;
    assetsWithImages: number;
    assetsWithoutImages: number;
    categoryCounts: Record<string, number>;
    projectCounts: Record<string, number>;
    statusCounts: Record<string, number>;
}

export interface ListStandaloneImagesResponse {
    success: boolean;
    message: string;
    data: {
        assets: StandaloneImageAsset[];
        pagination: PaginationMetadata;
        statistics: AssetStatistics;
    };
}

// ============================================================
// UPDATE STANDALONE IMAGE METADATA
// ============================================================

export interface UpdateStandaloneMetadataRequest {
    assetId: string;
    title?: string;
    description?: string | null;
    imageCategory?: ImageCategory | null;
    tags?: string[];
    projectName?: string | null;
    notes?: string | null;
}

export interface UpdateStandaloneMetadataResponse {
    success: boolean;
    message: string;
    data: {
        assetId: string;
        updatedFields: string[];
    };
}

export interface MetadataUpdateError {
    success: false;
    error: string;
    field?: string;
    providedValue?: any;
    providedLength?: number;
    maxLength?: number;
    providedCount?: number;
    maxCount?: number;
    allowedFields?: string[];
    invalidTags?: any[];
}

// ============================================================
// UTILITY TYPES
// ============================================================

export type ApiResponse<T> =
    | { success: true; data: T }
    | { success: false; error: string };

export interface ApiError {
    success: false;
    error: string;
    message?: string;
}