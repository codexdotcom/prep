"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Zap, Gift, Loader2 } from "lucide-react";

function JoinContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");

  useEffect(() => {
    if (ref) {
      localStorage.setItem("referralCode", ref);
    }
  }, [ref]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
      <div className="w-full max-w-md text-center">
        <div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: "rgba(34,197,94,0.1)" }}
        >
          <Gift className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
        </div>

        <h1 style={{ fontFamily: "var(--font-display)", fontSize: "1.75rem", color: "var(--color-text-primary)" }}>
          You&apos;ve Been Invited!
        </h1>

        <p className="mt-3 text-sm" style={{ color: "var(--color-text-tertiary)", lineHeight: 1.6 }}>
          A friend thinks you should try PrepGenius — Nigeria&apos;s AI-powered JAMB prep platform.
          Sign up and start preparing smarter.
        </p>

        {ref && (
          <div
            className="mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2"
            style={{
              background: "rgba(34,197,94,0.08)",
              border: "1px solid rgba(34,197,94,0.2)",
            }}
          >
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>Referral code:</span>
            <span className="text-sm font-bold font-mono" style={{ color: "var(--color-accent-green)" }}>
              {ref}
            </span>
          </div>
        )}

        <Link
          href="/auth/signup"
          className="btn-primary w-full mt-8 inline-flex"
          style={{ padding: "1rem", fontSize: "1rem" }}
        >
          <Zap className="h-5 w-5" />
          Join PrepGenius — It&apos;s Free
        </Link>

        <p className="mt-4 text-xs" style={{ color: "var(--color-text-muted)" }}>
          Already have an account?{" "}
          <Link href="/auth/login" className="hover:underline" style={{ color: "var(--color-accent-green)" }}>
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--color-surface)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      }
    >
      <JoinContent />
    </Suspense>
  );
}