"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import {
  BookOpen, BarChart3, Settings, ArrowLeft, Database,
  AlertTriangle, Users, Zap, Loader2,
} from "lucide-react";

const ADMIN_EMAILS = [
  "zhangrouchennn@gmail.com",
  "successthecodess@gmail.com",
];

const NAV_ITEMS = [
  { href: "/admin", label: "Questions", icon: BookOpen },
  { href: "/admin/students", label: "Students", icon: Users },
  { href: "/admin/challenges", label: "Challenges", icon: Zap },
  { href: "/admin/flags", label: "Flags", icon: AlertTriangle },
  { href: "/admin/stats", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const isAuthorized = ADMIN_EMAILS.includes(session?.user?.email?.toLowerCase() || "");

  useEffect(() => {
    if (status === "authenticated" && !isAuthorized) router.push("/dashboard");
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, isAuthorized, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: "var(--color-surface)" }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: "var(--color-accent-green)" }} />
      </div>
    );
  }

  if (!isAuthorized) return null;

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>
      <header
        className="sticky top-0 z-30"
        style={{
          background: "var(--color-surface-card)",
          borderBottom: "1px solid var(--color-surface-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push("/dashboard")}
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" style={{ color: "var(--color-text-tertiary)" }} />
              <span className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>Admin</span>
            </div>
          </div>

          <nav className="flex items-center gap-0.5 overflow-x-auto">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-all shrink-0"
                  style={{
                    background: isActive ? "var(--color-surface-lighter)" : "transparent",
                    color: isActive ? "var(--color-text-primary)" : "var(--color-text-tertiary)",
                  }}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}