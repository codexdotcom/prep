"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Zap, TrendingUp, RotateCcw, Loader2 } from "lucide-react";

interface SimResult {
  subjects: Array<{
    subject: string;
    currentAccuracy: number;
    adjustedAccuracy: number;
    currentScore: number;
    adjustedScore: number;
    improvement: number;
  }>;
  currentPredicted: number;
  adjustedPredicted: number;
  totalImprovement: number;
  targetScore: number;
}

export default function SimulatorPage() {
  const router = useRouter();
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [result, setResult] = useState<SimResult | null>(null);
  const [loading, setLoading] = useState(true);

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  // Load initial (no adjustments)
  useEffect(() => {
    simulate({});
  }, []);

  const simulate = async (adj: Record<string, number>) => {
    setLoading(true);
    try {
      const res = await fetch("/api/simulator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adjustments: adj }),
      });
      const data = await res.json();
      if (res.ok) setResult(data);
    } catch {} finally { setLoading(false); }
  };

  const updateAdjustment = (subject: string, value: number) => {
    const newAdj = { ...adjustments, [subject]: value };
    setAdjustments(newAdj);
    simulate(newAdj);
  };

  const reset = () => {
    setAdjustments({});
    simulate({});
  };

  const getColor = (score: number, target: number) => {
    if (score >= target) return "var(--color-accent-green)";
    if (score >= target * 0.8) return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Score Simulator</span>
          <button onClick={reset} className="btn-ghost" title="Reset"><RotateCcw className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="text-center mb-6">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
            What If?
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            Drag the sliders to see how improving each subject affects your predicted score
          </p>
        </div>

        {loading && !result ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
          </div>
        ) : result && (
          <>
            {/* Score comparison */}
            <div className="card mb-6 p-5">
              <div className="flex items-end justify-center gap-8">
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Current</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1, color: "var(--color-text-tertiary)" }}>
                    {result.currentPredicted}
                  </p>
                </div>
                <div className="text-center pb-1">
                  <TrendingUp className="mx-auto mb-1 h-5 w-5" style={{ color: result.totalImprovement > 0 ? "var(--color-accent-green)" : "var(--color-text-muted)" }} />
                  {result.totalImprovement > 0 && (
                    <p className="text-sm font-bold" style={{ color: "var(--color-accent-green)" }}>+{result.totalImprovement}</p>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs mb-1" style={{ color: "var(--color-text-muted)" }}>Projected</p>
                  <p style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", lineHeight: 1, color: getColor(result.adjustedPredicted, result.targetScore) }}>
                    {result.adjustedPredicted}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-[0.625rem] mb-1">
                  <span style={{ color: "var(--color-text-muted)" }}>Target: {result.targetScore}</span>
                  <span style={{ color: getColor(result.adjustedPredicted, result.targetScore) }}>
                    {result.adjustedPredicted >= result.targetScore
                      ? "Target reached"
                      : `${result.targetScore - result.adjustedPredicted} points to go`}
                  </span>
                </div>
                <div style={{ height: "4px", borderRadius: "9999px", background: "var(--color-surface-lighter)" }}>
                  <div style={{ width: `${Math.min((result.adjustedPredicted / 400) * 100, 100)}%`, height: "100%", borderRadius: "9999px", background: getColor(result.adjustedPredicted, result.targetScore), transition: "width 0.5s ease" }} />
                </div>
              </div>
            </div>

            {/* Subject sliders */}
            <div className="space-y-4">
              {result.subjects.map((subj) => (
                <div key={subj.subject} className="card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {formatSubject(subj.subject)}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                        {subj.currentAccuracy}%
                      </span>
                      {(adjustments[subj.subject] || 0) > 0 && (
                        <>
                          <span style={{ color: "var(--color-accent-green)" }}>→</span>
                          <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
                            {subj.adjustedAccuracy}%
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <input
                    type="range"
                    min={0}
                    max={Math.min(50, 100 - subj.currentAccuracy)}
                    value={adjustments[subj.subject] || 0}
                    onChange={(e) => updateAdjustment(subj.subject, parseInt(e.target.value))}
                    className="w-full accent-green-500"
                    style={{ height: "4px" }}
                  />

                  <div className="flex justify-between mt-1">
                    <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>No change</span>
                    <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                      +{adjustments[subj.subject] || 0}% improvement
                    </span>
                  </div>

                  {(adjustments[subj.subject] || 0) > 0 && (
                    <p className="text-xs mt-2" style={{ color: "var(--color-accent-green)" }}>
                      +{subj.improvement} points from this subject
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="mt-6 flex flex-col gap-2">
              <button onClick={() => router.push("/practice")} className="btn-primary w-full">
                <Zap className="h-4 w-4" /> Start Practicing
              </button>
              <button onClick={() => router.push("/study")} className="btn-secondary w-full">
                View Study Plan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}