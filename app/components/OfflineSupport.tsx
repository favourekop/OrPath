"use client";

import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export default function OfflineSupport() {
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
  }, []);

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
