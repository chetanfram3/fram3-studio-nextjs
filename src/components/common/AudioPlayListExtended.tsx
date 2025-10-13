"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Slider,
  Tooltip,
  useTheme,
} from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";
import { PlayArrow as PlayIcon, Pause as PauseIcon } from "@mui/icons-material";
import AudioVisualizer from "./AudioVisualizer";
import { API_BASE_URL } from "@/config/constants";
import logger from "@/utils/logger";
import type { AudioItem } from "@/types/storyMain/types";

/**
 * Type-safe interfaces
 */
interface ExtendedAudioPlaylistProps {
  audioPlaylist: AudioItem[];
  title?: string;
}

interface AudioNodes {
  context: AudioContext;
  analyser: AnalyserNode;
  gainNode: GainNode;
}

interface TrackSegment {
  start: number;
  end: number;
  sceneId: number;
}

/**
 * ExtendedAudioPlaylist Component
 *
 * Advanced audio player with visualization, scene tracking, and scrubbing.
 * Uses Web Audio API for playback and analysis with concatenated audio buffers.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
export default function ExtendedAudioPlaylist({
  audioPlaylist,
  title = "Script Narrative",
}: ExtendedAudioPlaylistProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  const [currentScene, setCurrentScene] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [audioNodes, setAudioNodes] = useState<AudioNodes | null>(null);
  const [segments, setSegments] = useState<TrackSegment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sliderValue, setSliderValue] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioBufferRef = useRef<AudioBuffer | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseTimeRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const isInitializedRef = useRef<boolean>(false);

  // React 19: useCallback for audio context initialization
  const initAudioContext = useCallback(async () => {
    try {
      // Don't reinitialize if already done
      if (
        isInitializedRef.current &&
        audioContextRef.current?.state !== "closed"
      ) {
        return;
      }

      // Create new context if needed
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed"
      ) {
        audioContextRef.current = new (window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext!)();
      }

      setIsLoading(true);
      setLoadError(null);

      // Load all audio files in parallel
      const audioBuffers = await Promise.all(
        audioPlaylist.map(async (item) => {
          const url = `${API_BASE_URL}/scripts/stream-audio?filePath=${encodeURIComponent(
            item.path
          )}`;
          const response = await fetch(url);

          if (!response.ok) {
            throw new Error(`Failed to fetch audio: ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          return await audioContextRef.current!.decodeAudioData(arrayBuffer);
        })
      );

      // Calculate total duration and create segments
      let currentTime = 0;
      const newSegments = audioBuffers.map((buffer, index) => {
        const segment = {
          start: currentTime,
          end: currentTime + buffer.duration,
          sceneId: audioPlaylist[index].sceneId,
        };
        currentTime += buffer.duration;
        return segment;
      });
      setSegments(newSegments);

      // Concatenate audio buffers
      const totalLength = audioBuffers.reduce(
        (acc, buf) => acc + buf.length,
        0
      );
      const concatenatedBuffer = audioContextRef.current.createBuffer(
        audioBuffers[0].numberOfChannels,
        totalLength,
        audioBuffers[0].sampleRate
      );

      for (let i = 0; i < audioBuffers[0].numberOfChannels; i++) {
        const channel = concatenatedBuffer.getChannelData(i);
        let offset = 0;
        audioBuffers.forEach((buffer) => {
          channel.set(buffer.getChannelData(i), offset);
          offset += buffer.length;
        });
      }

      audioBufferRef.current = concatenatedBuffer;

      // Create audio nodes
      const analyser = audioContextRef.current.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const gainNode = audioContextRef.current.createGain();
      gainNode.connect(audioContextRef.current.destination);
      analyser.connect(gainNode);

      setAudioNodes({
        context: audioContextRef.current,
        analyser,
        gainNode,
      });

      isInitializedRef.current = true;
      setIsLoading(false);
    } catch (error) {
      logger.error("Error initializing audio:", error);
      setLoadError("Failed to load audio files. Please try again.");
      setIsLoading(false);
      isInitializedRef.current = false;
    }
  }, [audioPlaylist]);

  // React 19: useCallback for starting playback
  const startPlayback = useCallback(
    (startFrom: number = 0) => {
      // Check if context exists and is not closed
      if (
        !audioContextRef.current ||
        audioContextRef.current.state === "closed" ||
        !audioBufferRef.current ||
        !audioNodes
      ) {
        logger.warn("Cannot start playback: Audio context not ready");
        return;
      }

      // Stop current playback if any
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (error) {
          // Ignore errors when stopping
        }
        sourceNodeRef.current = null;
      }

      try {
        // Resume audio context if suspended
        if (audioContextRef.current.state === "suspended") {
          audioContextRef.current.resume();
        }

        // Create and configure new source
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(audioNodes.analyser);

        // Start playback
        startTimeRef.current = audioContextRef.current.currentTime - startFrom;
        source.start(0, startFrom);
        sourceNodeRef.current = source;
        setIsPlaying(true);

        // Handle playback end
        source.onended = () => {
          if (sourceNodeRef.current === source) {
            setIsPlaying(false);
            sourceNodeRef.current = null;
          }
        };
      } catch (error) {
        logger.error("Error starting playback:", error);
        setIsPlaying(false);
        sourceNodeRef.current = null;
      }
    },
    [audioNodes]
  );

  // React 19: useCallback for pausing playback
  const pausePlayback = useCallback(() => {
    if (sourceNodeRef.current && audioContextRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
        sourceNodeRef.current = null;
        pauseTimeRef.current =
          audioContextRef.current.currentTime - startTimeRef.current;
      } catch (error) {
        logger.error("Error pausing playback:", error);
      }
    }
    setIsPlaying(false);
  }, []);

  // React 19: useCallback for play/pause toggle
  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback(pauseTimeRef.current);
    }
  }, [isPlaying, pausePlayback, startPlayback]);

  // React 19: useCallback for slider change
  const handleSliderChange = useCallback(
    (event: Event, newValue: number | number[]) => {
      if (typeof newValue === "number") {
        isDraggingRef.current = true;
        setSliderValue(newValue);
      }
    },
    []
  );

  // React 19: useCallback for slider change committed
  const handleSliderChangeCommitted = useCallback(
    (event: Event | React.SyntheticEvent, newValue: number | number[]) => {
      if (typeof newValue === "number" && audioBufferRef.current) {
        // Stop any existing playback
        if (sourceNodeRef.current) {
          try {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
          } catch (error) {
            // Ignore errors
          }
          sourceNodeRef.current = null;
        }

        const seekTime = (newValue / 100) * audioBufferRef.current.duration;
        pauseTimeRef.current = seekTime;

        // Always start playback after seeking
        startPlayback(seekTime);

        // Update current scene based on seek position
        const newScene = segments.findIndex(
          (seg) => seekTime >= seg.start && seekTime < seg.end
        );
        if (newScene !== -1) {
          setCurrentScene(newScene);
        }

        isDraggingRef.current = false;
      }
    },
    [startPlayback, segments]
  );

  // React 19: useCallback for time formatting
  const formatTime = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  // React 19: useCallback for getting current time
  const getCurrentTime = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return 0;
    return isPlaying
      ? audioContextRef.current.currentTime - startTimeRef.current
      : pauseTimeRef.current;
  }, [isPlaying]);

  // React 19: useCallback for getting total duration
  const getTotalDuration = useCallback(() => {
    return audioBufferRef.current?.duration || 0;
  }, []);

  // React 19: useMemo for theme-based colors
  const themeColors = useMemo(
    () => ({
      backgroundColor: theme.palette.background.default,
      textColor: theme.palette.primary.main,
      secondaryTextColor: theme.palette.text.secondary,
      visualizerBgColor:
        theme.palette.mode === "dark"
          ? "rgba(0, 0, 0, 0.3)"
          : "rgba(0, 0, 0, 0.1)",
    }),
    [theme.palette]
  );

  // Effect to update slider and current scene during playback
  useEffect(() => {
    if (!isPlaying || !audioContextRef.current || !audioBufferRef.current)
      return;

    const updateInterval = setInterval(() => {
      if (isDraggingRef.current) return;

      const currentTime =
        audioContextRef.current!.currentTime - startTimeRef.current;
      const progress = (currentTime / audioBufferRef.current!.duration) * 100;
      setSliderValue(progress);

      // Update current scene
      const newScene = segments.findIndex(
        (seg) => currentTime >= seg.start && currentTime < seg.end
      );
      if (newScene !== -1 && newScene !== currentScene) {
        setCurrentScene(newScene);
      }
    }, 100);

    return () => clearInterval(updateInterval);
  }, [isPlaying, segments, currentScene]);

  // Effect to initialize on mount
  useEffect(() => {
    initAudioContext();

    // Cleanup function - DON'T close context, just stop playback
    return () => {
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
          sourceNodeRef.current.disconnect();
        } catch (error) {
          // Ignore errors on cleanup
        }
        sourceNodeRef.current = null;
      }
      // DON'T close the audio context here - it prevents re-initialization
      // The context will be cleaned up when the browser unloads
    };
  }, [initAudioContext]);

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "400px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        p: 3,
        bgcolor: themeColors.backgroundColor,
        borderRadius: `${brand.borderRadius}px`,
        color: themeColors.textColor,
        borderColor: theme.palette.divider,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          mb: 4,
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Typography
          variant="h6"
          sx={{
            color: themeColors.textColor,
            fontWeight: 600,
            fontFamily: brand.fonts.heading,
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 2,
          width: "100%",
        }}
      >
        <Tooltip title={isPlaying ? "Pause" : "Play"}>
          <IconButton
            onClick={handlePlayPause}
            disabled={isLoading}
            color="primary"
            sx={{
              bgcolor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              width: 64,
              height: 64,
              "&:hover": {
                bgcolor: theme.palette.primary.dark,
              },
              "&:active": {
                transform: "scale(0.95)",
              },
              "&.Mui-disabled": {
                bgcolor: theme.palette.action.disabledBackground,
              },
            }}
          >
            {isLoading ? (
              <CircularProgress
                size={32}
                sx={{ color: theme.palette.primary.contrastText }}
              />
            ) : isPlaying ? (
              <PauseIcon sx={{ fontSize: 32 }} />
            ) : (
              <PlayIcon sx={{ fontSize: 32 }} />
            )}
          </IconButton>
        </Tooltip>

        <Box sx={{ width: "100%", px: 1 }}>
          <Slider
            value={sliderValue}
            onChange={handleSliderChange}
            onChangeCommitted={handleSliderChangeCommitted}
            min={0}
            max={100}
            color="primary"
            sx={{
              height: 4,
              "& .MuiSlider-thumb": {
                width: 12,
                height: 12,
                transition: "0.3s cubic-bezier(.47,1.64,.41,.8)",
                "&:before": {
                  boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
                },
                "&:hover, &.Mui-focusVisible": {
                  boxShadow: `0px 0px 0px 8px ${theme.palette.primary.main}16`,
                },
                "&.Mui-active": {
                  width: 20,
                  height: 20,
                },
              },
              "& .MuiSlider-rail": {
                opacity: 0.28,
              },
            }}
          />
        </Box>

        <Typography
          variant="body2"
          sx={{
            color: themeColors.secondaryTextColor,
            fontSize: "0.875rem",
            fontFamily: brand.fonts.body,
          }}
        >
          {formatTime(getCurrentTime())} / {formatTime(getTotalDuration())}
        </Typography>

        <Typography
          variant="body1"
          sx={{
            color: themeColors.textColor,
            textAlign: "center",
            fontWeight: 500,
            fontFamily: brand.fonts.body,
          }}
        >
          {currentScene < audioPlaylist.length &&
            `Scene ${audioPlaylist[currentScene].sceneId} Summary`}
        </Typography>

        {loadError && (
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.error.main,
              textAlign: "center",
              fontFamily: brand.fonts.body,
            }}
          >
            {loadError}
          </Typography>
        )}

        <Box
          sx={{
            width: "100%",
            height: 140,
            position: "relative",
            bgcolor: themeColors.visualizerBgColor,
            borderRadius: `${brand.borderRadius}px`,
            overflow: "hidden",
            mt: 2,
          }}
        >
          {isLoading ? (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(0, 0, 0, 0.3)",
              }}
            >
              <Typography
                sx={{
                  color: themeColors.secondaryTextColor,
                  fontFamily: brand.fonts.body,
                }}
              >
                Loading...
              </Typography>
            </Box>
          ) : (
            audioNodes && (
              <AudioVisualizer
                analyserNode={audioNodes.analyser}
                isPlaying={isPlaying}
              />
            )
          )}
        </Box>
      </Box>
    </Box>
  );
}

ExtendedAudioPlaylist.displayName = "ExtendedAudioPlaylist";
