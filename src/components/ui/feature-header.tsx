"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface FeatureHeaderProps {
  title: string;
  icon: React.ReactNode;
  backHref?: string;
  right?: React.ReactNode;
}

export function FeatureHeader({ title, icon, backHref = "/tutor", right }: FeatureHeaderProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-30" style={{ background: "rgba(255,255,255,0.92)", borderBottom: "1px solid #eee", backdropFilter: "blur(12px)" }}>
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <button onClick={() => router.push(backHref)} className="flex items-center gap-1.5 text-sm" style={{ color: "#555" }}>
          <ArrowLeft className="h-4 w-4" /><span className="hidden sm:inline">Back</span>
        </button>
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-semibold" style={{ color: "#111" }}>{title}</span>
        </div>
        <div style={{ width: 60, display: "flex", justifyContent: "flex-end" }}>{right}</div>
      </div>
    </header>
  );
}