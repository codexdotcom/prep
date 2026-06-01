"use client";

import {
  Clock,
  Grid3X3,
  Flag,
  CheckCircle2,
  Send,
  AlertTriangle,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

interface TestHeaderProps {
  currentIndex: number;
  totalQuestions: number;
  timeRemaining: number;
  totalAnswered: number;
  totalFlagged: number;
  isTimed: boolean;
  onToggleNav: () => void;
  onSubmit: () => void;
}

export function TestHeader({
  currentIndex,
  totalQuestions,
  timeRemaining,
  totalAnswered,
  totalFlagged,
  isTimed,
  onToggleNav,
  onSubmit,
}: TestHeaderProps) {
  const isLowTime = isTimed && timeRemaining < 300; // under 5 min
  const isCriticalTime = isTimed && timeRemaining < 60;

  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: "var(--color-surface-card)",
        borderBottom: "1px solid var(--color-surface-border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Progress */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-sm font-semibold"
              style={{ color: "var(--color-accent-green)" }}
            >
              {currentIndex + 1}
            </span>
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>/</span>
            <span
              className="font-mono text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {totalQuestions}
            </span>
          </div>

          {/* Mini progress bar */}
          <div
            className="hidden sm:block"
            style={{
              width: "120px",
              height: "4px",
              borderRadius: "9999px",
              background: "var(--color-surface-lighter)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                height: "100%",
                borderRadius: "9999px",
                background: "var(--color-accent-green)",
                transition: "width 0.3s",
              }}
            />
          </div>
        </div>

        {/* Center: Timer */}
        {isTimed && (
          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{
              background: isCriticalTime
                ? "rgba(239, 68, 68, 0.15)"
                : isLowTime
                ? "rgba(245, 158, 11, 0.1)"
                : "var(--color-surface-lighter)",
              border: `1px solid ${
                isCriticalTime
                  ? "rgba(239, 68, 68, 0.3)"
                  : isLowTime
                  ? "rgba(245, 158, 11, 0.2)"
                  : "var(--color-surface-border)"
              }`,
            }}
          >
            {isCriticalTime ? (
              <AlertTriangle className="h-3.5 w-3.5" style={{ color: "var(--color-danger-400)" }} />
            ) : (
              <Clock
                className="h-3.5 w-3.5"
                style={{
                  color: isLowTime
                    ? "var(--color-warning-400)"
                    : "var(--color-text-tertiary)",
                }}
              />
            )}
            <span
              className="font-mono text-sm font-semibold"
              style={{
                color: isCriticalTime
                  ? "var(--color-danger-400)"
                  : isLowTime
                  ? "var(--color-warning-400)"
                  : "var(--color-text-primary)",
              }}
            >
              {formatTime(timeRemaining)}
            </span>
          </div>
        )}

        {/* Right: Stats + Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="hidden sm:flex items-center gap-3 mr-2 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" style={{ color: "var(--color-accent-green)" }} />
              {totalAnswered}
            </span>
            {totalFlagged > 0 && (
              <span className="flex items-center gap-1">
                <Flag className="h-3.5 w-3.5" style={{ color: "var(--color-warning-400)" }} />
                {totalFlagged}
              </span>
            )}
          </div>

          <button
            onClick={onToggleNav}
            className="btn-ghost lg:hidden"
            aria-label="Question navigator"
          >
            <Grid3X3 className="h-4 w-4" />
          </button>

          <button
            onClick={onSubmit}
            className="btn-primary"
            style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}
          >
            <Send className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Submit</span>
          </button>
        </div>
      </div>
    </header>
  );
}