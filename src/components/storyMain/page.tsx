"use client";

import React, { useState, useEffect, useCallback } from "react";

import type { SxProps, Theme } from "@mui/material";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  useMediaQuery,
  Badge,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Overview from "../overview";
import MarketResearch from "../market";
import { StoryBoardLayout } from "../storyBoard";
import VideoEditor from "../editor";
import { VideoLayout } from "../renderedVideos";
import TabbedAnalytics from "../analytics/TabbedAnalytics";
import Status from "../status";
import { ComingSoon } from "@/components/common/ComingSoon";
import { useScriptDashboardAnalysis } from "@/hooks/scripts/useScriptDashboardAnalysis";
import { LoadingAnimation } from "@/components/common/LoadingAnimation";
import { AnalysisInProgress } from "@/components/common/AnalysisInProgress";
import { ScriptHeader } from "./ScriptHeader";
import DebugButton from "@/components/common/DebugButton";
import type { ScriptInfo } from "@/types/storyMain/types";
import { useSubscription } from "@/hooks/auth/useSubscription";
import {
  DashboardOutlined as DashboardIcon,
  AnalyticsOutlined as AnalyticsIcon,
  ImageOutlined as ImageIcon,
  PublishedWithChangesOutlined as StatusIcon,
  ThreeDRotationOutlined as ExploreIcon,
  VideoCameraFrontOutlined as EditIcon,
  Assessment as AssessmentIcon,
  VideoStableOutlined as Video,
} from "@mui/icons-material";

// ===========================
// TYPE DEFINITIONS
// ===========================

interface TabData {
  label: string;
  icon: React.ReactElement;
  component: React.ReactNode;
  notifications?: number;
  isPremium?: boolean;
  adminOnly?: boolean;
}

// ===========================
// MAIN COMPONENT
// ===========================

export default function StoryPage() {
  const theme = useTheme();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { isAdmin } = useSubscription();

  // Extract params with type safety
  const scriptId = (params?.scriptId as string) || "";
  const versionId = (params?.versionId as string) || "";
  const tabParam = params?.tab as string | undefined;

  // Get initial tab from URL params or searchParams or localStorage
  const getInitialTab = useCallback(() => {
    if (tabParam) return parseInt(tabParam);
    const urlTab = searchParams?.get("tab");
    if (urlTab) return parseInt(urlTab);
    const storedTab =
      typeof window !== "undefined" ? localStorage.getItem("activeTab") : null;
    return storedTab ? parseInt(storedTab) : 3;
  }, [tabParam, searchParams]);

  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Fetch script data using React Query
  const {
    data: scriptInfo,
    refetch,
    isLoading,
    error,
  } = useScriptDashboardAnalysis<ScriptInfo>(scriptId, versionId, "storyInfo");

  // ===========================
  // TAB CONFIGURATION
  // ===========================

  const baseTabData: TabData[] = [
    {
      label: "Overview",
      icon: <DashboardIcon fontSize="small" />,
      component: (
        <React.Suspense
          fallback={<LoadingAnimation message="Loading overview..." />}
        >
          <Overview
            scriptId={scriptId}
            versionId={versionId}
            statuses={scriptInfo?.statuses}
          />
        </React.Suspense>
      ),
    },
    {
      label: "Market Research",
      icon: <AnalyticsIcon fontSize="small" />,
      component: (
        <React.Suspense
          fallback={<LoadingAnimation message="Loading market research..." />}
        >
          <MarketResearch scriptId={scriptId} versionId={versionId} />
        </React.Suspense>
      ),
    },
    {
      label: "Visuals",
      icon: <ImageIcon fontSize="small" />,
      component: (
        <React.Suspense
          fallback={
            <LoadingAnimation message="Loading Story Board , Visuals..." />
          }
        >
          <StoryBoardLayout scriptId={scriptId} versionId={versionId} />
        </React.Suspense>
      ),
    },
    {
      label: "Status",
      icon: <StatusIcon fontSize="small" />,
      component: (
        <React.Suspense
          fallback={<LoadingAnimation message="Loading analysis status..." />}
        >
          <Status scriptInfo={scriptInfo} refetch={refetch} />
        </React.Suspense>
      ),
    },
    {
      label: "Coming Soon",
      icon: <ExploreIcon fontSize="small" />,
      component: (
        <React.Suspense
          fallback={<LoadingAnimation message="Loading 3D World..." />}
        >
          <ComingSoon message="AI-powered 3D Scene Explorer is coming soon! We're training our models." />
        </React.Suspense>
      ),
      isPremium: true,
    },
    {
      label: "Editor",
      icon: <EditIcon fontSize="small" />,
      component: (
        <React.Suspense
          fallback={<LoadingAnimation message="Loading editor..." />}
        >
          {scriptInfo ? (
            <VideoEditor
              scriptId={scriptId}
              versionId={versionId}
              scriptInfo={scriptInfo}
            />
          ) : (
            <AnalysisInProgress message="Loading editor data..." />
          )}
        </React.Suspense>
      ),
    },
    {
      label: "Videos",
      icon: <Video fontSize="small" />,
      component: (
        <React.Suspense
          fallback={<LoadingAnimation message="Loading rendered videos..." />}
        >
          <VideoLayout scriptId={scriptId} versionId={versionId} />
        </React.Suspense>
      ),
    },
  ];

  // Add Analytics tab for admins
  const tabData: TabData[] = isAdmin
    ? [
        ...baseTabData,
        {
          label: "Analytics",
          icon: <AssessmentIcon fontSize="small" />,
          component: (
            <React.Suspense
              fallback={<LoadingAnimation message="Loading analytics..." />}
            >
              <TabbedAnalytics scriptId={scriptId} versionId={versionId} />
            </React.Suspense>
          ),
          adminOnly: true,
        },
      ]
    : baseTabData;

  // ===========================
  // EVENT HANDLERS
  // ===========================

  const handleTabChange = useCallback(
    (_: React.SyntheticEvent, newValue: number) => {
      setActiveTab(newValue);

      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("activeTab", newValue.toString());
      }

      // Update URL
      router.push(`/story/${scriptId}/version/${versionId}/${newValue}`, {
        scroll: false,
      });
    },
    [scriptId, versionId, router]
  );

  // ===========================
  // EFFECTS
  // ===========================

  // Sync tab state with URL on mount and when params change
  useEffect(() => {
    const initialTab = getInitialTab();
    setActiveTab(initialTab);
  }, [getInitialTab]);

  // ===========================
  // RENDER HELPERS
  // ===========================

  const renderTabIcon = useCallback(
    (tab: TabData, isSelected: boolean) => {
      const iconElement = React.cloneElement(
        tab.icon as React.ReactElement<{ sx?: SxProps<Theme> }>,
        {
          sx: {
            color: isSelected ? theme.palette.primary.main : "inherit",
            transition: theme.transitions.create("color", {
              duration: theme.transitions.duration.shorter,
            }),
          },
        }
      );

      if (tab.notifications && tab.notifications > 0) {
        return (
          <Badge
            badgeContent={tab.notifications}
            color="error"
            sx={{
              "& .MuiBadge-badge": {
                fontSize: "0.7rem",
                height: 18,
                minWidth: 18,
              },
            }}
          >
            {iconElement}
          </Badge>
        );
      }

      return iconElement;
    },
    [theme]
  );

  // ===========================
  // LOADING & ERROR STATES
  // ===========================

  if (isLoading) {
    return <LoadingAnimation message="Analysis is loading" />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">
          An error occurred while loading the analysis data
        </Typography>
      </Box>
    );
  }

  if (!scriptInfo) {
    return (
      <AnalysisInProgress message="Analysis is in progress. Please check back later" />
    );
  }

  // ===========================
  // MAIN RENDER
  // ===========================

  const isStateMapperActive = activeTab === 4;

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flexGrow: 1, py: 0 }}>
        <ScriptHeader scriptInfo={scriptInfo} />

        {/* Tab Navigation */}
        <Box
          sx={{
            borderRadius: 0.5,
            my: 2,
            mx: { xs: 1, sm: 2 },
            overflow: "hidden",
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="dashboard tabs"
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
              sx={{
                minHeight: "48px",
                px: 1,
                flexGrow: 1,
                "& .MuiTabs-indicator": {
                  height: 3,
                  borderRadius: "3px 3px 0 0",
                  backgroundColor: theme.palette.primary.main,
                },
              }}
            >
              {tabData.map((tab, index) => (
                <Tab
                  key={index}
                  sx={{
                    minHeight: "48px",
                    py: 1.5,
                    px: 2,
                    borderRadius: 1,
                    mx: 0.5,
                    transition: theme.transitions.create(
                      ["background-color", "opacity"],
                      { duration: theme.transitions.duration.short }
                    ),
                    textTransform: "none",
                    fontWeight: 500,
                    color: "text.secondary",
                    opacity: activeTab === index ? 1 : 0.7,
                    "&:hover": {
                      opacity: 1,
                      backgroundColor: theme.palette.action.hover,
                    },
                    "&.Mui-selected": {
                      fontWeight: 600,
                      color: "text.primary",
                      backgroundColor: theme.palette.action.selected,
                    },
                  }}
                  label={
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        position: "relative",
                      }}
                    >
                      {renderTabIcon(tab, activeTab === index)}
                      <Typography
                        variant="body1"
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          whiteSpace: "nowrap",
                          color:
                            activeTab === index ? "text.primary" : "inherit",
                        }}
                      >
                        {tab.label}
                        {tab.isPremium && (
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              px: 1,
                              py: 0.3,
                              fontSize: "0.6rem",
                              fontWeight: "bold",
                              bgcolor: "warning.main",
                              color: "warning.contrastText",
                              borderRadius: 4,
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                            }}
                          >
                            Premium
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  }
                />
              ))}
            </Tabs>
            <Box sx={{ px: 2 }}>
              <DebugButton scriptId={scriptId} versionId={versionId} />
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Tab Content */}
      <Box sx={{ flexGrow: 1, py: isStateMapperActive ? 0 : 4 }}>
        {tabData[activeTab]?.component}
      </Box>
    </Box>
  );
}
