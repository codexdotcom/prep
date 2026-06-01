import type { Metadata, Viewport } from "next";
import {
  Plus_Jakarta_Sans,
  JetBrains_Mono,
  DM_Serif_Display,
} from "next/font/google";
import { Providers } from "@/components/providers";
import "./globals.css";
import { OfflineBanner } from "@/components/ui/offline-banner";
import { InstallPrompt } from "@/components/ui/install-prompt";


export const viewport: Viewport = {
  themeColor: "#22c55e",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "JambOS - Your Operating System for Admission.",
  description:
    "AI-powered JAMB prep platform. Personalized learning, smart analytics, and adaptive practice to score 250+.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "JambOS",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const dmSerif = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${dmSerif.variable} ${jetbrains.variable}`}
    >
      <body>
        <Providers>
           <OfflineBanner />
           {children}
           <InstallPrompt />
           </Providers>
      </body>
    </html>
  );
}