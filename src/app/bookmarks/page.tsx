"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Bookmark, Loader2, Trash2, Video, FileText,
  MessageCircle, Puzzle, Clock, X,
} from "lucide-react";

interface BookmarkItem {
  id: string;
  type: string;
  title: string;
  data: any;
  createdAt: string;
}

const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
  video: { icon: Video, color: "#14b8a6", label: "Video" },
  flashcard: { icon: Puzzle, color: "#0ea5e9", label: "Flashcards" },
  note: { icon: FileText, color: "#ef4444", label: "Note" },
  chat: { icon: MessageCircle, color: "#8b5cf6", label: "Chat" },
};

export default function BookmarksPage() {
  const router = useRouter();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchBookmarks = () => {
    setLoading(true);
    fetch("/api/bookmarks").then((r) => r.json()).then((d) => setBookmarks(Array.isArray(d) ? d : []))
      .catch(() => setBookmarks([])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBookmarks(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this bookmark?")) return;
    await fetch(`/api/bookmarks?id=${id}`, { method: "DELETE" });
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const filtered = bookmarks.filter((b) => !filter || b.type === filter);
  const types = [...new Set(bookmarks.map((b) => b.type))];

  return (
    <div className="min-h-screen pb-12" style={{ background: "#fafafa" }}>
      <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
            <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <Bookmark className="h-4 w-4" style={{ color: "#111" }} />
            <span className="text-sm font-semibold" style={{ color: "#111" }}>Bookmarks</span>
          </div>
          <div style={{ width: 60 }} />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        <div className="mb-6">
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "#111" }}>Saved Items</h1>
          <p className="text-sm mt-1" style={{ color: "#777" }}>{bookmarks.length} bookmark{bookmarks.length !== 1 ? "s" : ""}</p>
        </div>

        {/* Filter tabs */}
        {types.length > 1 && (
          <div className="flex gap-1 mb-6 overflow-x-auto">
            <button onClick={() => setFilter("")}
              className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{ background: !filter ? "#111" : "#fff", color: !filter ? "#fff" : "#555", border: `1px solid ${!filter ? "#111" : "#eee"}` }}>
              All
            </button>
            {types.map((t) => {
              const cfg = typeConfig[t] || { label: t, color: "#555" };
              return (
                <button key={t} onClick={() => setFilter(t)}
                  className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
                  style={{ background: filter === t ? "#111" : "#fff", color: filter === t ? "#fff" : "#555", border: `1px solid ${filter === t ? "#111" : "#eee"}` }}>
                  {cfg.label}
                </button>
              );
            })}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin" style={{ color: "#999" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl" style={{ background: "#fff", border: "1px solid #eee" }}>
            <Bookmark className="mx-auto h-8 w-8 mb-3" style={{ color: "#ddd" }} />
            <p className="text-sm" style={{ color: "#999" }}>
              {bookmarks.length === 0 ? "No bookmarks yet. Save videos, flashcards, and notes to find them here." : "No items match this filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((b) => {
              const cfg = typeConfig[b.type] || { icon: FileText, color: "#555", label: b.type };
              const Icon = cfg.icon;
              return (
                <div key={b.id} className="flex items-center gap-3 rounded-xl p-4 transition-all"
                  style={{ background: "#fff", border: "1px solid #eee" }}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0" style={{ background: `${cfg.color}10` }}>
                    <Icon className="h-5 w-5" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#111" }}>{b.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[0.625rem] font-semibold" style={{ color: cfg.color }}>{cfg.label}</span>
                      <span className="text-[0.625rem]" style={{ color: "#bbb" }}>
                        {new Date(b.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(b.id)} className="p-2 rounded-lg shrink-0" style={{ color: "#ccc" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}