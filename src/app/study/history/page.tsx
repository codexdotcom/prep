"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Loader2, Clock, CheckCircle2, BarChart3 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface HeatmapDay {
  date: string;
  level: number;
  completed: number;
  total: number;
}

interface HistoryData {
  heatmap: HeatmapDay[];
  summary: {
    totalCompleted: number;
    totalPlanned: number;
    completionRate: number;
    activeDays: number;
    totalHours: number;
    avgMinutesPerDay: number;
  };
}

const LEVEL_COLORS = [
  "var(--color-surface-lighter)",
  "rgba(34, 197, 94, 0.15)",
  "rgba(34, 197, 94, 0.3)",
  "rgba(34, 197, 94, 0.55)",
  "rgba(34, 197, 94, 0.85)",
];

export default function StudyHistoryPage() {
  const router = useRouter();
  const [data, setData] = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/study/history?days=60");
        const d = await res.json();
        if (res.ok) setData(d);
      } catch {
        console.error("Failed to load history");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/study/schedule")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Schedule</span>
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Study History
          </span>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Summary stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { icon: CheckCircle2, value: data.summary.totalCompleted, label: "Completed", color: "var(--color-accent-green)" },
            { icon: Calendar, value: data.summary.activeDays, label: "Active Days", color: "var(--color-info-400)" },
            { icon: Clock, value: `${data.summary.totalHours}h`, label: "Total Study", color: "var(--color-tier-elite)" },
            { icon: BarChart3, value: `${data.summary.completionRate}%`, label: "Completion", color: "var(--color-warning-400)" },
          ].map(({ icon: Icon, value, label, color }) => (
            <div key={label} className="stat-card text-center">
              <Icon className="mx-auto mb-1 h-4 w-4" style={{ color }} />
              <p className="stat-value" style={{ fontSize: "1.25rem" }}>{value}</p>
              <p className="stat-label">{label}</p>
            </div>
          ))}
        </div>

        {/* Heatmap */}
        <div className="card p-4 mb-6">
          <p className="section-label mb-3">Activity — Last 60 days</p>

          <div
            className="grid gap-1"
            style={{
              gridTemplateColumns: "repeat(auto-fill, minmax(14px, 1fr))",
            }}
          >
            {data.heatmap.map((day) => (
              <div
                key={day.date}
                className="aspect-square rounded-sm"
                style={{
                  background: LEVEL_COLORS[day.level],
                  minWidth: "14px",
                }}
                title={`${day.date}: ${day.completed}/${day.total} tasks`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-1.5 mt-3">
            <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Less</span>
            {LEVEL_COLORS.map((color, i) => (
              <div
                key={i}
                className="h-3 w-3 rounded-sm"
                style={{ background: color }}
              />
            ))}
            <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>More</span>
          </div>
        </div>

        {/* Daily average */}
        {data.summary.avgMinutesPerDay > 0 && (
          <div className="card p-4 text-center">
            <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
              On active days, you average
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                color: "var(--color-accent-green)",
              }}
            >
              {data.summary.avgMinutesPerDay} min
            </p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              of focused study per day
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <Logo size="small" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Terms</a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}