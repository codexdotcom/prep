"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, Trophy, Target, BarChart3,
  ChevronRight, Clock, Flame,
} from "lucide-react";

interface Session {
  id: string;
  mode: string;
  subject: string | null;
  score: number | null;
  totalCorrect: number | null;
  totalQuestions: number;
  accuracy: number;
  completedAt: string;
  duration: number;
}

interface Stats {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  overallAccuracy: number;
  mockExamsTaken: number;
  bestMock: number;
  worstMock: number;
  avgMock: number;
  improvement: number;
}

interface ScoreTrendPoint {
  score: number | null;
  date: string;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
const modeLabel: Record<string, string> = {
  MOCK_EXAM: "Mock Exam",
  PRACTICE: "Practice",
  TOPIC_DRILL: "Topic Drill",
  WEAK_TOPIC: "Weak Areas",
  DIAGNOSTIC: "Diagnostic",
};

export function ScoreHistory() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trend, setTrend] = useState<ScoreTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/history?limit=10")
      .then((r) => r.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setStats(data.stats || null);
        setTrend(data.scoreTrend || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats || stats.totalSessions === 0) return null;

  // Mini sparkline from trend data
  const trendScores = trend.map((t) => t.score || 0).filter((s) => s > 0);
  const trendMax = Math.max(...trendScores, 400);
  const trendMin = Math.min(...trendScores, 0);
  const trendRange = trendMax - trendMin || 1;

  return (
    <div className="space-y-3">
      {/* Stats overview */}
      <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" style={{ color: "#555" }} />
            <p className="text-sm font-bold" style={{ color: "#111" }}>Your Progress</p>
          </div>
          <button onClick={() => router.push("/analytics")} className="text-xs font-semibold flex items-center gap-0.5" style={{ color: "#22c55e" }}>
            Full analytics <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{stats.totalSessions}</p>
            <p className="text-xs" style={{ color: "#888" }}>Sessions</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>{stats.totalQuestions.toLocaleString()}</p>
            <p className="text-xs" style={{ color: "#888" }}>Questions</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: stats.overallAccuracy >= 70 ? "#22c55e" : stats.overallAccuracy >= 50 ? "#f59e0b" : "#ef4444" }}>
              {stats.overallAccuracy}%
            </p>
            <p className="text-xs" style={{ color: "#888" }}>Accuracy</p>
          </div>
          <div className="rounded-xl p-2.5 text-center" style={{ background: "#fafafa" }}>
            <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color: "#8b5cf6" }}>{stats.mockExamsTaken}</p>
            <p className="text-xs" style={{ color: "#888" }}>Mocks</p>
          </div>
        </div>

        {/* Mock exam stats */}
        {stats.mockExamsTaken > 0 && (
          <div className="rounded-xl p-3" style={{ background: "#fafafa" }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold" style={{ color: "#555" }}>Mock Exam Scores</p>
              {stats.improvement !== 0 && (
                <div className="flex items-center gap-1">
                  {stats.improvement > 0 ? <TrendingUp className="h-3 w-3" style={{ color: "#22c55e" }} /> : <TrendingDown className="h-3 w-3" style={{ color: "#ef4444" }} />}
                  <span className="text-xs font-bold" style={{ color: stats.improvement > 0 ? "#22c55e" : "#ef4444" }}>
                    {stats.improvement > 0 ? "+" : ""}{stats.improvement} pts
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-sm">
              <div>
                <span className="text-xs" style={{ color: "#aaa" }}>Best: </span>
                <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color: "#22c55e" }}>{stats.bestMock}</span>
              </div>
              <div>
                <span className="text-xs" style={{ color: "#aaa" }}>Avg: </span>
                <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color: "#555" }}>{stats.avgMock}</span>
              </div>
              <div>
                <span className="text-xs" style={{ color: "#aaa" }}>Low: </span>
                <span className="font-bold" style={{ fontFamily: "var(--font-mono)", color: "#ef4444" }}>{stats.worstMock}</span>
              </div>
            </div>

            {/* Mini sparkline */}
            {trendScores.length >= 2 && (
              <div className="mt-2 h-10 flex items-end gap-0.5">
                {trendScores.map((s, i) => (
                  <div key={i} className="flex-1 rounded-sm" style={{
                    height: `${Math.max(10, ((s - trendMin) / trendRange) * 100)}%`,
                    background: i === trendScores.length - 1 ? "#22c55e" : "#e5e5e5",
                    transition: "height 0.5s",
                  }} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1px solid #eee" }}>
          <p className="text-sm font-bold mb-3" style={{ color: "#111" }}>Recent Activity</p>
          <div className="space-y-2">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="flex items-center gap-3 rounded-xl p-2.5" style={{ background: "#fafafa" }}>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{
                  background: s.mode === "MOCK_EXAM" ? "#f5f3ff" : s.mode === "TOPIC_DRILL" ? "#fffbeb" : "#f0fdf4",
                }}>
                  {s.mode === "MOCK_EXAM" ? <Trophy className="h-3.5 w-3.5" style={{ color: "#8b5cf6" }} /> :
                    s.mode === "TOPIC_DRILL" ? <Target className="h-3.5 w-3.5" style={{ color: "#f59e0b" }} /> :
                      <Flame className="h-3.5 w-3.5" style={{ color: "#22c55e" }} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: "#222" }}>
                    {modeLabel[s.mode] || s.mode}
                    {s.subject && s.mode !== "MOCK_EXAM" && ` · ${fmt(s.subject)}`}
                  </p>
                  <p className="text-xs" style={{ color: "#aaa" }}>
                    {s.accuracy}% · {s.totalQuestions}q · {s.duration > 0 ? `${s.duration}m` : ""}
                    {s.completedAt && ` · ${new Date(s.completedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`}
                  </p>
                </div>
                {s.score !== null && s.mode === "MOCK_EXAM" && (
                  <span className="text-sm font-bold shrink-0" style={{
                    fontFamily: "var(--font-mono)",
                    color: (s.score || 0) >= 250 ? "#22c55e" : (s.score || 0) >= 180 ? "#f59e0b" : "#ef4444",
                  }}>
                    {s.score}/400
                  </span>
                )}
                {s.mode !== "MOCK_EXAM" && (
                  <span className="text-sm font-bold shrink-0" style={{
                    fontFamily: "var(--font-mono)",
                    color: s.accuracy >= 70 ? "#22c55e" : s.accuracy >= 50 ? "#f59e0b" : "#ef4444",
                  }}>
                    {s.accuracy}%
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}