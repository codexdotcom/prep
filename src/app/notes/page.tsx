"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, BookOpen, Zap, Loader2, ChevronRight, Upload, X,
  FileText, CheckCircle2, Sparkles, Eye, Bookmark,
  Headphones, PenLine, Gamepad2, ImageIcon,
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

const LEARNING_STYLES = [
  {
    id: "visual",
    label: "Visual",
    desc: "Diagrams, charts, and mind maps",
    icon: ImageIcon,
  },
  {
    id: "auditory",
    label: "Audio",
    desc: "Listen and learn with AI narration",
    icon: Headphones,
  },
  {
    id: "reading",
    label: "Read/Write",
    desc: "Detailed text with summaries",
    icon: PenLine,
  },
  {
    id: "kinesthetic",
    label: "Interactive",
    desc: "Practice questions woven into notes",
    icon: Gamepad2,
  },
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
  learningStyle?: string;
  views: number;
  viewed: boolean;
  createdAt: string;
}

interface UploadedFile {
  id: string;
  filename: string;
  processed: boolean;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

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
  const [genStyle, setGenStyle] = useState("reading");
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedId, setGeneratedId] = useState<string | null>(null);

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
    fetch(`/api/admin/topics?subject=${genSubject}`)
      .then((r) => r.json()).then((d) => setTopics(d || []))
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
        body: JSON.stringify({
          subject: genSubject,
          topicId: genTopicId,
          learningStyle: genStyle,
          uploadIds: uploads.map((u) => u.id),
        }),
      });
      const data = await res.json();
      if (res.ok) { setGeneratedId(data.id); fetchNotes(); }
      else alert(data.error || "Generation failed");
    } catch { alert("Network error"); }
    finally { setGenerating(false); }
  };

  const styleIcon = (style?: string) => {
    const cfg = LEARNING_STYLES.find((s) => s.id === style);
    return cfg ? cfg.icon : PenLine;
  };

  const NoteCard = ({ note }: { note: NoteItem }) => {
    const StyleIcon = styleIcon(note.learningStyle);
    return (
      <button onClick={() => router.push(`/notes/${note.id}`)}
        className="w-full text-left rounded-xl p-4 transition-all group"
        style={{ background: "#fff", border: "1px solid #eee" }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#ccc"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "#eee"; }}>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: "#f5f5f5" }}>
            <StyleIcon className="h-5 w-5" style={{ color: "#555" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: "#111" }}>{note.topicName}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs" style={{ color: "#888" }}>{fmt(note.subject)}</span>
              <span className="text-xs" style={{ color: "#ccc" }}>·</span>
              <span className="text-xs" style={{ color: "#888" }}>{note.questionCount} questions analyzed</span>
              {note.learningStyle && (
                <>
                  <span className="text-xs" style={{ color: "#ccc" }}>·</span>
                  <span className="text-xs capitalize" style={{ color: "#aaa" }}>{note.learningStyle}</span>
                </>
              )}
            </div>
            {note.summary && (
              <p className="text-xs mt-2 line-clamp-2 leading-relaxed" style={{ color: "#777" }}>{note.summary}</p>
            )}
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 mt-1 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: "#bbb" }} />
        </div>
      </button>
    );
  };

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#666" }}>
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "#111" }}>Smart Notes</span>
          <div className="w-8" />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-0.5 rounded-xl" style={{ background: "#f0f0f0" }}>
          {[
            { key: "browse" as const, label: "All Notes", icon: BookOpen },
            { key: "saved" as const, label: "Saved", icon: Bookmark },
            { key: "generate" as const, label: "Generate", icon: Sparkles },
          ].map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className="flex items-center gap-1.5 flex-1 justify-center rounded-lg py-2.5 text-xs font-semibold transition-all"
              style={{
                background: tab === key ? "#fff" : "transparent",
                color: tab === key ? "#111" : "#999",
                boxShadow: tab === key ? "0 1px 3px rgba(0,0,0,0.06)" : "none",
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
              className="w-full rounded-xl py-3 px-4 text-sm mb-4"
              style={{ background: "#fff", border: "1px solid #eee", color: "#333", outline: "none", appearance: "none" }}>
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
            </select>

            {browseLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#888" }} /></div>
            ) : notes.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <BookOpen className="mx-auto mb-3 h-6 w-6" style={{ color: "#ddd" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "#111" }}>No notes yet</p>
                <p className="text-xs mb-4" style={{ color: "#888" }}>Generate your first AI study note</p>
                <button onClick={() => setTab("generate")} className="rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>
                  Generate Notes
                </button>
              </div>
            ) : (
              <div className="space-y-2">{notes.map((n) => <NoteCard key={n.id} note={n} />)}</div>
            )}
          </>
        )}

        {/* ═══ SAVED ═══ */}
        {tab === "saved" && (
          <>
            {savedLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "#888" }} /></div>
            ) : savedNotes.length === 0 ? (
              <div className="rounded-xl p-8 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <Bookmark className="mx-auto mb-3 h-6 w-6" style={{ color: "#ddd" }} />
                <p className="text-sm font-semibold mb-1" style={{ color: "#111" }}>No saved notes</p>
                <p className="text-xs" style={{ color: "#888" }}>Bookmark notes while reading to find them here</p>
              </div>
            ) : (
              <div className="space-y-2">{savedNotes.map((n) => <NoteCard key={n.id} note={n} />)}</div>
            )}
          </>
        )}

        {/* ═══ GENERATE ═══ */}
        {tab === "generate" && (
          <>
            <div className="rounded-xl p-5 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <h2 className="text-sm font-bold mb-1" style={{ color: "#111" }}>Generate AI Study Notes</h2>
              <p className="text-xs mb-5" style={{ color: "#888" }}>
                The AI analyzes real JAMB questions to create notes covering only what the exam actually tests. Choose how you learn best.
              </p>

              {/* Subject */}
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2" style={{ color: "#333" }}>Subject</p>
                <select value={genSubject} onChange={(e) => setGenSubject(e.target.value)}
                  className="w-full rounded-xl py-3 px-4 text-sm"
                  style={{ background: "#fafafa", border: "1px solid #eee", color: "#333", outline: "none", appearance: "none" }}>
                  <option value="">Select subject</option>
                  {SUBJECTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>

              {/* Topic */}
              <div className="mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color: "#333" }}>Topic</p>
                <select value={genTopicId} onChange={(e) => setGenTopicId(e.target.value)}
                  className="w-full rounded-xl py-3 px-4 text-sm"
                  style={{ background: "#fafafa", border: "1px solid #eee", color: "#333", outline: "none", appearance: "none", opacity: genSubject ? 1 : 0.5 }}
                  disabled={!genSubject}>
                  <option value="">Select topic</option>
                  {topics.map((t) => (<option key={t.id} value={t.id}>{t.name} ({t._count.questions} questions)</option>))}
                </select>
              </div>

              {/* Learning style */}
              <div className="mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color: "#333" }}>How do you learn best?</p>
                <div className="grid grid-cols-2 gap-2">
                  {LEARNING_STYLES.map((style) => {
                    const Icon = style.icon;
                    const isSelected = genStyle === style.id;
                    return (
                      <button key={style.id} onClick={() => setGenStyle(style.id)}
                        className="flex items-start gap-3 rounded-xl p-3 text-left transition-all"
                        style={{ background: isSelected ? "#111" : "#fafafa", border: `1.5px solid ${isSelected ? "#111" : "#eee"}` }}>
                        <Icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: isSelected ? "#fff" : "#888" }} />
                        <div>
                          <p className="text-xs font-bold" style={{ color: isSelected ? "#fff" : "#333" }}>{style.label}</p>
                          <p className="text-[0.625rem] mt-0.5 leading-relaxed" style={{ color: isSelected ? "#999" : "#aaa" }}>{style.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Uploads */}
              <div className="mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color: "#333" }}>Reference materials <span style={{ color: "#bbb" }}>(optional)</span></p>
                {uploads.length > 0 && (
                  <div className="space-y-1.5 mb-2">
                    {uploads.map((u) => (
                      <div key={u.id} className="flex items-center gap-2 rounded-lg p-2.5" style={{ background: "#fafafa", border: "1px solid #eee" }}>
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: u.processed ? "#22c55e" : "#f59e0b" }} />
                        <span className="text-xs flex-1 truncate" style={{ color: "#555" }}>{u.filename}</span>
                        <button onClick={() => setUploads((p) => p.filter((f) => f.id !== u.id))} style={{ color: "#bbb" }}><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 rounded-xl py-4 cursor-pointer transition-all"
                  style={{ background: "#fafafa", border: "2px dashed #ddd", color: "#999" }}>
                  {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  <span className="text-xs">{uploading ? "Uploading..." : "Upload image, PDF, or text file"}</span>
                  <input type="file" accept="image/*,.pdf,.txt" onChange={handleUpload} className="hidden" disabled={uploading || !genSubject} />
                </label>
              </div>

              <button onClick={handleGenerate} disabled={generating || !genSubject || !genTopicId}
                className="w-full rounded-xl py-3 text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                style={{ background: "#111", color: "#fff", opacity: (!genSubject || !genTopicId) ? 0.4 : 1 }}>
                {generating ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>) : (<><Sparkles className="h-4 w-4" /> Generate {LEARNING_STYLES.find((s) => s.id === genStyle)?.label} Notes</>)}
              </button>
            </div>

            {/* What each style includes */}
            <div className="rounded-xl p-4 mb-4" style={{ background: "#fff", border: "1px solid #eee" }}>
              <p className="text-xs font-bold mb-3" style={{ color: "#333" }}>What each style generates</p>
              <div className="space-y-3">
                {[
                  { style: "Visual", items: "Diagrams, flowcharts, comparison tables, labeled illustrations, mind maps. Best for spatial thinkers who remember what things look like." },
                  { style: "Audio", items: "AI-narrated explanations you can listen to while commuting or relaxing. Includes key phrase repetition and mnemonic audio cues." },
                  { style: "Read/Write", items: "Detailed written notes with summaries, key definitions, structured outlines, and fill-in-the-blank exercises." },
                  { style: "Interactive", items: "Notes with embedded practice questions after each section. Solve as you learn. The AI adjusts difficulty based on your answers." },
                ].map((s) => (
                  <div key={s.style}>
                    <p className="text-xs font-semibold" style={{ color: "#222" }}>{s.style}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "#888" }}>{s.items}</p>
                  </div>
                ))}
              </div>
            </div>

            {generatedId && (
              <div className="rounded-xl p-5 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8" style={{ color: "#22c55e" }} />
                <p className="text-sm font-bold" style={{ color: "#111" }}>Notes generated</p>
                <button onClick={() => router.push(`/notes/${generatedId}`)}
                  className="mt-3 rounded-xl px-5 py-2.5 text-sm font-semibold" style={{ background: "#111", color: "#fff" }}>
                  Read Notes
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}