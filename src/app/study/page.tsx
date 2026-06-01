"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame,
  Target,
  Brain,
  Clock,
  Zap,
  BookOpen,
  RotateCcw,
  ChevronRight,
  CheckCircle2,
  Circle,
  Loader2,
  ArrowLeft,
  Trophy,
  Sparkles,
  Timer,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface StudyTask {
  id: string;
  subject: string;
  topicId: string;
  taskType: string;
  title: string;
  description: string | null;
  questionCount: number;
  difficulty: string;
  priority: number;
  status: string;
  completedAt: string | null;
  topic: { name: string; subject: string };
}

interface Streak {
  currentStreak: number;
  longestStreak: number;
  totalStudyDays: number;
  lastStudyDate: string | null;
}

const TASK_TYPE_CONFIG: Record<string, { icon: typeof Brain; color: string; label: string }> = {
  WEAK_TOPIC_DRILL: { icon: Target, color: "var(--color-danger-400)", label: "Weak Area" },
  REVIEW: { icon: BookOpen, color: "var(--color-info-400)", label: "Review" },
  SPACED_REPETITION: { icon: Brain, color: "var(--color-tier-elite)", label: "Spaced Rep" },
  NEW_TOPIC: { icon: Sparkles, color: "var(--color-accent-green)", label: "New" },
  MOCK_PREP: { icon: Trophy, color: "var(--color-warning-400)", label: "Mock Prep" },
  SPEED_DRILL: { icon: Timer, color: "var(--color-warning-400)", label: "Speed" },
};

export default function StudyPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study/plan");
      const data = await res.json();
      setTasks(data.tasks || []);
      setStreak(data.streak || null);
    } catch {
      console.error("Failed to load study plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlan();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/study/plan", { method: "POST" });
      const data = await res.json();
      setTasks(data.tasks || []);
      setStreak(data.streak || null);
    } catch {
      console.error("Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const handleStartTask = (task: StudyTask) => {
    const mode = task.taskType === "SPEED_DRILL" ? "TIMED" : "TOPIC_DRILL";
    router.push(
      `/practice?mode=${mode}&topic=${task.topicId}&count=${task.questionCount}&studyTaskId=${task.id}`
    );
  };

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="text-center">
          <Loader2
            className="mx-auto mb-4 h-8 w-8 animate-spin"
            style={{ color: "var(--color-accent-green)" }}
          />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Building your study plan...
          </p>
        </div>
      </div>
    );
  }

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
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-primary)" }}
          >
            Study Today
          </span>
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="btn-ghost"
            title="Regenerate plan"
          >
            <RotateCcw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Streak + Progress row */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {/* Streak */}
          <div
            className="card flex items-center gap-3 p-4"
            style={{
              boxShadow: streak && streak.currentStreak > 0 ? "var(--shadow-glow)" : undefined,
            }}
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{
                background:
                  streak && streak.currentStreak > 0
                    ? "rgba(245, 158, 11, 0.1)"
                    : "var(--color-surface-lighter)",
              }}
            >
              <Flame
                className="h-5 w-5"
                style={{
                  color:
                    streak && streak.currentStreak > 0
                      ? "var(--color-warning-400)"
                      : "var(--color-text-muted)",
                }}
              />
            </div>
            <div>
              <p
                className="text-lg font-bold"
                style={{
                  fontFamily: "var(--font-display)",
                  color:
                    streak && streak.currentStreak > 0
                      ? "var(--color-warning-400)"
                      : "var(--color-text-tertiary)",
                }}
              >
                {streak?.currentStreak || 0}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                day streak
              </p>
            </div>
          </div>

          {/* Today's progress */}
          <div className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "var(--color-text-tertiary)" }}>
                Today
              </p>
              <p
                className="text-xs font-semibold"
                style={{
                  fontFamily: "var(--font-mono)",
                  color: progress === 100 ? "var(--color-accent-green)" : "var(--color-text-secondary)",
                }}
              >
                {completedCount}/{totalCount}
              </p>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width: `${progress}%`,
                  background:
                    progress === 100
                      ? "var(--color-accent-green)"
                      : "var(--color-accent-dim)",
                }}
              />
            </div>
            {progress === 100 && (
              <p
                className="text-[0.625rem] mt-1.5 font-semibold"
                style={{ color: "var(--color-accent-green)" }}
              >
                All done for today!
              </p>
            )}
          </div>
        </div>

        {/* No tasks state */}
        {tasks.length === 0 && (
          <div className="card text-center py-12">
            <Brain
              className="mx-auto mb-4 h-8 w-8"
              style={{ color: "var(--color-text-muted)" }}
            />
            <p
              className="mb-2 text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              No study plan yet
            </p>
            <p
              className="mb-4 text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Complete a diagnostic test first so we can build your personalized plan.
            </p>
            <button onClick={() => router.push("/diagnostic")} className="btn-primary">
              <Zap className="h-4 w-4" />
              Take Diagnostic
            </button>
          </div>
        )}

        {/* Task list */}
        <div className="space-y-2">
          {tasks.map((task) => {
            const config = TASK_TYPE_CONFIG[task.taskType] || TASK_TYPE_CONFIG.REVIEW;
            const Icon = config.icon;
            const isCompleted = task.status === "COMPLETED";

            return (
              <div
                key={task.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: isCompleted
                    ? "rgba(34, 197, 94, 0.04)"
                    : "var(--color-surface-card)",
                  border: `1px solid ${
                    isCompleted ? "rgba(34, 197, 94, 0.15)" : "var(--color-surface-border)"
                  }`,
                  opacity: isCompleted ? 0.7 : 1,
                }}
              >
                <div className="flex items-start gap-3">
                  {/* Status icon */}
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2
                        className="h-5 w-5"
                        style={{ color: "var(--color-accent-green)" }}
                      />
                    ) : (
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full"
                        style={{
                          border: `2px solid ${config.color}40`,
                        }}
                      >
                        <Icon className="h-3 w-3" style={{ color: config.color }} />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: isCompleted
                            ? "var(--color-text-tertiary)"
                            : "var(--color-text-primary)",
                          textDecoration: isCompleted ? "line-through" : "none",
                        }}
                      >
                        {task.title}
                      </p>
                      <span
                        className="badge"
                        style={{
                          fontSize: "0.5625rem",
                          background: `${config.color}12`,
                          color: config.color,
                          border: `1px solid ${config.color}25`,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>

                    {task.description && (
                      <p
                        className="text-xs mb-2"
                        style={{
                          color: "var(--color-text-tertiary)",
                          lineHeight: "1.4",
                        }}
                      >
                        {task.description}
                      </p>
                    )}

                    <div
                      className="flex items-center gap-3 text-[0.625rem]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      <span>{task.topic.name}</span>
                      <span>·</span>
                      <span>{task.questionCount} questions</span>
                      <span>·</span>
                      <span>
                        {task.difficulty.charAt(0) + task.difficulty.slice(1).toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {/* Action */}
                  {!isCompleted && (
                    <button
                      onClick={() => handleStartTask(task)}
                      className="btn-primary shrink-0"
                      style={{ padding: "0.5rem 0.875rem", fontSize: "0.75rem" }}
                    >
                      Start
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak stats */}
        {streak && streak.totalStudyDays > 0 && (
          <div
            className="mt-8 grid grid-cols-3 gap-3"
          >
            <div className="stat-card text-center">
              <p className="stat-value" style={{ fontSize: "1.25rem" }}>
                {streak.currentStreak}
              </p>
              <p className="stat-label">Current Streak</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-value" style={{ fontSize: "1.25rem" }}>
                {streak.longestStreak}
              </p>
              <p className="stat-label">Best Streak</p>
            </div>
            <div className="stat-card text-center">
              <p className="stat-value" style={{ fontSize: "1.25rem" }}>
                {streak.totalStudyDays}
              </p>
              <p className="stat-label">Total Days</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <Logo size="small" />
          <div
            className="mt-3 flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Privacy Policy
            </a>
            <span>·</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Terms
            </a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}