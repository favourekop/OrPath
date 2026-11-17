import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Activity, Users, BookMarked, Heart, ListChecks, ExternalLink, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Analytics — OrPath Admin" };

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");
  const { data: profile, error: profileError } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (profileError || profile?.role !== "admin") redirect("/dashboard");

  const [{ data: stats, error: statsError }, { data: recentUsers }] = await Promise.all([
    supabase.rpc("orpath_admin_dashboard_stats"),
    supabase.from("profiles").select("id, display_name, created_at").order("created_at", { ascending: false }).limit(10),
  ]);
  const totals = stats?.[0];
  const metrics = [
    { label: "Registered users", value: totals?.total_users ?? "—", icon: Users, detail: "Total accounts in OrPath" },
    { label: "Saved verses", value: totals?.total_saved_verses ?? "—", icon: BookMarked, detail: "Saved Scripture records" },
    { label: "Prayer entries", value: totals?.total_prayer_entries ?? "—", icon: Heart, detail: "Private entry count only" },
    { label: "Reading plans", value: totals?.total_reading_plans ?? "—", icon: ListChecks, detail: "Reading plan records" },
  ];

  return <main className="app" style={{ minHeight: "100vh" }}><section className="main-shell">
    <header className="topbar">
      <Link className="brand" href="/admin"><span className="brand-mark"><ShieldCheck size={20}/></span><span className="brand-name"><span className="brand-word">orpath<span>.</span></span><small>ADMIN ANALYTICS</small></span></Link>
      <div className="top-actions"><Link className="text-link" href="/admin"><ArrowLeft size={14}/> Dashboard</Link><Link className="text-link" href="/admin/settings">Admin settings</Link></div>
    </header>
    <div className="content">
      <div className="page-intro"><span className="section-kicker">PLATFORM INSIGHTS</span><h1>OrPath <em>analytics.</em></h1><p>Understand community growth and Scripture engagement while respecting members’ private information.</p></div>
      <div className="practice-grid" style={{ marginTop: 26 }}>
        {metrics.map(({label,value,icon:Icon,detail})=><section className="practice-card" key={label} style={{ minHeight: 145, cursor: "default" }}><span className="practice-icon"><Icon size={19}/></span><span className="card-overline">{label}</span><strong style={{ fontSize: 32 }}>{value}</strong><span style={{ fontSize: 10, color: "var(--subtext)" }}>{detail}</span></section>)}
      </div>
      {statsError && <p role="status" style={{ color: "#9a642c", fontSize: 12, marginTop: 14 }}>Some engagement totals are unavailable until the admin statistics migration is fully applied.</p>}
      <section className="continue-panel" style={{ marginTop: 22 }}>
        <div className="panel-heading"><div><span className="section-kicker">TRAFFIC & PERFORMANCE</span><h2>Website analytics</h2></div><Activity size={20}/></div>
        <p style={{ color: "var(--subtext)", fontSize: 12, lineHeight: 1.8, marginTop: 12 }}>Vercel Web Analytics reports page views, visitors, referrers and device categories. Vercel Speed Insights reports real-user Core Web Vitals and route performance. Both dashboards use their own collected data; metrics are not fabricated or inferred here.</p>
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
        <p style={{ fontSize: 10, color: "var(--subtext)", lineHeight: 1.7, marginTop: 12 }}>Prayer content and personal notes are never displayed here. Counts are aggregate totals returned by the protected admin statistics function.</p>
      </section>
      <footer className="footer"><span>© 2026 OrPath</span><span>Admin access · Protected</span><Link className="text-link" href="/">Back to OrPath</Link></footer>
    </div>
  </section></main>;
}
