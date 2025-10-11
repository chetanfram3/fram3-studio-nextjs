export const UNIFIED_ANALYSIS_ENDPOINT = '/scripts/run-analysis';

export const ANALYSIS_TYPES = {
  // Core analysis types
  brandWebScraper: 'brandWebScraper',
  scriptInfo: 'scriptInfo',
  brandAnalysis: 'brandAnalysis',
  emotionAnalysis: 'emotionAnalysis',
  scriptSummary: 'scriptSummary',
  sceneDetector: 'sceneDetector',
  rating: 'rating',
  actorAnalysis: 'actorAnalysis',
  locationMapper: 'locationMapper',
  audioMapper: 'audioMapper',
  voiceMapper: 'voiceMapper',
  shotList: 'shotList',
  shotMapper: 'shotMapper',
  keyVisual: 'keyVisual',
  stateMapper3D: 'stateMapper3D',

  // Processor types (match backend exactly)
  processActorImages: 'processActorImages',
  processLocationImages: 'processLocationImages',
  keyVisualProcessor: 'keyVisualProcessor',
  audioProcessor: 'audioProcessor',
  promptGenerator: 'promptGenerator',
  processScenesAndShots: 'processScenesAndShots',

  // Video pipeline types
  lipSyncEditor: 'lipSyncEditor',
  videoPromptGenerator: 'videoPromptGenerator',
  videoProcessor: 'videoProcessor',
  videoAnalysis: 'videoAnalysis',
  videoEditor: 'videoEditor',
  videoEditor2: 'videoEditor2',

  // Legacy types (for backward compatibility but should be phased out)
  actorProcessedImages: 'processActorImages', // Maps to correct backend name
  locationProcessedImages: 'processLocationImages', // Maps to correct backend name
  keyVisualProcessedImage: 'keyVisualProcessor', // Maps to correct backend name
  processedImages: 'processScenesAndShots', // Maps to correct backend name
} as const;

export const ANALYSIS_TITLES = {
  moderation: 'Moderation',
  categories: 'Categories',
  brandWebScraper: 'Brand Web Scraper',
  scriptInfo: 'Script Information',
  brandAnalysis: 'Brand Analysis',
  emotionAnalysis: 'Emotion Analysis',
  scriptSummary: 'Script Summary',
  sceneDetector: 'Scene Detector',
  rating: 'Content Rating',
  actorAnalysis: 'Actor Analysis',
  locationMapper: 'Location Mapper',
  audioMapper: 'Audio Mapper',
  voiceMapper: 'Voice Mapper',
  audioProcessor: 'Audio Processor',
  shotList: 'Shot List Analysis',
  shotMapper: 'Shot Mapper',
  keyVisual: 'Key Visual',
  stateMapper3D: 'State Mapper 3D',

  // Processor types
  processActorImages: 'Actor Images',
  processLocationImages: 'Location Images',
  keyVisualProcessor: 'Key Visual Image',
  promptGenerator: 'Prompt Generator',
  processScenesAndShots: 'Image Generator',

  // Video pipeline
  lipSyncEditor: 'LipSync TimeLine Editor',
  videoPromptGenerator: 'Video Prompt Generator',
  videoProcessor: 'Process Videos and Dialogues',
  videoAnalysis: 'Analysis of Generated Videos',
  videoEditor: 'Still Editor',
  videoEditor2: 'Video Editor',

  // Legacy/backward compatibility
  actorProcessedImages: 'Actor Images',
  locationProcessedImages: 'Location Images',
  keyVisualProcessedImage: 'Key Visual Image',
  processedImages: 'Image Generator',
} as const;

export const ANALYSIS_SUB_TITLES = {
  moderation: 'Ensure compliance with guidelines and community standards.',
  categories: 'Classify the content into relevant categories.',
  brandWebScraper: 'Scrape all information for a given brand and product',
  scriptInfo: 'Detailed metadata and insights about the script.',
  brandAnalysis: 'Examine brand presence and identity within the script.',
  emotionAnalysis: 'Analyze emotional tones and sentiments in scenes.',
  scriptSummary: 'Summarize the script with key takeaways.',
  sceneDetector: 'Divide the script into logical and meaningful scenes.',
  rating: 'Determine the appropriate content rating for the script.',
  actorAnalysis: 'Insights into actor roles and performances.',
  locationMapper: 'Identify and map locations mentioned in the script.',
  audioMapper: 'Analyze audio elements and suggestions for improvement.',
  voiceMapper: 'Analyze audio elements and provide voice IDs',
  audioProcessor: 'Process and generate audio elements',
  shotList: 'Generate a detailed list of camera shots for production.',
  shotMapper: 'Map the script to specific shots and camera angles.',
  keyVisual: 'Generate a compelling Key Visual image prompt for the script.',
  stateMapper3D: 'Map script elements into 3D state framework for spatial storytelling.',

  // Processor types
  processActorImages: 'Process and generate actor images',
  processLocationImages: 'Process and generate location images',
  keyVisualProcessor: 'Process Key Visual image generation',
  promptGenerator: 'Generate creative prompts based on the script content.',
  processScenesAndShots: 'Produce AI-generated images for script visualization.',

  // Video pipeline
  lipSyncEditor: 'Generate LipSync TimeLine Editor',
  videoPromptGenerator: 'Generate creative video prompts based on the script content.',
  videoProcessor: 'Generate and process video content',
  videoAnalysis: 'Analyze generated video content for quality and consistency',
  videoEditor: 'Still Editor Timeline generator',
  videoEditor2: 'Video Editor Timeline generator',

  // Legacy/backward compatibility
  actorProcessedImages: 'Process actor images',
  locationProcessedImages: 'Process location images',
  keyVisualProcessedImage: 'Process Key visual image',
  processedImages: 'Produce AI-generated images for script visualization.',
} as const;

// Updated dependencies (removed 'script' as it's always available and 'vlmInputProcessor' as it's inferred)
export const ANALYSIS_DEPENDENCIES: Record<AnalysisType, AnalysisType[]> = {
  // Level 1 (Root) - No dependencies (script is implicit)
  brandWebScraper: [],
  stateMapper3D: [],

  // Level 2 - Depends on brandWebScraper
  scriptInfo: ['brandWebScraper'],
  scriptSummary: ['brandWebScraper'],
  brandAnalysis: ['brandWebScraper'],

  // Level 3 - Depends on previous levels
  emotionAnalysis: ['scriptInfo', 'scriptSummary', 'brandWebScraper'],

  // Level 4 - Depends on emotionAnalysis and scriptSummary
  sceneDetector: ['emotionAnalysis', 'scriptSummary'],

  // Level 5 - Depends on sceneDetector
  actorAnalysis: ['sceneDetector'],
  locationMapper: ['sceneDetector'],

  // Level 6 - Multiple dependencies from previous levels
  processActorImages: ['actorAnalysis'],
  processLocationImages: ['locationMapper'],
  rating: ['scriptSummary', 'sceneDetector', 'emotionAnalysis', 'brandWebScraper'],
  keyVisual: ['emotionAnalysis', 'scriptSummary', 'actorAnalysis', 'locationMapper', 'brandWebScraper'],
  shotList: ['sceneDetector', 'actorAnalysis', 'locationMapper', 'emotionAnalysis'],

  // Level 7 - Depends on shotList and other components
  keyVisualProcessor: ['keyVisual'],
  audioMapper: ['sceneDetector', 'actorAnalysis', 'locationMapper', 'shotList', 'emotionAnalysis', 'brandWebScraper'],
  voiceMapper: ['audioMapper'],
  shotMapper: ['sceneDetector', 'actorAnalysis', 'locationMapper', 'shotList'],

  // Level 8 (Final) - Depends on shotList, shotMapper and other components
  audioProcessor: ['audioMapper', 'voiceMapper'],
  promptGenerator: ['shotList', 'actorAnalysis', 'locationMapper', 'shotMapper'],

  // Processor dependencies
  processScenesAndShots: ['promptGenerator'],

  // Video pipeline dependencies (removed script and vlmInputProcessor)
  lipSyncEditor: ['audioMapper', 'shotList', 'actorAnalysis'],
  videoPromptGenerator: ['keyVisual', 'locationMapper', 'actorAnalysis', 'scriptSummary', 'audioMapper', 'processedImages'],
  videoProcessor: ['videoPromptGenerator'],
  videoAnalysis: ['brandWebScraper', 'videoProcessor', 'emotionAnalysis'],
  videoEditor: ['rating', 'brandWebScraper', 'brandAnalysis', 'scriptSummary', 'scriptInfo', 'emotionAnalysis', 'audioMapper', 'voiceMapper', 'audioProcessor', 'shotList', 'sceneDetector', 'actorAnalysis', 'locationMapper', 'shotMapper', 'processedImages'],
  videoEditor2: ['voiceMapper', 'shotList', 'videoEditor', 'brandWebScraper', 'videoAnalysis', 'emotionAnalysis', 'audioMapper', 'videoProcessor'],

  // Legacy mappings for backward compatibility
  actorProcessedImages: ['actorAnalysis'],
  locationProcessedImages: ['locationMapper'],
  keyVisualProcessedImage: ['keyVisual'],
  processedImages: ['promptGenerator'],
} as const;

// Pipeline stages updated to match backend exactly
export const PIPELINE_STAGES = {
  stage1: {
    id: 1,
    name: "Script Analyst",
    types: ["brandWebScraper", "scriptInfo", "stateMapper3D"],
    description: "Script Analysis & Agent Initialization",
    detailedInfo:
      "Analyzes script for details about the high level overview of script and brand information and identifies the necessary agents to initialize.",
  },
  stage2: {
    id: 2,
    name: "Brand Analyst",
    types: ["brandAnalysis"],
    description: "Brand Identity Analysis",
    detailedInfo:
      "Analyzes brand identity and competitors. It generates a detailed brand analysis report.",
  },
  stage3: {
    id: 3,
    name: "Market Analyst",
    types: ["rating"],
    description: "Market Analyst",
    detailedInfo:
      "Analyzes market trends and competition to optimize campaign strategy.",
  },
  stage4: {
    id: 4,
    name: "Script Supervisor",
    types: ["emotionAnalysis", "scriptSummary", "sceneDetector", "shotList"],
    description: "Detailed Script Analysis",
    detailedInfo:
      "Does a detailed deep dive into the script by breaking it down into scenes, shots, actors, locations, dialogues, and visuals.",
  },
  stage5: {
    id: 5,
    name: "Cast Sculptor",
    types: ["actorAnalysis"],
    description: "Cast Sculptor",
    detailedInfo:
      "Identifies the best cast to play the role based on the physical appearance, their apparel, their personality and behaviour to best portray and convey emotions to the audience based on the context of the story and the brand goal.",
  },
  stage6: {
    id: 6,
    name: "Location Mapper",
    types: ["locationMapper"],
    description: "Location Mapper",
    detailedInfo:
      "Generating a detailed plan on locations along with its art direction feasibility while ensuring the ambience and the environment best conveys and engages the user in an immersive world.",
  },
  stage7: {
    id: 7,
    name: "Audio Mapper",
    types: ["audioMapper", "voiceMapper", "audioProcessor"],
    description: "Audio Mapper",
    detailedInfo:
      "Analyses the script supervisor agent report to generates all the audio elements including dialogue, music, foley, room tone effects for each scene or each shot as per requirement of the script.",
  },
  stage8: {
    id: 8,
    name: "Key Vision Director",
    types: ["keyVisual", "processLocationImages", "processActorImages", "keyVisualProcessor"],
    description: "Visual Identity Design",
    detailedInfo:
      "Analyses script supervisor agents, casting agents, location scout agents and brand analyst agents reports to design and generate the best visual to represent the brand campaign.",
  },
  stage9: {
    id: 9,
    name: "Scene Composer",
    types: ["shotMapper"],
    description: "Scene Visualization",
    detailedInfo:
      "Analyses agents outputs from script supervisor, casting and wardrobe analysis, location scout, brand analysis, to generate the perfect visuals for each shot of each scene to tell the story.",
  },
  stage10: {
    id: 10,
    name: "Shot Mapper",
    types: ["promptGenerator", "processScenesAndShots"],
    description: "Shot List Generation",
    detailedInfo:
      "Generates a list of all shots required for each scene with the perfect visuals to tell the story with max immersion and engagement for the audience.",
  },
} as const;

// Video pipeline stages (matching backend VIDEO_PIPELINE_STAGES)
export const VIDEO_PIPELINE_STAGES = {
  videoStage1: {
    id: 1,
    name: "Video Generation",
    types: ["lipSyncEditor", "videoPromptGenerator", "videoProcessor"],
    description: "Video Content Generation",
    detailedInfo: "Generate video prompts and process video content based on script analysis.",
  },
  videoStage2: {
    id: 2,
    name: "Video Analysis",
    types: ["videoAnalysis", "videoEditor2"],
    description: "Video Analysis & Editing",
    detailedInfo: "Analyze generated videos and create final edited timeline.",
  },
} as const;

// Helper functions to determine analysis type categories
export const PROCESSOR_TYPES = [
  'actorProcessedImages',
  'locationProcessedImages',
  'keyVisualProcessedImage',
  'processedImages',
  'moderation',
  'categories'
] as const;

export const INDEPENDENT_TYPES = [
  'storyboardGenerator'
] as const;

export const VIDEO_PIPELINE_TYPES = [
  'lipSyncEditor',
  'videoPromptGenerator',
  'videoProcessor',
  'videoAnalysis',
  'videoEditor2'
] as const;

export const BATCH_GENERATOR_TYPES = [
  'promptGenerator',
  'processScenesAndShots'
] as const;

export type AnalysisType = keyof typeof ANALYSIS_TYPES;