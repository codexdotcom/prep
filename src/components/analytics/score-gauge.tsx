"use client";

import { useEffect, useState } from "react";
import { getScoreColor, getScoreLabel } from "@/lib/utils";

interface ScoreGaugeProps {
  score: number;
  target: number;
  riskLevel: string;
}

export function ScoreGauge({ score, target, riskLevel }: ScoreGaugeProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const scoreColor = getScoreColor(score);
  const label = getScoreLabel(score);
  const percentage = Math.min((score / 400) * 100, 100);
  const targetPercentage = Math.min((target / 400) * 100, 100);
  const gap = target - score;

  useEffect(() => {
    const duration = 1200;
    const start = performance.now();

    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(eased * score));

      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
  }, [score]);

  const riskColors: Record<string, string> = {
    HIGH: "var(--color-danger-400)",
    MEDIUM: "var(--color-warning-400)",
    LOW: "var(--color-accent-green)",
    VERY_LOW: "var(--color-tier-elite)",
  };

  const riskLabels: Record<string, string> = {
    HIGH: "At Risk",
    MEDIUM: "Needs Work",
    LOW: "On Track",
    VERY_LOW: "Strong",
  };

  // SVG arc calculations
  const radius = 70;
  const circumference = Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const targetOffset =
    circumference - (targetPercentage / 100) * circumference;

  return (
    <div
      className="card flex flex-col items-center py-6"
      style={{ boxShadow: "var(--shadow-glow)" }}
    >
      {/* Gauge */}
      <div className="relative mb-3">
        <svg
          width="180"
          height="110"
          viewBox="0 0 180 110"
          style={{ overflow: "visible" }}
        >
          {/* Background arc */}
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none"
            stroke="var(--color-surface-lighter)"
            strokeWidth="10"
            strokeLinecap="round"
          />
          {/* Score arc */}
          <path
            d="M 20 100 A 70 70 0 0 1 160 100"
            fill="none"
            stroke={scoreColor}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={strokeDashoffset}
            style={{
              transition: "stroke-dashoffset 1.2s cubic-bezier(0.16, 1, 0.3, 1)",
              filter: `drop-shadow(0 0 6px ${scoreColor}40)`,
            }}
          />
          {/* Target marker */}
          {target > 0 && (
            <path
              d="M 20 100 A 70 70 0 0 1 160 100"
              fill="none"
              stroke="transparent"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`2 ${circumference - 2}`}
              strokeDashoffset={targetOffset}
              style={{ stroke: "var(--color-text-tertiary)" }}
            />
          )}
        </svg>

        {/* Score text */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-end pb-1"
        >
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "2.5rem",
              lineHeight: 1,
              color: scoreColor,
            }}
          >
            {animatedScore}
          </p>
          <p
            className="text-xs font-semibold mt-1"
            style={{ color: scoreColor }}
          >
            {label}
          </p>
        </div>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-4 text-xs">
        <span style={{ color: "var(--color-text-tertiary)" }}>
          Target:{" "}
          <strong style={{ color: "var(--color-text-secondary)" }}>
            {target}
          </strong>
        </span>
        <span
          className="badge"
          style={{
            background: `${riskColors[riskLevel]}15`,
            color: riskColors[riskLevel],
            border: `1px solid ${riskColors[riskLevel]}30`,
            fontSize: "0.6875rem",
          }}
        >
          {riskLabels[riskLevel] || riskLevel}
        </span>
      </div>

      {gap > 0 && (
        <p
          className="mt-2 text-xs text-center"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          {gap} points to go
        </p>
      )}
    </div>
  );
}