import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div style={{ background: "var(--color-surface)", minHeight: "100vh" }}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Link href="/" className="inline-block mb-8">
          <Logo />
        </Link>

        <h1
          style={{
            fontFamily: "var(--font-display)",
            fontSize: "2rem",
            color: "var(--color-text-primary)",
            marginBottom: "1.5rem",
          }}
        >
          Privacy Policy
        </h1>

        <div
          className="space-y-6 text-sm leading-relaxed"
          style={{ color: "var(--color-text-secondary)" }}
        >
          <p>
            <strong style={{ color: "var(--color-text-primary)" }}>Last updated:</strong>{" "}
            {new Date().toLocaleDateString("en-NG", { year: "numeric", month: "long", day: "numeric" })}
          </p>

          <section>
            <h2
              className="mb-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-text-primary)",
              }}
            >
              Information We Collect
            </h2>
            <p>
              When you create an account, we collect your name, email address, and optional
              demographic information such as your state, school, and exam preferences.
              During test sessions we record your answers, time spent per question,
              and performance data to power our adaptive learning engine.
            </p>
          </section>

          <section>
            <h2
              className="mb-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-text-primary)",
              }}
            >
              How We Use Your Data
            </h2>
            <p>
              Your performance data is used exclusively to personalise your learning
              experience, generate study plans, identify weak topics, and predict your
              JAMB score. We aggregate anonymised performance trends to improve our
              question bank and recommendation engine. We never sell your personal
              information to third parties.
            </p>
          </section>

          <section>
            <h2
              className="mb-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-text-primary)",
              }}
            >
              Data Security
            </h2>
            <p>
              All data is encrypted in transit via TLS and at rest. Passwords are hashed
              using bcrypt. We follow industry-standard practices to protect your information.
            </p>
          </section>

          <section>
            <h2
              className="mb-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-text-primary)",
              }}
            >
              Your Rights
            </h2>
            <p>
              You can request a copy of your data, correct inaccuracies, or delete your
              account at any time from your account settings. Deleting your account
              permanently removes all personal and performance data from our systems.
            </p>
          </section>

          <section>
            <h2
              className="mb-2"
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.25rem",
                color: "var(--color-text-primary)",
              }}
            >
              Contact
            </h2>
            <p>
              Questions about this policy? Reach us at{" "}
              <a
                href="mailto:privacy@jamb.os"
                style={{ color: "var(--color-accent-green)" }}
                className="hover:underline"
              >
                privacy@jamb.os
             </a>
            </p>
          </section>
        </div>

        <footer
          className="mt-16 pt-6"
          style={{ borderTop: "1px solid var(--color-surface-border)" }}
        >
          <div
            className="flex items-center justify-center gap-4 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            <Link href="/terms" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Terms of Service
            </Link>
            <span>·</span>
            <Link href="/dashboard" className="hover:underline" style={{ color: "var(--color-text-tertiary)" }}>
              Back to App
            </Link>
          </div>
          <p className="mt-2 text-center text-xs" style={{ color: "var(--color-text-muted)" }}>
            © {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}