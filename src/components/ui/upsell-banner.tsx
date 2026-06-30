"use client";

import { useRouter } from "next/navigation";
import { Zap, ArrowRight } from "lucide-react";

interface UpsellBannerProps {
  riskLevel: string | null;
  tier: string;
}

const MESSAGES: Record<string, { title: string; body: string }> = {
  HIGH: {
    title: "Your score risk is high",
    body: "Students like you who upgraded improved by an average of 40+ marks. Get full access to all AI study tools.",
  },
  MEDIUM: {
    title: "You are making progress",
    body: "Unlock advanced features to close your weak areas faster and hit your target score.",
  },
  LOW: {
    title: "You are on track",
    body: "Go even further with unlimited AI tools, essay grading, and live tutoring.",
  },
};

export function UpsellBanner({ riskLevel, tier }: UpsellBannerProps) {
  const router = useRouter();

  if (tier !== "FREE") return null;

  const msg = MESSAGES[riskLevel || "LOW"] || MESSAGES.LOW;

  return (
    <div className="rounded-xl p-4" style={{
      background: riskLevel === "HIGH" ? "#fef2f2" : "#fff",
      border: `1px solid ${riskLevel === "HIGH" ? "#fecaca" : "#eee"}`,
    }}>
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0 mt-0.5"
          style={{ background: riskLevel === "HIGH" ? "#fee2e2" : "#f5f5f5" }}>
          <Zap className="h-4 w-4" style={{ color: riskLevel === "HIGH" ? "#ef4444" : "#f59e0b" }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold" style={{ color: "#111" }}>{msg.title}</p>
          <p className="text-xs mt-0.5" style={{ color: "#777", lineHeight: 1.5 }}>{msg.body}</p>
          <button onClick={() => router.push("/pricing")}
            className="mt-2 flex items-center gap-1 text-xs font-semibold" style={{ color: "#111" }}>
            View plans <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}