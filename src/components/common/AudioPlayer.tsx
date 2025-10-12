"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  Box,
  IconButton,
  Typography,
  Slider,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { PlayArrow, Pause, VolumeUp } from "@mui/icons-material";
import { API_BASE_URL } from "@/config/constants";
import { getCurrentBrand } from "@/config/brandConfig";
import logger from "@/utils/logger";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface AudioPlayerProps {
  audioPath: string;
  initialDuration?: number;
  volumeLevel?: number;
  audioType?: "dialogue" | "foley" | "music" | "roomtone";
}

interface AudioNodes {
  context: AudioContext;
  source: AudioBufferSourceNode | null;
  gainNode: GainNode;
}

// ===========================
// CONSTANTS
// ===========================

// Default volume levels for each audio type (percentage)
const DEFAULT_VOLUMES = {
  dialogue: 100, // Primary audio - full volume
  foley: 30, // -70% from dialogue (subtle sound effects)
  music: 50, // -50% from dialogue (background but still audible)
  roomtone: 10, // -90% from dialogue (ambient background)
};

// ===========================
// MAIN COMPONENT
// ===========================

export default function AudioPlayer({
  audioPath,
  initialDuration,
  volumeLevel,
  audioType = "dialogue",
}: AudioPlayerProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ===========================
  // STATE
  // ===========================

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [sliderValue, setSliderValue] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);
  const [displayDuration, setDisplayDuration] = useState<number>(
    initialDuration || 0
  );

  const initialVolume =
    volumeLevel !== undefined ? volumeLevel : DEFAULT_VOLUMES[audioType];

  const [volume, setVolume] = useState<number>(initialVolume);

  // ===========================
  // REFS
  // ===========================

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const audioNodesRef = useRef<AudioNodes | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);

  // ===========================
  // AUDIO CONTROL FUNCTIONS
  // ===========================

  const updateVolume = useCallback((value: number) => {
    if (audioNodesRef.current?.gainNode) {
      const gainValue = value / 100;
      audioNodesRef.current.gainNode.gain.value = gainValue;
    }
    setVolume(value);
  }, []);

  const cleanupAudio = useCallback(() => {
    if (audioNodesRef.current?.source) {
      try {
        audioNodesRef.current.source.stop();
        audioNodesRef.current.source.disconnect();
        audioNodesRef.current.source = null;
      } catch (error) {
        logger.warn("Error during audio cleanup", error);
      }
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    audioBufferRef.current = null;
    setIsPlaying(false);
    setIsInitialized(false);
    setSliderValue(0);
    pauseTimeRef.current = 0;
    startTimeRef.current = 0;
  }, []);

  const initAudioContext = useCallback(async () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      }

      setIsLoading(true);
      setLoadError(null);

      const url = `${API_BASE_URL}/scripts/stream-audio?filePath=${encodeURIComponent(
        audioPath
      )}`;
      const response = await fetch(url);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer =
        await audioContextRef.current.decodeAudioData(arrayBuffer);

      audioBufferRef.current = audioBuffer;
      setDisplayDuration(audioBuffer.duration);

      const gainNode = audioContextRef.current.createGain();
      gainNode.gain.value = volume / 100;
      gainNode.connect(audioContextRef.current.destination);

      audioNodesRef.current = {
        context: audioContextRef.current,
        source: null,
        gainNode,
      };

      setIsInitialized(true);
      setIsLoading(false);
    } catch (error) {
      logger.error("Error initializing audio", error);
      setLoadError("Failed to load audio file. Please try again.");
      setIsLoading(false);
      setIsInitialized(false);
    }
  }, [audioPath, volume]);

  const startPlayback = useCallback((startFrom: number = 0) => {
    if (
      !audioContextRef.current ||
      !audioBufferRef.current ||
      !audioNodesRef.current
    )
      return;

    if (audioNodesRef.current.source) {
      audioNodesRef.current.source.stop();
      audioNodesRef.current.source.disconnect();
      audioNodesRef.current.source = null;
    }

    try {
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }

      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(audioNodesRef.current.gainNode);

      startTimeRef.current = audioContextRef.current.currentTime - startFrom;
      source.start(0, startFrom);
      audioNodesRef.current.source = source;
      setIsPlaying(true);

      source.onended = () => {
        if (audioNodesRef.current?.source === source) {
          setIsPlaying(false);
          audioNodesRef.current.source = null;
        }
      };
    } catch (error) {
      logger.error("Error starting playback", error);
      setIsPlaying(false);
      if (audioNodesRef.current) {
        audioNodesRef.current.source = null;
      }
    }
  }, []);

  const pausePlayback = useCallback(() => {
    if (audioNodesRef.current?.source) {
      try {
        audioNodesRef.current.source.stop();
        audioNodesRef.current.source.disconnect();
        audioNodesRef.current.source = null;
        pauseTimeRef.current =
          audioContextRef.current!.currentTime - startTimeRef.current;
      } catch (error) {
        logger.error("Error pausing playback", error);
      }
    }
    setIsPlaying(false);
  }, []);

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handlePlayPause = useCallback(async () => {
    if (!isInitialized) {
      await initAudioContext();
      startPlayback(0);
    } else if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback(pauseTimeRef.current);
    }
  }, [
    isPlaying,
    isInitialized,
    initAudioContext,
    pausePlayback,
    startPlayback,
  ]);

  const handleVolumeChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (typeof newValue === "number") {
        updateVolume(newValue);
      }
    },
    [updateVolume]
  );

  const handleSliderChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (typeof newValue === "number") {
        isDraggingRef.current = true;
        setSliderValue(newValue);
      }
    },
    []
  );

  const handleSliderChangeCommitted = useCallback(
    (event: Event | React.SyntheticEvent, newValue: number | number[]) => {
      if (typeof newValue === "number" && audioBufferRef.current) {
        if (audioNodesRef.current?.source) {
          audioNodesRef.current.source.stop();
          audioNodesRef.current.source.disconnect();
          audioNodesRef.current.source = null;
        }

        const seekTime = (newValue / 100) * audioBufferRef.current.duration;
        pauseTimeRef.current = seekTime;

        if (isPlaying) {
          startPlayback(seekTime);
        }
        isDraggingRef.current = false;
      }
    },
    [isPlaying, startPlayback]
  );

  // ===========================
  // UTILITY FUNCTIONS
  // ===========================

  const getCurrentTime = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return 0;
    return isPlaying
      ? audioContextRef.current.currentTime - startTimeRef.current
      : pauseTimeRef.current;
  }, [isPlaying]);

  const getTotalDuration = useCallback(() => {
    return audioBufferRef.current?.duration || displayDuration || 0;
  }, [displayDuration]);

  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // ===========================
  // EFFECTS
  // ===========================

  // Update volume when props change
  useEffect(() => {
    if (volumeLevel !== undefined) {
      updateVolume(volumeLevel);
    } else if (audioType) {
      updateVolume(DEFAULT_VOLUMES[audioType]);
    }
  }, [volumeLevel, audioType, updateVolume]);

  // Reset on audioPath or initialDuration change
  useEffect(() => {
    cleanupAudio();
    if (initialDuration) {
      setDisplayDuration(initialDuration);
    } else {
      setDisplayDuration(0);
    }
    setIsInitialized(false);
  }, [audioPath, initialDuration, cleanupAudio]);

  // Update slider during playback
  useEffect(() => {
    if (!isPlaying || !audioContextRef.current || !audioBufferRef.current)
      return;

    const updateInterval = setInterval(() => {
      if (isDraggingRef.current) return;

      const currentTime =
        audioContextRef.current!.currentTime - startTimeRef.current;
      const progress = (currentTime / audioBufferRef.current!.duration) * 100;
      setSliderValue(Math.min(progress, 100));
    }, 100);

    return () => clearInterval(updateInterval);
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => cleanupAudio();
  }, [cleanupAudio]);

  // ===========================
  // RENDER
  // ===========================

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 2,
        width: "100%",
        position: "relative",
      }}
    >
      <Box sx={{ position: "relative" }}>
        <Tooltip title={isPlaying ? "Pause" : "Play"} arrow>
          <IconButton
            onClick={handlePlayPause}
            disabled={isLoading}
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              width: 40,
              height: 40,
              transition: theme.transitions.create(
                ["background-color", "transform"],
                { duration: theme.transitions.duration.shortest }
              ),
              "&:hover": {
                bgcolor: "primary.dark",
              },
              "&:active": {
                transform: "scale(0.95)",
              },
              "&.Mui-disabled": {
                bgcolor: "action.disabledBackground",
              },
            }}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isPlaying ? (
              <Pause />
            ) : (
              <PlayArrow />
            )}
          </IconButton>
        </Tooltip>
        {isLoading && (
          <CircularProgress
            size={48}
            sx={{
              position: "absolute",
              top: -4,
              left: -4,
              opacity: 0.3,
              color: "primary.main",
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1 }}>
        <Slider
          value={sliderValue}
          onChange={handleSliderChange}
          onChangeCommitted={handleSliderChangeCommitted}
          disabled={isLoading || !isInitialized}
          sx={{
            height: 4,
            "& .MuiSlider-rail": {
              bgcolor: "action.hover",
              opacity: 0.4,
            },
            "& .MuiSlider-track": {
              bgcolor: "primary.main",
              border: "none",
              opacity: 1,
            },
            "& .MuiSlider-thumb": {
              width: 8,
              height: 8,
              bgcolor: "primary.main",
              transition: theme.transitions.create(["width", "height"], {
                duration: theme.transitions.duration.short,
              }),
              "&:hover, &.Mui-focusVisible": {
                width: 12,
                height: 12,
                boxShadow: `0 0 0 8px ${theme.palette.primary.main}20`,
              },
              "&.Mui-active": {
                width: 16,
                height: 16,
              },
            },
          }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {formatTime(getCurrentTime())}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {formatTime(getTotalDuration())}
          </Typography>
        </Box>
        {loadError && (
          <Typography
            variant="caption"
            color="error"
            sx={{ mt: 1, display: "block" }}
          >
            {loadError}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
