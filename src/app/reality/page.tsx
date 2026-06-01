"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Search,
  GraduationCap,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MapPin,
  Users,
  Building2,
  Zap,
  BarChart3,
  X,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

interface University {
  id: string;
  name: string;
  shortName: string;
  state: string;
  type: string;
  _count: { courses: number };
}

interface Course {
  id: string;
  name: string;
  faculty: string | null;
  jambCutoff: number;
  competitiveness: string;
  acceptanceRate: number | null;
  totalSlots: number | null;
  university: { name: string; shortName: string };
}

interface RealityResult {
  university: { name: string; shortName: string; state: string; type: string };
  course: {
    name: string;
    faculty: string | null;
    cutoff: number;
    competitiveness: string;
    acceptanceRate: number | null;
    totalSlots: number | null;
  };
  prediction: {
    predictedScore: number;
    cutoff: number;
    gap: number;
    probability: number;
    subjectBreakdown: Array<{
      subject: string;
      accuracy: number;
      predicted: number;
      hasData: boolean;
      status: string;
    }>;
    dataConfidence: string;
  };
  roadmap: Array<{ action: string; impact: string; priority: string }>;
}

interface PastCheck {
  id: string;
  predictedScore: number;
  targetScore: number;
  probability: number;
  gap: number;
  generatedAt: string;
  course: {
    name: string;
    university: { name: string; shortName: string };
  };
}

const COMP_CONFIG: Record<string, { color: string; label: string }> = {
  LOW: { color: "var(--color-accent-green)", label: "Low Competition" },
  MODERATE: { color: "var(--color-info-400)", label: "Moderate" },
  HIGH: { color: "var(--color-warning-400)", label: "Competitive" },
  VERY_HIGH: { color: "var(--color-danger-400)", label: "Very Competitive" },
  EXTREME: { color: "var(--color-danger-400)", label: "Extremely Competitive" },
};

const UNI_TYPE_LABELS: Record<string, string> = {
  FEDERAL: "Federal",
  STATE: "State",
  PRIVATE: "Private",
};

export default function RealityPage() {
  const router = useRouter();
  const [step, setStep] = useState<"search" | "courses" | "result">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [universities, setUniversities] = useState<University[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedUni, setSelectedUni] = useState<University | null>(null);
  const [result, setResult] = useState<RealityResult | null>(null);
  const [pastChecks, setPastChecks] = useState<PastCheck[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [checking, setChecking] = useState(false);

  // Load universities
  useEffect(() => {
    fetchUniversities("");
    fetchPastChecks();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => fetchUniversities(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchUniversities = async (query: string) => {
    setSearchLoading(true);
    try {
      const res = await fetch(`/api/reality/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setUniversities(data.universities || []);
    } catch {
      console.error("Search failed");
    } finally {
      setSearchLoading(false);
    }
  };

  const fetchPastChecks = async () => {
    try {
      const res = await fetch("/api/reality/history");
      const data = await res.json();
      setPastChecks(data.checks || []);
    } catch {
      console.error("History failed");
    }
  };

  const selectUniversity = async (uni: University) => {
    setSelectedUni(uni);
    setLoading(true);
    setStep("courses");
    try {
      const res = await fetch(`/api/reality/search?universityId=${uni.id}`);
      const data = await res.json();
      setCourses(data.courses || []);
    } catch {
      console.error("Courses failed");
    } finally {
      setLoading(false);
    }
  };

  const runRealityCheck = async (courseId: string) => {
    setChecking(true);
    try {
      const res = await fetch("/api/reality/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();

      if (res.ok) {
        setResult(data);
        setStep("result");
      } else {
        alert(data.error || "Failed to run reality check");
      }
    } catch {
      alert("Network error");
    } finally {
      setChecking(false);
    }
  };

  const getProbabilityColor = (p: number) => {
    if (p >= 70) return "var(--color-accent-green)";
    if (p >= 45) return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  const getStatusColor = (status: string) => {
    if (status === "strong") return "var(--color-accent-green)";
    if (status === "on_track") return "var(--color-info-400)";
    if (status === "needs_improvement") return "var(--color-warning-400)";
    return "var(--color-danger-400)";
  };

  const formatSubject = (s: string) =>
    s.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      {/* Header */}
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button
            onClick={() => {
              if (step === "result") setStep("courses");
              else if (step === "courses") { setStep("search"); setSelectedUni(null); }
              else router.push("/dashboard");
            }}
            className="btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
            <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
              Reality Mode
            </span>
          </div>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* ════════ STEP 1: Search ════════ */}
        {step === "search" && (
          <>
            <div className="text-center mb-6">
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
                Where do you want to go?
              </h1>
              <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                Choose a university and course. We&apos;ll tell you your real chances.
              </p>
            </div>

            {/* Search */}
            <div className="relative mb-6">
              <Search
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
              />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search universities..."
                className="input-field pl-10"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* University list */}
            <div className="space-y-2 mb-8">
              {searchLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
                </div>
              ) : universities.length === 0 ? (
                <div className="card text-center py-8">
                  <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                    No universities found
                  </p>
                </div>
              ) : (
                universities.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => selectUniversity(uni)}
                    className="card-interactive w-full flex items-center gap-3 p-4 text-left"
                  >
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold"
                      style={{
                        background: "rgba(34, 197, 94, 0.08)",
                        color: "var(--color-accent-green)",
                        fontFamily: "var(--font-mono)",
                      }}
                    >
                      {uni.shortName.slice(0, 3)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>
                        {uni.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                          <MapPin className="h-2.5 w-2.5" />{uni.state}
                        </span>
                        <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>·</span>
                        <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                          {UNI_TYPE_LABELS[uni.type] || uni.type}
                        </span>
                        <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>·</span>
                        <span className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                          {uni._count.courses} courses
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                  </button>
                ))
              )}
            </div>

            {/* Past checks */}
            {pastChecks.length > 0 && (
              <div>
                <p className="section-label mb-3">Recent checks</p>
                <div className="space-y-2">
                  {pastChecks.slice(0, 5).map((check) => (
                    <div
                      key={check.id}
                      className="card p-3 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
                          {check.course.name}
                        </p>
                        <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>
                          {check.course.university.shortName} · {new Date(check.generatedAt).toLocaleDateString("en-NG", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <span
                        className="text-sm font-bold"
                        style={{ fontFamily: "var(--font-mono)", color: getProbabilityColor(check.probability) }}
                      >
                        {check.probability}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════ STEP 2: Course selection ════════ */}
        {step === "courses" && selectedUni && (
          <>
            <div className="mb-6">
              <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                {selectedUni.name}
              </h2>
              <p className="text-sm mt-1" style={{ color: "var(--color-text-tertiary)" }}>
                Select a course to check your admission probability
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
              </div>
            ) : (
              <div className="space-y-2">
                {courses.map((course) => {
                  const comp = COMP_CONFIG[course.competitiveness] || COMP_CONFIG.MODERATE;

                  return (
                    <button
                      key={course.id}
                      onClick={() => runRealityCheck(course.id)}
                      disabled={checking}
                      className="card-interactive w-full p-4 text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                            {course.name}
                          </p>
                          {course.faculty && (
                            <p className="text-[0.625rem] mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                              Faculty of {course.faculty}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                              <Target className="h-3 w-3" />{course.jambCutoff}+
                            </span>
                            {course.acceptanceRate && (
                              <span className="flex items-center gap-1 text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                                <Users className="h-3 w-3" />{course.acceptanceRate}% acceptance
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className="badge shrink-0"
                          style={{
                            fontSize: "0.5625rem",
                            background: `${comp.color}12`,
                            color: comp.color,
                            border: `1px solid ${comp.color}25`,
                          }}
                        >
                          {comp.label}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {checking && (
              <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
                <div className="card p-8 text-center max-w-xs">
                  <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Analyzing your chances...
                  </p>
                  <p className="text-xs mt-2" style={{ color: "var(--color-text-tertiary)" }}>
                    Crunching your performance data against admission requirements
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ════════ STEP 3: Result ════════ */}
        {step === "result" && result && (
          <>
            {/* Probability hero */}
            <div
              className="card mb-6 p-6 text-center"
              style={{ boxShadow: `0 0 30px ${getProbabilityColor(result.prediction.probability)}15` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: "var(--color-text-muted)" }}>
                Your admission probability
              </p>

              <p
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "4rem",
                  lineHeight: 1,
                  color: getProbabilityColor(result.prediction.probability),
                }}
              >
                {result.prediction.probability}%
              </p>

              <p className="mt-2 text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                {result.course.name}
              </p>
              <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>
                {result.university.name} ({result.university.shortName})
              </p>

              {result.prediction.dataConfidence !== "high" && (
                <p
                  className="mt-3 text-[0.625rem] rounded-full inline-block px-3 py-1"
                  style={{
                    background: "rgba(245, 158, 11, 0.1)",
                    color: "var(--color-warning-400)",
                    border: "1px solid rgba(245, 158, 11, 0.2)",
                  }}
                >
                  {result.prediction.dataConfidence === "medium"
                    ? "Based on limited practice data — take more tests for higher accuracy"
                    : "Very limited data — complete a diagnostic test first"}
                </p>
              )}
            </div>

            {/* Score comparison */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="stat-card text-center">
                <p className="text-[0.625rem] mb-1" style={{ color: "var(--color-text-muted)" }}>Your predicted</p>
                <p
                  className="stat-value"
                  style={{
                    fontSize: "1.5rem",
                    color: result.prediction.predictedScore >= result.prediction.cutoff
                      ? "var(--color-accent-green)"
                      : "var(--color-danger-400)",
                  }}
                >
                  {result.prediction.predictedScore}
                </p>
              </div>
              <div className="stat-card text-center">
                <p className="text-[0.625rem] mb-1" style={{ color: "var(--color-text-muted)" }}>Required cutoff</p>
                <p className="stat-value" style={{ fontSize: "1.5rem" }}>
                  {result.prediction.cutoff}
                </p>
              </div>
            </div>

            {/* Gap indicator */}
            {result.prediction.gap > 0 && (
              <div
                className="rounded-xl p-4 mb-6 text-center"
                style={{
                  background: "rgba(239, 68, 68, 0.05)",
                  border: "1px solid rgba(239, 68, 68, 0.15)",
                }}
              >
                <p className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                  You need{" "}
                  <strong style={{ color: "var(--color-danger-400)", fontFamily: "var(--font-display)", fontSize: "1.25rem" }}>
                    {result.prediction.gap} more points
                  </strong>{" "}
                  to reach the cutoff
                </p>
              </div>
            )}

            {result.prediction.gap <= 0 && (
              <div
                className="rounded-xl p-4 mb-6 text-center"
                style={{
                  background: "rgba(34, 197, 94, 0.05)",
                  border: "1px solid rgba(34, 197, 94, 0.15)",
                }}
              >
                <CheckCircle2 className="mx-auto mb-2 h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
                <p className="text-sm" style={{ color: "var(--color-accent-green)" }}>
                  You&apos;re above the cutoff by {Math.abs(result.prediction.gap)} points
                </p>
              </div>
            )}

            {/* Subject breakdown */}
            <div className="card p-5 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <BarChart3 className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
                <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                  Subject Readiness
                </p>
              </div>

              <div className="space-y-3">
                {result.prediction.subjectBreakdown.map((subj) => {
                  const color = getStatusColor(subj.status);

                  return (
                    <div key={subj.subject}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>
                            {formatSubject(subj.subject)}
                          </span>
                          {!subj.hasData && (
                            <span className="text-[0.5rem] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(245,158,11,0.1)", color: "var(--color-warning-400)" }}>
                              No data
                            </span>
                          )}
                        </div>
                        <span className="text-sm font-semibold" style={{ fontFamily: "var(--font-mono)", color }}>
                          {subj.accuracy}%
                        </span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${subj.accuracy}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Roadmap */}
            {result.roadmap.length > 0 && (
              <div className="card p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
                  <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                    Your Roadmap
                  </p>
                </div>

                <div className="space-y-3">
                  {result.roadmap.map((item, i) => {
                    const priorityColor =
                      item.priority === "critical"
                        ? "var(--color-danger-400)"
                        : item.priority === "high"
                        ? "var(--color-warning-400)"
                        : "var(--color-info-400)";

                    return (
                      <div
                        key={i}
                        className="flex items-start gap-3 rounded-lg p-3"
                        style={{
                          background: "var(--color-surface-light)",
                          border: "1px solid var(--color-surface-border)",
                        }}
                      >
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.625rem] font-bold mt-0.5"
                          style={{
                            background: `${priorityColor}15`,
                            color: priorityColor,
                            fontFamily: "var(--font-mono)",
                          }}
                        >
                          {i + 1}
                        </span>
                        <div>
                          <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>
                            {item.action}
                          </p>
                          <p className="text-xs mt-0.5" style={{ color: priorityColor }}>
                            {item.impact}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Course details */}
            <div className="card p-5 mb-6">
              <p className="section-label mb-3">Course details</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Cutoff Score", value: `${result.course.cutoff}+`, icon: Target },
                  { label: "Acceptance Rate", value: result.course.acceptanceRate ? `${result.course.acceptanceRate}%` : "—", icon: Users },
                  { label: "Available Slots", value: result.course.totalSlots?.toLocaleString() || "—", icon: Building2 },
                  { label: "Competition", value: COMP_CONFIG[result.course.competitiveness]?.label || result.course.competitiveness, icon: AlertTriangle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-text-muted)" }} />
                    <div>
                      <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>{label}</p>
                      <p className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 mb-6">
              <button
                onClick={() => router.push("/practice")}
                className="btn-primary w-full"
              >
                <Zap className="h-4 w-4" />
                Start Practicing
              </button>
              <button
                onClick={() => { setStep("search"); setResult(null); setSelectedUni(null); }}
                className="btn-secondary w-full"
              >
                Check Another Course
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <Logo size="small" />
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            <a href="/privacy" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Privacy Policy</a>
            <span>·</span>
            <a href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>Terms</a>
          </div>
          <p className="mt-2 text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} JambOS. Admission data is estimated and may vary by year.
          </p>
        </footer>
      </div>
    </div>
  );
}