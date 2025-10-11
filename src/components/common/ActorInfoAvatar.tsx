"use client";

import type React from "react";
import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Avatar,
  Tooltip,
  AvatarGroup,
  Dialog,
  DialogContent,
  DialogTitle,
  Typography,
  Chip,
  useTheme,
  IconButton,
  Badge,
  Fade,
} from "@mui/material";
import {
  Category,
  Wc,
  Star,
  Close as CloseIcon,
  Movie as MovieIcon,
  Theaters as TheatersIcon,
  PeopleAltOutlined as TeamIcon,
} from "@mui/icons-material";
import type { Actor } from "@/types/overview/types";

interface ActorAvatarsProps {
  actors: Actor[] | Record<string, Actor>;
}

export const ActorAvatars: React.FC<ActorAvatarsProps> = ({ actors }) => {
  const [selectedActor, setSelectedActor] = useState<Actor | null>(null);
  const [localActors, setLocalActors] = useState<Actor[]>([]);
  const theme = useTheme();

  // Get color without # for UI Avatars API
  const primaryMainColor = useMemo(
    () => theme.palette.primary.dark.replace("#", ""),
    [theme.palette.primary.dark]
  );

  // Update local state when actors prop changes
  useEffect(() => {
    // Ensure actors is processed as an array of Actor objects
    if (Array.isArray(actors)) {
      setLocalActors(actors);
    } else {
      // Type assertion to ensure TypeScript knows we're handling Actor objects
      const actorsArray = Object.values(actors) as Actor[];
      setLocalActors(actorsArray);
    }
  }, [actors]);

  const handleAvatarClick = (actor: Actor) => {
    setSelectedActor(actor);
  };

  const handleClose = () => {
    setSelectedActor(null);
  };

  // Get celebrity badge visibility
  const isCelebrity = (actor: Actor) => {
    return actor.celebrity?.isCelebrity === "Yes";
  };

  // Get avatar size - consistent 42px size regardless of profile URL
  const AVATAR_SIZE = 60;

  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      {/* Actor count badge that comes before the AvatarGroup */}
      <AvatarGroup
        max={5}
        sx={{
          "& .MuiAvatar-root": {
            width: AVATAR_SIZE,
            height: AVATAR_SIZE,
            fontSize: AVATAR_SIZE / 2.5,
            border: `2px solid ${theme.palette.background.paper}`,
            boxShadow: theme.shadows[2],
            transition: "transform 0.2s, box-shadow 0.2s",
            "&:hover": {
              transform: "scale(1.15)",
              zIndex: 10,
              boxShadow: theme.shadows[5],
            },
          },
        }}
      >
        {localActors.map((actor) => (
          <Tooltip
            key={actor.actorId}
            title={
              <Box sx={{ p: 0.5 }}>
                <Typography variant="subtitle2">{actor.actorName}</Typography>
                <Typography variant="caption" display="block">
                  {actor.actorArchetype}
                </Typography>
                {isCelebrity(actor) && (
                  <Typography
                    variant="caption"
                    sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                  >
                    <Star fontSize="inherit" />
                    Celebrity
                  </Typography>
                )}
              </Box>
            }
            arrow
          >
            <Badge
              overlap="circular"
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              badgeContent={
                isCelebrity(actor) ? (
                  <Star
                    sx={{
                      fontSize: 12,
                      color:
                        theme.palette.yellow?.main ||
                        theme.palette.warning.main,
                      backgroundColor: "rgba(0,0,0,0.5)",
                      borderRadius: "50%",
                      padding: "2px",
                    }}
                  />
                ) : null
              }
            >
              <Avatar
                alt={actor.actorName}
                src={
                  actor.signedProfileUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    actor.actorName
                  )}&background=${primaryMainColor}&color=fff&size=${
                    AVATAR_SIZE * 3
                  }`
                }
                onClick={() => handleAvatarClick(actor)}
                sx={{
                  cursor: "pointer",
                  border: isCelebrity(actor)
                    ? `2px solid ${
                        theme.palette.yellow?.main || theme.palette.warning.main
                      }`
                    : undefined,
                }}
              />
            </Badge>
          </Tooltip>
        ))}
      </AvatarGroup>
      <Tooltip title={`${localActors.length} Actors`}>
        <Chip
          icon={<TeamIcon />}
          label={localActors.length}
          size="small"
          sx={{
            backgroundColor:
              theme.palette.mode === "dark"
                ? "rgba(0, 0, 0, 0.6)"
                : "rgba(255, 255, 255, 0.9)",
            border: `1px solid ${theme.palette.primary.main}`,
            color: theme.palette.primary.main,
            fontWeight: "bold",
          }}
        />
      </Tooltip>

      <Dialog
        open={!!selectedActor}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        TransitionComponent={Fade}
        transitionDuration={300}
        slotProps={{
          paper: {
            elevation: 8,
            sx: {
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: theme.palette.background.default,
            },
          },
        }}
      >
        {selectedActor && (
          <>
            <DialogTitle
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                py: 2,
                borderBottom: `1px solid ${theme.palette.divider}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Avatar
                  src={
                    selectedActor.signedProfileUrl ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      selectedActor.actorName
                    )}&background=${primaryMainColor}&color=fff`
                  }
                  alt={selectedActor.actorName}
                  sx={{
                    width: 42,
                    height: 42,
                    border: isCelebrity(selectedActor)
                      ? `2px solid ${
                          theme.palette.yellow?.main ||
                          theme.palette.warning.main
                        }`
                      : undefined,
                  }}
                />
                <Box>
                  <Typography variant="h6" component="div">
                    {selectedActor.actorName}
                  </Typography>
                  {isCelebrity(selectedActor) && (
                    <Chip
                      icon={<Star fontSize="small" />}
                      label="Celebrity"
                      size="small"
                      color="warning"
                      sx={{ height: 20, "& .MuiChip-label": { px: 1 } }}
                    />
                  )}
                </Box>
              </Box>
              <IconButton onClick={handleClose} edge="end" aria-label="close">
                <CloseIcon />
              </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0 }}>
              {/* Character Image */}
              <Box sx={{ position: "relative" }}>
                <Box
                  component="img"
                  src={selectedActor.signedUrl || "/placeHolder.webp"}
                  alt={selectedActor.actorName}
                  sx={{
                    width: "100%",
                    height: 300,
                    objectFit: "cover",
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  }}
                />
                <Box
                  sx={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    p: 2,
                    background:
                      "linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0) 100%)",
                    color: "white",
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {selectedActor.actorArchetype}
                  </Typography>
                </Box>
              </Box>

              {/* Actor Details */}
              <Box
                sx={{ p: 3, display: "flex", flexDirection: "column", gap: 2 }}
              >
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  <Chip
                    icon={<Category fontSize="small" />}
                    label={`Type: ${selectedActor.actorType || "Unknown"}`}
                    color={
                      selectedActor.actorType?.toLowerCase() === "human"
                        ? "primary"
                        : "default"
                    }
                    variant="outlined"
                  />
                  <Chip
                    icon={<Wc fontSize="small" />}
                    label={`Gender: ${selectedActor.gender || "Unspecified"}`}
                    variant="outlined"
                  />
                  <Chip
                    icon={<TheatersIcon fontSize="small" />}
                    label={`Scenes: ${selectedActor.sceneIds?.length || 0}`}
                    variant="outlined"
                  />
                </Box>

                {isCelebrity(selectedActor) &&
                  selectedActor.celebrity.celebrityName && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 0.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <Star fontSize="small" /> Celebrity Details
                      </Typography>
                      <Typography variant="body2">
                        Name: {selectedActor.celebrity.celebrityName}
                      </Typography>
                      {selectedActor.celebrity.celebrityDetails?.fame && (
                        <Typography variant="body2">
                          Fame: {selectedActor.celebrity.celebrityDetails.fame}
                        </Typography>
                      )}
                    </Box>
                  )}

                {/* Scene Info */}
                {selectedActor.sceneIds &&
                  selectedActor.sceneIds.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          mb: 0.5,
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                        }}
                      >
                        <MovieIcon fontSize="small" /> Appears in Scenes
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selectedActor.sceneIds.map((sceneId) => (
                          <Chip
                            key={sceneId}
                            label={`Scene ${sceneId}`}
                            size="small"
                            color="secondary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  )}
              </Box>
            </DialogContent>
          </>
        )}
      </Dialog>
    </Box>
  );
};
