"use client";

import { useRouter } from "next/navigation";
import {
  Trophy,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ArrowRight,
  RotateCcw,
  Eye,
  BarChart3,
} from "lucide-react";
import { formatTime, getScoreColor, getScoreLabel } from "@/lib/utils";
import type { TestResult } from "@/types/test";
import { ShareButton } from "../ui/share-button";

interface ResultsViewProps {
  result: TestResult;
  sessionId: string;
}

export function ResultsView({ result, sessionId }: ResultsViewProps) {
  const router = useRouter();

  const percentage = Math.round(
    (result.totalCorrect / result.totalQuestions) * 100
  );
  const scoreColor = getScoreColor(result.score);
  const scoreLabel = getScoreLabel(result.score);

  // Build topic performance list
  const topicEntries = Object.entries(result.topicAccuracy).map(
    ([topicId, data]) => ({
      topicId,
      ...data,
      percentage: Math.round((data.correct / data.total) * 100),
    })
  );
  topicEntries.sort((a, b) => a.percentage - b.percentage);

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-surface)" }}
    >
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        {/* Hero score section */}
        <div
          className="mb-8 rounded-2xl p-8 text-center"
          style={{
            background: "var(--color-surface-card)",
            border: "1px solid var(--color-surface-border)",
            boxShadow: "var(--shadow-glow)",
            animation: "var(--animate-slide-up)",
          }}
        >
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <Trophy className="h-8 w-8" style={{ color: scoreColor }} />
          </div>

          <p
            className="mb-1 text-sm font-medium"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Your Estimated JAMB Score
          </p>

          <p
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "3.5rem",
              lineHeight: "1",
              color: scoreColor,
            }}
          >
            {result.score}
          </p>
          <p
            className="mt-2 text-sm font-semibold"
            style={{ color: scoreColor }}
          >
            {scoreLabel}
          </p>

          <p
            className="mt-4 text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {percentage}% accuracy · {result.totalCorrect} of{" "}
            {result.totalQuestions} correct
          </p>
        </div>

        {/* Stats grid */}
        <div
          className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-4"
          style={{ animation: "var(--animate-fade-in)" }}
        >
          {[
            {
              icon: CheckCircle2,
              value: result.totalCorrect,
              label: "Correct",
              color: "var(--color-accent-green)",
            },
            {
              icon: XCircle,
              value: result.totalWrong,
              label: "Wrong",
              color: "var(--color-danger-400)",
            },
            {
              icon: MinusCircle,
              value: result.totalSkipped,
              label: "Skipped",
              color: "var(--color-text-tertiary)",
            },
            {
              icon: Clock,
              value: formatTime(result.timeTaken),
              label: "Time Used",
              color: "var(--color-info-400)",
            },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="stat-card text-center">
              <Icon
                className="mx-auto mb-2 h-5 w-5"
                style={{ color }}
              />
              <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                {value}
              </p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Topic breakdown */}
        {topicEntries.length > 0 && (
          <div
            className="mb-8 rounded-2xl p-6"
            style={{
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-surface-border)",
            }}
          >
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
              <h3
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  color: "var(--color-text-primary)",
                }}
              >
                Topic Breakdown
              </h3>
            </div>

            <div className="space-y-4">
              {topicEntries.map((topic) => {
                let barColor = "var(--color-accent-green)";
                if (topic.percentage < 40) barColor = "var(--color-danger-400)";
                else if (topic.percentage < 70) barColor = "var(--color-warning-400)";

                return (
                  <div key={topic.topicId}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span
                        className="text-sm"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        {topic.topicId}
                      </span>
                      <span
                        className="text-xs font-semibold"
                        style={{
                          color: barColor,
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {topic.correct}/{topic.total} ({topic.percentage}%)
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${topic.percentage}%`,
                          background: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={() => router.push(`/test/${sessionId}/review`)}
            className="btn-secondary flex-1"
          >
            <Eye className="h-4 w-4" />
            Review Answers
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary flex-1"
          >
            Continue
            <ArrowRight className="h-4 w-4" />
          </button>
          // Add to the actions section in results-view.tsx
<button
  onClick={() => router.push(`/test/${sessionId}/review`)}
  className="btn-secondary flex-1"
>
  <Eye className="h-4 w-4" />
  Review with AI Explanations
</button>
<ShareButton type="test" sessionId={sessionId} label="Share Score" />
        </div>

        {/* Footer */}
        <footer
          className="mt-16 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <p
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            PrepGenius · Scores are estimates based on practice performance
          </p>
          <div
            className="mt-2 flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Privacy Policy
            </a>
            <span>·</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Terms of Service
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}