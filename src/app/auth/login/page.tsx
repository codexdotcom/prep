"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
import { AnimatedBackground } from "@/components/ui/animated-bg";
import { Logo } from "@/components/ui/logo";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (status === "authenticated") {
      router.push("/onboarding");
    }
  }, [status, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    setIsLoading(true);
    setServerError("");

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (result?.error) {
        setServerError("Invalid email or password");
        return;
      }

      router.push("/onboarding");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signIn("google", { callbackUrl: "/onboarding" });
  };

  // Show spinner while checking session or if already logged in
  if (status === "loading" || status === "authenticated") {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: "var(--color-surface)" }}
      >
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--color-accent-green)",
            borderTopColor: "transparent",
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <AnimatedBackground />

      <div
        className="fixed top-[-20%] left-[-10%] h-[600px] w-[600px] rounded-full blur-[120px]"
        style={{ background: "rgba(34, 197, 94, 0.03)" }}
      />
      <div
        className="fixed bottom-[-20%] right-[-10%] h-[500px] w-[500px] rounded-full blur-[100px]"
        style={{ background: "rgba(10, 122, 10, 0.05)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-8 text-center">
          <Logo size="large" />
          <p className="mt-3" style={{ color: "var(--color-text-tertiary)" }}>
            Welcome back. Let&apos;s keep pushing.
          </p>
        </div>

        <div className="card" style={{ boxShadow: "var(--shadow-glow)" }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="btn-secondary flex w-full items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div
              className="h-px flex-1"
              style={{ background: "var(--color-surface-border)" }}
            />
            <span
              className="text-xs uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              or
            </span>
            <div
              className="h-px flex-1"
              style={{ background: "var(--color-surface-border)" }}
            />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-lg px-4 py-3 text-sm"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  color: "var(--color-danger-400)",
                }}
              >
                {serverError}
              </motion.div>
            )}

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
              {errors.email && (
                <p className="error-text">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                />
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="error-text">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm transition-colors hover:underline"
                style={{ color: "var(--color-accent-green)" }}
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary flex w-full items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Log In
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p
            className="mt-6 text-center text-sm"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Don&apos;t have an account?{" "}
            <Link
              href="/auth/signup"
              className="transition-colors hover:underline"
              style={{ color: "var(--color-accent-green)" }}
            >
              Sign up free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}