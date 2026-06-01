"use client";

interface TopicStat {
  topicId: string;
  topicName: string;
  subject: string;
  correct: number;
  total: number;
  accuracy: number;
  avgTimeMs: number;
  carelessErrors: number;
}

export function TopicHeatmap({ topics }: { topics: TopicStat[] }) {
  const getColor = (accuracy: number) => {
    if (accuracy >= 80) return { bg: "rgba(34, 197, 94, 0.15)", text: "var(--color-accent-green)", border: "rgba(34, 197, 94, 0.3)" };
    if (accuracy >= 60) return { bg: "rgba(59, 130, 246, 0.1)", text: "var(--color-info-400)", border: "rgba(59, 130, 246, 0.2)" };
    if (accuracy >= 40) return { bg: "rgba(245, 158, 11, 0.1)", text: "var(--color-warning-400)", border: "rgba(245, 158, 11, 0.2)" };
    return { bg: "rgba(239, 68, 68, 0.1)", text: "var(--color-danger-400)", border: "rgba(239, 68, 68, 0.2)" };
  };

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // Group by subject
  const grouped = topics.reduce((acc, t) => {
    if (!acc[t.subject]) acc[t.subject] = [];
    acc[t.subject].push(t);
    return acc;
  }, {} as Record<string, TopicStat[]>);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([subject, subjectTopics]) => (
        <div
          key={subject}
          className="card p-4"
        >
          <p
            className="section-label mb-3"
          >
            {formatSubject(subject)}
          </p>

          <div className="space-y-2">
            {subjectTopics.map((topic) => {
              const colors = getColor(topic.accuracy);

              return (
                <div
                  key={topic.topicId}
                  className="flex items-center gap-3 rounded-lg p-2.5"
                  style={{
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  {/* Topic name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-medium truncate"
                      style={{ color: "var(--color-text-primary)" }}
                    >
                      {topic.topicName}
                    </p>
                    <p
                      className="text-xs mt-0.5"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {topic.correct}/{topic.total} · avg{" "}
                      {Math.round(topic.avgTimeMs / 1000)}s
                      {topic.carelessErrors > 0 &&
                        ` · ${topic.carelessErrors} careless`}
                    </p>
                  </div>

                  {/* Accuracy */}
                  <div className="text-right shrink-0">
                    <span
                      className="text-sm font-semibold"
                      style={{
                        fontFamily: "var(--font-mono)",
                        color: colors.text,
                      }}
                    >
                      {topic.accuracy}%
                    </span>
                  </div>

                  {/* Mini bar */}
                  <div
                    className="w-16 shrink-0 hidden sm:block"
                    style={{
                      height: "6px",
                      borderRadius: "9999px",
                      background: "rgba(255,255,255,0.05)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${topic.accuracy}%`,
                        height: "100%",
                        borderRadius: "9999px",
                        background: colors.text,
                        transition: "width 0.5s",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}