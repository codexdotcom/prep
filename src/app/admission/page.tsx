"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Plus, Loader2, Search, MapPin, GraduationCap,
  CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp,
  Trash2, Edit3, Brain, TrendingUp, CalendarDays, X,
  ClipboardList, ArrowRight, Star,
} from "lucide-react";

interface Tracker {
  id: string;
  universityId: string;
  courseId: string;
  jambScore: number | null;
  postUtmeScore: number | null;
  oLevelGrades: Record<string, string> | null;
  status: string;
  jambRegNumber: string | null;
  notes: string | null;
  screeningDate: string | null;
  university: { name: string; shortName: string; state: string };
  course: { name: string; cutoffScore: number | null };
  updates: Array<{ id: string; title: string; description: string; type: string; createdAt: string }>;
  createdAt: string;
}

interface AiAnalysis {
  probability: number;
  strengths: string[];
  risks: string[];
  nextSteps: string[];
  timeline: string;
  summary: string;
}

interface University { id: string; name: string; shortName: string; state: string }
interface Course { id: string; name: string; cutoffScore: number | null }

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any; bg: string }> = {
  AWAITING_RESULTS: { label: "Awaiting Results", color: "var(--color-text-muted)", icon: Clock, bg: "var(--color-surface-lighter)" },
  JAMB_SUBMITTED: { label: "JAMB Submitted", color: "var(--color-info-400)", icon: CheckCircle2, bg: "rgba(59,130,246,0.06)" },
  POST_UTME_SCHEDULED: { label: "Post-UTME Scheduled", color: "var(--color-warning-400)", icon: CalendarDays, bg: "rgba(245,158,11,0.06)" },
  POST_UTME_COMPLETED: { label: "Post-UTME Done", color: "var(--color-info-400)", icon: CheckCircle2, bg: "rgba(59,130,246,0.06)" },
  SCREENING: { label: "Under Screening", color: "var(--color-warning-400)", icon: Clock, bg: "rgba(245,158,11,0.06)" },
  MERIT_LIST: { label: "Merit List", color: "var(--color-accent-green)", icon: Star, bg: "rgba(34,197,94,0.06)" },
  ADMITTED: { label: "Admitted!", color: "var(--color-accent-green)", icon: CheckCircle2, bg: "rgba(34,197,94,0.08)" },
  SUPPLEMENTARY: { label: "Supplementary", color: "var(--color-warning-400)", icon: Clock, bg: "rgba(245,158,11,0.06)" },
  NOT_ADMITTED: { label: "Not Admitted", color: "var(--color-danger-400)", icon: AlertTriangle, bg: "rgba(239,68,68,0.06)" },
  DEFERRED: { label: "Deferred", color: "var(--color-text-muted)", icon: Clock, bg: "var(--color-surface-lighter)" },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

export default function AdmissionPage() {
  const router = useRouter();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  // Add form
  const [uniSearch, setUniSearch] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [jambScore, setJambScore] = useState("");
  const [jambReg, setJambReg] = useState("");
  const [adding, setAdding] = useState(false);

  // Status update
  const [editingStatus, setEditingStatus] = useState<string | null>(null);

  // AI analysis
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const fetchTrackers = async () => {
    try {
      const res = await fetch("/api/admission");
      const data = await res.json();
      setTrackers(data.trackers || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTrackers(); }, []);

  // Search universities
  useEffect(() => {
    if (!uniSearch || uniSearch.length < 2) { setUniversities([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/reality/search?q=${encodeURIComponent(uniSearch)}`);
        const data = await res.json();
        setUniversities(data.universities || []);
      } catch {}
    }, 300);
    return () => clearTimeout(timer);
  }, [uniSearch]);

  const selectUni = async (uni: University) => {
    setSelectedUni(uni);
    setUniSearch("");
    setUniversities([]);
    try {
      const res = await fetch(`/api/reality/search?universityId=${uni.id}`);
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {}
  };

  const handleAdd = async () => {
    if (!selectedUni || !selectedCourse) return;
    setAdding(true);
    try {
      const res = await fetch("/api/admission", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          universityId: selectedUni.id,
          courseId: selectedCourse,
          jambScore: jambScore ? parseInt(jambScore) : null,
          jambRegNumber: jambReg || null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setShowAdd(false);
        setSelectedUni(null);
        setSelectedCourse("");
        setJambScore("");
        setJambReg("");
        fetchTrackers();
      } else alert(data.error);
    } catch {} finally { setAdding(false); }
  };

  const updateStatus = async (trackerId: string, status: string) => {
    try {
      await fetch(`/api/admission/${trackerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setEditingStatus(null);
      fetchTrackers();
    } catch {}
  };

  const deleteTracker = async (id: string) => {
    if (!confirm("Remove this admission tracker?")) return;
    try {
      await fetch(`/api/admission/${id}`, { method: "DELETE" });
      fetchTrackers();
    } catch {}
  };

  const runAnalysis = async (trackerId: string) => {
    setAnalysisId(trackerId);
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch("/api/admission/ai-predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackerId }),
      });
      const data = await res.json();
      if (res.ok) setAnalysis(data.analysis);
    } catch {} finally { setAnalyzing(false); }
  };

  const getChanceColor = (p: number) => p >= 70 ? "var(--color-accent-green)" : p >= 40 ? "var(--color-warning-400)" : "var(--color-danger-400)";

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Admission Tracker</span>
          <button onClick={() => setShowAdd(true)} className="btn-ghost" style={{ color: "var(--color-accent-green)" }}><Plus className="h-5 w-5" /></button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* Add modal */}
        {showAdd && (
          <div className="card p-5 mb-5" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Track New Admission</h3>
              <button onClick={() => setShowAdd(false)} className="btn-ghost" style={{ padding: "0.25rem" }}><X className="h-4 w-4" /></button>
            </div>

            {!selectedUni ? (
              <div>
                <label className="label">Search University</label>
                <input value={uniSearch} onChange={(e) => setUniSearch(e.target.value)} placeholder="Type university name..." className="input-field" />
                {universities.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-48 overflow-y-auto">
                    {universities.map((u) => (
                      <button key={u.id} onClick={() => selectUni(u)} className="w-full text-left p-2 rounded-lg text-sm transition-all"
                        style={{ color: "var(--color-text-secondary)" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--color-surface-light)"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
                        {u.name} <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>({u.state})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 rounded-lg" style={{ background: "var(--color-surface-light)" }}>
                  <span className="text-sm font-semibold" style={{ color: "var(--color-accent-green)" }}>{selectedUni.name}</span>
                  <button onClick={() => { setSelectedUni(null); setCourses([]); }} className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Change</button>
                </div>

                <div>
                  <label className="label">Course</label>
                  <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                    <option value="">Select course</option>
                    {courses.map((c) => <option key={c.id} value={c.id}>{c.name} {c.cutoffScore ? `(Cutoff: ${c.cutoffScore})` : ""}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">JAMB Score</label>
                    <input type="number" value={jambScore} onChange={(e) => setJambScore(e.target.value)} placeholder="e.g. 285" className="input-field" min={0} max={400} />
                  </div>
                  <div>
                    <label className="label">Reg. Number</label>
                    <input value={jambReg} onChange={(e) => setJambReg(e.target.value)} placeholder="Optional" className="input-field" />
                  </div>
                </div>

                <button onClick={handleAdd} disabled={adding || !selectedCourse} className="btn-primary w-full" style={{ opacity: selectedCourse ? 1 : 0.4 }}>
                  {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Tracker
                </button>
              </div>
            )}
          </div>
        )}

        {/* Trackers list */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
        ) : trackers.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="mx-auto mb-4 h-10 w-10" style={{ color: "var(--color-text-muted)" }} />
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>Track Your Admissions</h2>
            <p className="text-xs mt-2 mb-6 mx-auto max-w-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Add the universities you applied to. Track your progress from JAMB to admission.
            </p>
            <button onClick={() => setShowAdd(true)} className="btn-primary">
              <Plus className="h-4 w-4" /> Add University
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {trackers.map((t) => {
              const statusConf = STATUS_CONFIG[t.status] || STATUS_CONFIG.AWAITING_RESULTS;
              const StatusIcon = statusConf.icon;
              const isExpanded = expanded === t.id;

              return (
                <div key={t.id} className="rounded-2xl overflow-hidden" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}>
                  {/* Header */}
                  <button onClick={() => setExpanded(isExpanded ? null : t.id)} className="w-full flex items-center gap-3 p-4 text-left">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl" style={{ background: statusConf.bg }}>
                      <StatusIcon className="h-5 w-5" style={{ color: statusConf.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{t.university.shortName}</p>
                      <p className="text-[0.625rem]" style={{ color: "var(--color-accent-green)" }}>{t.course.name}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[0.5625rem] rounded-full px-2 py-0.5 font-semibold" style={{ background: statusConf.bg, color: statusConf.color }}>
                        {statusConf.label}
                      </span>
                    </div>
                    {isExpanded ? <ChevronUp className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} /> : <ChevronDown className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />}
                  </button>

                  {isExpanded && (
                    <div className="px-4 pb-4" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
                      {/* Scores */}
                      <div className="grid grid-cols-3 gap-2 mt-3 mb-4">
                        <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-base font-bold" style={{ fontFamily: "var(--font-mono)", color: t.jambScore ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                            {t.jambScore || "—"}
                          </p>
                          <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>JAMB</p>
                        </div>
                        <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-base font-bold" style={{ fontFamily: "var(--font-mono)", color: t.postUtmeScore ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                            {t.postUtmeScore || "—"}
                          </p>
                          <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>Post-UTME</p>
                        </div>
                        <div className="rounded-lg p-2.5 text-center" style={{ background: "var(--color-surface-light)" }}>
                          <p className="text-base font-bold" style={{ fontFamily: "var(--font-mono)", color: t.course.cutoffScore ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
                            {t.course.cutoffScore || "—"}
                          </p>
                          <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>Cutoff</p>
                        </div>
                      </div>

                      {/* Status pipeline */}
                      <p className="text-[0.5625rem] font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>Update Status</p>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {ALL_STATUSES.slice(0, 8).map((s) => {
                          const conf = STATUS_CONFIG[s];
                          const isActive = t.status === s;
                          return (
                            <button key={s} onClick={() => updateStatus(t.id, s)}
                              className="rounded-full px-2 py-1 text-[0.5rem] font-semibold transition-all"
                              style={{
                                background: isActive ? conf.bg : "var(--color-surface-lighter)",
                                color: isActive ? conf.color : "var(--color-text-muted)",
                                border: `1px solid ${isActive ? conf.color + "30" : "transparent"}`,
                              }}>
                              {conf.label}
                            </button>
                          );
                        })}
                      </div>

                      {/* Timeline */}
                      {t.updates.length > 0 && (
                        <div className="mb-4">
                          <p className="text-[0.5625rem] font-semibold mb-2" style={{ color: "var(--color-text-muted)" }}>Timeline</p>
                          <div className="space-y-2">
                            {t.updates.map((u, i) => (
                              <div key={u.id} className="flex items-start gap-2">
                                <div className="flex flex-col items-center">
                                  <div className="h-2 w-2 rounded-full" style={{ background: i === 0 ? "var(--color-accent-green)" : "var(--color-surface-border)" }} />
                                  {i < t.updates.length - 1 && <div className="w-px h-6" style={{ background: "var(--color-surface-border)" }} />}
                                </div>
                                <div>
                                  <p className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{u.title}</p>
                                  <p className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                                    {new Date(u.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button onClick={() => runAnalysis(t.id)} disabled={analyzing && analysisId === t.id}
                          className="btn-primary flex-1" style={{ fontSize: "0.75rem", padding: "0.625rem" }}>
                          {analyzing && analysisId === t.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Brain className="h-3.5 w-3.5" />}
                          AI Analysis
                        </button>
                        <button onClick={() => deleteTracker(t.id)} className="btn-ghost" style={{ color: "var(--color-danger-400)", padding: "0.625rem" }}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* AI Analysis result */}
                      {analysis && analysisId === t.id && (
                        <div className="mt-4 rounded-xl p-4" style={{ background: "rgba(34,197,94,0.03)", border: "1px solid rgba(34,197,94,0.12)" }}>
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold" style={{ color: "var(--color-accent-green)" }}>AI Admission Analysis</p>
                            <p className="text-xl font-bold" style={{ fontFamily: "var(--font-display)", color: getChanceColor(analysis.probability) }}>
                              {analysis.probability}%
                            </p>
                          </div>
                          <p className="text-xs mb-3" style={{ color: "var(--color-text-secondary)" }}>{analysis.summary}</p>

                          {analysis.strengths.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[0.5625rem] font-semibold mb-1" style={{ color: "var(--color-accent-green)" }}>Strengths</p>
                              {analysis.strengths.map((s, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <CheckCircle2 className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--color-accent-green)" }} />
                                  <p className="text-[0.625rem]" style={{ color: "var(--color-text-tertiary)" }}>{s}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {analysis.risks.length > 0 && (
                            <div className="mb-2">
                              <p className="text-[0.5625rem] font-semibold mb-1" style={{ color: "var(--color-danger-400)" }}>Risks</p>
                              {analysis.risks.map((r, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <AlertTriangle className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--color-danger-400)" }} />
                                  <p className="text-[0.625rem]" style={{ color: "var(--color-text-tertiary)" }}>{r}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          {analysis.nextSteps.length > 0 && (
                            <div>
                              <p className="text-[0.5625rem] font-semibold mb-1" style={{ color: "var(--color-warning-400)" }}>Next Steps</p>
                              {analysis.nextSteps.map((s, i) => (
                                <div key={i} className="flex items-start gap-1.5">
                                  <ArrowRight className="h-3 w-3 shrink-0 mt-0.5" style={{ color: "var(--color-warning-400)" }} />
                                  <p className="text-[0.625rem]" style={{ color: "var(--color-text-tertiary)" }}>{s}</p>
                                </div>
                              ))}
                            </div>
                          )}

                          <p className="text-[0.5rem] mt-2" style={{ color: "var(--color-text-muted)" }}>Timeline: {analysis.timeline}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}