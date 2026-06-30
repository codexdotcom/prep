"use client";

import { useUsage } from "@/hooks/use-usage";
import { Paywall } from "@/components/ui/paywall";
import { Loader2 } from "lucide-react";

interface FeatureGateProps {
  feature: string;
  children: React.ReactNode;
  header?: React.ReactNode;
}

export function FeatureGate({ feature, children, header }: FeatureGateProps) {
  const usage = useUsage(feature);

  if (usage.loading) {
    return (
      <div className="min-h-screen" style={{ background: "#fafafa" }}>
        {header}
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin" style={{ color: "#999" }} />
        </div>
      </div>
    );
  }

  if (!usage.allowed) {
    return (
      <div className="min-h-screen" style={{ background: "#fafafa" }}>
        {header}
        <div className="mx-auto max-w-md px-4 pt-12">
          <Paywall feature={feature} used={usage.used} limit={usage.limit} tier={usage.tier} />
        </div>
      </div>
    );
  }

  return <>{children}</>;
}