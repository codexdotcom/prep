"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Compass, ChevronRight, Loader2, Briefcase, GraduationCap, TrendingUp, Zap } from "lucide-react";

const INTERESTS = ["Technology", "Medicine", "Law", "Business", "Arts", "Engineering", "Science", "Education", "Media", "Finance", "Agriculture", "Sports"];
const STRENGTHS = ["Mathematics", "Physics", "Chemistry", "Biology", "English", "Problem Solving", "Communication", "Creative Thinking", "Leadership", "Research"];
const STYLES = [
  { value: "office", label: "Office/Corporate" },
  { value: "field", label: "Fieldwork/Hands-on" },
  { value: "creative", label: "Creative/Independent" },
  { value: "remote", label: "Remote/Flexible" },
  { value: "public", label: "Public Service" },
];

interface Career {
  career: string; course: string; subjects: string[]; salary: string; growth: string; reason: string; universities: string[];
}

export default function CareerPage() {
  const router = useRouter();
  const [step, setStep] = useState<"interests" | "strengths" | "style" | "results">("interests");
  const [interests, setInterests] = useState<string[]>([]);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [style, setStyle] = useState("");
  const [careers, setCareers] = useState<Career[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  const toggle = (arr: string[], item: string, setter: (v: string[]) => void) => {
    setter(arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item]);
  };

  const discover = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/career/discover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interests, strengths, preferredStyle: style }),
      });
      const data = await res.json();
      if (res.ok) { setCareers(data.careers || []); setStep("results"); }
    } catch {} finally { setLoading(false); }
  };

  const Chips = ({ items, selected, onToggle, max }: { items: string[]; selected: string[]; onToggle: (item: string) => void; max: number }) => (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const isSelected = selected.includes(item);
        const disabled = !isSelected && selected.length >= max;
        return (
          <button
            key={item}
            onClick={() => !disabled && onToggle(item)}
            className="rounded-full px-3.5 py-2 text-xs font-medium transition-all"
            style={{
              background: isSelected ? "rgba(34,197,94,0.1)" : "var(--color-surface-card)",
              border: `1.5px solid ${isSelected ? "var(--color-accent-green)" : "var(--color-surface-border)"}`,
              color: isSelected ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
              opacity: disabled ? 0.3 : 1,
            }}
          >
            {item}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-screen pb-12" style={{ background: "var(--color-surface)" }}>
      <header className="sticky top-0 z-30" style={{ background: "var(--color-surface-card)", borderBottom: "1px solid var(--color-surface-border)", backdropFilter: "blur(12px)" }}>
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
          <button onClick={() => { if (step === "results") setStep("style"); else if (step === "style") setStep("strengths"); else if (step === "strengths") setStep("interests"); else router.push("/dashboard"); }} className="btn-ghost"><ArrowLeft className="h-4 w-4" /></button>
          <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Career Discovery</span>
          <div />
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 pt-6">
        {step === "interests" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>What interests you?</h2>
            <p className="text-sm mt-1 mb-6" style={{ color: "var(--color-text-tertiary)" }}>Pick up to 4 areas you find exciting</p>
            <Chips items={INTERESTS} selected={interests} onToggle={(i) => toggle(interests, i, setInterests)} max={4} />
            <button onClick={() => setStep("strengths")} disabled={interests.length === 0} className="btn-primary w-full mt-6" style={{ opacity: interests.length === 0 ? 0.4 : 1 }}>
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === "strengths" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>What are you good at?</h2>
            <p className="text-sm mt-1 mb-6" style={{ color: "var(--color-text-tertiary)" }}>Pick up to 4 strengths</p>
            <Chips items={STRENGTHS} selected={strengths} onToggle={(i) => toggle(strengths, i, setStrengths)} max={4} />
            <button onClick={() => setStep("style")} disabled={strengths.length === 0} className="btn-primary w-full mt-6" style={{ opacity: strengths.length === 0 ? 0.4 : 1 }}>
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {step === "style" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>How do you prefer to work?</h2>
            <p className="text-sm mt-1 mb-6" style={{ color: "var(--color-text-tertiary)" }}>Pick the environment that suits you best</p>
            <div className="space-y-2">
              {STYLES.map((s) => (
                <button key={s.value} onClick={() => setStyle(s.value)} className="w-full rounded-xl p-4 text-left transition-all"
                  style={{ background: style === s.value ? "rgba(34,197,94,0.06)" : "var(--color-surface-card)", border: `1.5px solid ${style === s.value ? "var(--color-accent-green)" : "var(--color-surface-border)"}` }}>
                  <p className="text-sm font-medium" style={{ color: style === s.value ? "var(--color-accent-green)" : "var(--color-text-primary)" }}>{s.label}</p>
                </button>
              ))}
            </div>
            <button onClick={discover} disabled={!style || loading} className="btn-primary w-full mt-6" style={{ opacity: !style ? 0.4 : 1 }}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
              Discover Careers
            </button>
          </div>
        )}

        {step === "results" && (
          <div>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)", marginBottom: "1rem" }}>Your Career Matches</h2>
            <div className="space-y-3">
              {careers.map((c, i) => (
                <button key={i} onClick={() => setExpanded(expanded === i ? null : i)} className="w-full text-left card p-4 transition-all"
                  style={{ borderColor: expanded === i ? "rgba(34,197,94,0.2)" : undefined }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>{c.career}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>{c.course}</p>
                    </div>
                    <span className="badge badge-green" style={{ fontSize: "0.5625rem" }}>{c.growth} Growth</span>
                  </div>
                  {expanded === i && (
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--color-surface-border)" }}>
                      <p className="text-xs" style={{ color: "var(--color-text-secondary)" }}>{c.reason}</p>
                      <div className="flex items-center gap-2">
                        <Briefcase className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Salary: {c.salary}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <GraduationCap className="h-3 w-3" style={{ color: "var(--color-text-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--color-text-tertiary)" }}>Top schools: {c.universities?.join(", ")}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.subjects?.map((s) => (
                          <span key={s} className="text-[0.5625rem] rounded-full px-2 py-0.5" style={{ background: "var(--color-surface-lighter)", color: "var(--color-text-muted)", border: "1px solid var(--color-surface-border)" }}>{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
            <button onClick={() => setStep("interests")} className="btn-secondary w-full mt-4">Try Different Answers</button>
          </div>
        )}
      </div>
    </div>
  );
}