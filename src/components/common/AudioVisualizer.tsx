"use client";

import { useEffect, useRef, useCallback } from "react";
import { Box, useTheme } from "@mui/material";
import { getCurrentBrand } from "@/config/brandConfig";

/**
 * Type-safe interface for AudioVisualizer props
 */
interface AudioVisualizerProps {
  analyserNode: AnalyserNode;
  isPlaying: boolean;
}

/**
 * AudioVisualizer Component
 *
 * Renders a real-time audio frequency visualization using HTML5 Canvas.
 * Displays animated bars that respond to audio frequencies with theme-aware colors.
 * Fully theme-aware and optimized for performance.
 *
 * @component
 */
export default function AudioVisualizer({
  analyserNode,
  isPlaying,
}: AudioVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const theme = useTheme();
  const brand = getCurrentBrand();

  // React 19: useCallback for canvas setup and animation
  const setupAndAnimate = useCallback(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Setup canvas with device pixel ratio for sharp rendering
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    // Audio data configuration
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const barWidth = (rect.width / bufferLength) * 2.5;

    // Theme-specific configuration
    const baseHue = 240;
    const saturation = "100%";
    const backgroundColor = theme.palette.background.default;

    // Clear canvas with theme background
    const clearCanvas = () => {
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, rect.width, rect.height);
    };

    // Initialize with clear canvas
    clearCanvas();

    // Animation loop
    const animate = () => {
      if (!isPlaying) {
        clearCanvas();
        return;
      }

      animationRef.current = requestAnimationFrame(animate);
      analyserNode.getByteFrequencyData(dataArray);

      // Clear canvas for new frame
      clearCanvas();

      // Draw frequency bars
      dataArray.forEach((value, index) => {
        const barHeight = (value / 255) * rect.height;
        const x = index * barWidth;
        const hue = (index / bufferLength) * 120 + baseHue;

        // Create gradient for each bar
        const gradient = ctx.createLinearGradient(
          0,
          rect.height - barHeight,
          0,
          rect.height
        );

        gradient.addColorStop(0, `hsla(${hue}, ${saturation}, 50%, 0.8)`);
        gradient.addColorStop(1, `hsla(${hue}, ${saturation}, 40%, 0.8)`);

        ctx.fillStyle = gradient;
        ctx.fillRect(x, rect.height - barHeight, barWidth - 1, barHeight);
      });
    };

    // Start animation if playing
    if (isPlaying) {
      animate();
    }

    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isPlaying, analyserNode, theme.palette.background.default]);

  // Effect to setup canvas and start/stop animation
  useEffect(() => {
    const cleanup = setupAndAnimate();

    return () => {
      if (cleanup) cleanup();
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [setupAndAnimate]);

  return (
    <Box
      sx={{
        width: "100%",
        height: "100%",
        bgcolor: "transparent",
        borderRadius: `${brand.borderRadius}px`,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "100%",
          height: "100%",
          display: "block",
        }}
      />
    </Box>
  );
}

AudioVisualizer.displayName = "AudioVisualizer";
