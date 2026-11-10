import Link from "next/link";

export const metadata = {
  title: "Favour Ekop — Founder of OrPath",
  description: "Meet Favour Ekop, founder of OrPath. Connect on LinkedIn, Instagram, Facebook and X, or send a work enquiry by email.",
  openGraph: {
    title: "Favour Ekop — Founder of OrPath",
    description: "Meet the founder behind OrPath and connect through his official social profiles.",
    url: "https://or-path.vercel.app/about",
    siteName: "OrPath",
    type: "profile",
    images: [{ url: "/founder-favour-ekop.jpg", width: 96, height: 120, alt: "Favour Ekop, founder of OrPath" }],
  },
  twitter: {
    card: "summary",
    title: "Favour Ekop — Founder of OrPath",
    description: "Meet the founder behind OrPath and connect through his official social profiles.",
    images: ["/founder-favour-ekop.jpg"],
  },
};

const socials = [
  { name: "LinkedIn", handle: "Favour Ekop", href: "https://www.linkedin.com/in/favour-ekop", mark: "in" },
  { name: "Instagram", handle: "@favour.ekop", href: "https://www.instagram.com/favour.ekop/", mark: "◎" },
  { name: "Facebook", handle: "Favour Ekop", href: "https://www.facebook.com/profile.php?id=61565668287681", mark: "f" },
  { name: "X", handle: "@FavourEkop", href: "https://x.com/FavourEkop", mark: "𝕏" },
];

export default function AboutFounderPage() {
  return (
    <main className="app">
      <section className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark">✳</span>
            <span className="brand-name">orpath<span>.</span><small>LET THE WORD LEAD</small></span>
          </Link>
          <Link className="text-link" href="/">← Back to OrPath</Link>
        </header>
        <div className="content page-section">
          <div className="page-intro">
            <span className="section-kicker">THE PERSON BEHIND THE PATH</span>
            <h1>Built with purpose.<br/><em>Rooted in the Word.</em></h1>
            <p>Discover the person, purpose, and vision behind OrPath.</p>
          </div>

          <section className="reflection-panel" style={{ marginTop: 28, padding: "clamp(24px, 5vw, 48px)" }}>
            <span className="section-kicker">FOUNDER & OWNER</span>
            <div style={{ display: "grid", gridTemplateColumns: "minmax(130px, 190px) minmax(0, 1fr)", gap: "clamp(22px, 4vw, 38px)", alignItems: "center", marginTop: 18 }}>
              <img
                src="/founder-favour-ekop.jpg"
                alt="Portrait of Favour Ekop, founder of OrPath"
                width={180}
                height={225}
                style={{ display: "block", width: "100%", maxWidth: 180, aspectRatio: "4 / 5", objectFit: "cover", objectPosition: "center 28%", borderRadius: 16, border: "1px solid var(--border)", boxShadow: "0 14px 36px rgba(20, 55, 37, .16)" }}
              />
              <div>
                <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 12px" }}>Favour Ekop</h2>
                <p style={{ maxWidth: 680, lineHeight: 1.9, margin: 0 }}>
                  Favour Ekop is the founder and owner of OrPath — a digital Bible and spiritual-growth experience created to help people engage with Scripture and make room for a more intentional daily walk with God.
                </p>
                <p style={{ lineHeight: 1.8, margin: "14px 0 0", color: "var(--subtext)", fontSize: 12 }}>
                  Connect with the founder through his official social profiles or send a work enquiry.
                </p>
              </div>
            </div>
            <div style={{ marginTop: 30, paddingTop: 22, borderTop: "1px solid var(--border)" }}>
              <span className="section-kicker">CONNECT WITH THE FOUNDER</span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 10, marginTop: 14 }}>
                {socials.map((social) => (
                  <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name + " profile for Favour Ekop"} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 58, padding: "10px 13px", border: "1px solid var(--border)", borderRadius: 10, color: "var(--text)", textDecoration: "none", background: "var(--page)" }}>
                    <span aria-hidden="true" style={{ display: "grid", placeItems: "center", width: 34, height: 34, borderRadius: 9, background: "#e7eee5", color: "#28553c", fontWeight: 800, fontSize: 17 }}>{social.mark}</span>
                    <span style={{ display: "grid", gap: 3 }}>
                      <strong style={{ fontSize: 12 }}>{social.name}</strong>
                      <span style={{ color: "var(--subtext)", fontSize: 10 }}>{social.handle}</span>
                    </span>
                    <span aria-hidden="true" style={{ marginLeft: "auto", color: "var(--subtext)" }}>↗</span>
                  </a>
                ))}
              </div>
              <a href="mailto:favourekop75@gmail.com" style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 13, padding: "11px 14px", borderRadius: 9, background: "#173f30", color: "#fff", textDecoration: "none", fontSize: 12, fontWeight: 700 }}>
                ✉ Work email: favourekop75@gmail.com
              </a>
            </div>
          </section>

          <div className="lower-grid" style={{ marginTop: 18 }}>
            <section className="continue-panel">
              <span className="section-kicker">THE IDEA</span>
              <h2>What does OrPath mean?</h2>
              <p style={{ lineHeight: 1.9 }}>
                OrPath brings together the idea of orientation — finding direction and clarity — with the idea of a path: a personal journey of faith. Its guiding meaning is “a guided path to spiritual growth through God’s Word.”
              </p>
            </section>
            <section className="reflection-panel">
              <span className="section-kicker">THE VISION</span>
              <h2>A more intentional walk.</h2>
              <p style={{ lineHeight: 1.9 }}>
                To make Scripture more accessible and support people as they build a consistent, personal relationship with God through reading, reflection, prayer, and purposeful growth.
              </p>
            </section>
          </div>
          <section className="continue-panel" style={{ marginTop: 18 }}>
            <span className="section-kicker">OUR MISSION</span>
            <h2>Make room for the Word.</h2>
            <p style={{ lineHeight: 1.9 }}>
              OrPath brings Bible reading, saved verses, prayer journaling, and guided reading plans into one calm, welcoming space. The goal is not simply to spend more time in an app, but to make time in Scripture more meaningful.
            </p>
            <p className="reflection-quote" style={{ marginTop: 24 }}>“Every day, a step closer to the Word.”</p>
          </section>
          <footer className="footer">
            <span>© 2026 OrPath</span>
            <span><span className="footer-dot"/> Made for the journey.</span>
            <Link className="text-link" href="/">Explore OrPath →</Link>
          </footer>
        </div>
      </section>
    </main>
  );
}
