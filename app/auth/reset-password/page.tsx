"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, LoaderCircle, LockKeyhole } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Your passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setMessage("Your password has been updated. You can now sign in.");
      window.setTimeout(() => router.replace("/auth"), 1200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We could not update your password. Request a new reset link.");
    } finally {
      setBusy(false);
    }
  }

  const field: React.CSSProperties = {
    width: "100%", boxSizing: "border-box", border: "1px solid #dfe5dc",
    borderRadius: 9, padding: "12px 13px", fontSize: 13, outlineColor: "#72947b",
  };

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24, background: "#f5f4ee", color: "#19382c" }}>
      <section style={{ width: "100%", maxWidth: 430, background: "#fff", border: "1px solid #e4e6dc", borderRadius: 20, padding: 30, boxShadow: "0 20px 60px #19382c12" }}>
        <Link href="/auth" style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "#66806e", textDecoration: "none", fontSize: 13 }}>
          <ArrowLeft size={16} /> Back to sign in
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 30 }}>
          <span style={{ width: 44, height: 44, borderRadius: 14, display: "grid", placeItems: "center", background: "#e8efe6", color: "#2c654b" }}><BookOpen size={23} /></span>
          <strong style={{ fontSize: 23, letterSpacing: -1 }}>orpath<span style={{ color: "#b59a62" }}>.</span></strong>
        </div>
        <h1 style={{ fontFamily: "Georgia,serif", fontWeight: 400, fontSize: 34, margin: "28px 0 8px" }}>Choose a new password.</h1>
        <p style={{ color: "#718076", fontSize: 13, lineHeight: 1.7, margin: "0 0 24px" }}>Create a new password for your OrPath account.</p>
        <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
          <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 600 }}>New password
            <span style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #dfe5dc", borderRadius: 9, padding: "0 12px", color: "#7c9382" }}>
              <LockKeyhole size={16} /><input required minLength={8} type="password" autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 8 characters" style={{ ...field, border: 0, padding: "12px 0" }} />
            </span>
          </label>
          <label style={{ display: "grid", gap: 7, fontSize: 12, fontWeight: 600 }}>Confirm new password
            <span style={{ display: "flex", alignItems: "center", gap: 10, border: "1px solid #dfe5dc", borderRadius: 9, padding: "0 12px", color: "#7c9382" }}>
              <LockKeyhole size={16} /><input required minLength={8} type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Enter it again" style={{ ...field, border: 0, padding: "12px 0" }} />
            </span>
          </label>
          {error && <p role="alert" style={{ margin: 0, color: "#a33d35", fontSize: 12 }}>{error}</p>}
          {message && <p role="status" style={{ margin: 0, color: "#2c654b", fontSize: 12 }}>{message}</p>}
          <button disabled={busy} type="submit" style={{ marginTop: 5, border: 0, borderRadius: 10, padding: 14, background: "#1c4a37", color: "#fff", fontWeight: 600, cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: 8 }}>
            {busy && <LoaderCircle size={16} />} Update password
          </button>
        </form>
      </section>
    </main>
  );
}
