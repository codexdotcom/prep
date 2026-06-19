"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Brain, AlertTriangle, TrendingUp, Flame, Target, Zap,
  ChevronRight, RotateCcw, BookOpen, Clock,
} from "lucide-react";

interface Insight {
  type: string;
  title: string;
  body: string;
  topics?: any[];
}

interface SubjectSummary {
  subject: string;
  ability: number;
  topicCount: number;
  weakCount: number;
  strongCount: number;
}

interface InsightsData {
  hasData: boolean;
  predictedScore: number;
  insights: Insight[];
  subjectSummary: SubjectSummary[];
  totalTopicsTracked: number;
  topicsNeedingWork: number;
  topicsMastered: number;
  topicsDueReview: number;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const accColor = (a: number) => a >= 70 ? "#22c55e" : a >= 50 ? "#f59e0b" : "#ef4444";

export function AdaptiveInsights() {
  const router = useRouter();
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/insights")
      .then((r) => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data?.hasData) return null;

  const hasWeakness = data.insights.find((i) => i.type === "weakness");
  const hasFading = data.insights.find((i) => i.type === "fading");
  const hasReview = data.insights.find((i) => i.type === "review");

  return (
    <div className="space-y-3">
      {/* AI Knowledge Map */}
      <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            <p className="text-sm font-bold" style={{ color: "#111" }}>Your Knowledge Map</p>
          </div>
          <span className="text-xs" style={{ color: "#aaa" }}>{data.totalTopicsTracked} topics tracked</span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#22c55e" }}>{data.topicsMastered}</p>
            <p className="text-[0.6875rem]" style={{ color: "#888" }}>Mastered</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}>{data.topicsNeedingWork}</p>
            <p className="text-[0.6875rem]" style={{ color: "#888" }}>Need work</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#f59e0b" }}>{data.topicsDueReview}</p>
            <p className="text-[0.6875rem]" style={{ color: "#888" }}>Due review</p>
          </div>
        </div>

        {/* Subject bars */}
        {data.subjectSummary.length > 0 && (
          <div className="space-y-2">
            {data.subjectSummary.map((s) => (
              <div key={s.subject}>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold" style={{ color: "#333" }}>{fmt(s.subject)}</p>
                  <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: accColor(s.ability) }}>{s.ability}%</span>
                </div>
                <div style={{ height: "5px", borderRadius: "9999px", background: "#f3f3f3" }}>
                  <div style={{ width: `${s.ability}%`, height: "100%", borderRadius: "9999px", background: accColor(s.ability), transition: "width 0.5s" }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action cards */}
      {hasWeakness && (
        <button onClick={() => router.push("/practice/weak")} className="w-full rounded-2xl p-4 text-left transition-all"
          style={{ background: "#fff", border: "1px solid #eee" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#fca5a5"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#fef2f2" }}>
              <AlertTriangle className="h-4 w-4" style={{ color: "#ef4444" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>{hasWeakness.title}</p>
              <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#777" }}>{hasWeakness.body}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 mt-1" style={{ color: "#ddd" }} />
          </div>
        </button>
      )}

      {hasFading && (
        <button onClick={() => router.push("/practice/drill")} className="w-full rounded-2xl p-4 text-left transition-all"
          style={{ background: "#fff", border: "1px solid #eee" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#fde68a"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#fffbeb" }}>
              <Clock className="h-4 w-4" style={{ color: "#f59e0b" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>{hasFading.title}</p>
              <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#777" }}>{hasFading.body}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 mt-1" style={{ color: "#ddd" }} />
          </div>
        </button>
      )}

      {hasReview && (
        <button onClick={() => router.push("/practice/drill")} className="w-full rounded-2xl p-4 text-left transition-all"
          style={{ background: "#fff", border: "1px solid #eee" }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bfdbfe"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{ background: "#eff6ff" }}>
              <RotateCcw className="h-4 w-4" style={{ color: "#3b82f6" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>{hasReview.title}</p>
              <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#777" }}>{hasReview.body}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 mt-1" style={{ color: "#ddd" }} />
          </div>
        </button>
      )}
    </div>
  );
}