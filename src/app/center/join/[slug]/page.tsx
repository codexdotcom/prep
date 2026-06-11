"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";

export default function JoinCenterPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [centerName, setCenterName] = useState("");
  const [error, setError] = useState("");

  const handleJoin = async () => {
    setJoining(true);
    setError("");
    try {
      const res = await fetch("/api/center/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      const data = await res.json();
      if (res.ok) { setJoined(true); setCenterName(data.centerName); }
      else setError(data.error);
    } catch { setError("Network error"); }
    finally { setJoining(false); }
  };

  if (joined) return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
      <div className="card p-8 text-center max-w-sm">
        <CheckCircle2 className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-accent-green)" }} />
        <h1 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>Joined {centerName}!</h1>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-tertiary)" }}>Your teacher can now track your progress.</p>
        <button onClick={() => router.push("/dashboard")} className="btn-primary w-full">Go to Dashboard</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ background: "var(--color-surface)" }}>
      <div className="card p-8 text-center max-w-sm">
        <Building2 className="mx-auto mb-3 h-10 w-10" style={{ color: "var(--color-accent-green)" }} />
        <h1 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-display)", color: "var(--color-text-primary)" }}>Join Tutorial Center</h1>
        <p className="text-sm mb-4" style={{ color: "var(--color-text-tertiary)" }}>Your teacher has invited you to join their center on JambOS.</p>
        {error && <p className="text-sm mb-3" style={{ color: "var(--color-danger-400)" }}>{error}</p>}
        <button onClick={handleJoin} disabled={joining} className="btn-primary w-full">
          {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Join Center
        </button>
      </div>
    </div>
  );
}