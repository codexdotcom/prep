"use client";

import { useState, useCallback } from "react";

interface ShareOptions {
  type: "score" | "rank" | "test" | "achievement";
  sessionId?: string;
}

export function useShare() {
  const [sharing, setSharing] = useState(false);

  const shareCard = useCallback(async (options: ShareOptions) => {
    setSharing(true);

    try {
      const params = new URLSearchParams({ type: options.type });
      if (options.sessionId) params.set("sessionId", options.sessionId);

      const svgUrl = `/api/share/card?${params}`;

      // Fetch SVG and convert to blob for sharing
      const res = await fetch(svgUrl);
      const svgText = await res.text();

      // Convert SVG to PNG via canvas
      const img = new Image();
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 680;
      const ctx = canvas.getContext("2d")!;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          ctx.drawImage(img, 0, 0, 1200, 680);
          resolve();
        };
        img.onerror = reject;
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgText)}`;
      });

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), "image/png", 0.95);
      });

      const file = new File([blob], "prepgenius-result.png", { type: "image/png" });

      const shareText = getShareText(options.type);

      // Try native share first
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          text: shareText,
          files: [file],
        });
      } else if (navigator.share) {
        await navigator.share({
          text: shareText,
          url: "https://jamb.os",
        });
      } else {
        // Fallback: download image
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "prepgenius-result.png";
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      // User cancelled share or error
      console.log("Share cancelled or failed:", error);
    } finally {
      setSharing(false);
    }
  }, []);

  const copyShareLink = useCallback(async (type: string) => {
    const text = getShareText(type);
    await navigator.clipboard.writeText(text);
  }, []);

  return { shareCard, copyShareLink, sharing };
}

function getShareText(type: string): string {
  const base = "https://jamb.os";

  switch (type) {
    case "score":
      return `Check out my predicted JAMB score on JAMB OS! 🎯📚\n\nAI-powered JAMB prep that actually works.\n${base}`;
    case "rank":
      return `See my ranking on JAMB OS! 🏆🇳🇬\n\nCompete with students across Nigeria.\n${base}`;
    case "test":
      return `Just completed a practice test on JAMB OS! 💪📝\n\nThe smartest way to prep for JAMB.\n${base}`;
    default:
      return `I'm preparing for JAMB with JAMB OS — AI-powered, personalized, and actually effective.\n${base}`;
  }
}