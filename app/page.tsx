"use client";

import { useEffect, useMemo, useState } from "react";
import BibleReader from "./components/BibleReader";
import { readingPlanContent } from "./reading-plan-content";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowDown, ArrowLeft, ArrowRight, AudioLines, BookMarked, BookOpen,
  Bookmark, Check, ChevronDown, CircleHelp, Compass, Copy, Flame, Headphones,
  Heart, History, Home, Languages, LayoutDashboard, ListChecks, Menu, Moon, MoreHorizontal,
  NotebookPen, Play, Plus, Search, Settings2, Share2, Sparkles, Sun, X
} from "lucide-react";

const verses = [
  { ref: "Psalm 119:105", text: "Thy word is a lamp unto my feet, and a light unto my path.", theme: "GUIDANCE" },
  { ref: "Proverbs 3:5–6", text: "Trust in the LORD with all thine heart; and lean not unto thine own understanding.", theme: "TRUST" },
  { ref: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God.", theme: "COURAGE" },
  { ref: "Philippians 4:6–7", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.", theme: "PEACE" },
];

const chapters = [
  { n: 1, text: "In the beginning God created the heaven and the earth." },
  { n: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep." },
  { n: 3, text: "And God said, Let there be light: and there was light." },
  { n: 4, text: "And God saw the light, that it was good: and God divided the light from the darkness." },
  { n: 5, text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day." },
  { n: 6, text: "And God said, Let there be a firmament in the midst of the waters, and let it divide the waters from the waters." },
  { n: 7, text: "And God made the firmament, and divided the waters which were under the firmament from the waters which were above the firmament: and it was so." },
];

function getStreakStage(days: number) {
  const stages = [
    [20, "Love"], [30, "Joy"], [40, "Peace"], [50, "Patience"], [60, "Kindness"],
    [70, "Goodness"], [80, "Faithfulness"], [90, "Gentleness"], [100, "Self-Control"],
    [120, "Victory"], [150, "Favour"], [180, "Gallant"], [270, "Grace"], [365, "AmBlessed"],
  ] as const;
  return [...stages].reverse().find(([threshold]) => days >= threshold)?.[1] || "Seedling";
}

const plans = [
  { title: "A Quiet Heart", detail: "5 days · Finding peace in God's presence", icon: "☼", color: "sand" },
  { title: "Wisdom for Today", detail: "7 days · Learn to walk in wisdom", icon: "✳", color: "sage" },
  { title: "The Life of Jesus", detail: "14 days · Walk through the Gospels", icon: "✧", color: "lavender" },
];

type Tab = "Home" | "Read" | "Plans" | "Prayer" | "Saved";

export default function HomePage() {
  const [tab, setTab] = useState<Tab>("Home");
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [verseIndex, setVerseIndex] = useState(0);
  const [saved, setSaved] = useState<string[]>([]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);
  const [prayer, setPrayer] = useState("");
  const [prayers, setPrayers] = useState<string[]>([]);
  const [startedPlans, setStartedPlans] = useState<string[]>([]);
  const [planProgress, setPlanProgress] = useState<Record<string, number[]>>({});
  const [activePlanDay, setActivePlanDay] = useState<Record<string, number>>({});
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [profileInitial, setProfileInitial] = useState("U");
  const [profileLabel, setProfileLabel] = useState("Guest reader");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [signedIn, setSignedIn] = useState(false);
  const [activeBook, setActiveBook] = useState("Genesis");
  const [activeChapter, setActiveChapter] = useState(1);

  useEffect(() => {
    let active = true;
    async function loadProfileBadge() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!active || !user) return;
      const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle();
      if (!active) return;
      const displayName = profile?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User";
      setProfileInitial(displayName.trim().charAt(0).toUpperCase() || "U");
      setProfileLabel(displayName);
      setAvatarUrl(profile?.avatar_url || "");
      const [{ data: savedRows }, { data: prayerRows }, { data: planRows }] = await Promise.all([
        supabase.from("saved_verses").select("reference, verse_id").eq("user_id", user.id),
        supabase.from("prayer_entries").select("content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
        supabase.from("user_reading_plans").select("plan_slug, completed_days").eq("user_id", user.id),
      ]);
      if (!active) return;
      setSaved((savedRows || []).map(row => row.reference || row.verse_id));
      setPrayers((prayerRows || []).map(row => row.content));
      setStartedPlans((planRows || []).map(row => row.plan_slug));
      setPlanProgress(Object.fromEntries((planRows || []).map(row => [row.plan_slug, row.completed_days || []])));
      const { data: progress } = await supabase.from("reading_progress").select("completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(400);
      if (!active) return;
      const days = new Set((progress || []).map(item => { const dt = new Date(item.completed_at); return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime(); }));
      const today = new Date(); const todayKey = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const yesterday = new Date(todayKey); yesterday.setDate(yesterday.getDate()-1);
      const cursor = days.has(todayKey) ? new Date(todayKey) : days.has(yesterday.getTime()) ? new Date(yesterday) : null; let streak = 0;
      while (cursor && days.has(cursor.getTime())) { streak++; cursor.setDate(cursor.getDate()-1); }
      let best = 0, run = 0, previous: number | null = null;
      for (const stamp of [...days].sort((a,b)=>a-b)) { run = previous !== null && stamp-previous === 86400000 ? run+1 : 1; best = Math.max(best,run); previous = stamp; }
      setCurrentStreak(streak); setBestStreak(best);
      setSignedIn(true);
    }
    void loadProfileBadge();
    return () => { active = false; };
  }, []);

  const currentVerse = verses[verseIndex];
  const filteredVerses = useMemo(() => verses.filter(v => (v.ref + " " + v.text).toLowerCase().includes(search.toLowerCase())), [search]);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }
  async function toggleSaved(ref: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    if (saved.includes(ref)) {
      const { error } = await supabase.from("saved_verses").delete().eq("user_id", user.id).eq("verse_id", ref);
      if (error) { notify(error.message); return; }
      setSaved(prev => prev.filter(x => x !== ref)); notify("Removed from your saved verses");
    } else {
      const verse = verses.find(item => item.ref === ref);
      const { error } = await supabase.from("saved_verses").upsert({ user_id: user.id, bible_id: "orpath-sample", verse_id: ref, reference: ref, verse_text: verse?.text || "" }, { onConflict: "user_id,bible_id,verse_id" });
      if (error) { notify(error.message); return; }
      setSaved(prev => [...prev, ref]); notify("Verse saved to your library");
    }
  }

  async function savePrayerEntry(fromModal = false) {
    if (!prayer.trim()) { notify("Write a prayer first"); return; }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    const entry = prayer.trim();
    const { error } = await supabase.from("prayer_entries").insert({ user_id: user.id, title: "Personal prayer", content: entry });
    if (error) { notify(error.message); return; }
    setPrayers(prev => [entry, ...prev]); setPrayer("");
    if (fromModal) { setShowPrayer(false); nav("Prayer"); }
    notify("Your prayer has been saved privately");
  }

  async function togglePlan(planSlug: string) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    if (startedPlans.includes(planSlug)) {
      const { error } = await supabase.from("user_reading_plans").delete().eq("user_id", user.id).eq("plan_slug", planSlug);
      if (error) { notify(error.message); return; }
      setStartedPlans(prev => prev.filter(item => item !== planSlug)); notify("Plan removed from your journey");
    } else {
      const { error } = await supabase.from("user_reading_plans").upsert({ user_id: user.id, plan_slug: planSlug }, { onConflict: "user_id,plan_slug" });
      if (error) { notify(error.message); return; }
      setStartedPlans(prev => [...prev, planSlug]); notify("Plan added to your journey");
    }
  }
  async function togglePlanDay(planSlug: string, day: number) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = "/auth"; return; }
    if (!startedPlans.includes(planSlug)) {
      const { error } = await supabase.from("user_reading_plans").upsert({ user_id: user.id, plan_slug: planSlug }, { onConflict: "user_id,plan_slug" });
      if (error) { notify(error.message); return; }
      setStartedPlans(prev => [...prev, planSlug]);
    }
    const current = planProgress[planSlug] || [];
    const nextDays = current.includes(day) ? current.filter(item => item !== day) : [...current, day].sort((a,b)=>a-b);
    const { error } = await supabase.from("user_reading_plans").update({ completed_days: nextDays }).eq("user_id", user.id).eq("plan_slug", planSlug);
    if (error) { notify(error.message); return; }
    setPlanProgress(prev => ({ ...prev, [planSlug]: nextDays }));
    notify(nextDays.includes(day) ? "Reading plan day completed" : "Reading plan progress updated");
  }

  function nav(next: Tab) {
    setTab(next);
    setMobileMenu(false);
  }
  function copyVerse(text: string, ref: string) {
    if (navigator.clipboard) navigator.clipboard.writeText('"' + text + '" — ' + ref).then(() => notify("Verse copied")).catch(() => notify("Select and copy this verse"));
    else notify("Select and copy this verse");
  }

  return (
    <main className={dark ? "app dark" : "app"}>
      <aside className={mobileMenu ? "sidebar mobile-open" : "sidebar"}>
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); nav("Home"); }}>
          <span className="brand-mark"><BookOpen size={22} strokeWidth={1.8}/><i /></span>
          <span className="brand-name">orpath<span>.</span><small>LET THE WORD LEAD</small></span>
        </a>
        <div className="side-label">YOUR SPACE</div>
        <button className="nav-item" onClick={() => { window.location.href = "/dashboard"; }}><LayoutDashboard size={18}/><span>Your dashboard</span></button>
        <nav className="side-nav">
          {([{label:"Home",icon:Home},{label:"Read",icon:BookOpen},{label:"Plans",icon:ListChecks},{label:"Prayer",icon:Heart},{label:"Saved",icon:Bookmark}] as const).map(item => {
            const Icon = item.icon;
            return <button key={item.label} className={tab === item.label ? "nav-item active" : "nav-item"} onClick={() => nav(item.label)}><Icon size={18}/><span>{item.label === "Read" ? "Bible reader" : item.label === "Plans" ? "Reading plans" : item.label === "Saved" ? "Saved verses" : item.label === "Prayer" ? "Prayer journal" : "Overview"}</span>{item.label === "Saved" && saved.length > 0 && <em>{saved.length}</em>}</button>;
          })}
        </nav>
        <div className="side-label explore-label">EXPLORE</div>
        <button className="nav-item" onClick={() => { setShowSearch(true); }}><Search size={18}/><span>Find a passage</span></button>
        <button className="nav-item" onClick={() => notify("Audio Bible is on our roadmap.")}><Headphones size={18}/><span>Listen to the Bible</span><span className="soon">SOON</span></button>
        <button className="nav-item" onClick={() => notify("Study tools are coming soon.")}><Sparkles size={18}/><span>Study tools</span><span className="soon">SOON</span></button>
        <div className="sidebar-bottom">
          <div className="streak-card"><div className="streak-icon"><Flame size={19}/></div><div><strong>{signedIn ? `${currentStreak} day reading streak` : "Start a rhythm"}</strong><p>{signedIn ? (currentStreak ? `${getStreakStage(bestStreak)} stage · Beautiful consistency.` : "Complete a chapter to begin your streak.") : "A little time in the Word, every day."}</p></div><ArrowRight size={16}/></div>
          <button className="profile-button" onClick={() => { window.location.href = signedIn ? "/account" : "/auth"; }}><div className="avatar">{avatarUrl ? <img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/> : profileInitial}</div><div><strong>{signedIn ? profileLabel : "Your journey"}</strong><span>{signedIn ? "Your profile" : profileLabel}</span></div><MoreHorizontal size={19}/></button>
        </div>
      </aside>

      <section className="main-shell">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={20}/> : <Menu size={20}/>}</button>
          <div className="breadcrumbs"><span>OrPath</span><span className="crumb-slash">/</span><strong>{tab === "Home" ? "Your daily walk" : tab === "Read" ? "Bible reader" : tab === "Plans" ? "Reading plans" : tab === "Prayer" ? "Prayer journal" : "Saved verses"}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search Scripture" onClick={() => setShowSearch(true)}><Search size={18}/></button>
            <button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
            <button className="top-avatar" aria-label={signedIn ? `Open ${profileLabel} profile` : "Sign in"} onClick={() => { window.location.href = signedIn ? "/account" : "/auth"; }}>{avatarUrl ? <img src={avatarUrl} alt="" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/> : profileInitial}</button>
          </div>
        </header>

        <div className="content">
          {tab === "Home" && <>
            <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR MOMENT WITH GOD</div><h1>A little closer,<br/><em>every day.</em></h1><p className="welcome-copy">Make room for the Word. Find a quiet moment, breathe, and let truth meet you where you are.</p></div><div className="date-chip"><Sun size={15}/> YOUR DAILY PAUSE</div></div>
            <section className="path-visual-card" aria-label="OrPath daily journey illustration"><div className="path-visual-copy"><span className="section-kicker">A JOURNEY ROOTED IN THE WORD</span><h2>Grow one day<br/><em>at a time.</em></h2><p>Small moments with Scripture can shape a lifetime.</p></div><div className="path-3d-scene" aria-hidden="true"><div className="path-3d-book"><span className="book-cover">OR<br/>PATH</span><span className="book-pages"/></div><div className="path-3d-orbit orbit-a"/><div className="path-3d-orbit orbit-b"/><span className="path-3d-spark">✦</span></div></section>
            <section className="hero-verse">
              <div className="hero-texture" />
              <div className="verse-top"><span><BookOpen size={15}/> VERSE OF THE DAY</span><span className="verse-date">TODAY’S LIGHT</span></div>
              <div className="ornament">“</div>
              <blockquote>{currentVerse.text}</blockquote>
              <div className="verse-bottom"><span className="verse-reference">{currentVerse.ref} <span>·</span> KJV</span><div className="verse-actions"><button title="Copy verse" onClick={() => copyVerse(currentVerse.text, currentVerse.ref)}><Copy size={16}/></button><button title="Share verse" onClick={() => copyVerse(currentVerse.text, currentVerse.ref)}><Share2 size={16}/></button><button title="Save verse" className={saved.includes(currentVerse.ref) ? "saved" : ""} onClick={() => toggleSaved(currentVerse.ref)}>{saved.includes(currentVerse.ref) ? <Check size={16}/> : <Bookmark size={16}/>}</button><button title="Next verse" onClick={() => setVerseIndex((verseIndex + 1) % verses.length)}><ArrowRight size={16}/></button></div></div>
              <div className="verse-progress">{verses.map((v, i) => <button key={v.ref} aria-label={"Show "+v.ref} className={i === verseIndex ? "current" : ""} onClick={() => setVerseIndex(i)}/>)}</div>
            </section>
            <div className="section-heading"><div><span className="section-kicker">A STEADY RHYTHM</span><h2>Your daily practice</h2></div><button className="text-link" onClick={() => nav("Plans")}>Explore plans <ArrowRight size={15}/></button></div>
            <div className="practice-grid">
              <button className="practice-card reading-card" onClick={() => nav("Read")}><span className="practice-icon"><BookOpen size={21}/></span><span className="card-overline">PICK UP WHERE YOU LEFT OFF</span><strong>Read the Bible</strong><span className="practice-desc">Return to the living Word, one passage at a time.</span><span className="card-footer">Open reader <ArrowRight size={16}/></span><span className="card-decoration">01</span></button>
              <button className="practice-card prayer-card" onClick={() => setShowPrayer(true)}><span className="practice-icon"><Heart size={21}/></span><span className="card-overline">MAKE SPACE FOR STILLNESS</span><strong>Come as you are</strong><span className="practice-desc">Bring your gratitude, hopes, and honest prayers.</span><span className="card-footer">Write a prayer <ArrowRight size={16}/></span><span className="card-decoration">02</span></button>
              <button className="practice-card plan-card" onClick={() => nav("Plans")}><span className="practice-icon"><Compass size={21}/></span><span className="card-overline">GROW WITH INTENTION</span><strong>Find your path</strong><span className="practice-desc">A guided plan to help you build a daily rhythm.</span><span className="card-footer">Find a plan <ArrowRight size={16}/></span><span className="card-decoration">03</span></button>
            </div>
            <div className="lower-grid">
              <section className="reflection-panel"><div className="panel-heading"><div><span className="section-kicker">PAUSE & REFLECT</span><h2>A thought to carry</h2></div><span className="small-spark"><Sparkles size={17}/></span></div><p className="reflection-quote">“You do not have to see the whole road to take the next faithful step.”</p><p className="reflection-note">Where might God be inviting you to trust Him with your next step today?</p><button className="outline-button" onClick={() => setShowPrayer(true)}>Write your reflection <ArrowRight size={15}/></button></section>
              <section className="continue-panel"><div className="panel-heading"><div><span className="section-kicker">A PATH THROUGH SCRIPTURE</span><h2>Continue exploring</h2></div><BookMarked size={19} className="muted-icon"/></div><button className="book-row" onClick={() => {setActiveBook("Psalms");setActiveChapter(23);nav("Read");}}><span className="book-thumb psalms">Ps</span><span><strong>Psalms</strong><small>A song for every season</small></span><ArrowRight size={16}/></button><button className="book-row" onClick={() => {setActiveBook("John");setActiveChapter(1);nav("Read");}}><span className="book-thumb john">Jn</span><span><strong>John</strong><small>Meet Jesus, the Word made flesh</small></span><ArrowRight size={16}/></button><button className="book-row" onClick={() => {setActiveBook("Proverbs");setActiveChapter(3);nav("Read");}}><span className="book-thumb prov">Pr</span><span><strong>Proverbs</strong><small>Wisdom for everyday life</small></span><ArrowRight size={16}/></button></section>
            </div>
          </>}

          {tab === "Read" && <section className="page-section"><div className="page-intro"><span className="section-kicker">SCRIPTURE, AT YOUR PACE</span><h1>Open the <em>Word.</em></h1><p>Take your time. Read slowly. Let each passage find its place.</p></div><BibleReader /></section>}

          {tab === "Plans" && <section className="page-section"><div className="page-intro"><span className="section-kicker">SMALL STEPS, DEEP ROOTS</span><h1>Find your <em>rhythm.</em></h1><p>Thoughtful reading journeys for every season of your faith.</p></div><div className="plan-feature"><div><span className="section-kicker">A GENTLE PLACE TO BEGIN</span><h2>Start with stillness.</h2><p>Five days of Scripture and reflection to help you slow down, listen, and rest in God&apos;s presence.</p><button className="solid-button" onClick={()=>void togglePlan("A Quiet Heart")}>{startedPlans.includes("A Quiet Heart") ? <><Check size={16}/> Added to your plans</> : <>Begin this plan <ArrowRight size={16}/></>}</button></div><div className="plan-art"><span>✳</span><div className="plan-orbit orbit-one"/><div className="plan-orbit orbit-two"/></div></div><div className="section-heading"><div><span className="section-kicker">MADE FOR YOUR WALK</span><h2>Reading journeys</h2></div><span className="results-count">{plans.length} starter plans</span></div><div className="plans-list">{plans.map((p,i)=>{const totalDays=Number(p.detail.match(/\\d+/)?.[0]||1);const done=planProgress[p.title]||[];return <article className="plan-row" key={p.title} style={{display:"block"}}><div style={{display:"flex",alignItems:"center",gap:14}}><div className={"plan-symbol "+p.color}>{p.icon}</div><div className="plan-info" style={{flex:1}}><span>0{i+1} · {p.detail.split(" · ")[0].toUpperCase()}</span><h3>{p.title}</h3><p>{p.detail.split(" · ")[1]}</p></div><button className={startedPlans.includes(p.title)?"plan-started":"plan-action"} onClick={()=>void togglePlan(p.title)}>{startedPlans.includes(p.title)?<Check size={17}/>:<Plus size={18}/>}</button></div>{startedPlans.includes(p.title)&&<div style={{marginTop:14}}><div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:"var(--subtext)",marginBottom:8}}><span>YOUR PLAN PROGRESS</span><strong>{done.length}/{totalDays} days</strong></div><div style={{height:6,borderRadius:8,background:"var(--border)",overflow:"hidden"}}><div style={{height:"100%",width:(done.length/totalDays*100)+"%",background:"#5d8064",borderRadius:8}}/></div><div style={{display:"flex",flexWrap:"wrap",gap:7,marginTop:10}}>{Array.from({length:totalDays},(_,day)=><button key={day+1} type="button" aria-label={"Mark day "+(day+1)} onClick={()=>void togglePlanDay(p.title,day+1)} style={{width:32,height:32,borderRadius:9,border:"1px solid var(--border)",background:done.includes(day+1)?"#dcebdc":"transparent",color:done.includes(day+1)?"#245238":"var(--text)",fontSize:11,fontWeight:700}}>{done.includes(day+1)?"✓":day+1}</button>)}</div>{done.length===totalDays&&<p style={{fontSize:11,color:"#477451",fontWeight:700,marginTop:10}}>Plan completed. Beautiful work!</p>}</div>}</article>})}</div><p className="reader-disclaimer">Your day-by-day check-ins now sync to your account. Guided daily Scripture passages and reflections will expand as OrPath’s reading library grows.</p></section>}

          {tab === "Prayer" && <section className="page-section"><div className="page-intro"><span className="section-kicker">A QUIET PLACE FOR THE HEART</span><h1>Come as you <em>are.</em></h1><p>There is room here for gratitude, questions, hope, and honest prayer.</p></div><div className="prayer-writing"><div className="prayer-heading"><Heart size={20}/><div><strong>Your prayer journal</strong><span>Private to your OrPath account</span></div></div><textarea value={prayer} onChange={e=>setPrayer(e.target.value)} placeholder="God, today I want to bring..." rows={5}/><div className="prayer-footer"><span>{prayer.length} characters</span><button className="solid-button" onClick={()=>void savePrayerEntry(false)}><NotebookPen size={16}/> Save prayer</button></div></div><div className="section-heading"><div><span className="section-kicker">YOUR REFLECTIONS</span><h2>Held in prayer</h2></div><span className="results-count">{prayers.length} entries</span></div>{prayers.length===0?<div className="empty-state"><span><Heart size={22}/></span><strong>Your journal begins here.</strong><p>Your private prayers will appear here after you save your first entry.</p></div>:<div className="saved-list">{prayers.map((p,i)=><article key={i} className="saved-row"><span className="saved-mark"><Heart size={17}/></span><div><p>{p}</p><small>Just now · Personal prayer</small></div><button className="icon-button" aria-label="Delete prayer" onClick={()=>setPrayers(prev=>prev.filter((_,idx)=>idx!==i))}><X size={16}/></button></article>)}</div>}</section>}

          {tab === "Saved" && <section className="page-section"><div className="page-intro"><span className="section-kicker">WORDS TO RETURN TO</span><h1>Your <em>library.</em></h1><p>Keep meaningful passages close, ready for another quiet moment.</p></div><div className="section-heading"><div><span className="section-kicker">PERSONAL COLLECTION</span><h2>Saved verses</h2></div><span className="results-count">{saved.length} saved</span></div>{saved.length===0?<div className="empty-state"><span><Bookmark size={22}/></span><strong>Save a verse that speaks to you.</strong><p>Use the bookmark icon on a verse to keep it here.</p><button className="outline-button" onClick={()=>nav("Read")}>Open Bible reader <ArrowRight size={15}/></button></div>:<div className="saved-list">{saved.map(ref=><article className="saved-row" key={ref}><span className="saved-mark"><Bookmark size={17}/></span><div><strong>{ref}</strong><p>{verses.find(v=>v.ref===ref)?.text || "A verse you&apos;ve saved for later reflection."}</p><small>Saved to your library</small></div><button className="icon-button" aria-label={"Remove "+ref} onClick={()=>toggleSaved(ref)}><X size={16}/></button></article>)}</div>}<div className="library-note"><CircleHelp size={17}/><p>Your saved verses sync privately to your OrPath account.</p></div></section>}
          <footer className="footer"><span>© 2026 OrPath</span><span><span className="footer-dot"/> Made for the journey.</span><a className="text-link" href="/about">About the founder <ArrowRight size={13}/></a></footer>
        </div>
      </section>

      {showSearch && <div className="modal-backdrop" onClick={()=>setShowSearch(false)}><section className="search-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">FIND YOUR PASSAGE</span><h2>Search the Word</h2></div><button className="icon-button" onClick={()=>setShowSearch(false)}><X size={18}/></button></div><div className="search-input-wrap"><Search size={18}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try “trust”, “light”, or “Psalm 119”"/><kbd>ESC</kbd></div><div className="search-results">{search ? filteredVerses.map(v=><button className="search-result" key={v.ref} onClick={()=>{setVerseIndex(verses.findIndex(x=>x.ref===v.ref));setShowSearch(false);setSearch("");nav("Home");}}><span>{v.theme}</span><strong>{v.ref}</strong><p>{v.text}</p><ArrowRight size={16}/></button>) : <div className="search-hint"><Sparkles size={19}/><p>Search a word, topic, or Bible reference to explore the sample verses.</p><div>{["trust","light","peace","courage"].map(t=><button key={t} onClick={()=>setSearch(t)}>{t}</button>)}</div></div>}{search && filteredVerses.length===0 && <div className="search-hint"><p>No sample verses matched. A full Bible search will be available when the complete text library is connected.</p></div>}</div></section></div>}

      {showPrayer && <div className="modal-backdrop" onClick={()=>setShowPrayer(false)}><section className="prayer-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">MAKE ROOM FOR STILLNESS</span><h2>A moment of prayer</h2></div><button className="icon-button" onClick={()=>setShowPrayer(false)}><X size={18}/></button></div><p className="modal-quote">“Be still, and know that I am God.” <span>— Psalm 46:10</span></p><textarea value={prayer} onChange={e=>setPrayer(e.target.value)} placeholder="What is on your heart today?" rows={5}/><button className="solid-button full-button" onClick={()=>void savePrayerEntry(true)}><Heart size={16}/> Keep this prayer</button><p className="modal-footnote">Your prayer is saved privately to your OrPath account.</p></section></div>}
      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </main>
  );
}
