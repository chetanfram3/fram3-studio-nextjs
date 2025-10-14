import { FormValues } from "../types";

export const defaultFormValues: FormValues = {
    mode: "generate",
    ui: {
        formatCallToActionExpanded: false,
        localeRegionExpanded: false,
        mustHavesExpanded: false,
    },
    projectName: "",
    loglineConcept: "",
    brandName: "",
    productName: "",
    formatAndCTA: {
        scriptType: "",
        scriptFormat: "",
        aspectRatio: "",
        ctaUrgencyCategory: "",
        ctaPrimary: [],
        ctaSecondary: [],
        customCTA: "",
    },
    genre: "",
    desiredDuration: 0,
    localeRegionLanguage: {
        continent: "",
        country: "",
        stateProvince: "",
        language: "",
        languageIndex: 0,
        speechModes: [],
    },
    mustHaves: "",
    audienceDetails: {
        demographics: {
            sex: [],
            customSex: "",
            identity: [],
            customIdentity: "",
            age: [],
            customAgeRange: {
                start: 0,
                end: 0,
            },
        },
        audiencePersona: "",
        psychographics: "",
        painPoints: "",
        aspirations: "",
        interestActivities: "",
        emotionalTone: {
            emotionList: [],
            emotionIntensity: 0,
            emotionalArc: [],
        },
    },
    storyDetails: {
        mood: "",
        narrativeStructure: "",
        plotElements: [],
        characters: [],
        settings: [],
    },
    brandDetails: {
        identity: {
            visionStatement: "",
            missionStatement: "",
        },
        brandValues: [],
        voiceAndTone: {
            brandVoice: "",
            toneKeywords: [],
        },
        competitiveAnalysis: {
            competitorNotes: "",
            competitiveStrategy: "",
            customCompetitiveStrategy: "",
        },
    },
    productDetails: {
        productSpecifications: "",
        keyFeatures: [],
        uniqueSellingProposition: [],
    },
    campaignDetails: {
        campaignName: "",
        campaignGoal: "",
        objectives: [],
        keyMessages: [],
        additionalDetails: {
            offerPromotionDetails: "",
            mandatoriesLegalDisclaimers: "",
        },
        styleAndTone: {
            visualStyleKeywords: [],
            soundDesignKeywords: [],
        },
    },
    executionReference: {
        productionConstraints: {
            commonConstraints: [],
            customConstraints: [],
        },
        referenceFiles: {
            extractionNotes: "",
            filePaths: []
        },
    },
};