import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import SiteFooter from "../components/SiteFooter";

export const metadata: Metadata = { title: "Terms of Service | OrPath", description: "Read the basic terms for using OrPath." };

export default function TermsPage() {
  return <main className="legal-page-shell">
    <header className="legal-page-header"><Link href="/" className="legal-back-link"><ArrowLeft size={16}/> OrPath home</Link><span className="legal-page-brand">orpath<span>.</span></span></header>
    <article className="legal-page-content">
      <span className="section-kicker">USING ORPATH</span><h1>Terms of <em>Service.</em></h1>
      <p className="legal-updated">Last updated: 20 November 2026</p>
      <p>By accessing OrPath, you agree to use the service responsibly and in accordance with these terms.</p>
      <h2>About the service</h2><p>OrPath provides Bible reading tools, Scripture discovery, devotionals, reading journeys, bookmarks and related spiritual-growth features. Bible translations and other materials may be subject to their respective copyright and licensing conditions.</p>
      <h2>Your account</h2><p>You are responsible for keeping your sign-in credentials secure and for activity carried out through your account. Provide accurate account information and notify the OrPath team if you believe your account has been accessed without permission.</p>
      <h2>Acceptable use</h2><p>Do not attempt to disrupt the service, bypass access controls, access another person&apos;s private information, misuse the platform, or redistribute copyrighted content without permission.</p>
      <h2>Availability and content</h2><p>OrPath may change, suspend or improve features over time. Scripture availability, translations, audio and offline access depend on technical availability and licensing permissions. The service is provided as available, without a guarantee of uninterrupted operation.</p>
      <h2>Personal reflections</h2><p>OrPath&apos;s reading and prayer tools are intended for personal reflection and study. They are not a substitute for professional, pastoral, medical, legal or emergency assistance.</p>
      <h2>Contact and updates</h2><p>We may update these terms as the service develops. For questions, visit the <Link href="/about">About OrPath page</Link>.</p>
      <p className="legal-disclaimer">These are initial service terms and should receive legal review before being relied on as a complete binding agreement.</p>
    </article><SiteFooter />
  </main>;
}
