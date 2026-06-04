"use client";

import { Suspense } from "react";
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";

function CheckContent() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }

    // Check if user has a profile
    async function checkProfile() {
      try {
        const res = await fetch("/api/auth/check-profile");
        const data = await res.json();

        if (data.hasProfile) {
          router.push(callbackUrl);
        } else {
          router.push(`/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      } catch {
        router.push(callbackUrl);
      }
    }

    checkProfile();
  }, [status, router, callbackUrl]);

  return (
    <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
      <div className="text-center">
        <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
          Setting things up...
        </p>
      </div>
    </div>
  );
}

export default function AuthCheckPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      }
    >
      <CheckContent />
    </Suspense>
  );
}