"use client";

import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from "@mui/icons-material";
import { getCurrentBrand } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface AudioMenuProps {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  audioType: string;
  onEditPrompt: () => void;
  onRegenerateAudio: () => void;
  onShowVersionHistory?: () => void;
  isProcessing?: boolean;
  hasVersionedAudio?: boolean;
  totalVersions?: number;
  isAudioProcessorCompleted?: boolean;
}

// ===========================
// HELPER FUNCTIONS
// ===========================

const getAudioTypeName = (type: string): string => {
  switch (type.toLowerCase()) {
    case "dialogue":
      return "Dialogue";
    case "foley":
      return "Foley";
    case "roomtone":
    case "room-tone":
      return "Room Tone";
    case "music":
      return "Music";
    default:
      return type.charAt(0).toUpperCase() + type.slice(1);
  }
};

// ===========================
// MAIN COMPONENT
// ===========================

export function AudioMenu({
  anchorEl,
  open,
  onClose,
  audioType,
  onEditPrompt,
  onRegenerateAudio,
  onShowVersionHistory,
  isAudioProcessorCompleted,
  isProcessing = false,
  hasVersionedAudio = false,
  totalVersions = 0,
}: AudioMenuProps) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const audioTypeName = getAudioTypeName(audioType);

  const handleMenuItemClick =
    (callback: () => void) => (event: React.MouseEvent<HTMLLIElement>) => {
      event.preventDefault();
      event.stopPropagation();
      callback();
    };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={onClose}
      disablePortal={false}
      keepMounted={false}
      transformOrigin={{
        vertical: "top",
        horizontal: "right",
      }}
      anchorOrigin={{
        vertical: "bottom",
        horizontal: "right",
      }}
      slotProps={{
        paper: {
          sx: {
            borderRadius: `${brand.borderRadius}px`,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            boxShadow: theme.shadows[8],
            minWidth: "240px",
            overflow: "hidden",
            "& .MuiList-root": {
              padding: 1,
            },
          },
        },
      }}
    >
      {/* Edit Menu Item */}
      <MenuItem
        onClick={handleMenuItemClick(onEditPrompt)}
        sx={{
          borderRadius: `${brand.borderRadius}px`,
          m: 0.25,
          px: 1.5,
          py: 1.25,
          minHeight: "auto",
          transition: theme.transitions.create(
            ["background-color", "transform"],
            { duration: theme.transitions.duration.short }
          ),
          "&:hover": {
            bgcolor: "action.hover",
            transform: "translateX(2px)",
            "& .MuiListItemIcon-root": {
              color: "primary.main",
            },
            "& .MuiTypography-root": {
              color: "primary.main",
              fontWeight: 600,
            },
          },
          "&.Mui-disabled": {
            opacity: 0.5,
          },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: 32,
            color: "text.secondary",
            transition: theme.transitions.create("color", {
              duration: theme.transitions.duration.short,
            }),
          }}
        >
          <EditIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>
          <Typography
            variant="body2"
            sx={{
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: theme.transitions.create(["color", "font-weight"], {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            Edit {audioTypeName}
          </Typography>
        </ListItemText>
      </MenuItem>

      {/* Regenerate Audio Menu Item */}
      {isAudioProcessorCompleted && (
        <MenuItem
          onClick={handleMenuItemClick(onRegenerateAudio)}
          disabled={isProcessing}
          sx={{
            borderRadius: `${brand.borderRadius}px`,
            m: 0.25,
            px: 1.5,
            py: 1.25,
            minHeight: "auto",
            transition: theme.transitions.create(
              ["background-color", "transform"],
              { duration: theme.transitions.duration.short }
            ),
            "&:hover": {
              bgcolor: "action.hover",
              transform: "translateX(2px)",
              "& .MuiListItemIcon-root": {
                color: "primary.main",
              },
              "& .MuiTypography-root": {
                color: "primary.main",
                fontWeight: 600,
              },
            },
            "&.Mui-disabled": {
              opacity: 0.5,
            },
          }}
        >
          <ListItemIcon
            sx={{
              minWidth: 32,
              color: "text.secondary",
              transition: theme.transitions.create("color", {
                duration: theme.transitions.duration.short,
              }),
            }}
          >
            <RefreshIcon
              fontSize="small"
              sx={{
                animation: isProcessing ? "spin 1s linear infinite" : "none",
                "@keyframes spin": {
                  "0%": { transform: "rotate(0deg)" },
                  "100%": { transform: "rotate(360deg)" },
                },
              }}
            />
          </ListItemIcon>
          <ListItemText>
            <Typography
              variant="body2"
              sx={{
                fontSize: "0.875rem",
                fontWeight: 500,
                transition: theme.transitions.create(["color", "font-weight"], {
                  duration: theme.transitions.duration.short,
                }),
              }}
            >
              {isProcessing ? "Regenerating..." : "Regenerate Audio"}
            </Typography>
          </ListItemText>
        </MenuItem>
      )}

      {/* Version History Section */}
      {hasVersionedAudio && onShowVersionHistory && (
        <>
          <Divider
            sx={{
              my: 1,
              borderColor: "divider",
              opacity: 0.5,
            }}
          />
          <MenuItem
            onClick={handleMenuItemClick(() => {
              onShowVersionHistory();
              onClose();
            })}
            sx={{
              borderRadius: `${brand.borderRadius}px`,
              m: 0.25,
              px: 1.5,
              py: 1.25,
              minHeight: "auto",
              transition: theme.transitions.create(
                ["background-color", "transform"],
                { duration: theme.transitions.duration.short }
              ),
              "&:hover": {
                bgcolor: "action.hover",
                transform: "translateX(2px)",
                "& .MuiListItemIcon-root": {
                  color: "primary.main",
                },
                "& .MuiTypography-root": {
                  color: "primary.main",
                  fontWeight: 600,
                },
              },
            }}
          >
            <ListItemIcon
              sx={{
                minWidth: 32,
                color: "text.secondary",
                transition: theme.transitions.create("color", {
                  duration: theme.transitions.duration.short,
                }),
              }}
            >
              <HistoryIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>
              <Typography
                variant="body2"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  transition: theme.transitions.create(
                    ["color", "font-weight"],
                    {
                      duration: theme.transitions.duration.short,
                    }
                  ),
                }}
              >
                Version History
              </Typography>
            </ListItemText>
            {totalVersions > 0 && (
              <Box
                sx={{
                  bgcolor: "primary.light",
                  color: "primary.main",
                  borderRadius: `${brand.borderRadius}px`,
                  px: 1,
                  py: 0.25,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  ml: "auto",
                }}
              >
                {totalVersions}
              </Box>
            )}
          </MenuItem>
        </>
      )}
    </Menu>
  );
}

export default AudioMenu;
