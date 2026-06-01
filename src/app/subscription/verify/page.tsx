"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/ui/logo";

export default function VerifyPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reference = searchParams.get("reference");
  const [status, setStatus] = useState<"loading" | "success" | "failed">("loading");
  const [plan, setPlan] = useState<string>("");

  useEffect(() => {
    if (!reference) {
      setStatus("failed");
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/payments/verify?reference=${reference}`);
        const data = await res.json();

        if (data.status === "success") {
          setStatus("success");
          setPlan(data.plan || "");
        } else {
          setStatus("failed");
        }
      } catch {
        setStatus("failed");
      }
    }

    verify();
  }, [reference]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
      <div className="card max-w-sm w-full text-center p-8">
        {status === "loading" && (
          <>
            <Loader2
              className="mx-auto mb-4 h-12 w-12 animate-spin"
              style={{ color: "var(--color-accent-green)" }}
            />
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              Verifying payment...
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Please wait while we confirm your payment
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(34, 197, 94, 0.1)" }}
            >
              <CheckCircle2 className="h-8 w-8" style={{ color: "var(--color-accent-green)" }} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              You&apos;re all set!
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Your {plan} plan is now active. Time to crush JAMB.
            </p>
            <button
              onClick={() => router.push("/dashboard")}
              className="btn-primary w-full mt-6"
            >
              Go to Dashboard
            </button>
          </>
        )}

        {status === "failed" && (
          <>
            <div
              className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
              style={{ background: "rgba(239, 68, 68, 0.1)" }}
            >
              <XCircle className="h-8 w-8" style={{ color: "var(--color-danger-400)" }} />
            </div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "var(--color-text-primary)" }}>
              Payment failed
            </p>
            <p className="mt-2 text-sm" style={{ color: "var(--color-text-tertiary)" }}>
              Something went wrong. No charges were made.
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => router.push("/subscription")} className="btn-secondary flex-1">
                Try Again
              </button>
              <button onClick={() => router.push("/dashboard")} className="btn-primary flex-1">
                Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}