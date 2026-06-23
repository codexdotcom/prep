"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Loader2, Zap, Calendar, Users, X, Search, Check,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

interface Challenge {
  id: string;
  date: string;
  subject: string;
  topicName: string | null;
  title: string;
  description: string;
  questionCount: number;
  questionIds: string[];
  difficulty: string;
  timeLimit: number;
  xpReward: number;
  bonusXP: number;
  attempts: number;
}

interface TopicOption { id: string; name: string; _count: { questions: number } }
interface QuestionOption { id: string; body: string; difficulty: string; topic: { name: string } }

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export default function AdminChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 1);
    return d.toISOString().split("T")[0];
  });
  const [formSubject, setFormSubject] = useState("");
  const [formTopicId, setFormTopicId] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDifficulty, setFormDifficulty] = useState("MEDIUM");
  const [formTimeLimit, setFormTimeLimit] = useState(300);
  const [formXpReward, setFormXpReward] = useState(50);
  const [formBonusXP, setFormBonusXP] = useState(25);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [questions, setQuestions] = useState<QuestionOption[]>([]);
  const [questionsLoading, setQuestionsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [questionSearch, setQuestionSearch] = useState("");

  const fetchChallenges = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/challenges");
      const data = await res.json();
      setChallenges(Array.isArray(data) ? data : []);
    } catch { setChallenges([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchChallenges(); }, [fetchChallenges]);

  // Load topics when subject changes
  useEffect(() => {
    if (!formSubject) { setTopics([]); setFormTopicId(""); return; }
    fetch(`/api/admin/topics?subject=${formSubject}`)
      .then((r) => r.json()).then((d) => setTopics(Array.isArray(d) ? d : []))
      .catch(() => setTopics([]));
    setFormTopicId("");
    setSelectedQuestionIds([]);
  }, [formSubject]);

  // Load questions when subject or topic changes
  useEffect(() => {
    if (!formSubject) { setQuestions([]); return; }
    setQuestionsLoading(true);
    const params = new URLSearchParams({ subject: formSubject, limit: "200" });
    if (formTopicId) params.set("topicId", formTopicId);
    fetch(`/api/admin/questions?${params}`)
      .then((r) => r.json()).then((d) => setQuestions(d.questions || []))
      .catch(() => setQuestions([]))
      .finally(() => setQuestionsLoading(false));
  }, [formSubject, formTopicId]);

  const toggleQuestion = (id: string) => {
    setSelectedQuestionIds((prev) => prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]);
  };

  const handleCreate = async () => {
    if (!formDate || !formSubject || !formTitle || selectedQuestionIds.length === 0) {
      alert("Fill in date, subject, title, and select at least one question.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: formDate,
          subject: formSubject,
          topicId: formTopicId || null,
          title: formTitle,
          description: formDescription,
          questionIds: selectedQuestionIds,
          difficulty: formDifficulty,
          timeLimit: formTimeLimit,
          xpReward: formXpReward,
          bonusXP: formBonusXP,
        }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || "Failed to create"); return; }
      setShowForm(false);
      resetForm();
      fetchChallenges();
    } catch { alert("Network error"); }
    finally { setSaving(false); }
  };

  const resetForm = () => {
    setFormSubject(""); setFormTopicId(""); setFormTitle(""); setFormDescription("");
    setFormDifficulty("MEDIUM"); setFormTimeLimit(300); setFormXpReward(50); setFormBonusXP(25);
    setSelectedQuestionIds([]); setQuestionSearch("");
    const d = new Date(); d.setDate(d.getDate() + 1); setFormDate(d.toISOString().split("T")[0]);
  };

  const filteredQuestions = questions.filter((q) =>
    !questionSearch || q.body.toLowerCase().includes(questionSearch.toLowerCase()) || q.topic.name.toLowerCase().includes(questionSearch.toLowerCase())
  );

  const getDiffStyle = (d: string) => {
    if (d === "EASY") return { color: "var(--color-accent-green)", bg: "rgba(34,197,94,0.1)" };
    if (d === "HARD") return { color: "var(--color-danger-400)", bg: "rgba(239,68,68,0.1)" };
    return { color: "var(--color-warning-400)", bg: "rgba(245,158,11,0.1)" };
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>Daily Challenges</h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>{challenges.length} challenge{challenges.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary">
          <Plus className="h-4 w-4" /> Create Challenge
        </button>
      </div>

      {/* Existing challenges */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      ) : challenges.length === 0 ? (
        <div className="card text-center py-12">
          <Zap className="mx-auto mb-3 h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>No challenges yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {challenges.map((c) => {
            const isPast = new Date(c.date) < new Date(new Date().toDateString());
            const isToday = new Date(c.date).toDateString() === new Date().toDateString();
            const ds = getDiffStyle(c.difficulty);
            return (
              <div key={c.id} className="rounded-xl p-4" style={{ background: "var(--color-surface-card)", border: `1px solid ${isToday ? "var(--color-accent-green)" : "var(--color-surface-border)"}`, opacity: isPast ? 0.6 : 1 }}>
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{c.title}</p>
                      {isToday && <span className="text-[0.5625rem] font-semibold rounded-md px-1.5 py-0.5" style={{ background: "rgba(34,197,94,0.1)", color: "var(--color-accent-green)" }}>Today</span>}
                    </div>
                    {c.description && <p className="text-xs mb-2" style={{ color: "var(--color-text-tertiary)" }}>{c.description}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                        <Calendar className="inline h-3 w-3 mr-1" style={{ verticalAlign: "-2px" }} />
                        {new Date(c.date).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                      <span className="badge badge-green" style={{ fontSize: "0.625rem" }}>{fmt(c.subject)}</span>
                      {c.topicName && <span className="badge badge-muted" style={{ fontSize: "0.625rem" }}>{c.topicName}</span>}
                      <span className="badge" style={{ fontSize: "0.625rem", background: ds.bg, color: ds.color, border: `1px solid ${ds.color}30` }}>{c.difficulty}</span>
                      <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>{c.questionCount} Qs</span>
                      <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>{Math.floor(c.timeLimit / 60)}min</span>
                      <span className="text-[0.625rem]" style={{ color: "var(--color-warning-400)" }}>{c.xpReward} XP</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{c.attempts}</p>
                    <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>attempts</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create challenge modal */}
      {showForm && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40" onClick={() => setShowForm(false)} />
          <div className="fixed inset-x-4 top-8 bottom-8 z-50 mx-auto max-w-2xl overflow-y-auto rounded-2xl"
            style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
            <div className="sticky top-0 z-10 flex items-center justify-between px-5 py-4"
              style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)" }}>
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Create Daily Challenge</h2>
              <button onClick={() => setShowForm(false)} className="btn-ghost" style={{ padding: "0.375rem" }}><X className="h-4 w-4" /></button>
            </div>

            <div className="p-5 space-y-5">
              {/* Date */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Date</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} className="input-field" />
              </div>

              {/* Title + Description */}
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Title</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="e.g. Physics Speed Round" className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Description (optional)</label>
                <input value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Short description for students" className="input-field" />
              </div>

              {/* Subject + Topic */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Subject</label>
                  <select value={formSubject} onChange={(e) => setFormSubject(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                    <option value="">Select subject</option>
                    {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Topic (optional)</label>
                  <select value={formTopicId} onChange={(e) => setFormTopicId(e.target.value)} className="input-field" style={{ appearance: "none" }} disabled={!formSubject}>
                    <option value="">All topics</option>
                    {topics.map((t) => <option key={t.id} value={t.id}>{t.name} ({t._count.questions})</option>)}
                  </select>
                </div>
              </div>

              {/* Difficulty + Time + XP */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Difficulty</label>
                  <select value={formDifficulty} onChange={(e) => setFormDifficulty(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                    <option value="EASY">Easy</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HARD">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Time (sec)</label>
                  <input type="number" value={formTimeLimit} onChange={(e) => setFormTimeLimit(parseInt(e.target.value) || 300)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>XP Reward</label>
                  <input type="number" value={formXpReward} onChange={(e) => setFormXpReward(parseInt(e.target.value) || 50)} className="input-field" />
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1.5 block" style={{ color: "var(--color-text-secondary)" }}>Bonus XP</label>
                  <input type="number" value={formBonusXP} onChange={(e) => setFormBonusXP(parseInt(e.target.value) || 25)} className="input-field" />
                </div>
              </div>

              {/* Question selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
                    Select Questions ({selectedQuestionIds.length} selected)
                  </label>
                  {selectedQuestionIds.length > 0 && (
                    <button onClick={() => setSelectedQuestionIds([])} className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Clear</button>
                  )}
                </div>

                {!formSubject ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>Select a subject first to see questions.</p>
                ) : questionsLoading ? (
                  <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
                ) : (
                  <>
                    {questions.length > 5 && (
                      <div className="relative mb-2">
                        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                        <input value={questionSearch} onChange={(e) => setQuestionSearch(e.target.value)} placeholder="Search questions..."
                          className="input-field pl-9" style={{ fontSize: "0.75rem" }} />
                      </div>
                    )}
                    <div className="max-h-60 overflow-y-auto space-y-1 rounded-lg p-1" style={{ background: "var(--color-surface)" }}>
                      {filteredQuestions.length === 0 ? (
                        <p className="text-xs py-4 text-center" style={{ color: "var(--color-text-muted)" }}>No questions found.</p>
                      ) : filteredQuestions.map((q) => {
                        const isSelected = selectedQuestionIds.includes(q.id);
                        const ds = getDiffStyle(q.difficulty);
                        return (
                          <button key={q.id} onClick={() => toggleQuestion(q.id)}
                            className="w-full flex items-start gap-2 rounded-lg p-2.5 text-left transition-all"
                            style={{ background: isSelected ? "rgba(34,197,94,0.06)" : "var(--color-surface-card)", border: `1px solid ${isSelected ? "rgba(34,197,94,0.2)" : "var(--color-surface-border)"}` }}>
                            <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded mt-0.5"
                              style={{ background: isSelected ? "var(--color-accent-green)" : "var(--color-surface-lighter)", border: isSelected ? "none" : "1px solid var(--color-surface-border)" }}>
                              {isSelected && <Check className="h-2.5 w-2.5 text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs leading-relaxed line-clamp-2" style={{ color: "var(--color-text-primary)" }}>{q.body}</p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{q.topic.name}</span>
                                <span className="text-[0.5625rem] font-semibold" style={{ color: ds.color }}>{q.difficulty}</span>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 flex items-center justify-between px-5 py-4"
              style={{ background: "var(--color-surface-card)", borderTop: "1px solid var(--color-surface-border)" }}>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                {selectedQuestionIds.length} question{selectedQuestionIds.length !== 1 ? "s" : ""} selected
              </p>
              <div className="flex gap-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary">Cancel</button>
                <button onClick={handleCreate} disabled={saving || !formTitle || !formSubject || selectedQuestionIds.length === 0} className="btn-primary"
                  style={{ opacity: (!formTitle || !formSubject || selectedQuestionIds.length === 0) ? 0.4 : 1 }}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Create</>}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}