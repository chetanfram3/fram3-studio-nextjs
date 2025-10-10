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
} from "@mui/icons-material";
import { useNotificationStore } from "@/store/notificationStore";
import { NotificationType } from "@/types/notifications";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

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
      console.log(`  [${i}] ${n.title} - Image: ${n.image || "NO IMAGE"}`);
    });
  }, [notifications]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: string, actionUrl?: string) => {
    markAsRead(id);
    handleClose();
    if (actionUrl) {
      router.push(actionUrl);
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
          <NotificationIcon color="primary"/>
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
              minWidth: 360,
              maxWidth: 420,
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
              // Debug log for each notification
              console.log(`Rendering notification ${notification.id}:`, {
                hasImage: !!notification.image,
                imageUrl: notification.image,
              });

              return (
                <MenuItem
                  key={notification.id}
                  onClick={() =>
                    handleNotificationClick(
                      notification.id,
                      notification.actionUrl
                    )
                  }
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
                  }}
                >
                  {/* Show image if available, otherwise show icon */}
                  {notification.image ? (
                    <Avatar
                      src={notification.image}
                      alt={notification.title}
                      sx={{
                        width: 40,
                        height: 40,
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
                            notification.image
                          );
                          console.error("Error:", e);
                        },
                      }}
                    />
                  ) : (
                    <ListItemIcon sx={{ minWidth: "auto", mt: 0.5 }}>
                      {getNotificationIcon(notification.type)}
                    </ListItemIcon>
                  )}

                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/* Title */}
                    <Typography
                      variant="body2"
                      fontWeight={notification.read ? 400 : 600}
                      sx={{ mb: 0.5 }}
                    >
                      {notification.title}
                    </Typography>

                    {/* Body */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 0.5 }}
                    >
                      {notification.body}
                    </Typography>

                    {/* Timestamp */}
                    <Typography variant="caption" color="text.secondary">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        addSuffix: true,
                      })}
                    </Typography>
                  </Box>

                  <IconButton
                    size="small"
                    onClick={(e) => handleDelete(notification.id, e)}
                    sx={{ ml: "auto", flexShrink: 0 }}
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
