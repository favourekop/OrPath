"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Heart, Share2 } from "lucide-react";

const groups = [
  { title: "Explore", links: [{ label: "Home", href: "/" }, { label: "Read the Bible", href: "/bible" }, { label: "About OrPath", href: "/about" }, { label: "Support", href: "/about" }] },
  { title: "Your OrPath", links: [{ label: "Dashboard", href: "/dashboard" }, { label: "Bookmarks", href: "/dashboard" }, { label: "Prayer journal", href: "/dashboard" }, { label: "Account", href: "/account" }] },
  { title: "Information", links: [{ label: "Privacy policy", href: "/privacy" }, { label: "Terms of service", href: "/terms" }, { label: "Contact", href: "/about#contact" }] },
];

export default function SiteFooter() {
  const [notice, setNotice] = useState("");
  async function share() {
    const url = "https://or-path.vercel.app";
    try {
      if (navigator.share) await navigator.share({ title: "OrPath — Let the Word Lead", text: "A thoughtful home for Scripture, devotionals and spiritual growth.", url });
      else { await navigator.clipboard.writeText(url); setNotice("OrPath link copied."); }
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") setNotice("Sharing is unavailable in this browser.");
    }
  }
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" className="site-footer-logo" aria-label="OrPath home"><span className="site-footer-mark"><BookOpen size={22}/></span><span><strong>orpath<span>.</span></strong><small>LET THE WORD LEAD</small></span></Link>
          <p>A thoughtful space to read Scripture, grow in faith, and keep the Word close through every season.</p>
          <button className="site-footer-share" type="button" onClick={share}><Share2 size={15}/> Share OrPath</button>
          {notice && <span className="site-footer-notice" role="status">{notice}</span>}
        </div>
        {groups.map(group => <nav className="site-footer-group" key={group.title} aria-label={group.title}><h3>{group.title}</h3>{group.links.map(link => <Link href={link.href} key={link.label}>{link.label}<ArrowUpRight size={12}/></Link>)}</nav>)}
      </div>
      <div className="site-footer-bottom"><span>© {new Date().getFullYear()} OrPath. All rights reserved.</span><span><Heart size={13}/> Made for the journey.</span><Link href="/about">Let the Word Lead</Link></div>
    </footer>
  );
}
