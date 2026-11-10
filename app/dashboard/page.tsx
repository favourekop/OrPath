import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookMarked, BookOpen, CalendarDays, Flame, Heart, ListChecks, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Your Dashboard — OrPath" };

function streakMilestone(days: number) {
  const milestones = [
    { days: 20, title: "Love", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 30, title: "Joy", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 40, title: "Peace", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 50, title: "Patience", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 60, title: "Kindness", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 70, title: "Goodness", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 80, title: "Faithfulness", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 90, title: "Gentleness", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 100, title: "Self-Control", subtitle: "Fruit of the Spirit", verse: "Galatians 5:22–23" },
    { days: 120, title: "Victory", subtitle: "OrPath growth stage", verse: "1 Corinthians 15:57" },
    { days: 150, title: "Favour", subtitle: "OrPath growth stage", verse: "Psalm 5:12" },
    { days: 180, title: "Gallant", subtitle: "OrPath growth stage", verse: "Joshua 1:9" },
    { days: 270, title: "Grace", subtitle: "OrPath growth stage", verse: "2 Corinthians 12:9" },
    { days: 365, title: "AmBlessed", subtitle: "One year in the Word", verse: "Psalm 1:1–3" },
  ];
  const earned = [...milestones].reverse().find((item) => days >= item.days);
  const next = milestones.find((item) => days < item.days);
  return { earned: earned ?? { days: 0, title: "Seedling", subtitle: "Your journey begins", verse: "Psalm 1:2" }, next };
}

export default async function UserDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth");

  const [profileResult, savedCount, prayerCount, progressCount, planCount, recentSaved, recentPrayers, progressDays] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, role").eq("id", user.id).maybeSingle(),
    supabase.from("saved_verses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("prayer_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("reading_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_reading_plans").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("reading_progress").select("completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(500),
    supabase.from("saved_verses").select("id, reference, verse_text, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("prayer_entries").select("id, title, content, is_answered, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
  ]);

  const displayName = profileResult.data?.display_name || user.user_metadata?.full_name || "Friend";
  const profileInitial = displayName.trim().charAt(0).toUpperCase() || "U";
  const dayKeys = new Set((progressDays.data ?? []).map((item) => { const d = new Date(item.completed_at); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); }));
  const today = new Date(); const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const yesterday = new Date(todayKey); yesterday.setDate(yesterday.getDate()-1);
  let currentStreak = 0; const cursor = dayKeys.has(todayKey) ? new Date(todayKey) : dayKeys.has(yesterday.getTime()) ? new Date(yesterday) : null;
  while (cursor && dayKeys.has(cursor.getTime())) { currentStreak++; cursor.setDate(cursor.getDate()-1); }
  let longestStreak = 0, run = 0, previous: number | null = null;
  for (const stamp of [...dayKeys].sort((a,b)=>a-b)) { if (previous !== null) { const gap = Math.round((stamp-previous)/86400000); run = gap === 1 ? run+1 : 1; } else run=1; longestStreak=Math.max(longestStreak,run); previous=stamp; }
  const milestone = streakMilestone(currentStreak);\n  const stats = [
    { label: "Current streak", value: `${currentStreak} ${currentStreak === 1 ? "day" : "days"}`, icon: Flame },
    { label: "Longest streak", value: `${longestStreak} ${longestStreak === 1 ? "day" : "days"}`, icon: CalendarDays },
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
          <div className="top-actions">{profileResult.data?.role === "admin" && <Link className="text-link" href="/admin"><ShieldCheck size={15}/> Admin console</Link>}<Link className="text-link" href="/account"><span aria-label={`Profile for ${displayName}`} title={displayName} style={{width:30,height:30,borderRadius:"50%",display:"inline-grid",placeItems:"center",overflow:"hidden",background:"#e8efe6",color:"#1c4a37",fontWeight:700,fontSize:13}}>{profileResult.data?.avatar_url ? <img src={profileResult.data.avatar_url} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : profileInitial}</span> Account</Link><Link className="text-link" href="/">Open Bible <ArrowLeft size={14}/></Link></div>
        </header>
        <div className="content">
          <div className="page-intro">
            <span className="section-kicker">YOUR PERSONAL SPACE</span>
            <h1>Welcome back,<br/><em>{displayName}.</em></h1>
            <p>Your journey with the Word, all in one place. Keep growing at your own pace.</p><p style={{marginTop:12,fontSize:12,color:"#5d8064",fontWeight:700}}>🔥 {currentStreak} day reading streak · {longestStreak} day personal best</p>\n            <section className="continue-panel" style={{marginTop:18,padding:18}}><div className="panel-heading"><div><span className="section-kicker">YOUR GROWTH STAGE</span><h2>{milestone.earned.title}</h2><p style={{fontSize:11,color:"var(--subtext)",marginTop:5}}>{milestone.earned.subtitle} · {milestone.earned.verse}</p></div><span className="practice-icon"><Flame size={20}/></span></div>{milestone.next ? <p style={{fontSize:12,color:"var(--subtext)",marginTop:12}}>{milestone.next.days-currentStreak} more reading {milestone.next.days-currentStreak===1?"day":"days"} to unlock <strong>{milestone.next.title}</strong> ({milestone.next.days}-day milestone).</p> : <p style={{fontSize:12,color:"var(--subtext)",marginTop:12}}>You have reached the one-year AmBlessed stage. Keep growing in the Word.</p>}</section>
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
