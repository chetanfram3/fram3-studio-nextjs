// src/components/imageEditor/ImageEditorToolbar.tsx
"use client";

import { Box, IconButton, Tooltip, Badge, alpha, Stack } from "@mui/material";
import {
  Edit as EditIcon,
  AutoAwesome as GenerateIcon,
  ZoomIn as UpscaleIcon,
  Layers as LayersIcon,
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

export interface ToolbarButton {
  id: string;
  label: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
  tooltip: string;
  badge?: number;
}

interface ImageEditorToolbarProps {
  buttons: ToolbarButton[];
  compact?: boolean;
}

/**
 * ImageEditorToolbar - Compact, modern toolbar for image editing actions
 *
 * Features:
 * - Compact height (40px)
 * - Glassmorphism effect
 * - Active state indicators
 * - Badge support for counters
 * - Fully theme-aware
 * - Smooth animations
 */
export function ImageEditorToolbar({
  buttons,
  compact = true,
}: ImageEditorToolbarProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();

  // Compact vs full size
  const buttonSize = compact ? 36 : 48;
  const iconSize = compact ? "small" : "medium";
  const padding = compact ? 0.75 : 1.5;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        py: padding,
        px: 2,
        bgcolor: alpha(theme.palette.background.paper, 0.8),
        backdropFilter: "blur(12px)",
        borderTop: 1,
        borderColor: alpha(theme.palette.divider, 0.5),
        boxShadow: `0 -4px 12px ${alpha(theme.palette.common.black, 0.05)}`,
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          alignItems: "center",
        }}
      >
        {buttons.map((button, index) => (
          <Tooltip key={button.id} title={button.tooltip} arrow>
            <span>
              <IconButton
                onClick={button.onClick}
                disabled={button.disabled}
                size={iconSize}
                sx={{
                  width: buttonSize,
                  height: buttonSize,
                  position: "relative",
                  borderRadius: `${brand.borderRadius / 2}px`,
                  bgcolor: button.active ? "primary.main" : "transparent",
                  color: button.active
                    ? "primary.contrastText"
                    : "text.secondary",
                  border: 1,
                  borderColor: button.active
                    ? "primary.main"
                    : alpha(theme.palette.divider, 0.3),
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",

                  // Active indicator
                  "&::after": button.active
                    ? {
                        content: '""',
                        position: "absolute",
                        bottom: -padding * 8,
                        left: "50%",
                        transform: "translateX(-50%)",
                        width: "60%",
                        height: 2,
                        bgcolor: "primary.main",
                        borderRadius: 1,
                      }
                    : {},

                  "&:hover": button.disabled
                    ? {}
                    : {
                        bgcolor: button.active
                          ? "primary.dark"
                          : alpha(theme.palette.primary.main, 0.08),
                        borderColor: "primary.main",
                        color: button.active
                          ? "primary.contrastText"
                          : "primary.main",
                        transform: "translateY(-2px)",
                        boxShadow: `0 4px 8px ${alpha(
                          theme.palette.primary.main,
                          0.2
                        )}`,
                      },

                  "&:active": button.disabled
                    ? {}
                    : {
                        transform: "translateY(0)",
                      },

                  "&:disabled": {
                    bgcolor: "transparent",
                    borderColor: alpha(theme.palette.divider, 0.2),
                    color: alpha(theme.palette.text.disabled, 0.3),
                    cursor: "not-allowed",
                  },
                }}
              >
                {button.badge ? (
                  <Badge
                    badgeContent={button.badge}
                    color="error"
                    sx={{
                      "& .MuiBadge-badge": {
                        fontSize: "0.625rem",
                        height: 16,
                        minWidth: 16,
                        padding: "0 4px",
                        fontWeight: 700,
                      },
                    }}
                  >
                    {button.icon}
                  </Badge>
                ) : (
                  button.icon
                )}
              </IconButton>
            </span>
          </Tooltip>
        ))}
      </Stack>
    </Box>
  );
}

// Export for convenience
export { EditIcon, GenerateIcon, UpscaleIcon, LayersIcon };
