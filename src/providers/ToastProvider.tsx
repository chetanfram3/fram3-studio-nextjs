// src/components/providers/ToastProvider.tsx
"use client";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useThemeMode } from "@/theme";
import { getCurrentBrand, getBrandColors } from "@/config/brandConfig";

/**
 * Toast Provider Component
 * Wraps the application with react-toastify ToastContainer
 * Automatically adapts to current theme and brand
 */
export function ToastProvider() {
  const { isDarkMode } = useThemeMode();
  const brand = getCurrentBrand();
  const brandColors = getBrandColors(brand, isDarkMode ? "dark" : "light");

  return (
    <>
      <ToastContainer
        position="bottom-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={isDarkMode ? "dark" : "light"}
        style={{
          zIndex: 9999,
        }}
        toastStyle={{
          borderRadius: `${brand.borderRadius}px`,
          background: brandColors.surface,
          color: brandColors.text,
        }}
      />

      {/* Custom CSS to style the progress bar */}
      <style jsx global>{`
        .Toastify__progress-bar--default {
          background: ${brandColors.primary} !important;
        }

        .Toastify__progress-bar--success {
          background: #4caf50 !important;
        }

        .Toastify__progress-bar--error {
          background: #f44336 !important;
        }

        .Toastify__progress-bar--warning {
          background: #ff9800 !important;
        }

        .Toastify__progress-bar--info {
          background: ${brandColors.primary} !important;
        }
      `}</style>
    </>
  );
}
