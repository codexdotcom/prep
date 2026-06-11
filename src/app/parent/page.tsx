"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, BarChart3, Target, Flame, BookOpen, TrendingUp, AlertTriangle } from "lucide-react";

interface ParentData {
  student: { firstName: string; lastName: string; examYear: number; targetScore: number; subjects: string[] };
  stats: { predictedScore: number; accuracy: number; totalQuestions: number; totalTests: number; level: number; totalXP: number; currentStreak: number; longestStreak: number };
  subjectBreakdown: Array<{ subject: string; accuracy: number; questionsAnswered: number }>;
  recentActivity: { testsThisWeek: number; questionsThisWeek: number; isActive: boolean };
}

function ParentContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  const [data, setData] = useState<ParentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!code) { setError("No access code provided"); setLoading(false); return; }
    async function load() {
      try {
        const res = await fetch(`/api/parent/dashboard?code=${code}`);
        const d = await res.json();
        if (!res.ok) { setError(d.error); return; }
        setData(d);
      } catch { setError("Failed to load"); }
      finally { setLoading(false); }
    }
    load();
  }, [code]);

  const formatSubject = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const getColor = (acc: number) => acc >= 70 ? "var(--color-accent-green)" : acc >= 50 ? "var(--color-warning-400)" : "var(--color-danger-400)";

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>;
  if (error) return <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}><div className="card p-8 text-center max-w-sm"><AlertTriangle className="mx-auto mb-3 h-8 w-8" style={{ color: "var(--color-danger-400)" }} /><p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{error}</p></div></div>;
  if (!data) return null;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-center px-4">
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--color-text-primary)" }}>
            Prep<span style={{ color: "var(--color-accent-green)" }}>Genius</span> — Parent View
          </span>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
          {data.student.firstName}&apos;s Progress
        </h1>
        <p className="text-sm mt-1 mb-6" style={{ color: "var(--color-text-tertiary)" }}>
          JAMB {data.student.examYear} | Target: {data.student.targetScore}
        </p>

        {/* Activity alert */}
        {!data.recentActivity.isActive && (
          <div className="rounded-xl p-4 mb-5" style={{ background: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.15)" }}>
            <p className="text-sm" style={{ color: "var(--color-danger-400)" }}>
              {data.student.firstName} has not practiced this week. Consistent study is key to improvement.
            </p>
          </div>
        )}

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          {[
            { icon: Target, label: "Predicted Score", value: `${data.stats.predictedScore}/400`, color: getColor(data.stats.accuracy) },
            { icon: BarChart3, label: "Accuracy", value: `${data.stats.accuracy}%`, color: getColor(data.stats.accuracy) },
            { icon: Flame, label: "Study Streak", value: `${data.stats.currentStreak} days`, color: "var(--color-warning-400)" },
            { icon: BookOpen, label: "This Week", value: `${data.recentActivity.questionsThisWeek} questions`, color: "var(--color-info-400)" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="card p-3.5 text-center">
              <Icon className="mx-auto mb-1.5 h-4 w-4" style={{ color }} />
              <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color }}>{value}</p>
              <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
            </div>
          ))}
        </div>

        {/* Subject breakdown */}
        <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Subject Performance</p>
        <div className="space-y-2 mb-6">
          {data.subjectBreakdown.sort((a, b) => a.accuracy - b.accuracy).map((subj) => (
            <div key={subj.subject} className="card p-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>{formatSubject(subj.subject)}</p>
                <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getColor(subj.accuracy) }}>{subj.accuracy}%</span>
              </div>
              <div style={{ height: "3px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                <div style={{ width: `${subj.accuracy}%`, height: "100%", borderRadius: "9999px", background: getColor(subj.accuracy) }} />
              </div>
              <p className="text-[0.5rem] mt-1" style={{ color: "var(--color-text-muted)" }}>{subj.questionsAnswered} questions answered</p>
            </div>
          ))}
        </div>

        <footer className="pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
            PrepGenius Parent Dashboard | Updated in real-time
          </p>
        </footer>
      </div>
    </div>
  );
}

export default function ParentPage() {
  return <Suspense fallback={<div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>}><ParentContent /></Suspense>;
}