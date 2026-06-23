"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Flame, Target, Brain, Zap, BookOpen, RotateCcw,
  ChevronRight, CheckCircle2, Loader2, ArrowLeft,
  Trophy, Sparkles, Timer, Minus, Plus,
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
  WEAK_TOPIC_DRILL: { icon: Target, color: "#888", label: "Weak Area" },
  REVIEW: { icon: BookOpen, color: "#888", label: "Review" },
  SPACED_REPETITION: { icon: Brain, color: "#888", label: "Spaced Rep" },
  NEW_TOPIC: { icon: Sparkles, color: "#888", label: "New" },
  MOCK_PREP: { icon: Trophy, color: "#888", label: "Mock Prep" },
  SPEED_DRILL: { icon: Timer, color: "#888", label: "Speed" },
};

export default function StudyPage() {
  const router = useRouter();
  const [tasks, setTasks] = useState<StudyTask[]>([]);
  const [streak, setStreak] = useState<Streak | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [startingTaskId, setStartingTaskId] = useState<string | null>(null);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/study/plan");
      const data = await res.json();
      const t = data.tasks || [];
      setTasks(t);
      setStreak(data.streak || null);
      const counts: Record<string, number> = {};
      t.forEach((task: StudyTask) => { counts[task.id] = task.questionCount; });
      setQuestionCounts(counts);
    } catch {
      console.error("Failed to load study plan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlan(); }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch("/api/study/plan", { method: "POST" });
      const data = await res.json();
      const t = data.tasks || [];
      setTasks(t);
      setStreak(data.streak || null);
      const counts: Record<string, number> = {};
      t.forEach((task: StudyTask) => { counts[task.id] = task.questionCount; });
      setQuestionCounts(counts);
    } catch {
      console.error("Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const adjustCount = (taskId: string, delta: number) => {
    setQuestionCounts((prev) => {
      const current = prev[taskId] || 5;
      const next = Math.max(5, Math.min(50, current + delta));
      return { ...prev, [taskId]: next };
    });
  };

  const handleStartTask = async (task: StudyTask) => {
    setStartingTaskId(task.id);
    const count = questionCounts[task.id] || task.questionCount;
    try {
      const res = await fetch("/api/tests/drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: task.subject,
          topicIds: [task.topicId],
          questionCount: count,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem(`test-${data.sessionId}`, JSON.stringify(data));
      router.push(`/test/${data.sessionId}`);
    } catch (err: any) {
      alert(err.message || "Failed to start drill");
      setStartingTaskId(null);
    }
  };

  const completedCount = tasks.filter((t) => t.status === "COMPLETED").length;
  const totalCount = tasks.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: "#888" }} />
          <p className="text-sm" style={{ color: "#999" }}>Building your study plan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#888" }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <span className="text-sm font-semibold" style={{ color: "#111" }}>Study Today</span>
          <button onClick={handleRegenerate} disabled={regenerating} title="Regenerate plan"
            className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ color: "#888" }}>
            <RotateCcw className={`h-4 w-4 ${regenerating ? "animate-spin" : ""}`} />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Streak + Progress */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl flex items-center gap-3 p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: streak && streak.currentStreak > 0 ? "rgba(245,158,11,0.08)" : "#f5f5f5" }}>
              <Flame className="h-5 w-5" style={{ color: streak && streak.currentStreak > 0 ? "#f59e0b" : "#ccc" }} />
            </div>
            <div>
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: streak && streak.currentStreak > 0 ? "#333" : "#ccc" }}>
                {streak?.currentStreak || 0}
              </p>
              <p className="text-xs" style={{ color: "#999" }}>day streak</p>
            </div>
          </div>

          <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium" style={{ color: "#999" }}>Today</p>
              <p className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#555" }}>
                {completedCount}/{totalCount}
              </p>
            </div>
            <div style={{ height: "5px", borderRadius: "9999px", background: "#f3f3f3" }}>
              <div style={{ width: `${progress}%`, height: "100%", borderRadius: "9999px", background: progress === 100 ? "#22c55e" : "#111", transition: "width 0.5s" }} />
            </div>
            {progress === 100 && (
              <p className="text-[0.625rem] mt-1.5 font-semibold" style={{ color: "#22c55e" }}>All done for today!</p>
            )}
          </div>
        </div>

        {/* No tasks */}
        {tasks.length === 0 && (
          <div className="rounded-2xl text-center py-12" style={{ background: "#fff", border: "1px solid #eee" }}>
            <Brain className="mx-auto mb-4 h-8 w-8" style={{ color: "#ccc" }} />
            <p className="mb-2 text-sm font-semibold" style={{ color: "#111" }}>No study plan yet</p>
            <p className="mb-4 text-xs" style={{ color: "#999" }}>Complete a diagnostic test first so we can build your personalized plan.</p>
            <button onClick={() => router.push("/diagnostic")}
              className="rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>
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
            const isStarting = startingTaskId === task.id;
            const count = questionCounts[task.id] || task.questionCount;

            return (
              <div key={task.id} className="rounded-xl p-4 transition-all"
                style={{
                  background: isCompleted ? "rgba(34,197,94,0.04)" : "#fff",
                  border: `1px solid ${isCompleted ? "rgba(34,197,94,0.15)" : "#eee"}`,
                  opacity: isCompleted ? 0.6 : 1,
                }}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" style={{ color: "#22c55e" }} />
                    ) : (
                      <div className="flex h-5 w-5 items-center justify-center rounded-full" style={{ border: "2px solid #ddd" }}>
                        <Icon className="h-3 w-3" style={{ color: "#999" }} />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold" style={{
                        color: isCompleted ? "#999" : "#111",
                        textDecoration: isCompleted ? "line-through" : "none",
                      }}>
                        {task.title}
                      </p>
                      <span className="text-[0.5625rem] font-semibold rounded-md px-1.5 py-0.5"
                        style={{ background: "#f5f5f5", color: "#888", border: "1px solid #eee" }}>
                        {config.label}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-xs mb-2" style={{ color: "#999", lineHeight: "1.4" }}>{task.description}</p>
                    )}

                    <div className="flex items-center gap-3 text-[0.625rem]" style={{ color: "#bbb" }}>
                      <span>{task.topic.name}</span>
                      <span>-</span>
                      <span>{task.difficulty.charAt(0) + task.difficulty.slice(1).toLowerCase()}</span>
                    </div>

                    {/* Question count picker */}
                    {!isCompleted && (
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className="text-[0.625rem]" style={{ color: "#999" }}>Questions:</span>
                        <div className="flex items-center gap-0 rounded-lg overflow-hidden" style={{ border: "1px solid #eee" }}>
                          <button onClick={() => adjustCount(task.id, -5)} disabled={count <= 5}
                            className="flex h-7 w-7 items-center justify-center transition-colors"
                            style={{ background: "#fafafa", color: count <= 5 ? "#ddd" : "#555" }}>
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="flex h-7 w-9 items-center justify-center text-xs font-semibold"
                            style={{ fontFamily: "var(--font-mono)", color: "#111", background: "#fff", borderLeft: "1px solid #eee", borderRight: "1px solid #eee" }}>
                            {count}
                          </span>
                          <button onClick={() => adjustCount(task.id, 5)} disabled={count >= 50}
                            className="flex h-7 w-7 items-center justify-center transition-colors"
                            style={{ background: "#fafafa", color: count >= 50 ? "#ddd" : "#555" }}>
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {!isCompleted && (
                    <button onClick={() => handleStartTask(task)} disabled={isStarting}
                      className="shrink-0 rounded-lg text-xs font-semibold flex items-center gap-1 mt-1"
                      style={{ padding: "0.5rem 0.875rem", background: "#111", color: "#fff" }}>
                      {isStarting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : (
                        <>Start <ChevronRight className="h-3.5 w-3.5" /></>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Streak stats */}
        {streak && streak.totalStudyDays > 0 && (
          <div className="mt-8 grid grid-cols-3 gap-3">
            {[
              { value: streak.currentStreak, label: "Current Streak" },
              { value: streak.longestStreak, label: "Best Streak" },
              { value: streak.totalStudyDays, label: "Total Days" },
            ].map(({ value, label }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{value}</p>
                <p className="text-[0.625rem]" style={{ color: "#999" }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <Logo size="small" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: "#bbb" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "#999" }}>Privacy Policy</a>
            <span>-</span>
            <a href="/terms" className="hover:underline" style={{ color: "#999" }}>Terms</a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "#bbb" }}>
            &copy; {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}