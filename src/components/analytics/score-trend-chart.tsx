"use client";

import { getScoreColor } from "@/lib/utils";

interface ScoreTrendPoint {
  date: string;
  score: number;
  mode: string;
}

export function ScoreTrendChart({ data }: { data: ScoreTrendPoint[] }) {
  if (data.length === 0) {
    return (
      <div
        className="card flex items-center justify-center p-6"
        style={{ minHeight: "200px" }}
      >
        <p
          className="text-sm"
          style={{ color: "var(--color-text-tertiary)" }}
        >
          Take more tests to see your trend
        </p>
      </div>
    );
  }

  const maxScore = 400;
  const chartHeight = 160;
  const dotSize = 8;

  return (
    <div className="card p-4">
      {/* Y-axis labels + chart area */}
      <div className="flex gap-2" style={{ height: `${chartHeight}px` }}>
        {/* Y-axis */}
        <div
          className="flex flex-col justify-between text-right shrink-0"
          style={{ width: "28px" }}
        >
          {[400, 300, 200, 100, 0].map((v) => (
            <span
              key={v}
              className="text-[0.625rem]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
                lineHeight: "1",
              }}
            >
              {v}
            </span>
          ))}
        </div>

        {/* Chart */}
        <div className="flex-1 relative">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((pct) => (
            <div
              key={pct}
              className="absolute left-0 right-0"
              style={{
                top: `${pct}%`,
                height: "1px",
                background: "var(--color-surface-border)",
                opacity: pct === 50 ? 0.5 : 0.2,
              }}
            />
          ))}

          {/* Target line at 250 */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: `${((maxScore - 250) / maxScore) * 100}%`,
              height: "1px",
              borderTop: "1px dashed var(--color-accent-dim)",
            }}
          />

          {/* Data points */}
          <div className="absolute inset-0 flex items-end">
            {data.map((point, i) => {
              const yPct = (point.score / maxScore) * 100;
              const color = getScoreColor(point.score);

              return (
                <div
                  key={i}
                  className="flex-1 flex justify-center relative"
                  style={{ height: "100%" }}
                >
                  {/* Dot */}
                  <div
                    className="absolute rounded-full"
                    style={{
                      width: `${dotSize}px`,
                      height: `${dotSize}px`,
                      background: color,
                      bottom: `calc(${yPct}% - ${dotSize / 2}px)`,
                      boxShadow: `0 0 8px ${color}50`,
                      transition: "bottom 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                    title={`${point.score} — ${new Date(point.date).toLocaleDateString()}`}
                  />

                  {/* Connecting line to next point */}
                  {i < data.length - 1 && (
                    <svg
                      className="absolute left-1/2 w-full"
                      style={{
                        top: 0,
                        height: "100%",
                        overflow: "visible",
                        pointerEvents: "none",
                      }}
                    >
                      <line
                        x1="0"
                        y1={`${100 - yPct}%`}
                        x2="100%"
                        y2={`${100 - (data[i + 1].score / maxScore) * 100}%`}
                        stroke="var(--color-accent-dim)"
                        strokeWidth="1.5"
                        strokeOpacity="0.4"
                      />
                    </svg>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex mt-2 ml-[32px]">
        {data.map((point, i) => (
          <div key={i} className="flex-1 text-center">
            <span
              className="text-[0.5625rem]"
              style={{
                fontFamily: "var(--font-mono)",
                color: "var(--color-text-muted)",
              }}
            >
              {new Date(point.date).toLocaleDateString("en-NG", {
                day: "numeric",
                month: "short",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}