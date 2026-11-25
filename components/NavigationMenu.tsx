import type { ReactNode } from "react";
import { ChevronDown, Menu } from "lucide-react";

type NavigationMenuProps = {
  children: ReactNode;
  label?: string;
  className?: string;
};

/** Native details/summary keeps navigation interactive without client JS. */
export default function NavigationMenu({
  children,
  label = "Navigation",
  className = "",
}: NavigationMenuProps) {
  return (
    <details className={`orpath-nav-dropdown ${className}`.trim()}>
      <summary aria-label={label}>
        <Menu size={16} aria-hidden="true" />
        <span>{label}</span>
        <ChevronDown className="orpath-nav-chevron" size={14} aria-hidden="true" />
      </summary>
      <nav className="orpath-nav-dropdown-panel" aria-label={label}>
        {children}
      </nav>
    </details>
  );
}
