"use client";

import { Button, Tooltip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { BugReportOutlined as DebugIcon } from "@mui/icons-material";
import { useSubscription } from "@/hooks/auth/useSubscription";

interface DebugButtonProps {
  scriptId: string;
  versionId: string;
}

export function DebugButton({ scriptId, versionId }: DebugButtonProps) {
  const theme = useTheme();
  const { isAdmin } = useSubscription();

  // Only render if user is admin
  if (!isAdmin) {
    return null;
  }

  const handleDebugClick = () => {
    const debugUrl = `/scripts/${scriptId}/version/${versionId}`;
    window.open(debugUrl, "_blank");
  };

  return (
    <Tooltip title="Open Debug Panel" arrow>
      <Button
        onClick={handleDebugClick}
        variant="contained"
        size="small"
        color="primary"
        sx={{
          minWidth: "auto",
          px: 1.5,
          py: 0.5,
          transition: theme.transitions.create(
            ["background-color", "transform", "box-shadow"],
            { duration: theme.transitions.duration.short }
          ),
          textTransform: "none",
          fontWeight: 500,
          fontSize: "0.8rem",
          "&:hover": {
            transform: "translateY(-1px)",
            boxShadow: theme.shadows[4],
          },
          "&:active": {
            transform: "translateY(0)",
            boxShadow: theme.shadows[2],
          },
        }}
        startIcon={
          <DebugIcon
            fontSize="small"
            sx={{
              transition: theme.transitions.create("color", {
                duration: theme.transitions.duration.short,
              }),
            }}
          />
        }
      >
        Debug
      </Button>
    </Tooltip>
  );
}

DebugButton.displayName = "DebugButton";

export default DebugButton;
