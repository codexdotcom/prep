"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Brain, Zap, Target, Trophy, BarChart3, BookOpen, Clock,
  ChevronRight, Star, ArrowRight, CheckCircle2, Flame, TrendingUp,
  Sparkles, MessageCircle, Play, Users, Shield, Lightbulb,
  AlertTriangle, GraduationCap,
} from "lucide-react";

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
          setTimeout(() => {
            const start = performance.now();
            const animate = (now: number) => {
              const p = Math.min((now - start) / 1200, 1);
              setCurrent(Math.round(187 + (1 - Math.pow(1 - p, 3)) * 60));
              if (p < 1) requestAnimationFrame(animate);
            };
            requestAnimationFrame(animate);
          }, 400);
          setTimeout(() => {
            const start = performance.now();
            const animate = (now: number) => {
              const p = Math.min((now - start) / 1500, 1);
              setImproved(Math.round(247 + (1 - Math.pow(1 - p, 3)) * 65));
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
      <div className="mx-auto w-full max-w-[280px] rounded-[2rem] p-3" style={{ background: "#fff", border: "1px solid #e5e5e5", boxShadow: "0 20px 60px rgba(0,0,0,0.08)" }}>
        <div className="mx-auto mb-3 h-5 w-24 rounded-full" style={{ background: "#f5f5f5" }} />
        <div className="rounded-2xl p-4" style={{ background: "#fafafa" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <div className="h-2 w-2 rounded-full" style={{ background: "#111" }} />
              <span className="text-[0.5625rem] font-semibold" style={{ color: "#999" }}>JambOS</span>
            </div>
            <span className="text-[0.5rem]" style={{ color: "#bbb" }}>Live</span>
          </div>
          <div className="rounded-xl p-3 mb-3 text-center" style={{ background: "#fff", border: "1px solid #eee" }}>
            <p className="text-[0.5625rem] mb-1" style={{ color: "#999" }}>Current predicted score</p>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "2rem", lineHeight: 1, color: "#111" }}>{current}</p>
            <p className="text-[0.5rem] mt-1" style={{ color: "#bbb" }}>out of 400</p>
          </div>
          <div className="rounded-xl p-3 mb-3" style={{ background: "#f8f8f8", border: "1px solid #eee" }}>
            <p className="text-[0.5625rem] leading-relaxed" style={{ color: "#555" }}>
              Improve <strong style={{ color: "#111" }}>Vectors</strong> and <strong style={{ color: "#111" }}>Organic Chemistry</strong> to reach:
            </p>
            <p className="mt-1" style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", lineHeight: 1, color: "#111" }}>{improved}</p>
          </div>
          <div className="space-y-2">
            {[
              { label: "Physics", pct: 72, color: "#3b82f6" },
              { label: "Chemistry", pct: 45, color: "#ef4444" },
              { label: "Maths", pct: 81, color: "#111" },
              { label: "English", pct: 68, color: "#f59e0b" },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between mb-0.5">
                  <span className="text-[0.5rem]" style={{ color: "#777" }}>{s.label}</span>
                  <span className="text-[0.5rem] font-semibold" style={{ fontFamily: "var(--font-mono)", color: "#333" }}>{s.pct}%</span>
                </div>
                <div style={{ height: "3px", borderRadius: "9999px", background: "#eee", overflow: "hidden" }}>
                  <div style={{ width: hasAnimated ? `${s.pct}%` : "0%", height: "100%", borderRadius: "9999px", background: s.color, transition: "width 1.5s cubic-bezier(0.16, 1, 0.3, 1)", transitionDelay: "2.5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button onClick={() => setOpen(!open)} className="w-full text-left rounded-xl p-4 transition-all" style={{ background: "#fff", border: `1px solid ${open ? "#ddd" : "#eee"}` }}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold" style={{ color: "#111" }}>{question}</p>
        <ChevronRight className="h-4 w-4 shrink-0 transition-transform" style={{ color: "#999", transform: open ? "rotate(90deg)" : "rotate(0deg)" }} />
      </div>
      {open && <p className="mt-3 text-sm" style={{ color: "#555", lineHeight: 1.6 }}>{answer}</p>}
    </button>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.push("/dashboard");
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "#fafafa" }}>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent" style={{ borderColor: "#111", borderTopColor: "transparent" }} />
      </div>
    );
  }

  const features = [
    { icon: Brain, title: "AI That Knows You", description: "The platform studies how you learn, your speed, mistakes, and confidence, then adapts every quiz and recommendation to you.", color: "#3b82f6" },
    { icon: Target, title: "Score Prediction", description: "See your predicted JAMB score update in real-time as you practice. Know exactly where you stand and what to fix.", color: "#8b5cf6" },
    { icon: MessageCircle, title: "AI Tutor On Demand", description: "Stuck on a question? Ask the AI tutor. It explains concepts step-by-step in simple English, with worked examples.", color: "#ec4899" },
    { icon: Flame, title: "Streaks & Rewards", description: "Daily missions, XP points, level-ups, and achievements keep you coming back. Study consistently without it feeling like work.", color: "#f59e0b" },
    { icon: Trophy, title: "Compete Nationally", description: "See how you rank against students across Nigeria. Weekly leaderboards and school rankings fuel healthy competition.", color: "#ef4444" },
    { icon: Clock, title: "Smart Study Planner", description: "AI generates your daily study plan based on weak topics, spaced repetition, and your available time. Just open and start.", color: "#14b8a6" },
  ];

  const examTips = [
    { icon: Lightbulb, title: "Substitution beats solving", tip: "In JAMB, you don't need to solve equations. Plug in the options. If x\u00b2 - 5x + 6 = 0 and option B is x=2: 4-10+6 = 0. Done. 30 seconds saved.", color: "#f59e0b" },
    { icon: AlertTriangle, title: "The log trap", tip: "log(a + b) \u2260 log(a) + log(b). The correct rule: log(a \u00d7 b) = log a + log b. JAMB tests this every year. Don't fall for it.", color: "#ef4444" },
    { icon: BookOpen, title: "Read questions first", tip: "Most students read the passage first, then the questions. Flip it. Read ALL questions first (30 seconds), then read the passage. Cuts comprehension time by 40%.", color: "#3b82f6" },
    { icon: Brain, title: "Stress pattern hack", tip: "2-syllable nouns: stress on 1st syllable (RE-cord). 2-syllable verbs: stress on 2nd (re-CORD). Words ending in -tion/-sion: stress the syllable BEFORE. This answers 80% of oral English.", color: "#8b5cf6" },
    { icon: Target, title: "SUVAT shortcut", tip: "Each SUVAT equation is missing ONE variable. Look at what's NOT given. No time? Use v\u00b2 = u\u00b2 + 2as. No final velocity? Use s = ut + \u00bdat\u00b2. Pick the right one instantly.", color: "#14b8a6" },
    { icon: Zap, title: "Percentage flip", tip: "x% of y = y% of x. So 8% of 50 = 50% of 8 = 4. Always flip to whichever is easier to calculate mentally. Saves 20+ seconds per question.", color: "#ec4899" },
  ];

  const stats = [
    { value: 5000, suffix: "+", label: "Past Questions" },
    { value: 99, suffix: "%", label: "Uptime" },
    { value: 24, suffix: "/7", label: "AI Tutor Access" },
  ];

  const testimonials = [
    { name: "Chioma A.", score: "198 to 287", text: "I was just doing past questions randomly. The AI told me exactly what I was weak at and gave me a daily plan. My score jumped 89 points in 6 weeks.", state: "Lagos" },
    { name: "Emeka O.", score: "215 to 311", text: "The score prediction scared me at first. But it also showed me what to fix. I followed the study plan and ended up with 311.", state: "Anambra" },
    { name: "Fatima M.", score: "172 to 268", text: "I used to study for 5 hours and still fail. JambOS made me study smarter, not longer. The AI tutor explained organic chemistry in ways my teacher never could.", state: "Kano" },
  ];

  const faqs = [
    { q: "Is JambOS free?", a: "Yes. The core CBT simulator, limited past questions, and basic analytics are completely free. Premium plans unlock AI tutoring, advanced analytics, unlimited practice, and score prediction." },
    { q: "How is this different from other JAMB apps?", a: "Most apps just dump questions and show scores. JambOS uses AI to identify your weak topics, predict your JAMB score, generate personalized study plans, and explain every question in detail." },
    { q: "Does it work offline?", a: "Core features work on slow connections. Full offline mode is coming soon. The app is designed to be ultra-lightweight for Nigerian data conditions." },
    { q: "What subjects are covered?", a: "All JAMB subjects. Use of English, Mathematics, Physics, Chemistry, Biology, Literature, Government, Economics, Commerce, Accounting, and more." },
    { q: "How accurate is the score prediction?", a: "The more you practice, the more accurate it gets. After about 100 questions, the prediction is typically within 15-20 points of your actual JAMB performance." },
  ];

  return (
    <div style={{ background: "#fafafa" }}>
      {/* NAV */}
      <nav className="sticky top-0 z-50" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(16px)", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-0.5">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#111" }}>Jamb</span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#111", fontWeight: 700 }}>OS</span>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/auth/login" className="text-sm font-medium px-3 py-1.5 rounded-lg" style={{ color: "#555" }}>Log in</Link>
            <Link href="/auth/signup" className="text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-1.5" style={{ background: "#111", color: "#fff" }}>
              Start Free <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-4 pt-16 pb-20 sm:pt-24 sm:pb-28">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              

              <h1 className="mb-5" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(2rem, 5vw, 3.25rem)", lineHeight: 1.15, color: "#111" }}>
                Your Smartest Path<br />
                <span style={{ color: "#111", textDecoration: "underline", textDecorationColor: "#3b82f6", textUnderlineOffset: "6px", textDecorationThickness: "3px" }}>Into University</span>
              </h1>

              <p className="mb-8 max-w-lg text-base sm:text-lg" style={{ color: "#555", lineHeight: 1.7 }}>
                JambOS uses AI to predict your JAMB score, find your weak topics, build your study plan, and explain every question, so you stop guessing and start improving.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mb-8">
                <Link href="/auth/signup" className="inline-flex items-center justify-center gap-2 rounded-lg text-base font-medium" style={{ padding: "0.875rem 1.5rem", background: "#111", color: "#fff" }}>
                  <Zap className="h-5 w-5" /> Start Preparing. It's Free
                </Link>
                <Link href="#how-it-works" className="inline-flex items-center justify-center gap-2 rounded-lg text-base font-medium" style={{ padding: "0.875rem 1.5rem", background: "#fff", color: "#333", border: "1px solid #ddd" }}>
                  <Play className="h-4 w-4" /> See How It Works
                </Link>
              </div>

              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className="h-3 w-3" fill="#f59e0b" style={{ color: "#f59e0b" }} />
                    ))}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#999" }}>Trusted by students across Nigeria</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block"><ScorePredictor /></div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section style={{ background: "#fff", borderTop: "1px solid #eee", borderBottom: "1px solid #eee" }}>
        <div className="mx-auto max-w-6xl px-4 py-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map(({ value, suffix, label }) => (
              <div key={label} className="text-center">
                <p style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "#111" }}>
                  <AnimatedNumber value={value} />{suffix}
                </p>
                <p className="text-xs mt-1" style={{ color: "#777" }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOBILE DEMO */}
      <section className="lg:hidden px-4 py-12"><ScorePredictor /></section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "#999" }}>HOW IT WORKS</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#111" }}>Three Steps to a Better Score</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              { step: "01", title: "Take the Diagnostic", description: "40 questions across your subjects. The AI maps your strengths, weaknesses, speed, and careless error patterns in under 30 minutes.", icon: BarChart3, color: "#3b82f6" },
              { step: "02", title: "Follow Your Plan", description: "Every day, JambOS generates a personalized study session targeting your weakest topics with the right difficulty at the right time.", icon: BookOpen, color: "#8b5cf6" },
              { step: "03", title: "Watch Your Score Rise", description: "Track your predicted JAMB score as it climbs. The AI continuously adjusts your plan as you improve, pushing you closer to your target.", icon: TrendingUp, color: "#14b8a6" },
            ].map(({ step, title, description, icon: Icon, color }) => (
              <div key={step} className="rounded-2xl p-6" style={{ background: "#fff", border: "1px solid #eee" }}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold" style={{ fontFamily: "var(--font-mono)", background: "#f5f5f5", color: "#333" }}>{step}</span>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3 className="mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1.125rem", color: "#111" }}>{title}</h3>
                <p className="text-sm" style={{ color: "#555", lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXAM TIPS FROM EBOOK */}
      <section className="px-4 py-16 sm:py-24" style={{ background: "#fff" }}>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "#999" }}>FREE EXAM TIPS</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#111" }}>Tricks That Actually Win JAMB Points</h2>
            <p className="mt-3 text-sm mx-auto max-w-lg" style={{ color: "#555" }}>Students using these strategies answer 20% faster and score 30+ points higher. They're built into the app.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {examTips.map(({ icon: Icon, title, tip, color }) => (
              <div key={title} className="rounded-2xl p-5" style={{ background: "#fafafa", border: "1px solid #eee" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: "#f0f0f0" }}>
                    <Icon className="h-4 w-4" style={{ color }} />
                  </div>
                  <h3 className="text-sm font-semibold" style={{ color: "#111" }}>{title}</h3>
                </div>
                <p className="text-[0.8125rem]" style={{ color: "#555", lineHeight: 1.6 }}>{tip}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/auth/signup" className="inline-flex items-center gap-2 text-sm font-semibold" style={{ color: "#111" }}>
              Get all 50+ tips inside the app <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "#999" }}>FEATURES</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#111" }}>Not Just Another CBT App</h2>
            <p className="mt-3 text-sm mx-auto max-w-lg" style={{ color: "#555" }}>Every feature is designed around one goal: getting you the highest JAMB score possible with the least wasted effort.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, description, color }) => (
              <div key={title} className="rounded-2xl p-5" style={{ background: "#fff", border: "1px solid #eee" }}>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl mb-4" style={{ background: "#f5f5f5" }}>
                  <Icon className="h-5 w-5" style={{ color }} />
                </div>
                <h3 className="mb-2" style={{ fontFamily: "var(--font-display)", fontSize: "1rem", color: "#111" }}>{title}</h3>
                <p className="text-sm" style={{ color: "#555", lineHeight: 1.6 }}>{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMPARISON */}
      <section className="px-4 py-16 sm:py-24" style={{ background: "#fff" }}>
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "#999" }}>THE DIFFERENCE</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#111" }}>What Happens When You Study Smarter</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl p-6" style={{ background: "#fafafa", border: "1px solid #eee" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "#ef4444" }}>Without JambOS</p>
              <ul className="space-y-3">
                {["Study random topics with no direction", "No idea which areas are weakest", "Repeat the same mistakes", "Guess your readiness level", "Burn out from inefficient cramming", "Walk into JAMB hall hoping for the best"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#555" }}>
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full shrink-0" style={{ background: "#ccc" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl p-6" style={{ background: "#fff", border: "2px solid #111" }}>
              <p className="text-sm font-semibold mb-4" style={{ color: "#111" }}>With JambOS</p>
              <ul className="space-y-3">
                {["AI builds your daily study plan automatically", "Know exactly where you're weak and strong", "Understand why every answer is right or wrong", "See your predicted score update in real-time", "Study less time, cover more ground", "Walk into JAMB hall knowing your score range"].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm" style={{ color: "#333" }}>
                    <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "#111" }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:py-24" style={{ background: "#fff" }}>
        <div className="mx-auto max-w-2xl">
          <div className="text-center mb-12">
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-2" style={{ color: "#999" }}>FAQ</p>
            <h2 style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#111" }}>Common Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map(({ q, a }) => <FAQItem key={q} question={q} answer={a} />)}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-4 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl rounded-3xl p-8 sm:p-12 text-center" style={{ background: "#111" }}>
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "rgba(255,255,255,0.1)" }}>
            <Zap className="h-8 w-8" style={{ color: "#fff" }} />
          </div>
          <h2 className="mb-3" style={{ fontFamily: "var(--font-display)", fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#fff" }}>Ready to See Your Real Score?</h2>
          <p className="mb-8 mx-auto max-w-md text-sm sm:text-base" style={{ color: "#999", lineHeight: 1.7 }}>
            Take the free diagnostic test. In 30 minutes you'll know your predicted JAMB score, your weakest topics, and exactly what to study first.
          </p>
          <Link href="/auth/signup" className="inline-flex items-center gap-2 rounded-lg font-medium" style={{ padding: "1rem 2rem", fontSize: "1rem", background: "#fff", color: "#111" }}>
            <Zap className="h-5 w-5" /> Start Free. No Card Needed
          </Link>
          <p className="mt-4 text-xs" style={{ color: "#666" }}>Free plan includes 20 questions/day, CBT simulator, and basic analytics</p>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: "#fff", borderTop: "1px solid #eee" }}>
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="grid gap-8 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <div className="flex items-center gap-0.5 mb-3">
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#111" }}>Jamb</span>
                <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#111", fontWeight: 700 }}>OS</span>
              </div>
              <p className="text-sm max-w-xs" style={{ color: "#555", lineHeight: 1.6 }}>
                Nigeria's AI-powered JAMB preparation platform. Smarter studying, higher scores, university admission.
              </p>
            </div>
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "#999" }}>Product</p>
              <ul className="space-y-2">
                {[{ label: "Features", href: "#how-it-works" }, { label: "Pricing", href: "/subscription" }, { label: "AI Tutor", href: "/auth/signup" }].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-sm" style={{ color: "#555" }}>{label}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "#999" }}>Legal</p>
              <ul className="space-y-2">
                {[{ label: "Privacy Policy", href: "/privacy" }, { label: "Terms of Service", href: "/terms" }].map(({ label, href }) => (
                  <li key={label}><Link href={href} className="text-sm" style={{ color: "#555" }}>{label}</Link></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: "1px solid #eee" }}>
            <p className="text-xs" style={{ color: "#999" }}>&copy; {new Date().getFullYear()} JambOS. All rights reserved.</p>
            <p className="text-xs" style={{ color: "#999" }}>Built for Nigerian students, by Nigerian builders.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}