"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  X,
  Save,
  Loader2,
  Upload,
  Trash2,
  Bold,
  Italic,
  Subscript,
  Superscript,
  CheckCircle2,
  AlertTriangle,
  Eye,
  EyeOff,
  Divide,
  Pi,
  Sigma,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";
import katex from "katex";
import "katex/dist/katex.min.css";

interface Topic {
  id: string;
  name: string;
  subject: string;
  subtopics: Array<{ id: string; name: string }>;
  _count: { questions: number };
}

export interface QuestionData {
  id?: string;
  subject: string;
  topicId: string;
  subtopicId?: string;
  year?: number | null;
  questionNumber?: number | null;
  body: string;
  imageUrl?: string | null;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
  difficulty: string;
  isActive: boolean;
}

interface QuestionEditorProps {
  question: QuestionData | null;
  onClose: (saved: boolean) => void;
}

// ─── Math shortcuts ───
const MATH_TEMPLATES = [
  { label: "Fraction", insert: "\\frac{a}{b}", icon: Divide, tip: "Fraction: \\frac{numerator}{denominator}" },
  { label: "Sqrt", insert: "\\sqrt{x}", icon: null, tip: "Square root: \\sqrt{x}" },
  { label: "Power", insert: "x^{n}", icon: Superscript, tip: "Power: x^{2} or x^{n}" },
  { label: "Subscript", insert: "x_{n}", icon: Subscript, tip: "Subscript: x_{1}" },
  { label: "Sum", insert: "\\sum_{i=1}^{n}", icon: Sigma, tip: "Summation" },
  { label: "Pi", insert: "\\pi", icon: Pi, tip: "Pi constant" },
  { label: "Theta", insert: "\\theta", icon: null, tip: "Theta" },
  { label: "Integral", insert: "\\int_{a}^{b}", icon: null, tip: "Integral" },
  { label: "Infinity", insert: "\\infty", icon: null, tip: "Infinity" },
  { label: "NotEqual", insert: "\\neq", icon: null, tip: "Not equal" },
  { label: "LessEq", insert: "\\leq", icon: null, tip: "Less than or equal" },
  { label: "GreatEq", insert: "\\geq", icon: null, tip: "Greater than or equal" },
  { label: "PlusMinus", insert: "\\pm", icon: null, tip: "Plus-minus" },
  { label: "Times", insert: "\\times", icon: null, tip: "Multiplication" },
  { label: "Div", insert: "\\div", icon: null, tip: "Division" },
  { label: "Arrow", insert: "\\rightarrow", icon: null, tip: "Right arrow" },
  { label: "Degree", insert: "^{\\circ}", icon: null, tip: "Degree symbol" },
  { label: "log", insert: "\\log_{b}", icon: null, tip: "Logarithm" },
  { label: "sin", insert: "\\sin", icon: null, tip: "Sine" },
  { label: "cos", insert: "\\cos", icon: null, tip: "Cosine" },
  { label: "tan", insert: "\\tan", icon: null, tip: "Tangent" },
];

// Render inline math using $...$ and display math using $$...$$
function renderMathPreview(text: string): string {
  if (!text) return "";

  // Replace display math $$...$$ first
  let result = text.replace(/\$\$(.+?)\$\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false });
    } catch {
      return `<span style="color:red">[math error]</span>`;
    }
  });

  // Replace inline math $...$
  result = result.replace(/\$(.+?)\$/g, (_, math) => {
    try {
      return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false });
    } catch {
      return `<span style="color:red">[math error]</span>`;
    }
  });

  // Basic markdown
  result = result.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  result = result.replace(/\*(.+?)\*/g, "<em>$1</em>");
  result = result.replace(/\n/g, "<br/>");

  return result;
}

export function QuestionEditor({ question, onClose }: QuestionEditorProps) {
  const isEditing = !!question?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(question?.imageUrl || null);
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showMathPalette, setShowMathPalette] = useState(false);
  const [activeMathField, setActiveMathField] = useState<string>("body");

  const [form, setForm] = useState<QuestionData>({
    subject: question?.subject || "",
    topicId: question?.topicId || "",
    subtopicId: question?.subtopicId || "",
    year: question?.year || null,
    questionNumber: question?.questionNumber || null,
    body: question?.body || "",
    imageUrl: question?.imageUrl || null,
    optionA: question?.optionA || "",
    optionB: question?.optionB || "",
    optionC: question?.optionC || "",
    optionD: question?.optionD || "",
    correctOption: question?.correctOption || "A",
    explanation: question?.explanation || "",
    difficulty: question?.difficulty || "MEDIUM",
    isActive: question?.isActive ?? true,
  });

  useEffect(() => {
    if (!form.subject) { setTopics([]); return; }
    async function fetchTopics() {
      const res = await fetch(`/api/admin/topics?subject=${form.subject}`);
      const data = await res.json();
      setTopics(data);
    }
    fetchTopics();
  }, [form.subject]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); attemptClose(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty]);

  const updateField = (field: keyof QuestionData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const attemptClose = useCallback(() => {
    if (isDirty) setShowCloseConfirm(true);
    else onClose(false);
  }, [isDirty, onClose]);

  const confirmClose = () => { setShowCloseConfirm(false); onClose(false); };

  const insertAtCursor = (fieldId: string, fieldKey: keyof QuestionData, text: string) => {
    const textarea = document.getElementById(fieldId) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = (form[fieldKey] as string) || "";
    const before = current.substring(0, start);
    const after = current.substring(end);
    const newVal = `${before}$${text}$${after}`;
    updateField(fieldKey, newVal);

    requestAnimationFrame(() => {
      textarea.focus();
      const cursorPos = start + text.length + 2; // +2 for the $ signs
      textarea.setSelectionRange(cursorPos, cursorPos);
    });
  };

  const insertFormat = (field: string, fieldKey: keyof QuestionData, format: string) => {
    const textarea = document.getElementById(field) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = (form[fieldKey] as string) || "";
    const selected = text.substring(start, end);
    let wrapped = "";
    switch (format) {
      case "bold": wrapped = `**${selected || "text"}**`; break;
      case "italic": wrapped = `*${selected || "text"}*`; break;
      case "inlinemath": wrapped = `$${selected || "x^2"}$`; break;
      case "displaymath": wrapped = `$$${selected || "\\frac{a}{b}"}$$`; break;
    }
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    updateField(fieldKey, newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapped.length, start + wrapped.length);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError("");
    try {
      const reader = new FileReader();
      reader.onload = (ev) => setImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Upload failed"); setImagePreview(null); return; }
      updateField("imageUrl", data.url);
    } catch { setError("Upload failed"); setImagePreview(null); }
    finally { setUploading(false); }
  };

  const removeImage = () => { updateField("imageUrl", null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; };

  const handleSave = async () => {
    setSaving(true); setError("");
    if (!form.subject || !form.topicId || !form.body || !form.optionA) {
      setError("Fill in all required fields (subject, topic, question, and at least option A)");
      setSaving(false); return;
    }
    try {
      const url = isEditing ? `/api/admin/questions/${question!.id}` : "/api/admin/questions";
      const res = await fetch(url, { method: isEditing ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const data = await res.json(); setError(data.details?.join(", ") || data.error || "Save failed"); return; }
      setIsDirty(false); onClose(true);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const selectedTopic = topics.find((t) => t.id === form.topicId);

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${Math.max(target.scrollHeight, 42)}px`;
  };

  // Math toolbar component
  const MathToolbar = ({ fieldId, fieldKey }: { fieldId: string; fieldKey: keyof QuestionData }) => (
    <div
      className="flex items-center gap-1 mb-1.5 p-1 rounded-lg flex-wrap"
      style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}
    >
      <button type="button" onClick={() => insertFormat(fieldId, fieldKey, "bold")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem", fontSize: "0.625rem" }} title="Bold">
        <Bold className="h-3 w-3" />
      </button>
      <button type="button" onClick={() => insertFormat(fieldId, fieldKey, "italic")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem", fontSize: "0.625rem" }} title="Italic">
        <Italic className="h-3 w-3" />
      </button>

      <div style={{ width: "1px", height: "16px", background: "var(--color-surface-border)", margin: "0 2px" }} />

      <button type="button" onClick={() => insertFormat(fieldId, fieldKey, "inlinemath")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem", fontSize: "0.625rem" }} title="Inline math: $x^2$">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem" }}>$x$</span>
      </button>
      <button type="button" onClick={() => insertFormat(fieldId, fieldKey, "displaymath")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem", fontSize: "0.625rem" }} title="Display math: $$\\frac{a}{b}$$">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem" }}>$$</span>
      </button>

      <div style={{ width: "1px", height: "16px", background: "var(--color-surface-border)", margin: "0 2px" }} />

      {/* Quick math inserts */}
      <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "\\frac{}{}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Fraction">
        <Divide className="h-3 w-3" />
      </button>
      <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "\\sqrt{}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Square root">
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5625rem" }}>sqrt</span>
      </button>
      <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "x^{2}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Superscript">
        <Superscript className="h-3 w-3" />
      </button>
      <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "x_{n}")} className="btn-ghost" style={{ padding: "0.25rem 0.375rem" }} title="Subscript">
        <Subscript className="h-3 w-3" />
      </button>

      {/* Math palette toggle */}
      <button
        type="button"
        onClick={() => { setActiveMathField(fieldId); setShowMathPalette(!showMathPalette || activeMathField !== fieldId); }}
        className="btn-ghost"
        style={{
          padding: "0.25rem 0.375rem",
          background: showMathPalette && activeMathField === fieldId ? "rgba(34,197,94,0.1)" : undefined,
          color: showMathPalette && activeMathField === fieldId ? "var(--color-accent-green)" : undefined,
        }}
        title="More math symbols"
      >
        <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.625rem" }}>fx</span>
      </button>

      {/* Preview toggle */}
      <button
        type="button"
        onClick={() => setShowPreview(!showPreview)}
        className="btn-ghost ml-auto"
        style={{
          padding: "0.25rem 0.375rem",
          color: showPreview ? "var(--color-accent-green)" : undefined,
        }}
        title={showPreview ? "Hide preview" : "Show preview"}
      >
        {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
      </button>
    </div>
  );

  // Math palette dropdown
  const MathPalette = ({ fieldId, fieldKey }: { fieldId: string; fieldKey: keyof QuestionData }) => {
    if (!showMathPalette || activeMathField !== fieldId) return null;

    return (
      <div
        className="mb-2 p-2 rounded-lg grid grid-cols-5 gap-1"
        style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}
      >
        {MATH_TEMPLATES.map((t) => (
          <button
            key={t.label}
            type="button"
            onClick={() => { insertAtCursor(fieldId, fieldKey, t.insert); setShowMathPalette(false); }}
            className="rounded-lg p-1.5 text-center transition-all"
            style={{ background: "transparent", fontSize: "0.5625rem", color: "var(--color-text-tertiary)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-card)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            title={t.tip}
          >
            <div
              className="mb-0.5 text-center"
              style={{ minHeight: "18px" }}
              dangerouslySetInnerHTML={{
                __html: (() => {
                  try { return katex.renderToString(t.insert, { throwOnError: false }); }
                  catch { return t.insert; }
                })(),
              }}
            />
            <span className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>{t.label}</span>
          </button>
        ))}
      </div>
    );
  };

  // Preview panel
  const PreviewPanel = ({ text, label }: { text: string; label: string }) => {
    if (!showPreview || !text) return null;
    return (
      <div
        className="mt-1.5 rounded-lg p-3"
        style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}
      >
        <p className="text-[0.5rem] uppercase tracking-wider mb-1.5" style={{ color: "var(--color-text-muted)" }}>
          {label} Preview
        </p>
        <div
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-primary)" }}
          dangerouslySetInnerHTML={{ __html: renderMathPreview(text) }}
        />
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={(e) => { if (e.target === e.currentTarget) attemptClose(); }}
      >
        <div
          className="w-full max-w-2xl rounded-2xl"
          style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", boxShadow: "var(--shadow-elevated)", animation: "var(--animate-scale-in)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid var(--color-surface-border)" }}>
            <div className="flex items-center gap-2">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
                {isEditing ? "Edit Question" : "New Question"}
              </h2>
              {isDirty && (
                <span className="text-[0.5625rem] rounded-full px-2 py-0.5" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning-400)", border: "1px solid rgba(245,158,11,0.2)" }}>
                  Unsaved
                </span>
              )}
            </div>
            <button onClick={attemptClose} className="btn-ghost" style={{ padding: "0.25rem" }}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="rounded-lg px-4 py-3 text-sm" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-danger-400)" }}>
                {error}
              </div>
            )}

            {/* Math syntax hint */}
            <div className="rounded-lg px-3 py-2 text-[0.625rem]" style={{ background: "rgba(34,197,94,0.04)", border: "1px solid rgba(34,197,94,0.1)", color: "var(--color-text-muted)" }}>
              Use <code style={{ background: "var(--color-surface-lighter)", padding: "1px 4px", borderRadius: "3px", color: "var(--color-accent-green)" }}>$...$</code> for inline math and <code style={{ background: "var(--color-surface-lighter)", padding: "1px 4px", borderRadius: "3px", color: "var(--color-accent-green)" }}>$$...$$</code> for display math. Example: <code style={{ background: "var(--color-surface-lighter)", padding: "1px 4px", borderRadius: "3px" }}>$\frac&#123;1&#125;&#123;2&#125;$</code> renders as a fraction.
            </div>

            {/* Subject + Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Subject *</label>
                <select value={form.subject} onChange={(e) => { updateField("subject", e.target.value); updateField("topicId", ""); }} className="input-field" style={{ appearance: "none" }}>
                  <option value="">Select subject</option>
                  {JAMB_SUBJECTS.map((s) => (<option key={s.value} value={s.value}>{s.label}</option>))}
                </select>
              </div>
              <div>
                <label className="label">Topic *</label>
                <select value={form.topicId} onChange={(e) => updateField("topicId", e.target.value)} className="input-field" style={{ appearance: "none", opacity: form.subject ? 1 : 0.5 }} disabled={!form.subject}>
                  <option value="">Select topic</option>
                  {topics.map((t) => (<option key={t.id} value={t.id}>{t.name} ({t._count.questions})</option>))}
                </select>
              </div>
            </div>

            {/* Subtopic + Year + Difficulty */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedTopic && selectedTopic.subtopics.length > 0 && (
                <div>
                  <label className="label">Subtopic</label>
                  <select value={form.subtopicId || ""} onChange={(e) => updateField("subtopicId", e.target.value || undefined)} className="input-field" style={{ appearance: "none" }}>
                    <option value="">None</option>
                    {selectedTopic.subtopics.map((st) => (<option key={st.id} value={st.id}>{st.name}</option>))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Year</label>
                <input type="number" value={form.year || ""} onChange={(e) => updateField("year", e.target.value ? parseInt(e.target.value) : null)} placeholder="e.g. 2023" className="input-field" min={1990} max={2030} />
              </div>
              <div>
                <label className="label">Difficulty *</label>
                <div className="flex gap-1">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((d) => {
                    const isSelected = form.difficulty === d;
                    const colors = { EASY: "var(--color-accent-green)", MEDIUM: "var(--color-warning-400)", HARD: "var(--color-danger-400)" };
                    return (
                      <button key={d} type="button" onClick={() => updateField("difficulty", d)} className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                        style={{ background: isSelected ? `${colors[d]}15` : "var(--color-surface-light)", border: `1.5px solid ${isSelected ? colors[d] : "var(--color-surface-border)"}`, color: isSelected ? colors[d] : "var(--color-text-tertiary)" }}>
                        {d.charAt(0) + d.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question body */}
            <div>
              <label className="label">Question *</label>
              <MathToolbar fieldId="field-body" fieldKey="body" />
              <MathPalette fieldId="field-body" fieldKey="body" />
              <textarea id="field-body" value={form.body} onChange={(e) => updateField("body", e.target.value)} onInput={autoResize}
                placeholder="Type your question here... Use $...$ for math" rows={4} className="input-field"
                style={{ resize: "vertical", lineHeight: "1.6", minHeight: "100px", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
                onFocus={() => setActiveMathField("field-body")}
              />
              <PreviewPanel text={form.body} label="Question" />
            </div>

            {/* Image upload */}
            <div>
              <label className="label">Image (optional)</label>
              {imagePreview ? (
                <div className="relative rounded-xl overflow-hidden" style={{ background: "var(--color-surface-lighter)", border: "1px solid var(--color-surface-border)" }}>
                  <img src={imagePreview} alt="" className="mx-auto max-h-48 object-contain p-3" />
                  <button type="button" onClick={removeImage} className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg" style={{ background: "rgba(239,68,68,0.9)", color: "white" }}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-6 transition-all"
                  style={{ background: "var(--color-surface-light)", border: "2px dashed var(--color-surface-border)", color: "var(--color-text-tertiary)" }}>
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (<><Upload className="h-4 w-4" /><span className="text-xs">Upload image</span></>)}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* Options */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label" style={{ marginBottom: 0 }}>Options *</label>
                <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>
                  Click letter = correct | Use $...$ for math
                </p>
              </div>
              <div className="space-y-3">
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const fieldKey = `option${key}` as "optionA" | "optionB" | "optionC" | "optionD";
                  const fieldId = `field-option${key}`;
                  const isCorrect = form.correctOption === key;

                  return (
                    <div key={key}>
                      <div className="flex items-start gap-2">
                        <button type="button" onClick={() => updateField("correctOption", key)}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all mt-1"
                          style={{
                            background: isCorrect ? "var(--color-accent-green)" : "var(--color-surface-lighter)",
                            color: isCorrect ? "var(--color-surface)" : "var(--color-text-muted)",
                            border: `1.5px solid ${isCorrect ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                            fontFamily: "var(--font-mono)",
                          }}
                          title={isCorrect ? "Correct answer" : "Mark as correct"}>
                          {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : key}
                        </button>
                        <div className="flex-1">
                          {/* Mini toolbar for options */}
                          <div className="flex items-center gap-0.5 mb-1">
                            <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "\\frac{}{}")} className="btn-ghost" style={{ padding: "1px 3px" }} title="Fraction">
                              <Divide className="h-2.5 w-2.5" style={{ opacity: 0.5 }} />
                            </button>
                            <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "\\sqrt{}")} className="btn-ghost" style={{ padding: "1px 3px" }} title="Square root">
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", opacity: 0.5 }}>sqrt</span>
                            </button>
                            <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "x^{2}")} className="btn-ghost" style={{ padding: "1px 3px" }} title="Superscript">
                              <Superscript className="h-2.5 w-2.5" style={{ opacity: 0.5 }} />
                            </button>
                            <button type="button" onClick={() => insertAtCursor(fieldId, fieldKey, "x_{n}")} className="btn-ghost" style={{ padding: "1px 3px" }} title="Subscript">
                              <Subscript className="h-2.5 w-2.5" style={{ opacity: 0.5 }} />
                            </button>
                            <button type="button" onClick={() => { setActiveMathField(fieldId); setShowMathPalette(!showMathPalette || activeMathField !== fieldId); }} className="btn-ghost" style={{ padding: "1px 3px" }} title="More symbols">
                              <span style={{ fontFamily: "var(--font-mono)", fontSize: "0.5rem", opacity: 0.5 }}>fx</span>
                            </button>
                          </div>
                          {activeMathField === fieldId && <MathPalette fieldId={fieldId} fieldKey={fieldKey} />}
                          <textarea id={fieldId} value={(form as any)[fieldKey]} onChange={(e) => updateField(fieldKey, e.target.value)} onInput={autoResize}
                            placeholder={`Option ${key}... (use $...$ for math)`} rows={1} className="input-field"
                            style={{
                              resize: "vertical", lineHeight: "1.5", minHeight: "42px",
                              fontFamily: "var(--font-mono)", fontSize: "0.8125rem",
                              borderColor: isCorrect ? "rgba(34,197,94,0.3)" : undefined,
                              background: isCorrect ? "rgba(34,197,94,0.04)" : undefined,
                            }}
                            onFocus={() => setActiveMathField(fieldId)}
                          />
                          {showPreview && (form as any)[fieldKey] && (
                            <div className="mt-1 rounded-md px-2 py-1.5" style={{ background: "var(--color-surface)", border: "1px solid var(--color-surface-border)" }}>
                              <div className="text-xs" style={{ color: "var(--color-text-primary)" }}
                                dangerouslySetInnerHTML={{ __html: renderMathPreview((form as any)[fieldKey]) }} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            <div>
              <label className="label">Explanation</label>
              <MathToolbar fieldId="field-explanation" fieldKey="explanation" />
              {activeMathField === "field-explanation" && <MathPalette fieldId="field-explanation" fieldKey="explanation" />}
              <textarea id="field-explanation" value={form.explanation || ""} onChange={(e) => updateField("explanation", e.target.value)} onInput={autoResize}
                placeholder="Explain why the correct answer is right... Use $...$ for math" rows={3} className="input-field"
                style={{ resize: "vertical", lineHeight: "1.6", minHeight: "80px", fontFamily: "var(--font-mono)", fontSize: "0.8125rem" }}
                onFocus={() => setActiveMathField("field-explanation")}
              />
              <PreviewPanel text={form.explanation || ""} label="Explanation" />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isActive} onChange={(e) => updateField("isActive", e.target.checked)} className="h-4 w-4 rounded accent-green-500" />
              <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Active</span>
            </label>
            <div className="flex gap-2">
              <button onClick={attemptClose} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                {isEditing ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Close confirmation */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6 text-center" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)", boxShadow: "var(--shadow-elevated)", animation: "var(--animate-scale-in)" }}>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl" style={{ background: "rgba(245,158,11,0.1)" }}>
              <AlertTriangle className="h-6 w-6" style={{ color: "var(--color-warning-400)" }} />
            </div>
            <h3 className="mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>Unsaved Changes</h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>You have unsaved changes. Are you sure you want to close?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowCloseConfirm(false)} className="btn-secondary flex-1">Keep Editing</button>
              <button onClick={confirmClose} className="flex-1 rounded-xl py-2.5 text-sm font-semibold" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-danger-400)" }}>
                Discard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}