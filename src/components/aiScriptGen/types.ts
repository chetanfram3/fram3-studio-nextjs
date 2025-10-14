import { z } from 'zod';

// Define the structure of the emotionalArc item
const emotionalArcItem = z.object({
    emotion: z.string(),
    intensity: z.number()
});

export const formSchema = z.object({
    // Mode (for generate/revise)
    mode: z.string().default("generate"),

    // UI State (for section expansion - client-side only)
    ui: z.object({
        formatCallToActionExpanded: z.boolean(),
        localeRegionExpanded: z.boolean(),
        mustHavesExpanded: z.boolean()
    }),

    // Basic Information
    projectName: z.string().min(1, { message: "Project name is required" }),
    loglineConcept: z.string().min(1, { message: "Logline/concept is required" }),
    brandName: z.string().optional(),
    productName: z.string().optional(),

    // Format & Call to Action
    formatAndCTA: z.object({
        scriptType: z.string(),
        scriptFormat: z.string(),
        aspectRatio: z.string().nullable(),
        ctaUrgencyCategory: z.string(),
        ctaPrimary: z.union([
            z.string().nullable(),
            z.array(z.string())
        ]).nullable(),
        ctaSecondary: z.union([
            z.string().nullable(),
            z.array(z.string())
        ]).nullable(),
        customCTA: z.string().nullable(),
    }),

    // Basic Creative Parameters
    genre: z.string().nullable(),
    desiredDuration: z.number(),

    // Locale & Region
    localeRegionLanguage: z.object({
        continent: z.string().nullable(),
        country: z.string().nullable(),
        stateProvince: z.string().nullable(),
        language: z.string().nullable(),
        languageIndex: z.number().optional(), // Kept for backward compatibility
        speechModes: z.array(z.string()).default([])
    }),

    // Must-Haves
    mustHaves: z.string().nullable(),

    // Audience details
    audienceDetails: z.object({
        demographics: z.object({
            sex: z.union([
                z.string().nullable(),
                z.array(z.string())
            ]).nullable(),
            customSex: z.string().optional(), // Kept for backward compatibility
            identity: z.union([
                z.string().nullable(),
                z.array(z.string())
            ]).nullable(),
            customIdentity: z.string().optional(), // Kept for backward compatibility
            age: z.array(z.string()).nullable(),
            customAgeRange: z.object({
                start: z.number(),
                end: z.number()
            }).nullable()
        }),
        audiencePersona: z.string().nullable(),
        psychographics: z.string().nullable(),
        painPoints: z.string().nullable(),
        aspirations: z.string().nullable(),
        interestActivities: z.string().nullable(),
        emotionalTone: z.object({
            emotionList: z.array(z.string()).nullable(),
            emotionIntensity: z.number().nullable(),
            emotionalArc: z.array(emotionalArcItem).optional() // Kept for internal use
        })
    }),

    // Story Details
    storyDetails: z.object({
        mood: z.string().nullable(),
        narrativeStructure: z.string().nullable(),
        plotElements: z.array(z.string()).nullable(),
        characters: z.array(z.string()).nullable(),
        settings: z.array(z.string()).nullable(),
    }),

    // Brand Details
    brandDetails: z.object({
        identity: z.object({
            visionStatement: z.string().nullable(),
            missionStatement: z.string().nullable()
        }),
        brandValues: z.array(z.string()).nullable(),
        voiceAndTone: z.object({
            brandVoice: z.string().nullable(),
            toneKeywords: z.array(z.string()).nullable(),
        }),
        competitiveAnalysis: z.object({
            competitorNotes: z.string().nullable(),
            competitiveStrategy: z.string().nullable(),
            customCompetitiveStrategy: z.string().nullable()
        })
    }),

    // Product Details
    productDetails: z.object({
        // productName already in root level
        productSpecifications: z.string().nullable(),
        keyFeatures: z.array(z.string()).nullable(),
        uniqueSellingProposition: z.array(z.string()).nullable(),
    }),

    // Campaign Details
    campaignDetails: z.object({
        campaignName: z.string().nullable(),
        campaignGoal: z.string().nullable(),
        objectives: z.array(z.string()).nullable(),
        keyMessages: z.array(z.string()).nullable(),
        additionalDetails: z.object({
            offerPromotionDetails: z.string().nullable(),
            mandatoriesLegalDisclaimers: z.string().nullable()
        }),
        styleAndTone: z.object({
            visualStyleKeywords: z.array(z.string()).nullable(),
            soundDesignKeywords: z.array(z.string()).nullable(),
        })
    }),

    // Execution & Reference
    executionReference: z.object({
        productionConstraints: z.object({
            commonConstraints: z.array(z.string()).nullable(),
            customConstraints: z.array(z.string()).nullable(),
        }),
        referenceFiles: z.object({
            extractionNotes: z.string().nullable(),
            filePaths: z.array(z.string()).nullable()
        })
    }),

    // Reference Analysis - Optional
    referenceAnalysis: z.any().optional(),

    // Revision Mode Specific - Optional
    previousContext: z.any().optional(),
    previousScript: z.string().optional(),
    userFeedback: z.string().optional()
}).refine(
    // Require either brandName or productName to be filled
    (data) => !!data.brandName || !!data.productName,
    {
        message: "Either Brand name or Product name is required",
        path: ["brandName"] // Show error on brandName field
    }
);

export type FormValues = z.infer<typeof formSchema>;

// Example for a component props interface:
import { UseFormReturn } from "react-hook-form";

export interface SectionComponentProps {
    form: UseFormReturn<FormValues>;
}

export interface ScriptData {
    // Core script data
    scriptTitle: string;
    scriptNarrativeParagraph: string;
    scriptAV: string;
    scriptDurationEstimated: number;

    // Mode and revision information
    mode?: string;
    isRevision?: boolean;
    revisionSummary?: string | null;
    processingNotes?: string[];

    // Output style information
    scriptOutputStyleNarrative?: string;
    scriptOutputStyleAV?: string;

    // Duration information
    targetDurationInput?: number;
    durationEstimationMethod?: string;

    // Strategic context
    strategicContextSummary?: {
        inferredProductCategory?: string;
        inferredProductCategoryJustification?: string;
        inferredTargetAudienceProfile?: string;
        inferredTargetAudienceProfileJustification?: string;
        inferredBrandArchetype?: string;
        inferredBrandArchetypeJustification?: string;
        inferredMarketPosition?: string;
        inferredMarketPositionJustification?: string;
        keyEmotionalTargets?: Array<{
            emotion: string;
            intensity: string;
        }>;
        keyEmotionalTargetsJustification?: string;
        competitiveAngle?: string;
        competitiveAngleJustification?: string;
        culturalConsiderationsApplied?: string[];
        culturalConsiderationsAppliedJustification?: string;
        inferredPurchasingConsiderations?: string;
        inferredPurchasingConsiderationsJustification?: string;
        recommendedVisualStrategy?: {
            overallToneStyle?: string;
            overallToneStyleJustification?: string;
            coreVisualMetaphorConcept?: string;
            coreVisualMetaphorConceptJustification?: string;
            colorPalettePsychology?: string;
            colorPalettePsychologyJustification?: string;
            pacingEditingGuidance?: string;
            pacingEditingGuidanceJustification?: string;
            castingRepresentationGuidance?: string;
            castingRepresentationGuidanceJustification?: string;
            settingEnvironmentGuidance?: string;
            settingEnvironmentGuidanceJustification?: string;
            productPortrayalGuidance?: string;
            productPortrayalGuidanceJustification?: string;
            keyMomentVisualizationSuggestions?: string[];
        };
        recommendedVisualStrategyJustification?: string;
        contextConfidenceScore?: string;
        contextConfidenceJustification?: string;
        confidencePerParameter?: {
            productCategory?: string;
            targetAudience?: string;
            brandArchetype?: string;
            marketPosition?: string;
            emotionalTargets?: string;
            competitiveAngle?: string;
            culturalConsiderations?: string;
            purchasingConsiderations?: string;
            recommendedVisualStrategy?: string;
        };
    };

    // Concept and script details
    conceptSummary?: {
        coreIdea?: string;
        emotionalArc?: string;
        narrativeStrategy?: string;
        keyVisualAuditoryMood?: string;
        productRole?: string;
        conceptEvaluationDetails?: {
            scores?: {
                strategicFit?: number;
                resonancePotential?: number;
                originality?: number;
                feasibility?: number;
            };
            overallWeightedScore?: number;
            swotAnalysis?: {
                strengths?: string[];
                weaknesses?: string[];
                opportunities?: string[];
                threats?: string[];
            };
            keyRisk?: string;
            resonanceRationale?: string;
            culturalAdaptationNotes?: string;
            visualStrategyAlignmentNotes?: string;
        };
    };

    alternativeConcepts?: any[];

    // Dialogue control
    dialogueControl?: {
        includeDialogue?: boolean;
        dialogueStyle?: string | null;
        dialogueLanguage?: string | null;
        llmProficiencyNote?: string | null;
    };

    // Analytics and suggestions
    appliedPrinciplesHighlights?: string[];
    suggestedVisualElements?: string[];
    suggestedAudioCues?: string[];
    disclaimer?: string;
}

// Updated ApiResponseData interface to match ScriptData
export interface ApiResponseData {
    projectName?: string;
    brandOrProductName?: string;
    loglineConcept?: string;
    scriptTitle?: string;
    scriptNarrativeParagraph?: string;
    scriptAV?: string;
    scriptDurationEstimated?: number;
    mode?: string;
    isRevision?: boolean;
    revisionSummary?: string | null;
    processingNotes?: string[];
    scriptOutputStyleNarrative?: string;
    scriptOutputStyleAV?: string;
    targetDurationInput?: number;
    durationEstimationMethod?: string;
    strategicContextSummary?: any;
    conceptSummary?: any;
    alternativeConcepts?: any[];
    dialogueControl?: any;
    appliedPrinciplesHighlights?: string[];
    suggestedVisualElements?: string[];
    suggestedAudioCues?: string[];
    disclaimer?: string;
    [key: string]: any; // Allow for additional properties
}

// Type for the parsed JSON response
export interface ApiResponse {
    data?: ApiResponseData;
    [key: string]: any;
}