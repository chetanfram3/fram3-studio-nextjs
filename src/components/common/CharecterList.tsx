"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Chip,
  Box,
  Typography,
} from "@mui/material";
import { Movie as MovieIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { Character } from "@/types/storyBoard/types";

interface CharacterListProps {
  characters?: Character[];
  showScenes?: boolean;
  compact?: boolean;
}

/**
 * CharacterList - Optimized character display component
 *
 * Performance optimizations:
 * - Theme-aware styling (no hardcoded colors)
 * - React 19 compiler optimizations
 * - Strategic memoization for computed values
 * - Brand fonts integration
 */
export function CharacterList({
  characters = [],
  showScenes = false,
  compact = false,
}: CharacterListProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();

  // ==========================================
  // COMPUTED VALUES
  // ==========================================
  const hasCharacters = useMemo(
    () => characters.length > 0,
    [characters.length]
  );

  // ==========================================
  // EARLY RETURN - NO CHARACTERS
  // ==========================================
  if (!hasCharacters) {
    return (
      <Card sx={{ bgcolor: "background.default" }}>
        <CardHeader
          title={
            <Typography
              variant={compact ? "subtitle1" : "h6"}
              sx={{
                color: "text.primary",
                fontFamily: brand.fonts.heading,
              }}
            >
              Characters
            </Typography>
          }
        />
        <CardContent>
          <Typography
            color="text.secondary"
            sx={{
              fontSize: compact ? "0.75rem" : undefined,
              fontFamily: brand.fonts.body,
            }}
          >
            No character information available
          </Typography>
        </CardContent>
      </Card>
    );
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <Card
      sx={{
        bgcolor: "background.default",
        borderRadius: `${brand.borderRadius}px`,
      }}
    >
      <CardHeader
        title={
          <Typography
            variant={compact ? "subtitle1" : "h6"}
            sx={{
              color: "text.primary",
              fontFamily: brand.fonts.heading,
            }}
          >
            Characters ({characters.length})
          </Typography>
        }
        sx={{ pb: compact ? 1 : 2 }}
      />
      <CardContent sx={{ pt: 0 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: compact ? 1.5 : 2,
          }}
        >
          {characters.map((character, index) => (
            <Box
              key={`character-${character.actorId || index}`}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: compact ? 0.75 : 1,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  gap: compact ? 1.5 : 2,
                  alignItems: "flex-start",
                }}
              >
                <Avatar
                  alt={character.actorName || "Character"}
                  sx={{
                    bgcolor: "primary.main",
                    width: compact ? 48 : 64,
                    height: compact ? 48 : 64,
                  }}
                  src={character.signedProfileUrl || undefined}
                >
                  {!character.signedProfileUrl && character.actorName
                    ? character.actorName.charAt(0).toUpperCase()
                    : "?"}
                </Avatar>
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: compact ? 0.25 : 0.5,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography
                      variant={compact ? "body1" : "subtitle1"}
                      sx={{
                        fontWeight: 500,
                        fontSize: compact ? "0.875rem" : undefined,
                        color: "text.primary",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      {character.actorName || "Unnamed Character"}
                    </Typography>
                    {character.celebrity?.isCelebrity === "Yes" && (
                      <Chip
                        label="Celebrity"
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{
                          fontSize: compact ? "0.625rem" : undefined,
                          height: compact ? 20 : undefined,
                          borderColor: "primary.main",
                        }}
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      fontSize: compact ? "0.75rem" : undefined,
                      fontFamily: brand.fonts.body,
                    }}
                  >
                    {character.actorArchetype || "No archetype"}
                    {character.actorType && ` (${character.actorType})`}
                  </Typography>
                  {character.celebrity?.isCelebrity === "Yes" && (
                    <Box sx={{ mt: compact ? 0.25 : 0.5 }}>
                      {character.celebrity.publicImage && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: compact ? "0.6875rem" : undefined,
                            color: "text.secondary",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          {character.celebrity.publicImage}
                        </Typography>
                      )}
                      {character.celebrity.fameLevel && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: compact ? "0.6875rem" : undefined,
                            color: "text.secondary",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          Fame Level: {character.celebrity.fameLevel}
                        </Typography>
                      )}
                      {character.celebrity.region && (
                        <Typography
                          variant="body2"
                          sx={{
                            fontSize: compact ? "0.6875rem" : undefined,
                            color: "text.secondary",
                            fontFamily: brand.fonts.body,
                          }}
                        >
                          Region: {character.celebrity.region}
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              </Box>
              {showScenes &&
                character.sceneIds &&
                character.sceneIds.length > 0 && (
                  <Box sx={{ mt: compact ? 0.5 : 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        mb: compact ? 0.25 : 0.5,
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        fontSize: compact ? "0.75rem" : undefined,
                        color: "text.primary",
                        fontFamily: brand.fonts.body,
                      }}
                    >
                      <MovieIcon
                        fontSize={compact ? "small" : "small"}
                        sx={{ color: "primary.main" }}
                      />
                      Appears In
                    </Typography>
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: compact ? 0.25 : 0.5,
                        justifyContent: "flex-start",
                      }}
                    >
                      {character.sceneIds.map((sceneId) => (
                        <Chip
                          key={sceneId}
                          label={`Scene ${sceneId}`}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            fontSize: compact ? "0.625rem" : undefined,
                            height: compact ? 20 : undefined,
                            borderColor: "primary.main",
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

CharacterList.displayName = "CharacterList";
