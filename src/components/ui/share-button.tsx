"use client";

import { Share2, Download, Copy, Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useShare } from "@/hooks/use-share";

interface ShareButtonProps {
  type: "score" | "rank" | "test" | "achievement";
  sessionId?: string;
  variant?: "primary" | "secondary" | "ghost";
  label?: string;
}

export function ShareButton({
  type,
  sessionId,
  variant = "secondary",
  label = "Share Result",
}: ShareButtonProps) {
  const { shareCard, copyShareLink, sharing } = useShare();
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopy = async () => {
    await copyShareLink(type);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    setShowMenu(false);
  };

  const handleShare = async () => {
    await shareCard({ type, sessionId });
    setShowMenu(false);
  };

  const buttonClass =
    variant === "primary"
      ? "btn-primary"
      : variant === "ghost"
      ? "btn-ghost"
      : "btn-secondary";

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={sharing}
        className={buttonClass}
      >
        {sharing ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="h-4 w-4" />
        )}
        {label}
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="absolute bottom-full mb-2 right-0 z-50 w-48 rounded-xl overflow-hidden"
            style={{
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-surface-border)",
              boxShadow: "var(--shadow-elevated)",
              animation: "var(--animate-scale-in)",
            }}
          >
            <button
              onClick={handleShare}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--color-surface-lighter)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              <Share2 className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
              Share as Image
            </button>

            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left"
              style={{ color: "var(--color-text-secondary)" }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--color-surface-lighter)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              {copied ? (
                <Check className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
              ) : (
                <Copy className="h-4 w-4" style={{ color: "var(--color-info-400)" }} />
              )}
              {copied ? "Copied!" : "Copy Link"}
            </button>

            <button
              onClick={async () => {
                const params = new URLSearchParams({ type });
                if (sessionId) params.set("sessionId", sessionId);
                window.open(`/api/share/card?${params}`, "_blank");
                setShowMenu(false);
              }}
              className="flex w-full items-center gap-2.5 px-4 py-3 text-sm transition-colors text-left"
              style={{
                color: "var(--color-text-secondary)",
                borderTop: "1px solid var(--color-surface-border)",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "var(--color-surface-lighter)";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
              }}
            >
              <Download className="h-4 w-4" style={{ color: "var(--color-tier-elite)" }} />
              Download Card
            </button>
          </div>
        </>
      )}
    </div>
  );
}