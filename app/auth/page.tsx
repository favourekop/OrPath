"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, LoaderCircle, LockKeyhole, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createClient();
      if (mode === "reset") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (resetError) throw resetError;
        setMessage("If an account exists for that email, a password reset link is on its way.");
        return;
      }
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({
          email, password, options: { data: { full_name: name.trim() } },
        });
        if (authError) throw authError;
        if (data.session) router.replace("/");
        else setMessage("Account created. Check your email for the confirmation link, then sign in.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
        if (authError) throw authError;
        router.replace("/");
        router.refresh();
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Authentication could not be completed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{minHeight:"100vh",display:"grid",placeItems:"center",padding:24,background:"#f5f4ee",color:"#19382c"}}>
      <section style={{width:"100%",maxWidth:430,background:"#fff",border:"1px solid #e4e6dc",borderRadius:20,padding:30,boxShadow:"0 20px 60px #19382c12"}}>
        <Link href="/" style={{display:"inline-flex",alignItems:"center",gap:8,color:"#66806e",textDecoration:"none",fontSize:13}}><ArrowLeft size={16}/> Back to OrPath</Link>
        <div style={{display:"flex",alignItems:"center",gap:12,marginTop:30}}>
          <span style={{width:44,height:44,borderRadius:14,display:"grid",placeItems:"center",background:"#e8efe6",color:"#2c654b"}}><BookOpen size={23}/></span>
          <div><strong style={{fontSize:23,letterSpacing:-1}}>orpath<span style={{color:"#b59a62"}}>.</span></strong><div style={{fontSize:9,letterSpacing:2,color:"#809080"}}>LET THE WORD LEAD</div></div>
        </div>
        <h1 style={{fontFamily:"Georgia,serif",fontWeight:400,fontSize:34,margin:"28px 0 8px"}}>{mode==="signin"?"Welcome back.":mode==="signup"?"Begin your journey.":"Reset your password."}</h1>
        <p style={{color:"#718076",fontSize:13,lineHeight:1.7,margin:"0 0 24px"}}>{mode==="signin"?"Sign in to continue your personal walk through Scripture.":mode==="signup"?"Create an account to keep your prayers, saved verses and reading progress together.":"Enter your account email and we will send you a secure reset link."}</p>
        <form onSubmit={submit} style={{display:"grid",gap:14}}>
          {mode==="signup"&&<label style={{display:"grid",gap:7,fontSize:12,fontWeight:600}}>Your name<input required value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Your name" style={field}/></label>}
          <label style={{display:"grid",gap:7,fontSize:12,fontWeight:600}}>Email address<span style={inputWrap}><Mail size={16}/><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" style={innerField}/></span></label>
          {mode!=="reset"&&<label style={{display:"grid",gap:7,fontSize:12,fontWeight:600}}>Password<span style={inputWrap}><LockKeyhole size={16}/><input required minLength={8} type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete={mode==="signin"?"current-password":"new-password"} placeholder="At least 8 characters" style={innerField}/></span></label>}
          {error&&<p role="alert" style={{margin:0,color:"#a33d35",fontSize:12}}>{error}</p>}
          {message&&<p role="status" style={{margin:0,color:"#2c654b",fontSize:12,lineHeight:1.6}}>{message}</p>}
          <button disabled={busy} type="submit" style={{marginTop:5,border:0,borderRadius:10,padding:14,background:"#1c4a37",color:"#fff",fontWeight:600,cursor:"pointer",display:"flex",justifyContent:"center",alignItems:"center",gap:8}}>{busy&&<LoaderCircle size={16} className="animate-spin"/>}{mode==="signin"?"Sign in":mode==="signup"?"Create account":"Send reset link"}</button>
        </form>
        <div style={{display:"grid",gap:10,marginTop:20,textAlign:"center",fontSize:12,color:"#718076"}}>{mode==="signin"&&<button type="button" onClick={()=>{setMode("reset");setError("");setMessage("");}} style={{border:0,background:"none",color:"#276448",fontWeight:700,cursor:"pointer"}}>Forgot your password?</button>}<p style={{margin:0}}>{mode==="signup"?"Already have an account?":mode==="reset"?"Remembered your password?":"New to OrPath?"} <button type="button" onClick={()=>{setMode(mode==="signin"?"signup":"signin");setError("");setMessage("");}} style={{border:0,background:"none",color:"#276448",fontWeight:700,cursor:"pointer"}}>{mode==="signin"?"Create account":"Sign in"}</button></p></div>
        <p style={{fontSize:10,color:"#98a198",textAlign:"center",lineHeight:1.6,margin:"20px 0 0"}}>Your private journal and saved Scripture are protected by your account and database access policies.</p>
      </section>
    </main>
  );
}

const field: React.CSSProperties = {width:"100%",boxSizing:"border-box",border:"1px solid #dfe5dc",borderRadius:9,padding:"12px 13px",fontSize:13,outlineColor:"#72947b"};
const inputWrap: React.CSSProperties = {display:"flex",alignItems:"center",gap:10,border:"1px solid #dfe5dc",borderRadius:9,padding:"0 12px",color:"#7c9382"};
const innerField: React.CSSProperties = {width:"100%",minWidth:0,border:0,outline:0,padding:"12px 0",fontSize:13,background:"transparent",color:"#19382c"};
