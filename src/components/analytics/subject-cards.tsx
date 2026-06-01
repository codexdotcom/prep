"use client";

import { ChevronDown, ChevronUp, TrendingDown, TrendingUp } from "lucide-react";
import { useState } from "react";

interface SubjectStat {
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  predictedScore: number;
  weakTopics: string[];
  strongTopics: string[];
}

export function SubjectCards({ subjects }: { subjects: SubjectStat[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const getAccuracyColor = (acc: number) => {
    if (acc >= 80) return "var(--color-accent-green)";
    if (acc >= 60) return "var(--color-info-400)";
    if (acc >= 40) return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  const formatSubject = (s: string) =>
    s
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {subjects.map((subj) => {
        const isExpanded = expanded === subj.subject;
        const color = getAccuracyColor(subj.accuracy);

        return (
          <button
            key={subj.subject}
            onClick={() =>
              setExpanded(isExpanded ? null : subj.subject)
            }
            className="card-interactive text-left w-full p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {formatSubject(subj.subject)}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {subj.correct}/{subj.total} correct
                </p>
              </div>

              <div className="text-right flex items-center gap-2">
                <span
                  className="font-semibold text-lg"
                  style={{
                    fontFamily: "var(--font-mono)",
                    color,
                  }}
                >
                  {subj.accuracy}%
                </span>
                {isExpanded ? (
                  <ChevronUp
                    className="h-4 w-4"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                ) : (
                  <ChevronDown
                    className="h-4 w-4"
                    style={{ color: "var(--color-text-muted)" }}
                  />
                )}
              </div>
            </div>

            {/* Progress bar */}
            <div className="progress-track mt-3">
              <div
                className="progress-fill"
                style={{ width: `${subj.accuracy}%`, background: color }}
              />
            </div>

            {/* Expanded details */}
            {isExpanded && (
              <div
                className="mt-3 pt-3 space-y-2"
                style={{
                  borderTop: "1px solid var(--color-surface-border)",
                  animation: "var(--animate-fade-in)",
                }}
              >
                {subj.weakTopics.length > 0 && (
                  <div className="flex items-start gap-2">
                    <TrendingDown
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: "var(--color-danger-400)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--color-danger-400)" }}
                      >
                        Weak
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {subj.weakTopics.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                {subj.strongTopics.length > 0 && (
                  <div className="flex items-start gap-2">
                    <TrendingUp
                      className="h-3.5 w-3.5 mt-0.5 shrink-0"
                      style={{ color: "var(--color-accent-green)" }}
                    />
                    <div>
                      <p
                        className="text-xs font-medium"
                        style={{ color: "var(--color-accent-green)" }}
                      >
                        Strong
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--color-text-tertiary)" }}
                      >
                        {subj.strongTopics.join(", ")}
                      </p>
                    </div>
                  </div>
                )}
                <p
                  className="text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Est. JAMB contribution: ~{subj.predictedScore}/100
                </p>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}