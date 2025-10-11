"use client";

import { useState, useEffect } from "react";
import IconButton from "@mui/material/IconButton";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import { styled } from "@mui/material/styles";
import { setFavourite } from "@/services/scriptService";
import CustomToast from "@/components/common/CustomToast";
import { Tooltip } from "@mui/material";
import { useRefetchQuery } from "@/hooks/scripts/useRefetchQuery";

interface FavoriteButtonProps {
  scriptId: string;
  initialFavorite: boolean;
}

const StyledIconButton = styled(IconButton)(({ theme }) => ({
  color: theme.palette.grey[400],
  "&:hover": {
    backgroundColor: "transparent",
  },
}));

export function FavoriteButton({
  scriptId,
  initialFavorite,
}: FavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  const { invalidateAndRefetch } = useRefetchQuery();

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  const toggleFavorite = async () => {
    setIsLoading(true);

    try {
      await setFavourite(scriptId, !isFavorite);
      setIsFavorite(!isFavorite);
      await invalidateAndRefetch(["scripts"]);
    } catch (error) {
      console.error("Error updating favorite status:", error);
      CustomToast(
        "error",
        "Failed to update favorite status. Please try again.!"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Tooltip title={isFavorite ? "Remove from favorites" : "Add to favorites"}>
      <StyledIconButton
        onClick={toggleFavorite}
        disabled={isLoading}
        aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
        size="small"
      >
        {isFavorite ? (
          <StarIcon sx={{ color: "secondary.main" }} />
        ) : (
          <StarBorderIcon />
        )}
      </StyledIconButton>
    </Tooltip>
  );
}
