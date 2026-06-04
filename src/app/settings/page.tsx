"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  User,
  Save,
  Loader2,
  Crown,
  ChevronRight,
  BookOpen,
  Target,
  MapPin,
  GraduationCap,
  Calendar,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
import { NIGERIAN_STATES, JAMB_SUBJECTS } from "@/lib/data/nigerian-states";

interface ProfileData {
  firstName: string;
  lastName: string;
  state: string;
  city: string;
  schoolName: string;
  schoolType: string;
  classLevel: string;
  examYear: number;
  targetScore: number;
  preferredCourse: string;
  preferredUni: string;
  studyHoursPerDay: number;
  preferredTimeSlot: string;
  learningStyle: string;
  subjects: string[];
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "academic" | "preferences">("profile");

  const userImage = session?.user?.image;
  const userInitial = (session?.user?.name || "U").charAt(0).toUpperCase();

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/settings/profile");
        const data = await res.json();
        if (res.ok && data.profile) {
          setProfile(data.profile);
        }
      } catch {
        console.error("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const update = (field: keyof ProfileData, value: any) => {
    setProfile((prev) => prev ? { ...prev, [field]: value } : prev);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  const TABS = [
    { key: "profile" as const, label: "Personal", icon: User },
    { key: "academic" as const, label: "Academic", icon: GraduationCap },
    { key: "preferences" as const, label: "Study Prefs", icon: Clock },
  ];

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => router.push("/dashboard")} className="btn-ghost">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Settings
          </span>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saved ? "Saved" : "Save"}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {/* Profile header */}
        <div className="card p-5 mb-6 flex items-center gap-4">
          {userImage ? (
            <img
              src={userImage}
              alt=""
              className="h-16 w-16 rounded-2xl object-cover"
              style={{ border: "3px solid var(--color-surface-border)" }}
              referrerPolicy="no-referrer"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold"
              style={{
                background: "rgba(34, 197, 94, 0.1)",
                color: "var(--color-accent-green)",
                border: "3px solid var(--color-surface-border)",
              }}
            >
              {userInitial}
            </div>
          )}
          <div>
            <p className="text-base font-semibold" style={{ color: "var(--color-text-primary)" }}>
              {profile?.firstName} {profile?.lastName}
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              {session?.user?.email}
            </p>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-2 mb-6">
          <button
            onClick={() => router.push("/subscription")}
            className="card-interactive flex w-full items-center gap-3 p-3.5 text-left"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl"
              style={{ background: "rgba(245, 158, 11, 0.1)" }}
            >
              <Crown className="h-4 w-4" style={{ color: "var(--color-warning-400)" }} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                Manage Subscription
              </p>
              <p className="text-[0.625rem]" style={{ color: "var(--color-text-tertiary)" }}>
                View or upgrade your plan
              </p>
            </div>
            <ChevronRight className="h-4 w-4" style={{ color: "var(--color-text-muted)" }} />
          </button>
        </div>

        {/* Tabs */}
        <div
          className="flex gap-1 mb-5 p-1 rounded-xl"
          style={{ background: "var(--color-surface-light)" }}
        >
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className="flex items-center gap-1.5 flex-1 justify-center rounded-lg py-2 text-xs font-semibold transition-all"
              style={{
                background: activeTab === key ? "var(--color-surface-card)" : "transparent",
                color: activeTab === key ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                boxShadow: activeTab === key ? "var(--shadow-card)" : "none",
              }}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>

        {/* ═══ Personal Tab ═══ */}
        {activeTab === "profile" && profile && (
          <div className="card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">First Name</label>
                <input
                  value={profile.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label">Last Name</label>
                <input
                  value={profile.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  className="input-field"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">State</label>
                <select
                  value={profile.state || ""}
                  onChange={(e) => update("state", e.target.value)}
                  className="input-field"
                  style={{ appearance: "none" }}
                >
                  <option value="">Select state</option>
                  {NIGERIAN_STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">City</label>
                <input
                  value={profile.city || ""}
                  onChange={(e) => update("city", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Ikeja"
                />
              </div>
            </div>
            <div>
              <label className="label">School Name</label>
              <input
                value={profile.schoolName || ""}
                onChange={(e) => update("schoolName", e.target.value)}
                className="input-field"
                placeholder="e.g. Federal Government College"
              />
            </div>
          </div>
        )}

        {/* ═══ Academic Tab ═══ */}
        {activeTab === "academic" && profile && (
          <div className="card p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Exam Year</label>
                <input
                  type="number"
                  value={profile.examYear}
                  onChange={(e) => update("examYear", parseInt(e.target.value) || 2026)}
                  className="input-field"
                  min={2025}
                  max={2030}
                />
              </div>
              <div>
                <label className="label">Target Score</label>
                <input
                  type="number"
                  value={profile.targetScore}
                  onChange={(e) => update("targetScore", parseInt(e.target.value) || 250)}
                  className="input-field"
                  min={100}
                  max={400}
                />
              </div>
            </div>
            <div>
              <label className="label">Preferred Course</label>
              <input
                value={profile.preferredCourse || ""}
                onChange={(e) => update("preferredCourse", e.target.value)}
                className="input-field"
                placeholder="e.g. Computer Science"
              />
            </div>
            <div>
              <label className="label">Preferred University</label>
              <input
                value={profile.preferredUni || ""}
                onChange={(e) => update("preferredUni", e.target.value)}
                className="input-field"
                placeholder="e.g. University of Lagos"
              />
            </div>
          </div>
        )}

        {/* ═══ Preferences Tab ═══ */}
        {activeTab === "preferences" && profile && (
          <div className="card p-5 space-y-4">
            <div>
              <label className="label">Daily Study Hours</label>
              <input
                type="number"
                value={profile.studyHoursPerDay || 2}
                onChange={(e) => update("studyHoursPerDay", parseFloat(e.target.value) || 2)}
                className="input-field"
                min={0.5}
                max={12}
                step={0.5}
                style={{ maxWidth: "120px" }}
              />
            </div>
            <div>
              <label className="label">Preferred Study Time</label>
              <select
                value={profile.preferredTimeSlot || ""}
                onChange={(e) => update("preferredTimeSlot", e.target.value)}
                className="input-field"
                style={{ appearance: "none" }}
              >
                <option value="">Select time slot</option>
                <option value="EARLY_MORNING">Early Morning (5am - 8am)</option>
                <option value="MORNING">Morning (8am - 12pm)</option>
                <option value="AFTERNOON">Afternoon (12pm - 4pm)</option>
                <option value="EVENING">Evening (4pm - 8pm)</option>
                <option value="NIGHT">Night (8pm - 12am)</option>
              </select>
            </div>
            <div>
              <label className="label">Learning Style</label>
              <select
                value={profile.learningStyle || ""}
                onChange={(e) => update("learningStyle", e.target.value)}
                className="input-field"
                style={{ appearance: "none" }}
              >
                <option value="">Select style</option>
                <option value="VISUAL">Visual (diagrams, charts)</option>
                <option value="READING">Reading (text-based)</option>
                <option value="PRACTICE">Practice (hands-on questions)</option>
                <option value="MIXED">Mixed</option>
              </select>
            </div>
          </div>
        )}

        <footer className="mt-12 pt-6 text-center" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
          <Logo size="small" />
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} PrepGenius. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}