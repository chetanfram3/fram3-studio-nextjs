// Define ModerationCategory type

export type AnalysisData =
  | ScriptInfoAnalysisData
  | ModerationAnalysisData
  | CategoryAnalysisData


  export interface ModerationAnalysisData {
    analysisType: 'moderation'; // Discriminator
    moderationCategories: ModerationCategory[];
    languageCode: string;
    languageSupported: boolean;
  }

export interface CategoryAnalysisData {
  categories: Category[];
}

export interface ScriptInfoAnalysisData {
  analysisType: 'scriptInfo'; // Discriminating property
  title: string;
  brand: string;
  product: string;
  productCategory: string;
  location: {
    country: string;
    state: string | null;
    city: string | null;
  };
  targetAudience: {
    ageRange: string;
    description: string;
    class: string;
    gender: {
      type: string;
      description: string;
    };
  };
  languages: string[];
  tone: string;
  keyMessage: string;
  culturalReferences: string[];
}

export interface EntityMention {
  text: {
    content: string; // The text of the mention
    beginOffset: number; // Position in the text
  };
  type: string; // Mention type (e.g., "COMMON", "PROPER")
  sentiment: string | null; // Sentiment analysis result (if any)
  probability: number; // Confidence in the mention type
}


export interface ModerationCategory {
  name: string; // Name of the moderation category (e.g., "Toxic")
  confidence: number; // Confidence level for the category
  severity: number; // Severity score
}


export interface Category {
  name: string; // Category name (e.g., "/Arts & Entertainment/Movies")
  confidence: number; // Confidence level for the category
  severity: number; // Severity score
}

export interface Entity {
  mentions: EntityMention[]; // Array of mentions for the entity
  metadata: Record<string, string>; // Metadata about the entity
  name: string; // Name of the entity
  type: string; // Entity type (e.g., "PERSON", "LOCATION")
  sentiment: string | null; // Sentiment analysis result (if any)
}

export interface ScriptAnalysisResponse {
  message: string; // Response message
  scriptId: string; // ID of the analyzed script
  versionId: string; // Version ID of the analyzed script
  analysisResults: {
    moderation: {
      moderationCategories: ModerationCategory[];
      languageCode: string; // Language of the script
      languageSupported: boolean; // Whether the language is supported
    };
    categories: {
      categories: Category[];
      languageCode: string; // Language of the script
      languageSupported: boolean; // Whether the language is supported
    };
    scriptInfo: ScriptInfoAnalysisData; // Reuse ScriptInfoAnalysisData type
  };
}

export interface PreCheckErrorType extends Error {
  preCheckFailed: boolean;
  recommendation: string;
}

export interface AnalysisError {
  message: string;
  isPreCheckFailed?: boolean;
  recommendation?: string;
}

export class PreCheckError extends Error {
  preCheckFailed: boolean;
  recommendation: string;

  constructor(message: string, recommendation: string) {
    super(message);
    this.name = 'PreCheckError';
    this.preCheckFailed = true;
    this.recommendation = recommendation;
    
    // This is necessary for proper instanceof checks in TypeScript
    Object.setPrototypeOf(this, PreCheckError.prototype);
  }
}