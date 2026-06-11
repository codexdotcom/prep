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
                { label: "Twitter", href: "https://twitter.com/jambos_ng", svg: <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />},
                { label: "Instagram", href: "https://instagram.com/jambos_ng", svg: <><rect width="20" height="20" x="2" y="2" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" /><line x1="17.5" x2="17.51" y1="6.5" y2="6.5" /></> },
                { label: "WhatsApp", href: "https://wa.me/2348000000000", svg: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" /> },
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