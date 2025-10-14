import React from "react";
import { Box, Typography, Button, IconButton, useTheme } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { UseFormReturn } from "react-hook-form";
import { FormValues } from "../types";
import { alpha } from "@mui/material";

// Define the emotion type to avoid 'any' type errors
interface EmotionItem {
  emotion: string;
  intensity: number;
}

interface EmotionalArcProps {
  form: UseFormReturn<FormValues>;
  audience: {
    emotionalTone?: {
      emotionalArc?: EmotionItem[] | null; // Allow null
      emotionList?: string[] | null; // Allow null
      emotionIntensity?: number | null; // Allow null
    };
    [key: string]: any;
  };
  resetEmotions: () => void;
  removeEmotion: (index: number) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent, index: number) => void;
  handleDrop: (e: React.DragEvent, index: number) => void;
  handleDragEnd: () => void;
  isDraggingEmotion: number | null;
  dragOverIndex: number | null;
  getEmotionColor: (emotion: string) => string;
}

const EmotionalArc: React.FC<EmotionalArcProps> = ({
  form,
  audience,
  resetEmotions,
  removeEmotion,
  handleDragStart,
  handleDragOver,
  handleDrop,
  handleDragEnd,
  isDraggingEmotion,
  dragOverIndex,
  getEmotionColor,
}) => {
  const theme = useTheme();

  // Make sure we have a valid emotionalArc array
  const emotionalArc = audience.emotionalTone?.emotionalArc || [];

  const EmotionCard = ({
    emotion,
    index,
  }: {
    emotion: EmotionItem;
    index: number;
  }) => (
    <Box
      key={`${emotion.emotion}-${index}`}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={(e) => handleDragOver(e, index)}
      onDrop={(e) => handleDrop(e, index)}
      onDragEnd={handleDragEnd}
      sx={{
        flex: 1,
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor:
          dragOverIndex === index
            ? getEmotionColor(emotion.emotion)
            : "divider",
        bgcolor: alpha(getEmotionColor(emotion.emotion), 0.1),
        position: "relative",
        opacity: isDraggingEmotion === index ? 0.5 : 1,
        cursor: "move",
        transition: "all 0.2s",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <IconButton
        size="small"
        onClick={() => removeEmotion(index)}
        sx={{
          position: "absolute",
          top: 2,
          right: 2,
          color: "text.secondary",
          p: 0.5,
        }}
      >
        <CloseIcon fontSize="small" sx={{ fontSize: "0.75rem" }} />
      </IconButton>

      <Box
        sx={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: getEmotionColor(emotion.emotion),
          mb: 0.5,
        }}
      />

      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          fontWeight: 600,
          color: getEmotionColor(emotion.emotion),
          mb: 0.5,
        }}
      >
        {emotion.emotion.charAt(0).toUpperCase() + emotion.emotion.slice(1)}
      </Typography>

      <Typography
        variant="caption"
        sx={{
          display: "block",
          textAlign: "center",
          fontSize: "0.65rem",
          color: "text.secondary",
          mb: 0.5,
        }}
      >
        {index === 0 ? "Start" : index === 1 ? "Middle" : "End"}
      </Typography>

      <Box
        sx={{
          height: 3,
          width: "100%",
          bgcolor: "background.paper",
          borderRadius: 5,
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            height: "100%",
            bgcolor: getEmotionColor(emotion.emotion),
            transition: "width 0.3s",
          }}
          style={{ width: `${emotion.intensity}%` }}
        />
      </Box>
    </Box>
  );

  const ArcGraph = () => {
    // Only render if we have at least 2 emotions in the arc
    if (emotionalArc.length < 2) return null;

    return (
      <Box
        sx={{
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          mb: 2,
        }}
      >
        <Box sx={{ height: 50, position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "space-between",
              px: 1,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem" }}
            >
              0s
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem" }}
            >
              Time
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.65rem" }}
            >
              30s
            </Typography>
          </Box>

          <svg
            width="100%"
            height="100%"
            viewBox="0 0 100 50"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="emotionArcGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop
                  offset="0%"
                  stopColor={getEmotionColor(emotionalArc[0]?.emotion || "joy")}
                />
                {emotionalArc.length >= 2 && (
                  <stop
                    offset="50%"
                    stopColor={getEmotionColor(
                      emotionalArc[1]?.emotion || "joy"
                    )}
                  />
                )}
                {emotionalArc.length >= 3 && (
                  <stop
                    offset="100%"
                    stopColor={getEmotionColor(
                      emotionalArc[2]?.emotion || "joy"
                    )}
                  />
                )}
              </linearGradient>
            </defs>

            {emotionalArc.length >= 2 && (
              <path
                d={`
                  M 0 ${50 - (emotionalArc[0]?.intensity || 60) / 2}
                  ${
                    emotionalArc.length === 2
                      ? `L 100 ${50 - (emotionalArc[1]?.intensity || 60) / 2}`
                      : `Q 50 ${50 - (emotionalArc[1]?.intensity || 60) / 2} 
                         100 ${50 - (emotionalArc[2]?.intensity || 60) / 2}`
                  }
                `}
                stroke="url(#emotionArcGradient)"
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
              />
            )}

            {emotionalArc.map((emotion: EmotionItem, index: number) => {
              const xPos =
                index === 0
                  ? 0
                  : index === 1 && emotionalArc.length === 2
                  ? 100
                  : index === 1
                  ? 50
                  : 100;

              return (
                <circle
                  key={`point-${index}`}
                  cx={xPos}
                  cy={50 - (emotion.intensity || 60) / 2}
                  r="3"
                  fill={getEmotionColor(emotion.emotion)}
                  stroke="#fff"
                  strokeWidth="0.5"
                />
              );
            })}
          </svg>
        </Box>
      </Box>
    );
  };

  const ArcSummary = () => {
    // Only render if we have at least 2 emotions in the arc
    if (emotionalArc.length < 2) return null;

    return (
      <Box
        sx={{
          p: 1,
          bgcolor:
            theme.palette.mode === "dark"
              ? "#161616"
              : alpha(theme.palette.background.default, 0.8),
          borderRadius: 1,
          textAlign: "center",
        }}
      >
        <Typography variant="caption">
          <Typography
            component="span"
            variant="caption"
            color="warning.main"
            fontWeight={600}
          >
            Emotional Arc:
          </Typography>{" "}
          {emotionalArc.map((emotion: EmotionItem, index: number) => (
            <React.Fragment key={`text-${index}`}>
              <Typography
                component="span"
                variant="caption"
                sx={{ color: getEmotionColor(emotion.emotion) }}
              >
                {emotion.emotion.charAt(0).toUpperCase() +
                  emotion.emotion.slice(1)}
              </Typography>
              {index < emotionalArc.length - 1 && " → "}
            </React.Fragment>
          ))}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        px: 2,
        mt: "auto",
        pb: 2,
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
        <Typography
          variant="caption"
          sx={{ fontWeight: 500, color: "text.secondary" }}
        >
          Emotional Arc
        </Typography>
        {emotionalArc.length > 0 && (
          <Button
            variant="text"
            size="small"
            onClick={resetEmotions}
            sx={{
              fontSize: "0.7rem",
              color: "text.secondary",
              "&:hover": { color: "text.primary" },
              p: 0,
              minWidth: "auto",
            }}
          >
            Reset
          </Button>
        )}
      </Box>

      {emotionalArc.length > 0 ? (
        <Box
          sx={{ mb: 2, flexGrow: 1, display: "flex", flexDirection: "column" }}
        >
          <Box
            sx={{
              display: "flex",
              gap: 1,
              mb: 2,
              minHeight: 100,
              alignItems: "stretch",
            }}
          >
            {emotionalArc.map((emotion: EmotionItem, index: number) => (
              <EmotionCard
                key={`${emotion.emotion}-${index}`}
                emotion={emotion}
                index={index}
              />
            ))}

            {Array.from({
              length: 3 - emotionalArc.length,
            }).map((_, index: number) => (
              <Box
                key={`placeholder-${index}`}
                sx={{
                  flex: 1,
                  p: 1.5,
                  borderRadius: 1,
                  border: "1px dashed",
                  borderColor: "divider",
                  bgcolor: "background.paper",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem" }}
                >
                  {emotionalArc.length === 0
                    ? "Starting"
                    : emotionalArc.length === 1
                    ? "Middle"
                    : "Ending"}{" "}
                  Emotion
                </Typography>
              </Box>
            ))}
          </Box>

          <ArcGraph />
          <ArcSummary />
        </Box>
      ) : (
        <Box
          sx={{
            p: 3,
            bgcolor: "background.paper",
            borderRadius: 1,
            border: "1px dashed",
            borderColor: "divider",
            textAlign: "center",
            mb: 3,
            minHeight: 100,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            flexGrow: 1,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mb: 1 }}
          >
            Select emotions from the wheel to create an emotional arc
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "center", gap: 2 }}>
            {["Starting", "Middle", "Ending"].map((label: string) => (
              <Box key={label} sx={{ display: "flex", alignItems: "center" }}>
                <Box
                  sx={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    bgcolor: "warning.main",
                    mr: 0.5,
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.65rem" }}
                >
                  {label}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default EmotionalArc;
