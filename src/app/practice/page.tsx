"use client";

import { useRouter } from "next/navigation";
import {
  BookOpen, GraduationCap, Target, Brain, ArrowLeft,
  ChevronRight, Flame, Zap, Trophy,
} from "lucide-react";

const MODES = [
  {
    title: "Quick Practice",
    desc: "Pick a subject and start answering. No timer, no pressure, just you and the questions. Perfect for building confidence.",
    icon: BookOpen,
    color: "#22c55e",
    bg: "#f0fdf4",
    href: "/practice/quick",
    cta: "Start practicing",
  },
  {
    title: "Full Mock Exam",
    desc: "180 questions. 2 hours. 4 subjects. This is the real JAMB CBT experience.",
    icon: GraduationCap,
    color: "#8b5cf6",
    bg: "#f5f3ff",
    href: "/practice/mock",
    cta: "Take mock exam",
    badge: "Most popular",
  },
  {
    title: "Topic Drill",
    desc: "Choose exactly which topics you want to attack. The fastest way to turn a weakness into a strength.",
    icon: Target,
    color: "#f59e0b",
    bg: "#fffbeb",
    href: "/practice/drill",
    cta: "Drill topics",
  },
  {
    title: "Weak Areas",
    desc: "We've analyzed every answer you've given. This mode targets the exact topics costing you the most points.",
    icon: Brain,
    color: "#ef4444",
    bg: "#fef2f2",
    href: "/practice/weak",
    cta: "Fix weak spots",
  },
];

export default function PracticePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#666" }}>
            <ArrowLeft className="h-4 w-4" /> Dashboard
          </button>
          <span className="text-sm font-semibold" style={{ color: "#111" }}>Practice</span>
          <div className="w-20" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16">
        {/* Hero */}
        <div className="rounded-2xl p-5 mb-6" style={{ background: "#111" }}>
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-5 w-5" style={{ color: "#22c55e" }} />
            <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "#fff" }}>
              How do you want to practice?
            </p>
          </div>
          <p className="text-sm leading-relaxed" style={{ color: "#999" }}>
            The students who score 300+ don't just study more, they practice smarter. Every question you answer teaches the AI more about you, so your practice gets more effective over time.
          </p>
        </div>

        {/* Modes */}
        <div className="space-y-3">
          {MODES.map((m) => {
            const Icon = m.icon;
            return (
              <button key={m.href} onClick={() => router.push(m.href)}
                className="w-full rounded-2xl p-5 text-left transition-all group"
                style={{ background: "#fff", border: "1.5px solid #eee" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = m.color + "50"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl" style={{ background: m.bg }}>
                    <Icon className="h-5 w-5" style={{ color: m.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-[0.9375rem] font-bold" style={{ color: "#111" }}>{m.title}</p>
                      {m.badge && (
                        <span className="text-[0.5625rem] font-semibold rounded-md px-1.5 py-0.5" style={{ background: m.bg, color: m.color }}>{m.badge}</span>
                      )}
                    </div>
                    <p className="text-sm leading-relaxed mb-3" style={{ color: "#777" }}>{m.desc}</p>
                    <span className="text-xs font-semibold flex items-center gap-1" style={{ color: m.color }}>
                      {m.cta} <ChevronRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom nudge */}
        <div className="mt-8 rounded-xl p-4 flex items-start gap-3" style={{ background: "#fffbeb", border: "1px solid #fef3c7" }}>
          <Flame className="h-5 w-5 shrink-0 mt-0.5" style={{ color: "#f59e0b" }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400e" }}>Consistency beats intensity</p>
            <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#a16207" }}>
              20 questions a day for 30 days beats 600 questions in one weekend. Start small, stay consistent, watch your score climb.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}