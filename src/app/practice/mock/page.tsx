"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GraduationCap, Check, Loader2, Play, Info, Clock, Calculator } from "lucide-react";

const ALL_SUBJECTS = [
  { value: "USE_OF_ENGLISH", label: "Use of English", short: "English" },
  { value: "MATHEMATICS", label: "Mathematics", short: "Maths" },
  { value: "PHYSICS", label: "Physics", short: "Physics" },
  { value: "CHEMISTRY", label: "Chemistry", short: "Chemistry" },
  { value: "BIOLOGY", label: "Biology", short: "Biology" },
  { value: "LITERATURE", label: "Literature in English", short: "Literature" },
  { value: "GOVERNMENT", label: "Government", short: "Government" },
  { value: "ECONOMICS", label: "Economics", short: "Economics" },
  { value: "COMMERCE", label: "Commerce", short: "Commerce" },
  { value: "ACCOUNTING", label: "Accounting", short: "Accounting" },
  { value: "CRS", label: "CRS", short: "CRS" },
  { value: "IRS", label: "IRS", short: "IRS" },
  { value: "GEOGRAPHY", label: "Geography", short: "Geography" },
  { value: "AGRICULTURAL_SCIENCE", label: "Agricultural Science", short: "Agric" },
];

export default function MockExamPage() {
  const router = useRouter();
  const [mockSubjects, setMockSubjects] = useState<string[]>([]);
  const [starting, setStarting] = useState(false);

  const canStart = mockSubjects.length === 3;
  const otherSubjects = ALL_SUBJECTS.filter((s) => s.value !== "USE_OF_ENGLISH");

  useEffect(() => {
    fetch("/api/profile/subjects").then((r) => r.json()).then((data) => {
      if (data.subjects?.length >= 3) {
        setMockSubjects(data.subjects.filter((s: string) => s !== "USE_OF_ENGLISH").slice(0, 3));
      }
    }).catch(() => {});
  }, []);

  const toggle = (val: string) => {
    if (val === "USE_OF_ENGLISH") return;
    setMockSubjects((prev) => {
      if (prev.includes(val)) return prev.filter((s) => s !== val);
      if (prev.length >= 3) return prev;
      return [...prev, val];
    });
  };

  const handleStart = async () => {
    if (!canStart) return;
    setStarting(true);
    try {
      const res = await fetch("/api/tests/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "MOCK_EXAM", subjects: ["USE_OF_ENGLISH", ...mockSubjects], questionCount: 180, adaptive: true }),
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
            <GraduationCap className="h-4 w-4" style={{ color: "#8b5cf6" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Mock Exam</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16">
        {/* Hero */}
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#111" }}>
            The real JAMB experience.
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: "#777" }}>
            This mock exam mirrors the actual UTME. Same number of questions, same time limit, same pressure. Students who take at least 3 mock exams before their real JAMB score an average of 47 points higher.
          </p>
        </div>

        {/* What you'll get */}
        <div className="grid grid-cols-3 gap-2 mb-8">
          {[
            { icon: Clock, label: "2 hours", sub: "Total time", color: "#8b5cf6" },
            { icon: GraduationCap, label: "180 Qs", sub: "Total questions", color: "#8b5cf6" },
            { icon: Calculator, label: "Basic calc", sub: "+ − × ÷ only", color: "#8b5cf6" },
          ].map(({ icon: Icon, label, sub, color }) => (
            <div key={label} className="rounded-xl p-3 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
              <Icon className="h-4 w-4 mx-auto mb-1.5" style={{ color }} />
              <p className="text-sm font-bold" style={{ color: "#111" }}>{label}</p>
              <p className="text-[0.6875rem]" style={{ color: "#aaa" }}>{sub}</p>
            </div>
          ))}
        </div>

        {/* Subject selection */}
        <div className="mb-8">
          <p className="text-sm font-semibold mb-1" style={{ color: "#333" }}>Select your 4 JAMB subjects</p>
          <p className="text-[0.8125rem] mb-4" style={{ color: "#999" }}>
            Use of English is compulsory for all candidates (60 questions). Choose 3 more subjects (40 questions each).
          </p>

          {/* English locked */}
          <div className="flex items-center gap-3 rounded-xl p-4 mb-3" style={{ background: "#fff", border: "1.5px solid #8b5cf6" }}>
            <div className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: "#8b5cf6" }}>
              <Check className="h-3.5 w-3.5 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold" style={{ color: "#111" }}>Use of English</p>
              <p className="text-[0.75rem]" style={{ color: "#999" }}>60 questions · Compulsory for all candidates</p>
            </div>
          </div>

          {/* Other subjects */}
          <div className="grid grid-cols-2 gap-1.5">
            {otherSubjects.map((s) => {
              const isSelected = mockSubjects.includes(s.value);
              const disabled = !isSelected && mockSubjects.length >= 3;
              return (
                <button key={s.value} onClick={() => toggle(s.value)}
                  className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                  style={{ background: "#fff", border: `1.5px solid ${isSelected ? "#8b5cf6" : "#eee"}`, opacity: disabled ? 0.3 : 1, cursor: disabled ? "not-allowed" : "pointer" }}>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: isSelected ? "#8b5cf6" : "#f5f5f5", border: isSelected ? "none" : "1px solid #eee" }}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: isSelected ? "#5b21b6" : "#444" }}>{s.label}</p>
                    <p className="text-[0.6875rem]" style={{ color: "#bbb" }}>40 questions</p>
                  </div>
                </button>
              );
            })}
          </div>

          {!canStart && (
            <p className="text-sm mt-3" style={{ color: "#f59e0b" }}>
              Select {3 - mockSubjects.length} more subject{3 - mockSubjects.length !== 1 ? "s" : ""} to continue
            </p>
          )}
        </div>

        {/* Summary */}
        {canStart && (
          <div style={{ animation: "fadeSlideUp 0.25s ease" }}>
            {/* Selected summary */}
            <div className="rounded-2xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-sm font-bold mb-2" style={{ color: "#111" }}>Your exam lineup</p>
              <div className="space-y-1.5">
                {["USE_OF_ENGLISH", ...mockSubjects].map((s, i) => (
                  <div key={s} className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.6875rem] font-bold w-4" style={{ fontFamily: "var(--font-mono)", color: "#bbb" }}>{i + 1}</span>
                      <p className="text-sm" style={{ color: "#333" }}>{ALL_SUBJECTS.find((a) => a.value === s)?.label}</p>
                    </div>
                    <span className="text-[0.8125rem] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#8b5cf6" }}>
                      {s === "USE_OF_ENGLISH" ? 60 : 40} Qs
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-2 mt-1" style={{ borderTop: "1px solid #f3f3f3" }}>
                  <p className="text-sm font-bold" style={{ color: "#111" }}>Total</p>
                  <span className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "#111" }}>180 Qs · 120 min</span>
                </div>
              </div>
            </div>

            {/* Info */}
            <div className="rounded-xl p-3.5 mb-4 flex items-start gap-3" style={{ background: "#fff", border: "1px solid #eee" }}>
              <Info className="h-4 w-4 shrink-0 mt-0.5" style={{ color: "#bbb" }} />
              <div>
                <p className="text-[0.8125rem] leading-relaxed" style={{ color: "#888" }}>
                  A basic calculator (addition, subtraction, multiplication, division only) will be available during the exam. No scientific calculator functions just like the real JAMB.
                </p>
              </div>
            </div>

            <button onClick={handleStart} disabled={starting}
              className="w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: "#111", color: "#fff" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#222"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#111"; }}>
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><Play className="h-4 w-4" style={{ color: "#8b5cf6" }} /> Begin Mock Exam</>
              )}
            </button>
            <p className="text-center text-[0.8125rem] mt-3" style={{ color: "#bbb" }}>
              Treat this like the real thing. Find a quiet space. Put your phone away. Let's see what you're made of.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}