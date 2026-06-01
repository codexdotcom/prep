"use client";

import { useEffect, useState } from "react";
import {
  Users,
  BookOpen,
  BarChart3,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Loader2,
} from "lucide-react";

interface QuestionStat {
  id: string;
  body: string;
  subject: string;
  correctRate: number | null;
  totalAttempts: number;
  topic: { name: string };
}

interface AdminStats {
  overview: {
    totalUsers: number;
    newUsersThisMonth: number;
    activeUsersWeekly: number;
    totalQuestions: number;
    totalTestSessions: number;
    totalResponses: number;
    openFlags: number;
    monthlyRevenue: number;
    monthlyPayments: number;
  };
  subscriptions: Record<string, number>;
  hardestQuestions: QuestionStat[];
  easiestQuestions: QuestionStat[];
}

export default function AdminStatsPage() {
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/admin/analytics");
        const d = await res.json();
        if (res.ok) setData(d);
      } catch {
        console.error("Failed to load admin stats");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!data) return null;

  const { overview } = data;

  const stats = [
    { icon: Users, label: "Total Users", value: overview.totalUsers, color: "var(--color-accent-green)" },
    { icon: Users, label: "New This Month", value: overview.newUsersThisMonth, color: "var(--color-info-400)" },
    { icon: TrendingUp, label: "Active (7d)", value: overview.activeUsersWeekly, color: "var(--color-tier-elite)" },
    { icon: BookOpen, label: "Questions", value: overview.totalQuestions, color: "var(--color-warning-400)" },
    { icon: BarChart3, label: "Tests Taken", value: overview.totalTestSessions, color: "var(--color-info-400)" },
    { icon: AlertTriangle, label: "Open Flags", value: overview.openFlags, color: "var(--color-danger-400)" },
    { icon: CreditCard, label: "Revenue (30d)", value: `₦${overview.monthlyRevenue.toLocaleString()}`, color: "var(--color-accent-green)" },
    { icon: CreditCard, label: "Payments (30d)", value: overview.monthlyPayments, color: "var(--color-info-400)" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)", marginBottom: "1.5rem" }}>
        Platform Analytics
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {stats.map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="stat-card">
            <Icon className="mb-2 h-4 w-4" style={{ color }} />
            <p className="stat-value" style={{ fontSize: "1.375rem" }}>{value}</p>
            <p className="stat-label">{label}</p>
          </div>
        ))}
      </div>

      <div className="card p-5 mb-6">
        <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>
          Active Subscriptions
        </h2>
        <div className="grid grid-cols-4 gap-3">
          {["FREE", "STARTER", "PRO", "ELITE"].map((plan) => (
            <div key={plan} className="text-center">
              <p
                className="text-lg font-bold"
                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}
              >
                {data.subscriptions[plan] || 0}
              </p>
              <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                {plan}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-danger-400)" }}>
            Hardest Questions
          </h2>
          <div className="space-y-2">
            {data.hardestQuestions.map((q: QuestionStat) => (
              <div
                key={q.id}
                className="flex items-center gap-2 rounded-lg p-2"
                style={{
                  background: "var(--color-surface-light)",
                  border: "1px solid var(--color-surface-border)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                    {q.body}
                  </p>
                  <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                    {q.topic.name} · {q.totalAttempts} attempts
                  </p>
                </div>
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-danger-400)" }}
                >
                  {q.correctRate !== null ? `${Math.round(q.correctRate * 100)}%` : "—"}
                </span>
              </div>
            ))}
            {data.hardestQuestions.length === 0 && (
              <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                Not enough data yet
              </p>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--color-accent-green)" }}>
            Easiest Questions
          </h2>
          <div className="space-y-2">
            {data.easiestQuestions.map((q: QuestionStat) => (
              <div
                key={q.id}
                className="flex items-center gap-2 rounded-lg p-2"
                style={{
                  background: "var(--color-surface-light)",
                  border: "1px solid var(--color-surface-border)",
                }}
              >
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate" style={{ color: "var(--color-text-secondary)" }}>
                    {q.body}
                  </p>
                  <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                    {q.topic.name} · {q.totalAttempts} attempts
                  </p>
                </div>
                <span
                  className="text-xs font-bold shrink-0"
                  style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}
                >
                  {q.correctRate !== null ? `${Math.round(q.correctRate * 100)}%` : "—"}
                </span>
              </div>
            ))}
            {data.easiestQuestions.length === 0 && (
              <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>
                Not enough data yet
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}