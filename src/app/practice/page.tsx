"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Clock,
  GraduationCap,
  Target,
  Brain,
  Zap,
  ChevronRight,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const TEST_MODES = [
  {
    id: "PRACTICE",
    title: "Practice",
    description: "Untimed, single subject. Go at your own pace with instant feedback.",
    icon: BookOpen,
    color: "var(--color-accent-green)",
    bg: "rgba(34, 197, 94, 0.08)",
    recommended: false,
  },
  {
    id: "TIMED",
    title: "Timed Practice",
    description: "Race the clock. Builds speed and exam confidence.",
    icon: Clock,
    color: "var(--color-info-400)",
    bg: "rgba(59, 130, 246, 0.08)",
    recommended: false,
  },
  {
    id: "MOCK_EXAM",
    title: "Full Mock Exam",
    description: "180 questions, 2 hours. The real JAMB experience, simulated.",
    icon: GraduationCap,
    color: "var(--color-tier-elite)",
    bg: "rgba(167, 139, 250, 0.08)",
    recommended: true,
  },
  {
    id: "TOPIC_DRILL",
    title: "Topic Drill",
    description: "Laser focus on a specific topic until you master it.",
    icon: Target,
    color: "var(--color-warning-400)",
    bg: "rgba(245, 158, 11, 0.08)",
    recommended: false,
  },
  {
    id: "WEAK_TOPIC",
    title: "Weak Areas",
    description: "AI picks your weakest topics and drills them specifically.",
    icon: Brain,
    color: "var(--color-danger-400)",
    bg: "rgba(239, 68, 68, 0.08)",
    recommended: false,
  },
];

const SUBJECTS = [
  { value: "USE_OF_ENGLISH", label: "Use of English" },
  { value: "MATHEMATICS", label: "Mathematics" },
  { value: "PHYSICS", label: "Physics" },
  { value: "CHEMISTRY", label: "Chemistry" },
  { value: "BIOLOGY", label: "Biology" },
  { value: "LITERATURE", label: "Literature" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "ECONOMICS", label: "Economics" },
  { value: "COMMERCE", label: "Commerce" },
  { value: "ACCOUNTING", label: "Accounting" },
];

const QUESTION_COUNTS = [10, 20, 40, 60];

export default function PracticePage() {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<string | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [questionCount, setQuestionCount] = useState(40);
  const [isStarting, setIsStarting] = useState(false);

  const needsSubject = selectedMode && selectedMode !== "MOCK_EXAM" && selectedMode !== "WEAK_TOPIC";
  const canStart =
    selectedMode &&
    (selectedMode === "MOCK_EXAM" || selectedMode === "WEAK_TOPIC" || selectedSubject);

  const handleStart = async () => {
    if (!canStart) return;
    setIsStarting(true);

    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: selectedMode,
          subject: selectedSubject,
          questionCount:
            selectedMode === "MOCK_EXAM" ? 180 : questionCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // Store session data for the test page
      sessionStorage.setItem(`test-${data.sessionId}`, JSON.stringify(data));
      router.push(`/test/${data.sessionId}`);
    } catch (err: any) {
      alert(err.message || "Failed to start test");
      setIsStarting(false);
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-surface)" }}
    >
      <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="btn-ghost mb-4"
            style={{ marginLeft: "-0.5rem" }}
          >
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </button>

          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.75rem",
              color: "var(--color-text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            Start Practicing
          </h1>
          <p style={{ color: "var(--color-text-tertiary)", fontSize: "0.9375rem" }}>
            Choose your mode, subject, and question count
          </p>
        </div>

        {/* Mode Selection */}
        <div className="mb-8">
          <p className="section-label mb-3">Test Mode</p>
          <div className="space-y-2">
            {TEST_MODES.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.id;

              return (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id)}
                  className="flex w-full items-center gap-4 rounded-xl p-4 text-left transition-all duration-150"
                  style={{
                    background: isSelected ? mode.bg : "var(--color-surface-card)",
                    border: `1.5px solid ${
                      isSelected ? mode.color : "var(--color-surface-border)"
                    }`,
                    boxShadow: isSelected ? `0 0 20px ${mode.color}15` : "none",
                  }}
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    style={{ background: mode.bg }}
                  >
                    <Icon className="h-5 w-5" style={{ color: mode.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-semibold"
                        style={{
                          color: isSelected
                            ? mode.color
                            : "var(--color-text-primary)",
                        }}
                      >
                        {mode.title}
                      </span>
                      {mode.recommended && (
                        <span className="badge badge-green" style={{ fontSize: "0.625rem" }}>
                          Recommended
                        </span>
                      )}
                    </div>
                    <p
                      className="mt-0.5 text-xs"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {mode.description}
                    </p>
                  </div>
                  <ChevronRight
                    className="h-4 w-4 shrink-0"
                    style={{
                      color: isSelected
                        ? mode.color
                        : "var(--color-text-muted)",
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject Selection */}
        {needsSubject && (
          <div className="mb-8" style={{ animation: "var(--animate-slide-up)" }}>
            <p className="section-label mb-3">Subject</p>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((subject) => {
                const isSelected = selectedSubject === subject.value;

                return (
                  <button
                    key={subject.value}
                    onClick={() => setSelectedSubject(subject.value)}
                    className={`subject-pill ${isSelected ? "subject-pill-active" : ""}`}
                  >
                    {subject.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Question Count (not for mock) */}
        {selectedMode && selectedMode !== "MOCK_EXAM" && (
          <div className="mb-8" style={{ animation: "var(--animate-slide-up)" }}>
            <p className="section-label mb-3">Questions</p>
            <div className="flex gap-2">
              {QUESTION_COUNTS.map((count) => {
                const isSelected = questionCount === count;

                return (
                  <button
                    key={count}
                    onClick={() => setQuestionCount(count)}
                    className="flex-1 rounded-xl py-3 text-center text-sm font-semibold transition-all duration-150"
                    style={{
                      background: isSelected
                        ? "rgba(34, 197, 94, 0.1)"
                        : "var(--color-surface-light)",
                      border: `1.5px solid ${
                        isSelected
                          ? "var(--color-accent-green)"
                          : "var(--color-surface-border)"
                      }`,
                      color: isSelected
                        ? "var(--color-accent-green)"
                        : "var(--color-text-tertiary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {count}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Start Button */}
        <button
          onClick={handleStart}
          disabled={!canStart || isStarting}
          className="btn-primary w-full"
          style={{
            padding: "1rem",
            fontSize: "1rem",
            opacity: canStart ? 1 : 0.4,
          }}
        >
          {isStarting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <>
              <Zap className="h-5 w-5" />
              Start Test
            </>
          )}
        </button>

        {/* Footer */}
        <footer
          className="mt-16 pt-6 text-center"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <Logo size="small" />
          <div
            className="mt-3 flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <a href="/privacy" className="transition-colors hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Privacy Policy
            </a>
            <span>·</span>
            <a href="/terms" className="transition-colors hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Terms of Service
            </a>
            <span>·</span>
            <a href="/help" className="transition-colors hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Help
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