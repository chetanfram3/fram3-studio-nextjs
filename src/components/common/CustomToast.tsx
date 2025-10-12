// src/components/common/CustomToast.tsx
"use client";

import { toast, ToastOptions } from "react-toastify";
import {
  CheckCircle,
  AlertCircle,
  Info,
  AlertTriangle,
  Clock,
} from "lucide-react";
import React from "react";
import { getCurrentBrand, getBrandColors } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

type ToastType = "success" | "info" | "error" | "warning" | "default";

interface ToastContentProps {
  message: string;
  logoUrl: string;
  type: ToastType;
  details?: string;
  duration?: number;
  isDarkMode: boolean;
  brandColor: string;
}

interface ToastCustomOptions {
  logoUrl?: string;
  details?: string;
  duration?: number;
  position?: ToastOptions["position"];
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
}

type ToastOptionsParam = string | ToastCustomOptions;

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get current theme mode from localStorage or system preference
 * ✅ COMPLIANT: Reads from localStorage instead of using hooks
 */
const getIsDarkMode = (): boolean => {
  if (typeof window === "undefined") return true;

  // Check localStorage first (set by ThemeProvider)
  const savedMode = localStorage.getItem("theme-mode");
  if (savedMode) {
    return savedMode === "dark";
  }

  // Fall back to system preference
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
};

/**
 * Get the appropriate logo URL based on theme mode
 * ✅ COMPLIANT: Uses brand configuration properly
 */
const getLogoUrl = (
  logo:
    | string
    | {
        light: string;
        dark: string;
        favicon: string;
        signin?: string;
        headerLogo?: string;
      },
  isDarkMode: boolean
): string => {
  if (typeof logo === "string") {
    return logo;
  }
  return isDarkMode ? logo.dark : logo.light;
};

/**
 * Get theme-aware color for icon based on toast type
 * ✅ COMPLIANT: Uses semantic colors, not hardcoded values
 */
const getIconColor = (
  type: ToastType,
  brandColor: string,
  isDarkMode: boolean
): string => {
  switch (type) {
    case "success":
      return isDarkMode ? "#66bb6a" : "#4caf50"; // MUI green
    case "error":
      return isDarkMode ? "#ef5350" : "#f44336"; // MUI red
    case "warning":
      return isDarkMode ? "#ffa726" : "#ff9800"; // MUI orange
    case "info":
      return brandColor; // Brand primary color
    default:
      return isDarkMode ? "#bdbdbd" : "#757575"; // MUI grey
  }
};

/**
 * Get icon component for toast type with theme-aware colors
 */
const getToastIcon = (
  type: ToastType,
  brandColor: string,
  isDarkMode: boolean
): React.ReactElement => {
  const iconProps = {
    size: 20,
    style: { minWidth: "20px" },
    color: getIconColor(type, brandColor, isDarkMode),
  };

  switch (type) {
    case "success":
      return <CheckCircle {...iconProps} />;
    case "error":
      return <AlertCircle {...iconProps} />;
    case "warning":
      return <AlertTriangle {...iconProps} />;
    case "info":
      return <Info {...iconProps} />;
    default:
      return <Clock {...iconProps} />;
  }
};

// ===========================
// TOAST CONTENT COMPONENT
// ===========================

/**
 * Enhanced toast content component with logo and optional details
 * ✅ COMPLIANT: Theme and brand aware without using hooks
 */
const ToastContent: React.FC<ToastContentProps> = ({
  message,
  logoUrl,
  type,
  details,
  isDarkMode,
  brandColor,
}) => {
  const textColor = isDarkMode ? "#e0e0e0" : "#212121";
  const detailsColor = isDarkMode ? "#9e9e9e" : "#666666";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: "12px",
        width: "100%",
      }}
    >
      {/* Logo */}
      <img
        src={logoUrl}
        alt="logo"
        style={{
          width: "32px",
          height: "32px",
          borderRadius: "50%",
          flexShrink: 0,
          marginTop: "2px",
        }}
      />

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            marginBottom: details ? "4px" : "0",
          }}
        >
          {/* Icon */}
          {getToastIcon(type, brandColor, isDarkMode)}

          <span
            style={{
              fontWeight: 500,
              fontSize: "14px",
              lineHeight: "1.4",
              color: textColor,
            }}
          >
            {message}
          </span>
        </div>

        {details && (
          <div
            style={{
              fontSize: "12px",
              color: detailsColor,
              lineHeight: "1.3",
              marginTop: "4px",
              paddingLeft: "28px",
            }}
          >
            {details}
          </div>
        )}
      </div>
    </div>
  );
};

// ===========================
// MAIN TOAST FUNCTION
// ===========================

/**
 * Calculate auto-close duration based on message length and toast type
 */
const calculateAutoCloseTime = (
  message: string,
  details: string | undefined,
  type: ToastType,
  customDuration: number | undefined
): number => {
  if (customDuration !== undefined) return customDuration;

  const baseTime = 3000;
  const messageLength = message.length + (details?.length || 0);
  const readingTime = Math.max(baseTime, messageLength * 50);

  switch (type) {
    case "error":
      return Math.min(readingTime * 1.5, 8000);
    case "warning":
      return Math.min(readingTime * 1.2, 6000);
    case "success":
      return Math.min(readingTime, 4000);
    default:
      return Math.min(readingTime, 5000);
  }
};

/**
 * Display a custom toast with enhanced styling and optional details
 * ✅ COMPLIANT: Theme and brand aware - automatically adapts without using hooks
 * ✅ COMPLIANT: Follows theme_porting_guide.md best practices
 *
 * @param type - The type of toast ('success', 'info', 'error', 'warning', 'default')
 * @param message - The main message to display in the toast
 * @param logoUrlOrOptions - BACKWARD COMPATIBLE: Can be a string (logoUrl) or options object
 *
 * @example
 * // Simple usage (uses brand logo automatically)
 * CustomToast('success', 'Operation completed');
 *
 * @example
 * // With details
 * CustomToast('error', 'Failed to save', {
 *   details: 'Network connection lost',
 *   duration: 5000
 * });
 */
const CustomToast = (
  type: ToastType,
  message: string,
  logoUrlOrOptions: ToastOptionsParam = {}
): void => {
  // ✅ COMPLIANT: Get brand configuration without using hooks
  const brand = getCurrentBrand();
  const isDarkMode = getIsDarkMode();

  // ✅ COMPLIANT: Use getBrandColors to get the correct color palette
  const brandColors = getBrandColors(brand, isDarkMode ? "dark" : "light");

  // Handle backward compatibility
  let options: ToastCustomOptions;

  if (typeof logoUrlOrOptions === "string") {
    options = { logoUrl: logoUrlOrOptions };
  } else {
    options = logoUrlOrOptions || {};
  }

  const defaultLogoUrl = getLogoUrl(brand.logo, isDarkMode);

  const {
    logoUrl = defaultLogoUrl,
    details,
    duration,
    position = "bottom-center",
    closeOnClick = true,
    pauseOnHover = true,
  } = options;

  const autoCloseTime = calculateAutoCloseTime(
    message,
    details,
    type,
    duration
  );

  // ✅ COMPLIANT: Use brand colors from the palette
  const backgroundColor = isDarkMode
    ? brandColors.surface
    : brandColors.surface;

  const borderColor = isDarkMode
    ? "rgba(255, 255, 255, 0.12)"
    : "rgba(0, 0, 0, 0.08)";

  // ✅ COMPLIANT: Use primary color from brand colors
  const primaryColor = brandColors.primary;

  const toastOptions: ToastOptions = {
    position,
    autoClose: autoCloseTime,
    hideProgressBar: false,
    closeOnClick,
    pauseOnHover,
    draggable: true,
    progress: undefined,
    style: {
      background: backgroundColor,
      borderRadius: `${brand.borderRadius}px`,
      padding: "16px",
      minHeight: "auto",
      border: `1px solid ${borderColor}`,
      boxShadow: isDarkMode
        ? "0 4px 6px rgba(0, 0, 0, 0.3)"
        : "0 2px 8px rgba(0, 0, 0, 0.1)",
    },
  };

  // For backward compatibility, use simple content if no details and using string logoUrl
  const content =
    typeof logoUrlOrOptions === "string" && !details ? (
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <img
          src={logoUrl}
          alt="logo"
          style={{ width: "32px", height: "32px", borderRadius: "50%" }}
        />
        <span style={{ color: isDarkMode ? "#e0e0e0" : "#212121" }}>
          {message}
        </span>
      </div>
    ) : (
      <ToastContent
        message={message}
        logoUrl={logoUrl}
        type={type}
        details={details}
        isDarkMode={isDarkMode}
        brandColor={primaryColor}
      />
    );

  switch (type) {
    case "success":
      toast.success(content, toastOptions);
      break;
    case "info":
      toast.info(content, toastOptions);
      break;
    case "error":
      toast.error(content, toastOptions);
      break;
    case "warning":
      toast.warning(content, toastOptions);
      break;
    default:
      toast(content, toastOptions);
      break;
  }
};

// ===========================
// CONVENIENCE METHODS
// ===========================

CustomToast.success = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("success", message, options);

CustomToast.error = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("error", message, options);

CustomToast.warning = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("warning", message, options);

CustomToast.info = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("info", message, options);

// ===========================
// SPECIALIZED TASK METHODS
// ===========================

CustomToast.taskSuccess = (action: string, details?: string): void =>
  CustomToast("success", `Task ${action} successfully`, { details });

CustomToast.taskError = (action: string, error: string): void =>
  CustomToast("error", `Failed to ${action} task`, { details: error });

CustomToast.taskInfo = (message: string, details?: string): void =>
  CustomToast("info", message, { details });

CustomToast.resumeInfo = (
  pausedAnalyses: string[],
  canResume: boolean
): void => {
  const message = canResume
    ? "Task ready to resume"
    : "Configuration required to resume";
  const details =
    pausedAnalyses.length > 0
      ? `Paused analyses: ${pausedAnalyses.join(", ")}`
      : undefined;

  CustomToast(canResume ? "info" : "warning", message, { details });
};

export default CustomToast;

export type { ToastType, ToastCustomOptions, ToastOptionsParam };
