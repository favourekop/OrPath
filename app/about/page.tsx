import Link from "next/link";

export const metadata = {
  title: "About the Founder — OrPath",
  description: "Meet Favour Ekop, the owner and creator of OrPath, and discover the vision behind the platform.",
};

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
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "12px 0" }}>Favour Ekop</h2>
            <p style={{ maxWidth: 680, lineHeight: 1.9 }}>
              Favour Ekop is the founder and owner of OrPath — a digital Bible and spiritual-growth experience created to help people engage with Scripture and make room for a more intentional daily walk with God.
            </p>
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
