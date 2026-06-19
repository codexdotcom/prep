"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Check, Loader2, Play } from "lucide-react";

const SUBJECTS = [
  { value: "USE_OF_ENGLISH", label: "Use of English" },
  { value: "MATHEMATICS", label: "Mathematics" },
  { value: "PHYSICS", label: "Physics" },
  { value: "CHEMISTRY", label: "Chemistry" },
  { value: "BIOLOGY", label: "Biology" },
  { value: "LITERATURE", label: "Literature in English" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "ECONOMICS", label: "Economics" },
  { value: "COMMERCE", label: "Commerce" },
  { value: "ACCOUNTING", label: "Accounting" },
  { value: "CRS", label: "CRS" },
  { value: "IRS", label: "IRS" },
  { value: "GEOGRAPHY", label: "Geography" },
  { value: "AGRICULTURAL_SCIENCE", label: "Agricultural Science" },
];

const COUNTS = [10, 20, 40, 60];

export default function QuickPracticePage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string | null>(null);
  const [count, setCount] = useState(20);
  const [starting, setStarting] = useState(false);

  const handleStart = async () => {
    if (!subject) return;
    setStarting(true);
    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "PRACTICE", subject, questionCount: count, adaptive: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem(`test-${data.sessionId}`, JSON.stringify(data));
      router.push(`/test/${data.sessionId}`);
    } catch (err: any) { alert(err.message || "Failed to start"); setStarting(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button onClick={() => router.push("/practice")} className="flex items-center gap-1.5 text-sm" style={{ color: "#666" }}>
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-4 w-4" style={{ color: "#22c55e" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Quick Practice</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16">
        {/* Intro */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#111" }}>
            Pick a subject and go.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
            No timer. No scoring pressure. Just focused practice with instant feedback on every question. The AI adapts difficulty to keep you in the zone.Not too easy, not too hard.
          </p>
        </div>

        {/* Subject */}
        <div className="mb-8">
          <p className="text-sm font-semibold mb-3" style={{ color: "#333" }}>Which subject do you want to practice?</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SUBJECTS.map((s) => {
              const isSelected = subject === s.value;
              return (
                <button key={s.value} onClick={() => setSubject(s.value)}
                  className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                  style={{ background: "#fff", border: `1.5px solid ${isSelected ? "#22c55e" : "#eee"}` }}>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: isSelected ? "#22c55e" : "#f5f5f5", border: isSelected ? "none" : "1px solid #eee" }}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: isSelected ? "#166534" : "#444" }}>{s.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Count */}
        {subject && (
          <div className="mb-8" style={{ animation: "fadeSlideUp 0.25s ease" }}>
            <p className="text-sm font-semibold mb-3" style={{ color: "#333" }}>How many questions?</p>
            <div className="flex gap-2">
              {COUNTS.map((c) => (
                <button key={c} onClick={() => setCount(c)}
                  className="flex-1 rounded-xl py-3.5 text-center text-sm font-bold transition-all"
                  style={{ fontFamily: "var(--font-mono)", background: "#fff", border: `1.5px solid ${count === c ? "#22c55e" : "#eee"}`, color: count === c ? "#166534" : "#bbb" }}>
                  {c}
                </button>
              ))}
            </div>
            <p className="text-[0.8125rem] mt-2" style={{ color: "#aaa" }}>
              {count <= 10 ? "Quick warm-up. Great for a 5-minute session." :
                count <= 20 ? "Solid practice round. Takes about 15 minutes." :
                  count <= 40 ? "Deep practice session. Allow 30 minutes." :
                    "Full subject workout. Set aside 45 minutes."}
            </p>
          </div>
        )}

        {/* Start */}
        {subject && (
          <div style={{ animation: "fadeSlideUp 0.25s ease" }}>
            <button onClick={handleStart} disabled={starting}
              className="w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: "#111", color: "#fff" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#111"; }}>
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><Play className="h-4 w-4" style={{ color: "#22c55e" }} /> Start {count} Questions</>
              )}
            </button>
            <p className="text-center text-[0.8125rem] mt-3" style={{ color: "#bbb" }}>
              You don't have to be great to start. But you have to start to be great.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}