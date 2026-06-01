"use client";

import { useEffect, useState } from "react";
import { WifiOff, Wifi } from "lucide-react";

export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setShowBanner(true);
    };

    const handleOnline = () => {
      setIsOffline(false);
      // Show "back online" briefly
      setTimeout(() => setShowBanner(false), 3000);
    };

    setIsOffline(!navigator.onLine);

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!showBanner && !isOffline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 py-2 text-xs font-medium transition-all"
      style={{
        background: isOffline ? "var(--color-danger-400)" : "var(--color-accent-green)",
        color: isOffline ? "white" : "var(--color-surface)",
        animation: "var(--animate-slide-up)",
      }}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-3.5 w-3.5" />
          You&apos;re offline. Some features may be limited.
        </>
      ) : (
        <>
          <Wifi className="h-3.5 w-3.5" />
          Back online
        </>
      )}
    </div>
  );
}