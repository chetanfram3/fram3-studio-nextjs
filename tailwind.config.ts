// tailwind.config.ts
import type { Config } from "tailwindcss";
import { getCurrentBrand } from "./src/config/brandConfig";

// Get current brand for build-time configuration
const brand = getCurrentBrand();

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      // Brand-aware colors using CSS variables
      colors: {
        // Brand color system
        brand: {
          primary: {
            DEFAULT: "var(--brand-primary)",
            light: "var(--brand-primary-light)",
            dark: "var(--brand-primary-dark)",
          },
          secondary: {
            DEFAULT: "var(--brand-secondary)",
            light: "var(--brand-secondary-light)",
            dark: "var(--brand-secondary-dark)",
          },
          accent: "var(--brand-accent)",
          background: "var(--brand-background)",
          surface: "var(--brand-surface)",
          text: {
            DEFAULT: "var(--brand-text)",
            secondary: "var(--brand-text-secondary)",
          },
        },
        // Static brand colors for specific brand targeting
        fram3: {
          light: {
            primary: "#1E88E5",
            secondary: "#FFA000",
            accent: "#D4AF37",
          },
          dark: {
            primary: "#FFFFFF",
            secondary: "#FFD700",
            accent: "#FFCB05",
          },
        },
        acme: {
          light: {
            primary: "#DC2626",
            secondary: "#EA580C",
            accent: "#F59E0B",
          },
          dark: {
            primary: "#EF4444",
            secondary: "#F97316",
            accent: "#FCD34D",
          },
        },
        techco: {
          light: {
            primary: "#7C3AED",
            secondary: "#06B6D4",
            accent: "#EC4899",
          },
          dark: {
            primary: "#A78BFA",
            secondary: "#22D3EE",
            accent: "#F472B6",
          },
        },
      },

      // Brand-aware border radius
      borderRadius: {
        brand: "var(--brand-radius)",
        "brand-sm": "var(--brand-radius-sm)",
        "brand-lg": "var(--brand-radius-lg)",
      },

      // Brand-aware font families
      fontFamily: {
        heading: "var(--font-heading)",
        body: "var(--font-body)",
        inter: "var(--font-inter)",
        rajdhani: "var(--font-rajdhani)",
        orbitron: "var(--font-orbitron)",
        montserrat: "var(--font-montserrat)",
        "open-sans": "var(--font-open-sans)",
        "space-grotesk": "var(--font-space-grotesk)",
      },

      // Extended spacing scale
      spacing: {
        brand: "var(--spacing-unit)",
      },

      // Custom animations
      animation: {
        float: "float 3s ease-in-out infinite",
        "fade-in": "fade-in 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.6s ease-out",
        "slide-in-left": "slide-in-left 0.6s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        spin: "spin 1s linear infinite",
      },

      // Custom keyframes
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(100px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-100px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px var(--brand-primary)" },
          "50%": { boxShadow: "0 0 40px var(--brand-primary)" },
        },
        spin: {
          from: { transform: "rotate(0deg)" },
          to: { transform: "rotate(360deg)" },
        },
      },

      // Brand-aware box shadows
      boxShadow: {
        "brand-sm": "0 2px 10px rgba(0, 0, 0, 0.05), 0 0 20px var(--brand-primary)",
        brand: "0 4px 20px rgba(0, 0, 0, 0.1), 0 0 40px var(--brand-primary)",
        "brand-lg": "0 8px 40px rgba(0, 0, 0, 0.15), 0 0 60px var(--brand-primary)",
      },

      // Extended breakpoints for larger screens
      screens: {
        xs: "475px",
        "3xl": "1920px",
        "4xl": "2560px",
      },

      // Custom z-index scale
      zIndex: {
        dropdown: "1000",
        sticky: "1020",
        fixed: "1030",
        "modal-backdrop": "1040",
        modal: "1050",
        popover: "1060",
        tooltip: "1070",
      },

      // Background images with brand gradients
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
        "brand-gradient-reverse": "linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-primary) 100%)",
        "brand-gradient-radial": "radial-gradient(circle, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
      },

      // Custom transitions
      transitionDuration: {
        "2000": "2000ms",
        "3000": "3000ms",
      },

      // Custom backdrop blur
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [
    // Custom plugin for brand utilities
    function ({ addUtilities, theme }: any) {
      const brandUtilities = {
        // Brand gradient utilities
        ".bg-brand-gradient": {
          background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
        },
        ".bg-brand-gradient-reverse": {
          background: "linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-primary) 100%)",
        },
        ".bg-brand-gradient-radial": {
          background: "radial-gradient(circle, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
        },

        // Brand text gradient utilities
        ".text-brand-gradient": {
          background: "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },
        ".text-brand-gradient-reverse": {
          background: "linear-gradient(135deg, var(--brand-secondary) 0%, var(--brand-primary) 100%)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
          "background-clip": "text",
        },

        // Brand border utilities
        ".border-brand-gradient": {
          "border-image": "linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%) 1",
        },

        // Scrollbar utilities
        ".scrollbar-brand": {
          "scrollbar-width": "thin",
          "scrollbar-color": "var(--brand-primary) var(--brand-surface)",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "var(--brand-surface)",
            "border-radius": "var(--brand-radius)",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "var(--brand-primary)",
            "border-radius": "var(--brand-radius)",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "var(--brand-primary-dark)",
          },
        },

        // Glass morphism effect
        ".glass-brand": {
          background: "rgba(255, 255, 255, 0.1)",
          "backdrop-filter": "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.2)",
        },

        // Brand glow effect
        ".glow-brand": {
          "box-shadow": "0 0 20px var(--brand-primary), 0 0 40px var(--brand-primary)",
        },
        ".glow-brand-sm": {
          "box-shadow": "0 0 10px var(--brand-primary), 0 0 20px var(--brand-primary)",
        },
        ".glow-brand-lg": {
          "box-shadow": "0 0 30px var(--brand-primary), 0 0 60px var(--brand-primary)",
        },
      };

      addUtilities(brandUtilities);
    },
  ],
};

export default config;