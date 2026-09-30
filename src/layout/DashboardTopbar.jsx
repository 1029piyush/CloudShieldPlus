import { useLocation, useNavigate } from "react-router-dom";
import { Menu, Plus, LogOut, ChevronDown, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useDashboard } from "@/context/DashboardContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_TITLES = {
  "/dashboard":       "Overview",
  "/services":        "Services",
  "/threats":         "Threats",
  "/attack-paths":    "Attack Paths",
  "/recommendations": "Recommendations",
  "/findings":        "Findings",
  "/resource-map":    "Architecture",
  "/scans":           "Scans",
  "/accounts":        "AWS Accounts",
  "/reports":         "Reports",
  "/settings":        "Settings",
};

export default function DashboardTopbar({ onToggleSidebar }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const { handleRunScan, scanning, selectedAccountId, accounts, handleAccountChange } = useDashboard();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [accountDropOpen, setAccountDropOpen] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? "Dashboard";
  const activeAccount = accounts.find(a => a.id === selectedAccountId);
  const displayName = user?.name || user?.email?.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-30 glass-strong border-b border-white/8 px-4 lg:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-1.5 rounded-lg text-ci-muted hover:text-white hover:bg-white/5 transition-colors"
          aria-label="Toggle sidebar"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-base font-bold text-white leading-none">
            CloudIntercept
          </h1>
          <p className="text-xs text-ci-muted mt-0.5">{pageTitle}</p>
        </div>
      </div>

      {/* Right: account selector + scan button + user menu */}
      <div className="flex items-center gap-2">
        {/* AWS Account selector */}
        {accounts.length > 0 && (
          <div className="relative hidden sm:block">
            <button
              onClick={() => setAccountDropOpen(v => !v)}
              className="glass flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-ci-muted hover:text-white transition-colors"
            >
              <span className="truncate max-w-[120px]">
                {activeAccount?.account_name ?? "Select Account"}
              </span>
              <ChevronDown size={12} />
            </button>
            {accountDropOpen && (
              <div className="absolute right-0 top-full mt-1 glass-strong rounded-xl py-1 min-w-[180px] z-50">
                {accounts.map(acc => (
                  <button
                    key={acc.id}
                    onClick={() => { handleAccountChange(acc.id); setAccountDropOpen(false); }}
                    className={cn(
                      "w-full text-left px-4 py-2 text-xs hover:bg-white/5 transition-colors",
                      acc.id === selectedAccountId ? "text-ci-accent font-semibold" : "text-ci-muted"
                    )}
                  >
                    {acc.account_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* New Scan button */}
        <Button
          size="sm"
          onClick={handleRunScan}
          disabled={scanning || !selectedAccountId}
          className="gap-1.5"
        >
          <Plus size={14} />
          {scanning ? "Scanningâ€¦" : "New Scan"}
        </Button>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(v => !v)}
            className="w-8 h-8 rounded-full bg-ci-accent/20 border border-ci-glow/20 flex items-center justify-center text-[11px] font-bold text-ci-accent hover:bg-ci-accent/30 transition-colors"
            aria-label="User menu"
          >
            {user?.picture
              ? <img src={user.picture} alt={displayName} className="w-full h-full rounded-full object-cover" />
              : initials}
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 glass-strong rounded-xl py-1 min-w-[160px] z-50">
              <div className="px-4 py-2 border-b border-white/8">
                <p className="text-xs font-semibold text-white truncate">{displayName}</p>
                <p className="text-[10px] text-ci-muted truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-2 text-xs text-ci-muted hover:text-ci-critical hover:bg-ci-critical/10 transition-colors"
              >
                <LogOut size={13} /> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

