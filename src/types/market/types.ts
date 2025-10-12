export interface MarketResearch {
    metrics: Metrics;
    scriptMetrics: ScriptMetrics;
    brandCompetitor: BrandCompetitor;
    benchmarkComparison: BenchmarkComparison;
    scriptStructure: ScriptStructure;
    scriptRating: ScriptRating;
    groundingMetadata?: {
        webSearchQueries?: string[];
        searchEntryPoint?: {
            renderedContent?: string;
        };
        retrievalMetadata?: any;
    };
}

export interface Metrics {
    brandOverview: BrandOverview;
    scriptRating: ScriptRatingSummary;
    targetAudience: TargetAudience;
}

export interface BrandOverview {
    brandName: string;
    category: string;
    subCategory: string;
    industry: string;
    location: {
        country: string;
        state: string | null;
        city: string;
    };
}

export interface ScriptRatingSummary {
    recommendation: string;
    finalScore: number;
}

export interface TargetAudience {
    ageRange: string;
    description: string;
    genderFocus: string;
    culturalBackground: string;
    emotionalNeeds: string[];
    commonStereotypes: string[];
}

export interface ScriptMetrics {
    logline: string;
    scriptAnalysisScores: ScriptAnalysisScores;
    sceneAnalysis: SceneAnalysis[];
}

export interface ScriptAnalysisScores {
    characters: number;
    premise: number;
    structure: number;
    theme: number;
    visualImpact: number;
    emotionalImpact: number;
    conflict: number;
    originality: number;
}

export interface SceneAnalysis {
    sceneId: number;
    engagementScore: number;
    emotionalImpact: string;
    pacing: number;
    visualImpact: number;
    brandAlignment: number;
    productPlacement: number;
    strengths: string;
    suggestions: string;
}

export interface BrandCompetitor {
    brandInformation: BrandInformation;
    marketShare: MarketShare[];
    competitorEstablishmentDates: Record<string, string>;
}

export interface BrandInformation {
    mainBrand: BrandDetails;
    benchmarkBrand: BrandDetails;
}

export interface BrandDetails {
    brandIdentity: BrandIdentity;
    parentCompany: string;
    websiteUrl: string;
    brandColors: BrandColor[];
    fontDetails: FontDetails;
    slogan: string;
    advertisement: string;
    adVideo: string | null;
    socialMediaCampaign: string;
    logoUrl: string;
    socialMediaUrl: SocialMedia;
    visualAesthetics: VisualAesthetics;
}

export interface SocialMedia {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    youtube?: string;
    pinterest?: string;
    tiktok?: string;
    snapchat?: string;
}

export interface BrandIdentity {
    brandName: string;
    brandArchetype: string;
    missionStatement: string;
    visionStatement: string;
    brandStory: string;
    personality: string;
    voiceAndTone: string;
}

export interface BrandColor {
    name: string;
    hex: string;
    usage: string;
}

export interface FontVariant {
    fontFamily: string[];
    fontVariants: string[];
}

export interface FontDetails {
    headings: FontVariant;
    body: FontVariant;
}

export interface VisualAesthetics {
    fontDetails: FontVariants;
    brandColor: BrandColor[];
    scriptColor: BrandColor[];
}

export interface FontVariants {
    brandFontVariants: string[];
    scriptFontVariants: string[];
    fontUsage: string;
    fontMatchRecommendation: string;
}

export interface MarketShare {
    brand: string;
    marketSharePercentage: string;
    salesPercentageWithinMarketShare: string;
    marketCap: string;
    currency: string;
    status: string;
}

export interface BenchmarkComparison {
    benchmarkComparison: BenchmarkComparisonDetails;
    userScriptTitle: string;
    userBrandArchetype: string;
}

export interface BenchmarkComparisonDetails {
    benchmarkScript: BenchmarkScript;
    userScriptComparison: UserScriptComparison;
}

export interface BenchmarkScript {
    title: string;
    engagementScore: number;
    strengths: string[];
    videoLink: string;
}

export interface UserScriptComparison {
    userScriptScore: number;
    comparativeAnalysis: ComparativeAnalysis;
    overallFeedback: string;
}

export interface ComparativeAnalysis {
    visualImpact: AnalysisComparison;
    emotionalResonance: AnalysisComparison;
    pacing: AnalysisComparison;
    productPlacement: AnalysisComparison;
}

export interface AnalysisComparison {
    benchmark: number;
    user: number;
    suggestion: string;
}

export interface ScriptStructure {
    tvcStructure: TVCStructure;
}

export interface TVCStructure {
    hook: string;
    body: string;
    callToAction: string;
}

export interface ScriptRating {
    recommendation: string;
    finalScore: number;
    explanation: string;
    strengths: string[];
    areasForImprovement: string[];
}
