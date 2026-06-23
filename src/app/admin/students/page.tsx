"use client";

import { useEffect, useState } from "react";
import {
  Search, Loader2, ChevronDown, ChevronUp, Users,
  GraduationCap, Target, MapPin, BookOpen, Clock,
  AlertTriangle, CheckCircle2, X,
} from "lucide-react";

interface Student {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string | null;
  image: string | null;
  gender: string | null;
  dateOfBirth: string | null;
  state: string | null;
  city: string | null;
  schoolName: string | null;
  schoolType: string | null;
  classLevel: string | null;
  examYear: number;
  targetScore: number;
  preferredCourse: string | null;
  preferredUni: string | null;
  subjects: string[];
  studyHoursPerDay: number | null;
  preferredTimeSlot: string | null;
  learningStyle: string | null;
  previousJambScore: number | null;
  mockTestsCompleted: number;
  riskLevel: string | null;
  onboardingCompletedAt: string | null;
  diagnosticCompletedAt: string | null;
  joinedAt: string;
}

const fmt = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const riskColor = (r: string | null) => {
  if (r === "HIGH") return { color: "#ef4444", bg: "#fef2f2" };
  if (r === "MEDIUM") return { color: "#f59e0b", bg: "#fffbeb" };
  if (r === "LOW") return { color: "#22c55e", bg: "#f0fdf4" };
  if (r === "VERY_LOW") return { color: "#22c55e", bg: "#f0fdf4" };
  return { color: "#999", bg: "#f9f9f9" };
};

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterRisk, setFilterRisk] = useState("");
  const [filterState, setFilterState] = useState("");

  useEffect(() => {
    fetch("/api/admin/students")
      .then((r) => r.json())
      .then((d) => setStudents(Array.isArray(d) ? d : []))
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = students.filter((s) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !s.name.toLowerCase().includes(q) &&
        !(s.email || "").toLowerCase().includes(q) &&
        !(s.schoolName || "").toLowerCase().includes(q) &&
        !(s.preferredUni || "").toLowerCase().includes(q) &&
        !(s.state || "").toLowerCase().includes(q)
      ) return false;
    }
    if (filterRisk && s.riskLevel !== filterRisk) return false;
    if (filterState && s.state !== filterState) return false;
    return true;
  });

  const uniqueStates = [...new Set(students.map((s) => s.state).filter(Boolean))].sort() as string[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
            Students
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
            {filtered.length} of {students.length} student{students.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <Users className="h-4 w-4" />
            <span style={{ fontFamily: "var(--font-mono)" }}>{students.length}</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 p-4 rounded-xl space-y-3" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, school, university, state..."
            className="input-field pl-10" />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <select value={filterRisk} onChange={(e) => setFilterRisk(e.target.value)} className="input-field sm:w-40" style={{ appearance: "none" }}>
            <option value="">All risk levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
            <option value="VERY_LOW">Very Low Risk</option>
          </select>
          <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="input-field sm:w-40" style={{ appearance: "none" }}>
            <option value="">All states</option>
            {uniqueStates.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filterRisk || filterState) && (
            <button onClick={() => { setSearch(""); setFilterRisk(""); setFilterState(""); }}
              className="text-xs flex items-center gap-1" style={{ color: "var(--color-text-muted)" }}>
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>No students found.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => {
            const expanded = expandedId === s.id;
            const rc = riskColor(s.riskLevel);
            return (
              <div key={s.id} className="rounded-xl transition-all" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
                {/* Summary row */}
                <button onClick={() => setExpandedId(expanded ? null : s.id)}
                  className="w-full flex items-center gap-3 p-4 text-left">
                  {s.image
                    ? <img src={s.image} alt="" className="h-9 w-9 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                    : <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ background: "#f5f5f5", color: "#333" }}>{s.firstName.charAt(0)}{s.lastName.charAt(0)}</div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{s.name}</p>
                    <p className="text-[0.625rem] truncate" style={{ color: "var(--color-text-muted)" }}>
                      {s.email}{s.state ? ` - ${s.state}` : ""}{s.classLevel ? ` - ${fmt(s.classLevel)}` : ""}
                    </p>
                  </div>
                  
                  <div className="hidden sm:flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{s.targetScore}</p>
                      <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>target</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{s.examYear}</p>
                      <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>exam</p>
                    </div>
                    {s.riskLevel && (
                      <span className="text-[0.5625rem] font-semibold rounded-md px-2 py-0.5" style={{ background: rc.bg, color: rc.color }}>
                        {fmt(s.riskLevel)}
                      </span>
                    )}
                  </div>
                  {expanded ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />}
                </button>

                {/* Expanded details */}
                {expanded && (
                  <div className="px-4 pb-4 pt-0">
                    <div style={{ borderTop: "1px solid var(--color-surface-border)", paddingTop: "1rem" }}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Personal */}
                        <div>
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Personal</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "WhatsApp", value: s.whatsappNumber },
                              { label: "Gender", value: s.gender ? fmt(s.gender) : null },
                              { label: "Date of Birth", value: s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) : null },
                              { label: "State", value: s.state },
                              { label: "City", value: s.city },
                              { label: "Joined", value: new Date(s.joinedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) },
                            ].map(({ label, value }) => value && (
                              <div key={label} className="flex justify-between text-xs">
                                <span style={{ color: "var(--color-text-tertiary)" }}>{label}</span>
                                <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* School */}
                        <div>
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>School</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "School", value: s.schoolName },
                              { label: "Type", value: s.schoolType ? fmt(s.schoolType) : null },
                              { label: "Class", value: s.classLevel ? fmt(s.classLevel) : null },
                            ].map(({ label, value }) => value && (
                              <div key={label} className="flex justify-between text-xs">
                                <span style={{ color: "var(--color-text-tertiary)" }}>{label}</span>
                                <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* JAMB Goals */}
                        <div>
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>JAMB Goals</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "Exam Year", value: String(s.examYear) },
                              { label: "Target Score", value: String(s.targetScore) },
                              { label: "Preferred Course", value: s.preferredCourse },
                              { label: "Preferred Uni", value: s.preferredUni },
                              { label: "Previous Score", value: s.previousJambScore ? String(s.previousJambScore) : null },
                            ].map(({ label, value }) => value && (
                              <div key={label} className="flex justify-between text-xs">
                                <span style={{ color: "var(--color-text-tertiary)" }}>{label}</span>
                                <span className="text-right max-w-[60%] truncate" style={{ color: "var(--color-text-primary)" }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Subjects */}
                        <div>
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Subjects</p>
                          <div className="flex flex-wrap gap-1">
                            {s.subjects.map((subj) => (
                              <span key={subj} className="text-[0.625rem] font-semibold rounded-md px-2 py-0.5"
                                style={{ background: "rgba(34,197,94,0.08)", color: "var(--color-accent-green)", border: "1px solid rgba(34,197,94,0.15)" }}>
                                {fmt(subj)}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Study Preferences */}
                        <div>
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Study Preferences</p>
                          <div className="space-y-1.5">
                            {[
                              { label: "Hours/Day", value: s.studyHoursPerDay ? `${s.studyHoursPerDay}h` : null },
                              { label: "Time Slot", value: s.preferredTimeSlot ? fmt(s.preferredTimeSlot) : null },
                              { label: "Style", value: s.learningStyle ? fmt(s.learningStyle) : null },
                            ].map(({ label, value }) => value && (
                              <div key={label} className="flex justify-between text-xs">
                                <span style={{ color: "var(--color-text-tertiary)" }}>{label}</span>
                                <span style={{ color: "var(--color-text-primary)" }}>{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Status */}
                        <div>
                          <p className="text-[0.5625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "var(--color-text-muted)" }}>Status</p>
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-xs">
                              <span style={{ color: "var(--color-text-tertiary)" }}>Onboarding</span>
                              {s.onboardingCompletedAt
                                ? <span className="flex items-center gap-1" style={{ color: "var(--color-accent-green)" }}><CheckCircle2 className="h-3 w-3" /> Done</span>
                                : <span style={{ color: "var(--color-warning-400)" }}>Pending</span>}
                            </div>
                            <div className="flex justify-between text-xs">
                              <span style={{ color: "var(--color-text-tertiary)" }}>Diagnostic</span>
                              {s.diagnosticCompletedAt
                                ? <span className="flex items-center gap-1" style={{ color: "var(--color-accent-green)" }}><CheckCircle2 className="h-3 w-3" /> Done</span>
                                : <span style={{ color: "var(--color-text-muted)" }}>Not taken</span>}
                            </div>
                            <div className="flex justify-between text-xs">
                              <span style={{ color: "var(--color-text-tertiary)" }}>Mocks Done</span>
                              <span style={{ fontFamily: "var(--font-mono)", color: "var(--color-text-primary)" }}>{s.mockTestsCompleted}</span>
                            </div>
                            {s.riskLevel && (
                              <div className="flex justify-between text-xs">
                                <span style={{ color: "var(--color-text-tertiary)" }}>Risk Level</span>
                                <span className="font-semibold" style={{ color: riskColor(s.riskLevel).color }}>{fmt(s.riskLevel)}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}