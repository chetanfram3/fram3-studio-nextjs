// creativeConstants.ts
export type ContentType = "IMAGE" | "VIDEO" | "AUDIO" | "TEXT";

export interface ContentOption {
  key: string;
  value: string;
  title: string;
  description: string;
  path: string;
  isEnabled: boolean;
}

export interface ContentTypeConfig {
  key: ContentType;
  isEnabled: boolean;
  options: ContentOption[];
}

export const CREATIVE_CONSTANTS: Record<ContentType, ContentTypeConfig> = {
  IMAGE: {
    key: "IMAGE",
    isEnabled: true,
    options: [
      {
        key: "product-mockup",
        value: "Product Mockup",
        title: "Product Mockup",
        description: "Create realistic product mockups for marketing and presentations",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "storyboards",
        value: "Storyboards",
        title: "Storyboards",
        description: "Design visual storyboards for videos, films, or animations",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "character-design",
        value: "Character Design",
        title: "Character Design",
        description: "Generate unique character designs for games, animations, or stories",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "logo-creation",
        value: "Logo Creation",
        title: "Logo Creation",
        description: "Design professional logos and brand identities",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "social-media-graphics",
        value: "Social Media Graphics",
        title: "Social Media Graphics",
        description: "Create eye-catching graphics for social media platforms",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "poster-design",
        value: "Poster Design",
        title: "Poster Design",
        description: "Design impactful posters for events, promotions, or campaigns",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "infographics",
        value: "Infographics",
        title: "Infographics",
        description: "Transform data and information into visual infographics",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "brand-assets",
        value: "Brand Assets",
        title: "Brand Assets",
        description: "Create comprehensive brand asset packages and style guides",
        path: "/ai-script-generator",
        isEnabled: false,
      },
    ],
  },
  VIDEO: {
    key: "VIDEO",
    isEnabled: true,
    options: [
      {
        key: "commercial",
        value: "Commercial",
        title: "Commercial",
        description: "Produce engaging video commercials for products or services",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "explainer-video",
        value: "Explainer Video",
        title: "Explainer Video",
        description: "Create clear explainer videos to showcase concepts or products",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "social-media-video",
        value: "Social Media Video",
        title: "Social Media Video",
        description: "Generate optimized videos for social media platforms",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "trailer",
        value: "Trailer",
        title: "Trailer",
        description: "A Trailer for your product or film",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "tutorial",
        value: "Tutorial",
        title: "Tutorial",
        description: "Build educational tutorial videos step-by-step",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "product-demo",
        value: "Product Demo",
        title: "Product Demo",
        description: "Showcase product features through demonstration videos",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "brand-story",
        value: "Brand Story",
        title: "Brand Story",
        description: "Tell compelling brand stories through video narratives",
        path: "/ai-script-generator",
        isEnabled: false,
      },
      {
        key: "event-highlights",
        value: "Event Highlights",
        title: "Event Highlights",
        description: "Capture and edit event highlights into shareable videos",
        path: "/ai-script-generator",
        isEnabled: false,
      },
    ],
  },
  AUDIO: {
    key: "AUDIO",
    isEnabled: false,
    options: [
      {
        key: "podcast-intro",
        value: "Podcast Intro",
        title: "Podcast Intro",
        description: "Create catchy podcast intros to hook your audience",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "background-music",
        value: "Background Music",
        title: "Background Music",
        description: "Generate custom background music for videos or presentations",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "voiceover",
        value: "Voiceover",
        title: "Voiceover",
        description: "Produce professional voiceovers for various content types",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "sound-effects",
        value: "Sound Effects",
        title: "Sound Effects",
        description: "Design unique sound effects for media projects",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "jingle-creation",
        value: "Jingle Creation",
        title: "Jingle Creation",
        description: "Craft memorable jingles for branding and advertising",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "audio-logo",
        value: "Audio Logo",
        title: "Audio Logo",
        description: "Develop distinctive audio logos for brand identity",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "meditation-sounds",
        value: "Meditation Sounds",
        title: "Meditation Sounds",
        description: "Create calming meditation and relaxation soundscapes",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "nature-sounds",
        value: "Nature Sounds",
        title: "Nature Sounds",
        description: "Generate ambient nature sounds for various applications",
        path: "/ai-script-generator",
        isEnabled: true,
      },
    ],
  },
  TEXT: {
    key: "TEXT",
    isEnabled: false,
    options: [
      {
        key: "blog-post",
        value: "Blog Post",
        title: "Blog Post",
        description: "Write engaging blog posts on any topic",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "social-media-caption",
        value: "Social Media Caption",
        title: "Social Media Caption",
        description: "Generate compelling captions for social media posts",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "email-newsletter",
        value: "Email Newsletter",
        title: "Email Newsletter",
        description: "Create professional email newsletters for campaigns",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "product-description",
        value: "Product Description",
        title: "Product Description",
        description: "Write persuasive product descriptions that convert",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "script-writing",
        value: "Script Writing",
        title: "Script Writing",
        description: "Develop scripts for videos, podcasts, or presentations",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "story-creation",
        value: "Story Creation",
        title: "Story Creation",
        description: "Craft creative stories and narratives",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "press-release",
        value: "Press Release",
        title: "Press Release",
        description: "Write professional press releases for announcements",
        path: "/ai-script-generator",
        isEnabled: true,
      },
      {
        key: "ad-copy",
        value: "Ad Copy",
        title: "Ad Copy",
        description: "Create high-converting advertising copy",
        path: "/ai-script-generator",
        isEnabled: true,
      },
    ],
  },
};

// Utility functions
export const getContentTypeConfig = (type: ContentType): ContentTypeConfig => {
  return CREATIVE_CONSTANTS[type];
};

export const getContentOption = (
  type: ContentType,
  optionKey: string
): ContentOption | undefined => {
  return CREATIVE_CONSTANTS[type].options.find(
    (option) => option.key === optionKey
  );
};

export const getEnabledOptions = (type: ContentType): ContentOption[] => {
  const config = getContentTypeConfig(type);
  if (!config.isEnabled) return [];
  return config.options.filter((option) => option.isEnabled);
};

export const getAllEnabledContentTypes = (): ContentType[] => {
  return (Object.keys(CREATIVE_CONSTANTS) as ContentType[]).filter(
    (key) => CREATIVE_CONSTANTS[key].isEnabled
  );
};