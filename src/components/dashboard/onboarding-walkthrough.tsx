"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen, Brain, Target, BarChart3, MessageCircle,
  ChevronRight, X, Sparkles,
} from "lucide-react";

const STORAGE_KEY = "jambos-onboarding-done";

interface Step {
  title: string;
  body: string;
  icon: typeof BookOpen;
  action?: { label: string; href: string };
}

const STEPS: Step[] = [
 
  {
    title: "Practice smarter, not harder",
    body: "Four practice modes. Quick Practice for casual reps. Full Mock Exam for real JAMB simulation. Topic Drill for targeted mastery. Weak Areas for the topics costing you the most points. The AI adapts difficulty as you go.",
    icon: BookOpen,
    action: { label: " ", href: "/practice" },
  },
  {
    title: "Track your progress",
    body: "Every answer updates your ability model. The dashboard shows your predicted JAMB score, subject breakdown, and the exact topics to fix for the biggest score jump. Watch the numbers move as you practice.",
    icon: BarChart3,
  },
  {
    title: "Get AI-powered study notes",
    body: "Smart Notes analyzes real JAMB questions to generate study material covering only what the exam actually tests. Choose your learning style: visual diagrams, audio explanations, written summaries, or interactive practice.",
    icon: Sparkles,
    action: { label: " ", href: "/notes" },
  },
  {
    title: "Ask the AI Tutor anything",
    body: "Stuck on a concept? The tutor explains it in plain language, walks you through examples, and connects it to how JAMB tests it. Available 24/7, no appointment needed.",
    icon: MessageCircle,
    action: { label: "", href: "/tutor" },
  },
   {
    title: "Take a diagnostic test",
    body: "40 questions across your JAMB subjects. The AI uses your answers to map every strong and weak topic, then predicts your current JAMB score. This is your starting point.",
    icon: Brain,
    action: { label: "Take diagnostic", href: "/diagnostic" },
  },
];

export function OnboardingWalkthrough() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  const dismiss = () => {
    setVisible(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60] bg-black/40" onClick={dismiss} />

      {/* Modal */}
      <div className="fixed inset-0 z-[61] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl overflow-hidden" style={{ background: "#fff", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-0.5">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", color: "#111" }}>Jamb</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "0.875rem", color: "#111" }}>OS</span>
            </div>
            <button onClick={dismiss} className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors"
              style={{ color: "#bbb" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#bbb"; }}>
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-1 px-5 mb-4">
            {STEPS.map((_, i) => (
              <div key={i} className="flex-1 h-1 rounded-full transition-all" style={{ background: i <= step ? "#111" : "#eee" }} />
            ))}
          </div>

          {/* Content */}
          <div className="px-5 pb-2" key={step} style={{ animation: "fadeSlideUp 0.2s ease" }}>
            <div className="flex h-11 w-11 items-center justify-center rounded-xl mb-4" style={{ background: "#f5f5f5" }}>
              <Icon className="h-5 w-5" style={{ color: "#333" }} />
            </div>

            <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "#aaa" }}>
              Step {step + 1} of {STEPS.length}
            </p>
            <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#111", lineHeight: 1.3 }}>
              {current.title}
            </h2>
            <p className="text-sm leading-[1.7]" style={{ color: "#666" }}>
              {current.body}
            </p>

            {current.action && (
              <button onClick={() => { dismiss(); router.push(current.action!.href); }}
                className="mt-3 flex items-center gap-1 text-sm font-semibold transition-colors"
                style={{ color: "#111" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#555"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#111"; }}>
                {current.action.label} <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 mt-2" style={{ borderTop: "1px solid #f3f3f3" }}>
            <button onClick={dismiss} className="text-sm" style={{ color: "#aaa" }}>
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button onClick={prev} className="rounded-xl px-4 py-2 text-sm font-semibold" style={{ background: "#f5f5f5", color: "#555" }}>
                  Back
                </button>
              )}
              <button onClick={next} className="rounded-xl px-5 py-2 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>
                {isLast ? "Get started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </>
  );
}