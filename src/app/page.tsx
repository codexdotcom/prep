"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Brain,
  Zap,
  Target,
  Trophy,
  BarChart3,
  BookOpen,
  Clock,
  ChevronRight,
  Star,
  ArrowRight,
  CheckCircle2,
  Flame,
  Users,
  TrendingUp,
  Shield,
  Sparkles,
  MessageCircle,
  Play,
} from "lucide-react";

// ─── Animated counter ───
function AnimatedNumber({ value, duration = 1500 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const start = performance.now();
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(animate);
          };
          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration]);

  return <span ref={ref}>{display.toLocaleString()}</span>;
}

// ─── Floating particles background ───
function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    let animId: number;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles: Array<{
      x: number; y: number; vx: number; vy: number; size: number; opacity: number;
    }> = [];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 1.5 + 0.5,
        opacity: Math.random() * 0.2 + 0.03,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 197, 94, ${p.opacity})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}

// ─── Score prediction demo ───
function ScorePredictor() {
  const [current, setCurrent] = useState(187);
  const [improved, setImproved] = useState(187);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          // Animate current score
          setTimeout(() => {
            const start = performance.now();
            const animate = (now: number) => {
              const p = Math.min((now - start) / 1200, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setCurrent(Math.round(187 + eased * (247 - 187)));
              if (p < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }, 400);

          // Animate improved score
          setTimeout(() => {
            const start = performance.now();
            const animate = (now: number) => {
              const p = Math.min((now - start) / 1500, 1);
              const eased = 1 - Math.pow(1 - p, 3);
              setImproved(Math.round(247 + eased * (312 - 247)));
              if (p < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }, 1800);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [hasAnimated]);

  return (
    <div ref={ref} className="relative">
      {/* Mock phone frame */}
      <div
        className="mx-auto w-full max-w-[280px] rounded-[2rem] p-3"
        style={{
          background: "var(--color-surface-card)",
          border: "1px solid var(--color-surface-border)",
          boxShadow: "var(--shadow-glow-lg)",
        }}
      >
        {/* Notch */}
        <div
          className="mx-auto mb-3 h-5 w-24 rounded-full"
          style={{ background: "var(--color-surface)" }}
        />

        <div className="rounded-2xl p-4" style={{ background: "var(--color-surface)" }}>
          {/* Mini header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--color-accent-green)" }} />
              <span className="text-[0.5625rem] font-semibold" style={{ color: "var(--color-text-tertiary)" }}>
                JambOS
              </span>
            </div>
            <span className="text-[0.5rem]" style={{ color: "var(--color-text-muted)" }}>Live</span>
          </div>

          {/* Current prediction */}
          <div
            className="rounded-xl p-3 mb-3 text-center"
            style={{ background: "var(--color-surface-light)", border: "1px solid var(--color-surface-border)" }}
          >
            <p className="text-[0.5625rem] mb-1" style={{ color: "var(--color-text-muted)" }}>
              Current predicted score
            </p>
            <p
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "2rem",
                lineHeight: 1,
                color: current >= 250 ? "var(--color-accent-green)" : "var(--color-warning-400)",
              }}
            >
              {current}
            </p>
            <p className="text-[0.5rem] mt-1" style={{ color: "var(--color-text-muted)" }}>out of 400</p>
          </div>

          {/* AI suggestion */}
          <div
            className="rounded-xl p-3 mb-3"
            style={{
              background: "rgba(34, 197, 94, 0.06)",
              border: "1px solid rgba(34, 197, 94, 0.15)",
            }}
          >
            <p className="text-[0.5625rem] leading-relaxed" style={{ color: "var(--color-text-secondary)" }}>
              Improve <strong style={{ color: "var(--color-accent-green)" }}>Vectors</strong> and{" "}
              <strong style={{ color: "var(--color-accent-green)" }}>Organic Chemistry</strong> to reach:
            </p>
            <p
              className="mt-1"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.5rem",
                lineHeight: 1,
                color: "var(--color-accent-green)",
              }}
            >
              {improved}
            </p>
          </div>

          {/* Mini progress bars */}
          <div className="space-y-2">
            {[
              { label: "Physics", pct: 72, color: "var(--color-info-400)" },
              { label: "Chemistry", pct: 45, color: "var(--color-danger-400)" },
              { label: "Maths", pct: 81, color: "var(--color-accent-green)" },
              { label: "English", pct: 68, color: "var(--color-warning-400)" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[0.5rem]" style={{ color: "var(--color-text-tertiary)" }}>{s.label}</span>
                  <span className="text-[0.5rem] font-semibold" style={{ fontFamily: "var(--font-mono)", color: s.color }}>
                    {s.pct}%
                  </span>
                </div>
                <div style={{ height: "3px", borderRadius: "9999px", background: "var(--color-surface-lighter)", overflow: "hidden" }}>
                  <div
                    style={{
                      width: hasAnimated ? `${s.pct}%` : "0%",
                      height: "100%",
                      borderRadius: "9999px",
                      background: s.color,
                      transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
                      transitionDelay: "2.5s",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ───
export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "var(--color-accent-green)", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const features = [
    {
      icon: Brain,
      title: "AI That Knows You",
      description: "The platform studies how you learn — speed, mistakes, confidence — then adapts every quiz, plan, and recommendation to you specifically.",
      color: "var(--color-accent-green)",
    },
    {
      icon: Target,
      title: "Score Prediction",
      description: "See your predicted JAMB score update in real-time as you practice. Know exactly where you stand and what to fix to hit your target.",
      color: "var(--color-info-400)",
    },
    {
      icon: MessageCircle,
      title: "AI Tutor On Demand",
      description: "Stuck on a question? Ask the AI tutor. It explains concepts step-by-step in simple English, with worked examples and exam tips.",
      color: "var(--color-tier-elite)",
    },
    {
      icon: Flame,
      title: "Streaks & Rewards",
      description: "Daily missions, XP points, level-ups, and achievements keep you coming back. Study consistently without it feeling like work.",
      color: "var(--color-warning-400)",
    },
    {
      icon: Trophy,
      title: "Compete Nationally",
      description: "See how you rank against students across Nigeria. Weekly leaderboards, school rankings, and friend challenges fuel healthy competition.",
      color: "var(--color-danger-400)",
    },
    {
      icon: Clock,
      title: "Smart Study Planner",
      description: "AI generates your daily study plan based on weak topics, spaced repetition science, and your available time. Just open and start.",
      color: "var(--color-accent-green)",
    },
  ];

  const stats = [
    { value: 5000, suffix: "+", label: "Past Questions" },
    { value: 4, suffix: "", label: "JAMB Subjects" },
    { value: 99, suffix: "%", label: "Uptime" },
    { value: 24, suffix: "/7", label: "AI Tutor Access" },
  ];

  const testimonials = [
    {
      name: "Chioma A.",
      score: "From 198 → 287",
      text: "I was just doing past questions randomly before JambOS. The AI told me exactly what I was weak at and gave me a daily plan. My score jumped 89 points in 6 weeks.",
      state: "Lagos",
    },
    {
      name: "Emeka O.",
      score: "From 215 → 311",
      text: "The score prediction scared me at first — it said I'd get 220. But it also showed me what to fix. I followed the study plan religiously and ended up with 311.",
      state: "Anambra",
    },
    {
      name: "Fatima M.",
      score: "From 172 → 268",
      text: "I used to study for 5 hours and still fail. JambOS made me study smarter, not longer. The AI tutor explained organic chemistry in ways my teacher never could.",
      state: "Kano",
    },
  ];

  const faqs = [
    {
      q: "Is JambOS free?",
      a: "Yes. The core CBT simulator, limited past questions, and basic analytics are completely free. Premium plans unlock AI tutoring, advanced analytics, unlimited practice, and score prediction.",
    },
    {
      q: "How is this different from other JAMB apps?",
      a: "Most apps just dump questions and show scores. JambOS uses AI to identify your weak topics, predict your JAMB score, generate personalized study plans, and explain every question in detail. It adapts to how you learn.",
    },
    {
      q: "Does it work offline?",
      a: "Core features work on slow connections. Full offline mode is coming soon. The app is designed to be ultra-lightweight for Nigerian data conditions.",
    },
    {
      q: "What subjects are covered?",
      a: "All JAMB subjects — Use of English, Mathematics, Physics, Chemistry, Biology, Literature, Government, Economics, Commerce, Accounting, and more. Questions are organized by topic and difficulty.",
    },
    {
      q: "How accurate is the score prediction?",
      a: "The more you practice, the more accurate it gets. After about 100 questions, the prediction is typically within 15-20 points of your actual JAMB performance.",
    },
  ];

  return (
    <div className="relative" style={{ background: "var(--color-surface)" }}>
      <ParticleField />

      {/* ════════════ NAV ════════════ */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: "rgba(10, 31, 10, 0.85)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-1.5">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              Jamb
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-accent-green)" }}>
              OS
            </span>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--color-accent-green)" }} />
          </div>

          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="btn-ghost" style={{ fontSize: "0.8125rem" }}>
              Log in
            </Link>
            <Link href="/auth/signup" className="btn-primary" style={{ fontSize: "0.8125rem", padding: "0.5rem 1rem" }}>
              Start Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ════════════ HERO ════════════ */}
      <section className="relative z-10 overflow-hidden">
        {/* Gradient orbs */}
        <div className="absolute top-[-30%] right-[-15%] h-[600px] w-[600px] rounded-full blur-[140px]" style={{ background: "rgba(34, 197, 94, 0.04)" }} />
        <div className="absolute bottom-[-20%] left-[-10%] h-[500px] w-[500px] rounded-full blur-[120px]" style={{ background: "rgba(10, 122, 10, 0.06)" }} />

        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            {/* Left — Copy */}
            <div>
              <div
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 mb-6"
                style={{
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.15)",
                }}
              >
                <Sparkles className="h-3 w-3" style={{ color: "var(--color-accent-green)" }} />
                <span className="text-xs font-medium" style={{ color: "var(--color-accent-green)" }}>
                  AI-Powered JAMB Preparation
                </span>
              </div>

              <h1
                className="mb-5"
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: "clamp(2rem, 5vw, 3.25rem)",
                  lineHeight: 1.15,
                  color: "var(--color-text-primary)",
                }}
              >
                Your Smartest Path
                <br />
                <span style={{ color: "var(--color-accent-green)" }}>Into University</span>
              </h1>

              <p
                className="mb-8 max-w-lg text-base sm:text-lg"
                style={{ color: "var(--color-text-tertiary)", lineHeight: 1.7 }}
              >
                JambOS uses AI to predict your JAMB score, find your weak topics, build your study plan, and explain every question — so you stop guessing and start improving.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link
                  href="/auth/signup"
                  className="btn-primary"
                  style={{ padding: "0.875rem 1.5rem", fontSize: "1rem" }}
                >
                  <Zap className="h-5 w-5" />
                  Start Preparing — It&apos;s Free
                </Link>
                <Link
                  href="#how-it-works"
                  className="btn-secondary"
                  style={{ padding: "0.875rem 1.5rem", fontSize: "1rem" }}
                >
                  <Play className="h-4 w-4" />
                  See How It Works
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-4">
                <div className="flex -space-x-2">
                  {["C", "E", "F", "A", "O"].map((letter, i) => (
                    <div
                      key={i}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold"
                      style={{
                        background: `hsl(${140 + i * 30}, 60%, ${25 + i * 5}%)`,
                        border: "2px solid var(--color-surface)",
                        color: "var(--color-text-primary)",
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3 w-3" fill="var(--color-warning-400)" style={{ color: "var(--color-warning-400)" }} />
                    ))}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>
                    Trusted by students across Nigeria
                  </p>
                </div>
              </div>
            </div>

            {/* Right — Score predictor demo */}
            <div className="hidden lg:block">
              <ScorePredictor />
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ STATS BAR ════════════ */}
      <section
        className="relative z-10"
        style={{
          background: "var(--color-surface-card)",
          borderTop: "1px solid var(--color-surface-border)",
          borderBottom: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ value, suffix, label }) => (
              <div key={label} className="text-center">
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-text-primary)" }}>
                  <AnimatedNumber value={value} />
                  {suffix}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--color-text-muted)" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ MOBILE DEMO (shown on mobile, hidden on desktop where ScorePredictor shows) ════════════ */}
      <section className="relative z-10 lg:hidden px-4 py-12">
        <ScorePredictor />
      </section>

      {/* ════════════ HOW IT WORKS ════════════ */}
      <section id="how-it-works" className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="section-label mb-2" style={{ color: "var(--color-accent-green)" }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)" }}>
              Three Steps to a Better Score
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: "01",
                title: "Take the Diagnostic",
                description: "40 questions across your subjects. The AI maps your strengths, weaknesses, speed, and careless error patterns in under 30 minutes.",
                icon: BarChart3,
              },
              {
                step: "02",
                title: "Follow Your Plan",
                description: "Every day, JambOS generates a personalized study session — targeting your weakest topics with the right difficulty level at the right time.",
                icon: BookOpen,
              },
              {
                step: "03",
                title: "Watch Your Score Rise",
                description: "Track your predicted JAMB score as it climbs. The AI continuously adjusts your plan as you improve, pushing you closer to your target.",
                icon: TrendingUp,
              },
            ].map(({ step, title, description, icon: Icon }) => (
              <div
                key={step}
                className="rounded-2xl p-6"
                style={{
                  background: "var(--color-surface-card)",
                  border: "1px solid var(--color-surface-border)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold"
                    style={{
                      fontFamily: "var(--font-mono)",
                      background: "rgba(34, 197, 94, 0.1)",
                      color: "var(--color-accent-green)",
                    }}
                  >
                    {step}
                  </span>
                  <Icon className="h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
                </div>
                <h3
                  className="mb-2"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "var(--color-text-primary)" }}
                >
                  {title}
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FEATURES ════════════ */}
      <section className="relative z-10 px-4 py-16 sm:py-24" style={{ background: "var(--color-surface-card)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="section-label mb-2" style={{ color: "var(--color-accent-green)" }}>FEATURES</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)" }}>
              Not Just Another CBT App
            </h2>
            <p className="mt-3 text-sm mx-auto max-w-lg" style={{ color: "var(--color-text-tertiary)" }}>
              Every feature is designed around one goal: getting you the highest JAMB score possible with the least wasted effort.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div
                key={title}
                className="rounded-2xl p-5 transition-all duration-200"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-surface-border)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = `${color}40`;
                  (e.currentTarget as HTMLElement).style.boxShadow = `0 0 20px ${color}10`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = "var(--color-surface-border)";
                  (e.currentTarget as HTMLElement).style.boxShadow = "none";
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl mb-4"
                  style={{ background: `${color}12` }}
                >
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3
                  className="mb-2"
                  style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "var(--color-text-primary)" }}
                >
                  {title}
                </h3>
                <p className="text-sm" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ SCORE COMPARISON ════════════ */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="section-label mb-2" style={{ color: "var(--color-accent-green)" }}>THE DIFFERENCE</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)" }}>
              What Happens When You Study Smarter
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Without */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(239, 68, 68, 0.04)",
                border: "1px solid rgba(239, 68, 68, 0.1)",
              }}
            >
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-danger-400)" }}>
                Without JambOS
              </p>
              <ul className="space-y-3">
                {[
                  "Study random topics with no direction",
                  "No idea which areas are weakest",
                  "Repeat the same mistakes",
                  "Guess your readiness level",
                  "Burn out from inefficient cramming",
                  "Walk into JAMB hall hoping for the best",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "var(--color-danger-400)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* With */}
            <div
              className="rounded-2xl p-6"
              style={{
                background: "rgba(34, 197, 94, 0.04)",
                border: "1px solid rgba(34, 197, 94, 0.15)",
                boxShadow: "var(--shadow-glow)",
              }}
            >
              <p className="text-sm font-semibold mb-4" style={{ color: "var(--color-accent-green)" }}>
                With JambOS
              </p>
              <ul className="space-y-3">
                {[
                  "AI builds your daily study plan automatically",
                  "Know exactly where you're weak and strong",
                  "Understand why every answer is right or wrong",
                  "See your predicted score update in real-time",
                  "Study less time, cover more ground",
                  "Walk into JAMB hall knowing your score range",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "var(--color-text-secondary)" }}>
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--color-accent-green)" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════ TESTIMONIALS ════════════ */}
      <section className="relative z-10 px-4 py-16 sm:py-24" style={{ background: "var(--color-surface-card)" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="section-label mb-2" style={{ color: "var(--color-accent-green)" }}>RESULTS</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)" }}>
              Real Students, Real Score Jumps
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl p-5"
                style={{
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-surface-border)",
                }}
              >
                <div className="flex items-center gap-0.5 mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="h-3 w-3" fill="var(--color-warning-400)" style={{ color: "var(--color-warning-400)" }} />
                  ))}
                </div>
                <p
                  className="text-sm mb-4"
                  style={{ color: "var(--color-text-secondary)", lineHeight: 1.6 }}
                >
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
                      {t.name}
                    </p>
                    <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>{t.state}</p>
                  </div>
                  <span
                    className="badge badge-green"
                    style={{ fontSize: "0.6875rem", fontWeight: 600 }}
                  >
                    {t.score}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FAQ ════════════ */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="section-label mb-2" style={{ color: "var(--color-accent-green)" }}>FAQ</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)" }}>
              Common Questions
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map(({ q, a }) => (
              <FAQItem key={q} question={q} answer={a} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════ FINAL CTA ════════════ */}
      <section className="relative z-10 px-4 py-16 sm:py-24">
        <div
          className="mx-auto max-w-3xl rounded-3xl p-8 sm:p-12 text-center"
          style={{
            background: "var(--color-surface-card)",
            border: "1px solid rgba(34, 197, 94, 0.2)",
            boxShadow: "var(--shadow-glow-lg)",
          }}
        >
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{ background: "rgba(34, 197, 94, 0.1)" }}
          >
            <Zap className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
          </div>

          <h2
            className="mb-3"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "var(--color-text-primary)" }}
          >
            Ready to See Your Real Score?
          </h2>

          <p
            className="mb-8 mx-auto max-w-md text-sm sm:text-base"
            style={{ color: "var(--color-text-tertiary)", lineHeight: 1.7 }}
          >
            Take the free diagnostic test. In 30 minutes you&apos;ll know your predicted JAMB score, your weakest topics, and exactly what to study first.
          </p>

          <Link
            href="/auth/signup"
            className="btn-primary inline-flex"
            style={{ padding: "1rem 2rem", fontSize: "1rem" }}
          >
            <Zap className="h-5 w-5" />
            Start Free — No Card Needed
          </Link>

          <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
            Free plan includes 20 questions/day, CBT simulator, and basic analytics
          </p>
        </div>
      </section>

      {/* ════════════ FOOTER ════════════ */}
      <footer
        className="relative z-10"
        style={{
          background: "var(--color-surface-card)",
          borderTop: "1px solid var(--color-surface-border)",
        }}
      >
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-4">
            {/* Brand */}
            <div className="sm:col-span-2">
              <div className="flex items-center gap-1.5 mb-3">
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
                  Jamb
                </span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-accent-green)" }}>
                  OS
                </span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
                Nigeria&apos;s AI-powered JAMB preparation platform. Smarter studying, higher scores, university admission.
              </p>
            </div>

            {/* Links */}
            <div>
              <p className="section-label mb-3">Product</p>
              <ul className="space-y-2">
                {[
                  { label: "Features", href: "#how-it-works" },
                  { label: "Pricing", href: "/subscription" },
                  { label: "AI Tutor", href: "/auth/signup" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="section-label mb-3">Legal</p>
              <ul className="space-y-2">
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map(({ label, href }) => (
                  <li key={label}>
                    <Link
                      href={href}
                      className="text-sm transition-colors hover:underline"
                      style={{ color: "var(--color-text-tertiary)" }}
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div
            className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: "1px solid var(--color-surface-border)" }}
          >
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              © {new Date().getFullYear()} JambOS. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
              Built for Nigerian students, by Nigerian builders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── FAQ Accordion ───
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-xl p-4 transition-all"
      style={{
        background: "var(--color-surface-card)",
        border: `1px solid ${open ? "rgba(34, 197, 94, 0.2)" : "var(--color-surface-border)"}`,
      }}
    >
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
          {question}
        </p>
        <ChevronRight
          className="h-4 w-4 shrink-0 transition-transform"
          style={{
            color: "var(--color-text-muted)",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
          }}
        />
      </div>
      {open && (
        <p
          className="mt-3 text-sm"
          style={{
            color: "var(--color-text-tertiary)",
            lineHeight: 1.6,
            animation: "var(--animate-fade-in)",
          }}
        >
          {answer}
        </p>
      )}
    </button>
  );
}