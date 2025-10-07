// src/assets/icons/fram3-3d-icon.tsx
"use client";

import { SvgIcon } from "@mui/material";
import type { SvgIconProps } from "@mui/material";
import { useTheme } from "@mui/material/styles";

export const Fram3Icon3D = (props: SvgIconProps) => {
  const theme = useTheme();
  const isDarkMode = theme.palette.mode === "dark";

  // Use theme colors instead of hardcoded values
  const bubbleColor = theme.palette.primary.main;
  const bubbleColorDark = theme.palette.primary.dark;
  const lensColor = isDarkMode ? "#2A2A2A" : "#1A1A1A";
  const lensColorLight = isDarkMode ? "#4A4A4A" : "#333333";
  const lensColorDark = isDarkMode ? "#1A1A1A" : "#000000";

  return (
    <SvgIcon {...props} viewBox="0 0 512 512">
      <defs>
        {/* Bubble gradient - brand-aware */}
        <linearGradient id="bubbleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={bubbleColor} />
          <stop offset="100%" stopColor={bubbleColorDark} />
        </linearGradient>

        {/* Lens gradients - theme-aware */}
        <radialGradient id="lensGradient" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={lensColorLight} />
          <stop offset="85%" stopColor={lensColor} />
          <stop offset="100%" stopColor={lensColorDark} />
        </radialGradient>

        <radialGradient id="innerLensGradient" cx="40%" cy="40%" r="60%">
          <stop offset="0%" stopColor={lensColorLight} />
          <stop offset="90%" stopColor={lensColor} />
        </radialGradient>

        {/* Glass effect filter */}
        <filter id="glassEffect" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
          <feSpecularLighting
            in="blur"
            surfaceScale="5"
            specularConstant="1"
            specularExponent="20"
            lightingColor={isDarkMode ? "#FFFFFF" : "#FFFFFF"}
            result="specular"
          >
            <fePointLight x="250" y="150" z="200" />
          </feSpecularLighting>
          <feComposite
            in="specular"
            in2="SourceAlpha"
            operator="in"
            result="specular"
          />
          <feComposite
            in="SourceGraphic"
            in2="specular"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="1"
            k4="0"
          />
        </filter>
      </defs>

      {/* Speech bubble background with shadow */}
      <path
        d="M412 40H100C66.863 40 40 66.863 40 100v256c0 33.137 26.863 60 60 60h52l-32 96 192-96h100c33.137 0 60-26.863 60-60V100c0-33.137-26.863-60-60-60z"
        fill="url(#bubbleGradient)"
        filter={`drop-shadow(0 4px 6px ${isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.2)"})`}
      />

      {/* Camera lens assembly */}
      <circle
        cx="256"
        cy="228"
        r="120"
        fill={lensColorDark}
        filter={`drop-shadow(0 2px 4px ${isDarkMode ? "rgba(0,0,0,0.5)" : "rgba(0,0,0,0.3)"})`}
      />

      <circle cx="256" cy="228" r="110" fill="url(#lensGradient)" />
      <circle
        cx="256"
        cy="228"
        r="90"
        fill="url(#innerLensGradient)"
        filter="url(#glassEffect)"
      />
      <circle cx="256" cy="228" r="70" fill={lensColor} />

      {/* Lens reflections */}
      <ellipse
        cx="220"
        cy="192"
        rx="25"
        ry="15"
        fill="#FFFFFF"
        opacity={isDarkMode ? "0.2" : "0.15"}
        transform="rotate(-30 220 192)"
      />

      <circle cx="256" cy="228" r="35" fill={lensColorDark} />

      {/* Small highlight dots */}
      <circle
        cx="290"
        cy="198"
        r="4"
        fill="#FFFFFF"
        opacity={isDarkMode ? "0.6" : "0.5"}
      />
      <circle
        cx="226"
        cy="258"
        r="2"
        fill="#FFFFFF"
        opacity={isDarkMode ? "0.4" : "0.3"}
      />
    </SvgIcon>
  );
};
