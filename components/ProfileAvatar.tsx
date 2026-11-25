"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileAvatar({ className = "top-avatar" }: { className?: string }) {
  const [profile, setProfile] = useState<{ name: string; avatarUrl: string | null }>({ name: "User", avatarUrl: null });

  useEffect(() => {
    let active = true;
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle();
      if (!active) return;
      setProfile({
        name: data?.display_name || user.user_metadata?.full_name || "User",
        avatarUrl: data?.avatar_url || null,
      });
    }
    void load();
    return () => { active = false; };
  }, []);

  const initial = profile.name.trim().charAt(0).toUpperCase() || "U";
  return (
    <Link className={className} href="/account" aria-label={`Open ${profile.name} profile`} title="Your profile"
      style={{ width: 36, height: 36, borderRadius: "50%", display: "inline-grid", placeItems: "center", overflow: "hidden", background: "#e8efe6", color: "#1c4a37", fontWeight: 700, fontSize: 13, textDecoration: "none", flexShrink: 0 }}>
      {profile.avatarUrl ? <Image src={profile.avatarUrl} alt="" width={36} height={36} unoptimized style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
    </Link>
  );
}
