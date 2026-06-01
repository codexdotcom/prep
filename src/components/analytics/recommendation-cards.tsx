"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  Clock,
  Target,
  Zap,
  BookOpen,
  TrendingUp,
} from "lucide-react";

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  action?: string;
  actionLabel?: string;
}

const typeIcons: Record<string, typeof Brain> = {
  weak_topic: Target,
  speed: Clock,
  accuracy: AlertTriangle,
  score_gap: TrendingUp,
  action: Zap,
  default: BookOpen,
};

const priorityStyles: Record<string, { border: string; bg: string; dot: string }> = {
  critical: {
    border: "rgba(239, 68, 68, 0.3)",
    bg: "rgba(239, 68, 68, 0.05)",
    dot: "var(--color-danger-400)",
  },
  high: {
    border: "rgba(245, 158, 11, 0.3)",
    bg: "rgba(245, 158, 11, 0.05)",
    dot: "var(--color-warning-400)",
  },
  medium: {
    border: "var(--color-surface-border)",
    bg: "transparent",
    dot: "var(--color-info-400)",
  },
  low: {
    border: "var(--color-surface-border)",
    bg: "transparent",
    dot: "var(--color-text-tertiary)",
  },
};

export function RecommendationCards({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-2">
      {recommendations.map((rec, i) => {
        const Icon = typeIcons[rec.type] || typeIcons.default;
        const styles = priorityStyles[rec.priority] || priorityStyles.medium;

        return (
          <div
            key={i}
            className="rounded-xl p-4 transition-all duration-150"
            style={{
              background: styles.bg,
              border: `1px solid ${styles.border}`,
            }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5"
                style={{ background: `${styles.dot}15` }}
              >
                <Icon className="h-4 w-4" style={{ color: styles.dot }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span
                    className="h-1.5 w-1.5 rounded-full shrink-0"
                    style={{ background: styles.dot }}
                  />
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {rec.title}
                  </p>
                </div>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {rec.description}
                </p>

                {rec.action && (
                  <button
                    onClick={() => router.push(rec.action!)}
                    className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                    style={{ color: "var(--color-accent-green)" }}
                  >
                    {rec.actionLabel || "Go"}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}