"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Search, Loader2, Star, MapPin, Users, ChevronRight,
  Clock, CheckCircle2, X, Calendar, BookOpen, Plus, Filter,
  MessageCircle, Award, ChevronDown, ChevronUp,
} from "lucide-react";
import { JAMB_SUBJECTS, NIGERIAN_STATES } from "@/lib/data/nigerian-states";

interface Tutor {
  id: string;
  userId: string;
  displayName: string;
  bio: string;
  subjects: string[];
  qualifications: string[];
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  state: string | null;
  avatarUrl: string | null;
}

interface TutorDetail extends Tutor {
  experience: string | null;
  availableSlots: Record<string, string[]> | null;
  reviews: Array<{ id: string; rating: number; comment: string | null; studentName: string; createdAt: string }>;
}

type View = "browse" | "detail" | "book" | "register";

export default function TutorsPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("browse");

  // Browse
  const [tutors, setTutors] = useState<Tutor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterSubject, setFilterSubject] = useState("");
  const [filterState, setFilterState] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Detail
  const [selectedTutor, setSelectedTutor] = useState<TutorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Booking
  const [bookSubject, setBookSubject] = useState("");
  const [bookTopic, setBookTopic] = useState("");
  const [bookDate, setBookDate] = useState("");
  const [bookTime, setBookTime] = useState("");
  const [bookDuration, setBookDuration] = useState(60);
  const [booking, setBooking] = useState(false);
  const [booked, setBooked] = useState(false);

  // Register
  const [regName, setRegName] = useState("");
  const [regBio, setRegBio] = useState("");
  const [regSubjects, setRegSubjects] = useState<string[]>([]);
  const [regQualifications, setRegQualifications] = useState("");
  const [regExperience, setRegExperience] = useState("");
  const [regRate, setRegRate] = useState("");
  const [regState, setRegState] = useState("");
  const [registering, setRegistering] = useState(false);

  const formatSubject = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const fetchTutors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("search", searchQuery);
      if (filterSubject) params.set("subject", filterSubject);
      if (filterState) params.set("state", filterState);
      const res = await fetch(`/api/tutors?${params}`);
      const data = await res.json();
      setTutors(data.tutors || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchTutors(); }, [filterSubject, filterState]);

  useEffect(() => {
    const timer = setTimeout(fetchTutors, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const openDetail = async (tutorId: string) => {
    setDetailLoading(true);
    setView("detail");
    try {
      const res = await fetch(`/api/tutors/${tutorId}`);
      const data = await res.json();
      if (res.ok) setSelectedTutor(data.tutor);
    } catch {} finally { setDetailLoading(false); }
  };

  const handleBook = async () => {
    if (!selectedTutor || !bookSubject || !bookDate || !bookTime) return;
    setBooking(true);
    try {
      const scheduledAt = new Date(`${bookDate}T${bookTime}`);
      const res = await fetch("/api/tutors/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorId: selectedTutor.id, subject: bookSubject, topic: bookTopic, scheduledAt: scheduledAt.toISOString(), duration: bookDuration }),
      });
      const data = await res.json();
      if (res.ok) { setBooked(true); setView("browse"); }
      else alert(data.error);
    } catch {} finally { setBooking(false); }
  };

  const handleRegister = async () => {
    if (!regName || !regBio || regSubjects.length === 0 || !regRate) return;
    setRegistering(true);
    try {
      const res = await fetch("/api/tutors/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: regName,
          bio: regBio,
          subjects: regSubjects,
          qualifications: regQualifications ? regQualifications.split(",").map((q) => q.trim()) : [],
          experience: regExperience || null,
          hourlyRate: parseInt(regRate),
          state: regState || null,
        }),
      });
      const data = await res.json();
      if (res.ok) { alert("Registered as tutor!"); setView("browse"); fetchTutors(); }
      else alert(data.error);
    } catch {} finally { setRegistering(false); }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className="h-3 w-3" style={{ color: i <= Math.round(rating) ? "var(--color-warning-400)" : "var(--color-surface-border)", fill: i <= Math.round(rating) ? "var(--color-warning-400)" : "none" }} />
      ))}
    </div>
  );

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => {
            if (view === "detail" || view === "book") { setView("browse"); setSelectedTutor(null); }
            else if (view === "register") setView("browse");
            else router.push("/dashboard");
          }} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            {view === "detail" ? selectedTutor?.displayName || "Tutor" : view === "book" ? "Book Session" : view === "register" ? "Become a Tutor" : "Find a Tutor"}
          </span>
          {view === "browse" && (
            <button onClick={() => setView("register")} className="text-[0.625rem] font-semibold" style={{ color: "var(--color-accent-green)" }}>
              Teach
            </button>
          )}
          {view !== "browse" && <div />}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-5">
        {/* ═══ BROWSE ═══ */}
        {view === "browse" && (
          <>
            {/* Search */}
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tutors..." className="input-field pl-10" />
            </div>

            {/* Filter toggle */}
            <button onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 mb-3 text-xs font-semibold"
              style={{ color: (filterSubject || filterState) ? "var(--color-accent-green)" : "var(--color-text-muted)" }}>
              <Filter className="h-3.5 w-3.5" />
              Filters {(filterSubject || filterState) && `(${[filterSubject, filterState].filter(Boolean).length} active)`}
              {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showFilters && (
              <div className="flex gap-2 mb-4">
                <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="input-field flex-1" style={{ appearance: "none", fontSize: "0.75rem" }}>
                  <option value="">All subjects</option>
                  {JAMB_SUBJECTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
                <select value={filterState} onChange={(e) => setFilterState(e.target.value)} className="input-field flex-1" style={{ appearance: "none", fontSize: "0.75rem" }}>
                  <option value="">All states</option>
                  {NIGERIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            )}

            {booked && (
              <div className="card p-4 mb-4 flex items-center gap-3" style={{ borderColor: "rgba(34,197,94,0.2)" }}>
                <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "var(--color-accent-green)" }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--color-accent-green)" }}>Session Booked!</p>
                  <p className="text-[0.625rem]" style={{ color: "var(--color-text-muted)" }}>Your tutor will confirm shortly</p>
                </div>
                <button onClick={() => setBooked(false)} className="btn-ghost ml-auto" style={{ padding: "0.25rem" }}><X className="h-3 w-3" /></button>
              </div>
            )}

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : tutors.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto mb-3 h-8 w-8" style={{ color: "var(--color-text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--color-text-primary)" }}>No tutors found</p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-tertiary)" }}>Try adjusting your filters or search</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {tutors.map((t) => (
                  <button key={t.id} onClick={() => openDetail(t.id)}
                    className="w-full text-left rounded-2xl p-4 transition-all group"
                    style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-surface-border)" }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(34,197,94,0.25)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)"; }}>
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl overflow-hidden" style={{ background: "rgba(34,197,94,0.06)" }}>
                        {t.avatarUrl ? <img src={t.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                          : <span className="text-lg font-bold" style={{ color: "var(--color-accent-green)" }}>{t.displayName.charAt(0)}</span>}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold truncate" style={{ color: "var(--color-text-primary)" }}>{t.displayName}</p>
                          {t.isVerified && <CheckCircle2 className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-accent-green)" }} />}
                        </div>

                        <div className="flex items-center gap-2 mt-0.5">
                          {renderStars(t.rating)}
                          <span className="text-[0.5625rem]" style={{ color: "var(--color-text-muted)" }}>
                            {t.rating.toFixed(1)} ({t.totalReviews})
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {t.subjects.slice(0, 3).map((s) => (
                            <span key={s} className="text-[0.5rem] rounded-full px-1.5 py-0.5"
                              style={{ background: "rgba(34,197,94,0.06)", color: "var(--color-accent-green)", border: "1px solid rgba(34,197,94,0.1)" }}>
                              {formatSubject(s)}
                            </span>
                          ))}
                          {t.subjects.length > 3 && <span className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>+{t.subjects.length - 3}</span>}
                        </div>

                        <p className="text-[0.625rem] mt-1.5 line-clamp-1" style={{ color: "var(--color-text-tertiary)" }}>{t.bio}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-mono)", color: "var(--color-accent-green)" }}>
                          ₦{t.hourlyRate.toLocaleString()}
                        </p>
                        <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>/hour</p>
                        {t.state && (
                          <div className="flex items-center gap-0.5 mt-1 justify-end">
                            <MapPin className="h-2.5 w-2.5" style={{ color: "var(--color-text-muted)" }} />
                            <span className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>{t.state}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ═══ TUTOR DETAIL ═══ */}
        {view === "detail" && (
          <>
            {detailLoading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} /></div>
            ) : selectedTutor && (
              <>
                {/* Profile header */}
                <div className="text-center mb-5">
                  <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-2xl overflow-hidden" style={{ background: "rgba(34,197,94,0.06)" }}>
                    {selectedTutor.avatarUrl ? <img src={selectedTutor.avatarUrl} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
                      : <span className="text-3xl font-bold" style={{ color: "var(--color-accent-green)" }}>{selectedTutor.displayName.charAt(0)}</span>}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>{selectedTutor.displayName}</h1>
                    {selectedTutor.isVerified && <CheckCircle2 className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />}
                  </div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    {renderStars(selectedTutor.rating)}
                    <span className="text-xs ml-1" style={{ color: "var(--color-text-muted)" }}>{selectedTutor.rating.toFixed(1)} ({selectedTutor.totalReviews} reviews)</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                  <div className="card p-3 text-center">
                    <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-accent-green)" }}>₦{selectedTutor.hourlyRate.toLocaleString()}</p>
                    <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>per hour</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>{selectedTutor.totalSessions}</p>
                    <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>sessions</p>
                  </div>
                  <div className="card p-3 text-center">
                    <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-warning-400)" }}>{selectedTutor.rating.toFixed(1)}</p>
                    <p className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>rating</p>
                  </div>
                </div>

                {/* Bio */}
                <div className="card p-4 mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>About</p>
                  <p className="text-sm leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>{selectedTutor.bio}</p>
                </div>

                {/* Subjects */}
                <div className="card p-4 mb-4">
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Subjects</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTutor.subjects.map((s) => (
                      <span key={s} className="text-[0.625rem] rounded-full px-2.5 py-1 font-semibold"
                        style={{ background: "rgba(34,197,94,0.06)", color: "var(--color-accent-green)", border: "1px solid rgba(34,197,94,0.12)" }}>
                        {formatSubject(s)}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Qualifications */}
                {selectedTutor.qualifications.length > 0 && (
                  <div className="card p-4 mb-4">
                    <p className="text-xs font-semibold mb-2" style={{ color: "var(--color-text-primary)" }}>Qualifications</p>
                    <div className="space-y-1.5">
                      {selectedTutor.qualifications.map((q, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Award className="h-3.5 w-3.5 shrink-0" style={{ color: "var(--color-warning-400)" }} />
                          <span className="text-sm" style={{ color: "var(--color-text-secondary)" }}>{q}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reviews */}
                {selectedTutor.reviews.length > 0 && (
                  <div className="card p-4 mb-4">
                    <p className="text-xs font-semibold mb-3" style={{ color: "var(--color-text-primary)" }}>Reviews</p>
                    <div className="space-y-3">
                      {selectedTutor.reviews.map((r) => (
                        <div key={r.id} style={{ borderBottom: "1px solid var(--color-surface-border)", paddingBottom: "0.75rem" }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold" style={{ color: "var(--color-text-primary)" }}>{r.studentName}</span>
                              {renderStars(r.rating)}
                            </div>
                            <span className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>
                              {new Date(r.createdAt).toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          {r.comment && <p className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>{r.comment}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Book button */}
                <button onClick={() => setView("book")} className="btn-primary w-full" style={{ padding: "0.875rem" }}>
                  <Calendar className="h-4 w-4" /> Book a Session — ₦{selectedTutor.hourlyRate.toLocaleString()}/hr
                </button>
              </>
            )}
          </>
        )}

        {/* ═══ BOOK SESSION ═══ */}
        {view === "book" && selectedTutor && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-4" style={{ color: "var(--color-text-primary)" }}>Book Session with {selectedTutor.displayName}</h2>

            <div className="space-y-3">
              <div>
                <label className="label">Subject *</label>
                <select value={bookSubject} onChange={(e) => setBookSubject(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                  <option value="">Select subject</option>
                  {selectedTutor.subjects.map((s) => <option key={s} value={s}>{formatSubject(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Topic (optional)</label>
                <input value={bookTopic} onChange={(e) => setBookTopic(e.target.value)} placeholder="e.g. Quadratic equations" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Date *</label>
                  <input type="date" value={bookDate} onChange={(e) => setBookDate(e.target.value)} className="input-field" min={new Date().toISOString().split("T")[0]} />
                </div>
                <div>
                  <label className="label">Time *</label>
                  <input type="time" value={bookTime} onChange={(e) => setBookTime(e.target.value)} className="input-field" />
                </div>
              </div>
              <div>
                <label className="label">Duration</label>
                <div className="flex gap-1.5">
                  {[30, 60, 90, 120].map((d) => (
                    <button key={d} onClick={() => setBookDuration(d)}
                      className="flex-1 rounded-lg py-2 text-xs font-semibold transition-all"
                      style={{
                        background: bookDuration === d ? "rgba(34,197,94,0.08)" : "var(--color-surface-light)",
                        border: `1.5px solid ${bookDuration === d ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                        color: bookDuration === d ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
                      }}>
                      {d} min
                    </button>
                  ))}
                </div>
              </div>

              {/* Price summary */}
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}>
                <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Total</span>
                <span className="text-lg font-bold" style={{ fontFamily: "var(--font-display)", color: "var(--color-accent-green)" }}>
                  ₦{Math.round(selectedTutor.hourlyRate * (bookDuration / 60)).toLocaleString()}
                </span>
              </div>

              <button onClick={handleBook} disabled={booking || !bookSubject || !bookDate || !bookTime} className="btn-primary w-full"
                style={{ padding: "0.875rem", opacity: (!bookSubject || !bookDate || !bookTime) ? 0.4 : 1 }}>
                {booking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calendar className="h-4 w-4" />}
                Confirm Booking
              </button>
            </div>
          </div>
        )}

        {/* ═══ REGISTER AS TUTOR ═══ */}
        {view === "register" && (
          <div className="card p-5">
            <h2 className="text-sm font-semibold mb-1" style={{ color: "var(--color-text-primary)" }}>Become a JambOS Tutor</h2>
            <p className="text-xs mb-4" style={{ color: "var(--color-text-tertiary)" }}>Help students prepare for JAMB and earn money</p>

            <div className="space-y-3">
              <div>
                <label className="label">Display Name *</label>
                <input value={regName} onChange={(e) => setRegName(e.target.value)} placeholder="How students will see you" className="input-field" />
              </div>
              <div>
                <label className="label">Bio *</label>
                <textarea value={regBio} onChange={(e) => setRegBio(e.target.value)} placeholder="Tell students about your experience and teaching style..." className="input-field" rows={4} style={{ resize: "vertical" }} />
              </div>
              <div>
                <label className="label">Subjects * (select up to 4)</label>
                <div className="flex flex-wrap gap-1.5">
                  {JAMB_SUBJECTS.map((s) => {
                    const isSelected = regSubjects.includes(s.value);
                    const disabled = !isSelected && regSubjects.length >= 4;
                    return (
                      <button key={s.value} onClick={() => {
                        if (isSelected) setRegSubjects((prev) => prev.filter((x) => x !== s.value));
                        else if (!disabled) setRegSubjects((prev) => [...prev, s.value]);
                      }}
                        className="rounded-full px-2.5 py-1 text-[0.625rem] font-semibold transition-all"
                        style={{
                          background: isSelected ? "rgba(34,197,94,0.08)" : "var(--color-surface-lighter)",
                          border: `1px solid ${isSelected ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
                          color: isSelected ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
                          opacity: disabled ? 0.3 : 1,
                        }}>
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <label className="label">Qualifications (comma separated)</label>
                <input value={regQualifications} onChange={(e) => setRegQualifications(e.target.value)} placeholder="e.g. B.Sc Physics, PGDE, 5 years teaching" className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Hourly Rate (₦) *</label>
                  <input type="number" value={regRate} onChange={(e) => setRegRate(e.target.value)} placeholder="e.g. 2000" className="input-field" min={500} />
                </div>
                <div>
                  <label className="label">State</label>
                  <select value={regState} onChange={(e) => setRegState(e.target.value)} className="input-field" style={{ appearance: "none" }}>
                    <option value="">Select</option>
                    {NIGERIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={handleRegister} disabled={registering || !regName || !regBio || regSubjects.length === 0 || !regRate} className="btn-primary w-full" style={{ padding: "0.875rem" }}>
                {registering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Register as Tutor
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}