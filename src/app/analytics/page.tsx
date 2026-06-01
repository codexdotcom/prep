"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Target,
  Clock,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Gauge,
  BookOpen,
} from "lucide-react";
import { useAnalytics } from "@/hooks/use-analytics";
import { Logo } from "@/components/ui/logo";
import { ScoreGauge } from "@/components/analytics/score-gauge";
import { SubjectCards } from "@/components/analytics/subject-cards";
import { TopicHeatmap } from "@/components/analytics/topic-heatmap";
import { ScoreTrendChart } from "@/components/analytics/score-trend-chart";
import { DifficultyBreakdown } from "@/components/analytics/difficulty-breakdown";
import { SpeedAnalysis } from "@/components/analytics/speed-analysis";
import { RecommendationCards } from "@/components/analytics/recommendation-cards";

export default function AnalyticsPage() {
  const router = useRouter();
  const { data, recommendations, loading, error } = useAnalytics();

  if (loading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="text-center">
          <Loader2
            className="mx-auto mb-4 h-8 w-8 animate-spin"
            style={{ color: "var(--color-accent-green)" }}
          />
          <p
            className="text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Crunching your numbers...
          </p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="card max-w-md text-center">
          <p className="mb-4" style={{ color: "var(--color-danger-400)" }}>
            {error || "Could not load analytics"}
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!data.hasData) {
    return (
      <div
        className="flex min-h-screen items-center justify-center px-4"
        style={{ background: "var(--color-surface)" }}
      >
        <div className="card max-w-md text-center">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <Brain
              className="h-8 w-8"
              style={{ color: "var(--color-accent-green)" }}
            />
          </div>
          <h2
            className="mb-2"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.25rem",
              color: "var(--color-text-primary)",
            }}
          >
            No data yet
          </h2>
          <p
            className="mb-6 text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Complete at least one test to unlock your personalized analytics
            dashboard.
          </p>
          <button
            onClick={() => router.push("/practice")}
            className="btn-primary"
          >
            <Zap className="h-4 w-4" />
            Take a Test
          </button>
        </div>
      </div>
    );
  }

  const { overview } = data;

  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: "var(--color-surface)" }}
    >
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Brain
              className="h-4 w-4"
              style={{ color: "var(--color-accent-green)" }}
            />
            <span
              className="text-sm font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              Analytics
            </span>
          </div>
          <button
            onClick={() => router.push("/practice")}
            className="btn-primary"
            style={{ padding: "0.5rem 1rem", fontSize: "0.8125rem" }}
          >
            Practice
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-6">
        {/* Score + Overview Section */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          {/* Predicted Score */}
          <div className="sm:col-span-2 lg:col-span-1">
            <ScoreGauge
              score={overview.predictedJambScore}
              target={overview.targetScore}
              riskLevel={overview.riskLevel}
            />
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3 sm:col-span-2">
            {[
              {
                icon: CheckCircle2,
                label: "Accuracy",
                value: `${overview.overallAccuracy}%`,
                color: "var(--color-accent-green)",
              },
              {
                icon: BarChart3,
                label: "Tests Taken",
                value: overview.totalTestsTaken,
                color: "var(--color-info-400)",
              },
              {
                icon: BookOpen,
                label: "Questions Done",
                value: overview.totalQuestionsAttempted,
                color: "var(--color-tier-elite)",
              },
              {
                icon: AlertTriangle,
                label: "Careless Errors",
                value: `${overview.carelessErrorRate}%`,
                color:
                  overview.carelessErrorRate > 10
                    ? "var(--color-danger-400)"
                    : "var(--color-warning-400)",
              },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="stat-card">
                <Icon
                  className="mb-2 h-4 w-4"
                  style={{ color }}
                />
                <p className="stat-value" style={{ fontSize: "1.375rem" }}>
                  {value}
                </p>
                <p className="stat-label">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <section className="mb-6">
            <div className="mb-3 flex items-center gap-2">
              <Zap
                className="h-4 w-4"
                style={{ color: "var(--color-accent-green)" }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1.125rem",
                  color: "var(--color-text-primary)",
                }}
              >
                What to Do Next
              </h2>
            </div>
            <RecommendationCards recommendations={recommendations} />
          </section>
        )}

        {/* Subject Performance */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Target
              className="h-4 w-4"
              style={{ color: "var(--color-accent-green)" }}
            />
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--color-text-primary)",
              }}
            >
              Subject Performance
            </h2>
          </div>
          <SubjectCards subjects={data.subjectStats} />
        </section>

        {/* Topic Heatmap */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3
              className="h-4 w-4"
              style={{ color: "var(--color-accent-green)" }}
            />
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--color-text-primary)",
              }}
            >
              Topic Breakdown
            </h2>
          </div>
          <TopicHeatmap topics={data.topicStats} />
        </section>

        {/* Two-column: Score Trend + Difficulty */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          <section>
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp
                className="h-4 w-4"
                style={{ color: "var(--color-accent-green)" }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  color: "var(--color-text-primary)",
                }}
              >
                Score Trend
              </h2>
            </div>
            <ScoreTrendChart data={data.scoreTrend} />
          </section>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <Gauge
                className="h-4 w-4"
                style={{ color: "var(--color-accent-green)" }}
              />
              <h2
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "1rem",
                  color: "var(--color-text-primary)",
                }}
              >
                By Difficulty
              </h2>
            </div>
            <DifficultyBreakdown data={data.difficultyBreakdown} />
          </section>
        </div>

        {/* Speed Analysis */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2">
            <Clock
              className="h-4 w-4"
              style={{ color: "var(--color-accent-green)" }}
            />
            <h2
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--color-text-primary)",
              }}
            >
              Speed Analysis
            </h2>
          </div>
          <SpeedAnalysis
            avgTimeMs={overview.avgTimePerQuestion}
            speedRating={overview.speedRating}
            bestStudyTime={overview.bestStudyTime}
          />
        </section>

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <Logo size="small" />
          <div
            className="mt-3 flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <a
              href="/privacy"
              className="transition-colors hover:underline"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Privacy Policy
            </a>
            <span>·</span>
            <a
              href="/terms"
              className="transition-colors hover:underline"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              Terms
            </a>
          </div>
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            © {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}