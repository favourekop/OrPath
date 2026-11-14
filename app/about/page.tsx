import Image from "next/image";
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
    images: [{ url: "/founder-favour-ekop.jpg", width: 1200, height: 1500, alt: "Favour Ekop, founder of OrPath" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Favour Ekop — Founder of OrPath",
    description: "Meet the founder behind OrPath and connect through his official social profiles.",
    images: ["/founder-favour-ekop.jpg"],
  },
};

const socials = [
  { name: "LinkedIn", handle: "Favour Ekop", href: "https://www.linkedin.com/in/favour-ekop", icon: "linkedin" },
  { name: "Instagram", handle: "@favour.ekop", href: "https://www.instagram.com/favour.ekop/", icon: "instagram" },
  { name: "Facebook", handle: "Favour Ekop", href: "https://www.facebook.com/profile.php?id=61565668287681", icon: "facebook" },
  { name: "X", handle: "@FavourEkop", href: "https://x.com/FavourEkop", icon: "x" },
];

function SocialIcon({ name }: { name: string }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", "aria-hidden": true as const };
  if (name === "linkedin") return <svg {...common}><path fill="currentColor" d="M5.2 3.5a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4ZM3.4 9.4H7v11.2H3.4V9.4Zm5.8 0h3.4v1.5h.1a3.8 3.8 0 0 1 3.4-1.9c3.6 0 4.3 2.3 4.3 5.3v6.3h-3.6V15c0-1.3 0-3-1.9-3s-2.2 1.4-2.2 2.9v5.7H9.2V9.4Z"/></svg>;
  if (name === "instagram") return <svg {...common} stroke="currentColor" strokeWidth="1.9"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.6" cy="6.6" r="1" fill="currentColor" stroke="none"/></svg>;
  if (name === "facebook") return <svg {...common}><path fill="currentColor" d="M13.7 21v-8.2h2.8l.4-3.2h-3.2V7.5c0-.9.3-1.6 1.6-1.6H17V3.1c-.3 0-1.3-.1-2.5-.1-2.5 0-4.2 1.5-4.2 4.3v2.3H7.5v3.2h2.8V21h3.4Z"/></svg>;
  return <svg {...common}><path d="M18.9 3H22l-6.8 7.8L23.2 21h-6.3L12 14.7 6.5 21H3.3l7.3-8.4L2.8 3h6.5l4.5 5.9L18.9 3Zm-1.1 16h1.7L8.3 4.9H6.5L17.8 19Z" fill="currentColor"/></svg>;
}

export default function AboutFounderPage() {
  return (
    <main className="app">
      <section className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/">
            <span className="brand-mark"><BookOpen size={21}/></span><span className="brand-name">orpath<span>.</span><small>LET THE WORD LEAD</small></span>
          </Link>
          <Link className="text-link" href="/">← Back to OrPath</Link>
        </header>
        <div className="content page-section">
          <div className="page-intro">
            <span className="section-kicker">THE PERSON BEHIND THE PATH</span>
            <h1>Built with purpose.<br/><em>Rooted in the Word.</em></h1>
            <p>Discover the person, purpose, and vision behind OrPath.</p>
          </div>

          <section className="reflection-panel founder-profile-panel" style={{ marginTop: 28, padding: "clamp(22px, 5vw, 48px)" }}>
            <span className="section-kicker">FOUNDER & OWNER</span>
            <div className="founder-profile">
              <div className="founder-portrait-frame">
                <Image src="/founder-favour-ekop.jpg" alt="Portrait of Favour Ekop, founder of OrPath" width={1200} height={1500} priority unoptimized/>
              </div>
              <div className="founder-profile-copy">
                <h2>Favour Ekop</h2>
                <p>Favour Ekop is the founder and owner of OrPath — a digital Bible and spiritual-growth experience created to help people engage with Scripture and make room for a more intentional daily walk with God.</p>
                <p className="founder-connect-copy">Connect with the founder through his official social profiles or send a work enquiry.</p>
              </div>
            </div>
            <div className="founder-social-section">
              <span className="section-kicker">CONNECT WITH THE FOUNDER</span>
              <div className="founder-social-grid">
                {socials.map((social) => (
                  <a key={social.name} href={social.href} target="_blank" rel="noopener noreferrer" aria-label={social.name + " profile for Favour Ekop"} className="founder-social-link">
                    <span className={"founder-social-icon " + social.icon}><SocialIcon name={social.icon}/></span>
                    <span className="founder-social-label"><strong>{social.name}</strong><span>{social.handle}</span></span>
                    <span className="founder-social-arrow" aria-hidden="true">↗</span>
                  </a>
                ))}
              </div>
              <a href="mailto:favourekop75@gmail.com" className="founder-email-link"><span aria-hidden="true">✉</span> Work email: favourekop75@gmail.com</a>
            </div>
          </section>

          <div className="lower-grid" style={{ marginTop: 18 }}>
            <section className="continue-panel">
              <span className="section-kicker">THE IDEA</span>
              <h2>What does OrPath mean?</h2>
              <p style={{ lineHeight: 1.9 }}>OrPath brings together the idea of orientation — finding direction and clarity — with the idea of a path: a personal journey of faith. Its guiding meaning is “a guided path to spiritual growth through God’s Word.”</p>
            </section>
            <section className="reflection-panel">
              <span className="section-kicker">THE VISION</span>
              <h2>A more intentional walk.</h2>
              <p style={{ lineHeight: 1.9 }}>To make Scripture more accessible and support people as they build a consistent, personal relationship with God through reading, reflection, prayer, and purposeful growth.</p>
            </section>
          </div>
          <section className="continue-panel" style={{ marginTop: 18 }}>
            <span className="section-kicker">OUR MISSION</span>
            <h2>Make room for the Word.</h2>
            <p style={{ lineHeight: 1.9 }}>OrPath brings Bible reading, saved verses, prayer journaling, and guided reading plans into one calm, welcoming space. The goal is not simply to spend more time in an app, but to make time in Scripture more meaningful.</p>
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
