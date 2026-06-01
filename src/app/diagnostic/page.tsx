"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  Brain,
  Clock,
  Target,
  Zap,
  ArrowRight,
  Loader2,
  CheckCircle2,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const STEPS_INFO = [
  {
    icon: Brain,
    title: "40 targeted questions",
    description: "Covering your selected JAMB subjects across all difficulty levels",
  },
  {
    icon: Clock,
    title: "About 30 minutes",
    description: "Untimed — go at your own pace so we get an accurate read",
  },
  {
    icon: BarChart3,
    title: "Instant analysis",
    description: "We identify your weak topics, speed patterns, and predicted score",
  },
  {
    icon: Target,
    title: "Personalized plan",
    description: "Your results generate a custom study plan tailored to your target",
  },
];

export default function DiagnosticPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    setIsStarting(true);
    setError("");

    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "DIAGNOSTIC",
          questionCount: 40,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to start diagnostic");
        setIsStarting(false);
        return;
      }

      sessionStorage.setItem(`test-${data.sessionId}`, JSON.stringify(data));
      router.push(`/test/${data.sessionId}`);
    } catch {
      setError("Network error. Please try again.");
      setIsStarting(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: "var(--color-surface)" }}
    >
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Logo />
          <div
            className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <Sparkles
              className="h-8 w-8"
              style={{ color: "var(--color-accent-green)" }}
            />
          </div>
          <h1
            className="mt-4"
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              color: "var(--color-text-primary)",
            }}
          >
            Diagnostic Test
          </h1>
          <p
            className="mt-2 mx-auto max-w-sm text-sm"
            style={{
              color: "var(--color-text-tertiary)",
              lineHeight: "1.6",
            }}
          >
            Before we build your study plan, we need to understand where you
            stand. This quick assessment maps your strengths and gaps.
          </p>
        </div>

        {/* What to expect */}
        <div
          className="card mb-6"
          style={{ boxShadow: "var(--shadow-glow)" }}
        >
          <p
            className="section-label mb-4"
          >
            What to expect
          </p>

          <div className="space-y-4">
            {STEPS_INFO.map(({ icon: Icon, title, description }, i) => (
              <div key={i} className="flex items-start gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "rgba(34, 197, 94, 0.08)" }}
                >
                  <Icon
                    className="h-4 w-4"
                    style={{ color: "var(--color-accent-green)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {title}
                  </p>
                  <p
                    className="text-xs mt-0.5"
                    style={{
                      color: "var(--color-text-tertiary)",
                      lineHeight: "1.5",
                    }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div
          className="rounded-xl p-4 mb-6"
          style={{
            background: "rgba(34, 197, 94, 0.04)",
            border: "1px solid rgba(34, 197, 94, 0.1)",
          }}
        >
          <p
            className="text-xs font-semibold mb-2"
            style={{ color: "var(--color-accent-green)" }}
          >
            Quick tips
          </p>
          <ul
            className="space-y-1.5 text-xs"
            style={{
              color: "var(--color-text-tertiary)",
              lineHeight: "1.5",
            }}
          >
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--color-accent-dim)" }}
              />
              Answer honestly — guessing skews your results
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--color-accent-dim)" }}
              />
              Skip questions you genuinely don&apos;t know
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2
                className="h-3.5 w-3.5 mt-0.5 shrink-0"
                style={{ color: "var(--color-accent-dim)" }}
              />
              Find a quiet spot with minimal distractions
            </li>
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-sm"
            style={{
              background: "rgba(239, 68, 68, 0.1)",
              border: "1px solid rgba(239, 68, 68, 0.2)",
              color: "var(--color-danger-400)",
            }}
          >
            {error}
          </div>
        )}

        {/* Start button */}
        <button
          onClick={handleStart}
          disabled={isStarting}
          className="btn-primary w-full"
          style={{ padding: "1rem", fontSize: "1rem" }}
        >
          {isStarting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Zap className="h-5 w-5" />
              Begin Diagnostic
            </>
          )}
        </button>

        <p
          className="mt-4 text-center text-xs"
          style={{ color: "var(--color-text-muted)" }}
        >
          You can retake this anytime from the dashboard
        </p>

        {/* Footer */}
        <footer
          className="mt-12 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <div
            className="flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            
            <a  href="/privacy"
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