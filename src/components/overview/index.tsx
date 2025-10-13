"use client";

import { Box, Divider } from "@mui/material";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { MainImage } from "./MainImage";
import { ActorSlide } from "./ActorSlide";
import { LocationSlide } from "./LocationSlide";
import { SceneSelector } from "./SceneSelector";
import { CharacterList } from "@/components/common/CharecterList";
import { SentimentAnalysis } from "./SentimentAnalysis";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import type { Overview, Scene } from "@/types/overview/types";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { capitalizeWords } from "@/utils/textUtils";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { AnalysisTypeStatus } from "@/types/storyMain/types";
import StandaloneFeedbackPanel from "@/components/common/FeedbackSystem";

interface MainImageContent {
  type: "actor" | "location";
  url: string;
  title: string;
  description: string;
  faceDetection?: {
    boundingBox: {
      xMin: number;
      xMax: number;
      yMin: number;
      yMax: number;
    };
    detectionType: string;
    specificType: string;
    confidence: number;
    width: number;
    height: number;
  };
  hasImage: boolean;
  hasPrompt: boolean;
  hasOriginalPrompt: boolean;
  prompt?: string;
  originalPrompt?: string;
}

interface ActorImageData {
  actorId: number;
  actorVersionId: number;
  signedUrl?: string;
  thumbnailPath?: string;
  actorPrompt?: string;
  originalActorPrompt?: string;
  versions?: {
    current: any;
    archived: Record<number, any>;
    totalVersions?: number;
    totalEdits?: number;
    editHistory?: any[];
  };
}

interface LocationImageData {
  locationId: number;
  locationVersionId: number;
  promptType?: string;
  signedUrl?: string;
  thumbnailPath?: string;
  locationPrompt?: string;
  originalLocationPrompt?: string;
  versions?: {
    current: any;
    archived: Record<number, any>;
    totalVersions?: number;
    totalEdits?: number;
    editHistory?: any[];
  };
}

interface OverviewProps {
  scriptId?: string;
  versionId?: string;
  statuses?: AnalysisTypeStatus;
}

const DEFAULT_IMAGE = "/placeHolder.webp";

/**
 * Overview - Optimized dashboard overview component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for expensive computations
 * - Proper useCallback for handlers passed as props
 */
export default function Overview({
  scriptId,
  versionId,
  statuses,
}: OverviewProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // DATA FETCHING
  // ==========================================
  const { data, isLoading, error, refetch } =
    useScriptDashboardAnalysis<Overview>(
      scriptId || "",
      versionId || "",
      "overview"
    );

  // ==========================================
  // STATE
  // ==========================================
  const [currentActorIndex, setCurrentActorIndex] = useState(0);
  const [currentLocationIndex, setCurrentLocationIndex] = useState(0);
  const [isAudioProcessorCompleted, setIsAudioProcessorCompleted] =
    useState(false);
  const [selectedScene, setSelectedScene] = useState<Scene | null>(null);
  const [mainImageContent, setMainImageContent] = useState<MainImageContent>({
    type: "actor",
    url: DEFAULT_IMAGE,
    title: "",
    description: "",
    hasImage: false,
    hasPrompt: false,
    hasOriginalPrompt: false,
  });
  const [currentActorImageData, setCurrentActorImageData] = useState<
    ActorImageData | undefined
  >(undefined);
  const [currentLocationImageData, setCurrentLocationImageData] = useState<
    LocationImageData | undefined
  >(undefined);

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const summary = useMemo(() => {
    if (!data?.scenes || !data?.actors || !data?.locations) return undefined;

    const actorsCount = data.actors.filter(
      (actor) => actor.actorId !== -1
    ).length;

    const locationsCount = data.locations.filter(
      (location) => location.locationId !== -1
    ).length;

    let totalShots = 0;
    let totalDialogues = 0;
    let totalFoleyItems = 0;
    let totalMusicTracks = 0;
    let totalRoomTones = 0;

    data.scenes.forEach((scene) => {
      scene.shots?.forEach((shot) => {
        totalShots++;

        if (shot.dialogue?.dialogueContent) {
          totalDialogues++;
        }

        if (shot.dialogues?.length) {
          totalDialogues += shot.dialogues.length;
        }
      });

      if (scene.audioDetails) {
        if (scene.audioDetails.foley?.length) {
          totalFoleyItems += scene.audioDetails.foley.length;
        }

        if (scene.audioDetails.music) {
          totalMusicTracks++;
        }

        if (scene.audioDetails.roomTone) {
          totalRoomTones++;
        }
      }
    });

    return {
      actors: actorsCount,
      locations: locationsCount,
      scenes: data.scenes.length,
      shots: totalShots,
      dialogues: totalDialogues,
      foleyItems: totalFoleyItems,
      musicTracks: totalMusicTracks,
      roomTones: totalRoomTones,
      totalAudioElements:
        totalDialogues + totalFoleyItems + totalMusicTracks + totalRoomTones,
    };
  }, [data]);

  const currentActor = useMemo(
    () => data?.actors?.[currentActorIndex],
    [data?.actors, currentActorIndex]
  );

  const currentLocation = useMemo(
    () => data?.locations?.[currentLocationIndex],
    [data?.locations, currentLocationIndex]
  );

  const shouldShowPrompt = useCallback(
    (hasImage: boolean, hasPrompt: boolean): boolean => {
      return !hasImage && hasPrompt;
    },
    []
  );

  // ==========================================
  // EVENT HANDLERS
  // ==========================================
  const updateMainImageWithActor = useCallback((actor: any) => {
    if (!actor) return;

    const hasImage = Boolean(actor.signedUrl);
    const hasPrompt = Boolean(actor.actorPrompt);
    const hasOriginalPrompt = Boolean(actor.originalActorPrompt);

    setMainImageContent({
      type: "actor",
      url: actor.signedUrl || DEFAULT_IMAGE,
      title: actor.actorName || "Unnamed Actor",
      description: `${actor.actorArchetype || ""} - ${
        actor.actorType || ""
      }`.trim(),
      faceDetection: actor.faceDetection,
      hasImage,
      hasPrompt,
      hasOriginalPrompt,
      prompt: actor.actorPrompt,
      originalPrompt: actor.originalActorPrompt,
    });

    setCurrentActorImageData({
      actorId: actor.actorId,
      actorVersionId: actor.actorVersionId,
      signedUrl: actor.signedUrl,
      thumbnailPath: actor.thumbnailPath,
      actorPrompt: actor.actorPrompt,
      originalActorPrompt: actor.originalActorPrompt,
      versions: actor.versions,
    });

    setCurrentLocationImageData(undefined);
  }, []);

  const updateMainImageWithLocation = useCallback((location: any) => {
    if (!location) return;

    const signedUrl =
      location.signedUrls?.wideShotLocationSetPrompt?.signedUrl ||
      DEFAULT_IMAGE;
    const hasImage = Boolean(signedUrl && signedUrl !== DEFAULT_IMAGE);
    const hasPrompt = Boolean(location.locationPrompt);
    const hasOriginalPrompt = Boolean(location.originalLocationPrompt);

    const sceneNumbers = location.sceneIds?.join(", ") || "";
    const locationDescription = [
      location.locationArchetype,
      location.locationClass,
      sceneNumbers && `(Scenes ${sceneNumbers})`,
    ]
      .filter(Boolean)
      .join(" - ");

    setMainImageContent({
      type: "location",
      url: signedUrl,
      title: location.locationName || "Unnamed Location",
      description: locationDescription,
      hasImage,
      hasPrompt,
      hasOriginalPrompt,
      prompt: location.locationPrompt,
      originalPrompt: location.originalLocationPrompt,
    });

    setCurrentLocationImageData({
      locationId: location.locationId,
      locationVersionId: location.locationVersionId,
      promptType: "wideShotLocationSetPrompt",
      signedUrl: signedUrl === DEFAULT_IMAGE ? undefined : signedUrl,
      thumbnailPath: location.thumbnailPath,
      locationPrompt: location.locationPrompt,
      originalLocationPrompt: location.originalLocationPrompt,
      versions: location.versions,
    });

    setCurrentActorImageData(undefined);
  }, []);

  const handlePromptUpdate = useCallback(
    (newPrompt: string, type: "actor" | "location") => {
      console.log(`Overview: ${type} prompt updated:`, newPrompt);

      if (type === "actor") {
        setCurrentActorImageData((prev) => {
          if (!prev) return undefined;
          return { ...prev, actorPrompt: newPrompt };
        });

        if (mainImageContent.type === "actor") {
          setMainImageContent((prev) => ({ ...prev, prompt: newPrompt }));
        }
      } else if (type === "location") {
        setCurrentLocationImageData((prev) => {
          if (!prev) return undefined;
          return { ...prev, locationPrompt: newPrompt };
        });

        if (mainImageContent.type === "location") {
          setMainImageContent((prev) => ({ ...prev, prompt: newPrompt }));
        }
      }

      setTimeout(() => {
        handleDataRefresh();
      }, 1000);
    },
    [mainImageContent.type]
  );

  const handleImageUpdate = useCallback(
    (updatedImageData: any, type: "actor" | "location") => {
      console.log(
        `Overview: ${type} image updated with data:`,
        updatedImageData
      );

      if (type === "actor") {
        setCurrentActorImageData((prev) => {
          if (!prev) return undefined;
          return {
            ...prev,
            signedUrl: updatedImageData.signedUrl || prev.signedUrl,
            thumbnailPath: updatedImageData.thumbnailPath || prev.thumbnailPath,
            versions: updatedImageData.versions || prev.versions,
          };
        });

        if (mainImageContent.type === "actor") {
          const newUrl =
            updatedImageData.thumbnailPath ||
            updatedImageData.signedUrl ||
            mainImageContent.url;

          setMainImageContent((prev) => ({
            ...prev,
            url: newUrl,
            hasImage: Boolean(newUrl && newUrl !== DEFAULT_IMAGE),
          }));
        }
      } else if (type === "location") {
        setCurrentLocationImageData((prev) => {
          if (!prev) return undefined;
          return {
            ...prev,
            signedUrl: updatedImageData.signedUrl || prev.signedUrl,
            thumbnailPath: updatedImageData.thumbnailPath || prev.thumbnailPath,
            versions: updatedImageData.versions || prev.versions,
          };
        });

        if (mainImageContent.type === "location") {
          const newUrl =
            updatedImageData.thumbnailPath ||
            updatedImageData.signedUrl ||
            mainImageContent.url;

          setMainImageContent((prev) => ({
            ...prev,
            url: newUrl,
            hasImage: Boolean(newUrl && newUrl !== DEFAULT_IMAGE),
          }));
        }
      }
    },
    [mainImageContent.type, mainImageContent.url]
  );

  const handleDataRefresh = useCallback(() => {
    console.log("Overview: Refreshing data...");
    refetch();
  }, [refetch]);

  const handleAudioUpdate = useCallback(() => {
    console.log("Overview: Audio updated, refreshing relevant data...");
  }, []);

  const handleNextActor = useCallback(() => {
    if (!data?.actors?.length) return;
    setCurrentActorIndex((prev) =>
      prev === data.actors.length - 1 ? 0 : prev + 1
    );
  }, [data?.actors]);

  const handlePrevActor = useCallback(() => {
    if (!data?.actors?.length) return;
    setCurrentActorIndex((prev) =>
      prev === 0 ? data.actors.length - 1 : prev - 1
    );
  }, [data?.actors]);

  const handleNextLocation = useCallback(() => {
    if (!data?.locations?.length) return;
    setCurrentLocationIndex((prev) =>
      prev === data.locations.length - 1 ? 0 : prev + 1
    );
  }, [data?.locations]);

  const handlePrevLocation = useCallback(() => {
    if (!data?.locations?.length) return;
    setCurrentLocationIndex((prev) =>
      prev === 0 ? data.locations.length - 1 : prev - 1
    );
  }, [data?.locations]);

  const handleActorImageClick = useCallback(() => {
    if (!data?.actors?.[currentActorIndex]) return;

    const actor = data.actors[currentActorIndex];
    console.log("Actor clicked - updating main image with:", actor.actorName);
    updateMainImageWithActor(actor);
  }, [data?.actors, currentActorIndex, updateMainImageWithActor]);

  const handleLocationImageClick = useCallback(() => {
    if (!data?.locations?.[currentLocationIndex]) return;

    const location = data.locations[currentLocationIndex];
    console.log(
      "Location clicked - updating main image with:",
      location.locationName
    );
    updateMainImageWithLocation(location);
  }, [data?.locations, currentLocationIndex, updateMainImageWithLocation]);

  // ==========================================
  // EFFECTS
  // ==========================================
  useEffect(() => {
    if (
      statuses?.audioProcessor?.status === "Completed" ||
      statuses?.audioProcessor?.status === "Incomplete"
    ) {
      setIsAudioProcessorCompleted(true);
    } else {
      setIsAudioProcessorCompleted(false);
    }
  }, [statuses]);

  useEffect(() => {
    if (!data) return;

    if (data.actors?.length > 0) {
      updateMainImageWithActor(data.actors[0]);
    }

    if (data.scenes?.length > 0) {
      setSelectedScene(data.scenes[0]);
    }
  }, [data, updateMainImageWithActor]);

  // ==========================================
  // EARLY RETURNS
  // ==========================================
  if (isLoading) {
    return <LoadingAnimation message="Overview is loading" />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3, color: "text.primary" }}>
        An error occurred while loading overview data
      </Box>
    );
  }

  if (!data) {
    return (
      <AnalysisInProgress message="Overview analysis is in progress. Please check back later" />
    );
  }

  if (!selectedScene || !currentActor || !currentLocation) {
    return <LoadingAnimation message="Preparing overview..." />;
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Box sx={{ bgcolor: "background.default", p: 0 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "4fr 1fr" },
          gap: 1,
        }}
      >
        {/* Main Image Section */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <MainImage
            imageUrl={mainImageContent.url}
            title={capitalizeWords(mainImageContent.title)}
            description={capitalizeWords(mainImageContent.description)}
            isActor={mainImageContent.type === "actor"}
            summary={summary}
            scriptId={scriptId}
            versionId={versionId}
            actorImageData={
              mainImageContent.type === "actor"
                ? currentActorImageData
                : undefined
            }
            locationImageData={
              mainImageContent.type === "location"
                ? currentLocationImageData
                : undefined
            }
            onImageUpdate={handleImageUpdate}
            onDataRefresh={handleDataRefresh}
            hasImage={mainImageContent.hasImage}
            hasPrompt={mainImageContent.hasPrompt}
            showPromptEditor={shouldShowPrompt(
              mainImageContent.hasImage,
              mainImageContent.hasPrompt
            )}
            prompt={mainImageContent.prompt}
            originalPrompt={mainImageContent.originalPrompt}
            onPromptUpdate={handlePromptUpdate}
          />

          <SceneSelector
            scriptId={scriptId}
            versionId={versionId}
            scenes={data.scenes || []}
            selectedScene={selectedScene}
            actors={data.actors || []}
            locations={data.locations || []}
            onSceneChange={setSelectedScene}
            onAudioUpdate={handleAudioUpdate}
            isAudioProcessorCompleted={isAudioProcessorCompleted}
          />
        </Box>

        {/* Right Column */}
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {/* Actors Section */}
          <Box>
            <ActorSlide
              actor={currentActor}
              onNext={handleNextActor}
              onPrev={handlePrevActor}
              onImageClick={handleActorImageClick}
              currentIndex={currentActorIndex}
              totalActors={data.actors?.length || 0}
            />
            <CharacterList characters={[currentActor]} showScenes={true} />
          </Box>

          <Divider />

          {/* Locations Section */}
          <Box>
            <LocationSlide
              location={currentLocation}
              onNext={handleNextLocation}
              onPrev={handlePrevLocation}
              onImageClick={handleLocationImageClick}
              currentIndex={currentLocationIndex}
              totalLocations={data.locations?.length || 0}
            />
          </Box>

          <Divider />

          {/* Sentiment Analysis Section */}
          <Box>
            <SentimentAnalysis data={data.emotionData} />
          </Box>
        </Box>
      </Box>

      {/* Feedback Component */}
      {scriptId && versionId && (
        <StandaloneFeedbackPanel
          page="overview"
          scriptId={scriptId}
          versionId={versionId}
        />
      )}
    </Box>
  );
}
