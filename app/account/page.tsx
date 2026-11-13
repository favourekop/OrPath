"use client";

import Image from "next/image";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Camera, LoaderCircle, LogOut, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const profileInitial = name.trim().charAt(0).toUpperCase() || "U";
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadAccount() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        if (!user) {
          router.replace("/auth");
          return;
        }
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("display_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (active) {
          setEmail(user.email ?? "");
          setName(profile?.display_name ?? user.user_metadata?.full_name ?? "");
          setAvatarUrl(profile?.avatar_url ?? "");
        }
      } catch (cause) {
        if (active) setError(cause instanceof Error ? cause.message : "Your account could not be loaded.");
      } finally {
        if (active) setBusy(false);
      }
    }
    void loadAccount();
    return () => { active = false; };
  }, [router]);

  async function uploadAvatar(file?: File) {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { setError("Choose a JPG, PNG or WebP image."); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Your profile photo must be 5 MB or smaller."); return; }
    setUploading(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) { router.replace("/auth"); return; }
      const extension = file.type === "image/jpeg" ? "jpg" : file.type === "image/png" ? "png" : "webp";
      const path = `${user.id}/avatar.${extension}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (uploadError) throw uploadError;
      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = `${publicData.publicUrl}?v=${Date.now()}`;
      const { error: profileError } = await supabase.from("profiles").update({ avatar_url: url, updated_at: new Date().toISOString() }).eq("id", user.id);
      if (profileError) throw profileError;
      setAvatarUrl(url); setMessage("Your profile photo has been updated.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Your photo could not be uploaded."); }
    finally { setUploading(false); }
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const supabase = createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;
      if (!user) {
        router.replace("/auth");
        return;
      }
      const cleanName = name.trim();
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ display_name: cleanName, updated_at: new Date().toISOString() })
        .eq("id", user.id);
      if (profileError) throw profileError;
      const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: cleanName } });
      if (metadataError) throw metadataError;
      setMessage("Your profile has been updated.");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Your profile could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setError("");
    const supabase = createClient();
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) {
      setError(signOutError.message);
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="app account-page-shell" style={{ minHeight: "100vh" }}>
      <section className="main-shell">
        <header className="topbar">
          <Link className="brand" href="/"><span className="brand-mark"><Image src="/orpath-icon.svg" alt="" width={40} height={40} priority /></span><span className="brand-name">ORPATH<small>LET THE WORD LEAD</small></span></Link>
          <div className="top-actions">
            <Link className="text-link" href="/dashboard">Dashboard <ArrowLeft size={14}/></Link>
            <Link className="text-link" href="/">Open Bible <ArrowLeft size={14}/></Link>
          </div>
        </header>
        <div className="account-content">
        <div style={{width:"100%",maxWidth:720,margin:"0 auto"}}>
        <section className="account-card">
          <div style={{display:"flex",alignItems:"center",gap:13}}>
            <span aria-label={avatarUrl ? "Profile photo" : `Profile initial ${profileInitial}`} style={{width:58,height:58,borderRadius:"50%",display:"grid",placeItems:"center",overflow:"hidden",background:"#e8efe6",color:"#2c654b",fontSize:23,fontWeight:700,flexShrink:0}}>{avatarUrl ? <Image src={avatarUrl} alt="Your profile" width={58} height={58} unoptimized style={{width:"100%",height:"100%",objectFit:"cover"}}/> : profileInitial}</span>
            <div><div style={{fontSize:9,letterSpacing:2,color:"#809080"}}>YOUR ORPATH SPACE</div><h1 style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:400,margin:"5px 0 0"}}>Your account.</h1></div>
          </div>
          {busy ? <p style={{display:"flex",alignItems:"center",gap:9,color:"#718076",fontSize:13,marginTop:30}}><LoaderCircle size={17}/> Loading your account…</p> : <>
            <div style={{marginTop:18,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}><label style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 13px",border:"1px solid #dfe5dc",borderRadius:9,color:"#385e47",fontSize:11,fontWeight:700,cursor:"pointer"}}><Camera size={15}/>{uploading ? "Uploading photo…" : "Upload profile photo"}<input type="file" accept="image/png,image/jpeg,image/webp" disabled={uploading} onChange={e=>{void uploadAvatar(e.target.files?.[0]);e.currentTarget.value="";}} style={{display:"none"}}/></label><span style={{fontSize:10,color:"#89968b"}}>JPG, PNG or WebP · up to 5 MB</span></div><form onSubmit={saveProfile} style={{display:"grid",gap:16,marginTop:22}}>
              <label style={{display:"grid",gap:7,fontSize:12,fontWeight:600}}>Display name<input value={name} onChange={e=>setName(e.target.value)} maxLength={80} autoComplete="name" placeholder="Your name" style={field}/></label>
              <label style={{display:"grid",gap:7,fontSize:12,fontWeight:600}}>Email address<input value={email} readOnly style={{...field,background:"#f7f8f4",color:"#77847a"}}/><span style={{fontSize:10,color:"#89968b",fontWeight:400}}>Your sign-in email is managed by your authentication settings.</span></label>
              {error&&<p role="alert" style={{margin:0,color:"#a33d35",fontSize:12,lineHeight:1.6}}>{error}</p>}
              {message&&<p role="status" style={{margin:0,color:"#2c654b",fontSize:12}}>{message}</p>}
              <button disabled={saving} type="submit" style={primaryButton}>{saving?<LoaderCircle size={16}/>:<Save size={16}/>} Save profile</button>
            </form>
            <div style={{borderTop:"1px solid #e9ece5",marginTop:28,paddingTop:22,display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap"}}>
              <div><strong style={{fontSize:13}}>Your journey, your pace.</strong><p style={{fontSize:11,color:"#718076",margin:"5px 0 0"}}>Your private OrPath account.</p></div>
              <button type="button" onClick={signOut} style={secondaryButton}><LogOut size={15}/> Sign out</button>
            </div>
          </>}
        </section>
        <p style={{display:"flex",alignItems:"center",justifyContent:"center",gap:7,fontSize:10,color:"#8a968b",marginTop:18}}><BookOpen size={13}/> Let the Word lead.</p>
        </div>
        </div>
      </section>
    </main>
  );
}

const field: React.CSSProperties = {width:"100%",boxSizing:"border-box",border:"1px solid #dfe5dc",borderRadius:9,padding:"13px",fontSize:13,outlineColor:"#72947b",color:"#19382c",background:"#fff"};
const primaryButton: React.CSSProperties = {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,border:0,borderRadius:9,padding:13,background:"#1c4a37",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"};
const secondaryButton: React.CSSProperties = {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,border:"1px solid #e0e6dd",borderRadius:9,padding:"10px 13px",background:"#fff",color:"#385e47",fontSize:11,fontWeight:700,cursor:"pointer"};
