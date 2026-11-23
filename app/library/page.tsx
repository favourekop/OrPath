"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookMarked, BookOpen, Bookmark, Check, ChevronDown, Clock3, Highlighter, LoaderCircle, NotebookPen, Search, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SavedVerse = {
  id: string;
  bible_id: string;
  verse_id: string;
  reference: string;
  verse_text: string | null;
  note: string | null;
  created_at: string;
};
type Annotation = {
  id: string;
  bible_id: string;
  verse_id: string;
  reference: string;
  verse_text: string;
  highlight_color: "yellow" | "green" | "blue" | "pink" | null;
  note: string | null;
  updated_at: string;
};
type LibraryItem = {
  key: string;
  bible_id: string;
  verse_id: string;
  reference: string;
  verse_text: string;
  bookmarked: boolean;
  bookmarkId?: string;
  highlight_color: Annotation["highlight_color"];
  note: string | null;
  annotationId?: string;
  updated_at: string;
};
type Filter = "all" | "bookmarks" | "highlights" | "notes";

const colour: Record<string, { background: string; label: string }> = {
  yellow: { background: "#fff3c4", label: "Yellow" },
  green: { background: "#dceede", label: "Green" },
  blue: { background: "#dceafa", label: "Blue" },
  pink: { background: "#f7e0e9", label: "Pink" },
};

export default function ScriptureLibraryPage() {
  const router = useRouter();
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"recent" | "reference">("recent");
  const [busy, setBusy] = useState(true);
  const [working, setWorking] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const loadLibrary = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const supabase = createClient();
      // Check the browser session first so a signed-out visitor is sent to
      // sign-in instead of seeing Supabase's raw "Auth session missing" error.
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) {
        router.replace("/auth?next=%2Flibrary");
        return;
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) {
        if (authError.name === "AuthSessionMissingError") {
          router.replace("/auth?next=%2Flibrary");
          return;
        }
        throw authError;
      }
      if (!user) {
        router.replace("/auth?next=%2Flibrary");
        return;
      }
      const [{ data: saved, error: savedError }, { data: annotations, error: annotationError }] = await Promise.all([
        supabase.from("saved_verses").select("id,bible_id,verse_id,reference,verse_text,note,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("verse_annotations").select("id,bible_id,verse_id,reference,verse_text,highlight_color,note,updated_at").eq("user_id", user.id).order("updated_at", { ascending: false }),
      ]);
      if (savedError) throw savedError;
      if (annotationError) throw annotationError;

      const merged = new Map<string, LibraryItem>();
      for (const row of (saved || []) as SavedVerse[]) {
        const key = row.bible_id + "::" + row.verse_id;
        merged.set(key, {
          key, bible_id: row.bible_id, verse_id: row.verse_id,
          reference: row.reference, verse_text: row.verse_text || "",
          bookmarked: true, bookmarkId: row.id, highlight_color: null,
          note: row.note, updated_at: row.created_at,
        });
      }
      for (const row of (annotations || []) as Annotation[]) {
        const key = row.bible_id + "::" + row.verse_id;
        const previous = merged.get(key);
        merged.set(key, {
          key, bible_id: row.bible_id, verse_id: row.verse_id,
          reference: row.reference || previous?.reference || "Saved Scripture",
          verse_text: row.verse_text || previous?.verse_text || "",
          bookmarked: previous?.bookmarked || false, bookmarkId: previous?.bookmarkId,
          highlight_color: row.highlight_color, note: row.note || previous?.note || null,
          annotationId: row.id,
          updated_at: row.updated_at || previous?.updated_at || new Date().toISOString(),
        });
      }
      setItems(Array.from(merged.values()));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your Scripture library could not be loaded.");
    } finally {
      setBusy(false);
    }
  }, [router]);

  useEffect(() => { void loadLibrary(); }, [loadLibrary]);

  const counts = useMemo(() => ({
    all: items.length,
    bookmarks: items.filter(item => item.bookmarked).length,
    highlights: items.filter(item => Boolean(item.highlight_color)).length,
    notes: items.filter(item => Boolean(item.note?.trim())).length,
  }), [items]);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item => {
      const matchesFilter = filter === "all" ||
        (filter === "bookmarks" && item.bookmarked) ||
        (filter === "highlights" && Boolean(item.highlight_color)) ||
        (filter === "notes" && Boolean(item.note?.trim()));
      const matchesSearch = !term || [item.reference, item.verse_text, item.note || "", item.highlight_color || ""].some(value => value.toLowerCase().includes(term));
      return matchesFilter && matchesSearch;
    }).sort((a, b) => sort === "reference" ? a.reference.localeCompare(b.reference) : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }, [items, filter, search, sort]);

  async function removeBookmark(item: LibraryItem) {
    if (!item.bookmarkId) return;
    setWorking(item.key); setNotice(""); setError("");
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("saved_verses").delete().eq("id", item.bookmarkId);
      if (deleteError) throw deleteError;
      setItems(current => current.map(row => row.key === item.key ? { ...row, bookmarked: false, bookmarkId: undefined } : row).filter(row => row.bookmarked || row.highlight_color || row.note?.trim()));
      setNotice("Bookmark removed from your library.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove this bookmark."); }
    finally { setWorking(null); }
  }

  async function clearAnnotation(item: LibraryItem) {
    if (!item.annotationId) return;
    setWorking(item.key); setNotice(""); setError("");
    try {
      const supabase = createClient();
      const { error: deleteError } = await supabase.from("verse_annotations").delete().eq("id", item.annotationId);
      if (deleteError) throw deleteError;
      setItems(current => current.map(row => row.key === item.key ? { ...row, highlight_color: null, note: null, annotationId: undefined } : row).filter(row => row.bookmarked));
      setNotice("Highlight and personal note removed.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not remove this annotation."); }
    finally { setWorking(null); }
  }

  function copyVerse(item: LibraryItem) {
    void navigator.clipboard.writeText("“" + item.verse_text + "” — " + item.reference + "\n\nOrPath · Let the Word Lead");
    setNotice("Verse copied to your clipboard.");
  }

  const filters: { id: Filter; label: string; icon: typeof BookMarked }[] = [
    { id: "all", label: "All", icon: BookMarked },
    { id: "bookmarks", label: "Bookmarks", icon: Bookmark },
    { id: "highlights", label: "Highlights", icon: Highlighter },
    { id: "notes", label: "Notes", icon: NotebookPen },
  ];

  return (
    <main className="app" style={{ minHeight: "100vh", background: "var(--background, #f7f7f1)" }}>
      <section className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark"><BookOpen size={22}/></span><span className="brand-name"><span className="brand-word">orpath<span>.</span></span><small>LET THE WORD LEAD</small></span></Link>
          <div className="top-actions"><Link className="text-link" href="/dashboard">Dashboard <ArrowLeft size={14}/></Link><Link className="text-link" href="/bible">Open Bible <BookOpen size={14}/></Link></div>
        </header>
        <div className="content" style={{ maxWidth: 1040, margin: "0 auto", paddingTop: 34, paddingBottom: 60 }}>
          <Link href="/dashboard" className="text-link" style={{ marginBottom: 22, display: "inline-flex" }}><ArrowLeft size={14}/> Back to your space</Link>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 18, flexWrap: "wrap" }}>
            <div><span className="section-kicker">YOUR PRIVATE SCRIPTURE SPACE</span><h1 style={{ fontFamily: "Georgia,serif", fontSize: "clamp(34px,6vw,52px)", fontWeight: 400, margin: "9px 0" }}>My <em>Scripture Library.</em></h1><p style={{ color: "var(--subtext)", fontSize: 13, lineHeight: 1.7, maxWidth: 550 }}>A personal collection of verses you have saved, highlighted and written notes about. Your collection stays connected to your OrPath account.</p></div>
            <Link href="/bible" className="primary-action" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 9, borderRadius: 9, padding: "12px 16px", background: "#1c4a37", color: "#fff", fontSize: 12, fontWeight: 700 }}><BookOpen size={16}/> Read Scripture</Link>
          </div>

          <div className="practice-grid" style={{ marginTop: 26, gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))" }}>
            {[{ label: "Collected verses", value: counts.all, icon: BookMarked }, { label: "Bookmarks", value: counts.bookmarks, icon: Bookmark }, { label: "Highlights", value: counts.highlights, icon: Highlighter }, { label: "Personal notes", value: counts.notes, icon: NotebookPen }].map(({ label, value, icon: Icon }) => <section className="practice-card" key={label} style={{ minHeight: 112, cursor: "default" }}><span className="practice-icon"><Icon size={18}/></span><span className="card-overline">{label}</span><strong style={{ fontSize: 29 }}>{value}</strong></section>)}
          </div>

          <section className="continue-panel" style={{ marginTop: 24, padding: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {filters.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setFilter(id)} aria-pressed={filter === id} style={{ display: "inline-flex", alignItems: "center", gap: 7, border: filter === id ? "1px solid #315d43" : "1px solid var(--border)", borderRadius: 24, padding: "9px 13px", background: filter === id ? "#e5eee4" : "transparent", color: "#294a35", fontSize: 11, fontWeight: 700, cursor: "pointer" }}><Icon size={14}/>{label}<span style={{ opacity: .65 }}>{counts[id]}</span></button>)}
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 11, color: "var(--subtext)" }}>Sort <select value={sort} onChange={event => setSort(event.target.value as "recent" | "reference")} style={{ border: "1px solid var(--border)", borderRadius: 8, padding: "8px 10px", background: "transparent", color: "inherit", fontSize: 11 }}><option value="recent">Recently updated</option><option value="reference">Reference A–Z</option></select></label>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, border: "1px solid var(--border)", borderRadius: 10, padding: "11px 13px", background: "rgba(255,255,255,.55)" }}><Search size={17} color="#718076"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search references, verse text, notes or colours…" aria-label="Search your Scripture library" style={{ border: 0, outline: 0, background: "transparent", width: "100%", fontSize: 12, color: "var(--text)" }}/></label>
          </section>

          {notice && <p role="status" style={{ color: "#2c654b", fontSize: 12, margin: "14px 2px" }}><Check size={14} style={{ verticalAlign: "middle", marginRight: 6 }}/>{notice}</p>}
          {error && <p role="alert" style={{ color: "#a33d35", fontSize: 12, margin: "14px 2px" }}>{error}</p>}

          {busy ? <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: 54, color: "var(--subtext)", fontSize: 12 }}><LoaderCircle size={18} className="animate-spin"/> Gathering your Scripture collection…</div> :
            visibleItems.length ? <div style={{ display: "grid", gap: 13, marginTop: 18 }}>
              {visibleItems.map(item => <article key={item.key} className="continue-panel" style={{ padding: "18px 20px", borderLeft: item.highlight_color ? "4px solid " + (colour[item.highlight_color]?.background || "#dceede") : undefined }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><strong style={{ fontSize: 14 }}>{item.reference}</strong>{item.bookmarked && <span title="Bookmarked" style={{ display: "inline-flex", color: "#456d4f" }}><Bookmark size={14} fill="currentColor"/></span>}{item.highlight_color && <span style={{ borderRadius: 20, padding: "4px 9px", background: colour[item.highlight_color].background, color: "#344b39", fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".07em" }}>{colour[item.highlight_color].label} highlight</span>}</div>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "var(--subtext)", fontSize: 10 }}><Clock3 size={12}/>{new Date(item.updated_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
                <p style={{ fontFamily: "Georgia,serif", fontSize: 17, lineHeight: 1.85, color: "var(--text)", margin: "12px 0 0" }}>{item.verse_text || "Verse text unavailable"}</p>
                {item.note && <div style={{ marginTop: 12, padding: "11px 13px", borderRadius: 9, background: "rgba(232,239,230,.55)" }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#456d4f", fontSize: 9, fontWeight: 800, letterSpacing: ".1em", textTransform: "uppercase" }}><NotebookPen size={12}/> Your note</span><p style={{ fontSize: 12, lineHeight: 1.75, color: "var(--subtext)", margin: "6px 0 0", whiteSpace: "pre-wrap" }}>{item.note}</p></div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 15 }}>
                  <button type="button" onClick={() => copyVerse(item)} style={actionButton}>Copy verse</button>
                  <Link href="/bible" style={{ ...actionButton, textDecoration: "none" }}>Open Bible</Link>
                  {item.bookmarked && <button type="button" disabled={working === item.key} onClick={() => void removeBookmark(item)} style={{ ...actionButton, color: "#8d453e" }}>{working === item.key ? <LoaderCircle size={13}/> : <Trash2 size={13}/>} Remove bookmark</button>}
                  {item.annotationId && <button type="button" disabled={working === item.key} onClick={() => void clearAnnotation(item)} style={{ ...actionButton, color: "#8d453e" }}>{working === item.key ? <LoaderCircle size={13}/> : <Trash2 size={13}/>} Clear note &amp; highlight</button>}
                </div>
              </article>)}
            </div> : <section className="continue-panel" style={{ textAlign: "center", padding: "48px 20px", marginTop: 18 }}>
              <span style={{ width: 54, height: 54, borderRadius: "50%", display: "inline-grid", placeItems: "center", background: "#e8efe6", color: "#315d43" }}><BookMarked size={24}/></span>
              <h2 style={{ fontFamily: "Georgia,serif", fontSize: 24, fontWeight: 400, margin: "15px 0 7px" }}>{search ? "No matching verses." : filter === "all" ? "Your library starts here." : "Nothing here just yet."}</h2>
              <p style={{ maxWidth: 430, margin: "0 auto", color: "var(--subtext)", fontSize: 12, lineHeight: 1.8 }}>{search ? "Try another word, Scripture reference or highlight colour." : "When you bookmark a verse, add a highlight or write a personal note in the Bible reader, it will be collected here."}</p>
              <Link href="/bible" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 18, padding: "11px 15px", background: "#1c4a37", color: "white", borderRadius: 9, fontSize: 11, fontWeight: 700, textDecoration: "none" }}>Explore the Bible <BookOpen size={14}/></Link>
            </section>}
          <footer className="footer" style={{ marginTop: 34 }}><span>© 2026 OrPath</span><span>Every day, a step closer to the Word.</span><Link className="text-link" href="/about">About the founder</Link></footer>
        </div>
      </section>
    </main>
  );
}

const actionButton: React.CSSProperties = { display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, border: "1px solid var(--border)", borderRadius: 8, padding: "8px 11px", background: "transparent", color: "#365b43", fontSize: 10, fontWeight: 700, cursor: "pointer" };
