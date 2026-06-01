"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Zap,
  Clock,
  Trophy,
  Star,
  ChevronRight,
  Loader2,
  CheckCircle2,
  XCircle,
  Crown,
  Share2,
  Flame,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { ShareButton } from "@/components/ui/share-button";

interface ChallengeQuestion {
  id: string;
  body: string;
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

const RANK_ICONS = ["👑", "🥈", "🥉"];

export default function ChallengePage() {
  const router = useRouter();
  const [data, setData] = useState<ChallengeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<"intro" | "playing" | "result">("intro");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
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
      } catch {
        console.error("Failed to load challenge");
      } finally {
        setLoading(false);
      }
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
        if (prev <= 1) {
          submitChallenge();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const selectOption = (questionId: string, option: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: option }));
  };

  const submitChallenge = useCallback(async () => {
    if (!data || submitting) return;
    setSubmitting(true);

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
      }
    } catch {
      console.error("Submit failed");
    } finally {
      setSubmitting(false);
    }
  }, [data, answers, submitting]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { challenge, questions, leaderboard } = data;
  const formatSubject = (s: string) => s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
  const isTimeLow = timeLeft < 30;

  // ════ INTRO ════
  if (phase === "intro") {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
        <div className="w-full max-w-md">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost mb-6">
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>

          <div className="card p-6 text-center" style={{ boxShadow: "var(--shadow-glow)" }}>
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(34,197,94,0.1)" }}
            >
              <Zap className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
            </div>

            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
              {challenge.title}
            </h1>

            <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
              {challenge.description}
            </p>

            <div className="grid grid-cols-3 gap-3 mt-6 mb-6">
              <div className="stat-card text-center py-3">
                <p className="stat-value" style={{ fontSize: "1.25rem" }}>{challenge.totalQuestions}</p>
                <p className="stat-label">Questions</p>
              </div>
              <div className="stat-card text-center py-3">
                <p className="stat-value" style={{ fontSize: "1.25rem" }}>{formatTime(challenge.timeLimit)}</p>
                <p className="stat-label">Time Limit</p>
              </div>
              <div className="stat-card text-center py-3">
                <p className="stat-value" style={{ fontSize: "1.25rem", color: "var(--color-accent-green)" }}>+{challenge.xpReward}</p>
                <p className="stat-label">XP Reward</p>
              </div>
            </div>

            <button onClick={startChallenge} className="btn-primary w-full" style={{ padding: "1rem", fontSize: "1rem" }}>
              <Zap className="h-5 w-5" />
              Start Challenge
            </button>

            <p className="mt-3 text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
              Top 10% scorers earn {challenge.bonusXP} bonus XP
            </p>
          </div>

          {/* Today's leaderboard */}
          {leaderboard.length > 0 && (
            <div className="card mt-6 p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy className="h-4 w-4" style={{ color: "var(--color-warning-400)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Today&apos;s Leaderboard
                </p>
                <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  ({data.totalAttempts} played)
                </span>
              </div>
              <div className="space-y-1.5">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center gap-2 rounded-lg p-2"
                    style={{
                      background: entry.isCurrentUser ? "rgba(34,197,94,0.06)" : "transparent",
                      border: entry.isCurrentUser ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
                    }}
                  >
                    <span className="w-6 text-center text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                      {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : entry.rank}
                    </span>
                    <span className="flex-1 text-sm truncate" style={{ color: entry.isCurrentUser ? "var(--color-accent-green)" : "var(--color-text-secondary)" }}>
                      {entry.name}
                    </span>
                    <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
                      {entry.accuracy}%
                    </span>
                    <span className="text-[0.5625rem]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                      {formatTime(entry.timeTaken)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════ PLAYING ════
  if (phase === "playing" && questions.length > 0) {
    const q = questions[currentQ];
    const answered = Object.keys(answers).length;

    return (
      <div className="min-h-screen flex flex-col" style={{ background: "var(--color-surface)" }}>
        {/* Header */}
        <div
          className="sticky top-0 z-30 px-4 py-3 flex items-center justify-between"
          style={{
            background: "var(--color-surface-card)",
            borderBottom: "1px solid var(--color-surface-border)",
          }}
        >
          <span className="text-sm font-mono" style={{ color: "var(--color-text-tertiary)" }}>
            {currentQ + 1}/{questions.length}
          </span>

          <div
            className="flex items-center gap-2 rounded-lg px-3 py-1.5"
            style={{
              background: isTimeLow ? "rgba(239,68,68,0.1)" : "var(--color-surface-lighter)",
              border: `1px solid ${isTimeLow ? "rgba(239,68,68,0.3)" : "var(--color-surface-border)"}`,
            }}
          >
            <Clock className="h-3.5 w-3.5" style={{ color: isTimeLow ? "var(--color-danger-400)" : "var(--color-text-tertiary)" }} />
            <span
              className="font-mono text-sm font-semibold"
              style={{ color: isTimeLow ? "var(--color-danger-400)" : "var(--color-text-primary)" }}
            >
              {formatTime(timeLeft)}
            </span>
          </div>

          <button
            onClick={submitChallenge}
            disabled={submitting}
            className="btn-primary"
            style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
          >
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit"}
          </button>
        </div>

        {/* Progress bar */}
        <div style={{ height: "3px", background: "var(--color-surface-lighter)" }}>
          <div
            style={{
              width: `${((currentQ + 1) / questions.length) * 100}%`,
              height: "100%",
              background: "var(--color-accent-green)",
              transition: "width 0.3s",
            }}
          />
        </div>

        {/* Question */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg" key={q.id} style={{ animation: "var(--animate-fade-in)" }}>
            <p className="text-base leading-relaxed mb-6" style={{ color: "var(--color-text-primary)" }}>
              {q.body}
            </p>

            <div className="space-y-2">
              {(["A", "B", "C", "D"] as const).map((key) => {
                const optionKey = `option${key}` as "optionA" | "optionB" | "optionC" | "optionD";
                const isSelected = answers[q.id] === key;

                return (
                  <button
                    key={key}
                    onClick={() => selectOption(q.id, key)}
                    className="flex w-full items-start gap-3 rounded-xl p-4 text-left transition-all"
                    style={{
                      background: isSelected ? "rgba(34,197,94,0.08)" : "var(--color-surface-light)",
                      border: `1.5px solid ${isSelected ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                      boxShadow: isSelected ? "var(--shadow-glow)" : "none",
                    }}
                  >
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold"
                      style={{
                        fontFamily: "var(--font-mono)",
                        background: isSelected ? "var(--color-accent-green)" : "var(--color-surface-lighter)",
                        color: isSelected ? "var(--color-surface)" : "var(--color-text-muted)",
                      }}
                    >
                      {key}
                    </span>
                    <span className="text-sm leading-relaxed pt-0.5" style={{ color: "var(--color-text-secondary)" }}>
                      {(q as any)[optionKey]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Nav */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => setCurrentQ((i) => Math.max(0, i - 1))}
                disabled={currentQ <= 0}
                className="btn-secondary"
                style={{ opacity: currentQ <= 0 ? 0.3 : 1 }}
              >
                Previous
              </button>
              {currentQ < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQ((i) => i + 1)}
                  className="btn-primary"
                >
                  Next <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={submitChallenge}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Finish"}
                </button>
              )}
            </div>

            {/* Quick nav dots */}
            <div className="flex justify-center gap-1.5 mt-6">
              {questions.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentQ(i)}
                  className="rounded-full transition-all"
                  style={{
                    width: i === currentQ ? "20px" : "8px",
                    height: "8px",
                    background: answers[questions[i].id]
                      ? "var(--color-accent-green)"
                      : i === currentQ
                      ? "var(--color-accent-dim)"
                      : "var(--color-surface-border)",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ════ RESULT ════
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

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--color-surface)" }}>
      <div className="w-full max-w-md">
        <div className="card p-6 text-center" style={{ boxShadow: "var(--shadow-glow)", animation: "var(--animate-scale-in)" }}>
          {/* Emoji reaction */}
          <div className="text-5xl mb-4">
            {displayResult.isPerfect ? "🎯" : displayResult.accuracy >= 80 ? "🔥" : displayResult.accuracy >= 50 ? "💪" : "📚"}
          </div>

          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
            {displayResult.isPerfect
              ? "Perfect Score!"
              : displayResult.accuracy >= 80
              ? "Excellent!"
              : displayResult.accuracy >= 50
              ? "Good effort!"
              : "Keep practicing!"}
          </h2>

          <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            {challenge.title}
          </p>

          {/* Score circle */}
          <div className="my-6">
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "4rem",
                lineHeight: 1,
                color:
                  displayResult.accuracy >= 80
                    ? "var(--color-accent-green)"
                    : displayResult.accuracy >= 50
                    ? "var(--color-warning-400)"
                    : "var(--color-danger-400)",
              }}
            >
              {displayResult.score}/{displayResult.totalQuestions}
            </p>
            <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
              {displayResult.accuracy}% accuracy · {formatTime(displayResult.timeTaken)}
            </p>
          </div>

          {/* Badges */}
          <div className="flex justify-center gap-2 mb-6">
            <span className="badge badge-green">+{displayResult.xpEarned} XP</span>
            {displayResult.rank && (
              <span className="badge badge-info">#{displayResult.rank} today</span>
            )}
            {displayResult.isPerfect && (
              <span className="badge" style={{ background: "rgba(167,139,250,0.1)", color: "var(--color-tier-elite)", border: "1px solid rgba(167,139,250,0.2)" }}>
                Flawless
              </span>
            )}
            {displayResult.isTopTen && (
              <span className="badge" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning-400)", border: "1px solid rgba(245,158,11,0.2)" }}>
                Top 10%
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <ShareButton type="test" label="Share Result" variant="primary" />
            <button onClick={() => router.push("/dashboard")} className="btn-secondary w-full">
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <div className="card mt-6 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="h-4 w-4" style={{ color: "var(--color-warning-400)" }} />
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Today&apos;s Rankings
              </p>
            </div>
            <div className="space-y-1.5">
              {leaderboard.slice(0, 10).map((entry) => (
                <div
                  key={entry.rank}
                  className="flex items-center gap-2 rounded-lg p-2"
                  style={{
                    background: entry.isCurrentUser ? "rgba(34,197,94,0.06)" : "transparent",
                    border: entry.isCurrentUser ? "1px solid rgba(34,197,94,0.2)" : "1px solid transparent",
                  }}
                >
                  <span className="w-6 text-center text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                    {entry.rank <= 3 ? RANK_ICONS[entry.rank - 1] : entry.rank}
                  </span>
                  <span className="flex-1 text-sm truncate" style={{ color: entry.isCurrentUser ? "var(--color-accent-green)" : "var(--color-text-secondary)" }}>
                    {entry.name} {entry.isCurrentUser && "(You)"}
                  </span>
                  <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
                    {entry.accuracy}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-8 text-center">
          <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
            New challenge every day at midnight
          </p>
        </footer>
      </div>
    </div>
  );
}