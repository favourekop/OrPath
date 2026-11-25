"use client";
import ProfileAvatar from "../../../components/ProfileAvatar";
import { BookOpen } from "lucide-react";
import NavigationMenu from "../../../components/NavigationMenu";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, UserPlus, RefreshCw, Trash2, KeyRound, Ban, CheckCircle2 } from "lucide-react";

type Admin = { id: string; email?: string; created_at: string; last_sign_in_at?: string | null; banned_until?: string | null; confirmed: boolean };
export default function AdminSettingsPage() {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setBusy(true); setError("");
    try { const r = await fetch("/api/admin/users", { cache: "no-store" }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Could not load admins."); setAdmins(d.admins || []); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not load admins."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function action(method: string, body: unknown) {
    setBusy(true); setNotice(""); setError("");
    try { const r = await fetch("/api/admin/users", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const d = await r.json(); if (!r.ok) throw new Error(d.error || "Request failed."); setNotice("Admin settings updated."); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : "Request failed."); }
    finally { setBusy(false); }
  }
  async function create(event: React.FormEvent) { event.preventDefault(); await action("POST", { email, password }); if (!error) { setEmail(""); setPassword(""); } }
  return <main className="app" style={{ minHeight: "100vh" }}><section className="main-shell">
    <header className="topbar"><Link className="brand" href="/admin"><span className="brand-mark"><ShieldCheck size={20}/></span><span className="brand-name">orpath<span>.</span><small>ADMIN SETTINGS</small></span></Link><div className="top-actions"><NavigationMenu label="Menu"><Link className="text-link" href="/admin">Admin dashboard</Link><Link className="text-link" href="/admin/content">Content Studio</Link><Link className="text-link" href="/admin/analytics">Analytics & streaks</Link><Link className="text-link" href="/dashboard">User dashboard</Link><Link className="text-link" href="/community">Community</Link><Link className="text-link" href="/library">My Library</Link></NavigationMenu><Link className="text-link" href="/"><BookOpen size={15}/> Open Bible</Link><ProfileAvatar /></div></header>
    <div className="content" style={{ maxWidth: 900 }}>
      <div className="page-intro"><span className="section-kicker">SECURITY & ACCESS</span><h1>Admin <em>accounts.</em></h1><p>Create and manage trusted OrPath administrators. Passwords are never displayed after creation.</p></div>
      <section className="continue-panel" style={{ marginTop: 24 }}><div className="panel-heading"><div><span className="section-kicker">NEW ACCESS</span><h2>Create admin account</h2></div><UserPlus size={20}/></div>
        <form onSubmit={create} style={{ display: "grid", gap: 12, marginTop: 18 }}>
          <label style={{ display: "grid", gap: 6, fontSize: 11, fontWeight: 700 }}>Email address<input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@example.com" style={field}/></label>
          <label style={{ display: "grid", gap: 6, fontSize: 11, fontWeight: 700 }}>Temporary password<input type="password" required minLength={12} value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 12 characters" style={field}/></label>
          <button className="solid-button" disabled={busy} type="submit" style={{ justifySelf: "start" }}><UserPlus size={15}/> Create admin</button>
        </form>
      </section>
      <section className="continue-panel" style={{ marginTop: 18 }}><div className="panel-heading"><div><span className="section-kicker">ADMIN DIRECTORY</span><h2>Administrator accounts</h2></div><button className="outline-button" onClick={()=>void load()} disabled={busy}><RefreshCw size={14}/> Refresh</button></div>
        {admins.length === 0 && !busy ? <p style={{ color:"var(--subtext)",fontSize:12,marginTop:18 }}>No admin accounts found.</p> : <div style={{ display:"grid",gap:10,marginTop:18 }}>{admins.map(a=><article key={a.id} style={{ border:"1px solid var(--border)",borderRadius:10,padding:14,display:"grid",gap:10 }}>
          <div style={{ display:"flex",justifyContent:"space-between",gap:10,flexWrap:"wrap" }}><div><strong style={{fontSize:13}}>{a.email}</strong><p style={{fontSize:10,color:"var(--subtext)",margin:"5px 0 0"}}>Created {new Date(a.created_at).toLocaleDateString()} · {a.last_sign_in_at ? "Last active "+new Date(a.last_sign_in_at).toLocaleDateString() : "Never signed in"}</p></div><span className="section-kicker">{a.banned_until ? "SUSPENDED" : "ADMIN"}</span></div>
          <div style={{display:"flex",gap:7,flexWrap:"wrap"}}><button className="outline-button" onClick={()=>{const next=window.prompt("Enter the new admin email address.",a.email||"");if(next)void action("PATCH",{id:a.id,email:next});}} disabled={busy}><KeyRound size={13}/> Change email</button><button className="outline-button" onClick={()=>{const next=window.prompt("Enter a new password (minimum 12 characters).");if(next)void action("PATCH",{id:a.id,password:next});}} disabled={busy}><KeyRound size={13}/> Reset password</button><button className="outline-button" onClick={()=>void action("PATCH",{id:a.id,disable:!a.banned_until})} disabled={busy}>{a.banned_until?<CheckCircle2 size={13}/>:<Ban size={13}/>} {a.banned_until?"Restore access":"Suspend"}</button><button className="outline-button" onClick={()=>{if(window.confirm("Permanently delete this admin account?"))void action("DELETE",{id:a.id});}} disabled={busy}><Trash2 size={13}/> Delete</button></div>
        </article>)}</div>}
        {busy && <p style={{fontSize:11,color:"var(--subtext)"}}>Working…</p>}
      </section>
      {notice && <p role="status" style={{color:"#39734c",fontSize:12,marginTop:14}}>{notice}</p>}{error && <p role="alert" style={{color:"#a33d35",fontSize:12,marginTop:14}}>{error}</p>}
      <p style={{fontSize:10,color:"var(--subtext)",lineHeight:1.7,marginTop:16}}>Only signed-in admins can access this page. Admin account changes are performed server-side using the Supabase service-role key. Never expose that key in browser code.</p>
    </div>
  </section></main>;
}
const field: React.CSSProperties = { width:"100%",boxSizing:"border-box",border:"1px solid var(--border)",borderRadius:9,padding:12,fontSize:12,background:"var(--panel)",color:"var(--text)" };
