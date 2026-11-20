import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import BibleReader from "../components/BibleReader";

export const metadata: Metadata = {
  title: "Read the Bible | OrPath",
  description: "Read and explore Scripture with OrPath. Choose a translation, book and chapter.",
};

export default function BiblePage() {
  return <main className="legal-page-shell">
    <header className="legal-page-header">
      <Link href="/" className="legal-back-link"><ArrowLeft size={16}/> OrPath home</Link>
      <span className="legal-page-brand"><BookOpen size={18}/> orpath<span>.</span></span>
    </header>
    <section className="legal-page-content bible-route-content">
      <span className="section-kicker">SCRIPTURE, AT YOUR PACE</span>
      <h1>Open the <em>Word.</em></h1>
      <p>Choose a translation, book and chapter. Tap any verse to bookmark, copy or share it.</p>
      <BibleReader />
    </section>
  </main>;
}
