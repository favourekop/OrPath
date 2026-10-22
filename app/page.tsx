"use client";

import { useMemo, useState } from "react";
import {
  ArrowDown, ArrowLeft, ArrowRight, AudioLines, BookMarked, BookOpen,
  Bookmark, Check, ChevronDown, CircleHelp, Compass, Copy, Flame, Headphones,
  Heart, History, Home, Languages, ListChecks, Menu, Moon, MoreHorizontal,
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
  const [saved, setSaved] = useState<string[]>(["Psalm 23:1"]);
  const [selectedVerse, setSelectedVerse] = useState<number | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showPrayer, setShowPrayer] = useState(false);
  const [prayer, setPrayer] = useState("");
  const [prayers, setPrayers] = useState<string[]>([]);
  const [startedPlans, setStartedPlans] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [activeBook, setActiveBook] = useState("Genesis");
  const [activeChapter, setActiveChapter] = useState(1);

  const currentVerse = verses[verseIndex];
  const filteredVerses = useMemo(() => verses.filter(v => (v.ref + " " + v.text).toLowerCase().includes(search.toLowerCase())), [search]);

  function notify(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  }
  function toggleSaved(ref: string) {
    setSaved(prev => prev.includes(ref) ? prev.filter(x => x !== ref) : [...prev, ref]);
    notify(saved.includes(ref) ? "Removed from your saved verses" : "Verse saved to your library");
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
          <div className="streak-card"><div className="streak-icon"><Flame size={19}/></div><div><strong>Start a rhythm</strong><p>A little time in the Word, every day.</p></div><ArrowRight size={16}/></div>
          <button className="profile-button" onClick={() => notify("Personal accounts are coming in a future release.")}><div className="avatar">O</div><div><strong>Your journey</strong><span>Guest reader</span></div><MoreHorizontal size={19}/></button>
        </div>
      </aside>

      <section className="main-shell">
        <header className="topbar">
          <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={20}/> : <Menu size={20}/>}</button>
          <div className="breadcrumbs"><span>OrPath</span><span className="crumb-slash">/</span><strong>{tab === "Home" ? "Your daily walk" : tab === "Read" ? "Bible reader" : tab === "Plans" ? "Reading plans" : tab === "Prayer" ? "Prayer journal" : "Saved verses"}</strong></div>
          <div className="top-actions">
            <button className="icon-button" aria-label="Search Scripture" onClick={() => setShowSearch(true)}><Search size={18}/></button>
            <button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={18}/> : <Moon size={18}/>}</button>
            <button className="top-avatar" onClick={() => notify("Your personal account is coming soon.")}>O</button>
          </div>
        </header>

        <div className="content">
          {tab === "Home" && <>
            <div className="welcome-row"><div><div className="eyebrow"><span className="eyebrow-dot"/> YOUR MOMENT WITH GOD</div><h1>A little closer,<br/><em>every day.</em></h1><p className="welcome-copy">Make room for the Word. Find a quiet moment, breathe, and let truth meet you where you are.</p></div><div className="date-chip"><Sun size={15}/> YOUR DAILY PAUSE</div></div>
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

          {tab === "Read" && <section className="page-section"><div className="page-intro"><span className="section-kicker">SCRIPTURE, AT YOUR PACE</span><h1>Open the <em>Word.</em></h1><p>Take your time. Read slowly. Let each passage find its place.</p></div><div className="reader-toolbar"><label><BookOpen size={16}/><select value={activeBook} onChange={e => setActiveBook(e.target.value)}>{["Genesis","Psalms","Proverbs","Matthew","John","Romans"].map(b=><option key={b}>{b}</option>)}</select><ChevronDown size={15}/></label><label>Chapter <select value={activeChapter} onChange={e => setActiveChapter(Number(e.target.value))}>{Array.from({length:50},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select><ChevronDown size={15}/></label><button className="reader-tool-button" onClick={() => notify("Translation selection will be available when licensed Bible texts are connected.")}><Languages size={16}/> KJV <ChevronDown size={14}/></button><button className="reader-tool-button" onClick={() => notify("Audio narration is on our roadmap.")}><AudioLines size={16}/></button></div><div className="scripture-paper"><div className="scripture-heading"><span>THE HOLY BIBLE</span><h2>{activeBook} <em>{activeChapter}</em></h2><p>King James Version · Sample reading</p></div>{activeBook === "Genesis" && activeChapter === 1 ? chapters.map(v=><p className="scripture-verse" key={v.n} onClick={() => setSelectedVerse(selectedVerse === v.n ? null : v.n)}><sup>{v.n}</sup>{v.text}{selectedVerse === v.n && <span className="inline-verse-actions"><button onClick={e=>{e.stopPropagation();toggleSaved("Genesis 1:"+v.n);}}><Bookmark size={14}/> Save</button><button onClick={e=>{e.stopPropagation();copyVerse(v.text,"Genesis 1:"+v.n);}}><Copy size={14}/> Copy</button></span>}</p>) : <div className="sample-notice"><BookOpen size={22}/><strong>{activeBook} {activeChapter}</strong><p>This reader demo includes a short sample from Genesis 1. Connect a licensed or verified public-domain Bible text source to enable the complete library for every book and chapter.</p></div>}<div className="chapter-nav"><button className="outline-button" onClick={()=>setActiveChapter(Math.max(1,activeChapter-1))}><ArrowLeft size={15}/> Previous</button><button className="solid-button" onClick={()=>setActiveChapter(Math.min(50,activeChapter+1))}>Next chapter <ArrowRight size={15}/></button></div></div><p className="reader-disclaimer">Sample content only. Additional Bible translations require appropriate licensing and source verification.</p></section>}

          {tab === "Plans" && <section className="page-section"><div className="page-intro"><span className="section-kicker">SMALL STEPS, DEEP ROOTS</span><h1>Find your <em>rhythm.</em></h1><p>Thoughtful reading journeys for every season of your faith.</p></div><div className="plan-feature"><div><span className="section-kicker">A GENTLE PLACE TO BEGIN</span><h2>Start with stillness.</h2><p>Five days of Scripture and reflection to help you slow down, listen, and rest in God's presence.</p><button className="solid-button" onClick={()=>{setStartedPlans(p=>p.includes("A Quiet Heart")?p.filter(x=>x!=="A Quiet Heart"):[...p,"A Quiet Heart"]);notify(startedPlans.includes("A Quiet Heart")?"Plan removed":"Your plan is ready to begin");}}>{startedPlans.includes("A Quiet Heart") ? <><Check size={16}/> Added to your plans</> : <>Begin this plan <ArrowRight size={16}/></>}</button></div><div className="plan-art"><span>✳</span><div className="plan-orbit orbit-one"/><div className="plan-orbit orbit-two"/></div></div><div className="section-heading"><div><span className="section-kicker">MADE FOR YOUR WALK</span><h2>Reading journeys</h2></div><span className="results-count">{plans.length} starter plans</span></div><div className="plans-list">{plans.map((p,i)=><article className="plan-row" key={p.title}><div className={"plan-symbol "+p.color}>{p.icon}</div><div className="plan-info"><span>0{i+1} · {p.detail.split(" · ")[0].toUpperCase()}</span><h3>{p.title}</h3><p>{p.detail.split(" · ")[1]}</p></div><button className={startedPlans.includes(p.title)?"plan-started":"plan-action"} onClick={()=>{setStartedPlans(prev=>prev.includes(p.title)?prev.filter(x=>x!==p.title):[...prev,p.title]);notify(startedPlans.includes(p.title)?"Plan removed":"Plan added to your journey");}}>{startedPlans.includes(p.title)?<Check size={17}/>:<Plus size={18}/>}</button></article>)}</div><p className="reader-disclaimer">Starter plan concepts are demonstrations. Full daily readings and progress syncing will be added with the content system.</p></section>}

          {tab === "Prayer" && <section className="page-section"><div className="page-intro"><span className="section-kicker">A QUIET PLACE FOR THE HEART</span><h1>Come as you <em>are.</em></h1><p>There is room here for gratitude, questions, hope, and honest prayer.</p></div><div className="prayer-writing"><div className="prayer-heading"><Heart size={20}/><div><strong>Your prayer journal</strong><span>Private on this device in this demo</span></div></div><textarea value={prayer} onChange={e=>setPrayer(e.target.value)} placeholder="God, today I want to bring..." rows={5}/><div className="prayer-footer"><span>{prayer.length} characters</span><button className="solid-button" onClick={()=>{if(!prayer.trim()){notify("Write a prayer first");return;}setPrayers(prev=>[prayer.trim(),...prev]);setPrayer("");notify("Prayer saved on this page");}}><NotebookPen size={16}/> Save prayer</button></div></div><div className="section-heading"><div><span className="section-kicker">YOUR REFLECTIONS</span><h2>Held in prayer</h2></div><span className="results-count">{prayers.length} entries</span></div>{prayers.length===0?<div className="empty-state"><span><Heart size={22}/></span><strong>Your journal begins here.</strong><p>Your saved prayers will appear here while this page remains open. Sign-in and private cloud storage are future features.</p></div>:<div className="saved-list">{prayers.map((p,i)=><article key={i} className="saved-row"><span className="saved-mark"><Heart size={17}/></span><div><p>{p}</p><small>Just now · Personal prayer</small></div><button className="icon-button" aria-label="Delete prayer" onClick={()=>setPrayers(prev=>prev.filter((_,idx)=>idx!==i))}><X size={16}/></button></article>)}</div>}</section>}

          {tab === "Saved" && <section className="page-section"><div className="page-intro"><span className="section-kicker">WORDS TO RETURN TO</span><h1>Your <em>library.</em></h1><p>Keep meaningful passages close, ready for another quiet moment.</p></div><div className="section-heading"><div><span className="section-kicker">PERSONAL COLLECTION</span><h2>Saved verses</h2></div><span className="results-count">{saved.length} saved</span></div>{saved.length===0?<div className="empty-state"><span><Bookmark size={22}/></span><strong>Save a verse that speaks to you.</strong><p>Use the bookmark icon on a verse to keep it here.</p><button className="outline-button" onClick={()=>nav("Read")}>Open Bible reader <ArrowRight size={15}/></button></div>:<div className="saved-list">{saved.map(ref=><article className="saved-row" key={ref}><span className="saved-mark"><Bookmark size={17}/></span><div><strong>{ref}</strong><p>{verses.find(v=>v.ref===ref)?.text || "A verse you've saved for later reflection."}</p><small>Saved to your library</small></div><button className="icon-button" aria-label={"Remove "+ref} onClick={()=>toggleSaved(ref)}><X size={16}/></button></article>)}</div>}<div className="library-note"><CircleHelp size={17}/><p>This first version keeps saved items in page memory. Accounts and synced personal libraries will be added with the backend.</p></div></section>}
          <footer className="footer"><span>© 2026 OrPath</span><span><span className="footer-dot"/> Made for the journey.</span><button onClick={()=>notify("OrPath is being built with care. More features are on the way.")}>About OrPath <ArrowRight size={13}/></button></footer>
        </div>
      </section>

      {showSearch && <div className="modal-backdrop" onClick={()=>setShowSearch(false)}><section className="search-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">FIND YOUR PASSAGE</span><h2>Search the Word</h2></div><button className="icon-button" onClick={()=>setShowSearch(false)}><X size={18}/></button></div><div className="search-input-wrap"><Search size={18}/><input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try “trust”, “light”, or “Psalm 119”"/><kbd>ESC</kbd></div><div className="search-results">{search ? filteredVerses.map(v=><button className="search-result" key={v.ref} onClick={()=>{setVerseIndex(verses.findIndex(x=>x.ref===v.ref));setShowSearch(false);setSearch("");nav("Home");}}><span>{v.theme}</span><strong>{v.ref}</strong><p>{v.text}</p><ArrowRight size={16}/></button>) : <div className="search-hint"><Sparkles size={19}/><p>Search a word, topic, or Bible reference to explore the sample verses.</p><div>{["trust","light","peace","courage"].map(t=><button key={t} onClick={()=>setSearch(t)}>{t}</button>)}</div></div>}{search && filteredVerses.length===0 && <div className="search-hint"><p>No sample verses matched. A full Bible search will be available when the complete text library is connected.</p></div>}</div></section></div>}

      {showPrayer && <div className="modal-backdrop" onClick={()=>setShowPrayer(false)}><section className="prayer-modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="section-kicker">MAKE ROOM FOR STILLNESS</span><h2>A moment of prayer</h2></div><button className="icon-button" onClick={()=>setShowPrayer(false)}><X size={18}/></button></div><p className="modal-quote">“Be still, and know that I am God.” <span>— Psalm 46:10</span></p><textarea value={prayer} onChange={e=>setPrayer(e.target.value)} placeholder="What is on your heart today?" rows={5}/><button className="solid-button full-button" onClick={()=>{if(!prayer.trim()){notify("Write a prayer first");return;}setPrayers(prev=>[prayer.trim(),...prev]);setPrayer("");setShowPrayer(false);nav("Prayer");notify("Prayer saved on this page");}}><Heart size={16}/> Keep this prayer</button><p className="modal-footnote">In this demo, prayers remain in page memory and are not uploaded.</p></section></div>}
      {notice && <div className="toast"><Check size={16}/>{notice}</div>}
    </main>
  );
}
