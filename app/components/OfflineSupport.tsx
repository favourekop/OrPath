"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function OfflineSupport() {
  const router = useRouter();
  const [online, setOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setOnline(navigator.onLine);
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);

    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    const handleInstall = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => {
      setInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleInstall);
    window.addEventListener("appinstalled", handleInstalled);

    // Every authenticated app visit counts as the daily check-in, even when
    // the reader does not open or complete a Bible chapter.
    void (async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const now = new Date();
        const dateKey = [
          now.getFullYear(),
          String(now.getMonth() + 1).padStart(2, "0"),
          String(now.getDate()).padStart(2, "0"),
        ].join("-");
        const { error } = await supabase.from("reading_progress").upsert({
          user_id: user.id,
          bible_id: "orpath-checkin",
          book_id: "daily-checkin",
          chapter_id: dateKey,
        }, { onConflict: "user_id,bible_id,chapter_id" });
        if (error) console.error("OrPath daily check-in failed:", error.message);
        else router.refresh();
      } catch (error) {
        console.error("OrPath daily check-in could not be saved:", error);
      }
    })();

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("OrPath offline setup could not register:", error);
      });
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleInstall);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, [router]);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") setInstalled(true);
    setInstallPrompt(null);
  }

  return (
    <>
      {!online && (
        <div role="status" aria-live="polite" style={{position:"fixed",zIndex:100,bottom:16,left:"50%",transform:"translateX(-50%)",width:"max-content",maxWidth:"calc(100vw - 24px)",padding:"11px 15px",borderRadius:12,background:"#173f30",color:"#fff",boxShadow:"0 8px 30px #0003",fontSize:12,fontWeight:600,display:"flex",alignItems:"center",gap:9}}>
          <span aria-hidden="true">◉</span>
          Offline mode · Saved pages and Scripture available
        </div>
      )}
      {online && installPrompt && !installed && (
        <button type="button" onClick={installApp} style={{position:"fixed",zIndex:90,right:16,bottom:16,border:0,borderRadius:999,padding:"12px 17px",background:"#173f30",color:"#fff",fontSize:12,fontWeight:700,boxShadow:"0 8px 24px #0002",cursor:"pointer"}}>
          Install OrPath
        </button>
      )}
    </>
  );
}
