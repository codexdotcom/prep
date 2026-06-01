// src/app/dashboard/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Brain,
  BookOpen,
  BarChart3,
  Target,
  Zap,
  LogOut,
  ChevronRight,
  Trophy,
  Clock,
  Flame,
  Calendar,
  Database,
  Crown,
  GraduationCap,
  Gift,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface QuickStats {
  predictedScore: number;
  totalTests: number;
  accuracy: number;
  targetScore: number;
  hasData: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [stats, setStats] = useState<QuickStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/analytics/diagnostic");
        const data = await res.json();

        if (data.hasData) {
          setStats({
            predictedScore: data.overview.predictedJambScore,
            totalTests: data.overview.totalTestsTaken,
            accuracy: data.overview.overallAccuracy,
            targetScore: data.overview.targetScore,
            hasData: true,
          });
        } else {
          setStats({ predictedScore: 0, totalTests: 0, accuracy: 0, targetScore: 250, hasData: false });
        }
      } catch {
        setStats({ predictedScore: 0, totalTests: 0, accuracy: 0, targetScore: 250, hasData: false });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

 const navItems = [
  {
    icon: Zap,
    title: "Practice",
    description: "CBT simulator with past questions",
    href: "/practice",
    color: "var(--color-accent-green)",
  },
  {
    icon: BookOpen,
    title: "Study Today",
    description: "Your personalized daily study plan",
    href: "/study",
    color: "var(--color-warning-400)",
  },
  {
    icon: Calendar,
    title: "Revision Timetable",
    description: "Weekly schedule and spaced repetition",
    href: "/study/schedule",
    color: "var(--color-info-400)",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    description: "Performance insights and predictions",
    href: "/analytics",
    color: "var(--color-tier-elite)",
  },
  {
    icon: Brain,
    title: "Diagnostic",
    description: "Retake your diagnostic assessment",
    href: "/diagnostic",
    color: "var(--color-accent-dim)",
  },
  {
  icon: Brain,
  title: "AI Tutor",
  description: "Ask questions and get instant explanations",
  href: "/tutor",
  color: "var(--color-accent-green)",
},
{
  icon: Trophy,
  title: "Rewards",
  description: "XP, achievements, daily missions, leaderboard",
  href: "/rewards",
  color: "var(--color-warning-400)",
},
{
  icon: Crown,
  title: "Subscription",
  description: "Upgrade your plan for full access",
  href: "/subscription",
  color: "var(--color-warning-400)",
},
{
  icon: Zap,
  title: "Learn Feed",
  description: "Scroll through tips, tricks, and exam hacks",
  href: "/feed",
  color: "var(--color-accent-green)",
},
{
  icon: GraduationCap,
  title: "Reality Mode",
  description: "Check your real chances of getting admitted",
  href: "/reality",
  color: "var(--color-tier-elite)",
},
{
  icon: Trophy,
  title: "Rankings",
  description: "National, state, school, and subject rankings",
  href: "/rankings",
  color: "var(--color-warning-400)",
},
// Add to navItems in dashboard
{
  icon: Zap,
  title: "Daily Challenge",
  description: "Today's challenge — compete for the top spot",
  href: "/challenge",
  color: "var(--color-accent-green)",
},
{
  icon: Gift,
  title: "Invite Friends",
  description: "Get free Pro access by referring friends",
  href: "/referral",
  color: "var(--color-tier-elite)",
},
  {
    icon: Database,
    title: "Admin",
    description: "Manage question bank",
    href: "/admin",
    color: "var(--color-text-tertiary)",
  },
];
  return (
    <div
      className="min-h-screen pb-12"
      style={{ background: "var(--color-surface)" }}
    >
      {/* Header */}
      <header
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <Logo size="small" />
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="btn-ghost"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            Hey, {firstName}
          </h1>
          <p
            className="mt-1 text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            {stats?.hasData
              ? "Here's how you're tracking"
              : "Let's get started with your first test"}
          </p>
        </div>

        {/* Quick stats */}
        {!loading && stats?.hasData && (
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="stat-card text-center">
              <Trophy
                className="mx-auto mb-1 h-4 w-4"
                style={{ color: "var(--color-accent-green)" }}
              />
              <p className="stat-value" style={{ fontSize: "1.375rem" }}>
                {stats.predictedScore}
              </p>
              <p className="stat-label">Predicted</p>
            </div>
            <div className="stat-card text-center">
              <Target
                className="mx-auto mb-1 h-4 w-4"
                style={{ color: "var(--color-info-400)" }}
              />
              <p className="stat-value" style={{ fontSize: "1.375rem" }}>
                {stats.accuracy}%
              </p>
              <p className="stat-label">Accuracy</p>
            </div>
            <div className="stat-card text-center">
              <Flame
                className="mx-auto mb-1 h-4 w-4"
                style={{ color: "var(--color-warning-400)" }}
              />
              <p className="stat-value" style={{ fontSize: "1.375rem" }}>
                {stats.totalTests}
              </p>
              <p className="stat-label">Tests</p>
            </div>
          </div>
        )}

        {/* No data CTA */}
        {!loading && !stats?.hasData && (
          <div
            className="card mb-6 text-center py-8"
            style={{ boxShadow: "var(--shadow-glow)" }}
          >
            <div
              className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
              style={{ background: "rgba(34, 197, 94, 0.1)" }}
            >
              <Brain
                className="h-7 w-7"
                style={{ color: "var(--color-accent-green)" }}
              />
            </div>
            <h2
              className="mb-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.125rem",
                color: "var(--color-text-primary)",
              }}
            >
              Take your diagnostic test
            </h2>
            <p
              className="mb-4 mx-auto max-w-xs text-sm"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              40 questions to map your strengths and weaknesses. It takes about
              30 minutes.
            </p>
            <button
              onClick={() => router.push("/diagnostic")}
              className="btn-primary"
            >
              <Zap className="h-4 w-4" />
              Start Diagnostic
            </button>
          </div>
        )}

        {/* Navigation */}
        <div className="space-y-2">
          {navItems.map(({ icon: Icon, title, description, href, color }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="card-interactive flex w-full items-center gap-4 p-4 text-left"
            >
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{ background: `${color}12` }}
              >
                <Icon className="h-5 w-5" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-primary)" }}
                >
                  {title}
                </p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: "var(--color-text-tertiary)" }}
                >
                  {description}
                </p>
              </div>
              <ChevronRight
                className="h-4 w-4 shrink-0"
                style={{ color: "var(--color-text-muted)" }}
              />
            </button>
          ))}
        </div>

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <div
            className="flex items-center justify-center gap-4 text-xs"
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