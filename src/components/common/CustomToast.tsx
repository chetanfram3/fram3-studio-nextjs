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
import { useTheme } from "@mui/material/styles";
import { getCurrentBrand } from "@/config/brandConfig";

// ===========================
// TYPE DEFINITIONS
// ===========================

/**
 * Allowed toast types
 */
type ToastType = "success" | "info" | "error" | "warning" | "default";

/**
 * Props for the toast content component
 */
interface ToastContentProps {
  message: string;
  logoUrl: string;
  type: ToastType;
  details?: string;
  duration?: number;
  isDarkMode: boolean;
  brandColor: string;
}

/**
 * Options for customizing toast behavior
 */
interface ToastCustomOptions {
  logoUrl?: string;
  details?: string;
  duration?: number;
  position?: ToastOptions["position"];
  closeOnClick?: boolean;
  pauseOnHover?: boolean;
}

/**
 * Type for the logoUrlOrOptions parameter (backward compatible)
 */
type ToastOptionsParam = string | ToastCustomOptions;

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Get the appropriate logo URL based on theme mode
 * @param logo - Brand logo configuration (string or object with light/dark variants)
 * @param isDarkMode - Whether dark mode is active
 * @returns Logo URL string
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
  // Use theme-appropriate logo variant
  return isDarkMode ? logo.dark : logo.light;
};

/**
 * Get theme-aware color for icon based on toast type
 */
const getIconColor = (
  type: ToastType,
  brandColor: string,
  isDarkMode: boolean
): string => {
  switch (type) {
    case "success":
      return isDarkMode ? "#66bb6a" : "#4caf50";
    case "error":
      return isDarkMode ? "#ef5350" : "#f44336";
    case "warning":
      return isDarkMode ? "#ffa726" : "#ff9800";
    case "info":
      return brandColor;
    default:
      return isDarkMode ? "#bdbdbd" : "#757575";
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
 * Theme and brand aware
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
              paddingLeft: "28px", // Align with message text (icon width + gap)
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
 * @param message - Main message text
 * @param details - Optional details text
 * @param type - Toast type
 * @param customDuration - Custom duration override
 * @returns Duration in milliseconds
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
  const readingTime = Math.max(baseTime, messageLength * 50); // ~50ms per character

  // Adjust based on type
  switch (type) {
    case "error":
      return Math.min(readingTime * 1.5, 8000); // Errors stay longer but cap at 8s
    case "warning":
      return Math.min(readingTime * 1.2, 6000); // Warnings stay a bit longer
    case "success":
      return Math.min(readingTime, 4000); // Success messages can be shorter
    default:
      return Math.min(readingTime, 5000);
  }
};

/**
 * Display a custom toast with enhanced styling and optional details
 * Theme and brand aware - automatically adapts to current theme and brand
 * Supports backward compatibility with string logoUrl parameter
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
 * // With custom logo
 * CustomToast('success', 'Operation completed', '/custom-logo.png');
 *
 * @example
 * // With options object
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
  // Get theme and brand information
  const theme = useTheme();
  const brand = getCurrentBrand();
  const isDarkMode = theme.palette.mode === "dark";

  // Handle backward compatibility
  let options: ToastCustomOptions;

  if (typeof logoUrlOrOptions === "string") {
    // Backward compatible mode: third parameter is logoUrl
    options = { logoUrl: logoUrlOrOptions };
  } else {
    // New mode: third parameter is options object
    options = logoUrlOrOptions || {};
  }

  // Get the appropriate logo URL based on theme
  const defaultLogoUrl = getLogoUrl(brand.logo, isDarkMode);

  // Use brand logo as default, allow override
  const {
    logoUrl = defaultLogoUrl,
    details,
    duration,
    position = "bottom-center",
    closeOnClick = true,
    pauseOnHover = true,
  } = options;

  // Calculate auto-close time
  const autoCloseTime = calculateAutoCloseTime(
    message,
    details,
    type,
    duration
  );

  // Theme-aware toast styling
  const backgroundColor = isDarkMode
    ? theme.palette.background.paper
    : "#ffffff";

  const borderColor = isDarkMode
    ? theme.palette.divider
    : "rgba(0, 0, 0, 0.08)";

  // Get primary color from theme palette
  const primaryColor = theme.palette.primary.main;

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
      // Original simple format for backward compatibility
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
      // Enhanced format with icons and details
      <ToastContent
        message={message}
        logoUrl={logoUrl}
        type={type}
        details={details}
        isDarkMode={isDarkMode}
        brandColor={primaryColor}
      />
    );

  // Call the appropriate toast method based on the type
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

/**
 * Show a success toast
 * @param message - Success message
 * @param options - Optional toast configuration
 */
CustomToast.success = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("success", message, options);

/**
 * Show an error toast
 * @param message - Error message
 * @param options - Optional toast configuration
 */
CustomToast.error = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("error", message, options);

/**
 * Show a warning toast
 * @param message - Warning message
 * @param options - Optional toast configuration
 */
CustomToast.warning = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("warning", message, options);

/**
 * Show an info toast
 * @param message - Info message
 * @param options - Optional toast configuration
 */
CustomToast.info = (message: string, options?: ToastOptionsParam): void =>
  CustomToast("info", message, options);

// ===========================
// SPECIALIZED TASK METHODS
// ===========================

/**
 * Show a task success notification
 * @param action - The action that was completed (e.g., "deleted", "updated")
 * @param details - Optional additional details
 */
CustomToast.taskSuccess = (action: string, details?: string): void =>
  CustomToast("success", `Task ${action} successfully`, { details });

/**
 * Show a task error notification
 * @param action - The action that failed (e.g., "delete", "update")
 * @param error - Error message or details
 */
CustomToast.taskError = (action: string, error: string): void =>
  CustomToast("error", `Failed to ${action} task`, { details: error });

/**
 * Show a task info notification
 * @param message - Info message
 * @param details - Optional additional details
 */
CustomToast.taskInfo = (message: string, details?: string): void =>
  CustomToast("info", message, { details });

/**
 * Show a task resume notification with paused analyses information
 * @param pausedAnalyses - Array of paused analysis names
 * @param canResume - Whether the task can be resumed
 */
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

// ===========================
// EXPORT TYPES
// ===========================

export type { ToastType, ToastCustomOptions, ToastOptionsParam };
