export function PageFooter() {
  return (
    <footer className="mt-12 pt-6 pb-8 text-center" style={{ borderTop: "1px solid #eee" }}>
      <div className="flex items-center justify-center gap-0.5 mb-2">
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", color: "#111" }}>Jamb</span>
        <span style={{ fontFamily: "var(--font-display)", fontSize: "0.9375rem", color: "#111", fontWeight: 700 }}>OS</span>
      </div>
      <div className="flex items-center justify-center gap-3 text-[0.6875rem]" style={{ color: "#bbb" }}>
        <a href="/privacy" className="hover:underline" style={{ color: "#999" }}>Privacy</a>
        <span style={{ color: "#ddd" }}>|</span>
        <a href="/terms" className="hover:underline" style={{ color: "#999" }}>Terms</a>
        <span style={{ color: "#ddd" }}>|</span>
        <a href="/pricing" className="hover:underline" style={{ color: "#999" }}>Pricing</a>
      </div>
    </footer>
  );
}