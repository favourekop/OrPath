import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookOpen, ShieldCheck, Users, Heart, BookMarked, ListChecks } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Admin Dashboard — OrPath" };

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const { data: profile, error } = await supabase.from("profiles").select("role, display_name").eq("id", user.id).maybeSingle();
  if (error || profile?.role !== "admin") redirect("/dashboard");

  const [users, verses, prayers, plans, latestUsers] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("saved_verses").select("*", { count: "exact", head: true }),
    supabase.from("prayer_entries").select("*", { count: "exact", head: true }),
    supabase.from("user_reading_plans").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("id, display_name, role, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const metrics = [
    {label:"Registered users",value:users.count??0,icon:Users},
    {label:"Saved verses",value:verses.count??0,icon:BookMarked},
    {label:"Prayer entries",value:prayers.count??0,icon:Heart},
    {label:"Reading plans",value:plans.count??0,icon:ListChecks},
  ];

  return (
    <main className="app" style={{minHeight:"100vh"}}>
      <section className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark"><BookOpen size={21}/></span><span className="brand-name">orpath<span>.</span><small>LET THE WORD LEAD</small></span></Link>
          <div className="top-actions"><span className="section-kicker"><ShieldCheck size={14}/> ADMIN CONSOLE</span><Link className="text-link" href="/dashboard">User dashboard <ArrowLeft size={14}/></Link></div>
        </header>
        <div className="content">
          <div className="page-intro">
            <span className="section-kicker">OWNER CONTROL CENTRE</span>
            <h1>Good day,<br/><em>{profile.display_name || "Favour"}.</em></h1>
            <p>OrPath platform overview. Manage the experience responsibly and keep the community growing.</p>
          </div>
          <div className="practice-grid" style={{marginTop:28}}>
            {metrics.map(({label,value,icon:Icon})=><section className="practice-card" key={label} style={{minHeight:130,cursor:"default"}}><span className="practice-icon"><Icon size={19}/></span><span className="card-overline">{label}</span><strong style={{fontSize:32}}>{value}</strong></section>)}
          </div>
          <section className="continue-panel" style={{marginTop:22}}>
            <div className="panel-heading"><div><span className="section-kicker">COMMUNITY</span><h2>Recently joined</h2></div><Users size={20}/></div>
            <div style={{overflowX:"auto",marginTop:18}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12,textAlign:"left"}}>
                <thead><tr style={{color:"var(--subtext)"}}><th style={{padding:"10px 8px"}}>Member</th><th style={{padding:"10px 8px"}}>Role</th><th style={{padding:"10px 8px"}}>Joined</th></tr></thead>
                <tbody>{(latestUsers.data??[]).map(member=><tr key={member.id} style={{borderTop:"1px solid var(--border)"}}><td style={{padding:"12px 8px"}}>{member.display_name || "OrPath reader"}</td><td style={{padding:"12px 8px"}}>{member.role}</td><td style={{padding:"12px 8px",color:"var(--subtext)"}}>{new Date(member.created_at).toLocaleDateString()}</td></tr>)}</tbody>
              </table>
            </div>
            <p style={{fontSize:10,color:"var(--subtext)",lineHeight:1.7,marginTop:12}}>This overview shows account and aggregate activity counts only. Private prayer text and personal saved notes are not exposed in the admin console.</p>
          </section>
          <footer className="footer"><span>© 2026 OrPath</span><span>Owner access · Protected</span><Link className="text-link" href="/">Back to OrPath</Link></footer>
        </div>
      </section>
    </main>
  );
}
