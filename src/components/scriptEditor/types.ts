export interface ScriptData {
  // Core script data (original required fields)
  scriptTitle: string;
  script: string;
  scriptDuration: number;
  
  // Additional script content fields
  scriptNarrativeParagraph?: string;
  scriptAV?: string;
  estimatedDuration?: number;
  
  // Mode and revision information
  mode?: string;
  isRevision?: boolean;
  revisionSummary?: string | null;
  processingNotes?: string[];
  inputModeUsed?: string;

  // Synthesized inputs
  synthesizedInputs?: {
    synthesizedAudienceProfile?: string | null;
    audienceProfile_justification?: string | null;
    brandEssence?: string | null;
    brandEssence_justification?: string | null;
    coreProductBenefit?: string | null;
    coreProductBenefit_justification?: string | null;
    singleMindedProposition?: string | null;
    singleMindedProposition_justification?: string | null;
    narrativeEmotionPhases?: string | null;
    narrativeEmotionPhases_justification?: string | null;
    consolidatedStyleGuide?: string | null;
    consolidatedStyleGuide_justification?: string | null;
    scriptConstraints?: {
      durationSec?: number | null;
      formatGuidance?: string | null;
      aspectRatio?: string | null;
      mustHaves?: string | null;
      mandatories?: string | null;
      productionLimits?: string[] | null;
    };
    scriptConstraints_justification?: string | null;
    ctaDetails?: {
      text?: string | null;
      urgencyLevel?: string | null;
      offerDetails?: string | null;
    };
    ctaDetails_justification?: string | null;
    referenceSummary?: string | null;
    referenceSummary_justification?: string | null;
    targetLanguage?: string | null;
    targetLanguage_justification?: string | null;
    competitiveContext?: string | null;
    competitiveContext_justification?: string | null;
  };

  // Strategic context
  strategicContextSummary?: {
    inferredProductCategory?: string | null;
    inferredProductCategory_justification?: string | null;
    inferredBrandArchetype?: string | null;
    inferredBrandArchetype_justification?: string | null;
    inferredMarketPosition?: string | null;
    inferredMarketPosition_justification?: string | null;
    keyEmotionalTargets?: string[];
    keyEmotionalTargets_justification?: string;
    culturalConsiderationsApplied?: string[];
    culturalConsiderationsApplied_justification?: string;
    selectedNarrativeStructure?: string | null;
    selectedStructure_justification?: string | null;
    structureConfidenceScore?: string | null;
    contextConfidenceScore?: string;
    contextConfidence_justification?: string;
    confidencePerParameter?: {
      productCategory?: string;
      brandArchetype?: string;
      marketPosition?: string;
      emotionalTargets?: string;
      culturalConsiderations?: string;
    };
  };

  // Concept and script details
  conceptSummary?: {
    coreIdea?: string;
    emotionalArc?: string;
    narrativeStrategy?: string;
    keyVisualAuditoryMood?: string;
    productRole?: string;
    conceptEvaluationDetails?: Record<string, any>;
  };
  alternativeConcepts?: any[];
  scriptOutputStyle?: string;

  // Analytics and suggestions
  basicAnalysis?: {
    wordCount?: number | null;
    estimatedCharacterCount?: number | null;
    brandNameMentioned?: boolean | null;
    ctaMentioned?: boolean | null;
    mandatoriesMentioned?: boolean | null;
  };
  appliedPrinciplesHighlights?: string[];
  suggestedVisualElements?: string[];
  suggestedAudioCues?: string[];
  disclaimer?: string | string[];
}