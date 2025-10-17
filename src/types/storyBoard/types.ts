// Enhanced types with version support

export interface SceneCardProps {
    scene: Scene;
    selectedShot?: Shot;
    onShotSelect: (shot: Shot) => void;
}

export interface ShotThumbnailProps {
    shot: Shot;
    isSelected?: boolean;
    onClick?: () => void;
}

export interface ShotDetailsProps {
    shot: Shot;
}

export interface BreadcrumbProps {
    scene: number;
    shot: number;
}

export interface StoryBoardData {
    aspectRatio: "auto" | "16:9" | "9:16" | "1:1" | undefined;
    audioPlaylist: AudioPlaylistItem[];
    scenes: Scene[];
    versioningEnabled?: boolean;
    videoVersioningEnabled?: boolean; // NEW: Video versioning support
    isVideoGenerated?: boolean;
    promptsEnabled?: boolean; // NEW: Indicates if prompts are enabled
    lastUpdated?: string;
}

export type MediaViewMode = "image" | "video";

export interface MediaViewerProps {
    shot: Shot;
    sceneId: number;
    scriptId?: string;
    versionId?: string;
    viewMode: MediaViewMode;
    onDataRefresh?: () => void;
    onShotUpdate?: (updatedShot: Shot, sceneId: number) => void;
    type: "shots" | "actor" | "location";
    aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
}

export interface Scene {
    sceneId: number;
    sceneSummary: string;
    sceneTextContent: string;
    characters: Character[];
    audioDetails: AudioDetail[];
    locationDetails: LocationDetail[];
    lines: Line[];
}

export interface Character {
    sceneIds?: number[];
    actorName: string;
    actorId: number;
    actorVersionId: number;
    actorArchetype: string;
    actorType: string;
    gender: string;
    signedUrl?: string;
    signedProfileUrl?: string;
    celebrity: {
        isCelebrity: string;
        publicImage?: string;
        fameLevel?: string;
        region?: string;
    };
}

export interface Ambience {
    lighting: string;
    soundscape: string;
    atmosphere: string;
    sensoryDetails: string[];
}

export interface Environment {
    type: string;
    ambience: Ambience;
}

export interface LocationDetail {
    locationName: string;
    locationArchetype: string;
    locationClass: string;
    setting: {
        timePeriod: string;
        region: Region;
        weather: string;
        season: string;
        timeOfDay: string;
    };
    environment: Environment;
}

export interface Region {
    country: string;
    state: string;
    city: string;
    neighborhood: string;
}

export interface Line {
    lineId: number;
    lineContentType: string;
    sentiment: string;
    lineDescription: string;
    shots: Shot[];
}

// NEW: Version-related interfaces
export interface ImageVersion {
    aspectRatio: any;
    generationType: any;
    prompt: string;
    version: number;
    destinationPath: string;
    signedUrl: string;
    thumbnailPath: string;
    isCurrent: boolean;
    lastEditedAt?: string;
    archivedAt?: string;
}

export interface EditHistoryItem {
    timestamp: string;
    fromVersion: number;
    toVersion: number;
    editType: "flux_pro_kontext" | "version_restore";
    previousPath: string;
    newPath: string;
    restoredFromVersion?: number; // Present only for version_restore operations
}

export interface ImageVersions {
    current: ImageVersion;
    archived: Record<string, ImageVersion>;
    totalVersions: number;
    editHistory: EditHistoryItem[];
    totalEdits: number;
}

// Enhanced Shot interface with version support
export interface Shot {
    shotId: number;
    shotDescription: string;
    shotSize: string;
    cameraAngle: string;
    cameraMovement: string;
    lensType: string;
    fStop: string;
    frameComposition: string;
    roomToneName: string;
    visualStyleReference: string;
    shotDuration: string;
    transition: string;

    // Image fields - backward compatibility
    signedUrl: string;
    thumbnailPath?: string;
    imageStatus?: string;

    // NEW: Image version information
    versions?: ImageVersions;

    // NEW: Video fields
    videoSignedUrl?: string | null;
    lipsyncVideoUrl?: string | null; // Added missing field
    videoStatus?: string;
    hasLipsyncVideo?: boolean;

    // NEW: Video version information
    videoVersions?: VideoVersions;
    currentVideoVersion?: number;
    videoGenerationType?: string;
    videoMetadata?: VideoVersion['videoMetadata'];

    // NEW: Prompt fields
    imagePrompt?: string | null;
    originalImagePrompt?: string | null;
    videoPrompt?: string | null;
    originalVideoPrompt?: string | null;

    // Dialogue information
    dialogues: Dialogue[];
    dialogueDetails?: DialogueDetail;
}

export interface PromptManagementProps {
    shot: Shot;
    sceneId: number;
    scriptId: string;
    versionId: string;
    onPromptUpdate?: (updatedShot: Shot) => void;
    onError?: (error: string) => void;
    type: 'image' | 'video';
}

export interface MediaTabsViewerProps {
    shot: Shot;
    sceneId: number;
    scriptId?: string;
    versionId?: string;
    onDataRefresh?: () => void;
    onShotUpdate?: (updatedShot: Shot) => void;
    aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
    isVideoGenerated?: boolean;
    // NEW: Enhanced loading state support
    onLoadingChange?: (isLoading: boolean) => void;
    onError?: (errorMessage: string) => void;
}


export interface Dialogue {
    audioVersion: number;
    actorName: string;
    actorId: number;
    actorVersionId: number;
    dialogueContent: string;
    audio: AudioDetail;
}

export interface AudioPlaylistItem {
    sceneId: number;
    shotId: number | null;
    dialogueId: number | null;
    path: string;
}

export interface DialogueDetail {
    actorId: number;
    actorVersionId: number;
    actorName: string;
    dialogueId: number;
    languageSpoken: string[];
    dialogueContent: string;
}

export interface AudioDetail {
    processing?: number;
    path?: string;
    duration?: number;
}

// NEW: Version control related interfaces
export interface VersionControlProps {
    currentVersion: ImageVersion;
    archivedVersions: Record<string, ImageVersion>;
    totalVersions: number;
    totalEdits: number;
    onVersionSelect: (version: ImageVersion) => void;
    onEditRequest: () => void;
    isEditingEnabled?: boolean;
}

export interface EditImageRequest {
    scriptId: string;
    versionId: string;
    type: "shots" | "actor" | "location";
    sceneId?: number;
    shotId?: number;
    actorId?: number;
    actorVersionId?: number;
    locationId?: number;
    locationVersionId?: number;
    promptType?: string;
    sourceVersion?: number;
    prompt: string;
}

export interface MediaViewerProps {
    shot: Shot;
    sceneId: number;
    scriptId?: string;
    versionId?: string;
    viewMode: MediaViewMode;
    onDataRefresh?: () => void;
    onShotUpdate?: (updatedShot: Shot, sceneId: number) => void;
    type: "shots" | "actor" | "location";
    aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
    showPromptEditor?: boolean;
    // NEW: Enhanced loading and error handling
    onLoadingChange?: (isLoading: boolean) => void;
    onError?: (errorMessage: string) => void;
}

// NEW: Video version interfaces
export interface VideoVersion {
    modelTier: number;
    version: number;
    videoSignedUrl: string;
    lipsyncVideoSignedUrl?: string;
    videoPath?: string; // For internal use
    lipsyncVideoPath?: string; // For internal use
    prompt?: string;
    generationType?: string;
    seed?: number;
    aspectRatio?: string;
    imageVersion?: number;
    audioVersion?: number;
    isCurrent: boolean;
    lastEditedAt?: string;
    archivedAt?: string;
    videoMetadata?: {
        duration?: number;
        frameRate?: number;
        size?: string;
        format?: string;
        uploadedAt?: string;
        aspectRatio?: string;
        bitrate?: string;
        modelType?: string;
        audioCodec?: string | null;
        contentType?: string;
        resolution?: string;
        videoCodec?: string;
        fileName?: string;
    };
}

export interface VideoEditHistoryItem {
    timestamp: string;
    fromVersion: number;
    toVersion: number;
    generationType: string;
    previousVideoPath?: string;
    newVideoPath?: string;
    prompt?: string;
    seed?: number;
    imageVersion?: number;
    audioVersion?: number;
    restoredFromVersion?: number;
}

export interface VideoVersions {
    current: VideoVersion;
    archived: Record<string, VideoVersion>;
    totalVersions?: number;
    editHistory?: EditHistoryItem[];
    totalEdits?: number;
}