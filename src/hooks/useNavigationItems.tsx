// src/hooks/useNavigationItems.tsx
"use client";

import { useMemo, useState, useEffect, useCallback, type JSX } from "react";
import {
  DashboardOutlined as LayoutDashboard,
  DescriptionOutlined as ScrollText,
  BarChartOutlined as BarChart,
  PaletteOutlined as Palette,
  InfoOutlined as Info,
  AutoAwesomeOutlined as Sparkles,
  EditOutlined as EditIcon,
  AutoModeOutlined as AutoMode,
} from "@mui/icons-material";
import type { APIINFO } from "@/types/profile";
import { fetchInfo } from "@/services/profileService";
import { SvgIconProps } from "@mui/material";
import logger from "@/utils/logger";

type MuiIcon = React.ComponentType<SvgIconProps>;

// Use an environment variable or fallback to a default
const appVersion = process.env.NEXT_PUBLIC_APP_VERSION || "1.0.0";

export interface NavigationItem {
  label: string;
  path?: string;
  Icon: MuiIcon;
  divider?: boolean;
  tooltip?: string;
  getTooltip?: () => string | JSX.Element;
}

export function useNavigationItems() {
  const [apiInfo, setApiInfo] = useState<APIINFO | null>(null);

  useEffect(() => {
    fetchInfo()
      .then((data) => {
        logger.debug("API Info:", data);
        setApiInfo(data);
      })
      .catch((error) => {
        console.error("Error fetching API info:", error);
      });
  }, []);

  const getInfoTooltip = useCallback(() => {
    return (
      <div style={{ whiteSpace: "pre-line" }}>
        <strong>FRAM3 Studio:</strong> {appVersion} <br />
        {apiInfo ? (
          <>
            <strong>API Version:</strong> {apiInfo.version} <br />
            <strong>Subscription:</strong> {apiInfo.subscription} <br />
            <strong>Region:</strong> {apiInfo.region}
          </>
        ) : (
          <span>Loading API info...</span>
        )}
      </div>
    );
  }, [apiInfo]);

  return useMemo<NavigationItem[]>(
    () => [
      {
        label: "Dashboard",
        path: "/dashboard",
        Icon: LayoutDashboard,
      },
      {
        label: "Create Now!",
        path: "/create-now",
        Icon: Palette,
      },
      {
        label: "Script Analysis",
        path: "/ai-script-analysis",
        Icon: BarChart,
      },
      {
        label: "Ai Script Library",
        path: "/ai-script-library",
        Icon: AutoMode,
      },
      {
        label: "Script Generator",
        path: "/ai-script-generator",
        Icon: Sparkles,
      },
      {
        label: "Script Editor",
        path: "/ai-script-editor",
        Icon: EditIcon,
      },
      {
        label: `v ${appVersion}`,
        Icon: Info,
        getTooltip: getInfoTooltip,
        divider: true,
      },
    ],
    [getInfoTooltip]
  );
}
