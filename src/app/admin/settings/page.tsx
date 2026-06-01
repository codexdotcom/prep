"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  BookOpen,
  Hash,
  ChevronDown,
  Save,
  AlertTriangle,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

interface Topic {
  id: string;
  name: string;
  subject: string;
  slug: string;
  description: string | null;
  weight: number;
  sortOrder: number;
  subtopics: Array<{ id: string; name: string }>;
  _count: { questions: number };
}

export default function AdminSettingsPage() {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(false);

  // New topic form
  const [showNewForm, setShowNewForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newWeight, setNewWeight] = useState(1.0);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWeight, setEditWeight] = useState(1.0);
  const [saving, setSaving] = useState(false);

  // Delete state
  const [deleteError, setDeleteError] = useState("");

  const fetchTopics = useCallback(async () => {
    if (!selectedSubject) { setTopics([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/topics?subject=${selectedSubject}`);
      const data = await res.json();
      setTopics(data || []);
    } catch {
      console.error("Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, [selectedSubject]);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  const handleCreate = async () => {
    if (!newName.trim() || !selectedSubject) return;
    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/admin/topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: selectedSubject,
          name: newName.trim(),
          description: newDescription.trim() || null,
          weight: newWeight,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setCreateError(data.error || "Failed to create");
        return;
      }

      setNewName("");
      setNewDescription("");
      setNewWeight(1.0);
      setShowNewForm(false);
      fetchTopics();
    } catch {
      setCreateError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (id: string) => {
    setSaving(true);
    try {
      await fetch(`/api/admin/topics/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          description: editDescription || null,
          weight: editWeight,
        }),
      });
      setEditingId(null);
      fetchTopics();
    } catch {
      alert("Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete topic "${name}"?`)) return;
    setDeleteError("");

    try {
      const res = await fetch(`/api/admin/topics/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.error || "Failed to delete");
        return;
      }

      fetchTopics();
    } catch {
      setDeleteError("Network error");
    }
  };

  const startEdit = (topic: Topic) => {
    setEditingId(topic.id);
    setEditName(topic.name);
    setEditDescription(topic.description || "");
    setEditWeight(topic.weight);
  };

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h1
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.5rem",
          color: "var(--color-text-primary)",
          marginBottom: "0.5rem",
        }}
      >
        Topic Management
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--color-text-tertiary)" }}>
        Add, edit, and organize topics for each subject. Topics are used to categorize questions and track student performance.
      </p>

      {/* Subject selector */}
      <div className="mb-6">
        <label className="label">Select a subject to manage its topics</label>
        <select
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
          className="input-field"
          style={{ appearance: "none", maxWidth: "320px" }}
        >
          <option value="">Choose subject...</option>
          {JAMB_SUBJECTS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {!selectedSubject && (
        <div className="card text-center py-12">
          <BookOpen className="mx-auto mb-3 h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Select a subject above to see and manage its topics
          </p>
        </div>
      )}

      {selectedSubject && (
        <>
          {/* Header + Add button */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Hash className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
              <h2 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {formatSubject(selectedSubject)} Topics
              </h2>
              <span
                className="badge badge-muted"
                style={{ fontSize: "0.625rem" }}
              >
                {topics.length}
              </span>
            </div>

            <button
              onClick={() => { setShowNewForm(true); setCreateError(""); }}
              className="btn-primary"
              style={{ padding: "0.5rem 0.875rem", fontSize: "0.8125rem" }}
            >
              <Plus className="h-3.5 w-3.5" />
              Add Topic
            </button>
          </div>

          {/* Delete error */}
          {deleteError && (
            <div
              className="rounded-lg px-4 py-3 text-sm mb-4 flex items-start gap-2"
              style={{
                background: "rgba(239, 68, 68, 0.1)",
                border: "1px solid rgba(239, 68, 68, 0.2)",
                color: "var(--color-danger-400)",
              }}
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
              {deleteError}
              <button onClick={() => setDeleteError("")} className="ml-auto shrink-0">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* New topic form */}
          {showNewForm && (
            <div
              className="card mb-4 p-4"
              style={{
                borderColor: "rgba(34, 197, 94, 0.3)",
                animation: "var(--animate-slide-up)",
              }}
            >
              <p className="text-sm font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>
                New Topic for {formatSubject(selectedSubject)}
              </p>

              {createError && (
                <div
                  className="rounded-lg px-3 py-2 text-xs mb-3"
                  style={{
                    background: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    color: "var(--color-danger-400)",
                  }}
                >
                  {createError}
                </div>
              )}

              <div className="space-y-3">
                <div>
                  <label className="label">Topic name *</label>
                  <input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Quadratic Equations"
                    className="input-field"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="label">Description (optional)</label>
                  <input
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Brief description of what this topic covers"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label">
                    Weight
                    <span className="ml-1" style={{ fontWeight: 400, color: "var(--color-text-muted)" }}>
                      (how often this appears in JAMB — 1.0 = normal)
                    </span>
                  </label>
                  <input
                    type="number"
                    value={newWeight}
                    onChange={(e) => setNewWeight(parseFloat(e.target.value) || 1.0)}
                    step={0.1}
                    min={0.1}
                    max={3.0}
                    className="input-field"
                    style={{ maxWidth: "120px" }}
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => { setShowNewForm(false); setCreateError(""); }}
                    className="btn-secondary"
                    style={{ fontSize: "0.8125rem" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating || !newName.trim()}
                    className="btn-primary"
                    style={{ fontSize: "0.8125rem", opacity: newName.trim() ? 1 : 0.4 }}
                  >
                    {creating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                    Create Topic
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Topics list */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
            </div>
          ) : topics.length === 0 ? (
            <div className="card text-center py-12">
              <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                No topics yet for {formatSubject(selectedSubject)}. Add your first one above.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {topics.map((topic, index) => {
                const isEditing = editingId === topic.id;

                return (
                  <div
                    key={topic.id}
                    className="rounded-xl p-4 transition-all"
                    style={{
                      background: "var(--color-surface-card)",
                      border: `1px solid ${isEditing ? "rgba(34, 197, 94, 0.3)" : "var(--color-surface-border)"}`,
                    }}
                  >
                    {isEditing ? (
                      /* Edit mode */
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label">Name</label>
                            <input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="input-field"
                              autoFocus
                            />
                          </div>
                          <div>
                            <label className="label">Weight</label>
                            <input
                              type="number"
                              value={editWeight}
                              onChange={(e) => setEditWeight(parseFloat(e.target.value) || 1.0)}
                              step={0.1}
                              min={0.1}
                              max={3.0}
                              className="input-field"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">Description</label>
                          <input
                            value={editDescription}
                            onChange={(e) => setEditDescription(e.target.value)}
                            placeholder="Optional description"
                            className="input-field"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingId(null)}
                            className="btn-ghost"
                            style={{ fontSize: "0.75rem" }}
                          >
                            <X className="h-3.5 w-3.5" /> Cancel
                          </button>
                          <button
                            onClick={() => handleUpdate(topic.id)}
                            disabled={saving}
                            className="btn-primary"
                            style={{ fontSize: "0.75rem" }}
                          >
                            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Display mode */
                      <div className="flex items-start gap-3">
                        {/* Sort order indicator */}
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.625rem] font-bold mt-0.5"
                          style={{
                            fontFamily: "var(--font-mono)",
                            background: "var(--color-surface-lighter)",
                            color: "var(--color-text-muted)",
                          }}
                        >
                          {index + 1}
                        </span>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                              {topic.name}
                            </p>
                            <span
                              className="badge badge-green"
                              style={{ fontSize: "0.5625rem" }}
                            >
                              {topic._count.questions} question{topic._count.questions !== 1 ? "s" : ""}
                            </span>
                            {topic.weight !== 1.0 && (
                              <span
                                className="text-[0.5625rem]"
                                style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}
                              >
                                ×{topic.weight}
                              </span>
                            )}
                          </div>

                          {topic.description && (
                            <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
                              {topic.description}
                            </p>
                          )}

                          {topic.subtopics.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {topic.subtopics.map((st) => (
                                <span
                                  key={st.id}
                                  className="text-[0.5625rem] rounded-full px-2 py-0.5"
                                  style={{
                                    background: "var(--color-surface-lighter)",
                                    color: "var(--color-text-muted)",
                                    border: "1px solid var(--color-surface-border)",
                                  }}
                                >
                                  {st.name}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEdit(topic)}
                            className="btn-ghost"
                            style={{ padding: "0.375rem" }}
                            title="Edit"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(topic.id, topic.name)}
                            className="btn-ghost"
                            style={{ padding: "0.375rem", color: "var(--color-danger-400)" }}
                            title={topic._count.questions > 0 ? "Can't delete — has questions" : "Delete"}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Summary */}
          {topics.length > 0 && (
            <div
              className="mt-6 rounded-xl p-4 flex items-center justify-between"
              style={{
                background: "var(--color-surface-light)",
                border: "1px solid var(--color-surface-border)",
              }}
            >
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                {topics.length} topic{topics.length !== 1 ? "s" : ""} ·{" "}
                {topics.reduce((sum, t) => sum + t._count.questions, 0)} total questions
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                Avg weight: {(topics.reduce((sum, t) => sum + t.weight, 0) / topics.length).toFixed(1)}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}