export interface VideoMetadata {
    duration: number;
    resolution: string;
    bitrate: string;
    format: string;
    size: string;
    frameRate: number;
    videoCodec: string;
    audioCodec: string;
    aspectRatio: string;
    contentType: string;
    uploadedAt: string;
    modelType: string;
}

export interface RenderData {
    url: string;
    outputSizeInBytes: number;
    renderTime: number;
    codec: string;
    composition: string;
    inputProps: any[];
    lambdaFunctionName: string;
    region: string;
    timestamp: string;
    title?: string;
}

export interface CreatedAt {
    _seconds: number;
    _nanoseconds: number;
}

export interface RenderedVideo {
    signedUrl: any;
    videoId: string;
    version: number;
    destinationPath: string;
    videoMetadata: VideoMetadata;
    renderData: RenderData;
    createdAt: CreatedAt;
    status: "completed" | "processing" | "failed";
}

export interface RenderedVideosData {
    success: boolean;
    videos: RenderedVideo[];
    message: string;
}

export interface VideoPlayerProps {
    video: RenderedVideo;
    isPlaying: boolean;
    onPlay: () => void;
    onPause: () => void;
}

export interface VideoThumbnailProps {
    video: RenderedVideo;
    isSelected: boolean;
    onClick: () => void;
}

export interface VideoMetadataDisplayProps {
    video: RenderedVideo;
    compact?: boolean;
}

export interface VideoLayoutProps {
    scriptId?: string;
    versionId?: string;
}