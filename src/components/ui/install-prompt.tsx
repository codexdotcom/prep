"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    if (localStorage.getItem("pwa-install-dismissed")) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show prompt after a delay
      setTimeout(() => setShow(true), 30000); // 30 seconds
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setShow(false);
  };

  const handleDismiss = () => {
    setShow(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
  };

  if (!show || dismissed) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm rounded-2xl p-4"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-surface-border)",
        boxShadow: "var(--shadow-elevated)",
        animation: "var(--animate-slide-up)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(34,197,94,0.1)" }}
        >
          <Download className="h-5 w-5" style={{ color: "var(--color-accent-green)" }} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Install JAMB OS
          </p>
          <p className="text-xs mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
            Add to home screen for faster access and offline study
          </p>
          <div className="flex gap-2 mt-3">
            <button onClick={handleInstall} className="btn-primary" style={{ padding: "0.375rem 0.75rem", fontSize: "0.75rem" }}>
              Install
            </button>
            <button onClick={handleDismiss} className="btn-ghost" style={{ fontSize: "0.75rem" }}>
              Not now
            </button>
          </div>
        </div>
        <button onClick={handleDismiss} className="btn-ghost" style={{ padding: "0.25rem" }}>
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}