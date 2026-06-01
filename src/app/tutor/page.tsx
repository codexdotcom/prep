"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Brain, BookOpen, Zap, ChevronRight } from "lucide-react";
import { TutorChat } from "@/components/ai/tutor-chat";
import { Logo } from "@/components/ui/logo";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

const QUICK_TOPICS = [
  { label: "Explain quadratic equations", subject: "MATHEMATICS" },
  { label: "How does photosynthesis work?", subject: "BIOLOGY" },
  { label: "What is the difference between speed and velocity?", subject: "PHYSICS" },
  { label: "Explain mole concept in Chemistry", subject: "CHEMISTRY" },
  { label: "How to identify the main idea in comprehension", subject: "USE_OF_ENGLISH" },
  { label: "What is demand and supply?", subject: "ECONOMICS" },
];

export default function TutorPage() {
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [initialMessage, setInitialMessage] = useState<string | undefined>();

  const openWithMessage = (msg: string) => {
    setInitialMessage(msg);
    setChatOpen(true);
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              AI Tutor
            </span>
          </div>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Hero */}
        <div className="text-center mb-8">
          <div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <Brain className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              color: "var(--color-text-primary)",
            }}
          >
            Your AI Tutor
          </h1>
          <p
            className="mt-2 text-sm mx-auto max-w-sm"
            style={{ color: "var(--color-text-tertiary)", lineHeight: "1.6" }}
          >
            Ask questions about any JAMB topic. Get step-by-step explanations, worked examples, and exam tips.
          </p>
        </div>

        {/* Start chat button */}
        <button
          onClick={() => { setInitialMessage(undefined); setChatOpen(true); }}
          className="btn-primary w-full mb-8"
          style={{ padding: "1rem", fontSize: "1rem" }}
        >
          <Zap className="h-5 w-5" />
          Start a Conversation
        </button>

        {/* Quick topics */}
        <div className="mb-8">
          <p className="section-label mb-3">Try asking about</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {QUICK_TOPICS.map((topic) => (
              <button
                key={topic.label}
                onClick={() => openWithMessage(topic.label)}
                className="card-interactive flex items-center gap-3 p-3.5 text-left"
              >
                <BookOpen className="h-4 w-4 shrink-0" style={{ color: "var(--color-accent-green)" }} />
                <span className="text-sm flex-1" style={{ color: "var(--color-text-secondary)" }}>
                  {topic.label}
                </span>
                <ChevronRight className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-text-muted)" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Subject cards */}
        <div>
          <p className="section-label mb-3">Browse by subject</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {JAMB_SUBJECTS.slice(0, 9).map((subject) => (
              <button
                key={subject.value}
                onClick={() => openWithMessage(`Help me understand key topics in ${subject.label} for JAMB`)}
                className="card-interactive p-3 text-center"
              >
                <span className="text-sm font-medium" style={{ color: "var(--color-text-secondary)" }}>
                  {subject.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <Logo size="small" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Terms</a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>

      {/* Chat panel */}
      <TutorChat
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setInitialMessage(undefined); }}
        initialMessage={initialMessage}
      />
    </div>
  );
}