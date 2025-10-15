"use client";

import { useState } from "react";
import { IconButton, Tooltip } from "@mui/material";
import { Image } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useMutation } from "@tanstack/react-query";
import { getCurrentBrand } from "@/config/brandConfig";
import { generateImages } from "./api";
import type {
  GeneratorButtonProps,
  GeneratorResponse,
  GeneratorParams,
} from "./types";
import { useAuthStore } from "@/store/authStore";

/**
 * ImageGeneratorButton - Triggers image generation for scenes and shots
 *
 * Performance optimizations (React 19):
 * - No manual React.memo (compiler handles optimization)
 * - Uses React Query for efficient mutation handling
 * - Temporary disable state prevents duplicate requests
 *
 * Theme integration:
 * - Uses theme.palette for colors via IconButton color prop
 * - Uses brand configuration for border radius
 * - Respects light/dark mode automatically
 * - No hardcoded colors
 *
 * @param scriptId - The ID of the script
 * @param versionId - The version ID of the script
 * @param onStatusChange - Callback when generation status changes
 * @param disabled - Whether the button should be disabled
 */

export default function ImageGeneratorButton({
  scriptId,
  versionId,
  onStatusChange,
  disabled = false,
}: GeneratorButtonProps & { disabled?: boolean }) {
  const theme = useTheme();
  const brand = getCurrentBrand();
  const { user } = useAuthStore();
  const [isTemporarilyDisabled, setIsTemporarilyDisabled] = useState(false);

  const { mutate, isPending } = useMutation<
    GeneratorResponse,
    Error,
    GeneratorParams
  >({
    mutationFn: generateImages,
    onSuccess: (response) => {
      const success =
        response.message ===
        "Scene and shot processing started in the background!";
      if (success) {
        setIsTemporarilyDisabled(true);
        setTimeout(() => setIsTemporarilyDisabled(false), 20000);
      }
      onStatusChange(success);
    },
    onError: () => onStatusChange(false),
  });

  const handleClick = () => {
    if (!user?.uid) return;

    mutate({
      userId: user.uid,
      scriptId,
      versionId,
      analysisType: "processScenesAndShots",
    });
  };

  return (
    <Tooltip title="Generate Images" arrow>
      <span>
        <IconButton
          onClick={handleClick}
          disabled={isPending || disabled || isTemporarilyDisabled}
          color="primary"
          sx={{
            borderRadius: `${brand.borderRadius * 0.5}px`,
            transition: theme.transitions.create(
              ["background-color", "transform"],
              { duration: theme.transitions.duration.shorter }
            ),
            "&:hover": {
              transform: "scale(1.05)",
            },
            "&:active": {
              transform: "scale(0.98)",
            },
          }}
        >
          <Image />
        </IconButton>
      </span>
    </Tooltip>
  );
}
