import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BookMarked, BookOpen, CalendarDays, Flame, Heart, ListChecks, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { readingPlanContent } from "@/app/reading-plan-content";

export const metadata = { title: "Your Dashboard — OrPath" };
const dailyVerses = [
{reference:"Psalm 119:105",text:"Thy word is a lamp unto my feet, and a light unto my path.",theme:"GUIDANCE"},
{reference:"Proverbs 3:5–6",text:"Trust in the LORD with all thine heart; and lean not unto thine own understanding.",theme:"TRUST"},
{reference:"Isaiah 41:10",text:"Fear thou not; for I am with thee: be not dismayed; for I am thy God.",theme:"COURAGE"},
{reference:"Philippians 4:6–7",text:"Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.",theme:"PEACE"},
{reference:"Joshua 1:9",text:"Be strong and of a good courage; be not afraid, neither be thou dismayed: for the LORD thy God is with thee whithersoever thou goest.",theme:"COURAGE"},
{reference:"Lamentations 3:22–23",text:"It is of the LORD'S mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.",theme:"NEW MERCIES"},
{reference:"Romans 8:28",text:"And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",theme:"HOPE"},
{reference:"Matthew 6:33",text:"But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.",theme:"PRIORITIES"},
{reference:"Psalm 23:1",text:"The LORD is my shepherd; I shall not want.",theme:"PROVISION"},
{reference:"2 Corinthians 12:9",text:"My grace is sufficient for thee: for my strength is made perfect in weakness.",theme:"GRACE"},
{reference:"John 14:27",text:"Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you.",theme:"PEACE"},
{reference:"1 Peter 5:7",text:"Casting all your care upon him; for he careth for you.",theme:"CARE"}
];

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

  const [profileResult, savedCount, prayerCount, progressCount, planCount, activePlansResult, recentSaved, recentPrayers, progressDays] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, role").eq("id", user.id).maybeSingle(),
    supabase.from("saved_verses").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("prayer_entries").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("reading_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id).neq("bible_id", "orpath-checkin"),
    supabase.from("user_reading_plans").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("user_reading_plans").select("plan_slug, started_at, completed_days").eq("user_id", user.id).order("started_at", { ascending: false }),
    supabase.from("saved_verses").select("id, reference, verse_text, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("prayer_entries").select("id, title, content, is_answered, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(3),
    supabase.from("reading_progress").select("completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(500),
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
  const milestone = streakMilestone(longestStreak);
  const dayOfYear = Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(today.getFullYear(), 0, 0)) / 86400000);
  const dailyVerse = dailyVerses[(dayOfYear - 1) % dailyVerses.length];
  const activeJourneys = (activePlansResult.data ?? []).map((plan) => {
    const content = readingPlanContent.find((item) => item.title === plan.plan_slug);
    if (!content) return null;
    const started = new Date(plan.started_at);
    const elapsed = Math.max(0, Math.floor((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(started.getFullYear(), started.getMonth(), started.getDate())) / 86400000));
    const dayNumber = (elapsed % content.days.length) + 1;
    const completedDays = plan.completed_days ?? [];
    return { title: content.title, totalDays: content.days.length, dayNumber, day: content.days[dayNumber - 1], completedDays, progress: Math.min(100, Math.round(completedDays.length / content.days.length * 100)) };
  }).filter((item): item is NonNullable<typeof item> => item !== null);
  const stats = [
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
          <Link className="brand" href="/"><span className="brand-mark"><Image src="/orpath-icon.svg" alt="" width={40} height={40} priority /></span><span className="brand-name">ORPATH<small>LET THE WORD LEAD</small></span></Link>
          <div className="top-actions">{profileResult.data?.role === "admin" && <Link className="text-link" href="/admin"><ShieldCheck size={15}/> Admin console</Link>}<Link className="text-link" href="/account"><span aria-label={`Profile for ${displayName}`} title={displayName} style={{width:30,height:30,borderRadius:"50%",display:"inline-grid",placeItems:"center",overflow:"hidden",background:"#e8efe6",color:"#1c4a37",fontWeight:700,fontSize:13}}>{profileResult.data?.avatar_url ? <Image src={profileResult.data.avatar_url} alt="" width={30} height={30} unoptimized style={{width:"100%",height:"100%",objectFit:"cover"}}/> : profileInitial}</span> Account</Link><Link className="text-link" href="/">Open Bible <ArrowLeft size={14}/></Link></div>
        </header>
        <div className="content">
          <div className="page-intro">
            <span className="section-kicker">YOUR PERSONAL SPACE</span>
            <h1>Welcome back,<br/><em>{displayName}.</em></h1>
            <p>Your journey with the Word, all in one place. Keep growing at your own pace.</p><p style={{marginTop:12,fontSize:12,color:"#5d8064",fontWeight:700}}>🔥 {currentStreak} day streak · {longestStreak} day personal best</p>
            <section className="continue-panel" style={{marginTop:18,padding:18}}><div className="panel-heading"><div><span className="section-kicker">YOUR GROWTH STAGE</span><h2>{milestone.earned.title}</h2><p style={{fontSize:11,color:"var(--subtext)",marginTop:5}}>{milestone.earned.subtitle} · {milestone.earned.verse}</p></div><span className="practice-icon"><Flame size={20}/></span></div>{milestone.next ? <p style={{fontSize:12,color:"var(--subtext)",marginTop:12}}>{milestone.next.days-currentStreak} more {milestone.next.days-currentStreak===1?"day":"days"} to unlock <strong>{milestone.next.title}</strong> ({milestone.next.days}-day milestone).</p> : <p style={{fontSize:12,color:"var(--subtext)",marginTop:12}}>You have reached the one-year AmBlessed stage. Keep growing in the Word.</p>}</section>
          </div>
          <section className="continue-panel" style={{ marginTop: 24, padding: 22 }}>
            <div className="panel-heading"><div><span className="section-kicker">VERSE OF THE DAY · {dailyVerse.theme}</span><h2>A fresh word for today</h2></div><BookOpen size={21}/></div>
            <blockquote style={{ margin: "18px 0 10px", fontSize: 19, lineHeight: 1.8, fontFamily: "Georgia,serif" }}>“{dailyVerse.text}”</blockquote>
            <p style={{ fontSize: 12, fontWeight: 700, color: "#5d8064" }}>{dailyVerse.reference} · KJV</p>
            <p style={{ fontSize: 11, color: "var(--subtext)", marginTop: 8 }}>Your daily verse changes automatically with the calendar date.</p>
          </section>
          <section className="continue-panel" style={{ marginTop: 20, padding: 22 }}>
            <div className="panel-heading"><div><span className="section-kicker">YOUR DAILY WALK</span><h2>Reading journeys</h2></div><ListChecks size={21}/></div>
            {activeJourneys.length ? <div style={{ display: "grid", gap: 18, marginTop: 18 }}>
              {activeJourneys.map((journey) => <article key={journey.title} style={{ paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
                <strong style={{ fontSize: 14 }}>{journey.title}</strong>
                <p style={{ fontSize: 11, color: "var(--subtext)", marginTop: 4 }}>Day {journey.dayNumber} of {journey.totalDays} · {journey.progress}% completed</p>
                <div style={{ height: 6, borderRadius: 8, background: "var(--border)", overflow: "hidden", marginTop: 10 }}><div style={{ height: "100%", width: journey.progress + "%", background: "#5d8064", borderRadius: 8 }}/></div>
                <h3 style={{ fontSize: 16, marginTop: 14 }}>{journey.day.title}</h3>
                <p style={{ fontSize: 11, color: "#5d8064", fontWeight: 700, marginTop: 7 }}>{journey.day.reference}</p>
                <blockquote style={{ margin: "8px 0", paddingLeft: 12, borderLeft: "3px solid #8aa58a", fontSize: 13, lineHeight: 1.7 }}>{journey.day.passage}</blockquote>
                <p style={{ fontSize: 12, color: "var(--subtext)", lineHeight: 1.7 }}>{journey.day.reflection}</p>
                <p style={{ fontSize: 11, fontWeight: 700, marginTop: 10 }}>TODAY’S PRACTICE</p><p style={{ fontSize: 12, color: "var(--subtext)", lineHeight: 1.7 }}>{journey.day.practice}</p>
                <Link className="text-link" href="/">Continue this journey <ArrowLeft size={14}/></Link>
              </article>)}
            </div> : <div style={{ marginTop: 16 }}>
              <p style={{ fontSize: 12, lineHeight: 1.8, color: "var(--subtext)" }}>Your next chapter starts here. Choose a guided journey and OrPath will bring you a fresh reading each day.</p>
              {readingPlanContent.map((plan) => {
                const todayReading = plan.days[(dayOfYear - 1) % plan.days.length];
                return <article key={plan.title} style={{ padding: 14, border: "1px solid var(--border)", borderRadius: 12, marginTop: 10 }}>
                  <strong style={{ fontSize: 13 }}>{plan.title}</strong><p style={{ fontSize: 11, color: "#5d8064", fontWeight: 700, marginTop: 6 }}>TODAY · {todayReading.reference}</p>
                  <h3 style={{ fontSize: 15, marginTop: 8 }}>{todayReading.title}</h3>
                  <p style={{ fontSize: 12, lineHeight: 1.7, color: "var(--subtext)", marginTop: 6 }}>{todayReading.passage}</p>
                  <p style={{ fontSize: 11, lineHeight: 1.7, color: "var(--subtext)", marginTop: 7 }}>{todayReading.reflection}</p>
                  <p style={{ fontSize: 10, color: "var(--subtext)", marginTop: 8 }}>{plan.days.length}-day guided journey</p>
                </article>;
              })}
              <Link className="text-link" href="/">Explore reading journeys <ArrowLeft size={14}/></Link>
            </div>}
            <p style={{ fontSize: 10, color: "var(--subtext)", marginTop: 12 }}>Daily readings are selected from your journey’s start date. Your saved completion history remains yours.</p>
          </section>
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
