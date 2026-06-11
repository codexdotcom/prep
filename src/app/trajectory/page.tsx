"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, Zap, ChevronRight, Loader2, TrendingUp, BookOpen, CheckCircle2 } from "lucide-react";

interface TrajectoryData {
  currentScore: number;
  targetScore: number;
  gap: number;
  weeksNeeded: number;
  studyHoursPerDay: number;
  subjectBreakdown: Array<{ subject: string; accuracy: number; score: number; gap: number; weakTopics: string[] }>;
  milestones: Array<{ week: number; expectedScore: number; focus: string; tasks: string[] }>;
}

export default function TrajectoryPage() {
  const router = useRouter();
  const [target, setTarget] = useState(300);
  const [data, setData] = useState<TrajectoryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "result">("select");

  const formatSubject = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/trajectory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetScore: target }),
      });
      const d = await res.json();
      if (res.ok) { setData(d); setStep("result"); }
    } catch {} finally { setLoading(false); }
  };

  const getColor = (score: number) => {
    if (score >= 280) return "var(--color-accent-green)";
    if (score >= 220) return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => step === "result" ? setStep("select") : router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Road to {target}+</span>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {step === "select" && (
          <div className="text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(34,197,94,0.1)" }}>
              <Target className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
            </div>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
              Set Your Target
            </h1>
            <p className="text-sm mt-2 mb-8" style={{ color: "var(--color-text-tertiary)" }}>
              Choose the JAMB score you want to hit. We will build your personalized roadmap.
            </p>

            <div className="grid grid-cols-3 gap-3 mb-6">
              {[250, 280, 300, 320, 350, 370].map((s) => (
                <button
                  key={s}
                  onClick={() => setTarget(s)}
                  className="rounded-xl p-4 text-center transition-all"
                  style={{
                    background: target === s ? "rgba(34,197,94,0.08)" : "var(--color-surface-card)",
                    border: `1.5px solid ${target === s ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                  }}
                >
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: target === s ? "var(--color-accent-green)" : "var(--color-text-primary)" }}>
                    {s}
                  </p>
                  <p className="text-[0.5625rem] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    {s >= 350 ? "Elite" : s >= 300 ? "Competitive" : s >= 250 ? "Solid" : "Foundation"}
                  </p>
                </button>
              ))}
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full" style={{ padding: "0.875rem" }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Generate My Roadmap
            </button>
          </div>
        )}

        {step === "result" && data && (
          <>
            {/* Score trajectory */}
            <div className="card p-5 mb-5 text-center">
              <div className="flex items-end justify-center gap-6 mb-4">
                <div>
                  <p className="text-[0.625rem] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Now</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: getColor(data.currentScore) }}>{data.currentScore}</p>
                </div>
                <TrendingUp className="h-6 w-6 mb-2" style={{ color: "var(--color-accent-green)" }} />
                <div>
                  <p className="text-[0.625rem] uppercase tracking-wider" style={{ color: "var(--color-text-muted)" }}>Target</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color: "var(--color-accent-green)" }}>{data.targetScore}</p>
                </div>
              </div>

              <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                {data.gap > 0
                  ? `${data.gap} points to close in ~${data.weeksNeeded} weeks at ${data.studyHoursPerDay}hrs/day`
                  : "You are already at or above your target"}
              </p>
            </div>

            {/* Subject breakdown */}
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Subject Gaps</p>
            <div className="space-y-2 mb-6">
              {data.subjectBreakdown.sort((a, b) => b.gap - a.gap).map((subj) => (
                <div key={subj.subject} className="card p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{formatSubject(subj.subject)}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{subj.accuracy}%</span>
                      {subj.gap > 0 && <span className="text-xs font-bold" style={{ color: "var(--color-danger-400)" }}>-{subj.gap}</span>}
                    </div>
                  </div>
                  <div style={{ height: "3px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                    <div style={{ width: `${subj.accuracy}%`, height: "100%", borderRadius: "9999px", background: subj.gap > 10 ? "var(--color-danger-400)" : subj.gap > 0 ? "var(--color-warning-400)" : "var(--color-accent-green)" }} />
                  </div>
                  {subj.weakTopics.length > 0 && (
                    <p className="text-[0.5625rem] mt-1.5" style={{ color: "var(--color-text-muted)" }}>
                      Weak: {subj.weakTopics.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Weekly milestones */}
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Weekly Milestones</p>
            <div className="space-y-2 mb-6">
              {data.milestones.map((m) => (
                <div key={m.week} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold"
                        style={{ fontFamily: "var(--font-mono)", background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}>
                        W{m.week}
                      </span>
                      <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                        {formatSubject(m.focus)} Focus
                      </span>
                    </div>
                    <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getColor(m.expectedScore) }}>
                      {m.expectedScore}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {m.tasks.map((task, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0" style={{ color: "var(--color-surface-border)" }} />
                        <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{task}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <button onClick={() => router.push("/study")} className="btn-primary w-full">
              <BookOpen className="h-4 w-4" /> Start Week 1
            </button>
          </>
        )}
      </div>
    </div>
  );
}