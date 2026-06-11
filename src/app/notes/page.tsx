"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Zap, Loader2, ChevronRight, Upload, X,
  FileText, CheckCircle2, Sparkles, Clock, Eye, Bookmark,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

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
  hasText: boolean;
  textPreview: string | null;
}

export default function NotesPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"browse" | "saved" | "generate">("browse");

  // Browse
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [browseSubject, setBrowseSubject] = useState("");
  const [browseLoading, setBrowseLoading] = useState(false);

  // Saved
  const [savedNotes, setSavedNotes] = useState<NoteItem[]>([]);
  const [savedLoading, setSavedLoading] = useState(false);

  // Generate
  const [genSubject, setGenSubject] = useState("");
  const [genTopicId, setGenTopicId] = useState("");
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  const fetchNotes = useCallback(async () => {
    setBrowseLoading(true);
    try {
      const params = new URLSearchParams();
      if (browseSubject) params.set("subject", browseSubject);
      const res = await fetch(`/api/notes?${params}`);
      const data = await res.json();
      setNotes(data.notes || []);
    } catch {} finally { setBrowseLoading(false); }
  }, [browseSubject]);

  const fetchSaved = useCallback(async () => {
    setSavedLoading(true);
    try {
      const res = await fetch("/api/notes/bookmarks");
      const data = await res.json();
      setSavedNotes(data.notes || []);
    } catch {} finally { setSavedLoading(false); }
  }, []);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);
  useEffect(() => { if (tab === "saved") fetchSaved(); }, [tab, fetchSaved]);

  useEffect(() => {
    if (!genSubject) { setTopics([]); setGenTopicId(""); return; }
    async function load() {
      const res = await fetch(`/api/admin/topics?subject=${genSubject}`);
      const data = await res.json();
      setTopics(data || []);
    }
    load();
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
    } catch { alert("Upload failed"); }
    finally { setUploading(false); }
  };

  const handleGenerate = async () => {
    if (!genSubject || !genTopicId) return;
    setGenerating(true);
    setGeneratedId(null);
    try {
      const res = await fetch("/api/notes/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: genSubject, topicId: genTopicId, uploadIds: uploads.map((u) => u.id) }),
      });
      const data = await res.json();
      if (res.ok) { setGeneratedId(data.id); fetchNotes(); }
      else alert(data.error || "Generation failed");
    } catch { alert("Network error"); }
    finally { setGenerating(false); }
  };

  const selectedTopic = topics.find((t) => t.id === genTopicId);

  const getDiffColor = (d: string) => d === "HARD" ? "var(--color-danger-400)" : d === "EASY" ? "var(--color-accent-green)" : "var(--color-warning-400)";

  const NoteCard = ({ note }: { note: NoteItem }) => (
    <button
      onClick={() => router.push(`/notes/${note.id}`)}
      className="w-full text-left rounded-2xl p-4 transition-all group"
      style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.25)"; (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)"; (e.currentTarget as HTMLElement).style.transform = "none"; }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(34,197,94,0.06)" }}
        >
          <FileText className="h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {note.topicName}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[0.5625rem] rounded-full px-2 py-0.5"
              style={{ background: "rgba(34,197,94,0.08)", color: "var(--color-accent-green)", border: "1px solid rgba(34,197,94,0.15)" }}>
              {formatSubject(note.subject)}
            </span>
            <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
              {note.questionCount} questions analyzed
            </span>
          </div>
          {note.summary && (
            <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: "var(--color-text-tertiary)" }}>
              {note.summary}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "var(--color-accent-green)" }} />
      </div>
    </button>
  );

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Smart Notes</span>
          </div>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: "var(--color-surface-light)" }}>
          {[
            { key: "browse" as const, label: "All Notes", icon: BookOpen },
            { key: "saved" as const, label: "Saved", icon: Bookmark },
            { key: "generate" as const, label: "Generate", icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 flex-1 justify-center rounded-lg py-2 text-xs font-semibold transition-all"
              style={{
                background: tab === key ? "var(--color-surface-card)" : "transparent",
                color: tab === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                boxShadow: tab === key ? "var(--shadow-card)" : "none",
              }}>
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══ BROWSE ═══ */}
        {tab === "browse" && (
          <>
            <select value={browseSubject} onChange={(e) => setBrowseSubject(e.target.value)}
              className="input-field mb-4" style={{ appearance: "none" }}>
              <option value="">All subjects</option>
              {JAMB_SUBJECTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>

            {browseLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : notes.length === 0 ? (
              <div className="card text-center py-12">
                <BookOpen className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm mb-1" style={{ color: "var(--color-text-primary)" }}>No notes yet</p>
                <p className="text-xs mb-4" style={{ color: "var(--color-text-tertiary)" }}>Generate your first AI study note</p>
                <button onClick={() => setTab("generate")} className="btn-primary" style={{ fontSize: "0.75rem" }}>
                  <Sparkles className="h-3.5 w-3.5" /> Generate Notes
                </button>
              </div>
            ) : (
              <div className="space-y-2.5">{notes.map((n) => <NoteCard key={n.id} note={n} />)}</div>
            )}
          </>
        )}

        {/* ═══ SAVED ═══ */}
        {tab === "saved" && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : savedNotes.length === 0 ? (
              <div className="card text-center py-12">
                <Bookmark className="mx-auto mb-3 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm mb-1" style={{ color: "var(--color-text-primary)" }}>No saved notes</p>
                <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Bookmark notes while reading to find them here</p>
              </div>
            ) : (
              <div className="space-y-2.5">{savedNotes.map((n) => <NoteCard key={n.id} note={n} />)}</div>
            )}
          </>
        )}

        {/* ═══ GENERATE ═══ */}
        {tab === "generate" && (
          <>
            <div className="card p-5 mb-4">
              <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Generate AI Study Notes</h2>
              <p className="text-xs mb-4" style={{ color: "var(--color-text-tertiary)" }}>
                AI analyzes your question bank to create notes covering only what JAMB tests.
              </p>

              <div className="mb-3">
                <label className="label">Subject</label>
                <select value={genSubject} onChange={(e) => setGenSubject(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                  <option value="">Select subject</option>
                  {JAMB_SUBJECTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>

              <div className="mb-4">
                <label className="label">Topic</label>
                <select value={genTopicId} onChange={(e) => setGenTopicId(e.target.value)} className="input-field"
                  style={{ appearance: "none", opacity: genSubject ? 1 : 0.5 }} disabled={!genSubject}>
                  <option value="">Select topic</option>
                  {topics.map((t) => (<option key={t.id} value={t.id}>{t.name} ({t._count.questions} questions)</option>))}
                </select>
              </div>

              {/* Uploads */}
              <div className="mb-4">
                <label className="label">Reference Materials (optional)</label>
                {uploads.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {uploads.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 rounded-lg p-2" style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: u.processed ? "var(--color-accent-green)" : "var(--color-warning-400)" }} />
                        <span className="text-xs flex-1 truncate" style={{ color: "var(--color-text-secondary)" }}>{u.filename}</span>
                        <button onClick={() => setUploads((p) => p.filter((f) => f.id !== u.id))} className="btn-ghost" style={{ padding: "2px" }}><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 rounded-lg py-4 cursor-pointer transition-all"
                  style={{ background: "var(--color-surface-light)", border: "2px dashed var(--color-surface-border)", color: "var(--color-text-tertiary)" }}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-xs">{uploading ? "Uploading..." : "Upload image, PDF, or text file"}</span>
                  <input type="file" accept="image/*,.pdf,.txt" onChange={handleUpload} className="hidden" disabled={uploading || !genSubject} />
                </label>
              </div>

              <button onClick={handleGenerate} disabled={generating || !genSubject || !genTopicId} className="btn-primary w-full"
                style={{ padding: "0.75rem", opacity: (!genSubject || !genTopicId) ? 0.4 : 1 }}>
                {generating ? (<><Loader2 className="h-4 w-4 animate-spin" />Generating...</>) : (<><Sparkles className="h-4 w-4" />Generate Notes</>)}
              </button>
            </div>

            {generatedId && (
              <div className="card p-5 text-center" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Notes Generated</p>
                <button onClick={() => router.push(`/notes/${generatedId}`)} className="btn-primary mt-3">
                  <BookOpen className="h-4 w-4" /> Read Notes
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}