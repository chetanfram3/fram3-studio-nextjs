import React from "react";
import { IconButton, IconButtonProps } from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useSectionVisibility, SectionId } from "../context/SectionVisibilityContext";

interface SectionCloseButtonProps extends Omit<IconButtonProps, 'onClick'> {
  sectionId: SectionId;
  icon?: React.ReactNode;
}

/**
 * A reusable close button component that toggles the visibility of a section.
 * 
 * @param sectionId - The ID of the section to toggle visibility
 * @param icon - Optional custom icon (defaults to CloseIcon)
 * @param ...props - Other IconButton props
 */
const SectionCloseButton: React.FC<SectionCloseButtonProps> = ({
  sectionId,
  icon,
  ...props
}) => {
  const { toggleSection } = useSectionVisibility();

  return (
    <IconButton
      size="small"
      onClick={() => toggleSection(sectionId)}
      {...props}
    >
      {icon || <CloseIcon fontSize="small" />}
    </IconButton>
  );
};

export default SectionCloseButton;