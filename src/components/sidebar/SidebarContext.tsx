"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export interface SidebarContextType {
  isExpanded: boolean;
  isMobile: boolean;
  toggleSidebar: () => void;
  setMobileView: (isMobile: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  // Changed initial state to false so sidebar starts collapsed
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const toggleSidebar = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const setMobileView = useCallback((mobile: boolean) => {
    setIsMobile(mobile);
    if (mobile) {
      setIsExpanded(false);
    }
  }, []);

  return (
    <SidebarContext.Provider
      value={{
        isExpanded,
        isMobile,
        toggleSidebar,
        setMobileView,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
}
