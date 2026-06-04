"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";

function LoginContent() {
  const router = useRouter();
  const { status } = useSession();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Already logged in — redirect
  if (status === "authenticated") {
    router.push(callbackUrl);
    return null;
  }

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        // Check if user has profile — redirect accordingly
        const res = await fetch("/api/auth/check-profile");
        const data = await res.json();

        if (data.hasProfile) {
          router.push(callbackUrl);
        } else {
          router.push(`/onboarding?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    // Google sign-in will redirect — callbackUrl is handled in the auth redirect callback
    // But we need to check profile after redirect, so we go through a check page
    await signIn("google", {
      callbackUrl: `/auth/check?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-1.5 mb-2">
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-text-primary)" }}>
              Prep
            </span>
            <span style={{ fontFamily: "var(--font-display)", fontSize: "1.5rem", color: "var(--color-accent-green)" }}>
              Genius
            </span>
            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: "var(--color-accent-green)" }} />
          </div>
          <p className="text-sm" style={{ color: "var(--color-text-tertiary)" }}>
            Welcome back. Let&apos;s keep preparing.
          </p>
        </div>

        <div className="card p-6">
          {/* Google sign-in */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="btn-secondary w-full mb-4 justify-center"
            style={{ padding: "0.75rem" }}
          >
            {googleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "var(--color-surface-border)" }} />
            <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "var(--color-surface-border)" }} />
          </div>

          {/* Email/password form */}
          <form onSubmit={handleCredentialsLogin} className="space-y-3">
            {error && (
              <div
                className="rounded-lg px-3 py-2 text-xs"
                style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "var(--color-danger-400)" }}
              >
                {error}
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                className="input-field pl-10"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: "var(--color-text-muted)" }} />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="input-field pl-10 pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: "var(--color-text-muted)" }}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center"
              style={{ padding: "0.75rem" }}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Log In"}
            </button>
          </form>

          <p className="text-center text-xs mt-4" style={{ color: "var(--color-text-muted)" }}>
            Don&apos;t have an account?{" "}
            <Link
              href={`/auth/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`}
              className="hover:underline"
              style={{ color: "var(--color-accent-green)" }}
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--color-accent-green)" }} />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}