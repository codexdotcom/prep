"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Building2, Users, TrendingUp, Loader2, Plus, Copy,
  CheckCircle2, BarChart3, Flame, Target, ChevronRight, Settings,
  Search,
} from "lucide-react";
import { NIGERIAN_STATES } from "@/lib/data/nigerian-states";

interface StudentData {
  id: string;
  userId: string;
  name: string;
  email: string;
  accuracy: number;
  predictedScore: number;
  questionsAnswered: number;
  streak: number;
  level: number;
  joinedAt: string;
}

export default function CenterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "student" | null>(null);
  const [center, setCenter] = useState<any>(null);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "accuracy" | "streak" | "name">("score");

  // Create form
  const [formName, setFormName] = useState("");
  const [formState, setFormState] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formColor, setFormColor] = useState("#22c55e");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/center");
        const data = await res.json();
        setRole(data.role);
        setCenter(data.center);
        if (data.role === "admin") loadStudents();
      } catch {} finally { setLoading(false); }
    }
    load();
  }, []);

  const loadStudents = async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch("/api/center/students");
      const data = await res.json();
      setStudents(data.students || []);
    } catch {} finally { setStudentsLoading(false); }
  };

  const handleCreate = async () => {
    if (!formName || !formState || !formEmail) return;
    setCreating(true);
    try {
      const res = await fetch("/api/center", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formName, state: formState, city: formCity, email: formEmail, brandColor: formColor }),
      });
      const data = await res.json();
      if (res.ok) {
        setCenter(data.center);
        setRole("admin");
        setShowCreate(false);
        loadStudents();
      } else alert(data.error);
    } catch {} finally { setCreating(false); }
  };

  const copyLink = () => {
    if (!center?.slug) return;
    navigator.clipboard.writeText(`jambos.ng/center/join/${center.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getColor = (acc: number) => acc >= 70 ? "var(--color-accent-green)" : acc >= 50 ? "var(--color-warning-400)" : "var(--color-danger-400)";

  const filteredStudents = students
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "score") return b.predictedScore - a.predictedScore;
      if (sortBy === "accuracy") return b.accuracy - a.accuracy;
      if (sortBy === "streak") return b.streak - a.streak;
      return a.name.localeCompare(b.name);
    });

  const avgScore = students.length > 0 ? Math.round(students.reduce((s, st) => s + st.predictedScore, 0) / students.length) : 0;
  const avgAccuracy = students.length > 0 ? Math.round(students.reduce((s, st) => s + st.accuracy, 0) / students.length) : 0;
  const activeStudents = students.filter((s) => s.questionsAnswered > 10).length;

  if (loading) return <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}><Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>;

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {center ? center.name : "Tutorial Center"}
          </span>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-5">
        {/* No center — show create or join */}
        {!role && !showCreate && (
          <div className="text-center py-12">
            <Building2 className="mx-auto mb-4 h-12 w-12" style={{ color: "var(--color-text-muted)" }} />
            <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>Tutorial Centers</h1>
            <p className="text-sm mt-2 mb-8" style={{ color: "var(--color-text-tertiary)" }}>
              Create a branded portal for your tutorial center or coaching academy
            </p>
            <div className="flex flex-col gap-2 max-w-xs mx-auto">
              <button onClick={() => setShowCreate(true)} className="btn-primary w-full">
                <Plus className="h-4 w-4" /> Create Center Portal
              </button>
            </div>
          </div>
        )}

        {/* Create form */}
        {showCreate && !role && (
          <div className="card p-5 max-w-lg mx-auto">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Create Your Center</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Center Name *</label>
                <input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Excel Tutorial Center" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">State *</label>
                  <select value={formState} onChange={(e) => setFormState(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                    <option value="">Select</option>
                    {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">City</label>
                  <input value={formCity} onChange={(e) => setFormCity(e.target.value)} placeholder="e.g. Ikeja" className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Contact Email *</label>
                <input value={formEmail} onChange={(e) => setFormEmail(e.target.value)} placeholder="center@example.com" className="input-field" type="email" />
              </div>
              <div>
                <label className="label">Brand Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="h-9 w-9 rounded-lg cursor-pointer" style={{ border: "1px solid var(--color-surface-border)" }} />
                  <span className="text-xs" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-muted)" }}>{formColor}</span>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleCreate} disabled={creating || !formName || !formState || !formEmail} className="btn-primary flex-1">
                  {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Create
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Admin dashboard */}
        {role === "admin" && center && (
          <>
            {/* Invite link */}
            <div className="card p-4 mb-5 flex items-center justify-between"
              style={{ borderColor: `${center.brandColor || "#22c55e"}30` }}>
              <div>
                <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>Student invite link</p>
                <p className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color: center.brandColor || "var(--color-accent-green)" }}>
                  jambos.ng/center/join/{center.slug}
                </p>
              </div>
              <button onClick={copyLink} className="btn-ghost" style={{ padding: "0.5rem" }}>
                {copied ? <CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} /> : <Copy className="h-4 w-4" />}
              </button>
            </div>

            {/* Overview stats */}
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[
                { icon: Users, label: "Students", value: students.length, color: "var(--color-accent-green)" },
                { icon: Target, label: "Avg Score", value: avgScore, color: getColor(avgAccuracy) },
                { icon: BarChart3, label: "Avg Accuracy", value: `${avgAccuracy}%`, color: getColor(avgAccuracy) },
                { icon: Flame, label: "Active", value: activeStudents, color: "var(--color-warning-400)" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="card p-3 text-center">
                  <Icon className="mx-auto mb-1 h-4 w-4" style={{ color }} />
                  <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color }}>{value}</p>
                  <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                </div>
              ))}
            </div>

            {/* Search + Sort */}
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search students..." className="input-field pl-9" style={{ fontSize: "0.75rem" }} />
              </div>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="input-field" style={{ appearance: "none", width: "auto", fontSize: "0.75rem" }}>
                <option value="score">Score</option>
                <option value="accuracy">Accuracy</option>
                <option value="streak">Streak</option>
                <option value="name">Name</option>
              </select>
            </div>

            {/* Student table */}
            {studentsLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : filteredStudents.length === 0 ? (
              <div className="card text-center py-8">
                <Users className="mx-auto mb-2 h-6 w-6" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                  {students.length === 0 ? "No students yet. Share your invite link." : "No students match your search."}
                </p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredStudents.map((s, i) => (
                  <div key={s.id} className="card p-3 flex items-center gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[0.625rem] font-bold"
                      style={{ fontFamily: "var(--font-mono)", background: "var(--color-surface-light)", color: "var(--color-text-muted)" }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{s.questionsAnswered} questions</span>
                        <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>{s.streak}d streak</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getColor(s.accuracy) }}>{s.accuracy}%</p>
                        <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>accuracy</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: getColor(s.accuracy) }}>{s.predictedScore}</p>
                        <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>predicted</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}