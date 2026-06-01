"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import { JAMB_SUBJECTS } from "@/lib/data/nigerian-states";
import { QuestionEditor, type QuestionData } from "@/components/admin/question-editor";

interface Question {
  id: string;
  subject: string;
  topicId: string;
  subtopicId?: string;
  body: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
  explanation?: string;
  difficulty: string;
  year: number | null;
  imageUrl: string | null;
  isActive: boolean;
  topic: { name: string };
  subtopic?: { name: string } | null;
  totalAttempts: number;
  correctRate: number | null;
}

interface TopicOption {
  id: string;
  name: string;
  _count: { questions: number };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

function toEditorData(q: Question): QuestionData {
  return {
    id: q.id,
    subject: q.subject,
    topicId: q.topicId,
    subtopicId: q.subtopicId,
    year: q.year,
    body: q.body,
    imageUrl: q.imageUrl,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    correctOption: q.correctOption,
    explanation: q.explanation,
    difficulty: q.difficulty,
    isActive: q.isActive,
  };
}

export default function AdminQuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1, limit: 20, total: 0, totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingData, setEditingData] = useState<QuestionData | null>(null);

  // Filters
  const [filterSubject, setFilterSubject] = useState("");
  const [filterTopic, setFilterTopic] = useState("");
  const [filterDifficulty, setFilterDifficulty] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [topicOptions, setTopicOptions] = useState<TopicOption[]>([]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!filterSubject) {
      setTopicOptions([]);
      setFilterTopic("");
      return;
    }
    async function loadTopics() {
      try {
        const res = await fetch(`/api/admin/topics?subject=${filterSubject}`);
        const data = await res.json();
        setTopicOptions(data || []);
      } catch {
        setTopicOptions([]);
      }
    }
    loadTopics();
    setFilterTopic(""); // reset topic when subject changes
  }, [filterSubject]);

  const fetchQuestions = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (filterSubject) params.set("subject", filterSubject);
      if (filterTopic) params.set("topicId", filterTopic);
      if (filterDifficulty) params.set("difficulty", filterDifficulty);
      if (searchDebounced) params.set("search", searchDebounced);

      const res = await fetch(`/api/admin/questions?${params}`);
      const data = await res.json();
      setQuestions(data.questions || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
    } catch {
      console.error("Failed to fetch questions");
    } finally {
      setLoading(false);
    }
  }, [filterSubject, filterTopic, filterDifficulty, searchDebounced]);

  useEffect(() => { fetchQuestions(1); }, [fetchQuestions]);

const handleDelete = async (id: string) => {
  if (!confirm("Delete this question? All student responses for this question will also be deleted. This cannot be undone.")) return;
  try {
    const res = await fetch(`/api/admin/questions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Failed to delete");
      return;
    }
    fetchQuestions(pagination.page);
  } catch {
    alert("Network error — failed to delete");
  }
};

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await fetch(`/api/admin/questions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      fetchQuestions(pagination.page);
    } catch { alert("Failed to update"); }
  };

  const handleEditorClose = (saved: boolean) => {
    setShowEditor(false);
    setEditingData(null);
    if (saved) fetchQuestions(pagination.page);
  };

  const getDifficultyStyle = (d: string) => {
    if (d === "EASY") return { color: "var(--color-accent-green)", bg: "rgba(34, 197, 94, 0.1)" };
    if (d === "HARD") return { color: "var(--color-danger-400)", bg: "rgba(239, 68, 68, 0.1)" };
    return { color: "var(--color-warning-400)", bg: "rgba(245, 158, 11, 0.1)" };
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
            Question Bank
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            {pagination.total} questions total
          </p>
        </div>
        <button
          onClick={() => { setEditingData(null); setShowEditor(true); }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </button>
      </div>

      {/* Filters */}
      <div
        className="mb-6 p-4 rounded-xl space-y-3"
        style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}
      >
        {/* Row 1: Search */}
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--color-text-muted)" }}
          />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions..."
            className="input-field pl-10"
          />
        </div>

        {/* Row 2: Subject + Topic + Difficulty */}
        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
            className="input-field sm:flex-1"
            style={{ appearance: "none" }}
          >
            <option value="">All subjects</option>
            {JAMB_SUBJECTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select
            value={filterTopic}
            onChange={(e) => setFilterTopic(e.target.value)}
            className="input-field sm:flex-1"
            style={{ appearance: "none", opacity: filterSubject ? 1 : 0.5 }}
            disabled={!filterSubject}
          >
            <option value="">All topics</option>
            {topicOptions.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t._count.questions})
              </option>
            ))}
          </select>

          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="input-field sm:w-36"
            style={{ appearance: "none" }}
          >
            <option value="">All levels</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </select>
        </div>

        {/* Active filter pills */}
        {(filterSubject || filterTopic || filterDifficulty || searchDebounced) && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Filters:</span>
            {filterSubject && (
              <button
                onClick={() => setFilterSubject("")}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] transition-colors"
                style={{
                  background: "rgba(34, 197, 94, 0.1)",
                  color: "var(--color-accent-green)",
                  border: "1px solid rgba(34, 197, 94, 0.2)",
                }}
              >
                {JAMB_SUBJECTS.find((s) => s.value === filterSubject)?.label || filterSubject}
                <span style={{ marginLeft: "2px" }}>×</span>
              </button>
            )}
            {filterTopic && (
              <button
                onClick={() => setFilterTopic("")}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] transition-colors"
                style={{
                  background: "rgba(59, 130, 246, 0.1)",
                  color: "var(--color-info-400)",
                  border: "1px solid rgba(59, 130, 246, 0.2)",
                }}
              >
                {topicOptions.find((t) => t.id === filterTopic)?.name || "Topic"}
                <span style={{ marginLeft: "2px" }}>×</span>
              </button>
            )}
            {filterDifficulty && (
              <button
                onClick={() => setFilterDifficulty("")}
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.625rem] transition-colors"
                style={{
                  background: getDifficultyStyle(filterDifficulty).bg,
                  color: getDifficultyStyle(filterDifficulty).color,
                  border: `1px solid ${getDifficultyStyle(filterDifficulty).color}30`,
                }}
              >
                {filterDifficulty}
                <span style={{ marginLeft: "2px" }}>×</span>
              </button>
            )}
            <button
              onClick={() => { setFilterSubject(""); setFilterTopic(""); setFilterDifficulty(""); setSearchQuery(""); }}
              className="text-[0.625rem] hover:underline"
              style={{ color: "var(--color-text-muted)" }}
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      ) : questions.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            No questions found. {filterSubject || filterTopic ? "Try different filters or " : ""}Add your first one.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {questions.map((q) => {
            const diffStyle = getDifficultyStyle(q.difficulty);
            return (
              <div
                key={q.id}
                className="rounded-xl p-4 transition-all"
                style={{
                  background: "var(--color-surface-card)",
                  border: "1px solid var(--color-surface-border)",
                  opacity: q.isActive ? 1 : 0.5,
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-relaxed line-clamp-2" style={{ color: "var(--color-text-primary)" }}>
                      {q.body}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="badge badge-green" style={{ fontSize: "0.625rem" }}>{q.topic.name}</span>
                      <span
                        className="badge"
                        style={{ fontSize: "0.625rem", background: diffStyle.bg, color: diffStyle.color, border: `1px solid ${diffStyle.color}30` }}
                      >
                        {q.difficulty}
                      </span>
                      {q.year && <span className="badge badge-muted" style={{ fontSize: "0.625rem" }}>{q.year}</span>}
                      {q.imageUrl && <ImageIcon className="h-3 w-3" style={{ color: "var(--color-info-400)" }} />}
                      {q.totalAttempts > 0 && (
                        <span className="text-[0.625rem]" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>
                          {q.totalAttempts} attempts · {q.correctRate !== null ? `${Math.round(q.correctRate * 100)}%` : "—"} correct
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => { setEditingData(toEditorData(q)); setShowEditor(true); }} className="btn-ghost" style={{ padding: "0.375rem" }} title="Edit">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => handleToggleActive(q.id, q.isActive)} className="btn-ghost" style={{ padding: "0.375rem" }} title={q.isActive ? "Deactivate" : "Activate"}>
                      {q.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </button>
                    <button onClick={() => handleDelete(q.id)} className="btn-ghost" style={{ padding: "0.375rem", color: "var(--color-danger-400)" }} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
            Page {pagination.page} of {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <button onClick={() => fetchQuestions(pagination.page - 1)} disabled={pagination.page <= 1} className="btn-secondary" style={{ padding: "0.5rem 0.75rem", opacity: pagination.page <= 1 ? 0.3 : 1 }}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button onClick={() => fetchQuestions(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages} className="btn-secondary" style={{ padding: "0.5rem 0.75rem", opacity: pagination.page >= pagination.totalPages ? 0.3 : 1 }}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {showEditor && <QuestionEditor question={editingData} onClose={handleEditorClose} />}
    </div>
  );
}