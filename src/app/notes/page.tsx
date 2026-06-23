"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Loader2, ChevronRight, Upload, X,
  CheckCircle2, Sparkles, Bookmark, Brain,
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

interface TopicOption {
  id: string;
  name: string;
  _count: { questions: number };
}

interface NoteItem {
  id: string;
  title: string;
  subject: string;
  topicName: string;
  summary: string | null;
  questionCount: number;
  difficulty: string;
  views: number;
  viewed: boolean;
  createdAt: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  processed: boolean;
}

type GenStage = "idle" | "analyzing" | "generating" | "saving" | "done";

const fmt = (s: string) =>
  s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const SUBJECT_COLORS: Record<string, string> = {
  MATHEMATICS: "#6366f1",
  PHYSICS: "#8b5cf6",
  CHEMISTRY: "#ec4899",
  BIOLOGY: "#10b981",
  USE_OF_ENGLISH: "#f59e0b",
  LITERATURE: "#f97316",
  GOVERNMENT: "#3b82f6",
  ECONOMICS: "#14b8a6",
  COMMERCE: "#06b6d4",
  ACCOUNTING: "#8b5cf6",
  GEOGRAPHY: "#22c55e",
  AGRICULTURAL_SCIENCE: "#84cc16",
  CRS: "#a855f7",
  IRS: "#a855f7",
};

function getSubjectColor(subject: string): string {
  return SUBJECT_COLORS[subject] || "#6366f1";
}

export default function NotesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"browse" | "saved" | "generate">("browse");

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [browseSubject, setBrowseSubject] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);

  const [savedNotes, setSavedNotes] = useState<NoteItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const [genSubject, setGenSubject] = useState("");
  const [genTopicId, setGenTopicId] = useState("");
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [genStage, setGenStage] = useState<GenStage>("idle");
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  const fetchNotes = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams();
      if (browseSubject) params.set("subject", browseSubject);
      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {
    } finally {
      setBrowseLoading(false);
    }
  }, [browseSubject]);

  const fetchSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/notes/bookmarks");
      const data = await res.json();
      setSavedNotes(data.notes || []);
    } catch {
    } finally {
      setSavedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);
  useEffect(() => {
    if (tab === "saved") fetchSaved();
  }, [tab, fetchSaved]);

  useEffect(() => {
    if (!genSubject) {
      setTopics([]);
      setGenTopicId("");
      return;
    }
    fetch(`/api/admin/topics?subject=${genSubject}`)
      .then((r) => r.json())
      .then((d) => setTopics(d || []))
      .catch(() => setTopics([]));
    setGenTopicId("");
  }, [genSubject]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !genSubject) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("subject", genSubject);
      if (genTopicId) fd.append("topicId", genTopicId);
      const res = await fetch("/api/notes/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok) setUploads((prev) => [...prev, data]);
      else alert(data.error || "Upload failed");
    } catch {
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerate = async () => {
    if (!genSubject || !genTopicId) return;
    setGenStage("analyzing");
    setGeneratedId(null);

    const t1 = setTimeout(() => setGenStage("generating"), 2500);
    const t2 = setTimeout(() => setGenStage("saving"), 10000);

    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: genSubject,
          topicId: genTopicId,
          uploadIds: uploads.map((u) => u.id),
        }),
      });
      const data = await res.json();

      clearTimeout(t1);
      clearTimeout(t2);

      if (res.ok) {
        setGenStage("done");
        setGeneratedId(data.id);
        fetchNotes();
      } else {
        setGenStage("idle");
        alert(data.error || "Generation failed");
      }
    } catch {
      clearTimeout(t1);
      clearTimeout(t2);
      setGenStage("idle");
      alert("Network error. Try again.");
    }
  };

  const NoteCard = ({ note }: { note: NoteItem }) => {
    const color = getSubjectColor(note.subject);
    return (
      <button
        onClick={() => router.push(`/notes/${note.id}`)}
        className="w-full text-left rounded-2xl p-4 transition-all group"
        style={{ background: "#fff", border: "1px solid #eaeaea" }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = color;
          (e.currentTarget as HTMLElement).style.boxShadow = `0 0 0 1px ${color}20`;
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = "#eaeaea";
          (e.currentTarget as HTMLElement).style.boxShadow = "none";
        }}
      >
        <div className="flex items-start gap-3.5">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ background: `${color}10` }}
          >
            <BookOpen className="h-4.5 w-4.5" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[0.9375rem] font-semibold leading-snug" style={{ color: "#1a1a1a" }}>
              {note.topicName}
            </p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span
                className="text-[0.6875rem] font-medium rounded-md px-2 py-0.5"
                style={{ background: `${color}10`, color }}
              >
                {fmt(note.subject)}
              </span>
              
            </div>
            {note.summary && (
              <p
                className="text-xs mt-2.5 line-clamp-2 leading-relaxed"
                style={{ color: "#888" }}
              >
                {note.summary}
              </p>
            )}
          </div>
          <ChevronRight
            className="h-4 w-4 shrink-0 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ color: "#ccc" }}
          />
        </div>
      </button>
    );
  };

  const stageLabels: Record<GenStage, { label: string; sub: string }> = {
    idle: { label: "", sub: "" },
    analyzing: {
      label: "Scanning question bank...",
      sub: "Identifying patterns across JAMB questions",
    },
    generating: {
      label: "Writing your notes...",
      sub: "Creating explanations, examples, and practice questions",
    },
    saving: {
      label: "Almost done...",
      sub: "Extracting key formulas and exam tips",
    },
    done: { label: "Notes ready!", sub: "Your study notes are ready to read" },
  };
  const genStages: GenStage[] = ["analyzing", "generating", "saving", "done"];
  const currentGenIdx = genStages.indexOf(genStage);

  return (
    <div className="min-h-screen pb-12" style={{ background: "#f7f7f8" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "rgba(247,247,248,0.92)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #ebebeb",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-1.5 text-sm"
            style={{ color: "#666" }}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "#1a1a1a" }}>
            Study Notes
          </span>
          <div className="w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Tabs */}
        <div
          className="flex gap-1 mb-6 p-1 rounded-2xl"
          style={{ background: "#ebebeb" }}
        >
          {[
            { key: "browse" as const, label: "All Notes", icon: BookOpen },
            { key: "saved" as const, label: "Saved", icon: Bookmark },
            { key: "generate" as const, label: "Generate", icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex items-center gap-1.5 flex-1 justify-center rounded-xl py-2.5 text-xs font-semibold transition-all"
              style={{
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#1a1a1a" : "#999",
                boxShadow:
                  tab === key ? "0 1px 4px rgba(0,0,0,0.06)" : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══ BROWSE ═══ */}
        {tab === "browse" && (
          <>
            <select
              value={browseSubject}
              onChange={(e) => setBrowseSubject(e.target.value)}
              className="w-full rounded-xl py-3 px-4 text-sm mb-4"
              style={{
                background: "#fff",
                border: "1px solid #e5e5e5",
                color: browseSubject ? "#1a1a1a" : "#999",
                outline: "none",
                appearance: "none",
              }}
            >
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            {browseLoading ? (
              <div className="flex justify-center py-16">
                <Loader2
                  className="h-6 w-6 animate-spin"
                  style={{ color: "#bbb" }}
                />
              </div>
            ) : notes.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "#fff", border: "1px solid #eaeaea" }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "#f0f0f0" }}
                >
                  <BookOpen className="h-6 w-6" style={{ color: "#bbb" }} />
                </div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "#1a1a1a" }}
                >
                  No notes yet
                </p>
                <p className="text-xs mb-5" style={{ color: "#999" }}>
                  Generate your first AI study note from real JAMB questions
                </p>
                <button
                  onClick={() => setTab("generate")}
                  className="rounded-xl px-6 py-2.5 text-sm font-semibold"
                  style={{ background: "#1a1a1a", color: "#fff" }}
                >
                  Generate Notes
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">
                {notes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ SAVED ═══ */}
        {tab === "saved" && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-16">
                <Loader2
                  className="h-6 w-6 animate-spin"
                  style={{ color: "#bbb" }}
                />
              </div>
            ) : savedNotes.length === 0 ? (
              <div
                className="rounded-2xl p-10 text-center"
                style={{ background: "#fff", border: "1px solid #eaeaea" }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "#f0f0f0" }}
                >
                  <Bookmark className="h-6 w-6" style={{ color: "#bbb" }} />
                </div>
                <p
                  className="text-sm font-semibold mb-1"
                  style={{ color: "#1a1a1a" }}
                >
                  No saved notes
                </p>
                <p className="text-xs" style={{ color: "#999" }}>
                  Bookmark notes while reading to find them here
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedNotes.map((n) => (
                  <NoteCard key={n.id} note={n} />
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ GENERATE ═══ */}
        {tab === "generate" && (
          <>
            {/* Processing overlay */}
            {genStage !== "idle" && genStage !== "done" && (
              <div
                className="rounded-2xl p-10 mb-4 text-center"
                style={{ background: "#fff", border: "1px solid #eaeaea" }}
              >
                <div className="relative inline-flex items-center justify-center mb-6">
                  <svg
                    width="76"
                    height="76"
                    viewBox="0 0 76 76"
                    className="animate-spin"
                    style={{ animationDuration: "2.5s" }}
                  >
                    <circle
                      cx="38"
                      cy="38"
                      r="32"
                      fill="none"
                      stroke="#f0f0f0"
                      strokeWidth="3.5"
                    />
                    <circle
                      cx="38"
                      cy="38"
                      r="32"
                      fill="none"
                      stroke="#6366f1"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 32}`}
                      strokeDashoffset={2 * Math.PI * 32 * 0.72}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Brain className="h-5 w-5" style={{ color: "#6366f1" }} />
                  </div>
                </div>
                <p
                  className="text-[0.9375rem] font-semibold mb-1"
                  style={{ color: "#1a1a1a" }}
                >
                  {stageLabels[genStage].label}
                </p>
                <p className="text-xs mb-6" style={{ color: "#999" }}>
                  {stageLabels[genStage].sub}
                </p>
                <div className="flex items-center justify-center gap-2.5">
                  {genStages.slice(0, -1).map((s, i) => (
                    <div key={s} className="flex items-center gap-2.5">
                      <div
                        className="h-2 w-2 rounded-full transition-all"
                        style={{
                          background:
                            i <= currentGenIdx ? "#6366f1" : "#e5e5e5",
                          transform:
                            i === currentGenIdx ? "scale(1.5)" : "scale(1)",
                          transition: "all 0.3s ease",
                        }}
                      />
                      {i < 2 && (
                        <div
                          style={{
                            width: "20px",
                            height: "1.5px",
                            background:
                              i < currentGenIdx ? "#c7d2fe" : "#f0f0f0",
                            transition: "background 0.3s",
                          }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Done state */}
            {genStage === "done" && generatedId && (
              <div
                className="rounded-2xl p-8 mb-4 text-center"
                style={{ background: "#fff", border: "1px solid #eaeaea" }}
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{ background: "#f0fdf4" }}
                >
                  <CheckCircle2
                    className="h-7 w-7"
                    style={{ color: "#22c55e" }}
                  />
                </div>
                <p
                  className="text-[0.9375rem] font-semibold mb-1"
                  style={{ color: "#1a1a1a" }}
                >
                  Notes generated
                </p>
                <p className="text-xs mb-5" style={{ color: "#999" }}>
                  Comprehensive study notes with examples and practice questions
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => router.push(`/notes/${generatedId}`)}
                    className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold"
                    style={{ background: "#1a1a1a", color: "#fff" }}
                  >
                    Read Notes
                  </button>
                  <button
                    onClick={() => {
                      setGenStage("idle");
                      setGeneratedId(null);
                    }}
                    className="flex-1 rounded-xl px-5 py-3 text-sm font-semibold"
                    style={{
                      background: "#f5f5f5",
                      color: "#555",
                      border: "1px solid #eaeaea",
                    }}
                  >
                    Generate More
                  </button>
                </div>
              </div>
            )}

            {/* Form */}
            {genStage === "idle" && !generatedId && (
              <>
                <div
                  className="rounded-2xl p-5 sm:p-6 mb-4"
                  style={{ background: "#fff", border: "1px solid #eaeaea" }}
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-xl"
                      style={{ background: "#eef2ff" }}
                    >
                      <Sparkles
                        className="h-4.5 w-4.5"
                        style={{ color: "#6366f1" }}
                      />
                    </div>
                    <div>
                      <h2
                        className="text-[0.9375rem] font-semibold"
                        style={{ color: "#1a1a1a" }}
                      >
                        Generate Study Notes
                      </h2>
                      <p className="text-xs" style={{ color: "#999" }}>
                        AI analyzes real JAMB questions and creates notes on what
                        actually gets tested
                      </p>
                    </div>
                  </div>

                  {/* Subject */}
                  <div className="mb-4">
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "#555" }}
                    >
                      Subject
                    </p>
                    <select
                      value={genSubject}
                      onChange={(e) => setGenSubject(e.target.value)}
                      className="w-full rounded-xl py-3 px-4 text-sm"
                      style={{
                        background: "#f9f9f9",
                        border: "1px solid #e5e5e5",
                        color: genSubject ? "#1a1a1a" : "#aaa",
                        outline: "none",
                        appearance: "none",
                      }}
                    >
                      <option value="">Select subject</option>
                      {SUBJECTS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Topic */}
                  <div className="mb-5">
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "#555" }}
                    >
                      Topic
                    </p>
                    <select
                      value={genTopicId}
                      onChange={(e) => setGenTopicId(e.target.value)}
                      className="w-full rounded-xl py-3 px-4 text-sm"
                      style={{
                        background: "#f9f9f9",
                        border: "1px solid #e5e5e5",
                        color: genTopicId ? "#1a1a1a" : "#aaa",
                        outline: "none",
                        appearance: "none",
                        opacity: genSubject ? 1 : 0.5,
                      }}
                      disabled={!genSubject}
                    >
                      <option value="">Select topic</option>
                      {topics.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t._count.questions} questions)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Uploads */}
                  <div className="mb-5">
                    <p
                      className="text-xs font-medium mb-2"
                      style={{ color: "#555" }}
                    >
                      Reference materials{" "}
                      <span style={{ color: "#ccc" }}>(optional)</span>
                    </p>
                    {uploads.length > 0 && (
                      <div className="space-y-1.5 mb-2">
                        {uploads.map((u) => (
                          <div
                            key={u.id}
                            className="flex items-center gap-2 rounded-xl p-2.5"
                            style={{
                              background: "#f9f9f9",
                              border: "1px solid #eaeaea",
                            }}
                          >
                            <CheckCircle2
                              className="h-3.5 w-3.5 shrink-0"
                              style={{
                                color: u.processed ? "#22c55e" : "#f59e0b",
                              }}
                            />
                            <span
                              className="text-xs flex-1 truncate"
                              style={{ color: "#555" }}
                            >
                              {u.filename}
                            </span>
                            <button
                              onClick={() =>
                                setUploads((p) =>
                                  p.filter((f) => f.id !== u.id)
                                )
                              }
                              style={{ color: "#ccc" }}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    <label
                      className="flex items-center justify-center gap-2 rounded-xl py-4 cursor-pointer transition-all"
                      style={{
                        background: "#fafafa",
                        border: "2px dashed #e0e0e0",
                        color: "#aaa",
                      }}
                    >
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      <span className="text-xs">
                        {uploading
                          ? "Uploading..."
                          : "Upload image, PDF, or text file"}
                      </span>
                      <input
                        type="file"
                        accept="image/*,.pdf,.txt"
                        onChange={handleUpload}
                        className="hidden"
                        disabled={uploading || !genSubject}
                      />
                    </label>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={!genSubject || !genTopicId}
                    className="w-full rounded-xl py-3.5 text-sm font-semibold flex items-center justify-center gap-2 transition-all"
                    style={{
                      background:
                        !genSubject || !genTopicId ? "#e5e5e5" : "#1a1a1a",
                      color:
                        !genSubject || !genTopicId ? "#aaa" : "#fff",
                    }}
                  >
                    <Sparkles className="h-4 w-4" /> Generate Study Notes
                  </button>
                </div>

                {/* What you get */}
                <div
                  className="rounded-2xl p-5"
                  style={{ background: "#fff", border: "1px solid #eaeaea" }}
                >
                  <p
                    className="text-xs font-semibold mb-3"
                    style={{ color: "#1a1a1a" }}
                  >
                    What the AI generates
                  </p>
                  <div className="space-y-2.5">
                    {[
                      {
                        emoji: "🎯",
                        text: "Concepts focused on what JAMB actually tests, not textbook filler",
                      },
                      {
                        emoji: "📐",
                        text: "Every formula and definition that appears in real questions",
                      },
                      {
                        emoji: "✍️",
                        text: "Step-by-step worked examples mirroring real JAMB patterns",
                      },
                      {
                        emoji: "⚠️",
                        text: "Common traps and why students pick the wrong answer",
                      },
                      {
                        emoji: "📝",
                        text: "Practice questions to test yourself after reading",
                      },
                    ].map((item) => (
                      <div
                        key={item.emoji}
                        className="flex items-start gap-2.5"
                      >
                        <span className="text-sm">{item.emoji}</span>
                        <p
                          className="text-xs leading-relaxed"
                          style={{ color: "#777" }}
                        >
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}