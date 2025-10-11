// @constants/feedbackConstants.ts

export type FeedbackPage = 'overview' | 'market' | 'visuals' | 'editor';

// Page tab configurations
export const PAGE_TABS: Record<FeedbackPage, string[]> = {
    overview: ['actors', 'locations', 'scenes', 'audio', 'emotion'],
    market: ['brand', 'audience', 'competitor', 'metrics', 'strategy'],
    visuals: ['storyboard', 'shot', 'effects', 'composition', 'style'],
    editor: ['pacing', 'audio', 'cuts', 'effects', 'timeline']
};

// Page context configurations
export const PAGE_CONTEXTS: Record<FeedbackPage, { title: string; placeholder: string }> = {
    market: {
        title: 'Refining Your Market Strategy',
        placeholder: 'Your project\'s success starts here. Review the foundational analysis of your brand, audience, and competitive landscape to ensure we\'re building on solid ground.'
    },
    overview: {
        title: 'Deconstructing the Narrative',
        placeholder: 'This is where your story comes to life. Dive into the core creative elementsâ€"characters, locations, and scenesâ€"to shape a compelling and resonant narrative.'
    },
    visuals: {
        title: 'Shaping the Cinematic Language',
        placeholder: 'Every frame matters. Review the proposed art direction and cinematographic blueprint to define the unique visual identity of your project before production begins.'
    },
    editor: {
        title: 'Polishing the End Product',
        placeholder: 'The final assembly is where magic happens. Provide feedback on the edit, sound, color, and effects to ensure the final output is polished, powerful, and perfect.'
    }
};

// Quick tags for each page
export const QUICK_TAGS: Record<FeedbackPage, string[]> = {
    overview: [
        "@scene-identification",
        "@scene-flow",
        "@narrative-arc",
        "@story-structure",
        "@pacing",
        "@timing",
        "@brand-integration",
        "@shot-identification",
        "@location-identity",
        "@location-scouting",
        "@world-building",
        "@set-design",
        "@atmosphere",
        "@cast-identity",
        "@character-voice",
        "@dialogue-quality",
        "@subtext",
        "@exposition",
        "@emotional-arc",
        "@sentiment-analysis",
        "@tone-shift",
        "@peak-emotion",
        "@music-sentiment-arc",
        "@actor-sentiment-arc",
        "@music-design",
        "@foley-design",
        "@room-tone-design",
        "@dialogue-identification",
        "@linguistic-accuracy",
        "@contextual-appropriateness",
        "@thematic-analysis",
        "/narrative",
        "/characters",
        "/setting",
        "/soundscape",
        "/theme",
        "#emotional-impact",
        "#story-coherence",
        "#immersive",
        "#engaging"
    ],
    market: [
        "@brand-identity",
        "@competitive-analysis",
        "@demographics",
        "@psychographics",
        "@cultural-fit",
        "@unmet-needs",
        "@logline-clarity",
        "@hook-impact",
        "@cta-strength",
        "@core-message",
        "@benchmark-comparison",
        "@performance-rating",
        "@strengths",
        "@improvements",
        "@brand-colors",
        "@typography",
        "@visual-identity",
        "@font-pairing",
        "@brand-tone",
        "@brand-personality",
        "@audience-context",
        "@market-context",
        "@brand-alignment",
        "@cultural-sensitivity",
        "@brand-integration",
        "@brand-compliance",
        "@audience-alignment",
        "@cultural-alignment",
        "@market-overview",
        "@script-scores",
        "@script-rating",
        "@data-analytics",
        "/brand-identity",
        "/audience-profile",
        "/script-metrics",
        "/market-research",
        "/analytics",
        "#brand-consistency",
        "#market-fit",
        "#audience-engagement",
        "#competitive-edge",
        "#data-driven"
    ],
    visuals: [
        "@scene-identification",
        "@brand-integration",
        "@composition",
        "@framing",
        "@rule-of-thirds",
        "@focal-point",
        "@product-shots",
        "@cinematic-feel",
        "@spatial-logic",
        "@visual-continuity",
        "@creative-direction",
        "@character-definition",
        "@product-integration",
        "@product-quality",
        "@audience-alignment",
        "@art-direction",
        "@mood",
        "@lighting-style",
        "@shadows-highlights",
        "@time-of-day",
        "@storyboard-quality",
        "@environment-fidelity",
        "@camera-specs",
        "@performance-capture",
        "@camera-angle",
        "@camera-movement",
        "@shot-size",
        "@visual-style",
        "@aesthetic",
        "@color-grade",
        "@vfx",
        "@storyboard",
        "@shot",
        "/storyboard",
        "/cinematography",
        "/composition",
        "/effects",
        "/style",
        "#visual-cohesion",
        "#cinematic-quality",
        "#visual-consistency",
        "#immersive"
    ],
    editor: [
        "@pacing",
        "@rhythm",
        "@audio-mix",
        "@dialogue-clarity",
        "@music-level",
        "@sound-design",
        "@audio-sync",
        "@transitions",
        "@on-screen-text",
        "@graphics",
        "@timeline-integrity",
        "@lip-sync",
        "@overall-impact",
        "@brand-fit",
        "@final-review",
        "@message-clarity",
        "@color-grade",
        "@final-look",
        "/pacing",
        "/sound-mix",
        "/transitions",
        "/finishing",
        "#smooth",
        "#polished",
        "#timing",
        "#impact"
    ]
};

// Rating messages
export const RATING_MESSAGES: Record<number, string> = {
    1: '1 Star? Help us improve!',
    2: '2 Stars? We can do better!',
    3: '3 Stars? Good!',
    4: '4 Stars? Great!',
    5: '5 Stars? Love it!'
};

export interface FeedbackField {
    label: string;
    placeholder: string;
    exampleTags: string[];
    tabs: string[];
}

export const SECTION_QUESTIONS: Record<FeedbackPage, FeedbackField[]> = {
    market: [
        {
            label: 'Brand Identity & Positioning',
            placeholder: 'Does the Brand Positioning Statement accurately represent your brand\'s unique value proposition and differentiation in the market?',
            exampleTags: ['@brand-identity', '@brand-tone', '@brand-personality', '@brand-alignment'],
            tabs: ['brand']
        },
        {
            label: 'Target Audience Profile',
            placeholder: 'Do the identified Age, Gender, Cultural Background, and Emotional Needs accurately reflect your target consumer?',
            exampleTags: ['@demographics', '@psychographics', '@cultural-fit', '@unmet-needs'],
            tabs: ['audience']
        },
        {
            label: 'Competitive Analysis & Benchmarking',
            placeholder: 'How does our project\'s strategic approach compare to competitors? Are the identified market gaps and opportunities valid?',
            exampleTags: ['@competitive-analysis', '@benchmark-comparison', '@market-context', '@strengths'],
            tabs: ['competitor']
        },
        {
            label: 'Script Metrics & Performance',
            placeholder: 'Does the Logline effectively capture the essence of the story? How do the script metrics align with performance expectations?',
            exampleTags: ['@logline-clarity', '@script-scores', '@performance-rating', '@data-analytics'],
            tabs: ['metrics']
        },
        {
            label: 'Brand Strategy & Visual Identity',
            placeholder: 'Do the proposed Brand Colors, Typography, and overall strategic direction align with the brand\'s identity and market positioning?',
            exampleTags: ['@brand-colors', '@typography', '@visual-identity', '@brand-compliance'],
            tabs: ['strategy']
        }
    ],
    overview: [
        {
            label: 'Cast Performance & Character Development',
            placeholder: 'Do the selected actors embody the characters effectively? Does their performance align with the brand and story requirements?',
            exampleTags: ['@cast-identity', '@character-voice', '@actor-sentiment-arc', '@brand-integration'],
            tabs: ['actors']
        },
        {
            label: 'Location Scouting & Set Design',
            placeholder: 'Do the chosen locations and environments feel authentic and contribute effectively to the story\'s atmosphere and mood?',
            exampleTags: ['@location-scouting', '@set-design', '@world-building', '@atmosphere'],
            tabs: ['locations']
        },
        {
            label: 'Scene Structure & Narrative Flow',
            placeholder: 'Reviewing the scene-by-scene breakdown, does the narrative unfold logically? Is the pacing effective in building tension and emotion?',
            exampleTags: ['@scene-flow', '@narrative-arc', '@pacing', '@story-structure'],
            tabs: ['scenes']
        },
        {
            label: 'Audio Design & Sound Elements',
            placeholder: 'Does the audio design including music, foley, and dialogue effectively support the narrative and emotional arc?',
            exampleTags: ['@music-design', '@foley-design', '@dialogue-identification', '@room-tone-design'],
            tabs: ['audio']
        },
        {
            label: 'Emotional Journey & Sentiment Analysis',
            placeholder: 'Does the Sentiment Analysis graph accurately reflect the intended emotional journey of the story? Are the emotional highs and lows impactful?',
            exampleTags: ['@emotional-arc', '@sentiment-analysis', '@tone-shift', '@peak-emotion'],
            tabs: ['emotion']
        }
    ],
    visuals: [
        {
            label: 'Storyboard Quality & Visual Planning',
            placeholder: 'Do the storyboard frames effectively communicate the visual story? Are the environments and settings designed to support the narrative?',
            exampleTags: ['@storyboard-quality', '@environment-fidelity', '@visual-continuity', '@art-direction'],
            tabs: ['storyboard']
        },
        {
            label: 'Shot Composition & Cinematography',
            placeholder: 'Are the proposed Camera Angles, Movements, and Shot Sizes effective in telling the story and creating the desired visual impact?',
            exampleTags: ['@camera-angle', '@camera-movement', '@shot-size', '@cinematic-feel'],
            tabs: ['shot']
        },
        {
            label: 'Visual Effects & Post-Production',
            placeholder: 'How effective are the planned visual effects and post-production elements in enhancing the story without overshadowing it?',
            exampleTags: ['@vfx', '@color-grade', '@visual-style', '@aesthetic'],
            tabs: ['effects']
        },
        {
            label: 'Frame Composition & Visual Balance',
            placeholder: 'How effective is the composition within each shot? Does the framing guide the viewer\'s eye and emphasize the right story elements?',
            exampleTags: ['@composition', '@framing', '@rule-of-thirds', '@focal-point'],
            tabs: ['composition']
        },
        {
            label: 'Overall Visual Style & Cohesion',
            placeholder: 'Looking at the visual approach as a whole, does it create a cohesive and compelling visual language for the entire project?',
            exampleTags: ['@visual-style', '@art-direction', '@aesthetic', '@visual-consistency'],
            tabs: ['style']
        }
    ],
    editor: [
        {
            label: 'Edit Pacing & Rhythm',
            placeholder: 'Does the overall pacing feel right? Are the cuts and transitions serving the story effectively without feeling rushed or dragging?',
            exampleTags: ['@pacing', '@rhythm', '@timeline-integrity', '@lip-sync'],
            tabs: ['pacing']
        },
        {
            label: 'Audio Mix & Sound Balance',
            placeholder: 'Listen to the layers in the timeline. Is the dialogue clear? Is there a good balance between music, dialogue, and sound effects?',
            exampleTags: ['@audio-mix', '@dialogue-clarity', '@sound-design', '@music-level'],
            tabs: ['audio']
        },
        {
            label: 'Cut Quality & Transitions',
            placeholder: 'Are the transitions between shots smooth and purposeful? Do the cuts enhance the storytelling and maintain viewer engagement?',
            exampleTags: ['@transitions', '@cuts', '@continuity', '@flow'],
            tabs: ['cuts']
        },
        {
            label: 'Visual Effects & Graphics Integration',
            placeholder: 'Are any visual effects or on-screen text integrated effectively? Do they enhance rather than distract from the core message?',
            exampleTags: ['@vfx', '@on-screen-text', '@graphics', '@integration'],
            tabs: ['effects']
        },
        {
            label: 'Timeline Structure & Final Assembly',
            placeholder: 'Does the final edited piece achieve its strategic goals and align perfectly with the brand\'s identity and messaging?',
            exampleTags: ['@timeline-integrity', '@overall-impact', '@brand-fit', '@final-review'],
            tabs: ['timeline']
        }
    ]
};