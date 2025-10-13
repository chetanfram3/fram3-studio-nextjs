"use client";

import {
  Box,
  Typography,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Grid,
  Stack,
  Card,
  CardContent,
  Button,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  VideoFile as VideoIcon,
  AudioFile as AudioIcon,
  Image as ImageIcon,
  TextFields as TextIcon,
  Layers as LayersIcon,
  Link as LinkIcon,
  LinkOff as LinkOffIcon,
  OpenInNew as OpenInNewIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useCallback, useMemo } from "react";
import type { RenderedVideo } from "@/types/renderedVideos/types";

interface CompositionDetailsProps {
  video: RenderedVideo;
  compact?: boolean;
}

type ElementType = "video" | "audio" | "sound" | "image" | "text" | "caption";

export function CompositionDetails({
  video,
  compact = false,
}: CompositionDetailsProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const inputProps = video.renderData.inputProps || [];

  // Memoize element counts
  const elementCounts = useMemo(() => {
    return inputProps.reduce<Record<string, number>>((acc, element: any) => {
      const type = element.type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
  }, [inputProps]);

  const getElementIcon = useCallback((type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return <VideoIcon sx={{ fontSize: 16 }} />;
      case "audio":
      case "sound":
        return <AudioIcon sx={{ fontSize: 16 }} />;
      case "image":
        return <ImageIcon sx={{ fontSize: 16 }} />;
      case "text":
        return <TextIcon sx={{ fontSize: 16 }} />;
      case "caption":
        return <TextIcon sx={{ fontSize: 16 }} />;
      default:
        return <LayersIcon sx={{ fontSize: 16 }} />;
    }
  }, []);

  const getElementColor = useCallback(
    (type: string): "primary" | "success" | "warning" | "info" | "default" => {
      switch (type.toLowerCase()) {
        case "video":
          return "primary";
        case "audio":
        case "sound":
          return "success";
        case "image":
          return "success";
        case "text":
          return "warning";
        case "caption":
          return "info";
        default:
          return "default";
      }
    },
    []
  );

  const formatDuration = useCallback(
    (frames: number, fps: number = 30): string => {
      const seconds = frames / fps;
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
    },
    []
  );

  const getElementDetails = useCallback(
    (element: any) => {
      const details = [];

      if (element.durationInFrames) {
        details.push(`Duration: ${formatDuration(element.durationInFrames)}`);
      }
      if (element.from !== undefined) {
        details.push(`Start: ${formatDuration(element.from)}`);
      }
      if (element.row !== undefined) {
        details.push(`Row: ${element.row}`);
      }
      if (element.width && element.height) {
        details.push(`Size: ${element.width}x${element.height}`);
      }
      if (element.left !== undefined && element.top !== undefined) {
        details.push(`Position: ${element.left}, ${element.top}`);
      }
      if (element.rotation !== undefined && element.rotation !== 0) {
        details.push(`Rotation: ${element.rotation}°`);
      }
      if (element.styles?.volume !== undefined) {
        details.push(`Volume: ${Math.round(element.styles.volume * 100)}%`);
      }
      if (element.styles?.opacity !== undefined) {
        details.push(`Opacity: ${Math.round(element.styles.opacity * 100)}%`);
      }
      if (element.template) {
        details.push(`Template: ${element.template}`);
      }
      if (element.captions && element.captions.length > 0) {
        details.push(`Caption segments: ${element.captions.length}`);
      }

      return details;
    },
    [formatDuration]
  );

  const getCaptionText = useCallback((element: any) => {
    if (element.type === "caption" && element.captions) {
      return element.captions.map((caption: any) => caption.text).join(" ");
    }
    return element.content;
  }, []);

  const getCaptionDetails = useCallback((element: any) => {
    if (element.type !== "caption" || !element.captions) return null;

    const totalWords = element.captions.reduce(
      (acc: number, caption: any) =>
        acc + (caption.words ? caption.words.length : 0),
      0
    );

    const avgConfidence =
      element.captions.reduce(
        (acc: number, caption: any) => acc + (caption.confidence || 0),
        0
      ) / element.captions.length;

    return {
      totalWords,
      avgConfidence,
      segments: element.captions.length,
    };
  }, []);

  const isSignedUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    return (
      url.includes("GoogleAccessId") ||
      url.includes("Signature") ||
      url.includes("Expires") ||
      url.includes("X-Amz-Signature") ||
      url.includes("X-Amz-Expires") ||
      url.includes("se=") ||
      url.includes("sig=")
    );
  }, []);

  const isUrlExpired = useCallback((url: string): boolean => {
    if (!url) return true;

    try {
      const urlObj = new URL(url);

      const expires = urlObj.searchParams.get("Expires");
      if (expires) {
        const expiryTime = parseInt(expires) * 1000;
        return Date.now() > expiryTime;
      }

      const awsExpires = urlObj.searchParams.get("X-Amz-Expires");
      if (awsExpires) {
        const startTime = urlObj.searchParams.get("X-Amz-Date");
        if (startTime) {
          const start = new Date(startTime).getTime();
          const duration = parseInt(awsExpires) * 1000;
          return Date.now() > start + duration;
        }
      }

      const azureExpires = urlObj.searchParams.get("se");
      if (azureExpires) {
        const expiryTime = new Date(azureExpires).getTime();
        return Date.now() > expiryTime;
      }

      return false;
    } catch (error) {
      return true;
    }
  }, []);

  const isUrl = useCallback((text: string): boolean => {
    if (!text || typeof text !== "string") return false;
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  }, []);

  const isImageUrl = useCallback((url: string): boolean => {
    if (!url) return false;
    const imageExtensions = [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".webp",
      ".svg",
      ".bmp",
    ];
    const urlPath = url.split("?")[0].toLowerCase();
    return imageExtensions.some((ext) => urlPath.endsWith(ext));
  }, []);

  const renderSourceContent = useCallback(
    (element: any) => {
      if (!element.src) return null;

      const isSigned = isSignedUrl(element.src);
      const expired = isSigned && isUrlExpired(element.src);

      return (
        <Box sx={{ mt: 1 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Source URL:
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              disabled={expired}
              startIcon={expired ? <LinkOffIcon /> : <LinkIcon />}
              onClick={() => !expired && window.open(element.src, "_blank")}
              sx={{
                textTransform: "none",
                fontSize: "0.75rem",
                minHeight: "auto",
                py: 0.5,
              }}
            >
              {expired ? "Expired URL" : "Open Source"}
            </Button>
            {isSigned && (
              <Chip
                label={expired ? "Expired" : "Active"}
                size="small"
                color={expired ? "error" : "success"}
                variant="outlined"
                sx={{ fontSize: "0.65rem", height: 20 }}
              />
            )}
          </Box>
        </Box>
      );
    },
    [isSignedUrl, isUrlExpired]
  );

  const renderContentDisplay = useCallback(
    (element: any) => {
      const content = getCaptionText(element);

      if (!content) return null;

      if (typeof content === "string" && isUrl(content)) {
        const isImage = isImageUrl(content);
        const isSigned = isSignedUrl(content);
        const expired = isSigned && isUrlExpired(content);

        return (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Content {isImage ? "(Image)" : "(Media)"}:
            </Typography>

            {isImage && !expired ? (
              <Box sx={{ mb: 1 }}>
                <img
                  src={content}
                  alt="Content preview"
                  style={{
                    maxWidth: "100%",
                    maxHeight: "80px",
                    objectFit: "cover",
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    border: "1px solid #ddd",
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </Box>
            ) : null}

            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={expired}
                startIcon={expired ? <LinkOffIcon /> : <OpenInNewIcon />}
                onClick={() => !expired && window.open(content, "_blank")}
                sx={{
                  textTransform: "none",
                  fontSize: "0.75rem",
                  minHeight: "auto",
                  py: 0.5,
                }}
              >
                {expired
                  ? "Expired Content"
                  : `Open ${isImage ? "Image" : "Media"}`}
              </Button>
              {isSigned && (
                <Chip
                  label={expired ? "Expired" : "Active"}
                  size="small"
                  color={expired ? "error" : "success"}
                  variant="outlined"
                  sx={{ fontSize: "0.65rem", height: 20 }}
                />
              )}
            </Box>
          </Box>
        );
      }

      if (typeof content === "string") {
        const displayContent =
          content.length > 100 ? content.substring(0, 100) + "..." : content;

        return (
          <Box sx={{ mt: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Content:
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                display: "block",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap",
                bgcolor: "action.hover",
                p: 1,
                borderRadius: `${brand.borderRadius * 0.25}px`,
                border: 1,
                borderColor: "divider",
              }}
            >
              {displayContent}
            </Typography>
          </Box>
        );
      }

      return (
        <Typography variant="caption" color="text.secondary">
          • Content: Media content
        </Typography>
      );
    },
    [
      getCaptionText,
      isUrl,
      isImageUrl,
      isSignedUrl,
      isUrlExpired,
      brand.borderRadius,
    ]
  );

  if (!inputProps.length) {
    return (
      <Card
        sx={{
          bgcolor: "background.default",
          borderRadius: `${brand.borderRadius}px`,
        }}
      >
        <CardContent sx={{ p: compact ? 2 : 3 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            No composition data available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      sx={{
        bgcolor: "background.default",
        borderRadius: `${brand.borderRadius}px`,
      }}
    >
      <CardContent sx={{ p: compact ? 2 : 3 }}>
        <Typography
          variant={compact ? "subtitle2" : "subtitle1"}
          fontWeight={600}
          sx={{ mb: 2, color: "primary.main", fontFamily: brand.fonts.heading }}
        >
          Composition Details
        </Typography>

        {/* Summary Statistics */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Element Summary
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              label={`${inputProps.length} Total Elements`}
              variant="outlined"
              size="small"
              icon={<LayersIcon />}
            />
            {Object.entries(elementCounts).map(([type, count]) => (
              <Chip
                key={type}
                label={`${count} ${
                  type.charAt(0).toUpperCase() + type.slice(1)
                }${count > 1 ? "s" : ""}`}
                color={getElementColor(type)}
                variant="filled"
                size="small"
                icon={getElementIcon(type)}
              />
            ))}
          </Stack>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Detailed Element List */}
        <Accordion
          elevation={0}
          defaultExpanded={false}
          sx={{
            borderRadius: `${brand.borderRadius * 0.5}px`,
            "&:before": {
              display: "none",
            },
          }}
        >
          <AccordionSummary
            expandIcon={
              <ExpandMoreIcon sx={{ color: "primary.contrastText" }} />
            }
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              borderRadius: `${brand.borderRadius * 0.5}px`,
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <LayersIcon />
              <Typography variant="body2" fontWeight={600}>
                Element Details ({inputProps.length} items)
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ bgcolor: "background.default", p: 2 }}>
            <Stack spacing={1}>
              {inputProps.map((element: any, index: number) => (
                <Accordion
                  key={element.id || index}
                  elevation={0}
                  sx={{
                    borderRadius: `${brand.borderRadius * 0.5}px`,
                    "&:before": { display: "none" },
                  }}
                >
                  <AccordionSummary
                    expandIcon={
                      <ExpandMoreIcon sx={{ color: "text.secondary" }} />
                    }
                    sx={{
                      bgcolor: "background.default",
                      borderRadius: `${brand.borderRadius * 0.5}px`,
                      "&:hover": {
                        bgcolor: "background.paper",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        flex: 1,
                      }}
                    >
                      {getElementIcon(element.type)}
                      <Typography
                        variant="body2"
                        fontWeight={500}
                        color="text.primary"
                      >
                        {element.type?.charAt(0).toUpperCase() +
                          element.type?.slice(1) || "Unknown"}{" "}
                        {index + 1}
                      </Typography>
                      {element.id && (
                        <Typography variant="caption" color="text.secondary">
                          (ID: {element.id})
                        </Typography>
                      )}
                      <Box sx={{ ml: "auto" }}>
                        <Chip
                          label={element.type || "unknown"}
                          color={getElementColor(element.type)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      {/* Basic Properties */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          variant="caption"
                          color="primary.main"
                          fontWeight={600}
                        >
                          Properties
                        </Typography>
                        <Stack spacing={0.5} sx={{ mt: 1 }}>
                          {getElementDetails(element).map((detail, idx) => (
                            <Typography
                              key={idx}
                              variant="caption"
                              color="text.secondary"
                            >
                              • {detail}
                            </Typography>
                          ))}
                        </Stack>
                      </Grid>

                      {/* Source & Content */}
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          variant="caption"
                          color="primary.main"
                          fontWeight={600}
                        >
                          Source & Content
                        </Typography>
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          {element.src && renderSourceContent(element)}

                          {(element.content || element.type === "caption") &&
                            renderContentDisplay(element)}

                          {element.justification && (
                            <Box sx={{ mt: 1 }}>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block", mb: 1 }}
                              >
                                Purpose:
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  display: "block",
                                  wordWrap: "break-word",
                                  whiteSpace: "pre-wrap",
                                  bgcolor: "action.hover",
                                  p: 1,
                                  borderRadius: `${brand.borderRadius * 0.25}px`,
                                  border: 1,
                                  borderColor: "divider",
                                }}
                              >
                                {element.justification.length > 80
                                  ? element.justification.substring(0, 80) +
                                    "..."
                                  : element.justification}
                              </Typography>
                            </Box>
                          )}

                          {element.type === "caption" &&
                            (() => {
                              const captionDetails = getCaptionDetails(element);
                              return (
                                captionDetails && (
                                  <Box sx={{ mt: 1 }}>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      • Words: {captionDetails.totalWords}
                                    </Typography>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block" }}
                                    >
                                      • Confidence:{" "}
                                      {Math.round(
                                        captionDetails.avgConfidence * 100
                                      )}
                                      %
                                    </Typography>
                                  </Box>
                                )
                              );
                            })()}
                        </Stack>
                      </Grid>

                      {/* Special Properties */}
                      {(element.styles ||
                        element.hasLipsync ||
                        element.dialogueId ||
                        element.musicId ||
                        element.captions) && (
                        <Grid size={{ xs: 12 }}>
                          <Typography
                            variant="caption"
                            color="primary.main"
                            fontWeight={600}
                          >
                            Special Attributes
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            flexWrap="wrap"
                            useFlexGap
                            sx={{ mt: 1 }}
                          >
                            {element.hasLipsync && (
                              <Chip
                                label="Lipsync"
                                size="small"
                                color="info"
                                variant="outlined"
                              />
                            )}
                            {element.dialogueId && (
                              <Chip
                                label={`Dialogue ${element.dialogueId}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {element.musicId && (
                              <Chip
                                label={`Music ${element.musicId}`}
                                size="small"
                                color="success"
                                variant="outlined"
                              />
                            )}
                            {element.foleyId && (
                              <Chip
                                label={`Foley ${element.foleyId}`}
                                size="small"
                                color="warning"
                                variant="outlined"
                              />
                            )}
                            {element.shotId && (
                              <Chip
                                label={`Shot ${element.shotId}`}
                                size="small"
                                color="primary"
                                variant="outlined"
                              />
                            )}
                            {element.styles?.animation && (
                              <Chip
                                label={`Animation: ${
                                  element.styles.animation.enter || "none"
                                }`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {element.styles?.fontFamily && (
                              <Chip
                                label={`Font: ${
                                  element.styles.fontFamily.split(",")[0]
                                }`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {element.styles?.fontSize && (
                              <Chip
                                label={`Size: ${element.styles.fontSize}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {element.styles?.textAlign && (
                              <Chip
                                label={`Align: ${element.styles.textAlign}`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                            {element.type === "caption" && element.captions && (
                              <Chip
                                label={`${element.captions.length} Caption${
                                  element.captions.length > 1 ? "s" : ""
                                }`}
                                size="small"
                                color="info"
                                variant="filled"
                              />
                            )}
                          </Stack>

                          {/* Caption Timeline */}
                          {element.type === "caption" && element.captions && (
                            <Box sx={{ mt: 2 }}>
                              <Typography
                                variant="caption"
                                color="primary.main"
                                fontWeight={600}
                              >
                                Caption Timeline
                              </Typography>
                              <Stack
                                spacing={0.5}
                                sx={{ mt: 1, maxHeight: 120, overflow: "auto" }}
                              >
                                {element.captions.map(
                                  (caption: any, idx: number) => (
                                    <Box
                                      key={idx}
                                      sx={{
                                        p: 1,
                                        bgcolor: "action.hover",
                                        borderRadius: `${brand.borderRadius * 0.25}px`,
                                        border: 1,
                                        borderColor: "divider",
                                      }}
                                    >
                                      <Typography
                                        variant="caption"
                                        fontWeight={500}
                                        color="text.primary"
                                      >
                                        "{caption.text}"
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        display="block"
                                      >
                                        {caption.startMs}ms - {caption.endMs}ms
                                        {caption.confidence &&
                                          ` (${Math.round(
                                            caption.confidence * 100
                                          )}% confidence)`}
                                      </Typography>
                                      {caption.words &&
                                        caption.words.length > 0 && (
                                          <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            display="block"
                                          >
                                            {caption.words.length} word
                                            {caption.words.length > 1
                                              ? "s"
                                              : ""}
                                          </Typography>
                                        )}
                                    </Box>
                                  )
                                )}
                              </Stack>
                            </Box>
                          )}
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </AccordionDetails>
        </Accordion>
      </CardContent>
    </Card>
  );
}

CompositionDetails.displayName = "CompositionDetails";
