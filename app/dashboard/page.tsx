import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookMarked, BookOpen, CalendarDays, Heart, ListChecks, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your Dashboard — OrPath" };

export default async function UserDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [profileResult, savedCount, prayerCount, progressCount, planCount, recentSaved, recentPrayers] = await Promise.all([
    supabase.from("profiles").select("display_name, role").eq("id", user.id).maybeSingle(),
    supabase.from("saved_verses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("prayer_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("reading_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_reading_plans").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("saved_verses").select("id, reference, verse_text, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("prayer_entries").select("id, title, content, is_answered, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
  ]);

  const displayName = profileResult.data?.display_name || user.user_metadata?.full_name || "Friend";
  const stats = [
    { label: "Saved verses", value: savedCount.count ?? 0, icon: BookMarked },
    { label: "Prayer entries", value: prayerCount.count ?? 0, icon: Heart },
    { label: "Chapters completed", value: progressCount.count ?? 0, icon: BookOpen },
    { label: "Reading plans", value: planCount.count ?? 0, icon: ListChecks },
  ];

  return (
    <main className="app" style={{ minHeight: "100vh" }}>
      <section className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark"><BookOpen size={21}/></span><span className="brand-name">orpath<span>.</span><small>LET THE WORD LEAD</small></span></Link>
          <div className="top-actions"><Link className="text-link" href="/account"><UserRound size={15}/> Account</Link><Link className="text-link" href="/">Open Bible <ArrowLeft size={14}/></Link></div>
        </header>
        <div className="content">
          <div className="page-intro">
            <span className="section-kicker">YOUR PERSONAL SPACE</span>
            <h1>Welcome back,<br/><em>{displayName}.</em></h1>
            <p>Your journey with the Word, all in one place. Keep growing at your own pace.</p>
          </div>
          <div className="practice-grid" style={{ marginTop: 28 }}>
            {stats.map(({label,value,icon:Icon}) => <section className="practice-card" key={label} style={{minHeight:130,cursor:"default"}}><span className="practice-icon"><Icon size={19}/></span><span className="card-overline">{label}</span><strong style={{fontSize:32}}>{value}</strong></section>)}
          </div>
          <div className="lower-grid" style={{ marginTop: 22 }}>
            <section className="continue-panel">
              <div className="panel-heading"><div><span className="section-kicker">YOUR LIBRARY</span><h2>Recently saved</h2></div><BookMarked size={20}/></div>
              {(recentSaved.data ?? []).length ? <div style={{display:"grid",gap:12,marginTop:18}}>{recentSaved.data!.map(item=><article key={item.id} style={{padding:"13px 0",borderBottom:"1px solid var(--border)"}}><strong style={{fontSize:13}}>{item.reference}</strong><p style={{fontSize:11,lineHeight:1.7,color:"var(--subtext)",margin:"6px 0 0"}}>{item.verse_text || "Saved Scripture"}</p></article>)}</div> : <p style={{fontSize:12,lineHeight:1.8,color:"var(--subtext)",marginTop:18}}>Your saved verses will appear here as you build your personal Scripture library.</p>}
              <Link className="text-link" href="/">Explore Scripture <ArrowLeft size={14}/></Link>
            </section>
            <section className="reflection-panel">
              <div className="panel-heading"><div><span className="section-kicker">PRAYER JOURNAL</span><h2>Your recent prayers</h2></div><Heart size={20}/></div>
              {(recentPrayers.data ?? []).length ? <div style={{display:"grid",gap:12,marginTop:18}}>{recentPrayers.data!.map(item=><article key={item.id} style={{padding:"12px 0",borderBottom:"1px solid var(--border)"}}><div style={{display:"flex",justifyContent:"space-between",gap:8}}><strong style={{fontSize:12}}>{item.title || "Personal prayer"}</strong><span style={{fontSize:9,color:item.is_answered?"#477451":"var(--subtext)"}}>{item.is_answered?"Answered":"In prayer"}</span></div><p style={{fontSize:11,lineHeight:1.7,color:"var(--subtext)",margin:"6px 0 0"}}>{item.content.length>120?item.content.slice(0,120)+"…":item.content}</p></article>)}</div> : <p style={{fontSize:12,lineHeight:1.8,color:"var(--subtext)",marginTop:18}}>Your private prayer journal will be waiting here when you begin adding entries.</p>}
              <Link className="text-link" href="/">Continue your journey <ArrowLeft size={14}/></Link>
            </section>
          </div>
          <section className="continue-panel" style={{marginTop:20}}>
            <div className="panel-heading"><div><span className="section-kicker">KEEP YOUR RHYTHM</span><h2>Make space for today.</h2></div><CalendarDays size={20}/></div>
            <p style={{fontSize:12,color:"var(--subtext)",lineHeight:1.8,marginTop:8}}>Return to the Bible reader, continue a plan, or spend a few quiet moments in prayer.</p>
            <Link className="text-link" href="/">Go to OrPath <ArrowLeft size={14}/></Link>
          </section>
          <footer className="footer"><span>© 2026 OrPath</span><span>Every day, a step closer to the Word.</span><Link className="text-link" href="/about">About the founder</Link></footer>
        </div>
      </section>
    </main>
  );
}
