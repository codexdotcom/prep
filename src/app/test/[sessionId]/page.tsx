"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTestEngine } from "@/hooks/use-test-engine";
import { QuestionPanel } from "@/components/test/question-panel";
import { TestHeader } from "@/components/test/test-header";
import { QuestionNavigator } from "@/components/test/question-navigator";
import { SubmitModal } from "@/components/test/submit-modal";
import { ResultsView } from "@/components/test/results-view";
import type { TestSessionData, TestResult } from "@/types/test";

export default function TestPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const [sessionData, setSessionData] = useState<TestSessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNav, setShowNav] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    // In production, fetch from a session-restore endpoint
    // For now, we assume data was stored in sessionStorage after /api/tests/start
    const stored = sessionStorage.getItem(`test-${sessionId}`);
    if (stored) {
      setSessionData(JSON.parse(stored));
    } else {
      setError("Test session not found. Please start a new test.");
    }
    setLoading(false);
  }, [sessionId]);

  const engine = useTestEngine({
    sessionId,
    questions: sessionData?.questions ?? [],
    timeLimit: sessionData?.timeLimit ?? 0,
    onComplete: (r) => setResult(r),
  });

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-accent-green border-t-transparent" />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Loading your test...
          </p>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="card max-w-md text-center">
          <p className="mb-4" style={{ color: "var(--color-danger-400)" }}>
            {error || "Something went wrong"}
          </p>
          <button onClick={() => router.push("/dashboard")} className="btn-primary">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (result) {
    return <ResultsView result={result} sessionId={sessionId} />;
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: "var(--color-surface)" }}>
      <TestHeader
        currentIndex={engine.currentIndex}
        totalQuestions={sessionData.totalQuestions}
        timeRemaining={engine.timeRemaining}
        totalAnswered={engine.totalAnswered}
        totalFlagged={engine.totalFlagged}
        isTimed={sessionData.timeLimit > 0}
        onToggleNav={() => setShowNav(!showNav)}
        onSubmit={() => setShowSubmitModal(true)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Main question area */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
            <QuestionPanel
              question={engine.currentQuestion}
              questionNumber={engine.currentIndex + 1}
              selectedOption={engine.answers[engine.currentQuestion?.id]?.selected ?? null}
              isFlagged={engine.answers[engine.currentQuestion?.id]?.flagged ?? false}
              onSelect={engine.selectOption}
              onFlag={engine.toggleFlag}
              onNext={engine.goNext}
              onPrev={engine.goPrev}
              hasPrev={engine.currentIndex > 0}
              hasNext={engine.currentIndex < sessionData.totalQuestions - 1}
            />
          </div>
        </main>

        {/* Side navigator (desktop) */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-30 w-72 transform transition-transform duration-200 
            lg:relative lg:translate-x-0 lg:z-auto
            ${showNav ? "translate-x-0" : "translate-x-full"}
          `}
          style={{
            background: "var(--color-surface-card)",
            borderLeft: "1px solid var(--color-surface-border)",
          }}
        >
          <QuestionNavigator
            totalQuestions={sessionData.totalQuestions}
            answers={engine.answers}
            questions={sessionData.questions}
            currentIndex={engine.currentIndex}
            onSelect={(i) => {
              engine.goToQuestion(i);
              setShowNav(false);
            }}
            onClose={() => setShowNav(false)}
          />
        </aside>

        {/* Overlay for mobile nav */}
        {showNav && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setShowNav(false)}
          />
        )}
      </div>

      <SubmitModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={engine.handleSubmit}
        isSubmitting={engine.isSubmitting}
        totalQuestions={sessionData.totalQuestions}
        totalAnswered={engine.totalAnswered}
        totalFlagged={engine.totalFlagged}
      />
    </div>
  );
}