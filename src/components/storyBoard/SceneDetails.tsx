// SceneDetails.tsx - Ported to Next.js 15 with React 19 optimizations
"use client";

import { useMemo, useCallback, JSX } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Stack,
  Chip,
  Grid,
} from "@mui/material";
import {
  LocationOnOutlined,
  WbSunnyOutlined,
  AccessTime,
  CalendarToday,
  Public as RegionIcon,
  Schedule as TimePeriodIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";
import { useThemeMode } from "@/theme";
import { Scene, LocationDetail, Region } from "@/types/storyBoard/types";
import { CharacterList } from "@/components/common/CharecterList";
import { capitalizeWords } from "@/utils/textUtils";
import logger from "@/utils/logger";

// ==========================================
// TYPE DEFINITIONS
// ==========================================

/**
 * Props for SceneDetails component
 */
interface SceneDetailsProps {
  sceneData?: Pick<Scene, "characters" | "locationDetails"> | null;
  compact?: boolean;
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Format region data into readable string
 */
function formatRegion(region?: Region | null): string | null {
  if (!region) return null;

  const parts = [
    region.neighborhood,
    region.city,
    region.state,
    region.country,
  ].filter(
    (part): part is string => Boolean(part) && part.toLowerCase() !== "unknown"
  );

  return parts.length > 0 ? capitalizeWords(parts.join(", ")) : null;
}

/**
 * Check if value is valid (not empty or "unknown")
 */
const isValidValue = (value?: string | null): boolean => {
  return Boolean(value && value.toLowerCase() !== "unknown");
};

// ==========================================
// MAIN COMPONENT
// ==========================================

/**
 * SceneDetails Component
 *
 * Displays comprehensive scene information including location details,
 * environmental conditions, and character information.
 * Features:
 * - Responsive grid layout
 * - Compact mode for reduced spacing
 * - Location and environment details
 * - Character list integration
 * - Theme-aware styling
 *
 * @component
 */
export function SceneDetails({
  sceneData,
  compact = false,
}: SceneDetailsProps) {
  // ==========================================
  // THEME & BRANDING
  // ==========================================
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { isDarkMode } = useThemeMode();

  // ==========================================
  // MEMOIZED VALUES
  // ==========================================

  // React 19: useMemo for destructured data
  const { characters, locationDetails } = useMemo(() => {
    return {
      characters: sceneData?.characters || [],
      locationDetails: sceneData?.locationDetails || [],
    };
  }, [sceneData?.characters, sceneData?.locationDetails]);

  // React 19: useMemo for icon sizes
  const iconSize = useMemo(() => (compact ? 12 : 16), [compact]);
  const headerIconSize = useMemo(() => (compact ? 16 : 20), [compact]);

  // React 19: useMemo for chip styles
  const chipStyles = useMemo(
    () => ({
      fontSize: compact ? "0.625rem" : undefined,
      height: compact ? 20 : undefined,
    }),
    [compact]
  );

  // ==========================================
  // CALLBACKS
  // ==========================================

  // React 19: useCallback for rendering location chips
  const renderLocationChip = useCallback(
    (icon: JSX.Element, label: string | null) => {
      if (!label) return null;

      return (
        <Chip
          icon={icon}
          label={label}
          size="small"
          variant="outlined"
          color="primary"
          sx={{
            ...chipStyles,
            fontFamily: brand.fonts.body,
          }}
        />
      );
    },
    [chipStyles, brand.fonts.body]
  );

  // ==========================================
  // RENDER
  // ==========================================

  // Early return for no data
  if (!sceneData) {
    return (
      <Box
        sx={{
          p: compact ? 2 : 3,
          textAlign: "center",
          bgcolor: "background.paper",
          borderRadius: `${brand.borderRadius}px`,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Typography
          color="text.secondary"
          sx={{ fontFamily: brand.fonts.body }}
        >
          No scene details available
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ py: compact ? 1 : 3 }}>
      <Card
        sx={{
          mb: 2,
          p: compact ? 1 : 2,
          borderRadius: `${brand.borderRadius}px`,
          bgcolor: "background.default",
          borderTop: 2,
          borderColor: "primary.main",
          boxShadow: theme.shadows[2],
        }}
      >
        <CardHeader
          title={
            <Typography
              variant={compact ? "h6" : "h4"}
              component="h2"
              sx={{
                fontFamily: brand.fonts.heading,
                color: "text.primary",
              }}
            >
              Scene Details
            </Typography>
          }
          sx={{ pb: compact ? 1 : 2 }}
        />
        <CardContent sx={{ pt: 0 }}>
          <Grid container spacing={compact ? 2 : 3}>
            {/* Location Details Section */}
            <Grid size={{ xs: 12, md: compact ? 12 : 6 }}>
              <Card
                sx={{
                  bgcolor: "background.paper",
                  borderRadius: `${brand.borderRadius}px`,
                  border: 1,
                  borderColor: "divider",
                }}
              >
                <CardHeader
                  title={
                    <Typography
                      variant={compact ? "subtitle1" : "h6"}
                      sx={{
                        fontFamily: brand.fonts.heading,
                        color: "text.primary",
                      }}
                    >
                      Location Details
                    </Typography>
                  }
                  sx={{ pb: compact ? 1 : 2 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  {locationDetails.length > 0 ? (
                    <Stack spacing={compact ? 2 : 3}>
                      {locationDetails.map(
                        (location: LocationDetail, index: number) => (
                          <Box
                            key={`location-${index}`}
                            sx={{
                              p: 2,
                              bgcolor: "action.hover",
                              borderRadius: `${brand.borderRadius}px`,
                              border: 1,
                              borderColor: "divider",
                            }}
                          >
                            {/* Location Name Header */}
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ mb: compact ? 1 : 2 }}
                            >
                              <LocationOnOutlined
                                sx={{
                                  fontSize: headerIconSize,
                                  color: "primary.main",
                                }}
                              />
                              <Typography
                                variant={compact ? "body1" : "subtitle1"}
                                fontWeight="medium"
                                sx={{
                                  fontSize: compact ? "0.875rem" : undefined,
                                  fontFamily: brand.fonts.heading,
                                  color: "text.primary",
                                }}
                              >
                                {capitalizeWords(
                                  location?.locationName || "Unnamed Location"
                                )}
                              </Typography>
                            </Stack>

                            <Stack spacing={compact ? 1 : 2}>
                              {/* Location Type Info */}
                              {(location.locationArchetype ||
                                location.locationClass) && (
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    fontSize: compact ? "0.75rem" : undefined,
                                    fontFamily: brand.fonts.body,
                                  }}
                                >
                                  {[
                                    location.locationArchetype &&
                                      capitalizeWords(
                                        location.locationArchetype
                                      ),
                                    location.locationClass &&
                                      capitalizeWords(location.locationClass),
                                  ]
                                    .filter(Boolean)
                                    .join(" - ")}
                                </Typography>
                              )}

                              {/* Time and Region Info */}
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                sx={{ gap: compact ? 0.5 : 1 }}
                              >
                                {isValidValue(location.setting?.timePeriod) &&
                                  renderLocationChip(
                                    <TimePeriodIcon
                                      sx={{ fontSize: iconSize }}
                                    />,
                                    capitalizeWords(
                                      location.setting?.timePeriod || ""
                                    )
                                  )}

                                {location.setting?.region &&
                                  formatRegion(location.setting.region) &&
                                  renderLocationChip(
                                    <RegionIcon sx={{ fontSize: iconSize }} />,
                                    formatRegion(location.setting.region)
                                  )}
                              </Stack>

                              {/* Environmental Details */}
                              <Stack
                                direction="row"
                                spacing={1}
                                flexWrap="wrap"
                                sx={{ gap: compact ? 0.5 : 1 }}
                              >
                                {isValidValue(location.setting?.weather) &&
                                  renderLocationChip(
                                    <WbSunnyOutlined
                                      sx={{ fontSize: iconSize }}
                                    />,
                                    capitalizeWords(
                                      location.setting?.weather || ""
                                    )
                                  )}

                                {isValidValue(location.setting?.season) &&
                                  renderLocationChip(
                                    <CalendarToday
                                      sx={{ fontSize: iconSize }}
                                    />,
                                    capitalizeWords(
                                      location.setting?.season || ""
                                    )
                                  )}

                                {isValidValue(location.setting?.timeOfDay) &&
                                  renderLocationChip(
                                    <AccessTime sx={{ fontSize: iconSize }} />,
                                    capitalizeWords(
                                      location.setting?.timeOfDay || ""
                                    )
                                  )}
                              </Stack>

                              {/* Environment Details */}
                              {location.environment && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    p: 1.5,
                                    bgcolor: "background.paper",
                                    borderRadius: `${brand.borderRadius * 0.5}px`,
                                    border: 1,
                                    borderColor: "divider",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    gutterBottom
                                    sx={{
                                      fontSize: compact ? "0.75rem" : undefined,
                                      fontWeight: 600,
                                      fontFamily: brand.fonts.body,
                                    }}
                                  >
                                    Environment
                                  </Typography>
                                  <Stack spacing={compact ? 0.5 : 1}>
                                    {location.environment?.ambience && (
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontSize: compact
                                            ? "0.75rem"
                                            : undefined,
                                          fontFamily: brand.fonts.body,
                                          color: "text.primary",
                                        }}
                                      >
                                        {[
                                          location.environment.type &&
                                            capitalizeWords(
                                              location.environment.type
                                            ),
                                          location.environment.ambience
                                            ?.atmosphere &&
                                            capitalizeWords(
                                              location.environment.ambience
                                                .atmosphere
                                            ),
                                        ]
                                          .filter(Boolean)
                                          .join(" - ")}
                                      </Typography>
                                    )}

                                    {location.environment.ambience
                                      ?.sensoryDetails?.length > 0 && (
                                      <Stack
                                        direction="row"
                                        spacing={1}
                                        flexWrap="wrap"
                                        sx={{ gap: compact ? 0.5 : 1, mt: 1 }}
                                      >
                                        {location.environment.ambience.sensoryDetails.map(
                                          (detail, idx) => (
                                            <Chip
                                              key={`sensory-${idx}`}
                                              label={capitalizeWords(
                                                detail || ""
                                              )}
                                              size="small"
                                              variant="outlined"
                                              sx={{
                                                ...chipStyles,
                                                fontFamily: brand.fonts.body,
                                                bgcolor: "action.hover",
                                              }}
                                            />
                                          )
                                        )}
                                      </Stack>
                                    )}
                                  </Stack>
                                </Box>
                              )}
                            </Stack>
                          </Box>
                        )
                      )}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        p: 3,
                        textAlign: "center",
                        bgcolor: "action.hover",
                        borderRadius: `${brand.borderRadius}px`,
                        border: 1,
                        borderColor: "divider",
                        borderStyle: "dashed",
                      }}
                    >
                      <Typography
                        color="text.secondary"
                        sx={{ fontFamily: brand.fonts.body }}
                      >
                        No location details available
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Characters Section */}
            {!compact && (
              <Grid size={{ xs: 12, md: 6 }}>
                <CharacterList characters={characters} />
              </Grid>
            )}

            {compact && characters.length > 0 && (
              <Grid size={{ xs: 12 }}>
                <CharacterList characters={characters} compact={compact} />
              </Grid>
            )}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}
