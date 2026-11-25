import Link from "next/link";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { redirect } from "next/navigation";
import { ArrowLeft, Activity, Users, BookOpen, Heart, MessageCircle, HandHeart, ShieldCheck, Flame, Flag, ExternalLink, UsersRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Analytics — OrPath Admin" };

type EngagementStats = {
  active_readers_7d?: number;
  active_readers_30d?: number;
  completed_chapters?: number;
  community_posts?: number;
  community_comments?: number;
  community_reactions?: number;
  prayer_requests_total?: number;
  prayer_requests_answered?: number;
  study_groups?: number;
  group_memberships?: number;
  open_reports?: number;
  streak_leaderboard?: { display_name: string | null; current_streak: number; longest_streak: number }[];
};

const number = (value?: number) => (value ?? 0).toLocaleString();

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");

  const [{ data: stats, error: statsError }, { data: recentUsers }] = await Promise.all([
    supabase.rpc("orpath_admin_engagement_stats"),
    supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const totals = stats as EngagementStats | null;
  const cards = [
    { label: "Active readers · 7 days", value: number(totals?.active_readers_7d), icon: Users, detail: "Members with a completed chapter" },
    { label: "Active readers · 30 days", value: number(totals?.active_readers_30d), icon: Activity, detail: "Unique readers in the last 30 days" },
    { label: "Chapters completed", value: number(totals?.completed_chapters), icon: BookOpen, detail: "Recorded reading progress" },
    { label: "Community posts", value: number(totals?.community_posts), icon: MessageCircle, detail: "Published posts" },
    { label: "Comments & reactions", value: number((totals?.community_comments ?? 0) + (totals?.community_reactions ?? 0)), icon: Heart, detail: "Combined community engagement" },
    { label: "Prayer requests", value: number(totals?.prayer_requests_total), icon: HandHeart, detail: `${number(totals?.prayer_requests_answered)} marked answered` },
    { label: "Bible study groups", value: number(totals?.study_groups), icon: UsersRound, detail: `${number(totals?.group_memberships)} active memberships` },
    { label: "Reports awaiting review", value: number(totals?.open_reports), icon: Flag, detail: "Open or under review" },
  ];

  return <main className="app" style={{ minHeight: "100vh" }}><section className="main-shell">
    <header className="topbar">
      <Link className="brand" href="/"><span className="brand-mark"><BookOpen size={22}/></span><span className="brand-name"><span className="brand-word">orpath<span>.</span></span><small>LET THE WORD LEAD</small></span></Link>
      <div className="breadcrumbs"><span>ADMIN</span><span className="crumb-slash">/</span><strong>Analytics</strong></div>
      <div className="top-actions"><Link className="text-link" href="/admin">Admin console</Link><Link className="text-link" href="/bible"><BookOpen size={15}/> Open Bible</Link><ProfileAvatar /></div>
    </header>
    <div className="content">
      <div className="page-intro"><span className="section-kicker">PLATFORM INSIGHTS</span><h1>OrPath <em>analytics.</em></h1><p>Reading consistency, community health and platform growth. Private prayer text and personal notes are never displayed.</p></div>
      {statsError && <section className="continue-panel" role="status" style={{ marginTop: 22, borderColor: "#c58b42" }}><strong>Analytics migration pending</strong><p style={{ color: "var(--subtext)", fontSize: 12, lineHeight: 1.7, marginTop: 7 }}>Apply <code>202611240001_admin_engagement_and_streaks.sql</code> in Supabase SQL Editor. Existing account analytics remain separate; the new engagement metrics will appear after the migration is applied.</p></section>}
      <div className="practice-grid" style={{ marginTop: 26 }}>
        {cards.map(({label,value,icon:Icon,detail})=><section className="practice-card" key={label} style={{ minHeight: 142, cursor: "default" }}><span className="practice-icon"><Icon size={19}/></span><span className="card-overline">{label}</span><strong style={{ fontSize: 30 }}>{statsError ? "—" : value}</strong><span style={{ fontSize: 10, color: "var(--subtext)" }}>{detail}</span></section>)}
      </div>
      <section className="continue-panel" style={{ marginTop: 22 }}>
        <div className="panel-heading"><div><span className="section-kicker">READING CONSISTENCY · OPT-IN ONLY</span><h2>Streak leaderboard</h2></div><Flame size={20}/></div>
        <p style={{ color: "var(--subtext)", fontSize: 11, lineHeight: 1.7, marginTop: 8 }}>Only members who explicitly opt in to leaderboard visibility appear here. Streaks count days with completed Bible chapters, not page views.</p>
        {!statsError && (totals?.streak_leaderboard?.length ?? 0) > 0 ? <div style={{ overflowX: "auto", marginTop: 14 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
          <thead><tr style={{ color: "var(--subtext)" }}><th style={{ padding: "10px 8px" }}>Member</th><th style={{ padding: "10px 8px" }}>Current streak</th><th style={{ padding: "10px 8px" }}>Personal best</th></tr></thead>
          <tbody>{totals!.streak_leaderboard!.map((member,index)=><tr key={index} style={{ borderTop: "1px solid var(--border)" }}><td style={{ padding: "12px 8px" }}>{member.display_name || "OrPath reader"}</td><td style={{ padding: "12px 8px", fontWeight: 700 }}>🔥 {number(member.current_streak)} days</td><td style={{ padding: "12px 8px" }}>{number(member.longest_streak)} days</td></tr>)}</tbody>
        </table></div> : <p style={{ color: "var(--subtext)", fontSize: 12, marginTop: 16 }}>{statsError ? "Leaderboard data is not available until the migration is applied." : "No members have opted in to the public streak leaderboard yet. Their reading progress remains private."}</p>}
      </section>
      <section className="continue-panel" style={{ marginTop: 18 }}>
        <div className="panel-heading"><div><span className="section-kicker">TRAFFIC & PERFORMANCE</span><h2>Website analytics</h2></div><Activity size={20}/></div>
        <p style={{ color: "var(--subtext)", fontSize: 12, lineHeight: 1.8, marginTop: 12 }}>Vercel Web Analytics reports page views, visitors, referrers and device categories. Speed Insights reports real-user Core Web Vitals. These reports use collected platform data.</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
          <a className="solid-button" href="https://vercel.com/favourekop75-1115/or-path/analytics" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>Open Web Analytics <ExternalLink size={15}/></a>
          <a className="outline-button" href="https://vercel.com/favourekop75-1115/or-path/speed-insights" target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none" }}>Open Speed Insights <ExternalLink size={15}/></a>
        </div>
      </section>
      <section className="continue-panel" style={{ marginTop: 18 }}>
        <div className="panel-heading"><div><span className="section-kicker">COMMUNITY GROWTH</span><h2>Recent registrations</h2></div><Users size={20}/></div>
        <div style={{ overflowX: "auto", marginTop: 14 }}><table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "left" }}>
          <thead><tr style={{ color: "var(--subtext)" }}><th style={{ padding: "10px 8px" }}>Member</th><th style={{ padding: "10px 8px" }}>Joined</th></tr></thead>
          <tbody>{(recentUsers ?? []).map(member=><tr key={member.id} style={{ borderTop: "1px solid var(--border)" }}><td style={{ padding: "12px 8px" }}>{member.display_name || "OrPath reader"}</td><td style={{ padding: "12px 8px", color: "var(--subtext)" }}>{member.created_at ? new Date(member.created_at).toLocaleDateString() : "—"}</td></tr>)}</tbody>
        </table></div>
        <p style={{ fontSize: 10, color: "var(--subtext)", lineHeight: 1.7, marginTop: 12 }}>Prayer contents, private group discussions and personal notes are excluded. Moderation counts are aggregate only.</p>
      </section>
      <footer className="footer"><span>© 2026 OrPath</span><span>Admin access · Protected</span><Link className="text-link" href="/">Back to OrPath</Link></footer>
    </div>
  </section></main>;
}
