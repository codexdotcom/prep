"use client";

import { Clock, Zap, AlertTriangle, Sun, Moon, Sunrise, Sunset } from "lucide-react";

interface SpeedAnalysisProps {
  avgTimeMs: number;
  speedRating: string;
  bestStudyTime: string | null;
}

export function SpeedAnalysis({
  avgTimeMs,
  speedRating,
  bestStudyTime,
}: SpeedAnalysisProps) {
  const avgSeconds = Math.round(avgTimeMs / 1000);
  const idealSeconds = 72;
  const ratio = avgSeconds / idealSeconds;

  const speedConfig: Record<string, { color: string; icon: typeof Zap; label: string; advice: string }> = {
    too_fast: {
      color: "var(--color-warning-400)",
      icon: Zap,
      label: "Rushing",
      advice: "You're averaging under 50s per question. Consider spending a few extra seconds verifying your answers.",
    },
    optimal: {
      color: "var(--color-accent-green)",
      icon: Clock,
      label: "Great pace",
      advice: "Your timing is well within the ideal range. Keep this up during mock exams.",
    },
    too_slow: {
      color: "var(--color-danger-400)",
      icon: AlertTriangle,
      label: "Too slow",
      advice: "You're averaging over 90s per question. In the real JAMB you get about 72 seconds. Try timed practice to build speed.",
    },
  };

  const config = speedConfig[speedRating] || speedConfig.optimal;
  const Icon = config.icon;

  const timeIcons: Record<string, typeof Sun> = {
    early_morning: Sunrise,
    morning: Sun,
    afternoon: Sun,
    evening: Sunset,
    night: Moon,
  };

  const timeLabels: Record<string, string> = {
    early_morning: "Early morning (5–8 AM)",
    morning: "Morning (8 AM–12 PM)",
    afternoon: "Afternoon (12–4 PM)",
    evening: "Evening (4–8 PM)",
    night: "Night (8 PM–12 AM)",
  };

  const TimeIcon = bestStudyTime ? timeIcons[bestStudyTime] || Clock : Clock;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {/* Speed card */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${config.color}15` }}
          >
            <Icon className="h-4 w-4" style={{ color: config.color }} />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              {config.label}
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {avgSeconds}s avg per question
            </p>
          </div>
        </div>

        {/* Speed bar */}
        <div className="relative mb-3">
          <div
            style={{
              height: "8px",
              borderRadius: "9999px",
              background: "var(--color-surface-lighter)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${Math.min(ratio * 100, 100)}%`,
                height: "100%",
                borderRadius: "9999px",
                background: config.color,
                transition: "width 0.6s",
              }}
            />
          </div>
          {/* Ideal marker */}
          <div
            className="absolute top-0"
            style={{
              left: "100%",
              transform: "translateX(-1px)",
              width: "2px",
              height: "8px",
              background: "var(--color-text-tertiary)",
              borderRadius: "1px",
            }}
          />
          <div className="flex justify-between mt-1">
            <span
              className="text-[0.625rem]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
              }}
            >
              0s
            </span>
            <span
              className="text-[0.625rem]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
              }}
            >
              {idealSeconds}s ideal
            </span>
          </div>
        </div>

        <p
          className="text-xs"
          style={{ color: "var(--color-text-tertiary)", lineHeight: "1.5" }}
        >
          {config.advice}
        </p>
      </div>

      {/* Best study time */}
      <div className="card p-4">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <TimeIcon
              className="h-4 w-4"
              style={{ color: "var(--color-accent-green)" }}
            />
          </div>
          <div>
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Best study time
            </p>
            <p
              className="text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Based on your accuracy
            </p>
          </div>
        </div>

        {bestStudyTime ? (
          <>
            <p
              className="text-sm font-medium mb-2"
              style={{ color: "var(--color-accent-green)" }}
            >
              {timeLabels[bestStudyTime] || bestStudyTime}
            </p>
            <p
              className="text-xs"
              style={{
                color: "var(--color-text-tertiary)",
                lineHeight: "1.5",
              }}
            >
              You perform best during this window. Try to schedule your
              hardest topics here.
            </p>
          </>
        ) : (
          <p
            className="text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Take tests at different times of day to discover your peak
            performance window.
          </p>
        )}
      </div>
    </div>
  );
}