"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Check, Copy, Download, Flame, LoaderCircle, Search, Share2 } from "lucide-react";
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
  const flush = () => { if (number && text.trim()) verses.push({ number, text: text.replace(/(?:\\n|\/n)/g, " ").replace(/\s+/g, " ").trim() }); };
  for (const node of Array.from(block.childNodes)) {
   if (node.nodeType === Node.ELEMENT_NODE && (node as Element).classList.contains("v")) { flush(); number = (node as HTMLElement).dataset.number || node.textContent?.trim() || ""; text = ""; }
   else { text += node.textContent || ""; }
  }
  flush();
 }
 return verses;
}
type SearchResult = { id?: string; reference?: string; text?: string; content?: string };
async function api<T>(params:Record<string,string>,requireOfflineSave=false):Promise<T>{const response=await fetch("/api/bible?"+new URLSearchParams(params));if(response.ok&&typeof window!=="undefined"&&"caches" in window){try{const cache=await caches.open("orpath-bible-v1");await cache.put(response.url,response.clone());}catch{if(requireOfflineSave)throw new Error("Your device could not save this Scripture item. Check available storage and try again.");}}const body=await response.json();if(!response.ok){const error=new Error(body.message||"Bible request failed.") as Error&{status?:number};error.status=response.status;throw error;}return body.data as T;}
function textOnly(value:unknown){return typeof value==="string"?value.replace(/<\/(p|div|h[1-6]|li)>/gi," ").replace(/<br\s*\/?\s*>/gi," ").replace(/(?:\\n|\/n)/g," ").replace(/<[^>]*>/g," ").replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g," ").trim():"";}
export default function BibleReader({initialBook="Genesis",initialChapter=1}:{initialBook?:string;initialChapter?:number}){
 const initialSelectionApplied=useRef(false);
 const [bibles,setBibles]=useState<BibleItem[]>([]),[bibleId,setBibleId]=useState(""),[books,setBooks]=useState<BibleItem[]>([]),[bookId,setBookId]=useState(""),[chapters,setChapters]=useState<BibleItem[]>([]),[chapterId,setChapterId]=useState(""),[content,setContent]=useState(""),[verses,setVerses]=useState<ParsedVerse[]>([]),[copyright,setCopyright]=useState(""),[query,setQuery]=useState(""),[results,setResults]=useState<SearchResult[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(""),[marking,setMarking]=useState(false),[completed,setCompleted]=useState(false),[completionMessage,setCompletionMessage]=useState(""),[shareNotice,setShareNotice]=useState(""),[downloadStatus,setDownloadStatus]=useState<{done:number;total:number;message:string;failed:number}|null>(null);
 useEffect(()=>{let live=true;api<BibleItem[]>({resource:"bibles",language:"eng"}).then(items=>{if(!live)return;setBibles(items||[]);const preferredOrder=["KJV","NIV","NLT"];const preferred=preferredOrder.map(code=>items?.find(x=>matchesTranslation(x,code))).find(Boolean)||items?.[0];if(preferred)setBibleId(preferred.id);}).catch(e=>live&&setError(e.message));return()=>{live=false}},[]);
 useEffect(()=>{if(!bibleId)return;let live=true;setBusy(true);setError("");api<BibleItem[]>({resource:"books",bibleId}).then(items=>{if(!live)return;setBooks(items||[]);const first=items?.find(x=>x.name?.toLowerCase()===initialBook.toLowerCase())||items?.find(x=>x.id==="GEN")||items?.[0];if(first)setBookId(first.id)}).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false}},[bibleId,initialBook]);
 useEffect(()=>{if(!bibleId||!bookId)return;let live=true;api<BibleItem[]>({resource:"chapters",bibleId,bookId}).then(items=>{if(!live)return;setChapters(items||[]);if(items?.length){const selected=!initialSelectionApplied.current?items.find(x=>Number(x.number)===initialChapter||x.id.endsWith("."+initialChapter)):undefined;setChapterId((selected||items[0]).id);initialSelectionApplied.current=true;}}).catch(e=>live&&setError(e.message));return()=>{live=false}},[bibleId,bookId,initialChapter]);
 useEffect(()=>{if(!bibleId||!chapterId)return;let live=true;setBusy(true);setError("");api<ChapterContent>({resource:"chapter",bibleId,chapterId}).then(item=>{if(!live)return;setContent(textOnly(item?.content));setVerses(parseVerses(item?.content||""));setCopyright(item?.copyright||"")}).catch(e=>live&&setError(e.message)).finally(()=>live&&setBusy(false));return()=>{live=false}},[bibleId,chapterId]);
 const bible=useMemo(()=>bibles.find(x=>x.id===bibleId),[bibles,bibleId]),book=useMemo(()=>books.find(x=>x.id===bookId),[books,bookId]),index=chapters.findIndex(x=>x.id===chapterId);
 const mainTranslations=["KJV","NIV","NLT"].map(code=>bibles.find(x=>matchesTranslation(x,code))).filter((x):x is BibleItem=>Boolean(x));
 const mainTranslationIds=new Set(mainTranslations.map(x=>x.id));
 async function passageAction(text:string,reference:string,mode:"copy"|"share"){
  const payload='"'+text+'" — '+reference+"\n\nRead and explore more Scripture on OrPath: https://or-path.vercel.app";
  try{
   if(mode==="share"&&navigator.share){await navigator.share({title:reference+" | OrPath",text:payload,url:"https://or-path.vercel.app"});setShareNotice("Shared with the OrPath link.");}
   else{await navigator.clipboard.writeText(payload);setShareNotice("Copied with the OrPath link.");}
  }catch(cause){if(cause instanceof Error&&cause.name!=="AbortError")setShareNotice("Could not share this passage in this browser.");}
 }
 
const otherTranslations=bibles.filter(x=>!mainTranslationIds.has(x.id));
 async function downloadBibleForOffline(){
  if(!bibleId||(downloadStatus&&(downloadStatus.message==="Preparing your offline Bible…"||downloadStatus.message==="Downloading Scripture…")))return;
  setDownloadStatus({done:0,total:0,message:"Preparing your offline Bible…",failed:0});
  try{
   if(!("caches" in window)||!("serviceWorker" in navigator))throw new Error("Offline storage is not available in this browser.");
   await navigator.serviceWorker.register("/sw.js");
   await navigator.serviceWorker.ready;
   const bibleCache=await caches.open("orpath-bible-v1");
   await navigator.storage?.persist?.();
   const storage=await navigator.storage?.estimate?.();
   if(storage?.quota&&storage.usage!==undefined&&storage.quota-storage.usage<8*1024*1024)throw new Error("Your device is low on available storage. Free up space and try again.");
   const bookRows=await api<BibleItem[]>({resource:"books",bibleId},true);
   const chapterGroups:BibleItem[][]=new Array((bookRows||[]).length);let bookCursor=0;const bookWorker=async()=>{while(bookCursor<(bookRows||[]).length){const index=bookCursor++;const book=bookRows[index];chapterGroups[index]=await api<BibleItem[]>({resource:"chapters",bibleId,bookId:book.id},true);}};await Promise.all(Array.from({length:4},()=>bookWorker()));
   const chapterIds=chapterGroups.flat().filter(chapter=>chapter.id&&/\.\d+$/.test(chapter.id)).map(chapter=>chapter.id);
   if(!chapterIds.length)throw new Error("No downloadable chapters were found for this translation.");
   setDownloadStatus({done:0,total:chapterIds.length,message:"Downloading Scripture…",failed:0});
   let cursor=0;let done=0;const failures:string[]=[];
   const worker=async()=>{
    while(cursor<chapterIds.length){
     const chapterId=chapterIds[cursor++];
     const chapterUrl=new URL("/api/bible?"+new URLSearchParams({resource:"chapter",bibleId,chapterId}),window.location.origin).toString();
     let saved=Boolean(await bibleCache.match(chapterUrl));let lastError:unknown;
     for(let attempt=0;attempt<4&&!saved;attempt++){
      try{await api<ChapterContent>({resource:"chapter",bibleId,chapterId},true);saved=true;}
      catch(error){lastError=error;const status=(error as Error&{status?:number}).status;if(attempt===3||(status&&status!==429&&status<500))break;await new Promise(resolve=>window.setTimeout(resolve,700*(attempt+1)));}
     }
     if(!saved)failures.push(chapterId+": "+(lastError instanceof Error?lastError.message:"Download failed"));
     done++;setDownloadStatus({done,total:chapterIds.length,message:"Downloading Scripture…",failed:failures.length});
    }
   };
   await Promise.all(Array.from({length:3},()=>worker()));
   if(failures.length)throw new Error(failures.length+" chapter(s) could not be saved. Reconnect and try again; chapters already downloaded remain available offline.");
   setDownloadStatus({done:chapterIds.length,total:chapterIds.length,message:"Your full "+(bible?.name||"Bible")+" is saved for offline reading.",failed:0});
  }catch(error){setDownloadStatus(current=>({done:current?.done||0,total:current?.total||0,message:error instanceof Error?error.message:"Offline download could not be completed.",failed:current?.failed||0}));}
 }

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
 <section className="offline-bible-panel" aria-label="Offline Bible download">
  <div><strong>Take the whole Bible offline</strong><p>Save every available book and chapter in the selected translation to this device.</p></div>
  <button className="outline-button" type="button" onClick={downloadBibleForOffline} disabled={!bibleId||Boolean(downloadStatus&&(downloadStatus.message==="Preparing your offline Bible…"||downloadStatus.message==="Downloading Scripture…"))}>
   {downloadStatus&&downloadStatus.message==="Downloading Scripture…"?<LoaderCircle size={15} className="animate-spin"/>:<Download size={15}/>}
   {downloadStatus&&downloadStatus.message==="Downloading Scripture…"? "Downloading…":"Download full Bible"}
  </button>
  {downloadStatus&&<div className="offline-download-status" role="status"><span>{downloadStatus.message}</span>{downloadStatus.total>0&&<><progress max={downloadStatus.total} value={downloadStatus.done}/><small>{downloadStatus.done.toLocaleString()} of {downloadStatus.total.toLocaleString()} chapters saved{downloadStatus.failed? " · "+downloadStatus.failed+" failed":""}</small></>}</div>}
 </section>
 {error&&<div className="library-note" role="status"><p>{error}{error.includes("not configured")?" Add API_BIBLE_KEY to Vercel Environment Variables, then redeploy.":""}</p></div>}
 {results.length>0&&<div className="saved-list">{results.map((x,i)=><article className="saved-row" key={x.id||i}><div><strong>{x.reference||x.id||"Search result"}</strong><p>{textOnly(x.text||x.content)}</p><div className="passage-share-actions"><button type="button" onClick={()=>passageAction(textOnly(x.text||x.content),x.reference||x.id||"Bible passage","copy")}><Copy size={13}/> Copy with OrPath link</button><button type="button" onClick={()=>passageAction(textOnly(x.text||x.content),x.reference||x.id||"Bible passage","share")}><Share2 size={13}/> Share</button></div></div></article>)}</div>}
 <div className="scripture-paper"><div className="scripture-heading"><span>THE HOLY BIBLE</span><h2>{book?.name||bookId} <em>{chapterId.split(".").pop()}</em></h2><p>{bible?.name||"Loading translation"} · Live API content</p></div>
 {busy&&!content?<div className="sample-notice"><LoaderCircle size={22}/><strong>Opening Scripture…</strong><p>Fetching this chapter from API.Bible.</p></div>:content?<div>{verses.length>0?verses.map((verse,i)=><p className="scripture-verse" key={`${verse.number}-${i}`}><sup className="verse-number" aria-label={`Verse ${verse.number}`}>{verse.number}</sup><span className="verse-text">{verse.text}</span></p>):content.split("\n").filter(Boolean).map((line,i)=><p className="scripture-verse" key={i}>{line}</p>)}</div>:!error?<div className="sample-notice"><BookOpen size={22}/><strong>Choose a Bible to begin</strong><p>Available translations will appear here.</p></div>:null}
 <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,flexWrap:"wrap",marginTop:22}}><button className="solid-button" type="button" onClick={markChapterComplete} disabled={marking||!content}>{marking?<LoaderCircle size={15}/>:completed?<Check size={15}/>:<Flame size={15}/>} {completed?"Chapter completed":"Mark chapter complete"}</button>{completionMessage&&<span role="status" style={{fontSize:11,color:"#5d8064"}}>{completionMessage}</span>}</div><div className="chapter-nav"><button className="outline-button" disabled={index<=0} onClick={()=>setChapterId(chapters[index-1]?.id||chapterId)}><ArrowLeft size={15}/> Previous</button><button className="solid-button" disabled={index<0||index>=chapters.length-1} onClick={()=>setChapterId(chapters[index+1]?.id||chapterId)}>Next chapter <ArrowRight size={15}/></button></div></div>
 {shareNotice&&<p className="reader-disclaimer" role="status">{shareNotice}</p>}<p className="reader-disclaimer">{copyright?("Copyright: "+copyright+" · "):""}Bible availability and usage depend on API.Bible licensing permissions.</p></div>;
}
