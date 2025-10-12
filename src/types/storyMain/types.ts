import { BrandDetails } from "../market/types";

export interface ScriptInfo {
    scriptId: string;
    genScriptId?: string;
    currentVersion: string;
    currentVersionNumber: number;
    createdAt: Timestamp;
    lastModifiedAt: Timestamp;
    description: string;
    title: string;
    productDetails: ProductDetails;
    location: Region;
    languages: string[];
    version: Version;
    versions: VersionInfo[];
    statuses: AnalysisTypeStatus;
    brandDetails: BrandDetails;
    audioPlaylist: AudioItem[];
}

export interface AudioItem {
    sceneId: number;
    shotId?: number;
    dialogueId?: number;
    path: string;
}

export interface Timestamp {
    _seconds: number;
    _nanoseconds: number;
}

export interface ProductDetails {
    brand: string;
    product: string;
    productCategory: string;
    tagline: string;
    slogan: string;
}

export interface Region {
    country: string;
    state: string | null;
    city: string;
}

export interface Version {
    versionId: string;
    genScriptVersionNumber?: number;
    content: string;
    fileURL: string | null;
    versionNumber: number;
    modifiedBy: string;
    createdAt: Timestamp;
    statues: AnalysisTypeStatus;
    analyses: AnalysisTypeStatus[];
    completionTimestamp: string;
}

export interface VersionInfo {
    versionId: string;
    versionNumber: number;
}

export interface AnalysisTypeStatus {
    videoProcessor?: { status: string };
    scriptInfo?: { status: string };
    brandAnalysis?: { status: string };
    rating?: { status: string };
    emotionAnalysis?: { status: string };
    scriptSummary?: { status: string };
    sceneBreakdown?: { status: string };
    shotList?: { status: string };
    actorAnalysis?: { status: string };
    locationMapper?: { status: string };
    audioMapper?: { status: string };
    audioProcessor?: { status: string };
    keyVisual?: { status: string };
    processLocationImages?: { status: string };
    processActorImages?: { status: string };
    sceneAnalysis?: { status: string };
    shotMapper?: { status: string };
    promptGenerator?: { status: string };
    processScenesAndShots?: { status: string };
    videoEditor?: { status: string };
}