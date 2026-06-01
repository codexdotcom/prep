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
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

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

  // Warn before browser navigation/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Block Escape key from instant-closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        attemptClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDirty]);

  const updateField = (field: keyof QuestionData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const attemptClose = useCallback(() => {
    if (isDirty) {
      setShowCloseConfirm(true);
    } else {
      onClose(false);
    }
  }, [isDirty, onClose]);

  const confirmClose = () => {
    setShowCloseConfirm(false);
    onClose(false);
  };

  const insertFormat = (field: "body" | "optionA" | "optionB" | "optionC" | "optionD" | "explanation", format: string) => {
    const textarea = document.getElementById(`field-${field}`) as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = (form[field] as string) || "";
    const selected = text.substring(start, end);
    let wrapped = "";
    switch (format) {
      case "bold": wrapped = `**${selected || "text"}**`; break;
      case "italic": wrapped = `*${selected || "text"}*`; break;
      case "superscript": wrapped = `^(${selected || "x"})`; break;
      case "subscript": wrapped = `_(${selected || "x"})`; break;
    }
    const newText = text.substring(0, start) + wrapped + text.substring(end);
    updateField(field, newText);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + wrapped.length, start + wrapped.length);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
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

  const removeImage = () => {
    updateField("imageUrl", null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    if (!form.subject || !form.topicId || !form.body || !form.optionA) {
      setError("Fill in all required fields (subject, topic, question, and at least option A)");
      setSaving(false);
      return;
    }
    try {
      const url = isEditing ? `/api/admin/questions/${question!.id}` : "/api/admin/questions";
      const res = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.details?.join(", ") || data.error || "Save failed");
        return;
      }
      setIsDirty(false);
      onClose(true);
    } catch { setError("Network error"); }
    finally { setSaving(false); }
  };

  const selectedTopic = topics.find((t) => t.id === form.topicId);

  const autoResize = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    target.style.height = "auto";
    target.style.height = `${Math.max(target.scrollHeight, 42)}px`;
  };

  return (
    <>
      {/* Main editor overlay */}
      <div
        className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto px-4 py-8"
        style={{ background: "rgba(0, 0, 0, 0.6)", backdropFilter: "blur(4px)" }}
        onClick={(e) => {
          if (e.target === e.currentTarget) attemptClose();
        }}
      >
        <div
          className="w-full max-w-2xl rounded-2xl"
          style={{
            background: "var(--color-surface-card)",
            border: "1px solid var(--color-surface-border)",
            boxShadow: "var(--shadow-elevated)",
            animation: "var(--animate-scale-in)",
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: "1px solid var(--color-surface-border)" }}
          >
            <div className="flex items-center gap-2">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}>
                {isEditing ? "Edit Question" : "New Question"}
              </h2>
              {isDirty && (
                <span
                  className="text-[0.5625rem] rounded-full px-2 py-0.5"
                  style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning-400)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
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
              <div
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--color-danger-400)",
                }}
              >
                {error}
              </div>
            )}

            {/* Subject + Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="label">Subject *</label>
                <select
                  value={form.subject}
                  onChange={(e) => { updateField("subject", e.target.value); updateField("topicId", ""); }}
                  className="input-field"
                  style={{ appearance: "none" }}
                >
                  <option value="">Select subject</option>
                  {JAMB_SUBJECTS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Topic *</label>
                <select
                  value={form.topicId}
                  onChange={(e) => updateField("topicId", e.target.value)}
                  className="input-field"
                  style={{ appearance: "none", opacity: form.subject ? 1 : 0.5 }}
                  disabled={!form.subject}
                >
                  <option value="">Select topic</option>
                  {topics.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} ({t._count.questions})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Subtopic + Year + Difficulty */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {selectedTopic && selectedTopic.subtopics.length > 0 && (
                <div>
                  <label className="label">Subtopic</label>
                  <select
                    value={form.subtopicId || ""}
                    onChange={(e) => updateField("subtopicId", e.target.value || undefined)}
                    className="input-field"
                    style={{ appearance: "none" }}
                  >
                    <option value="">None</option>
                    {selectedTopic.subtopics.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  value={form.year || ""}
                  onChange={(e) => updateField("year", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g. 2023"
                  className="input-field"
                  min={1990} max={2030}
                />
              </div>
              <div>
                <label className="label">Difficulty *</label>
                <div className="flex gap-1">
                  {(["EASY", "MEDIUM", "HARD"] as const).map((d) => {
                    const isSelected = form.difficulty === d;
                    const colors = {
                      EASY: "var(--color-accent-green)",
                      MEDIUM: "var(--color-warning-400)",
                      HARD: "var(--color-danger-400)",
                    };
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateField("difficulty", d)}
                        className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                        style={{
                          background: isSelected ? `${colors[d]}15` : "var(--color-surface-light)",
                          border: `1.5px solid ${isSelected ? colors[d] : "var(--color-surface-border)"}`,
                          color: isSelected ? colors[d] : "var(--color-text-tertiary)",
                        }}
                      >
                        {d.charAt(0) + d.slice(1).toLowerCase()}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Question body with toolbar */}
            <div>
              <label className="label">Question *</label>
              <div
                className="flex items-center gap-1 mb-1.5 p-1 rounded-lg"
                style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}
              >
                {[
                  { icon: Bold, format: "bold", tip: "Bold" },
                  { icon: Italic, format: "italic", tip: "Italic" },
                  { icon: Superscript, format: "superscript", tip: "Superscript (e.g. x²)" },
                  { icon: Subscript, format: "subscript", tip: "Subscript (e.g. H₂O)" },
                ].map(({ icon: Icon, format, tip }) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => insertFormat("body", format)}
                    className="btn-ghost"
                    style={{ padding: "0.375rem" }}
                    title={tip}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
              <textarea
                id="field-body"
                value={form.body}
                onChange={(e) => updateField("body", e.target.value)}
                onInput={autoResize}
                placeholder="Type your question here..."
                rows={4}
                className="input-field"
                style={{ resize: "vertical", lineHeight: "1.6", minHeight: "100px" }}
              />
            </div>

            {/* Image upload */}
            <div>
              <label className="label">Image (optional)</label>
              {imagePreview ? (
                <div
                  className="relative rounded-xl overflow-hidden"
                  style={{ background: "var(--color-surface-lighter)", border: "1px solid var(--color-surface-border)" }}
                >
                  <img src={imagePreview} alt="Question figure" className="mx-auto max-h-48 object-contain p-3" />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-lg"
                    style={{ background: "rgba(239,68,68,0.9)", color: "white" }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-8 transition-all"
                  style={{
                    background: "var(--color-surface-light)",
                    border: "2px dashed var(--color-surface-border)",
                    color: "var(--color-text-tertiary)",
                  }}
                >
                  {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <><Upload className="h-5 w-5" /><span className="text-sm">Click to upload an image</span></>
                  )}
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <p className="text-[0.625rem] mt-1" style={{ color: "var(--color-text-muted)" }}>JPEG, PNG, WebP, GIF, or SVG. Max 5MB.</p>
            </div>

            {/* Options — MULTI-LINE TEXTAREAS */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label" style={{ marginBottom: 0 }}>Options *</label>
                <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                  Click a letter to mark correct · Green = correct answer
                </p>
              </div>
              <div className="space-y-2">
                {(["A", "B", "C", "D"] as const).map((key) => {
                  const fieldKey = `option${key}` as "optionA" | "optionB" | "optionC" | "optionD";
                  const isCorrect = form.correctOption === key;

                  return (
                    <div key={key} className="flex items-start gap-2">
                      <button
                        type="button"
                        onClick={() => updateField("correctOption", key)}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold transition-all mt-1"
                        style={{
                          background: isCorrect ? "var(--color-accent-green)" : "var(--color-surface-lighter)",
                          color: isCorrect ? "var(--color-surface)" : "var(--color-text-muted)",
                          border: `1.5px solid ${isCorrect ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                          fontFamily: "var(--font-mono)",
                        }}
                        title={isCorrect ? "Correct answer" : "Mark as correct"}
                      >
                        {isCorrect ? <CheckCircle2 className="h-4 w-4" /> : key}
                      </button>

                      <div className="flex-1 relative">
                        <textarea
                          id={`field-option${key}`}
                          value={(form as any)[fieldKey]}
                          onChange={(e) => updateField(fieldKey, e.target.value)}
                          onInput={autoResize}
                          placeholder={`Option ${key}...`}
                          rows={1}
                          className="input-field"
                          style={{
                            resize: "vertical",
                            lineHeight: "1.5",
                            minHeight: "42px",
                            paddingRight: "2rem",
                            borderColor: isCorrect ? "rgba(34, 197, 94, 0.3)" : undefined,
                            background: isCorrect ? "rgba(34, 197, 94, 0.04)" : undefined,
                          }}
                        />
                        <div className="absolute top-1 right-1 flex gap-0.5">
                          <button type="button" onClick={() => insertFormat(fieldKey, "superscript")} className="btn-ghost" style={{ padding: "2px", opacity: 0.5 }} title="Superscript">
                            <Superscript className="h-3 w-3" />
                          </button>
                          <button type="button" onClick={() => insertFormat(fieldKey, "subscript")} className="btn-ghost" style={{ padding: "2px", opacity: 0.5 }} title="Subscript">
                            <Subscript className="h-3 w-3" />
                          </button>
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
              <textarea
                id="field-explanation"
                value={form.explanation || ""}
                onChange={(e) => updateField("explanation", e.target.value)}
                onInput={autoResize}
                placeholder="Explain why the correct answer is right..."
                rows={3}
                className="input-field"
                style={{ resize: "vertical", lineHeight: "1.6", minHeight: "80px" }}
              />
            </div>
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderTop: "1px solid var(--color-surface-border)" }}
          >
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => updateField("isActive", e.target.checked)}
                className="h-4 w-4 rounded accent-green-500"
              />
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

      {/* ═══ Close Confirmation Modal ═══ */}
      {showCloseConfirm && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center px-4"
          style={{ background: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(6px)" }}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{
              background: "var(--color-surface-card)",
              border: "1px solid var(--color-surface-border)",
              boxShadow: "var(--shadow-elevated)",
              animation: "var(--animate-scale-in)",
            }}
          >
            <div
              className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl"
              style={{ background: "rgba(245, 158, 11, 0.1)" }}
            >
              <AlertTriangle className="h-6 w-6" style={{ color: "var(--color-warning-400)" }} />
            </div>

            <h3
              className="mb-2"
              style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}
            >
              Unsaved Changes
            </h3>
            <p className="text-sm mb-6" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
              You have unsaved changes. Are you sure you want to close? Your changes will be lost.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseConfirm(false)}
                className="btn-secondary flex-1"
              >
                Keep Editing
              </button>
              <button
                onClick={confirmClose}
                className="flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--color-danger-400)",
                }}
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}