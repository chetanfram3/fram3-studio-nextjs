import type { EmotionData } from "./emotionTypes"

// Define the types for the audio playlist
export type AudioPlaylist = {
    sceneId: number;
    shotId: number | null;
    dialogueId: number | null;
    path: string;
}[];

// Define version information types
export interface ImageVersion {
    version: number;
    destinationPath?: string;
    thumbnailPath: string;
    signedUrl: string;
    isCurrent: boolean;
    lastEditedAt?: string | null;
    archivedAt?: string;
}

export interface ImageVersions {
    current: ImageVersion;
    archived: Record<number, ImageVersion>;
    totalVersions: number;
    totalEdits: number;
    editHistory: EditHistoryItem[];
}

export interface EditHistoryItem {
    timestamp: string;
    fromVersion: number;
    toVersion: number;
    editType: "flux_pro_kontext" | "version_restore";
    previousPath: string;
    newPath: string;
    restoredFromVersion?: number;
}

export interface CelebrityDetails {
    fame: string;
}

// Define the type for celebrity details
export interface Celebrity {
    celebrityName: string;
    celebrityDetails: CelebrityDetails;
    isCelebrity: string; // Is the actor a celebrity
    publicImage?: string; // Public image description
    fameLevel?: string; // Level of fame
    region?: string;
}

// Define the type for actor details with version support
export interface Actor {
    actorPrompt?: string;
    originalActorPrompt?: string;
    faceDetection: {
        boundingBox: {
            xMin: number;
            xMax: number;
            yMin: number;
            yMax: number;
        };
        detectionType: string;
        specificType: string;
        confidence: number;
        width: number;
        height: number;
    } | undefined;
    actorName: string;
    actorId: number;
    actorVersionId: number;
    actorArchetype: string; // e.g., Protagonist, Supporting, etc.
    actorType: string; // e.g., Human, etc.
    sceneIds: number[];
    gender: string; // e.g., Male, Female, etc.
    celebrity: Celebrity;
    signedUrl: string; // URL to the actor's image
    signedProfileUrl?: string;
    thumbnailPath?: string;
    // NEW: Version support for actors
    versions?: ImageVersions;
}

// Define KeyVisual types
export interface KeyVisualData {
    signedUrl?: string;
    thumbnailPath?: string;
    versions?: ImageVersions;
}

// Define the type for the setting region
export interface Region {
    country: string;
    state: string | null; // nullable
    city: string | null; // nullable
    neighborhood: string | null; // nullable
}

// Define the type for location settings
export interface LocationSetting {
    timePeriod: string; // e.g., contemporary, 2024, modern, etc.
    region: Region;
    weather: string | null; // nullable
    season: string | null; // nullable
    timeOfDay: string | null; // nullable
}

// Define the type for location environment ambience
export interface Ambience {
    lighting: string;
    soundscape: string;
    atmosphere: string;
    sensoryDetails: string[];
}

// Define the type for location environment
export interface Environment {
    type: string;
    ambience: Ambience;
}

// Define the type for location spatial data
export interface SpatialData {
    layout: string;
    orientation: string;
}

// Define the type for location signed URLs
export interface SignedUrlObject {
    signedUrl: string | null;
    thumbnailPath: string | null;
}

export interface SignedUrls {
    wideShotLocationSetPrompt: SignedUrlObject;
    wideShotPrompt?: SignedUrlObject | null;
}

export interface Location {
    thumbnailPath: string | undefined;
    locationId: number;
    locationVersionId: number;
    locationName: string;
    sceneIds: number[];
    locationArchetype: string;
    locationClass: string;
    locationType: string;
    architecturalStyle: string;
    setting: LocationSetting;
    environment: Environment;
    spatialData: SpatialData;
    signedUrls: SignedUrls;
    locationPrompt?: string;
    originalLocationPrompt?: string;
    // NEW: Version support for locations
    versions?: ImageVersions;
}

// Define the type for dialogue
export interface Dialogue {
    dialogueId: number;
    actorName: string;
    actorId: number;
    actorVersionId: number;
    dialogueContent: string;
    audio: {
        processing: number; // e.g., 2
        path: string; // Path to the audio file
        duration: number;
    };
}

// Define the type for a shot with version support
export interface Shot {
    shotId: number;
    shotDescription: string;
    shotSize: string; // e.g., Wide Shot, Close Up, etc.
    cameraAngle?: string;
    cameraMovement?: string;
    shotDuration?: string;
    dialogue: Dialogue | null; // Nullable in case there's no dialogue
    dialogues?: Dialogue[]; // Array of dialogues for multiple actors
    // Image fields
    signedUrl?: string;
    thumbnailPath?: string;
    // NEW: Version support for shots
    versions?: ImageVersions;
}

// Define the type for a scene
export interface Scene {
    sceneId: number;
    sceneTextContent: string;
    sceneDuration: string;
    shots: Shot[];
    audioDetails: AudioDetails;
}

export interface AudioDetails {
    foley: Foley[];
    music: Music;
    roomTone: RoomTone;
}

export interface Foley {
    foleyDescription: string,
    foleyId: number;
    foleyIntensity: number;
    foleyName: string;
    foleySource: string;
    foleyPath: string;
    duration: number;
}

export interface Music {
    musicContentDescription: string;
    musicGenre: string;
    musicId: number,
    musicInstrumentation: string,
    musicIntensity: number,
    musicKey: string;
    musicTempo: number;
    musicPath: string;
    duration: number;
}

export interface RoomTone {
    ambienceIntensity: number,
    roomToneDescription: string,
    roomToneName: string,
    roomToneId: number,
    roomPath: string
    duration: number;
}

// Define the main data type
export interface Overview {
    audioPlaylist: AudioPlaylist;
    actors: Actor[];
    locations: Location[];
    scenes: Scene[];
    emotionData: EmotionData;
}

// Define the root type for the data object
export interface Root {
    data: Overview;
}

// Updated API response interface for FeaturedProject
export interface ApiActorData {
    actorName: string;
    actorId: number;
    actorVersionId: number;
    actorArchetype: string;
    actorType: string;
    sceneIds: number[];
    gender: string;
    celebrity: {
        isCelebrity: string;
    };
    signedUrl: string | null;
    signedProfileUrl: string | null;
    thumbnailPath?: string;
    faceDetection?: FaceDetection;
    // NEW: Version support for API response
    versions?: ImageVersions;
}

export interface FaceDetection {
    boundingBox: {
        xMin: number;
        xMax: number;
        yMin: number;
        yMax: number;
    };
    detectionType: string;
    specificType: string;
    confidence: number;
    width: number;
    height: number;
}

export interface ApiResponse {
    keyVisualSignedUrl: string | null;
    keyVisualThumbnailPath: string | null;
    keyVisualVersions: ImageVersions | null;
    [key: string]: ApiActorData | string | ImageVersions | null;
}