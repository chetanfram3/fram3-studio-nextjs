// src/modules/scripts/context/SectionVisibilityContext.tsx
import React, { createContext, useContext, useState, ReactNode } from "react";

export type SectionId =
  | "basicInfo"
  | "formatCallToAction"
  | "localeRegion"
  | "mustHaves"
  | "audience"
  | "story"
  | "brand"
  | "product"
  | "campaign"
  | "style"
  | "execution";

interface SectionVisibilityContextType {
  visibleSections: SectionId[];
  toggleSection: (sectionId: SectionId) => void;
  isVisible: (sectionId: SectionId) => boolean;
  showAllSections: () => void;
  hideAllSections: () => void;
  getEnabledSectionCount: () => { enabled: number; total: number };
}

const SectionVisibilityContext = createContext<
  SectionVisibilityContextType | undefined
>(undefined);

// By default, basic info, format/CTA, locale/region, and must-haves are visible
const defaultVisibleSections: SectionId[] = [
  "basicInfo",
  "formatCallToAction",
  "localeRegion",
  "mustHaves",
];

// All possible sections
const ALL_SECTIONS: SectionId[] = [
  "basicInfo",
  "formatCallToAction",
  "localeRegion",
  "mustHaves",
  "audience",
  "story",
  "brand",
  "product",
  "campaign",
  "style",
  "execution",
];

// Sections that can be toggled in the Creative Input menu
const TOGGLEABLE_SECTIONS: SectionId[] = [
  "audience",
  "story",
  "brand",
  "product",
  "campaign",
  "style",
  "execution",
];

// Sections that are always visible and can't be toggled
const ALWAYS_VISIBLE_SECTIONS: SectionId[] = [
  "basicInfo",
  "formatCallToAction",
  "localeRegion",
  "mustHaves",
];

export const SectionVisibilityProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [visibleSections, setVisibleSections] = useState<SectionId[]>(
    defaultVisibleSections
  );

  const toggleSection = (sectionId: SectionId) => {
    setVisibleSections((current) => {
      // If this section is in the always visible list, don't toggle it
      if (ALWAYS_VISIBLE_SECTIONS.includes(sectionId)) return current;

      if (current.includes(sectionId)) {
        return current.filter((id) => id !== sectionId);
      } else {
        return [...current, sectionId];
      }
    });
  };

  const isVisible = (sectionId: SectionId): boolean => {
    return visibleSections.includes(sectionId);
  };

  const showAllSections = () => {
    setVisibleSections(ALL_SECTIONS);
  };

  const hideAllSections = () => {
    // Only keep non-toggleable sections visible
    setVisibleSections(ALWAYS_VISIBLE_SECTIONS);
  };

  const getEnabledSectionCount = () => {
    // Count only toggleable sections that are enabled
    const enabledToggleableSections = visibleSections.filter((section) =>
      TOGGLEABLE_SECTIONS.includes(section)
    ).length;

    return {
      enabled: enabledToggleableSections,
      total: TOGGLEABLE_SECTIONS.length,
    };
  };

  return (
    <SectionVisibilityContext.Provider
      value={{
        visibleSections,
        toggleSection,
        isVisible,
        showAllSections,
        hideAllSections,
        getEnabledSectionCount,
      }}
    >
      {children}
    </SectionVisibilityContext.Provider>
  );
};

export const useSectionVisibility = (): SectionVisibilityContextType => {
  const context = useContext(SectionVisibilityContext);
  if (context === undefined) {
    throw new Error(
      "useSectionVisibility must be used within a SectionVisibilityProvider"
    );
  }
  return context;
};
