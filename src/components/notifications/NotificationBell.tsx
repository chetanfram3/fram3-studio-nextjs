// src/components/notifications/NotificationBell.tsx
"use client";

import { useState, useEffect } from "react";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  ListItemIcon,
  alpha,
  Avatar,
  Chip,
  Stack,
} from "@mui/material";
import {
  NotificationsOutlined as NotificationIcon,
  CreditCard as CreditIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Announcement as AnnouncementIcon,
  Update as UpdateIcon,
  MarkEmailRead as MarkReadIcon,
  DeleteOutline as DeleteIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationType } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

// Extended notification data interface for project-specific data
interface NotificationData {
  fromUserName?: string;
  fromUserEmail?: string;
  fromUserId?: string;
  scriptId?: string;
  versionId?: string;
  projectType?: string;
  actionUrl?: string;
  [key: string]: unknown;
}

export function NotificationBell() {
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
  } = useNotificationStore();

  // Debug: Log notifications when they change
  useEffect(() => {
    console.log("🔔 Notifications updated:", notifications);
    notifications.forEach((n, i) => {
      console.log(`  [${i}] ${n.title}`, {
        data: n.data,
        image: n.image,
        actionUrl: n.actionUrl,
      });
    });
  }, [notifications]);

  // Helper to get project type display info
  const getProjectTypeInfo = (projectType?: string) => {
    switch (projectType) {
      case "analysisPush":
        return { label: "Shared Project", icon: ShareIcon };
      case "analysisComplete":
        return { label: "Analysis Complete", icon: CheckCircleIcon };
      case "analysisPaused":
        return { label: "Analysis Paused", icon: AnnouncementIcon };
      case "videoGenerationPaused":
        return { label: "Video Paused", icon: AnnouncementIcon };
      case "videoGenerationCompleted":
        return { label: "Video Complete", icon: CheckCircleIcon };
      default:
        return { label: projectType || "Project", icon: UpdateIcon };
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (
    id: string,
    notificationData?: NotificationData
  ) => {
    markAsRead(id);
    handleClose();

    // Handle navigation based on notification data
    if (notificationData) {
      const { projectType, scriptId, versionId, actionUrl } = notificationData;

      // Special handling for analysisPush and analysisComplete - go to story view
      if (
        (projectType === "analysisComplete" ||
          projectType === "analysisPush") &&
        scriptId &&
        versionId
      ) {
        router.push(`/story/${scriptId}/version/${versionId}`);
        return;
      }

      // Analysis paused - go to step 3
      if (projectType === "analysisPaused" && scriptId && versionId) {
        router.push(`/story/${scriptId}/version/${versionId}/3`);
        return;
      }

      // Video generation paused - go to step 2
      if (projectType === "videoGenerationPaused" && scriptId && versionId) {
        router.push(`/story/${scriptId}/version/${versionId}/2`);
        return;
      }

      // Video generation completed - go to step 2
      if (projectType === "videoGenerationCompleted" && scriptId && versionId) {
        router.push(`/story/${scriptId}/version/${versionId}/2`);
        return;
      }

      // Use actionUrl if provided and not handled above
      if (actionUrl) {
        router.push(actionUrl);
        return;
      }

      // Fallback to story view if we have scriptId and versionId
      if (scriptId && versionId) {
        router.push(`/story/${scriptId}/version/${versionId}`);
        return;
      }
    }
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
  };

  const handleDelete = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    removeNotification(id);
  };

  const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.CREDIT_ALERT:
        return <CreditIcon fontSize="small" color="warning" />;
      case NotificationType.MFA_CODE:
        return <SecurityIcon fontSize="small" color="primary" />;
      case NotificationType.PROJECT_COMPLETION:
        return <CheckCircleIcon fontSize="small" color="success" />;
      case NotificationType.SYSTEM_ANNOUNCEMENT:
        return <AnnouncementIcon fontSize="small" color="info" />;
      case NotificationType.REAL_TIME_UPDATE:
        return <UpdateIcon fontSize="small" color="secondary" />;
      default:
        return <NotificationIcon fontSize="small" />;
    }
  };

  // Helper to render project-specific UI
  const renderProjectNotification = (
    notification: (typeof notifications)[0]
  ) => {
    const data = notification.data as NotificationData | undefined;
    const hasProjectData =
      data?.fromUserName || data?.fromUserEmail || data?.projectType;

    if (!hasProjectData) {
      return null;
    }

    return (
      <Box sx={{ mt: 1, pt: 1, borderTop: 1, borderColor: "divider" }}>
        {/* User Info */}
        {(data?.fromUserName || data?.fromUserEmail) && (
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Avatar
              sx={{
                width: 24,
                height: 24,
                fontSize: "0.75rem",
                bgcolor: "primary.main",
              }}
            >
              {data?.fromUserName?.charAt(0) || data?.fromUserEmail?.charAt(0)}
            </Avatar>
            <Box>
              {data?.fromUserName && (
                <Typography
                  variant="caption"
                  fontWeight={600}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    display: "block",
                  }}
                >
                  {data.fromUserName}
                </Typography>
              )}
              {data?.fromUserEmail && (
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    display: "block",
                    fontSize: "0.7rem",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {data.fromUserEmail}
                </Typography>
              )}
            </Box>
          </Stack>
        )}

        {/* Project Type Badge */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 1,
          }}
        >
          {data?.projectType &&
            (() => {
              const typeInfo = getProjectTypeInfo(data.projectType);
              const IconComponent = typeInfo.icon;
              return (
                <Chip
                  label={typeInfo.label}
                  size="small"
                  icon={<IconComponent sx={{ fontSize: "0.875rem" }} />}
                  sx={{
                    height: 28,
                    fontSize: "0.75rem",
                    "& .MuiChip-label": { px: 0.75 },
                    "& .MuiSvgIcon-root": { fontSize: "1rem" },
                  }}
                />
              );
            })()}

          {(data?.scriptId || data?.actionUrl) && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<ViewIcon />}
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationClick(notification.id, data);
              }}
              sx={{
                height: 28,
                py: 0,
                px: 1.5,
                fontSize: "0.75rem",
                textTransform: "none",
                minWidth: "auto",
              }}
            >
              View Project
            </Button>
          )}
        </Box>
      </Box>
    );
  };

  const open = Boolean(anchorEl);
  const displayNotifications = notifications.slice(0, 10);

  return (
    <>
      <IconButton
        onClick={handleClick}
        size="large"
        aria-label={`${unreadCount} unread notifications`}
        color="inherit"
      >
        <Badge badgeContent={unreadCount} color="error">
          <NotificationIcon color="primary" />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        transformOrigin={{ horizontal: "right", vertical: "top" }}
        anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
        slotProps={{
          paper: {
            elevation: 3,
            sx: {
              mt: 1.5,
              minWidth: 380,
              maxWidth: 480,
              maxHeight: 600,
              borderRadius: 2,
            },
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            px: 2,
            py: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Button
              size="small"
              startIcon={<MarkReadIcon />}
              onClick={handleMarkAllRead}
            >
              Mark all read
            </Button>
          )}
        </Box>

        <Divider />

        {/* Notification List */}
        {displayNotifications.length === 0 ? (
          <Box sx={{ px: 2, py: 4, textAlign: "center" }}>
            <NotificationIcon
              sx={{ fontSize: 48, color: "text.secondary", mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              No notifications yet
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
            {displayNotifications.map((notification) => {
              const data = notification.data as NotificationData | undefined;

              return (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, data)}
                  sx={{
                    px: 2,
                    py: 1.5,
                    bgcolor: notification.read
                      ? "transparent"
                      : (theme) => alpha(theme.palette.primary.main, 0.08),
                    "&:hover": {
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.12),
                    },
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 1.5,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  {/* Icon or Image */}
                  {notification.image ? (
                    <Avatar
                      src={notification.image}
                      alt={notification.title}
                      sx={{
                        width: 48,
                        height: 48,
                        mt: 0.5,
                        border: 1,
                        borderColor: "divider",
                      }}
                      imgProps={{
                        onLoad: () =>
                          console.log("✅ Image loaded:", notification.image),
                        onError: (e) => {
                          console.error(
                            "❌ Image failed to load:",
                            notification.image,
                            e
                          );
                        },
                      }}
                    />
                  ) : (
                    <ListItemIcon sx={{ minWidth: "auto", mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                  )}

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Title */}
                    <Typography
                      variant="body2"
                      fontWeight={notification.read ? 400 : 600}
                      sx={{
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-word",
                      }}
                    >
                      {notification.title}
                    </Typography>

                    {/* Body */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 0.5,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        wordBreak: "break-word",
                      }}
                    >
                      {notification.body}
                    </Typography>

                    {/* Timestamp */}
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>

                    {/* Project-specific UI */}
                    {renderProjectNotification(notification)}
                  </Box>

                  {/* Delete Button */}
                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(notification.id, e)}
                    sx={{ ml: "auto", flexShrink: 0, alignSelf: "flex-start" }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </MenuItem>
              );
            })}
          </Box>
        )}

        <Divider />

        {/* Footer */}
        <Box sx={{ px: 2, py: 1, textAlign: "center" }}>
          <Button
            fullWidth
            size="small"
            onClick={() => {
              handleClose();
              router.push("/notifications");
            }}
          >
            View All Notifications
          </Button>
        </Box>
      </Menu>
    </>
  );
}
