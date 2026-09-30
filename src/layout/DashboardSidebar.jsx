import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Layers,
  ShieldAlert,
  TrendingUp,
  BookmarkCheck,
  Search,
  Network,
  Activity,
  Server,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import CloudInterceptLogo from "@/components/CloudInterceptLogo";
import { useDashboard } from "@/context/DashboardContext";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

// â”€â”€â”€ Nav item configuration â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const NAV_GROUPS = [
  {
    category: null,
    items: [
      { path: "/dashboard", label: "Overview", icon: LayoutDashboard },
    ],
  },
  {
    category: "SECURITY",
    items: [
      { path: "/services",        label: "Services",        icon: Layers },
      { path: "/threats",         label: "Threats",         icon: ShieldAlert },
      { path: "/attack-paths",    label: "Attack Paths",    icon: TrendingUp },
      { path: "/recommendations", label: "Recommendations", icon: BookmarkCheck },
      { path: "/findings",        label: "Findings",        icon: Search },
      { path: "/resource-map",    label: "Architecture",    icon: Network },
    ],
  },
  {
    category: "OPERATIONS",
    items: [
      { path: "/scans",    label: "Scans",        icon: Activity },
      { path: "/accounts", label: "AWS Accounts", icon: Server },
      { path: "/reports",  label: "Reports",      icon: FileText },
    ],
  },
  {
    category: null,
    items: [
      { path: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function DashboardSidebar({ className }) {
  const location = useLocation();
  const { user, logout } = useAuth();

  // useDashboard is used here only for the user avatar â€“ it may not always be
  // needed, but is consistent with the design spec.
  // We fall back to AuthContext user which is always available.
  const userDisplayName =
    user?.name || user?.username || user?.email?.split("@")[0] || "User";
  const userInitials = userDisplayName.substring(0, 2).toUpperCase();

  return (
    <aside
      className={cn(
        "flex flex-col w-60 min-h-screen bg-ci-surface border-r border-white/8 py-5 px-3",
        className
      )}
    >
      {/* Brand */}
      <div className="px-2 mb-7">
        <CloudInterceptLogo height={30} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-5 overflow-y-auto ci-scroll">
        {NAV_GROUPS.map((group, gIdx) => (
          <div key={gIdx} className="flex flex-col gap-0.5">
            {group.category && (
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-ci-muted/60 px-3 mb-1">
                {group.category}
              </span>
            )}
            {group.items.map(({ path, label, icon: Icon }) => {
              const isActive = location.pathname === path;
              return (
                <Link
                  key={path}
                  to={path}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 no-underline",
                    isActive
                      ? "bg-ci-accent/15 text-white border border-ci-glow/20 border-l-2 border-l-ci-accent font-semibold"
                      : "text-ci-muted hover:text-white hover:bg-white/5 border border-transparent"
                  )}
                >
                  <Icon
                    size={15}
                    className={cn(
                      "shrink-0",
                      isActive ? "text-ci-accent" : "text-ci-muted"
                    )}
                  />
                  {label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User footer */}
      {user && (
        <div className="mt-4 pt-4 border-t border-white/8 px-1 flex items-center gap-2.5">
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-ci-accent/20 border border-ci-glow/20 flex items-center justify-center shrink-0 text-[11px] font-bold text-ci-accent select-none">
            {user.picture ? (
              <img
                src={user.picture}
                alt={userDisplayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              userInitials
            )}
          </div>

          {/* Name + email */}
          <div className="min-w-0 flex-1">
            <p className="text-[12px] font-semibold text-white truncate m-0">
              {userDisplayName}
            </p>
            <p className="text-[10px] text-ci-muted truncate m-0">
              {user.email}
            </p>
          </div>

          {/* Logout icon */}
          <button
            onClick={logout}
            title="Sign out"
            className="p-1.5 rounded-md text-ci-muted hover:text-ci-critical hover:bg-ci-critical/10 transition-colors shrink-0"
          >
            <LogOut size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}

