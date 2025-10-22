// src/app/(protected)/notifications/page.tsx
"use client";

import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  Avatar,
  Stack,
  alpha,
} from "@mui/material";
import { NotificationSettings } from "@/components/notifications/NotificationSettings";
import { useNotificationStore } from "@/store/notificationStore";
import {
  MarkEmailRead as MarkReadIcon,
  DeleteSweep as DeleteAllIcon,
  Delete as DeleteIcon,
  CreditCard as CreditIcon,
  Security as SecurityIcon,
  CheckCircle as CheckCircleIcon,
  Announcement as AnnouncementIcon,
  Update as UpdateIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { NotificationType } from "@/types/notifications";
import { useRouter } from "next/navigation";

// Extended notification data interface
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

export default function NotificationsPage() {
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    markAsRead,
  } = useNotificationStore();

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
        return <AnnouncementIcon fontSize="small" />;
    }
  };

  const handleNotificationClick = (
    id: string,
    read: boolean,
    notificationData?: NotificationData
  ) => {
    if (!read) {
      markAsRead(id);
    }

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

  const renderProjectInfo = (notification: (typeof notifications)[0]) => {
    const data = notification.data as NotificationData | undefined;
    const hasProjectData =
      data?.fromUserName || data?.fromUserEmail || data?.projectType;

    if (!hasProjectData) {
      return null;
    }

    return (
      <Box
        sx={{
          mt: 2,
          pt: 2,
          borderTop: 1,
          borderColor: "divider",
        }}
      >
        {/* Shared By Section */}
        {(data?.fromUserName || data?.fromUserEmail) && (
          <Box sx={{ mb: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mb: 1 }}
            >
              Shared by
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: "primary.main",
                }}
              >
                {data?.fromUserName?.charAt(0) ||
                  data?.fromUserEmail?.charAt(0)}
              </Avatar>
              <Box>
                {data?.fromUserName && (
                  <Typography variant="body2" fontWeight={600}>
                    {data.fromUserName}
                  </Typography>
                )}
                {data?.fromUserEmail && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block" }}
                  >
                    {data.fromUserEmail}
                  </Typography>
                )}
              </Box>
            </Stack>
          </Box>
        )}

        {/* Project Type */}
        {data?.projectType &&
          (() => {
            const typeInfo = getProjectTypeInfo(data.projectType);
            const IconComponent = typeInfo.icon;
            return (
              <Box sx={{ mb: 2 }}>
                <Chip
                  label={typeInfo.label}
                  size="small"
                  icon={<IconComponent />}
                  color="primary"
                  variant="outlined"
                />
              </Box>
            );
          })()}

        {/* Action Button */}
        {(data?.scriptId || data?.actionUrl) && (
          <Button
            variant="contained"
            startIcon={<ViewIcon />}
            size="small"
            onClick={() =>
              handleNotificationClick(notification.id, notification.read, data)
            }
            sx={{ textTransform: "none", alignSelf: "flex-start" }}
          >
            View Project
          </Button>
        )}
      </Box>
    );
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box>
            <Typography variant="h4" fontWeight={600} gutterBottom>
              Notifications
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your notification preferences and view all notifications
            </Typography>
          </Box>

          {/* Action Buttons */}
          {notifications.length > 0 && (
            <Box sx={{ display: "flex", gap: 1 }}>
              {unreadCount > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<MarkReadIcon />}
                  onClick={markAllAsRead}
                  size="small"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteAllIcon />}
                onClick={clearNotifications}
                size="small"
              >
                Clear all
              </Button>
            </Box>
          )}
        </Box>

        {/* Notification Cards */}
        {notifications.length === 0 ? (
          <Card>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <AnnouncementIcon
                sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
              />
              <Typography variant="h6" gutterBottom>
                No notifications
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You are all caught up! Check back later for updates.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {notifications.map((notification) => {
              const data = notification.data as NotificationData | undefined;

              return (
                <Card
                  key={notification.id}
                  sx={{
                    cursor: "pointer",
                    transition: "all 0.2s",
                    bgcolor: notification.read
                      ? "background.paper"
                      : (theme) => alpha(theme.palette.primary.main, 0.04),
                    "&:hover": {
                      boxShadow: 4,
                      transform: "translateY(-2px)",
                    },
                  }}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.read,
                      data
                    )
                  }
                >
                  <CardContent>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 2,
                      }}
                    >
                      {/* Icon/Image */}
                      {notification.image ? (
                        <Avatar
                          src={notification.image}
                          alt={notification.title}
                          variant="rounded"
                          sx={{
                            width: 80,
                            height: 80,
                            border: 1,
                            borderColor: "divider",
                          }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            bgcolor: (theme) =>
                              alpha(theme.palette.primary.main, 0.1),
                          }}
                        >
                          {getNotificationIcon(notification.type)}
                        </Box>
                      )}

                      {/* Content */}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        {/* Title & Delete Button */}
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            mb: 1,
                          }}
                        >
                          <Typography
                            variant="h6"
                            fontWeight={notification.read ? 500 : 700}
                            sx={{ pr: 2 }}
                          >
                            {notification.title}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            sx={{ flexShrink: 0 }}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Body */}
                        <Typography
                          variant="body1"
                          color="text.secondary"
                          sx={{ mb: 1 }}
                        >
                          {notification.body}
                        </Typography>

                        {/* Metadata */}
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 2,
                            flexWrap: "wrap",
                          }}
                        >
                          <Chip
                            label={notification.type.replace(/_/g, " ")}
                            size="small"
                            variant="outlined"
                          />
                          <Typography variant="caption" color="text.secondary">
                            {formatDistanceToNow(
                              new Date(notification.createdAt),
                              {
                                addSuffix: true,
                              }
                            )}
                          </Typography>
                          {!notification.read && (
                            <Chip
                              label="New"
                              size="small"
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>

                        {/* Project-specific information */}
                        {renderProjectInfo(notification)}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
        )}

        {/* Settings Section */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" fontWeight={600} gutterBottom>
            Notification Preferences
          </Typography>
          <NotificationSettings />
        </Box>
      </Box>
    </Container>
  );
}
