// src/app/layout.tsx
import type { Metadata } from "next";
import {
  Inter,
  Rajdhani,
  Orbitron,
  Montserrat,
  Open_Sans,
  Space_Grotesk,
} from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import EmotionRegistry from "@/lib/EmotionRegistry";
import "./globals.css";
import { ThemeProvider } from "@/theme";
import { QueryProvider } from "@/providers/QueryProvider";
import { getCurrentBrand } from "@/config/brandConfig";
import { ClientLayoutWrapper } from "@/components/layout/ClientLayoutWrapper";
import { ToastProvider } from "@/providers/ToastProvider"; 

// Get current brand for metadata and HTML attributes
const brand = getCurrentBrand();

// Load all fonts for all brands
// Inter - Used by FRAM3 (body) and TechCo (body)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Rajdhani - Used by FRAM3 (heading - secondary)
const rajdhani = Rajdhani({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-rajdhani",
  display: "swap",
});

// Orbitron - Used by FRAM3 (heading - primary)
const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-orbitron",
  display: "swap",
});

// Montserrat - Used by ACME (heading)
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

// Open Sans - Used by ACME (body)
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

// Space Grotesk - Used by TechCo (heading)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

// Generate metadata based on current brand
export const metadata: Metadata = {
  title: `${brand.name} - ${brand.tagline}`,
  description: brand.tagline,
  icons: {
    icon: brand.logo.favicon,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      data-brand={brand.id}
      className={`
        ${inter.variable} 
        ${rajdhani.variable} 
        ${orbitron.variable} 
        ${montserrat.variable} 
        ${openSans.variable} 
        ${spaceGrotesk.variable}
      `}
      suppressHydrationWarning
    >
      <head>
        <link rel="icon" href={brand.logo.favicon} />
      </head>
      <body className={inter.className}>
        <EmotionRegistry options={{ key: "mui" }}>
          <AppRouterCacheProvider>
            <ThemeProvider>
              <QueryProvider>
                <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
                <ToastProvider />
              </QueryProvider>
            </ThemeProvider>
          </AppRouterCacheProvider>
        </EmotionRegistry>
      </body>
    </html>
  );
}
