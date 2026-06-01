"use client";

interface DifficultyData {
  easy: { correct: number; total: number; accuracy: number };
  medium: { correct: number; total: number; accuracy: number };
  hard: { correct: number; total: number; accuracy: number };
}

export function DifficultyBreakdown({ data }: { data: DifficultyData }) {
  const levels = [
    {
      key: "easy",
      label: "Easy",
      color: "var(--color-accent-green)",
      ...data.easy,
    },
    {
      key: "medium",
      label: "Medium",
      color: "var(--color-warning-400)",
      ...data.medium,
    },
    {
      key: "hard",
      label: "Hard",
      color: "var(--color-danger-400)",
      ...data.hard,
    },
  ];

  const maxTotal = Math.max(...levels.map((l) => l.total), 1);

  return (
    <div className="card p-4 space-y-4">
      {levels.map((level) => (
        <div key={level.key}>
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: level.color }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {level.label}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span
                className="text-xs"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                {level.correct}/{level.total}
              </span>
              <span
                className="text-sm font-semibold w-10 text-right"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: level.color,
                }}
              >
                {level.accuracy}%
              </span>
            </div>
          </div>

          {/* Stacked bar */}
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
                width: `${level.accuracy}%`,
                height: "100%",
                borderRadius: "9999px",
                background: level.color,
                transition: "width 0.6s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            />
          </div>
        </div>
      ))}

      {/* Insight */}
      {data.easy.accuracy > 0 && data.hard.accuracy > 0 && (
        <p
          className="text-xs pt-2"
          style={{
            color: "var(--color-text-tertiary)",
            borderTop: "1px solid var(--color-surface-border)",
          }}
        >
          {data.easy.accuracy - data.hard.accuracy > 40
            ? "Big gap between easy and hard — focus on medium-difficulty practice to bridge it."
            : data.hard.accuracy > 60
            ? "Strong performance on hard questions — you're thinking deeply."
            : "Consistent across difficulties — solid fundamentals."}
        </p>
      )}
    </div>
  );
}