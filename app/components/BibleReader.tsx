"use client";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Flame, LoaderCircle, Search, Share2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
type BibleItem = { id:string; name?:string; abbreviation?:string; abbreviationLocal?:string; number?:number; copyright?:string };
function matchesTranslation(item:BibleItem,code:string){return [item.abbreviation,item.abbreviationLocal].some(value=>value?.toUpperCase()===code);}
type ChapterContent = { content?: string; copyright?: string };
type ParsedVerse = { number: string; text: string };
function parseVerses(html: string): ParsedVerse[] {
 const doc = new DOMParser().parseFromString(html, "text/html");
 const paragraphs = Array.from(doc.querySelectorAll("p"));
 const blocks = paragraphs.length ? paragraphs : [doc.body];
 const verses: ParsedVerse[] = [];
 for (const block of blocks) {
  let number = ""; let text = "";
  const flush = () => { if (number && text.trim()) verses.push({ number, text: text.replace(/\s+/g, " ").trim() }); };
  for (const node of Array.from(block.childNodes)) {
   if (node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains("v")) { flush(); number = (node as HTMLElement).dataset.number || node.textContent?.trim() || ""; text = ""; }
   else { text += node.textContent || ""; }
  }
  flush();
 }
 return verses;
}
type SearchResult = { id?: string; reference?: string; text?: string; content?: string };
async function api<T>(params:Record<string,string>):Promise<T>{const response=await fetch("/api/bible?"+new URLSearchParams(params));const body=await response.json();if(!response.ok)throw new Error(body.message||"Bible request failed.");return body.data as T;}
function textOnly(value:unknown){return typeof value==="string"?value.replace(/<\/(p|div|h[1-6]|li)>/gi,"\n").replace(/<br\s*\/?\s*>/gi,"\n").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim():"";}
export default function BibleReader(){
 const [bibles,setBibles]=useState<BibleItem[]>([]),[bibleId,setBibleId]=useState(""),[books,setBooks]=useState<BibleItem[]>([]),[bookId,setBookId]=useState("GEN"),[chapters,setChapters]=useState<BibleItem[]>([]),[chapterId,setChapterId]=useState("GEN.1"),[content,setContent]=useState(""),[verses,setVerses]=useState<ParsedVerse[]>([]),[copyright,setCopyright]=useState(""),[query,setQuery]=useState(""),[results,setResults]=useState<SearchResult[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[marking,setMarking]=useState(false),[completed,setCompleted]=useState(false),[completionMessage,setCompletionMessage]=useState(""),[shareNotice,setShareNotice]=useState("");
 useEffect(()=>{let live=true;api<BibleItem[]>({resource:"bibles",language:"eng"}).then(items=>{if(!live)return;setBibles(items||[]);const preferredOrder=["KJV","NIV","NLT"];const preferred=preferredOrder.map(code=>items?.find(x=>matchesTranslation(x,code))).find(Boolean)||items?.[0];if(preferred)setBibleId(preferred.id);}).catch(e=>live&&setError(e.message));return()=>{live=false}},[]);
 useEffect(()=>{if(!bibleId)return;let live=true;setBusy(true);setError("");api<BibleItem[]>({resource:"books",bibleId}).then(items=>{if(!live)return;setBooks(items||[]);const first=items?.find(x=>x.id==="GEN")||items?.[0];if(first){setBookId(first.id);setChapterId(first.id+".1")}}).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false}},[bibleId]);
 useEffect(()=>{if(!bibleId||!bookId)return;let live=true;api<BibleItem[]>({resource:"chapters",bibleId,bookId}).then(items=>{if(!live)return;setChapters(items||[]);if(items?.length)setChapterId(items[0].id)}).catch(e=>live&&setError(e.message));return()=>{live=false}},[bibleId,bookId]);
 useEffect(()=>{if(!bibleId||!chapterId)return;let live=true;setBusy(true);setError("");api<ChapterContent>({resource:"chapter",bibleId,chapterId}).then(item=>{if(!live)return;setContent(textOnly(item?.content));setVerses(parseVerses(item?.content||""));setCopyright(item?.copyright||"")}).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false}},[bibleId,chapterId]);
 const bible=useMemo(()=>bibles.find(x=>x.id===bibleId),[bibles,bibleId]),book=useMemo(()=>books.find(x=>x.id===bookId),[books,bookId]),index=chapters.findIndex(x=>x.id===chapterId);
 const mainTranslations=["KJV","NIV","NLT"].map(code=>bibles.find(x=>matchesTranslation(x,code))).filter((x):x is BibleItem=>Boolean(x));
 const mainTranslationIds=new Set(mainTranslations.map(x=>x.id));
 async function passageAction(text:string,reference:string,mode:"copy"|"share"){
  const payload='"'+text+'" — '+reference+"\\n\\nRead and explore more Scripture on OrPath: https://or-path.vercel.app";
  try{
   if(mode==="share"&&navigator.share){await navigator.share({title:reference+" | OrPath",text:payload,url:"https://or-path.vercel.app"});setShareNotice("Shared with the OrPath link.");}
   else{await navigator.clipboard.writeText(payload);setShareNotice("Copied with the OrPath link.");}
  }catch(cause){if(cause instanceof Error&&cause.name!=="AbortError")setShareNotice("Could not share this passage in this browser.");}
 }
 const otherTranslations=bibles.filter(x=>!mainTranslationIds.has(x.id));
 async function markChapterComplete(){
  setMarking(true);setCompletionMessage("");
  try{const supabase=createClient();const {data:{user},error:authError}=await supabase.auth.getUser();if(authError)throw authError;if(!user){setCompletionMessage("Sign in to save your reading progress and build your streak.");return;}
   const {error:saveError}=await supabase.from("reading_progress").upsert({user_id:user.id,bible_id:bibleId,book_id:bookId,chapter_id:chapterId,completed_at:new Date().toISOString()},{onConflict:"user_id,bible_id,chapter_id"});if(saveError)throw saveError;setCompleted(true);setCompletionMessage("Chapter completed. Your reading streak has been updated.");
  }catch(cause){setCompletionMessage(cause instanceof Error?cause.message:"Could not save reading progress.");}finally{setMarking(false)}
 }
 useEffect(()=>{setCompleted(false);setCompletionMessage("")},[bibleId,bookId,chapterId]);
 async function search(e:React.FormEvent){e.preventDefault();if(!query.trim()||!bibleId)return;setBusy(true);setError("");setResults([]);try{const data=await api<{verses?:SearchResult[];results?:SearchResult[];passages?:SearchResult[]}>({resource:"search",bibleId,query:query.trim(),limit:"20"});const rows=data?.verses||data?.results||data?.passages||[];setResults(Array.isArray(rows)?rows:[]);if(!rows?.length)setError("No results found.")}catch(err){setError(err instanceof Error?err.message:"Search failed.")}finally{setBusy(false)}}
 return <div className="orpath-live-reader">
 <div className="reader-toolbar"><label><BookOpen size={16}/><select aria-label="Bible translation" value={bibleId} onChange={e=>setBibleId(e.target.value)}>{mainTranslations.length>0&&<optgroup label="OrPath main translations">{mainTranslations.map(x=><option key={x.id} value={x.id}>{x.abbreviation||x.name} — {x.name}</option>)}</optgroup>}{otherTranslations.length>0&&<optgroup label="Other available translations">{otherTranslations.map(x=><option key={x.id} value={x.id}>{x.abbreviation||x.name} — {x.name}</option>)}</optgroup>}</select></label><label>Book <select aria-label="Book" value={bookId} onChange={e=>setBookId(e.target.value)}>{books.map(x=><option key={x.id} value={x.id}>{x.name||x.id}</option>)}</select></label><label>Chapter <select aria-label="Chapter" value={chapterId} onChange={e=>setChapterId(e.target.value)}>{chapters.map(x=><option key={x.id} value={x.id}>{x.number||x.id.split(".").pop()}</option>)}</select></label></div>
 <form className="reader-toolbar" onSubmit={search}><label style={{flex:1}}><Search size={16}/><input aria-label="Search Scripture" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search a word or passage reference"/></label><button className="solid-button" type="submit" disabled={busy||!query.trim()}>Search</button></form>
 {error&&<div className="library-note" role="status"><p>{error}{error.includes("not configured")?" Add API_BIBLE_KEY to Vercel Environment Variables, then redeploy.":""}</p></div>}
 {results.length>0&&<div className="saved-list">{results.map((x,i)=><article className="saved-row" key={x.id||i}><div><strong>{x.reference||x.id||"Search result"}</strong><p>{textOnly(x.text||x.content)}</p><div className="passage-share-actions"><button type="button" onClick={()=>passageAction(textOnly(x.text||x.content),x.reference||x.id||"Bible passage","copy")}><Copy size={13}/> Copy with OrPath link</button><button type="button" onClick={()=>passageAction(textOnly(x.text||x.content),x.reference||x.id||"Bible passage","share")}><Share2 size={13}/> Share</button></div></div></article>)}</div>}
 <div className="scripture-paper"><div className="scripture-heading"><span>THE HOLY BIBLE</span><h2>{book?.name||bookId} <em>{chapterId.split(".").pop()}</em></h2><p>{bible?.name||"Loading translation"} · Live API content</p></div>
 {busy&&!content?<div className="sample-notice"><LoaderCircle size={22}/><strong>Opening Scripture…</strong><p>Fetching this chapter from API.Bible.</p></div>:content?<div>{verses.length>0?verses.map((verse,i)=><p className="scripture-verse" key={`${verse.number}-${i}`}><sup className="verse-number" aria-label={`Verse ${verse.number}`}>{verse.number}</sup><span className="verse-text">{verse.text}</span></p>):content.split("\n").filter(Boolean).map((line,i)=><p className="scripture-verse" key={i}>{line}</p>)}</div>:!error?<div className="sample-notice"><BookOpen size={22}/><strong>Choose a Bible to begin</strong><p>Available translations will appear here.</p></div>:null}
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginTop:22}}><button className="solid-button" type="button" onClick={markChapterComplete} disabled={marking||!content}>{marking?<LoaderCircle size={15}/>:completed?<Check size={15}/>:<Flame size={15}/>} {completed?"Chapter completed":"Mark chapter complete"}</button>{completionMessage&&<span role="status" style={{fontSize:11,color:"#5d8064"}}>{completionMessage}</span>}</div><div className="chapter-nav"><button className="outline-button" disabled={index<=0} onClick={()=>setChapterId(chapters[index-1]?.id||chapterId)}><ArrowLeft size={15}/> Previous</button><button className="solid-button" disabled={index<0||index>=chapters.length-1} onClick={()=>setChapterId(chapters[index+1]?.id||chapterId)}>Next chapter <ArrowRight size={15}/></button></div></div>
 {shareNotice&&<p className="reader-disclaimer" role="status">{shareNotice}</p>}<p className="reader-disclaimer">{copyright?("Copyright: "+copyright+" · "):""}Bible availability and usage depend on API.Bible licensing permissions.</p></div>;
}
