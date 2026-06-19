"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Target, CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  Flame, RotateCcw, Home, Eye, EyeOff, ChevronRight, Zap,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface TopicScore {
  topicId: string;
  topicName: string;
  correct: number;
  total: number;
  answered: number;
  accuracy: number;
  mastered: boolean;
  needsWork: boolean;
}

interface ReviewItem {
  id: string;
  topicName: string;
  body: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  selectedOption: string | null;
  isCorrect: boolean;
  explanation: string | null;
  explanationImageUrl: string | null;
  difficulty: string;
}

interface DrillResultsProps {
  accuracy: number;
  totalCorrect: number;
  totalAnswered: number;
  totalQuestions: number;
  topicBreakdown: TopicScore[];
  review: ReviewItem[];
  subject: string;
}

function renderText(text: string): string {
  if (!text) return "";
  let r = text;
  r = r.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => { try { return `<div style="margin:6px 0;text-align:center">${katex.renderToString(m.trim(), { displayMode: true, throwOnError: false })}</div>`; } catch { return m; } });
  r = r.replace(/\$(.+?)\$/g, (_, m) => { try { return katex.renderToString(m.trim(), { throwOnError: false }); } catch { return m; } });
  r = r.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  r = r.replace(/\*(.+?)\*/g, "<em>$1</em>");
  return r;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const accColor = (a: number) => a >= 80 ? "#22c55e" : a >= 60 ? "#f59e0b" : "#ef4444";

function getMessage(accuracy: number, mastered: number, needsWork: number, total: number): { title: string; body: string; cta: string } {
  if (accuracy >= 90) return {
    title: "You're crushing it.",
    body: `${mastered} out of ${total} topics mastered. This is what consistent practice looks like. The students who get into their first-choice university do exactly what you just did — drill until the topic is second nature.`,
    cta: "Drill another set",
  };
  if (accuracy >= 70) return {
    title: "Strong performance. Now go deeper.",
    body: `You nailed the basics, but ${needsWork > 0 ? `${needsWork} topic${needsWork > 1 ? "s" : ""} still need${needsWork === 1 ? "s" : ""} work` : "there's room to sharpen"}. The difference between 70% and 90% is usually just 2-3 more drill sessions on the same topics. That's 15 minutes of practice for 20+ extra JAMB points.`,
    cta: "Drill the weak ones again",
  };
  if (accuracy >= 50) return {
    title: "You know more than you think.",
    body: `Getting half right means you understand the concepts — you just need more reps. Students who drill the same topics 3 times in a week typically jump from 50% to 80%. That's not motivation talk, that's data from thousands of JambOS users.`,
    cta: "Run it back",
  };
  return {
    title: "This is where the comeback starts.",
    body: `Every 300+ scorer was once exactly where you are right now. The only difference? They didn't stop after one session. Drill these same topics again tomorrow. You'll be surprised how much sticks after sleeping on it.`,
    cta: "Try again right now",
  };
}

export function DrillResults({
  accuracy, totalCorrect, totalAnswered, totalQuestions, topicBreakdown, review, subject,
}: DrillResultsProps) {
  const router = useRouter();
  const [animatedAcc, setAnimatedAcc] = useState(0);
  const [showReview, setShowReview] = useState(false);
  const [reviewFilter, setReviewFilter] = useState<"all" | "wrong" | "correct" | "skipped">("all");

  const mastered = topicBreakdown.filter((t) => t.mastered).length;
  const needsWork = topicBreakdown.filter((t) => t.needsWork).length;
  const msg = getMessage(accuracy, mastered, needsWork, topicBreakdown.length);

  useEffect(() => {
    let v = 0;
    const step = accuracy / (1200 / 16);
    const t = setInterval(() => {
      v += step;
      if (v >= accuracy) { setAnimatedAcc(accuracy); clearInterval(t); }
      else setAnimatedAcc(Math.round(v));
    }, 16);
    return () => clearInterval(t);
  }, [accuracy]);

  // Ring
  const size = 100;
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (accuracy / 100) * circ;
  const color = accColor(accuracy);

  return (
    <div className="max-w-lg mx-auto">
      {/* Score */}
      <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
        <div className="relative inline-flex items-center justify-center mb-3">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f3f3" strokeWidth="5" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 1.2s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2rem", color, lineHeight: 1 }}>{animatedAcc}%</span>
          </div>
        </div>
        <p className="text-sm" style={{ color: "#555" }}>
          {totalCorrect} correct out of {totalQuestions} · {totalAnswered} attempted
        </p>
      </div>

      {/* Motivation */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#111" }}>
        <p className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#fff", lineHeight: 1.3 }}>{msg.title}</p>
        <p className="text-sm leading-relaxed" style={{ color: "#aaa" }}>{msg.body}</p>
      </div>

      {/* Topic breakdown */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
        <p className="text-sm font-bold mb-3" style={{ color: "#222" }}>Topic Breakdown</p>
        <div className="space-y-3">
          {topicBreakdown.map((t) => (
            <div key={t.topicId}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold" style={{ color: "#222" }}>{t.topicName}</p>
                  {t.mastered && <span className="text-[0.625rem] font-semibold rounded-md px-1.5 py-0.5" style={{ background: "#f0fdf4", color: "#22c55e" }}>Mastered</span>}
                  {t.needsWork && <span className="text-[0.625rem] font-semibold rounded-md px-1.5 py-0.5" style={{ background: "#fef2f2", color: "#ef4444" }}>Needs work</span>}
                </div>
                <span className="text-sm font-bold tabular-nums" style={{ fontFamily: "var(--font-mono)", color: accColor(t.accuracy) }}>
                  {t.correct}/{t.total}
                </span>
              </div>
              <div style={{ height: "5px", borderRadius: "9999px", background: "#f3f3f3" }}>
                <div style={{ width: `${(t.correct / Math.max(t.total, 1)) * 100}%`, height: "100%", borderRadius: "9999px", background: accColor(t.accuracy), transition: "width 0.8s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What to do next */}
      {needsWork > 0 && (
        <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <p className="text-sm font-bold" style={{ color: "#222" }}>Focus here next</p>
          </div>
          {topicBreakdown.filter((t) => t.needsWork).map((t) => (
            <p key={t.topicId} className="text-sm mb-1" style={{ color: "#666" }}>
              <strong style={{ color: "#222" }}>{t.topicName}</strong> — {t.accuracy}% accuracy. Drill this topic alone until you hit 80%.
            </p>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="space-y-2 mb-4">
        <button onClick={() => router.push("/practice/drill")}
          className="w-full rounded-2xl py-3.5 text-sm font-bold flex items-center justify-center gap-2"
          style={{ background: "#111", color: "#fff" }}>
          <Flame className="h-4 w-4" style={{ color: "#f59e0b" }} /> {msg.cta}
        </button>
        <div className="flex gap-2">
          <button onClick={() => setShowReview(!showReview)}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: "#fff", border: "1px solid #eee", color: "#444" }}>
            {showReview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showReview ? "Hide" : "Review"} Answers
          </button>
          <button onClick={() => router.push("/dashboard")}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: "#fff", border: "1px solid #eee", color: "#444" }}>
            <Home className="h-4 w-4" /> Dashboard
          </button>
        </div>
      </div>

     

      {/* Review */}
      {showReview && (
        <div>
          <div className="flex gap-1 mb-4 p-0.5 rounded-lg" style={{ background: "#f5f5f5" }}>
            {(["all", "wrong", "correct", "skipped"] as const).map((f) => {
              const counts = {
                all: totalQuestions,
                wrong: totalAnswered - totalCorrect,
                correct: totalCorrect,
                skipped: totalQuestions - totalAnswered,
              };
              return (
                <button key={f} onClick={() => setReviewFilter(f)}
                  className="flex-1 rounded-md py-2 text-xs font-semibold capitalize"
                  style={{ background: reviewFilter === f ? "#fff" : "transparent", color: reviewFilter === f ? "#111" : "#aaa", boxShadow: reviewFilter === f ? "0 1px 3px rgba(0,0,0,0.04)" : "none" }}>
                  {f} ({counts[f]})
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {review
              .filter((r) => reviewFilter === "all" || (reviewFilter === "correct" ? r.isCorrect : reviewFilter === "wrong" ? (r.selectedOption && !r.isCorrect) : !r.selectedOption))
              .map((r) => (
                <div key={r.id} className="rounded-xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
                  <div className="flex items-start gap-2 mb-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold mt-0.5"
                      style={{ background: r.isCorrect ? "#f0fdf4" : r.selectedOption ? "#fef2f2" : "#f9f9f9", color: r.isCorrect ? "#22c55e" : r.selectedOption ? "#ef4444" : "#ccc" }}>
                      {r.isCorrect ? "✓" : r.selectedOption ? "✗" : "—"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold mb-1" style={{ color: "#999" }}>{r.topicName}</p>
                      {r.imageUrl && (
                        <div className="rounded-lg overflow-hidden mb-2" style={{ border: "1px solid #eee" }}>
                          <img src={r.imageUrl} alt="" className="max-h-40 object-contain mx-auto p-2" />
                        </div>
                      )}
                      <div className="text-sm leading-relaxed" style={{ color: "#222" }} dangerouslySetInnerHTML={{ __html: renderText(r.body) }} />
                    </div>
                  </div>

                  <div className="space-y-1 ml-8">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const text = (r as any)[`option${key}`];
                      const isCorrect = r.correctOption === key;
                      const isSelected = r.selectedOption === key;
                      return (
                        <div key={key} className="flex items-center gap-2 text-sm py-1.5 px-2.5 rounded-lg"
                          style={{ background: isCorrect ? "#f0fdf4" : isSelected ? "#fef2f2" : "transparent" }}>
                          <span className="font-bold w-4" style={{ fontFamily: "var(--font-mono)", color: isCorrect ? "#22c55e" : isSelected ? "#ef4444" : "#ccc" }}>{key}</span>
                          <span className="flex-1" style={{ color: isCorrect ? "#166534" : "#444" }} dangerouslySetInnerHTML={{ __html: renderText(text) }} />
                          {isCorrect && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />}
                          {isSelected && !isCorrect && <XCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />}
                        </div>
                      );
                    })}
                  </div>

                  {r.explanation && (
                    <div className="mt-3 ml-8 rounded-lg p-3" style={{ background: "#fafafa", border: "1px solid #f3f3f3" }}>
                      <p className="text-xs font-semibold mb-1" style={{ color: "#888" }}>Explanation</p>
                      <div className="text-sm leading-relaxed" style={{ color: "#555" }} dangerouslySetInnerHTML={{ __html: renderText(r.explanation) }} />
                      {r.explanationImageUrl && <img src={r.explanationImageUrl} alt="" className="mt-2 rounded-lg max-h-40 object-contain" />}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}