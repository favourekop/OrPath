"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, LoaderCircle, LogOut, Save, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
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
          .select("display_name")
          .eq("id", user.id)
          .maybeSingle();
        if (profileError) throw profileError;
        if (active) {
          setEmail(user.email ?? "");
          setName(profile?.display_name ?? user.user_metadata?.full_name ?? "");
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
    <main style={{minHeight:"100vh",background:"#f5f4ee",color:"#19382c",padding:"28px 18px"}}>
      <div style={{width:"100%",maxWidth:720,margin:"0 auto"}}>
        <Link href="/" style={{display:"inline-flex",alignItems:"center",gap:8,color:"#66806e",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Back to OrPath</Link>
        <section style={{marginTop:28,background:"#fff",border:"1px solid #e4e6dc",borderRadius:18,padding:"clamp(22px,5vw,36px)",boxShadow:"0 20px 60px #19382c0d"}}>
          <div style={{display:"flex",alignItems:"center",gap:13}}>
            <span style={{width:48,height:48,borderRadius:14,display:"grid",placeItems:"center",background:"#e8efe6",color:"#2c654b"}}><UserRound size={23}/></span>
            <div><div style={{fontSize:9,letterSpacing:2,color:"#809080"}}>YOUR ORPATH SPACE</div><h1 style={{fontFamily:"Georgia,serif",fontSize:32,fontWeight:400,margin:"5px 0 0"}}>Your account.</h1></div>
          </div>
          {busy ? <p style={{display:"flex",alignItems:"center",gap:9,color:"#718076",fontSize:13,marginTop:30}}><LoaderCircle size={17}/> Loading your account…</p> : <>
            <form onSubmit={saveProfile} style={{display:"grid",gap:16,marginTop:30}}>
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
    </main>
  );
}

const field: React.CSSProperties = {width:"100%",boxSizing:"border-box",border:"1px solid #dfe5dc",borderRadius:9,padding:"13px",fontSize:13,outlineColor:"#72947b",color:"#19382c",background:"#fff"};
const primaryButton: React.CSSProperties = {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,border:0,borderRadius:9,padding:13,background:"#1c4a37",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"};
const secondaryButton: React.CSSProperties = {display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,border:"1px solid #e0e6dd",borderRadius:9,padding:"10px 13px",background:"#fff",color:"#385e47",fontSize:11,fontWeight:700,cursor:"pointer"};
