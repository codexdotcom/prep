import Link from "next/link";

export function Footer() {
  return (
    <footer style={{ background: "#111", marginTop: "3rem" }}>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10">
        {/* Top section */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-0.5 mb-3">
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#fff" }}>Jamb</span>
              <span style={{ fontFamily: "var(--font-display)", fontSize: "1.25rem", color: "#22c55e" }}>OS</span>
            </div>
            <p className="text-xs leading-relaxed" style={{ color: "#888", maxWidth: "200px" }}>
              AI-powered JAMB preparation. Study smarter. Score higher.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {/* Social links */}
              {[
                { label: "Tiktok", href: "https://www.tiktok.com/@jambos_ng", svg:   <path d="M12.75 2h2.25c.2 1.7 1.1 3.2 2.5 4.1 1 .6 2.1.9 3.25.9v2.5c-1.7 0-3.4-.5-4.75-1.4v6.9c0 3.7-3 6.7-6.75 6.7S2.5 18.7 2.5 15s3-6.7 6.75-6.7c.4 0 .8 0 1.2.1v2.6c-.4-.1-.8-.2-1.2-.2-2.3 0-4.25 1.9-4.25 4.2s1.9 4.2 4.25 4.2 4.25-1.9 4.25-4.2V2z"/>},
                { label: "Instagram", href: "https://instagram.com/jambos_ng", svg: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></> },
                { label: "WhatsApp", href: "https://wa.me/2349138614416", svg:   <path d="M20.52 3.48A11.86 11.86 0 0 0 12.06 0C5.5 0 .16 5.34.16 11.9c0 2.1.55 4.15 1.6 5.96L0 24l6.3-1.65a11.9 11.9 0 0 0 5.76 1.47h.01c6.56 0 11.9-5.34 11.9-11.9 0-3.18-1.24-6.16-3.45-8.44ZM12.06 21.8a9.9 9.9 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.87 9.87 0 0 1-1.5-5.26c0-5.46 4.44-9.9 9.9-9.9 2.65 0 5.14 1.03 7.02 2.91a9.86 9.86 0 0 1 2.9 7.02c0 5.46-4.44 9.9-9.9 9.9Zm5.4-7.34c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.95 1.17-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.74-1.65-2.04-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.08-.15-.67-1.62-.92-2.21-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.1 4.49.72.31 1.28.5 1.72.64.72.23 1.38.2 1.9.12.58-.09 1.76-.72 2.01-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35Z"/>
 },
              ].map(({ label, href, svg }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                  className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors"
                  style={{ background: "#1a1a1a", color: "#888" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#22c55e"; (e.currentTarget as HTMLElement).style.background = "#222"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.background = "#1a1a1a"; }}
                  title={label}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{svg}</svg>
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "#555" }}>Product</p>
            <div className="space-y-2">
              {[
                { label: "Practice CBT", href: "/practice" },
                { label: "AI Tutor", href: "/tutor" },
                { label: "Smart Notes", href: "/notes" },
                { label: "Score Simulator", href: "/simulator" },
                { label: "Post-UTME Prep", href: "/post-utme" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} className="block text-xs transition-colors" style={{ color: "#777" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#777"; }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "#555" }}>Resources</p>
            <div className="space-y-2">
              {[
                { label: "Career Discovery", href: "/career" },
                { label: "Scholarships", href: "/scholarships" },
                { label: "University Match", href: "/match" },
                { label: "Admission Tracker", href: "/admission" },
                { label: "Find a Tutor", href: "/tutors" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} className="block text-xs transition-colors" style={{ color: "#777" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#777"; }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="text-[0.625rem] font-semibold uppercase tracking-widest mb-3" style={{ color: "#555" }}>Company</p>
            <div className="space-y-2">
              {[
                { label: "Ambassador Program", href: "/ambassador" },
                { label: "Tutorial Centers", href: "/center" },
                { label: "Privacy Policy", href: "/privacy" },
                { label: "Terms of Service", href: "/terms" },
              ].map(({ label, href }) => (
                <Link key={href} href={href} className="block text-xs transition-colors" style={{ color: "#777" }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#ccc"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#777"; }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "#222", marginBottom: "1.5rem" }} />

        {/* Bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[0.625rem]" style={{ color: "#555" }}>
            &copy; {new Date().getFullYear()} JambOS. All rights reserved.
          </p>
          <p className="text-[0.625rem]" style={{ color: "#444" }}>
            Not affiliated with JAMB. All trademarks belong to their respective owners.
          </p>
        </div>
      </div>
    </footer>
  );
}