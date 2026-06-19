"use client";

import { useEffect, useState } from "react";
import {
  Trophy, TrendingUp, Target, Flame, ArrowRight, Zap,
  BarChart3, Brain, Star, ChevronRight, CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface SubjectScore {
  subject: string;
  correct: number;
  total: number;
  answered: number;
  accuracy: number;
  score: number;
}

interface ScorecardProps {
  score: number;
  totalCorrect: number;
  totalAnswered: number;
  totalQuestions: number;
  subjectScores: SubjectScore[];
  onReview: () => void;
  onDashboard: () => void;
  onRetry: () => void;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const getScoreColor = (s: number) => s >= 70 ? "#22c55e" : s >= 50 ? "#f59e0b" : "#ef4444";

// Motivational messages that create desire to keep going
function getMotivation(score: number, accuracy: number): { headline: string; sub: string; cta: string } {
  if (score >= 350) return {
    headline: "You're in the top 1%.",
    sub: "This is elite territory. Students who score above 350 get first-choice admissions at every federal university. You're not just prepared — you're dangerous.",
    cta: "One more mock to stay sharp",
  };
  if (score >= 300) return {
    headline: "300+ club. You belong here.",
    sub: "Most students never see this number. You just proved you can. The gap between 300 and 350 is smaller than you think — it's just 2-3 more correct answers per subject.",
    cta: "Close the gap to 350",
  };
  if (score >= 250) return {
    headline: "You're above the cutoff for most universities.",
    sub: "But 'most' isn't your dream school. The students who get into Medicine, Law, and Engineering at UNILAG and UI score 280+. You're 30 points away. That's fixable this week.",
    cta: "Drill your weak topics now",
  };
  if (score >= 200) return {
    headline: "Solid foundation. Now let's build on it.",
    sub: "You understand the basics, but your competitors are practicing while you're reading this. Every day you drill, you gain 5-10 points. In two weeks, you could be at 280+.",
    cta: "Start your comeback",
  };
  if (score >= 150) return {
    headline: "This score doesn't define you.",
    sub: "Here's what does: what you do next. Students who score 150 today regularly hit 280 in 3-4 weeks of focused practice. The question isn't whether you can — it's whether you will.",
    cta: "Begin your transformation",
  };
  return {
    headline: "Every expert was once a beginner.",
    sub: "The hardest part is starting — and you just did. Most students never even take a practice test. You're already ahead. Now let's turn this into a score your parents will brag about.",
    cta: "Start with your weakest subject",
  };
}

function getWeakestSubjects(scores: SubjectScore[]): SubjectScore[] {
  return [...scores].sort((a, b) => a.accuracy - b.accuracy).slice(0, 2);
}

function getActionPlan(scores: SubjectScore[]): Array<{ action: string; reason: string; urgency: "high" | "medium" | "low" }> {
  const plan: Array<{ action: string; reason: string; urgency: "high" | "medium" | "low" }> = [];
  const weak = getWeakestSubjects(scores);

  for (const s of weak) {
    if (s.accuracy < 40) {
      plan.push({
        action: `Drill ${fmt(s.subject)} daily for 7 days`,
        reason: `${s.accuracy}% accuracy — this subject alone could cost you 40+ points`,
        urgency: "high",
      });
    } else if (s.accuracy < 60) {
      plan.push({
        action: `Focus 30 minutes daily on ${fmt(s.subject)}`,
        reason: `${s.accuracy}% → 75% would add ~15 points to your total`,
        urgency: "medium",
      });
    }
  }

  const unanswered = scores.reduce((s, ss) => s + (ss.total - ss.answered), 0);
  if (unanswered > 10) {
    plan.push({
      action: "Practice time management",
      reason: `You left ${unanswered} questions unanswered — that's free points on the table`,
      urgency: "high",
    });
  }

  if (plan.length === 0) {
    plan.push({
      action: "Take another mock exam to lock in this performance",
      reason: "Consistency is what separates 300+ scorers from everyone else",
      urgency: "low",
    });
  }

  return plan;
}

export function Scorecard({ score, totalCorrect, totalAnswered, totalQuestions, subjectScores, onReview, onDashboard, onRetry }: ScorecardProps) {
  const [showFull, setShowFull] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const accuracy = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
  const motivation = getMotivation(score, accuracy);
  const actionPlan = getActionPlan(subjectScores);
  const weakest = getWeakestSubjects(subjectScores);

  // Animate score counting up
  useEffect(() => {
    let start = 0;
    const target = score;
    const duration = 1500;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setAnimatedScore(target); clearInterval(timer); }
      else setAnimatedScore(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [score]);

  const scoreColor = getScoreColor(score >= 250 ? 70 : score >= 180 ? 50 : 30);

  // Ring
  const size = 120;
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min((score / 400) * 100, 100);
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="max-w-lg mx-auto">
      {/* Score hero */}
      <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
        {/* Ring */}
        <div className="relative inline-flex items-center justify-center mb-4">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f3f3" strokeWidth="6" />
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={scoreColor} strokeWidth="6" strokeLinecap="round"
              strokeDasharray={circ} strokeDashoffset={offset} transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: "stroke-dashoffset 1.5s ease" }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "2.5rem", color: scoreColor, lineHeight: 1 }}>{animatedScore}</span>
            <span className="text-[0.625rem] mt-0.5" style={{ color: "#bbb" }}>out of 400</span>
          </div>
        </div>

        <p className="text-xs" style={{ color: "#999" }}>
          {totalCorrect} correct · {totalAnswered} attempted · {totalQuestions - totalAnswered} skipped
        </p>
      </div>

      {/* Motivation card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: "#111" }}>
        <p className="text-base font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#fff", lineHeight: 1.3 }}>
          {motivation.headline}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: "#999" }}>
          {motivation.sub}
        </p>
      </div>

      {/* Subject breakdown */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="h-4 w-4" style={{ color: "#888" }} />
          <p className="text-xs font-semibold" style={{ color: "#555" }}>Subject Breakdown</p>
        </div>

        <div className="space-y-3">
          {subjectScores.map((ss) => {
            const isWeak = weakest.some((w) => w.subject === ss.subject);
            return (
              <div key={ss.subject}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: "#333" }}>{fmt(ss.subject)}</p>
                    {isWeak && ss.accuracy < 60 && (
                      <span className="text-[0.5rem] font-semibold rounded-md px-1 py-0.5" style={{ background: "#fef2f2", color: "#ef4444" }}>Needs work</span>
                    )}
                  </div>
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getScoreColor(ss.accuracy) }}>
                    {ss.correct}/{ss.total}
                  </span>
                </div>
                <div style={{ height: "5px", borderRadius: "9999px", background: "#f3f3f3" }}>
                  <div style={{ width: `${ss.score}%`, height: "100%", borderRadius: "9999px", background: getScoreColor(ss.accuracy), transition: "width 1s" }} />
                </div>
                <div className="flex justify-between mt-1 text-[0.5625rem]" style={{ color: "#bbb" }}>
                  <span>{ss.answered} attempted</span>
                  <span>{ss.accuracy}% accuracy</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action plan */}
      <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
        <div className="flex items-center gap-2 mb-3">
          <Target className="h-4 w-4" style={{ color: "#f59e0b" }} />
          <p className="text-xs font-semibold" style={{ color: "#555" }}>Your Next Move</p>
        </div>

        <div className="space-y-2.5">
          {actionPlan.map((item, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md mt-0.5"
                style={{ background: item.urgency === "high" ? "#fef2f2" : item.urgency === "medium" ? "#fffbeb" : "#f0fdf4" }}>
                {item.urgency === "high" ? <AlertTriangle className="h-3 w-3" style={{ color: "#ef4444" }} /> :
                  item.urgency === "medium" ? <TrendingUp className="h-3 w-3" style={{ color: "#f59e0b" }} /> :
                    <CheckCircle2 className="h-3 w-3" style={{ color: "#22c55e" }} />}
              </div>
              <div>
                <p className="text-sm font-semibold" style={{ color: "#333" }}>{item.action}</p>
                <p className="text-[0.6875rem]" style={{ color: "#aaa" }}>{item.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA buttons */}
      <div className="space-y-2">
        <button onClick={onRetry}
          className="w-full rounded-2xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2"
          style={{ background: "#111", color: "#fff" }}>
          <Flame className="h-4 w-4" style={{ color: "#f59e0b" }} />
          {motivation.cta}
        </button>

        <div className="flex gap-2">
          <button onClick={onReview}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}>
            Review Answers
          </button>
          <button onClick={onDashboard}
            className="flex-1 rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-1.5"
            style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}>
            Dashboard
          </button>
        </div>
      </div>

      {/* Streak nudge */}
      <div className="rounded-xl p-3 mt-4 flex items-center gap-3" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
        <Flame className="h-5 w-5 shrink-0" style={{ color: "#f59e0b" }} />
        <div>
          <p className="text-xs font-semibold" style={{ color: "#92400e" }}>Don't break the chain</p>
          <p className="text-[0.6875rem]" style={{ color: "#b45309" }}>Students who practice daily score 47 points higher on average. Come back tomorrow.</p>
        </div>
      </div>
    </div>
  );
}