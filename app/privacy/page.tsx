import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = { title: "Privacy Policy | OrPath", description: "Learn how OrPath handles account information, saved Scripture, prayer entries and usage analytics." };

export default function PrivacyPage() {
  return <main className="legal-page-shell">
    <header className="legal-page-header"><Link href="/" className="legal-back-link"><ArrowLeft size={16}/> OrPath home</Link><span className="legal-page-brand">orpath<span>.</span></span></header>
    <article className="legal-page-content">
      <span className="section-kicker">YOUR TRUST MATTERS</span><h1>Privacy <em>Policy.</em></h1>
      <p className="legal-updated">Last updated: 20 November 2026</p>
      <p>OrPath is a Scripture reading and spiritual-growth platform. This page explains, in plain language, the information the service may process when you use the website.</p>
      <h2>Information you provide</h2><p>When you create an account or use account features, OrPath may process your email address, profile details, authentication information, saved Bible passages, reading progress, reading-plan activity and prayer journal entries.</p>
      <h2>How information is used</h2><p>Information is used to provide sign-in, synchronise your personal reading experience, save your preferences and content, maintain platform security, and improve the service.</p>
      <h2>Service providers and analytics</h2><p>OrPath uses Supabase for authentication and application data services. The website may use Vercel Web Analytics and Speed Insights, and PostHog where its project configuration is enabled, to understand site usage and performance. These providers process data under their own service terms and privacy documentation.</p>
      <h2>Your personal content</h2><p>Prayer entries and saved passages are intended to be private to your account. Do not store highly sensitive information in the prayer journal. Access controls and database policies are used to protect account data, but no online service can promise absolute security.</p>
      <h2>Your choices</h2><p>You can stop using OrPath, sign out, and manage available account information through your account settings. For a privacy or account-data request, contact the OrPath team through the <Link href="/about">About OrPath page</Link>.</p>
      <h2>Changes to this policy</h2><p>This policy may be updated as OrPath features and service providers change. The latest revision date will be shown at the top of this page.</p>
      <p className="legal-disclaimer">This is an initial product privacy notice and should be reviewed against the final production data flows and applicable legal requirements before being treated as a complete legal policy.</p>
    </article>
  </main>;
}
