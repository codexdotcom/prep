"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Target, Check, Loader2, Flame, BookOpen, Search, X,
} from "lucide-react";

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

interface Topic { id: string; name: string; _count: { questions: number } }

export default function DrillPage() {
  const router = useRouter();
  const [subject, setSubject] = useState<string | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(false);
  const [count, setCount] = useState(20);
  const [starting, setStarting] = useState(false);
  const [search, setSearch] = useState("");

  const toggle = (id: string) => setSelectedTopics((p) => p.includes(id) ? p.filter((t) => t !== id) : [...p, id]);

  useEffect(() => {
    if (!subject) { setTopics([]); setSelectedTopics([]); return; }
    setTopicsLoading(true); setSelectedTopics([]); setSearch("");
    fetch(`/api/admin/topics?subject=${subject}`)
      .then((r) => r.json()).then((d) => setTopics(Array.isArray(d) ? d : []))
      .catch(() => setTopics([])).finally(() => setTopicsLoading(false));
  }, [subject]);

  const handleStart = async () => {
    if (!subject || selectedTopics.length === 0) return;
    setStarting(true);
    try {
      const res = await fetch("/api/tests/drill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, topicIds: selectedTopics, questionCount: count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      sessionStorage.setItem(`test-${data.sessionId}`, JSON.stringify(data));
      router.push(`/test/${data.sessionId}`);
    } catch (err: any) { alert(err.message || "Failed to start"); setStarting(false); }
  };

  const totalAvailable = selectedTopics.reduce((s, id) => s + (topics.find((t) => t.id === id)?._count?.questions || 0), 0);
  const filtered = topics.filter((t) => !search || t.name.toLowerCase().includes(search.toLowerCase()));
  const canStart = subject && selectedTopics.length > 0;

  return (
    <div className="min-h-screen" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
          <button onClick={() => router.push("/practice")} className="flex items-center gap-1.5 text-sm" style={{ color: "#666" }}><ArrowLeft className="h-4 w-4" /> Back</button>
          <div className="flex items-center gap-1.5">
            <Target className="h-4 w-4" style={{ color: "#f59e0b" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Topic Drill</span>
          </div>
          <div className="w-16" />
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-6 pb-16">
        <div className="mb-8">
          <h1 className="text-xl font-bold mb-2" style={{ fontFamily: "var(--font-display)", color: "#111" }}>Master one topic at a time.</h1>
          <p className="text-sm leading-relaxed" style={{ color: "#555" }}>
            Students who drill specific topics improve 3x faster than those who practice randomly. Pick a subject, choose the exact topics you want to conquer, and go deep.
          </p>
        </div>

        {/* Subject */}
        <div className="mb-6">
          <p className="text-sm font-bold mb-3" style={{ color: "#222" }}>Which subject?</p>
          <div className="grid grid-cols-2 gap-1.5">
            {SUBJECTS.map((s) => {
              const isSelected = subject === s.value;
              return (
                <button key={s.value} onClick={() => setSubject(s.value)}
                  className="flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                  style={{ background: "#fff", border: `1.5px solid ${isSelected ? "#f59e0b" : "#eee"}` }}>
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                    style={{ background: isSelected ? "#f59e0b" : "#f5f5f5", border: isSelected ? "none" : "1px solid #eee" }}>
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: isSelected ? "#92400e" : "#333" }}>{s.label}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Topics */}
        {subject && (
          <div className="mb-6" style={{ animation: "fadeSlideUp 0.25s ease" }}>
            <p className="text-sm font-bold mb-1" style={{ color: "#222" }}>Which topics do you want to attack?</p>
            <p className="text-sm mb-3" style={{ color: "#888" }}>The more specific you are, the faster you improve.</p>

            {topicsLoading ? (
              <div className="flex justify-center py-10"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "#f59e0b" }} /></div>
            ) : topics.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <BookOpen className="mx-auto mb-3 h-7 w-7" style={{ color: "#ddd" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "#222" }}>No topics available yet</p>
                <p className="text-sm" style={{ color: "#888" }}>Questions haven't been added for this subject. Try another one.</p>
              </div>
            ) : (
              <>
                {topics.length > 8 && (
                  <div className="relative mb-3">
                    <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "#bbb" }} />
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search topics..."
                      className="w-full rounded-xl py-3 pl-10 pr-4 text-sm"
                      style={{ background: "#fff", border: "1.5px solid #eee", color: "#222", outline: "none" }}
                      onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#f59e0b"; }}
                      onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#eee"; }} />
                    {search && (
                      <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="h-4 w-4" style={{ color: "#ccc" }} />
                      </button>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm" style={{ color: "#888" }}>
                    {selectedTopics.length} of {topics.length} selected{totalAvailable > 0 && ` · ${totalAvailable} questions`}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedTopics(topics.map((t) => t.id))} className="text-sm font-semibold" style={{ color: "#f59e0b" }}>All</button>
                    {selectedTopics.length > 0 && <button onClick={() => setSelectedTopics([])} className="text-sm font-semibold" style={{ color: "#bbb" }}>Clear</button>}
                  </div>
                </div>

                <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
                  {filtered.map((t) => {
                    const isSelected = selectedTopics.includes(t.id);
                    const qCount = t._count?.questions || 0;
                    return (
                      <button key={t.id} onClick={() => toggle(t.id)}
                        className="w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all"
                        style={{ background: "#fff", border: `1.5px solid ${isSelected ? "#f59e0b" : "#eee"}` }}>
                        <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md"
                          style={{ background: isSelected ? "#f59e0b" : "#f5f5f5", border: isSelected ? "none" : "1px solid #eee" }}>
                          {isSelected && <Check className="h-3 w-3 text-white" />}
                        </div>
                        <p className="flex-1 text-sm font-semibold truncate" style={{ color: isSelected ? "#92400e" : "#222" }}>{t.name}</p>
                        <span className="text-sm shrink-0 tabular-nums" style={{ fontFamily: "var(--font-mono)", color: qCount > 0 ? "#aaa" : "#ddd" }}>{qCount}</span>
                      </button>
                    );
                  })}
                  {filtered.length === 0 && search && (
                    <p className="text-center py-4 text-sm" style={{ color: "#aaa" }}>No topics match "{search}"</p>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* Count */}
        {canStart && (
          <div className="mb-6" style={{ animation: "fadeSlideUp 0.25s ease" }}>
            <p className="text-sm font-bold mb-3" style={{ color: "#222" }}>How many questions?</p>
            <div className="flex gap-2">
              {COUNTS.map((c) => (
                <button key={c} onClick={() => setCount(c)}
                  className="flex-1 rounded-xl py-3.5 text-center text-sm font-bold"
                  style={{ fontFamily: "var(--font-mono)", background: "#fff", border: `1.5px solid ${count === c ? "#f59e0b" : "#eee"}`, color: count === c ? "#92400e" : "#bbb" }}>
                  {c}
                </button>
              ))}
            </div>
            {totalAvailable > 0 && totalAvailable < count && (
              <p className="text-sm mt-2" style={{ color: "#f59e0b" }}>
                {totalAvailable} questions available for these topics. You'll get all of them.
              </p>
            )}
          </div>
        )}

        {/* Start */}
        {canStart && (
          <div style={{ animation: "fadeSlideUp 0.25s ease" }}>
            <div className="rounded-2xl p-4 mb-3" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-sm font-bold mb-0.5" style={{ color: "#111" }}>Ready</p>
              <p className="text-sm" style={{ color: "#666" }}>
                {Math.min(count, totalAvailable || count)} questions · {selectedTopics.length} topic{selectedTopics.length > 1 ? "s" : ""} · {SUBJECTS.find((s) => s.value === subject)?.label} 
              </p>
            </div>

            <button onClick={handleStart} disabled={starting}
              className="w-full rounded-2xl py-4 text-sm font-bold flex items-center justify-center gap-2"
              style={{ background: "#111", color: "#fff" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#111"; }}>
              {starting ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Flame className="h-4 w-4" style={{ color: "#f59e0b" }} /> Start Drilling</>}
            </button>
            <p className="text-center text-sm mt-3" style={{ color: "#aaa" }}>
              Repetition is the mother of mastery.
            </p>
          </div>
        )}
      </div>

      <style jsx global>{`@keyframes fadeSlideUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
}