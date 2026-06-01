"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Target,
  Brain,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Flame,
  CheckCircle2,
  Circle,
  RotateCcw,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface CalendarDay {
  date: string;
  dayName: string;
  isToday: boolean;
  isPast: boolean;
  tasks: Array<{
    id: string;
    title: string;
    taskType: string;
    status: string;
    subject: string;
    topic: { name: string; subject: string };
  }>;
  completedCount: number;
  totalCount: number;
  hasReview: boolean;
}

interface ScheduleData {
  calendar: CalendarDay[];
  daysToExam: number;
  examDate: string;
  studyHoursPerDay: number;
  weeklySubjectDistribution: Record<string, number>;
  targetScore: number;
  upcomingReviews: Array<{
    id: string;
    title: string;
    nextReviewDate: string;
    topic: { name: string; subject: string };
  }>;
}

const TASK_COLORS: Record<string, string> = {
  WEAK_TOPIC_DRILL: "var(--color-danger-400)",
  REVIEW: "var(--color-info-400)",
  SPACED_REPETITION: "var(--color-tier-elite)",
  NEW_TOPIC: "var(--color-accent-green)",
  MOCK_PREP: "var(--color-warning-400)",
  SPEED_DRILL: "var(--color-warning-400)",
};

export default function SchedulePage() {
  const router = useRouter();
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    async function fetch_() {
      try {
        const res = await fetch("/api/study/schedule?weeks=2");
        const d = await res.json();
        if (res.ok) setData(d);
      } catch {
        console.error("Failed to load schedule");
      } finally {
        setLoading(false);
      }
    }
    fetch_();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
        <div className="card text-center p-8">
          <p style={{ color: "var(--color-text-tertiary)" }}>Could not load schedule</p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary mt-4">Dashboard</button>
        </div>
      </div>
    );
  }

  const selectedDayData = data.calendar.find((d) => d.date === selectedDate);
  const formatSubject = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <button onClick={() => router.push("/study")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Study</span>
          </button>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Revision Timetable
            </span>
          </div>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-6">
        {/* Exam countdown + study hours */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <div className="stat-card text-center">
            <Target className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--color-danger-400)" }} />
            <p className="stat-value" style={{ fontSize: "1.375rem" }}>{data.daysToExam}</p>
            <p className="stat-label">Days to JAMB</p>
          </div>
          <div className="stat-card text-center">
            <Clock className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--color-info-400)" }} />
            <p className="stat-value" style={{ fontSize: "1.375rem" }}>{data.studyHoursPerDay}h</p>
            <p className="stat-label">Daily Target</p>
          </div>
          <div className="stat-card text-center hidden sm:block">
            <Flame className="mx-auto mb-1 h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            <p className="stat-value" style={{ fontSize: "1.375rem" }}>{data.targetScore}</p>
            <p className="stat-label">Score Target</p>
          </div>
        </div>

        {/* Weekly subject distribution */}
        <div className="card mb-6 p-4">
          <p className="section-label mb-3">Recommended weekly hours by subject</p>
          <div className="space-y-2">
            {Object.entries(data.weeklySubjectDistribution)
              .sort(([, a], [, b]) => b - a)
              .map(([subject, hours]) => {
                const maxHours = Math.max(...Object.values(data.weeklySubjectDistribution));
                const pct = maxHours > 0 ? (hours / maxHours) * 100 : 0;

                return (
                  <div key={subject} className="flex items-center gap-3">
                    <span
                      className="text-xs w-28 sm:w-36 truncate"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      {formatSubject(subject)}
                    </span>
                    <div className="flex-1 progress-track" style={{ height: "8px" }}>
                      <div
                        className="progress-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span
                      className="text-xs w-10 text-right font-semibold"
                      style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-tertiary)" }}
                    >
                      {hours}h
                    </span>
                  </div>
                );
              })}
          </div>
          <p className="text-[0.625rem] mt-3" style={{ color: "var(--color-text-muted)" }}>
            Weaker subjects are allocated more time automatically.
          </p>
        </div>

        {/* Calendar grid */}
        <div className="card mb-6 p-4">
          <p className="section-label mb-3">Next 14 days</p>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Day headers */}
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div
                key={d}
                className="text-center text-[0.625rem] font-semibold py-1"
                style={{ color: "var(--color-text-muted)" }}
              >
                {d}
              </div>
            ))}

            {/* Calendar cells */}
            {data.calendar.map((day) => {
              const isSelected = selectedDate === day.date;
              const hasActivity = day.totalCount > 0;
              const allDone = day.completedCount === day.totalCount && day.totalCount > 0;
              const dayNum = new Date(day.date).getDate();

              return (
                <button
                  key={day.date}
                  onClick={() => setSelectedDate(isSelected ? null : day.date)}
                  className="relative flex flex-col items-center justify-center rounded-lg py-2 transition-all"
                  style={{
                    background: isSelected
                      ? "rgba(34, 197, 94, 0.1)"
                      : day.isToday
                      ? "var(--color-surface-lighter)"
                      : "transparent",
                    border: `1.5px solid ${
                      isSelected
                        ? "var(--color-accent-green)"
                        : day.isToday
                        ? "var(--color-surface-border)"
                        : "transparent"
                    }`,
                    opacity: day.isPast ? 0.4 : 1,
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{
                      fontFamily: "var(--font-mono)",
                      color: day.isToday ? "var(--color-accent-green)" : "var(--color-text-secondary)",
                    }}
                  >
                    {dayNum}
                  </span>

                  {/* Activity dots */}
                  {hasActivity && (
                    <div className="flex gap-0.5 mt-1">
                      {Array.from({ length: Math.min(day.totalCount, 4) }).map((_, i) => (
                        <span
                          key={i}
                          className="h-1 w-1 rounded-full"
                          style={{
                            background:
                              i < day.completedCount
                                ? "var(--color-accent-green)"
                                : "var(--color-surface-border)",
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Review indicator */}
                  {day.hasReview && (
                    <RotateCcw
                      className="absolute top-1 right-1 h-2.5 w-2.5"
                      style={{ color: "var(--color-tier-elite)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day detail */}
        {selectedDayData && (
          <div
            className="card mb-6 p-4"
            style={{ animation: "var(--animate-slide-up)" }}
          >
            <div className="flex items-center justify-between mb-3">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                {new Date(selectedDayData.date).toLocaleDateString("en-NG", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <span
                className="text-xs"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--color-text-tertiary)",
                }}
              >
                {selectedDayData.completedCount}/{selectedDayData.totalCount} done
              </span>
            </div>

            {selectedDayData.tasks.length === 0 ? (
              <p className="text-sm py-4 text-center" style={{ color: "var(--color-text-tertiary)" }}>
                No tasks scheduled for this day.
              </p>
            ) : (
              <div className="space-y-2">
                {selectedDayData.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 rounded-lg p-3"
                    style={{
                      background: "var(--color-surface-light)",
                      border: "1px solid var(--color-surface-border)",
                    }}
                  >
                    {task.status === "COMPLETED" ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent-green)" }} />
                    ) : (
                      <Circle
                        className="h-4 w-4 shrink-0"
                        style={{ color: TASK_COLORS[task.taskType] || "var(--color-text-muted)" }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: task.status === "COMPLETED"
                            ? "var(--color-text-tertiary)"
                            : "var(--color-text-primary)",
                          textDecoration: task.status === "COMPLETED" ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </p>
                      <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                        {formatSubject(task.topic.subject)} · {task.topic.name}
                      </p>
                    </div>
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: TASK_COLORS[task.taskType] || "var(--color-text-muted)" }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upcoming spaced repetition reviews */}
        {data.upcomingReviews.length > 0 && (
          <div className="card mb-6 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4" style={{ color: "var(--color-tier-elite)" }} />
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Upcoming Reviews
              </p>
            </div>

            <div className="space-y-2">
              {data.upcomingReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-center justify-between rounded-lg p-3"
                  style={{
                    background: "rgba(167, 139, 250, 0.05)",
                    border: "1px solid rgba(167, 139, 250, 0.1)",
                  }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                      {review.topic.name}
                    </p>
                    <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                      {formatSubject(review.topic.subject)}
                    </p>
                  </div>
                  <span
                    className="text-xs font-medium"
                    style={{ fontFamily: "var(--font-mono)", color: "var(--color-tier-elite)" }}
                  >
                    {new Date(review.nextReviewDate).toLocaleDateString("en-NG", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity heatmap link */}
        <button
          onClick={() => router.push("/study/history")}
          className="card-interactive w-full flex items-center justify-between p-4 mb-6"
        >
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Study History
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                Activity heatmap and progress over time
              </p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
        </button>

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