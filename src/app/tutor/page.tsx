"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Brain, BookOpen, Zap, ChevronRight, MessageCircle,
  FileText, Calendar, Mic, Video, Image, Headphones,
  Gamepad2, ClipboardList, PenTool, Puzzle, AppWindow,
  GraduationCap, Sparkles, Send,
} from "lucide-react";
import { TutorChat } from "@/components/ai/tutor-chat";

const FEATURES = [
  { icon: Mic, title: "Record Lecture", desc: "Capture and generate enhanced notes from your lectures.", color: "#ef4444", href: null },
  { icon: PenTool, title: "Smart Notes", desc: "Automatically generate comprehensive notes from any topic.", color: "#f59e0b", href: "/notes" },
  { icon: Headphones, title: "Audio Recap", desc: "Generate podcast-style audio summaries of your study materials.", color: "#ec4899", href: "/audio-recap" },
  { icon: Video, title: "Explainer Video", desc: "Turn any topic into an AI-generated educational breakdown.", color: "#14b8a6", href: "/explainer" },
  { icon: Image, title: "Visual Explainer", desc: "Analyze diagrams, charts, and images with AI-powered explanations.", color: "#6366f1", href: "visual-explainer" },
  { icon: Puzzle, title: "Flashcards", desc: "Create smart flashcard decks from your study materials.", color: "#0ea5e9", href: "/flashcards" },
  { icon: Sparkles, title: "QuizFetch", desc: "Auto-generated quizzes from your uploaded content.", color: "#a855f7", href: "/quizfetch" },
  { icon: Gamepad2, title: "Arcade", desc: "Learn through interactive study games and challenges.", color: "#f97316", href: null },
  { icon: FileText, title: "Essay Grader", desc: "Receive personalized feedback and grading on your essays.", color: "#e11d48", href:"/essay-grader" },
];

const QUICK_PROMPTS = [
  "Explain quadratic equations simply",
  "How does photosynthesis work?",
  "Difference between speed and velocity",
  "Explain mole concept in Chemistry",
  "How to find the main idea in comprehension",
  "What is demand and supply?",
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
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4" style={{ color: "#555" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>AI Tutor</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-8">
        <div className="text-center mb-10">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "#f5f5f5" }}>
            <Brain className="h-7 w-7" style={{ color: "#333" }} />
          </div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#111" }}>
            What do you want to learn today?
          </h1>
          <p className="mt-2 text-sm mx-auto max-w-md" style={{ color: "#777", lineHeight: 1.6 }}>
            Ask any JAMB question. Get step-by-step explanations, worked examples, and exam strategies.
          </p>

          <div className="mt-6 mx-auto max-w-lg">
            <button
              onClick={() => { setInitialMessage(undefined); setChatOpen(true); }}
              className="w-full flex items-center gap-3 rounded-xl px-4 py-3.5 text-left transition-all"
              style={{ background: "#fff", border: "1px solid #ddd", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#bbb"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ddd"; }}
            >
              <MessageCircle className="h-4 w-4 shrink-0" style={{ color: "#bbb" }} />
              <span className="flex-1 text-sm" style={{ color: "#999" }}>Ask anything about JAMB...</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0" style={{ background: "#111" }}>
                <Send className="h-3.5 w-3.5" style={{ color: "#fff" }} />
              </div>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                onClick={() => openWithMessage(prompt)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                style={{ background: "#fff", border: "1px solid #eee", color: "#555" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f5f5f5"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-10">
          <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-4 px-1" style={{ color: "#bbb" }}>
            TOOLS AND FEATURES
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px rounded-2xl overflow-hidden" style={{ background: "#eee", border: "1px solid #eee" }}>
            {FEATURES.map(({ icon: Icon, title, desc, color, href }) => (
              <button
                key={title}
                onClick={() => {
                  if (href) router.push(href);
                  else openWithMessage(`Help me with ${title}: ${desc}`);
                }}
                className="flex items-start gap-3 p-5 text-left transition-colors"
                style={{ background: "#fff" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#fafafa"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#fff"; }}
              >
                <Icon className="h-5 w-5 shrink-0 mt-0.5" style={{ color }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-semibold" style={{ color: "#111" }}>{title}</p>
                    {href && <ChevronRight className="h-3 w-3" style={{ color: "#ccc" }} />}
                  </div>
                  <p className="text-[0.8125rem] mt-0.5" style={{ color: "#777", lineHeight: 1.5 }}>{desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <footer className="pt-6 text-center" style={{ borderTop: "1px solid #eee" }}>
          <div className="flex items-center justify-center gap-0.5 mb-3">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.0625rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <div className="flex items-center justify-center gap-3 text-xs" style={{ color: "#999" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "#777" }}>Privacy</a>
            <span>-</span>
            <a href="/terms" className="hover:underline" style={{ color: "#777" }}>Terms</a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "#bbb" }}>&copy; {new Date().getFullYear()} JambOS. All rights reserved.</p>
        </footer>
      </div>

      <TutorChat
        isOpen={chatOpen}
        onClose={() => { setChatOpen(false); setInitialMessage(undefined); }}
        initialMessage={initialMessage}
      />
    </div>
  );
}