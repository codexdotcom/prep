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
    "JambOS is an AI-powered admission platform designed to help students prepare for JAMB more effectively through personalized learning, intelligent practice, performance prediction, and adaptive study plans. Rather than simply providing past questions, JambOS acts as a complete operating system for admission, helping students identify weaknesses, improve faster, track progress, and maximize their chances of gaining admission into their desired university and course.",
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