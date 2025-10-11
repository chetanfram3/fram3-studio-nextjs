// TypeScript types for emotionData

// Weight calculation details 
export interface WeightCalculation {
    baseWeight: number;
    contextScore: number;
    brandScore: number;
    storyScore: number;
    lineWeight: number;
}

// Sentiment analysis details 
export interface SentimentAnalysis {
    sentiment: string;
    coreEmotion: string;
    valence: number;
    arousal: number;
    emotionalShift: string;
}

// Character and music sentiment details 
export interface Sentiment {
    valence: number;
    arousal: number;
}

// Line details 
export interface Line {
    lineId: number;
    content: string;
    contentType: string; // e.g., "Visual Action" or "Dialogue"
    duration: string; // e.g., "4 seconds"
    weightCalculation: WeightCalculation;
    sentimentAnalysis: SentimentAnalysis;
    characterSentiment: Sentiment;
    musicSentiment: Sentiment;
}

// Scene details 
export interface Scene {
    sceneId: number;
    sceneDescription: string;
    sceneDuration: number;
    updatedSceneDuration: string;
    lines: Line[];
    characterSentiment: Sentiment;
    musicSentiment: Sentiment;
}

// Average duration data 
export interface AverageDurationData {
    averageDuration: number;
    averageShots: number;
}

// Calculated duration data 
export interface CalculatedDurationData {
    totalScriptDuration: number;
    durationComparison: string;
}

// Arc data point
export interface ArcDataPoint {
    time: number;
    valence: number;
    arousal: number;
}

// Arc information 
export interface ArcInfo {
    characterArc: ArcDataPoint[];
    musicalArc: ArcDataPoint[];
    storyArc: ArcDataPoint[];
}

// Main emotionData type 
export interface EmotionData {
    averageDurationData: AverageDurationData;
    scenes: Scene[];
    calculatedDurationData: CalculatedDurationData;
    additionalInfo: string[];
}
