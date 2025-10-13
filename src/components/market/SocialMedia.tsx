"use client";

import { Box, IconButton, Tooltip } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import InstagramIcon from "@mui/icons-material/Instagram";
import TwitterIcon from "@mui/icons-material/Twitter";
import YouTubeIcon from "@mui/icons-material/YouTube";
import PinterestIcon from "@mui/icons-material/Pinterest";
import { IoLogoTiktok, IoLogoSnapchat } from "react-icons/io5";
import { useMemo, useCallback, JSX } from "react";
import type { SocialMedia } from "@/types/market/types";

interface SocialMediaIconsProps {
  data?: SocialMedia | null;
}

interface IconMapping {
  name: string;
  icon: JSX.Element;
  url: string | undefined;
}

const isValidUrl = (url?: string | URL | null): boolean => {
  if (!url) return false;
  try {
    new URL(typeof url === "string" ? url : url.toString());
    return true;
  } catch {
    return false;
  }
};

const capitalizeFirstLetter = (str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

export default function SocialMediaIcons({ data }: SocialMediaIconsProps) {
  const iconSize = 28;

  // Memoize icon mappings to avoid recreation on every render
  const iconMapping = useMemo(() => {
    if (!data) return [];

    const mappings: IconMapping[] = [
      {
        name: "facebook",
        icon: <FacebookIcon sx={{ color: "#4267B2", fontSize: iconSize }} />,
        url: data.facebook,
      },
      {
        name: "instagram",
        icon: <InstagramIcon sx={{ color: "#E1306C", fontSize: iconSize }} />,
        url: data.instagram,
      },
      {
        name: "twitter",
        icon: <TwitterIcon sx={{ color: "#1DA1F2", fontSize: iconSize }} />,
        url: data.twitter,
      },
      {
        name: "youtube",
        icon: <YouTubeIcon sx={{ color: "#FF0000", fontSize: iconSize }} />,
        url: data.youtube,
      },
      {
        name: "pinterest",
        icon: <PinterestIcon sx={{ color: "#E60023", fontSize: iconSize }} />,
        url: data.pinterest,
      },
      {
        name: "tiktok",
        icon: <IoLogoTiktok style={{ color: "#ff0050", fontSize: iconSize }} />,
        url: data.tiktok,
      },
      {
        name: "snapchat",
        icon: (
          <IoLogoSnapchat style={{ color: "#FFFC00", fontSize: iconSize }} />
        ),
        url: data.snapchat,
      },
    ];

    return mappings.filter((item) => item.url && isValidUrl(item.url));
  }, [data, iconSize]);

  // Memoize tooltip text generation
  const getTooltipText = useCallback((name: string) => {
    return `Visit us on ${capitalizeFirstLetter(name)}`;
  }, []);

  // Memoize aria label generation
  const getAriaLabel = useCallback((name: string) => {
    return `Visit our ${name} page`;
  }, []);

  if (!data || iconMapping.length === 0) {
    return null;
  }

  return (
    <Box
      display="flex"
      gap={0}
      mt={0}
      ml={-1}
      component="nav"
      aria-label="social media links"
    >
      {iconMapping.map((item) => (
        <Tooltip
          key={`social-${item.name}`}
          title={getTooltipText(item.name)}
          arrow
        >
          <IconButton
            component="a"
            href={item.url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={getAriaLabel(item.name)}
            sx={{
              fontSize: iconSize,
              "&:hover": {
                opacity: 0.8,
              },
            }}
          >
            {item.icon}
          </IconButton>
        </Tooltip>
      ))}
    </Box>
  );
}

SocialMediaIcons.displayName = "SocialMediaIcons";
