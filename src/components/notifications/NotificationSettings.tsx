"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Button,
} from "@mui/material";
import { NotificationsActive as NotificationIcon } from "@mui/icons-material";
import { useNotificationStore } from "@/store/notificationStore";
import {
  initializeFCM,
  requestNotificationPermission,
} from "@/services/fcmService";
import { useState } from "react";

export function NotificationSettings() {
  const { preferences, permissionGranted, updatePreferences } =
    useNotificationStore();
  const [requesting, setRequesting] = useState(false);

  const handlePermissionRequest = async () => {
    setRequesting(true);
    await requestNotificationPermission();
    await initializeFCM();
    setRequesting(false);
  };

  const handleToggle = (key: keyof typeof preferences) => {
    updatePreferences({ [key]: !preferences[key] });
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
          <NotificationIcon color="primary" />
          <Typography variant="h6">Notification Preferences</Typography>
        </Box>

        {!permissionGranted && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Browser notifications are disabled. Enable them to receive real-time
            alerts.
            <Button
              size="small"
              onClick={handlePermissionRequest}
              disabled={requesting}
              sx={{ ml: 2 }}
            >
              Enable Notifications
            </Button>
          </Alert>
        )}

        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <FormControlLabel
            control={
              <Switch
                checked={preferences.creditAlerts}
                onChange={() => handleToggle("creditAlerts")}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Credit Alerts</Typography>
                <Typography variant="caption" color="text.secondary">
                  Get notified when your credit balance is low
                </Typography>
              </Box>
            }
          />

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.mfaCodes}
                onChange={() => handleToggle("mfaCodes")}
              />
            }
            label={
              <Box>
                <Typography variant="body1">MFA Codes</Typography>
                <Typography variant="caption" color="text.secondary">
                  Receive multi-factor authentication codes
                </Typography>
              </Box>
            }
          />

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.projectCompletions}
                onChange={() => handleToggle("projectCompletions")}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Project Completions</Typography>
                <Typography variant="caption" color="text.secondary">
                  Get notified when your projects are completed
                </Typography>
              </Box>
            }
          />

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.systemAnnouncements}
                onChange={() => handleToggle("systemAnnouncements")}
              />
            }
            label={
              <Box>
                <Typography variant="body1">System Announcements</Typography>
                <Typography variant="caption" color="text.secondary">
                  Important updates and announcements
                </Typography>
              </Box>
            }
          />

          <Divider />

          <FormControlLabel
            control={
              <Switch
                checked={preferences.realTimeUpdates}
                onChange={() => handleToggle("realTimeUpdates")}
              />
            }
            label={
              <Box>
                <Typography variant="body1">Real-time Updates</Typography>
                <Typography variant="caption" color="text.secondary">
                  Live updates on your projects and activities
                </Typography>
              </Box>
            }
          />
        </Box>
      </CardContent>
    </Card>
  );
}
