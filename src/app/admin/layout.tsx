"use client";

import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  BookOpen,
  BarChart3,
  Settings,
  ArrowLeft,
  Database,
  AlertTriangle,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";

const NAV_ITEMS = [
  { href: "/admin", label: "Questions", icon: BookOpen },
  { href: "/admin/flags", label: "Flags", icon: AlertTriangle },
  { href: "/admin/stats", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen" style={{ background: "var(--color-surface)" }}>
      {/* Top bar */}
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
            <button onClick={() => router.push("/dashboard")} className="btn-ghost">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" style={{ color: "var(--color-accent-green)" }} />
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-text-primary)" }}
              >
                Admin
              </span>
            </div>
          </div>

          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href;
              return (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all"
                  style={{
                    background: isActive ? "rgba(34, 197, 94, 0.1)" : "transparent",
                    color: isActive ? "var(--color-accent-green)" : "var(--color-text-tertiary)",
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