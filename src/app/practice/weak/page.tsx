"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Brain, Loader2, Target, Flame, BookOpen,
} from "lucide-react";

interface WeakTopic {
  subject: string;
  topicId: string;
  topicName: string;
  accuracy: number;
  ability?: number;
  totalAttempted: number;
  totalCorrect: number;
  questionsAvailable: number;
  daysSinceLastPractice?: number;
  needsReview?: boolean;
}

const COUNTS = [10, 20, 40];
const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const accColor = (a: number) => a >= 70 ? "#22c55e" : a >= 50 ? "#f59e0b" : "#ef4444";

export default function WeakAreasPage() {
  const router = useRouter();
  const [weakTopics, setWeakTopics] = useState<WeakTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [count, setCount] = useState(20);
  const [starting, setStarting] = useState(false);
  const [hasData, setHasData] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/analytics/weak-topics")
      .then((r) => r.json())
      .then((data) => {
        if (data.weakTopics && data.weakTopics.length > 0) {
          setWeakTopics(data.weakTopics);
          // Auto-select the top 5 worst topics
          const top5 = data.weakTopics.slice(0, 5).map((t: WeakTopic) => t.topicId);
          setSelectedTopics(new Set(top5));
        } else {
          setHasData(false);
        }
      })
      .catch(() => setHasData(false))
      .finally(() => setLoading(false));
  }, []);

  const toggle = (id: string) => {
    setSelectedTopics((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = async () => {
    if (selectedTopics.size === 0) return;
    setStarting(true);
    try {
      const topicIds = Array.from(selectedTopics);
      // Get primary subject from selected topics
      const selectedData = weakTopics.filter((t) => selectedTopics.has(t.topicId));
      const primarySubject = selectedData[0]?.subject || weakTopics[0]?.subject;

      const res = await fetch("/api/tests/drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: primarySubject, topicIds, questionCount: count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem(`test-${data.sessionId}`, JSON.stringify(data));
      router.push(`/test/${data.sessionId}`);
    } catch (err: any) {
      alert(err.message || "Failed to start");
      setStarting(false);
    }
  };

  // Group selected by subject for the summary
  const selectedBySubject: Record<string, WeakTopic[]> = {};
  for (const t of weakTopics.filter((t) => selectedTopics.has(t.topicId))) {
    if (!selectedBySubject[t.subject]) selectedBySubject[t.subject] = [];
    selectedBySubject[t.subject].push(t);
  }

  const totalAvailable = weakTopics
    .filter((t) => selectedTopics.has(t.topicId))
    .reduce((sum, t) => sum + t.questionsAvailable, 0);

  // Estimate JAMB points recoverable
  const pointsRecoverable = weakTopics
    .filter((t) => selectedTopics.has(t.topicId))
    .reduce((sum, t) => {
      const gap = 70 - (t.ability || t.accuracy);
      return sum + (gap > 0 ? Math.round(gap * 0.25) : 0);
    }, 0);

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button onClick={() => router.push("/practice")} className="flex items-center gap-1.5 text-sm" style={{ color: "#666" }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-semibold" style={{ color: "#111" }}>Weak Areas</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-24">
        {loading ? (
          <div className="flex flex-col items-center py-20">
            <Loader2 className="h-6 w-6 animate-spin mb-3" style={{ color: "#ef4444" }} />
            <p className="text-sm" style={{ color: "#555" }}>Analyzing your performance...</p>
          </div>
        ) : !hasData ? (
          /* ─── No data state ─── */
          <div className="pt-8">
            <div className="rounded-2xl p-8 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
              <Brain className="mx-auto mb-4 h-10 w-10" style={{ color: "#ddd" }} />
              <p className="text-base font-bold mb-2" style={{ color: "#111" }}>We need your answers first</p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#666" }}>
                Take at least one practice session or mock exam. The AI needs real data to find your weak spots. The more you practice, the more accurate the analysis becomes.
              </p>
              <button onClick={() => router.push("/practice/quick")}
                className="rounded-xl px-6 py-3 text-sm font-bold transition-colors" style={{ background: "#111", color: "#fff" }}>
                Start Practicing
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ─── Intro ─── */}
            <div className="mb-6">
              <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#111" }}>
                These topics are costing you points.
              </h1>
              <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
                We analyzed every answer you have given on JambOS. Below are the specific topics where your accuracy is lowest. Students who fix their bottom 3 topics see an average score jump of 25 to 40 points within one week.
              </p>
            </div>

            {/* ─── Topic list ─── */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#bbb" }}>
                  {weakTopics.length} weak topics found
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setSelectedTopics(new Set(weakTopics.map((t) => t.topicId)))}
                    className="text-xs font-semibold" style={{ color: "#ef4444" }}>
                    Select all
                  </button>
                  {selectedTopics.size > 0 && (
                    <button onClick={() => setSelectedTopics(new Set())}
                      className="text-xs font-semibold" style={{ color: "#bbb" }}>
                      Clear
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                {weakTopics.map((t, i) => {
                  const isSelected = selectedTopics.has(t.topicId);
                  const displayAcc = t.ability ?? t.accuracy;
                  return (
                    <button key={t.topicId} onClick={() => toggle(t.topicId)}
                      className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                      style={{ background: "#fff", border: `1.5px solid ${isSelected ? "#ef4444" : "#eee"}` }}>
                      {/* Checkbox */}
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md transition-colors"
                        style={{ background: isSelected ? "#ef4444" : "#f5f5f5", border: isSelected ? "none" : "1px solid #eee" }}>
                        {isSelected && (
                          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Topic info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: isSelected ? "#222" : "#333" }}>{t.topicName}</p>
                        <p className="text-xs" style={{ color: "#aaa" }}>
                          {fmt(t.subject)} · {t.totalAttempted} attempted · {t.questionsAvailable} available
                        </p>
                      </div>

                      {/* Accuracy + bar */}
                      <div className="shrink-0 w-16 text-right">
                        <p className="text-sm font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: accColor(displayAcc) }}>
                          {displayAcc}%
                        </p>
                        <div className="mt-1" style={{ height: "3px", borderRadius: "9999px", background: "#f0f0f0" }}>
                          <div style={{ width: `${displayAcc}%`, height: "100%", borderRadius: "9999px", background: accColor(displayAcc) }} />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ─── Impact block ─── */}
            {selectedTopics.size > 0 && (
              <div className="rounded-2xl p-5 mb-4" style={{ background: "#111", animation: "fadeSlideUp 0.25s ease" }}>
                <p className="text-sm font-bold mb-2" style={{ color: "#fff" }}>What fixing these topics means</p>
                <p className="text-sm leading-[1.7]" style={{ color: "#888" }}>
                  {selectedTopics.size === 1
                    ? `Bringing ${weakTopics.find((t) => selectedTopics.has(t.topicId))?.topicName} from ${weakTopics.find((t) => selectedTopics.has(t.topicId))?.accuracy}% to 70% accuracy could add 10 to 15 points to your JAMB score. That is one topic, one focused drill session, and a meaningful score difference.`
                    : pointsRecoverable > 0
                      ? `Fixing ${selectedTopics.size} topics could recover up to ${pointsRecoverable} JAMB points. That is the difference between getting into your second choice and getting your first. These are not random questions. These are the exact gaps the AI identified from your history.`
                      : `You have selected ${selectedTopics.size} topics to attack. The AI will prioritize questions from these topics and adapt difficulty as you go. Every session makes the next one smarter.`
                  }
                </p>
              </div>
            )}

            {/* ─── Count selector ─── */}
            {selectedTopics.size > 0 && (
              <div className="mb-4" style={{ animation: "fadeSlideUp 0.25s ease" }}>
                <p className="text-sm font-bold mb-3" style={{ color: "#222" }}>How many questions?</p>
                <div className="flex gap-2">
                  {COUNTS.map((c) => (
                    <button key={c} onClick={() => setCount(c)}
                      className="flex-1 rounded-xl py-3.5 text-center text-sm font-bold transition-colors"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: count === c ? "#111" : "#fff",
                        border: `1.5px solid ${count === c ? "#111" : "#eee"}`,
                        color: count === c ? "#fff" : "#bbb",
                      }}>
                      {c}
                    </button>
                  ))}
                </div>
                {totalAvailable > 0 && totalAvailable < count && (
                  <p className="text-sm mt-2" style={{ color: "#888" }}>
                    {totalAvailable} questions available across these topics. You will get all of them.
                  </p>
                )}
              </div>
            )}

            {/* ─── Summary + Start ─── */}
            {selectedTopics.size > 0 && (
              <div style={{ animation: "fadeSlideUp 0.25s ease" }}>
                {/* Quick summary */}
                <div className="rounded-xl p-3.5 mb-3" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold" style={{ color: "#222" }}>Ready to drill</p>
                      <p className="text-xs" style={{ color: "#888" }}>
                        {Math.min(count, totalAvailable || count)} questions · {selectedTopics.size} topic{selectedTopics.size > 1 ? "s" : ""} · Adaptive difficulty
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {Object.keys(selectedBySubject).map((subj) => (
                        <span key={subj} className="text-[0.625rem] font-semibold rounded-md px-1.5 py-0.5" style={{ background: "#fafafa", color: "#888" }}>
                          {fmt(subj).split(" ")[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={handleStart} disabled={starting}
                  className="w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                  style={{ background: "#ef4444", color: "#fff" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#dc2626"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#ef4444"; }}>
                  {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <><Target className="h-4 w-4" /> Attack {selectedTopics.size} Weak Topic{selectedTopics.size > 1 ? "s" : ""}</>
                  )}
                </button>

                <p className="text-center text-sm mt-3 leading-relaxed" style={{ color: "#aaa" }}>
                  The students who score 300+ do not study more. They study what matters. You are looking at exactly what matters for your score right now.
                </p>
              </div>
            )}

            {selectedTopics.size === 0 && (
              <p className="text-center text-sm py-4" style={{ color: "#ccc" }}>
                Select the topics you want to attack
              </p>
            )}
          </>
        )}
      </div>

      <style jsx global>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}