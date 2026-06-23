"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Brain, Target, Clock, AlertTriangle, TrendingUp,
  BarChart3, Zap, CheckCircle2, Loader2, ChevronDown, Gauge,
  BookOpen, Flame, ArrowUpRight,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { RecommendationCards } from "@/components/analytics/recommendation-cards";
import { SubjectCards } from "@/components/analytics/subject-cards";
import { TopicHeatmap } from "@/components/analytics/topic-heatmap";
import { ScoreTrendChart } from "@/components/analytics/score-trend-chart";
import { DifficultyBreakdown } from "@/components/analytics/difficulty-breakdown";

const scoreColor = (s: number) => (s >= 280 ? "#16a34a" : s >= 220 ? "#d97706" : "#dc2626");
const accColor = (a: number) => (a >= 70 ? "#16a34a" : a >= 50 ? "#d97706" : "#dc2626");

function readiness(score: number, target: number) {
  const gap = Math.max(target - score, 0);
  if (score >= 300)
    return {
      tag: "Elite range",
      title: `${score} puts you ahead of most candidates in the country.`,
      body: `300+ is not luck. It is proof you belong in the room. Hold this line and close the last ${gap} points with focused reps on the weak topics below.`,
    };
  if (score >= 250)
    return {
      tag: "On the doorstep",
      title: `You are ${gap} points from ${target}.`,
      body: `That gap is smaller than it looks. ${gap} points is a handful of questions per subject. Fix the red topics below and you walk into the hall knowing your range.`,
    };
  if (score >= 200)
    return {
      tag: "Climbing",
      title: `${score} today. ${target} is in reach.`,
      body: `You have momentum. The fastest ${gap} points are sitting in your weakest two topics, not spread across everything. Target them first.`,
    };
  return {
    tag: "Start here",
    title: `${score} is your starting line, not your ceiling.`,
    body: `Students who fix their weakest topics first move fastest. You have ${gap} points to close, and the map below shows exactly where they are.`,
  };
}

function SectionHead({ icon: Icon, title }: { icon: typeof Brain; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <Icon className="h-4 w-4" style={{ color: "#555" }} />
      <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>{title}</h2>
    </div>
  );
}

function Collapsible({
  icon: Icon, title, defaultOpen = true, children,
}: { icon: typeof Brain; title: string; defaultOpen?: boolean; children: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: "#fff", border: "1px solid #eee" }}>
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-5 py-4 text-left">
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: "#555" }} />
          <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>{title}</span>
        </span>
        <ChevronDown className="h-4 w-4 transition-transform" style={{ color: "#999", transform: open ? "rotate(180deg)" : "rotate(0deg)" }} />
      </button>
      {open && <div className="px-5 pb-5 pt-1">{children}</div>}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: typeof Brain; label: string; value: string | number; sub?: string; color: string }) {
  return (
    <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg mb-3" style={{ background: "#f5f5f5" }}>
        <Icon className="h-4 w-4" style={{ color: "#555" }} />
      </div>
      <p style={{ fontFamily: "var(--font-mono)", fontSize: "1.375rem", color: "#111", lineHeight: 1 }}>{value}</p>
      <p className="text-xs mt-1.5" style={{ color: "#555" }}>{label}</p>
      {sub && <p className="text-[0.625rem] mt-0.5" style={{ color: "#999" }}>{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data, recommendations, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="text-center">
          <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: "#555" }} />
          <p className="text-sm" style={{ color: "#555" }}>Crunching your numbers...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#fafafa" }}>
        <div className="rounded-2xl p-8 max-w-md text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
          <p className="mb-4 text-sm" style={{ color: "#dc2626" }}>{error || "Could not load analytics"}</p>
          <button onClick={() => router.push("/dashboard")} className="rounded-full px-5 py-2.5 text-sm font-medium text-white" style={{ background: "#111" }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data.hasData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#fafafa" }}>
        <div className="rounded-2xl p-8 max-w-md text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
            <Brain className="h-7 w-7" style={{ color: "#333" }} />
          </div>
          <h2 className="mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#111" }}>
            Your numbers are one test away
          </h2>
          <p className="mb-6 text-sm" style={{ color: "#777" }}>
            Take one test and we map your predicted score, your weakest topics, and the exact points you are leaving on the table.
          </p>
          <button onClick={() => router.push("/practice")} className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium text-white" style={{ background: "#111" }}>
            <Zap className="h-4 w-4" /> Take a Test
          </button>
        </div>
      </div>
    );
  }

  const { overview } = data;
  const verdict = readiness(overview.predictedJambScore, overview.targetScore);
  const gap = Math.max(overview.targetScore - overview.predictedJambScore, 0);
  const pctToTarget = Math.min((overview.predictedJambScore / overview.targetScore) * 100, 100);
  const avgSecs = overview.avgTimePerQuestion ? (overview.avgTimePerQuestion / 1000).toFixed(1) : "0";

  return (
    <div className="min-h-screen pb-16" style={{ background: "#fafafa" }}>
      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" style={{ color: "#555" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Analytics</span>
          </div>
          <button onClick={() => router.push("/practice")} className="rounded-full px-4 py-1.5 text-xs font-medium text-white" style={{ background: "#111" }}>
            Practice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6 space-y-6">
        {/* Readiness hero */}
        <div className="rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center gap-6" style={{ background: "#fff", border: "1px solid #eee" }}>
          {(() => {
            const size = 132; const r = (size - 14) / 2; const circ = 2 * Math.PI * r;
            const pct = Math.min((overview.predictedJambScore / 400) * 100, 100);
            const offset = circ - (pct / 100) * circ;
            const color = scoreColor(overview.predictedJambScore);
            return (
              <div className="relative shrink-0">
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f1f1" strokeWidth="7" />
                  <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
                    strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition: "stroke-dashoffset 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span style={{ fontFamily: "var(--font-display)", fontSize: "2.25rem", color, lineHeight: 1 }}>{overview.predictedJambScore}</span>
                  <span className="text-[0.625rem] mt-0.5" style={{ color: "#999" }}>predicted / 400</span>
                </div>
              </div>
            );
          })()}

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <span className="inline-block rounded-full px-3 py-1 text-[0.625rem] font-semibold mb-2" style={{ background: "#f5f5f5", color: "#333" }}>
              {verdict.tag}
            </span>
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#111", lineHeight: 1.3 }}>{verdict.title}</h1>
            <p className="mt-2 text-sm" style={{ color: "#555", lineHeight: 1.6 }}>{verdict.body}</p>
            <div className="mt-4">
              <div className="flex justify-between text-[0.6875rem] mb-1">
                <span style={{ color: "#999" }}>Target {overview.targetScore}</span>
                <span style={{ color: "#555" }}>
                  {gap > 0 ? `${gap} points to go` : "On track"}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 9999, background: "#f1f1f1" }}>
                <div style={{ width: `${pctToTarget}%`, height: "100%", borderRadius: 9999, background: scoreColor(overview.predictedJambScore), transition: "width 1s" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard icon={CheckCircle2} label="Accuracy" value={`${overview.overallAccuracy}%`} color="#555" sub="across all answers" />
          <StatCard icon={BarChart3} label="Tests taken" value={overview.totalTestsTaken} color="#555" sub="more tests, sharper prediction" />
          <StatCard icon={BookOpen} label="Questions done" value={overview.totalQuestionsAttempted} color="#555" sub="reps in the bank" />
          <StatCard icon={AlertTriangle} label="Careless errors" value={`${overview.carelessErrorRate}%`} color="#555" sub="points you already knew" />
        </div>

        {/* Your numbers, decoded */}
        <div>
          <SectionHead icon={Zap} title="Your numbers, decoded" />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Distance to target</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>
                {gap > 0 ? `${gap} points` : "Target hit"}
              </p>
              <p className="text-xs mt-1" style={{ color: "#555", lineHeight: 1.5 }}>
                {gap > 0
                  ? `Roughly ${Math.ceil(gap / 4)} more correct answers per subject. Smaller than it feels.`
                  : "You are at your target. Now defend it with consistency."}
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Free points on the table</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>
                {overview.carelessErrorRate}%
              </p>
              <p className="text-xs mt-1" style={{ color: "#555", lineHeight: 1.5 }}>
                That share of your wrong answers were careless, questions you already knew. Slow down and this is the cheapest score you will ever buy.
              </p>
            </div>

            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Pace per question</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{avgSecs}s</p>
              <p className="text-xs mt-1" style={{ color: "#555", lineHeight: 1.5 }}>
                {overview.speedRating ? `${overview.speedRating}. ` : ""}JAMB gives you about 36s per question. Stay inside it and you finish every paper.
              </p>
            </div>

            {overview.bestStudyTime && (
              <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Your sharpest hours</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{overview.bestStudyTime}</p>
                <p className="text-xs mt-1" style={{ color: "#555", lineHeight: 1.5 }}>
                  You answer best then. Put your hardest topics in that window, not your easy revision.
                </p>
              </div>
            )}

            {overview.riskLevel && (
              <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Readiness risk</p>
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111", textTransform: "capitalize" }}>{overview.riskLevel}</p>
                <p className="text-xs mt-1" style={{ color: "#555", lineHeight: 1.5 }}>
                  Based on your gap, consistency, and time left. The plan below lowers this fastest.
                </p>
              </div>
            )}

            <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-[0.625rem] font-semibold uppercase tracking-wider mb-2" style={{ color: "#999" }}>Consistency</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{overview.totalTestsTaken} tests</p>
              <p className="text-xs mt-1" style={{ color: "#555", lineHeight: 1.5 }}>
                Students who take one mock a week gain the most. Your next test sharpens every number on this page.
              </p>
            </div>
          </div>
        </div>

        {/* What to do next */}
        {recommendations.length > 0 && (
          <div>
            <SectionHead icon={Zap} title="What to do next" />
            <RecommendationCards recommendations={recommendations} />
          </div>
        )}

        {/* Subject performance */}
        <div>
          <SectionHead icon={Target} title="Subject performance" />
          <SubjectCards subjects={data.subjectStats} />
        </div>

        {/* Topic breakdown */}
        <Collapsible icon={BarChart3} title="Topic breakdown" defaultOpen>
          <TopicHeatmap topics={data.topicStats} />
        </Collapsible>

        {/* Trend + difficulty */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <SectionHead icon={TrendingUp} title="Score trend" />
            <ScoreTrendChart data={data.scoreTrend} />
          </div>
          <div>
            <SectionHead icon={Gauge} title="By difficulty" />
            <DifficultyBreakdown data={data.difficultyBreakdown} />
          </div>
        </div>

        {/* Speed analysis */}
        <div>
          <SectionHead icon={Clock} title="Speed analysis" />
          <div className="rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-3 gap-4" style={{ background: "#fff", border: "1px solid #eee" }}>
            <div>
              <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ color: "#999" }}>Avg per question</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{avgSecs}s</p>
            </div>
            <div className="sm:border-l sm:pl-4" style={{ borderColor: "#f0f0f0" }}>
              <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ color: "#999" }}>Speed rating</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111", textTransform: "capitalize" }}>{overview.speedRating || "n/a"}</p>
            </div>
            <div className="sm:border-l sm:pl-4" style={{ borderColor: "#f0f0f0" }}>
              <p className="text-[0.625rem] uppercase tracking-wider mb-1" style={{ color: "#999" }}>Best study time</p>
              <p style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>{overview.bestStudyTime || "n/a"}</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <button onClick={() => router.push("/practice")} className="w-full rounded-2xl p-5 flex items-center gap-4 text-left" style={{ background: "#111" }}>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Flame className="h-5 w-5" style={{ color: "#fff" }} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: "#fff" }}>Turn these numbers into points</p>
            <p className="text-[0.6875rem] mt-0.5" style={{ color: "#888" }}>One focused session on your red topics moves the prediction more than an hour of random practice.</p>
          </div>
          <ArrowUpRight className="h-5 w-5 shrink-0" style={{ color: "#888" }} />
        </button>

        {/* Footer */}
        <footer className="mt-8 pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <div className="flex items-center justify-center gap-0.5 mb-3">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs" style={{ color: "#999" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "#777" }}>Privacy</a>
            <span>-</span>
            <a href="/terms" className="hover:underline" style={{ color: "#777" }}>Terms</a>
          </div>
        </footer>
      </div>
    </div>
  );
}