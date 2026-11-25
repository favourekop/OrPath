import Link from "next/link";
import { BookOpen, BookMarked, CalendarDays, ChartNoAxesColumn, Heart, Home, Library, Settings, ShieldCheck, Users } from "lucide-react";

type Props = { active?: string; isAdmin?: boolean; displayName?: string; initial?: string };

const links = [
  { href: "/dashboard", label: "Dashboard", icon: Home, key: "dashboard" },
  { href: "/analytics", label: "Analytics", icon: ChartNoAxesColumn, key: "analytics" },
  { href: "/library", label: "My Library", icon: Library, key: "library" },
  { href: "/community", label: "Community", icon: Users, key: "community" },
  { href: "/bible", label: "Open Bible", icon: BookOpen, key: "bible" },
  { href: "/account", label: "Account settings", icon: Settings, key: "account" },
];

export default function DashboardSidebar({ active = "dashboard", isAdmin = false, displayName = "Friend", initial = "U" }: Props) {
  const items = isAdmin ? [...links.slice(0, 4), { href: "/admin", label: "Admin console", icon: ShieldCheck, key: "admin" }, ...links.slice(4)] : links;
  const nav = <nav className="side-nav" aria-label="Main navigation">{items.map(({href,label,icon:Icon,key}) => <Link key={key} href={href} className={`nav-item ${active === key ? "active" : ""}`} aria-current={active === key ? "page" : undefined}><Icon size={17}/><span>{label}</span></Link>)}</nav>;
  return <>
    <aside className="sidebar dashboard-sidebar" aria-label="OrPath sidebar">
      <Link className="brand" href="/"><span className="brand-mark"><BookOpen size={23}/></span><span className="brand-name"><span className="brand-word">orpath<span>.</span></span><small>LET THE WORD LEAD</small></span></Link>
      <span className="side-label">YOUR SPACE</span>
      {nav}
      <div className="sidebar-bottom"><div className="streak-card"><span className="streak-icon"><CalendarDays size={16}/></span><div><strong>Keep your rhythm</strong><p>A little closer, every day.</p></div></div><Link className="profile-button" href="/account"><span className="avatar">{initial}</span><span><strong>{displayName}</strong><span>My profile</span></span></Link></div>
    </aside>
    <details className="mobile-sidebar">
      <summary aria-label="Open navigation"><span className="mobile-sidebar-icon">☰</span><span>Menu</span></summary>
      <div className="mobile-sidebar-panel"><span className="side-label">YOUR SPACE</span>{nav}<Link className="nav-item" href="/account"><Settings size={17}/> Account settings</Link></div>
    </details>
  </>;
}
