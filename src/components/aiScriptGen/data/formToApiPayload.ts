import { FormValues } from "../types";
import { defaultFormValues } from "./defaultFormValues";

// Update ScriptGenData interface to match the actual payload structure
export interface ScriptGenData {
    mode: string;
    projectName: string | null | "n/a";
    brandName: string | null | "n/a";
    productName: string | null | "n/a";
    loglineConcept: string | null | "n/a";
    genre: string | null | "n/a";
    desiredDuration: number | null;
    mustHaves: string | null | "n/a";
    formatAndCTA: {
        scriptType: string | null | "n/a";
        scriptFormat: string | null | "n/a";
        aspectRatio: string | null | "n/a";
        ctaUrgencyCategory: string | null | "n/a";
        ctaPrimary: string[] | null;
        ctaSecondary: string[] | null;
        customCTA: string | null | "n/a";
    };
    localeRegionLanguage: {
        continent: string | null | "n/a";
        country: string | null | "n/a";
        stateProvince: string | null | "n/a";
        language: string | null | "n/a";
        speechMode: string[] | null;
    };
    audienceDetails: {
        demographics: {
            sex: string[] | null;
            customSex?: string | null | "n/a";
            identity: string[] | null;
            customIdentity?: string | null | "n/a";
            age: string[] | null;
            customAgeRange: {
                start: number;
                end: number;
            } | null;
        };
        audiencePersona: string | null | "n/a";
        psychographics: string | null | "n/a";
        painPoints: string | null | "n/a";
        aspirations: string | null | "n/a";
        interestActivities: string | null | "n/a";
        emotionalTone: {
            emotionList: string[] | null;
            emotionIntensity: number | null;
            emotionalArc: Array<{ emotion: string; intensity: number }> | null;
        };
    };
    storyDetails: {
        mood: string | null | "n/a";
        narrativeStructure: string | null | "n/a";
        plotElements: string[] | null;
        characters: string[] | null;
        settings: string[] | null;
    };
    brandDetails: {
        identity: {
            visionStatement: string | null | "n/a";
            missionStatement: string | null | "n/a";
        };
        brandValues: string[] | null;
        voiceAndTone: {
            brandVoice: string | null | "n/a";
            toneKeywords: string[] | null;
        };
        competitiveAnalysis: {
            competitorNotes: string | null | "n/a";
            competitiveStrategy: string | null | "n/a";
            customCompetitiveStrategy: string | null | "n/a";
        };
    };
    productDetails: {
        productSpecifications: string | null | "n/a";
        keyFeatures: string[] | null;
        uniqueSellingProposition: string[] | null;
    };
    campaignDetails: {
        campaignName: string | null | "n/a";
        campaignGoal: string | null | "n/a";
        objectives: string[] | null;
        keyMessages: string[] | null;
        additionalDetails: {
            offerPromotionDetails: string | null | "n/a";
            mandatoriesLegalDisclaimers: string | null | "n/a";
        };
        styleAndTone: {
            visualStyleKeywords: string[] | null;
            soundDesignKeywords: string[] | null;
        };
    };
    executionReference: {
        productionConstraints: {
            commonConstraints: string[] | null;
            customConstraints: string[] | null;
        };
        referenceFiles: {
            extractionNotes: string | null | "n/a";
            filePaths: string[] | null;
        };
    };
    referenceAnalysis?: any;
    previousContext?: any;
    previousScript?: string;
    userFeedback?: string;
}

// Utility to check if a value is equivalent to its default
const isDefaultValue = (value: unknown, defaultValue: unknown): boolean => {
    if (value === defaultValue) return true;
    if (Array.isArray(value) && Array.isArray(defaultValue)) {
        return value.length === 0 && defaultValue.length === 0;
    }
    if (typeof value === "object" && value !== null && defaultValue !== null) {
        const valueObj = value as Record<string, unknown>;
        const defaultObj = defaultValue as Record<string, unknown>;
        return Object.keys(valueObj).every((key) =>
            isDefaultValue(valueObj[key], defaultObj[key])
        );
    }
    return false;
};

// Utility to get the appropriate default replacement (null or "n/a")
const getDefaultReplacement = (value: unknown): null | "n/a" => {
    return typeof value === "string" ? "n/a" : null;
};

// Fix the addToPayload function to handle nullable types properly
function addToPayload<T, K extends keyof T>(
    key: K,
    value: T[K] | undefined,
    defaultValue: T[K] | undefined,
    target: T
): void {
    // Special case for mode: always use the actual value
    if (key === "mode" as unknown as K) {
        target[key] = value as T[K];
    } else {
        target[key] = (isDefaultValue(value, defaultValue)
            ? getDefaultReplacement(value)
            : value) as T[K];
    }
}

// Utility to transform form values to API payload, setting defaults to null or "n/a"
export const formToApiPayload = (values: FormValues): ScriptGenData => {
    const payload: ScriptGenData = {
        mode: values.mode,
        projectName: values.projectName,
        brandName: values.brandName || null,
        productName: values.productName || null,
        loglineConcept: values.loglineConcept,
        formatAndCTA: {
            scriptType: values.formatAndCTA.scriptType,
            scriptFormat: values.formatAndCTA.scriptFormat,
            aspectRatio: values.formatAndCTA.aspectRatio,
            ctaUrgencyCategory: values.formatAndCTA.ctaUrgencyCategory,
            ctaPrimary: Array.isArray(values.formatAndCTA.ctaPrimary)
                ? values.formatAndCTA.ctaPrimary
                : values.formatAndCTA.ctaPrimary ? [values.formatAndCTA.ctaPrimary] : null,
            ctaSecondary: Array.isArray(values.formatAndCTA.ctaSecondary)
                ? values.formatAndCTA.ctaSecondary
                : values.formatAndCTA.ctaSecondary ? [values.formatAndCTA.ctaSecondary] : null,
            customCTA: values.formatAndCTA.customCTA,
        },
        genre: values.genre,
        desiredDuration: values.desiredDuration,
        localeRegionLanguage: {
            continent: values.localeRegionLanguage.continent,
            country: values.localeRegionLanguage.country,
            stateProvince: values.localeRegionLanguage.stateProvince,
            language: values.localeRegionLanguage.language,
            speechMode: Array.isArray(values.localeRegionLanguage.speechModes)
                ? values.localeRegionLanguage.speechModes
                : values.localeRegionLanguage.speechModes ? [values.localeRegionLanguage.speechModes] : null,
        },
        mustHaves: values.mustHaves,
        audienceDetails: {
            demographics: {
                sex: Array.isArray(values.audienceDetails.demographics.sex)
                    ? values.audienceDetails.demographics.sex
                    : values.audienceDetails.demographics.sex ? [values.audienceDetails.demographics.sex as string] : null,
                customSex: values.audienceDetails.demographics.customSex,
                identity: Array.isArray(values.audienceDetails.demographics.identity)
                    ? values.audienceDetails.demographics.identity
                    : values.audienceDetails.demographics.identity ? [values.audienceDetails.demographics.identity as string] : null,
                customIdentity: values.audienceDetails.demographics.customIdentity,
                age: values.audienceDetails.demographics.age,
                customAgeRange: values.audienceDetails.demographics.customAgeRange,
            },
            audiencePersona: values.audienceDetails.audiencePersona,
            psychographics: values.audienceDetails.psychographics,
            painPoints: values.audienceDetails.painPoints,
            aspirations: values.audienceDetails.aspirations,
            interestActivities: values.audienceDetails.interestActivities,
            emotionalTone: {
                emotionList: values.audienceDetails.emotionalTone.emotionList,
                emotionIntensity: values.audienceDetails.emotionalTone.emotionIntensity,
                emotionalArc: values.audienceDetails.emotionalTone.emotionalArc || null,
            },
        },
        storyDetails: {
            mood: values.storyDetails.mood,
            narrativeStructure: values.storyDetails.narrativeStructure,
            plotElements: values.storyDetails.plotElements,
            characters: values.storyDetails.characters,
            settings: values.storyDetails.settings,
        },
        brandDetails: {
            identity: {
                visionStatement: values.brandDetails.identity.visionStatement,
                missionStatement: values.brandDetails.identity.missionStatement,
            },
            brandValues: values.brandDetails.brandValues,
            voiceAndTone: {
                brandVoice: values.brandDetails.voiceAndTone.brandVoice,
                toneKeywords: values.brandDetails.voiceAndTone.toneKeywords,
            },
            competitiveAnalysis: {
                competitorNotes: values.brandDetails.competitiveAnalysis.competitorNotes,
                competitiveStrategy: values.brandDetails.competitiveAnalysis.competitiveStrategy,
                customCompetitiveStrategy: values.brandDetails.competitiveAnalysis.customCompetitiveStrategy,
            },
        },
        productDetails: {
            productSpecifications: values.productDetails.productSpecifications,
            keyFeatures: values.productDetails.keyFeatures,
            uniqueSellingProposition: values.productDetails.uniqueSellingProposition,
        },
        campaignDetails: {
            campaignName: values.campaignDetails.campaignName,
            campaignGoal: values.campaignDetails.campaignGoal,
            objectives: values.campaignDetails.objectives,
            keyMessages: values.campaignDetails.keyMessages,
            additionalDetails: {
                offerPromotionDetails: values.campaignDetails.additionalDetails.offerPromotionDetails,
                mandatoriesLegalDisclaimers: values.campaignDetails.additionalDetails.mandatoriesLegalDisclaimers,
            },
            styleAndTone: {
                visualStyleKeywords: values.campaignDetails.styleAndTone.visualStyleKeywords,
                soundDesignKeywords: values.campaignDetails.styleAndTone.soundDesignKeywords,
            },
        },
        executionReference: {
            productionConstraints: {
                commonConstraints: values.executionReference.productionConstraints.commonConstraints,
                customConstraints: values.executionReference.productionConstraints.customConstraints,
            },
            referenceFiles: {
                extractionNotes: values.executionReference.referenceFiles.extractionNotes,
                filePaths: values.executionReference.referenceFiles.filePaths,
            },
        },
        referenceAnalysis: values.referenceAnalysis,
        previousContext: values.previousContext,
        previousScript: values.previousScript,
        userFeedback: values.userFeedback,
    };

    // Basic Information
    addToPayload<ScriptGenData, "projectName">(
        "projectName",
        values.projectName,
        defaultFormValues.projectName,
        payload
    );
    addToPayload<ScriptGenData, "brandName">(
        "brandName",
        values.brandName,
        defaultFormValues.brandName,
        payload
    );
    addToPayload<ScriptGenData, "productName">(
        "productName",
        values.productName,
        defaultFormValues.productName,
        payload
    );
    addToPayload<ScriptGenData, "loglineConcept">(
        "loglineConcept",
        values.loglineConcept,
        defaultFormValues.loglineConcept,
        payload
    );

    // Format & CTA
    addToPayload<ScriptGenData["formatAndCTA"], "scriptType">(
        "scriptType",
        values.formatAndCTA.scriptType,
        defaultFormValues.formatAndCTA.scriptType,
        payload.formatAndCTA
    );
    addToPayload<ScriptGenData["formatAndCTA"], "scriptFormat">(
        "scriptFormat",
        values.formatAndCTA.scriptFormat,
        defaultFormValues.formatAndCTA.scriptFormat,
        payload.formatAndCTA
    );
    addToPayload<ScriptGenData["formatAndCTA"], "aspectRatio">(
        "aspectRatio",
        values.formatAndCTA.aspectRatio,
        defaultFormValues.formatAndCTA.aspectRatio,
        payload.formatAndCTA
    );
    addToPayload<ScriptGenData["formatAndCTA"], "ctaUrgencyCategory">(
        "ctaUrgencyCategory",
        values.formatAndCTA.ctaUrgencyCategory,
        defaultFormValues.formatAndCTA.ctaUrgencyCategory,
        payload.formatAndCTA
    );
    addToPayload<ScriptGenData["formatAndCTA"], "ctaPrimary">(
        "ctaPrimary",
        Array.isArray(values.formatAndCTA.ctaPrimary)
            ? values.formatAndCTA.ctaPrimary
            : values.formatAndCTA.ctaPrimary ? [values.formatAndCTA.ctaPrimary] : null,
        [],
        payload.formatAndCTA
    );

    addToPayload<ScriptGenData["formatAndCTA"], "ctaSecondary">(
        "ctaSecondary",
        Array.isArray(values.formatAndCTA.ctaSecondary)
            ? values.formatAndCTA.ctaSecondary
            : values.formatAndCTA.ctaSecondary ? [values.formatAndCTA.ctaSecondary] : null,
        [],
        payload.formatAndCTA
    );
    addToPayload<ScriptGenData["formatAndCTA"], "customCTA">(
        "customCTA",
        values.formatAndCTA.customCTA,
        defaultFormValues.formatAndCTA.customCTA,
        payload.formatAndCTA
    );

    // Basic Creative Parameters
    addToPayload<ScriptGenData, "genre">(
        "genre",
        values.genre,
        defaultFormValues.genre,
        payload
    );
    addToPayload<ScriptGenData, "desiredDuration">(
        "desiredDuration",
        values.desiredDuration,
        defaultFormValues.desiredDuration,
        payload
    );

    // Locale & Region
    addToPayload<ScriptGenData["localeRegionLanguage"], "continent">(
        "continent",
        values.localeRegionLanguage.continent,
        defaultFormValues.localeRegionLanguage.continent,
        payload.localeRegionLanguage
    );
    addToPayload<ScriptGenData["localeRegionLanguage"], "country">(
        "country",
        values.localeRegionLanguage.country,
        defaultFormValues.localeRegionLanguage.country,
        payload.localeRegionLanguage
    );
    addToPayload<ScriptGenData["localeRegionLanguage"], "stateProvince">(
        "stateProvince",
        values.localeRegionLanguage.stateProvince,
        defaultFormValues.localeRegionLanguage.stateProvince,
        payload.localeRegionLanguage
    );
    addToPayload<ScriptGenData["localeRegionLanguage"], "language">(
        "language",
        values.localeRegionLanguage.language,
        defaultFormValues.localeRegionLanguage.language,
        payload.localeRegionLanguage
    );
    addToPayload<ScriptGenData["localeRegionLanguage"], "speechMode">(
        "speechMode",
        Array.isArray(values.localeRegionLanguage.speechModes)
            ? values.localeRegionLanguage.speechModes
            : values.localeRegionLanguage.speechModes ? [values.localeRegionLanguage.speechModes] : null,
        [],
        payload.localeRegionLanguage
    );
    // Must-Haves
    addToPayload<ScriptGenData, "mustHaves">(
        "mustHaves",
        values.mustHaves,
        defaultFormValues.mustHaves,
        payload
    );

    // Audience Details
    addToPayload<ScriptGenData["audienceDetails"]["demographics"], "sex">(
        "sex",
        Array.isArray(values.audienceDetails.demographics.sex)
            ? values.audienceDetails.demographics.sex
            : values.audienceDetails.demographics.sex ? [values.audienceDetails.demographics.sex as string] : null,
        [],
        payload.audienceDetails.demographics
    );

    // Handle optional properties properly with type casting
    if (values.audienceDetails.demographics.customSex !== undefined) {
        (payload.audienceDetails.demographics as any).customSex = isDefaultValue(
            values.audienceDetails.demographics.customSex,
            defaultFormValues.audienceDetails.demographics.customSex
        )
            ? getDefaultReplacement(values.audienceDetails.demographics.customSex)
            : values.audienceDetails.demographics.customSex;
    }

    addToPayload<ScriptGenData["audienceDetails"]["demographics"], "identity">(
        "identity",
        Array.isArray(values.audienceDetails.demographics.identity)
            ? values.audienceDetails.demographics.identity
            : values.audienceDetails.demographics.identity ? [values.audienceDetails.demographics.identity as string] : null,
        [],
        payload.audienceDetails.demographics
    );

    // Handle optional properties properly with type casting
    if (values.audienceDetails.demographics.customIdentity !== undefined) {
        (payload.audienceDetails.demographics as any).customIdentity = isDefaultValue(
            values.audienceDetails.demographics.customIdentity,
            defaultFormValues.audienceDetails.demographics.customIdentity
        )
            ? getDefaultReplacement(values.audienceDetails.demographics.customIdentity)
            : values.audienceDetails.demographics.customIdentity;
    }

    addToPayload<ScriptGenData["audienceDetails"]["demographics"], "age">(
        "age",
        values.audienceDetails.demographics.age,
        defaultFormValues.audienceDetails.demographics.age,
        payload.audienceDetails.demographics
    );
    addToPayload<ScriptGenData["audienceDetails"]["demographics"], "customAgeRange">(
        "customAgeRange",
        values.audienceDetails.demographics.customAgeRange,
        defaultFormValues.audienceDetails.demographics.customAgeRange,
        payload.audienceDetails.demographics
    );
    addToPayload<ScriptGenData["audienceDetails"], "audiencePersona">(
        "audiencePersona",
        values.audienceDetails.audiencePersona,
        defaultFormValues.audienceDetails.audiencePersona,
        payload.audienceDetails
    );
    addToPayload<ScriptGenData["audienceDetails"], "psychographics">(
        "psychographics",
        values.audienceDetails.psychographics,
        defaultFormValues.audienceDetails.psychographics,
        payload.audienceDetails
    );
    addToPayload<ScriptGenData["audienceDetails"], "painPoints">(
        "painPoints",
        values.audienceDetails.painPoints,
        defaultFormValues.audienceDetails.painPoints,
        payload.audienceDetails
    );
    addToPayload<ScriptGenData["audienceDetails"], "aspirations">(
        "aspirations",
        values.audienceDetails.aspirations,
        defaultFormValues.audienceDetails.aspirations,
        payload.audienceDetails
    );
    addToPayload<ScriptGenData["audienceDetails"], "interestActivities">(
        "interestActivities",
        values.audienceDetails.interestActivities,
        defaultFormValues.audienceDetails.interestActivities,
        payload.audienceDetails
    );
    addToPayload<ScriptGenData["audienceDetails"]["emotionalTone"], "emotionList">(
        "emotionList",
        values.audienceDetails.emotionalTone.emotionList,
        defaultFormValues.audienceDetails.emotionalTone.emotionList,
        payload.audienceDetails.emotionalTone
    );
    addToPayload<ScriptGenData["audienceDetails"]["emotionalTone"], "emotionIntensity">(
        "emotionIntensity",
        values.audienceDetails.emotionalTone.emotionIntensity,
        defaultFormValues.audienceDetails.emotionalTone.emotionIntensity,
        payload.audienceDetails.emotionalTone
    );

    // Handle emotionalArc property safely with null fallback
    addToPayload<ScriptGenData["audienceDetails"]["emotionalTone"], "emotionalArc">(
        "emotionalArc",
        values.audienceDetails.emotionalTone.emotionalArc || null,
        defaultFormValues.audienceDetails.emotionalTone.emotionalArc || null,
        payload.audienceDetails.emotionalTone
    );

    // Story Details
    addToPayload<ScriptGenData["storyDetails"], "mood">(
        "mood",
        values.storyDetails.mood,
        defaultFormValues.storyDetails.mood,
        payload.storyDetails
    );
    addToPayload<ScriptGenData["storyDetails"], "narrativeStructure">(
        "narrativeStructure",
        values.storyDetails.narrativeStructure,
        defaultFormValues.storyDetails.narrativeStructure,
        payload.storyDetails
    );
    addToPayload<ScriptGenData["storyDetails"], "plotElements">(
        "plotElements",
        values.storyDetails.plotElements,
        defaultFormValues.storyDetails.plotElements,
        payload.storyDetails
    );
    addToPayload<ScriptGenData["storyDetails"], "characters">(
        "characters",
        values.storyDetails.characters,
        defaultFormValues.storyDetails.characters,
        payload.storyDetails
    );
    addToPayload<ScriptGenData["storyDetails"], "settings">(
        "settings",
        values.storyDetails.settings,
        defaultFormValues.storyDetails.settings,
        payload.storyDetails
    );

    // Brand Details
    addToPayload<ScriptGenData["brandDetails"]["identity"], "visionStatement">(
        "visionStatement",
        values.brandDetails.identity.visionStatement,
        defaultFormValues.brandDetails.identity.visionStatement,
        payload.brandDetails.identity
    );
    addToPayload<ScriptGenData["brandDetails"]["identity"], "missionStatement">(
        "missionStatement",
        values.brandDetails.identity.missionStatement,
        defaultFormValues.brandDetails.identity.missionStatement,
        payload.brandDetails.identity
    );
    addToPayload<ScriptGenData["brandDetails"], "brandValues">(
        "brandValues",
        values.brandDetails.brandValues,
        defaultFormValues.brandDetails.brandValues,
        payload.brandDetails
    );
    addToPayload<ScriptGenData["brandDetails"]["voiceAndTone"], "brandVoice">(
        "brandVoice",
        values.brandDetails.voiceAndTone.brandVoice,
        defaultFormValues.brandDetails.voiceAndTone.brandVoice,
        payload.brandDetails.voiceAndTone
    );
    addToPayload<ScriptGenData["brandDetails"]["voiceAndTone"], "toneKeywords">(
        "toneKeywords",
        values.brandDetails.voiceAndTone.toneKeywords,
        defaultFormValues.brandDetails.voiceAndTone.toneKeywords,
        payload.brandDetails.voiceAndTone
    );
    addToPayload<ScriptGenData["brandDetails"]["competitiveAnalysis"], "competitorNotes">(
        "competitorNotes",
        values.brandDetails.competitiveAnalysis.competitorNotes,
        defaultFormValues.brandDetails.competitiveAnalysis.competitorNotes,
        payload.brandDetails.competitiveAnalysis
    );
    addToPayload<ScriptGenData["brandDetails"]["competitiveAnalysis"], "competitiveStrategy">(
        "competitiveStrategy",
        values.brandDetails.competitiveAnalysis.competitiveStrategy,
        defaultFormValues.brandDetails.competitiveAnalysis.competitiveStrategy,
        payload.brandDetails.competitiveAnalysis
    );
    addToPayload<ScriptGenData["brandDetails"]["competitiveAnalysis"], "customCompetitiveStrategy">(
        "customCompetitiveStrategy",
        values.brandDetails.competitiveAnalysis.customCompetitiveStrategy,
        defaultFormValues.brandDetails.competitiveAnalysis.customCompetitiveStrategy,
        payload.brandDetails.competitiveAnalysis
    );

    // Product Details
    addToPayload<ScriptGenData["productDetails"], "productSpecifications">(
        "productSpecifications",
        values.productDetails.productSpecifications,
        defaultFormValues.productDetails.productSpecifications,
        payload.productDetails
    );
    addToPayload<ScriptGenData["productDetails"], "keyFeatures">(
        "keyFeatures",
        values.productDetails.keyFeatures,
        defaultFormValues.productDetails.keyFeatures,
        payload.productDetails
    );
    addToPayload<ScriptGenData["productDetails"], "uniqueSellingProposition">(
        "uniqueSellingProposition",
        values.productDetails.uniqueSellingProposition,
        defaultFormValues.productDetails.uniqueSellingProposition,
        payload.productDetails
    );

    // Campaign Details
    addToPayload<ScriptGenData["campaignDetails"], "campaignName">(
        "campaignName",
        values.campaignDetails.campaignName,
        defaultFormValues.campaignDetails.campaignName,
        payload.campaignDetails
    );
    addToPayload<ScriptGenData["campaignDetails"], "campaignGoal">(
        "campaignGoal",
        values.campaignDetails.campaignGoal,
        defaultFormValues.campaignDetails.campaignGoal,
        payload.campaignDetails
    );
    addToPayload<ScriptGenData["campaignDetails"], "objectives">(
        "objectives",
        values.campaignDetails.objectives,
        defaultFormValues.campaignDetails.objectives,
        payload.campaignDetails
    );
    addToPayload<ScriptGenData["campaignDetails"], "keyMessages">(
        "keyMessages",
        values.campaignDetails.keyMessages,
        defaultFormValues.campaignDetails.keyMessages,
        payload.campaignDetails
    );
    addToPayload<ScriptGenData["campaignDetails"]["additionalDetails"], "offerPromotionDetails">(
        "offerPromotionDetails",
        values.campaignDetails.additionalDetails.offerPromotionDetails,
        defaultFormValues.campaignDetails.additionalDetails.offerPromotionDetails,
        payload.campaignDetails.additionalDetails
    );
    addToPayload<ScriptGenData["campaignDetails"]["additionalDetails"], "mandatoriesLegalDisclaimers">(
        "mandatoriesLegalDisclaimers",
        values.campaignDetails.additionalDetails.mandatoriesLegalDisclaimers,
        defaultFormValues.campaignDetails.additionalDetails.mandatoriesLegalDisclaimers,
        payload.campaignDetails.additionalDetails
    );
    addToPayload<ScriptGenData["campaignDetails"]["styleAndTone"], "visualStyleKeywords">(
        "visualStyleKeywords",
        values.campaignDetails.styleAndTone.visualStyleKeywords,
        defaultFormValues.campaignDetails.styleAndTone.visualStyleKeywords,
        payload.campaignDetails.styleAndTone
    );
    addToPayload<ScriptGenData["campaignDetails"]["styleAndTone"], "soundDesignKeywords">(
        "soundDesignKeywords",
        values.campaignDetails.styleAndTone.soundDesignKeywords,
        defaultFormValues.campaignDetails.styleAndTone.soundDesignKeywords,
        payload.campaignDetails.styleAndTone
    );

    // Execution & Reference
    addToPayload<ScriptGenData["executionReference"]["productionConstraints"], "commonConstraints">(
        "commonConstraints",
        values.executionReference.productionConstraints.commonConstraints,
        defaultFormValues.executionReference.productionConstraints.commonConstraints,
        payload.executionReference.productionConstraints
    );
    addToPayload<ScriptGenData["executionReference"]["productionConstraints"], "customConstraints">(
        "customConstraints",
        values.executionReference.productionConstraints.customConstraints,
        defaultFormValues.executionReference.productionConstraints.customConstraints,
        payload.executionReference.productionConstraints
    );
    addToPayload<ScriptGenData["executionReference"]["referenceFiles"], "extractionNotes">(
        "extractionNotes",
        values.executionReference.referenceFiles.extractionNotes,
        defaultFormValues.executionReference.referenceFiles.extractionNotes,
        payload.executionReference.referenceFiles
    );
    addToPayload<ScriptGenData["executionReference"]["referenceFiles"], "filePaths">(
        "filePaths",
        values.executionReference.referenceFiles.filePaths &&
            values.executionReference.referenceFiles.filePaths.length > 0 ?
            values.executionReference.referenceFiles.filePaths : [],
        defaultFormValues.executionReference.referenceFiles.filePaths,
        payload.executionReference.referenceFiles
    );

    // Revision mode fields
    if (values.mode === "revise") {
        if (values.previousContext !== undefined) {
            payload.previousContext = values.previousContext;
        }
        if (values.previousScript !== undefined) {
            payload.previousScript = values.previousScript;
        }
        if (values.userFeedback !== undefined) {
            payload.userFeedback = values.userFeedback;
        }
    }

    return payload;
};