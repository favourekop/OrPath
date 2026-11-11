import type { Metadata, Viewport } from "next";
import "./globals.css";
import OfflineSupport from "./components/OfflineSupport";

export const metadata: Metadata = {
  metadataBase: new URL("https://or-path.vercel.app"),
  title: "OrPath — Let the Word Lead",
  description: "A thoughtful home for Scripture, daily devotionals, prayer, and spiritual growth.",
  applicationName: "OrPath",
  manifest: "/manifest.json",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }], apple: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: {
    title: "OrPath — Let the Word Lead",
    description: "A thoughtful home for Scripture, daily devotionals, prayer, and spiritual growth.",
    siteName: "OrPath",
    type: "website",
  },
  appleWebApp: { capable: true, statusBarStyle: "default", title: "OrPath" },
};

export const viewport: Viewport = {
  themeColor: "#103c2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}<OfflineSupport /></body></html>;
}
