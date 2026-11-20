"use client";

import { usePathname } from "next/navigation";
import SiteFooter from "./SiteFooter";

export default function SiteFooterGate() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/auth")) return null;
  return <SiteFooter />;
}
