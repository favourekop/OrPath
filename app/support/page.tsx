import Link from "next/link";
import { ArrowUpRight, BookOpen, Heart, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Support OrPath — Let the Word Lead",
  description: "Help keep OrPath growing as a thoughtful home for Scripture, prayer, and spiritual growth.",
};

export default function SupportPage() {
  return (
    <main className="support-page">
      <div className="support-wrap">
        <Link href="/" className="support-brand"><span className="support-mark"><BookOpen size={22}/></span><span><strong>orpath<span>.</span></strong><small>LET THE WORD LEAD</small></span></Link>
        <div className="support-intro">
          <span className="support-eyebrow"><Heart size={14}/> SUPPORT THE MISSION</span>
          <h1>Help the Word reach <em>further.</em></h1>
          <p>OrPath is built to make Scripture, prayer, and spiritual growth more accessible. If this space has encouraged you, you can help us keep improving it for the community.</p>
        </div>
        <section className="support-card" aria-labelledby="support-card-title">
          <div className="support-card-heading">
            <span className="support-heart"><Heart size={19}/></span>
            <div><h2 id="support-card-title">Support Favour Ekop on Myhappr</h2><p>Secure support is handled by Myhappr. Your contribution goes to the creator page you selected.</p></div>
          </div>
          <div className="support-embed">
            <iframe
              title="Support Favour Ekop through Myhappr"
              src="https://myhappr.com/embed/favourekop37vx?color=%23143d2f&title=Support%20OrPath&theme=light"
              width="100%"
              height="600"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="payment"
            />
          </div>
          <p className="support-fallback">If the support form does not load, <a href="https://myhappr.com/favourekop37vx" target="_blank" rel="noopener noreferrer">open the Myhappr page directly <ArrowUpRight size={13}/></a>.</p>
        </section>
        <div className="support-trust"><ShieldCheck size={16}/><span>Payments and supporter details are handled by Myhappr. OrPath does not collect or store your payment information.</span></div>
        <Link href="/" className="support-back">← Back to OrPath</Link>
      </div>
    </main>
  );
}
