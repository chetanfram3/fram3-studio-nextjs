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
} from "@mui/icons-material";
import { formatDistanceToNow } from "date-fns";
import { NotificationType } from "@/types/notifications";

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    markAsRead,
  } = useNotificationStore();

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

  const handleNotificationClick = (id: string, read: boolean) => {
    if (!read) {
      markAsRead(id);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
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
                  Mark All Read ({unreadCount})
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<DeleteAllIcon />}
                onClick={clearNotifications}
                size="small"
              >
                Clear All
              </Button>
            </Box>
          )}
        </Box>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {/* Notification Settings */}
          <NotificationSettings />

          {/* All Notifications */}
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  mb: 2,
                }}
              >
                <Typography variant="h6">
                  All Notifications ({notifications.length})
                </Typography>
                {unreadCount > 0 && (
                  <Chip
                    label={`${unreadCount} unread`}
                    color="primary"
                    size="small"
                  />
                )}
              </Box>

              {notifications.length === 0 ? (
                <Box sx={{ py: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No notifications yet
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                    mt: 2,
                  }}
                >
                  {notifications.map((notification) => {
                    const hasImage = Boolean(notification.image);

                    return (
                      <Box
                        key={notification.id}
                        onClick={() =>
                          handleNotificationClick(
                            notification.id,
                            notification.read
                          )
                        }
                        sx={{
                          p: 2,
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                          bgcolor: notification.read
                            ? "transparent"
                            : "action.hover",
                          display: "flex",
                          gap: 2,
                          alignItems: "flex-start",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          "&:hover": {
                            bgcolor: "action.selected",
                            boxShadow: 1,
                          },
                        }}
                      >
                        {/* Image or Icon */}
                        <Box sx={{ width: 60, height: 60, flexShrink: 0 }}>
                          {hasImage && notification.image ? (
                            <Box
                              component="img"
                              src={notification.image}
                              alt={notification.title}
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                objectFit: "cover",
                                border: 1,
                                borderColor: "divider",
                              }}
                              onError={(e) => {
                                console.error(
                                  "Failed to load image:",
                                  notification.image
                                );
                              }}
                            />
                          ) : (
                            <Box
                              sx={{
                                width: 60,
                                height: 60,
                                borderRadius: 2,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                bgcolor: "action.hover",
                                border: 1,
                                borderColor: "divider",
                              }}
                            >
                              {getNotificationIcon(notification.type)}
                            </Box>
                          )}
                        </Box>

                        {/* Content */}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography
                              variant="subtitle1"
                              fontWeight={notification.read ? 400 : 600}
                            >
                              {notification.title}
                            </Typography>
                            {!notification.read && (
                              <Chip label="New" color="primary" size="small" />
                            )}
                          </Box>

                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{ mb: 1 }}
                          >
                            {notification.body}
                          </Typography>

                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 2,
                            }}
                          >
                            <Chip
                              label={notification.type.replace("_", " ")}
                              size="small"
                              variant="outlined"
                            />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {formatDistanceToNow(
                                new Date(notification.createdAt),
                                {
                                  addSuffix: true,
                                }
                              )}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Delete Button */}
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          color="error"
                          sx={{ flexShrink: 0 }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
}
