"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Zap, Clock, Trophy, ChevronRight, ChevronLeft,
  Loader2, CheckCircle2, XCircle, Share2, Flame, Target,
  Timer, Award, TrendingUp, BarChart3, Home,
} from "lucide-react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface ChallengeQuestion {
  id: string;
  body: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  difficulty: string;
  topic: { name: string };
}

interface ChallengeData {
  challenge: {
    id: string;
    title: string;
    description: string;
    subject: string;
    topicName: string | null;
    timeLimit: number;
    xpReward: number;
    bonusXP: number;
    totalQuestions: number;
  };
  questions: ChallengeQuestion[];
  completed: boolean;
  myAttempt: {
    score: number;
    accuracy: number;
    timeTaken: number;
    rank: number;
    xpEarned: number;
  } | null;
  leaderboard: Array<{
    rank: number;
    name: string;
    image: string | null;
    score: number;
    accuracy: number;
    timeTaken: number;
    isCurrentUser: boolean;
  }>;
  totalAttempts: number;
}

interface SubmitResult {
  score: number;
  totalQuestions: number;
  accuracy: number;
  timeTaken: number;
  rank: number;
  xpEarned: number;
  correctAnswers: Record<string, string>;
  isPerfect: boolean;
  isTopTen: boolean;
}

function renderText(text: string): string {
  if (!text) return "";
  let r = text;
  r = r.replace(/\$\$([\s\S]+?)\$\$/g, (_, m) => {
    try { return `<span style="display:block;text-align:center;margin:6px 0">${katex.renderToString(m.trim(), { displayMode: true, throwOnError: false })}</span>`; }
    catch { return m; }
  });
  r = r.replace(/\$(.+?)\$/g, (_, m) => {
    try { return katex.renderToString(m.trim(), { throwOnError: false }); }
    catch { return m; }
  });
  r = r.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return r;
}

const fmtTime = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return m > 0 ? `${m}:${String(sec).padStart(2, "0")}` : `0:${String(sec).padStart(2, "0")}`;
};

const fmtSubject = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const RANK_DISPLAY = ["🥇", "🥈", "🥉"];

export default function ChallengePage() {
  const router = useRouter();
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"intro" | "playing" | "submitting" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [animateScore, setAnimateScore] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTime = useRef(0);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/challenge/today");
        const d = await res.json();
        if (res.ok) {
          setData(d);
          if (d.completed) setPhase("result");
        }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const startChallenge = () => {
    if (!data) return;
    setPhase("playing");
    setTimeLeft(data.challenge.timeLimit);
    startTime.current = Date.now();
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { submitChallenge(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const selectOption = (questionId: string, option: string) => {
    const current = answers[questionId];
    setAnswers((prev) => ({
      ...prev,
      [questionId]: current === option ? undefined! : option,
    }));
    // Filter out undefined
    if (current === option) {
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    }
  };

  const submitChallenge = useCallback(async () => {
    if (!data || submitting) return;
    setSubmitting(true);
    setPhase("submitting");
    if (timerRef.current) clearInterval(timerRef.current);

    const timeTaken = Math.round((Date.now() - startTime.current) / 1000);

    try {
      const res = await fetch("/api/challenge/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: data.challenge.id,
          responses: answers,
          timeTaken,
        }),
      });
      const r = await res.json();
      if (res.ok) {
        setResult(r);
        setPhase("result");
        setTimeout(() => setAnimateScore(true), 300);
      } else {
        setPhase("playing");
      }
    } catch {
      setPhase("playing");
    } finally {
      setSubmitting(false);
    }
  }, [data, answers, submitting]);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleShare = async () => {
    if (!data || !displayResult) return;
    const text = `Daily JAMB Challenge: ${displayResult.score}/${displayResult.totalQuestions} (${displayResult.accuracy}%) in ${fmtTime(displayResult.timeTaken)}\n\nRank #${displayResult.rank} today\n\nTry it on JambOS`;
    if (navigator.share) {
      try { await navigator.share({ text, title: data.challenge.title }); } catch {}
    } else {
      await navigator.clipboard.writeText(text);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#f7f7f8" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#bbb" }} />
      </div>
    );
  }

  if (!data) return null;

  const { challenge, questions, leaderboard } = data;
  const answered = Object.keys(answers).length;
  const isTimeLow = timeLeft > 0 && timeLeft < 30;
  const timePercent = challenge.timeLimit > 0 ? (timeLeft / challenge.timeLimit) * 100 : 100;

  // ═══════════ INTRO ═══════════
  if (phase === "intro") {
    return (
      <div className="min-h-screen" style={{ background: "#f7f7f8" }}>
        {/* Header */}
        <header className="sticky top-0 z-30" style={{ background: "rgba(247,247,248,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #ebebeb" }}>
          <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
            <button onClick={() => router.push("/dashboard")} style={{ color: "#888" }}>
              <ArrowLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Daily Challenge</span>
            <div className="w-8" />
          </div>
        </header>

        <div className="mx-auto max-w-lg px-4 pt-8 pb-12">
          {/* Hero card */}
          <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
            {/* Top accent */}
            <div className="relative px-6 pt-8 pb-6 text-center" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
              <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 30% 20%, #6366f1, transparent 50%), radial-gradient(circle at 70% 80%, #22c55e, transparent 50%)" }} />
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)" }}>
                  <Zap className="h-7 w-7" style={{ color: "#fbbf24" }} />
                </div>
                <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
                  {challenge.title}
                </h1>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {challenge.description}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x" style={{ borderTop: "1px solid #f0f0f0", divideColor: "#f0f0f0" } as any}>
              {[
                { icon: Target, label: "Questions", value: String(challenge.totalQuestions), color: "#6366f1" },
                { icon: Timer, label: "Time", value: fmtTime(challenge.timeLimit), color: "#f59e0b" },
                { icon: Zap, label: "XP Reward", value: `+${challenge.xpReward}`, color: "#22c55e" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="py-4 text-center">
                  <Icon className="mx-auto mb-1.5 h-4 w-4" style={{ color, opacity: 0.7 }} />
                  <p className="text-lg font-bold" style={{ color: "#1a1a1a", fontFamily: "var(--font-mono)", letterSpacing: "-0.02em" }}>{value}</p>
                  <p className="text-[0.625rem] mt-0.5" style={{ color: "#bbb" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Subject + topic */}
            <div className="px-6 py-4" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[0.625rem] font-semibold uppercase tracking-wider" style={{ color: "#bbb" }}>Subject</p>
                  <p className="text-sm font-semibold mt-0.5" style={{ color: "#1a1a1a" }}>{fmtSubject(challenge.subject)}</p>
                </div>
                {challenge.topicName && (
                  <div className="text-right">
                    <p className="text-[0.625rem] font-semibold uppercase tracking-wider" style={{ color: "#bbb" }}>Topic</p>
                    <p className="text-sm font-semibold mt-0.5" style={{ color: "#1a1a1a" }}>{challenge.topicName}</p>
                  </div>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="px-6 py-5">
              <button onClick={startChallenge}
                className="w-full flex items-center justify-center gap-2.5 rounded-xl py-3.5 text-sm font-semibold transition-all"
                style={{ background: "#1a1a1a", color: "#fff" }}>
                <Zap className="h-4 w-4" style={{ color: "#fbbf24" }} />
                Start Challenge
              </button>
              {challenge.bonusXP > 0 && (
                <p className="text-center mt-2.5 text-[0.6875rem]" style={{ color: "#bbb" }}>
                  Top 10% earn <span style={{ color: "#f59e0b", fontWeight: 600 }}>+{challenge.bonusXP} bonus XP</span>
                </p>
              )}
            </div>
          </div>

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4" style={{ color: "#f59e0b" }} />
                  <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Leaderboard</p>
                </div>
                <span className="text-[0.6875rem] rounded-lg px-2 py-0.5" style={{ background: "#f5f5f5", color: "#999" }}>
                  {data.totalAttempts} played
                </span>
              </div>
              <div className="space-y-1">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div key={entry.rank} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors"
                    style={{
                      background: entry.isCurrentUser ? "#f0fdf4" : "transparent",
                      border: entry.isCurrentUser ? "1px solid #dcfce7" : "1px solid transparent",
                    }}>
                    <span className="w-7 text-center text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {entry.rank <= 3 ? RANK_DISPLAY[entry.rank - 1] : (
                        <span className="text-xs font-bold" style={{ color: "#ccc" }}>{entry.rank}</span>
                      )}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate"
                        style={{ color: entry.isCurrentUser ? "#16a34a" : "#1a1a1a" }}>
                        {entry.name}
                        {entry.isCurrentUser && <span className="text-xs ml-1" style={{ color: "#22c55e" }}>(You)</span>}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: entry.accuracy >= 80 ? "#16a34a" : entry.accuracy >= 50 ? "#d97706" : "#999" }}>
                        {entry.accuracy}%
                      </span>
                      <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "#ccc" }}>
                        {fmtTime(entry.timeTaken)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ═══════════ SUBMITTING ═══════════
  if (phase === "submitting") {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "#f7f7f8" }}>
        <div className="rounded-2xl p-10 max-w-sm w-full text-center" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
          <div className="relative inline-flex items-center justify-center mb-5">
            <svg width="72" height="72" viewBox="0 0 72 72" className="animate-spin" style={{ animationDuration: "2s" }}>
              <circle cx="36" cy="36" r="30" fill="none" stroke="#f0f0f0" strokeWidth="3.5" />
              <circle cx="36" cy="36" r="30" fill="none" stroke="#6366f1" strokeWidth="3.5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 30}`} strokeDashoffset={2 * Math.PI * 30 * 0.72} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <BarChart3 className="h-5 w-5" style={{ color: "#6366f1" }} />
            </div>
          </div>
          <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Calculating your score...</p>
          <p className="text-xs mt-1" style={{ color: "#999" }}>Checking answers and updating rankings</p>
        </div>
      </div>
    );
  }

  // ═══════════ PLAYING ═══════════
  if (phase === "playing" && questions.length > 0) {
    const q = questions[currentQ];

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "#f7f7f8" }}>
        {/* Header */}
        <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderBottom: "1px solid #ebebeb" }}>
          <div className="mx-auto max-w-lg px-4">
            <div className="flex items-center justify-between h-12">
              {/* Timer */}
              <div className="flex items-center gap-2 rounded-xl px-3 py-1.5"
                style={{
                  background: isTimeLow ? "#fef2f2" : "#f5f5f5",
                  border: `1px solid ${isTimeLow ? "#fecaca" : "transparent"}`,
                }}>
                <Clock className="h-3.5 w-3.5" style={{ color: isTimeLow ? "#ef4444" : "#888" }} />
                <span className="text-sm font-bold" style={{
                  fontFamily: "var(--font-mono)",
                  color: isTimeLow ? "#ef4444" : "#1a1a1a",
                }}>
                  {fmtTime(timeLeft)}
                </span>
              </div>

              {/* Progress */}
              <span className="text-xs font-semibold" style={{ color: "#bbb" }}>
                <span style={{ color: "#1a1a1a", fontFamily: "var(--font-mono)" }}>{answered}</span>/{questions.length} answered
              </span>

              {/* Submit */}
              <button onClick={submitChallenge} disabled={submitting}
                className="rounded-xl px-4 py-1.5 text-xs font-semibold"
                style={{ background: "#1a1a1a", color: "#fff" }}>
                Submit
              </button>
            </div>

            {/* Time progress bar */}
            <div style={{ height: "3px", background: "#f0f0f0", marginBottom: "-1px" }}>
              <div style={{
                width: `${timePercent}%`,
                height: "100%",
                background: isTimeLow ? "#ef4444" : timePercent < 50 ? "#f59e0b" : "#22c55e",
                transition: "width 1s linear, background 0.3s",
                borderRadius: "0 2px 2px 0",
              }} />
            </div>
          </div>
        </header>

        {/* Question */}
        <main className="flex-1 mx-auto max-w-lg w-full px-4 pt-6 pb-28">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs font-bold rounded-lg px-2.5 py-1"
              style={{ fontFamily: "var(--font-mono)", background: "#f0f0f0", color: "#888" }}>
              Q{currentQ + 1}
            </span>
            <span className="text-[0.6875rem]" style={{ color: "#bbb" }}>
              {q.topic?.name || ""}
            </span>
            <span className="ml-auto text-[0.625rem] font-semibold rounded-md px-1.5 py-0.5" style={{
              background: q.difficulty === "EASY" ? "#f0fdf4" : q.difficulty === "HARD" ? "#fef2f2" : "#fffbeb",
              color: q.difficulty === "EASY" ? "#16a34a" : q.difficulty === "HARD" ? "#ef4444" : "#d97706",
            }}>
              {q.difficulty.charAt(0) + q.difficulty.slice(1).toLowerCase()}
            </span>
          </div>

          {/* Question body */}
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
            <div className="text-[0.9375rem] leading-[1.8]" style={{ color: "#1a1a1a" }}
              dangerouslySetInnerHTML={{ __html: renderText(q.body) }} />
            {q.imageUrl && (
              <div className="mt-3 rounded-xl overflow-hidden" style={{ border: "1px solid #f0f0f0" }}>
                <img src={q.imageUrl} alt="" className="w-full max-h-52 object-contain p-3" />
              </div>
            )}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            {(["A", "B", "C", "D"] as const).map((key) => {
              const text = (q as any)[`option${key}`];
              const isSelected = answers[q.id] === key;
              return (
                <button key={key} onClick={() => selectOption(q.id, key)}
                  className="w-full flex items-center gap-3.5 rounded-xl p-4 text-left transition-all"
                  style={{
                    background: isSelected ? "#eef2ff" : "#fff",
                    border: `1.5px solid ${isSelected ? "#6366f1" : "#eaeaea"}`,
                    boxShadow: isSelected ? "0 0 0 1px rgba(99,102,241,0.1)" : "none",
                  }}>
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: isSelected ? "#6366f1" : "#f5f5f5",
                      color: isSelected ? "#fff" : "#999",
                    }}>
                    {key}
                  </span>
                  <span className="text-sm leading-relaxed flex-1"
                    style={{ color: isSelected ? "#1a1a1a" : "#555" }}
                    dangerouslySetInnerHTML={{ __html: renderText(text) }} />
                </button>
              );
            })}
          </div>
        </main>

        {/* Bottom nav */}
        <nav className="fixed bottom-0 left-0 right-0 z-40" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(16px)", borderTop: "1px solid #ebebeb" }}>
          <div className="mx-auto max-w-lg px-4 py-3">
            {/* Dots */}
            <div className="flex justify-center gap-1.5 mb-3">
              {questions.map((qq, i) => (
                <button key={i} onClick={() => setCurrentQ(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === currentQ ? "22px" : "8px",
                    height: "8px",
                    background: answers[qq.id]
                      ? "#22c55e"
                      : i === currentQ
                      ? "#6366f1"
                      : "#e0e0e0",
                    transition: "all 0.2s ease",
                  }} />
              ))}
            </div>

            {/* Prev / Next */}
            <div className="flex items-center justify-between">
              <button onClick={() => setCurrentQ((i) => Math.max(0, i - 1))}
                disabled={currentQ === 0}
                className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-semibold"
                style={{ background: "#f5f5f5", color: currentQ === 0 ? "#ddd" : "#555" }}>
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>

              {currentQ < questions.length - 1 ? (
                <button onClick={() => setCurrentQ((i) => i + 1)}
                  className="flex items-center gap-1 rounded-xl px-4 py-2.5 text-xs font-semibold"
                  style={{ background: "#1a1a1a", color: "#fff" }}>
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button onClick={submitChallenge} disabled={submitting}
                  className="flex items-center gap-1 rounded-xl px-5 py-2.5 text-xs font-semibold"
                  style={{ background: "#22c55e", color: "#fff" }}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Finish <CheckCircle2 className="h-4 w-4" /></>}
                </button>
              )}
            </div>
          </div>
        </nav>
      </div>
    );
  }

  // ═══════════ RESULT ═══════════
  const displayResult = result || (data.myAttempt ? {
    score: data.myAttempt.score,
    totalQuestions: challenge.totalQuestions,
    accuracy: data.myAttempt.accuracy,
    timeTaken: data.myAttempt.timeTaken,
    rank: data.myAttempt.rank,
    xpEarned: data.myAttempt.xpEarned,
    isPerfect: data.myAttempt.accuracy === 100,
    isTopTen: false,
    correctAnswers: {},
  } : null);

  if (!displayResult) return null;

  const scoreColor = displayResult.accuracy >= 80 ? "#22c55e"
    : displayResult.accuracy >= 50 ? "#f59e0b" : "#ef4444";
  const scoreEmoji = displayResult.isPerfect ? "🎯" : displayResult.accuracy >= 80 ? "🔥" : displayResult.accuracy >= 50 ? "💪" : "📖";
  const scoreVerdict = displayResult.isPerfect ? "Perfect score!"
    : displayResult.accuracy >= 80 ? "Outstanding performance!"
    : displayResult.accuracy >= 50 ? "Solid effort, keep going!"
    : "Room to grow. Review and retry!";

  const circumference = 2 * Math.PI * 54;
  const scoreOffset = circumference - (displayResult.accuracy / 100) * circumference;

  return (
    <div className="min-h-screen pb-12" style={{ background: "#f7f7f8" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(247,247,248,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #ebebeb" }}>
        <div className="mx-auto flex h-12 max-w-lg items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} style={{ color: "#888" }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Challenge Results</span>
          <button onClick={handleShare} style={{ color: "#888" }}>
            <Share2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-lg px-4 pt-6">
        {/* Score card */}
        <div className="rounded-2xl overflow-hidden mb-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
          <div className="relative px-6 pt-8 pb-6 text-center" style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 50%, ${scoreColor}, transparent 60%)` }} />

            {/* Emoji */}
            <div className="text-4xl mb-3">{scoreEmoji}</div>

            {/* Score ring */}
            <div className="relative inline-flex items-center justify-center mb-4">
              <svg width="132" height="132" viewBox="0 0 132 132">
                <circle cx="66" cy="66" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
                <circle cx="66" cy="66" r="54" fill="none"
                  stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={animateScore ? scoreOffset : circumference}
                  style={{ transition: "stroke-dashoffset 1.2s ease-out", transform: "rotate(-90deg)", transformOrigin: "center" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold" style={{ color: "#fff", fontFamily: "var(--font-mono)", letterSpacing: "-0.03em" }}>
                  {displayResult.score}/{displayResult.totalQuestions}
                </span>
                <span className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                  {displayResult.accuracy}%
                </span>
              </div>
            </div>

            <p className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.9)" }}>
              {scoreVerdict}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 divide-x" style={{ borderTop: "1px solid #f0f0f0" } as any}>
            {[
              { icon: Timer, label: "Time", value: fmtTime(displayResult.timeTaken), color: "#6366f1" },
              { icon: Trophy, label: "Rank", value: `#${displayResult.rank}`, color: "#f59e0b" },
              { icon: Zap, label: "XP Earned", value: `+${displayResult.xpEarned}`, color: "#22c55e" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="py-4 text-center">
                <Icon className="mx-auto mb-1 h-3.5 w-3.5" style={{ color, opacity: 0.7 }} />
                <p className="text-base font-bold" style={{ color: "#1a1a1a", fontFamily: "var(--font-mono)" }}>{value}</p>
                <p className="text-[0.625rem]" style={{ color: "#bbb" }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Badges */}
          {(displayResult.isPerfect || displayResult.isTopTen) && (
            <div className="flex items-center justify-center gap-2 px-6 py-3" style={{ background: "#fafafa", borderTop: "1px solid #f0f0f0" }}>
              {displayResult.isPerfect && (
                <span className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5"
                  style={{ background: "#faf5ff", color: "#7c3aed", border: "1px solid #e9d5ff" }}>
                  <Award className="h-3.5 w-3.5" /> Flawless
                </span>
              )}
              {displayResult.isTopTen && (
                <span className="flex items-center gap-1.5 text-xs font-semibold rounded-lg px-3 py-1.5"
                  style={{ background: "#fffbeb", color: "#d97706", border: "1px solid #fde68a" }}>
                  <Flame className="h-3.5 w-3.5" /> Top 10%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Review toggle */}
        {result?.correctAnswers && Object.keys(result.correctAnswers).length > 0 && (
          <button onClick={() => setShowReview(!showReview)}
            className="w-full rounded-2xl p-4 mb-5 flex items-center justify-between"
            style={{ background: "#fff", border: "1px solid #eaeaea" }}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#eef2ff" }}>
                <TrendingUp className="h-4 w-4" style={{ color: "#6366f1" }} />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Review Answers</p>
                <p className="text-[0.6875rem]" style={{ color: "#bbb" }}>See what you got right and wrong</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: "#ccc", transform: showReview ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>
        )}

        {/* Review */}
        {showReview && result?.correctAnswers && (
          <div className="space-y-3 mb-5">
            {questions.map((q, i) => {
              const userAnswer = answers[q.id];
              const correctAnswer = result.correctAnswers[q.id];
              const isCorrect = userAnswer === correctAnswer;
              return (
                <div key={q.id} className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
                  <div className="flex items-start gap-2.5 mb-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-[0.6875rem] font-bold"
                      style={{
                        background: isCorrect ? "#f0fdf4" : !userAnswer ? "#f5f5f5" : "#fef2f2",
                        color: isCorrect ? "#16a34a" : !userAnswer ? "#999" : "#dc2626",
                        fontFamily: "var(--font-mono)",
                      }}>
                      {i + 1}
                    </span>
                    <p className="text-sm leading-relaxed pt-0.5" style={{ color: "#1a1a1a" }}
                      dangerouslySetInnerHTML={{ __html: renderText(q.body.length > 150 ? q.body.slice(0, 150) + "..." : q.body) }} />
                  </div>
                  <div className="ml-8 space-y-1.5">
                    {(["A", "B", "C", "D"] as const).map((key) => {
                      const isUserPick = userAnswer === key;
                      const isRight = correctAnswer === key;
                      let bg = "transparent";
                      let borderColor = "transparent";
                      let textColor = "#888";
                      if (isRight) { bg = "#f0fdf4"; borderColor = "#dcfce7"; textColor = "#166534"; }
                      else if (isUserPick && !isRight) { bg = "#fef2f2"; borderColor = "#fee2e2"; textColor = "#991b1b"; }
                      return (
                        <div key={key} className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs"
                          style={{ background: bg, border: `1px solid ${borderColor}`, color: textColor }}>
                          <span className="font-bold w-4" style={{ fontFamily: "var(--font-mono)" }}>{key}</span>
                          <span className="flex-1" dangerouslySetInnerHTML={{ __html: renderText((q as any)[`option${key}`]) }} />
                          {isRight && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "#22c55e" }} />}
                          {isUserPick && !isRight && <XCircle className="h-3.5 w-3.5 shrink-0" style={{ color: "#ef4444" }} />}
                        </div>
                      );
                    })}
                    {!userAnswer && (
                      <p className="text-[0.6875rem] italic ml-1" style={{ color: "#ccc" }}>Not answered</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: "#fff", border: "1px solid #eaeaea" }}>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-4 w-4" style={{ color: "#f59e0b" }} />
              <p className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>Today's Rankings</p>
            </div>
            <div className="space-y-1">
              {leaderboard.slice(0, 10).map((entry) => (
                <div key={entry.rank} className="flex items-center gap-2.5 rounded-xl px-3 py-2.5"
                  style={{
                    background: entry.isCurrentUser ? "#f0fdf4" : "transparent",
                    border: entry.isCurrentUser ? "1px solid #dcfce7" : "1px solid transparent",
                  }}>
                  <span className="w-7 text-center text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {entry.rank <= 3 ? RANK_DISPLAY[entry.rank - 1] : (
                      <span className="text-xs font-bold" style={{ color: "#ccc" }}>{entry.rank}</span>
                    )}
                  </span>
                  <p className="flex-1 text-sm font-medium truncate"
                    style={{ color: entry.isCurrentUser ? "#16a34a" : "#1a1a1a" }}>
                    {entry.name}
                    {entry.isCurrentUser && <span className="text-xs ml-1" style={{ color: "#22c55e" }}>(You)</span>}
                  </p>
                  <span className="text-xs font-bold" style={{
                    fontFamily: "var(--font-mono)",
                    color: entry.accuracy >= 80 ? "#16a34a" : entry.accuracy >= 50 ? "#d97706" : "#999",
                  }}>
                    {entry.accuracy}%
                  </span>
                  <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "#ccc" }}>
                    {fmtTime(entry.timeTaken)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mb-3">
          <button onClick={handleShare}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eaeaea", color: "#555" }}>
            <Share2 className="h-4 w-4" /> Share
          </button>
          <button onClick={() => router.push("/practice")}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
            style={{ background: "#fff", border: "1px solid #eaeaea", color: "#555" }}>
            <Target className="h-4 w-4" /> Practice
          </button>
        </div>
        <button onClick={() => router.push("/dashboard")}
          className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#1a1a1a", color: "#fff" }}>
          <Home className="h-4 w-4" /> Dashboard
        </button>

        <p className="text-center mt-4 text-[0.6875rem]" style={{ color: "#ccc" }}>
          New challenge every day at midnight
        </p>
      </div>
    </div>
  );
}