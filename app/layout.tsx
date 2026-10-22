import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OrPath — Let the Word Lead",
  description: "A thoughtful home for Scripture, daily devotionals, prayer, and spiritual growth.",
  applicationName: "OrPath",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "OrPath" },
};

export const viewport: Viewport = {
  themeColor: "#103c2e",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
