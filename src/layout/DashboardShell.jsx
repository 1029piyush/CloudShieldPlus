import { useState, useEffect } from "react";
import { Outlet, Navigate, useLocation } from "react-router-dom";
import { Server } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { DashboardProvider, useDashboard } from "@/context/DashboardContext";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import DashboardSidebar from "@/layout/DashboardSidebar";
import DashboardTopbar from "@/layout/DashboardTopbar";
import ResourceDetailDrawer from "@/components/ResourceDetailDrawer";

function ShellInner() {
  const { token, loading: authLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();

  const {
    loading,
    scanning,
    scanProgress,
    scanStage,
    selectedAccountId,
    selectedDrawerResource,
    selectedDrawerService,
    targetMapResourceId,
    targetMapAttackPathId,
    findings,
    attackPaths,
    recommendations,
    mapNodes,
    handleCloseResourceDrawer,
    handleOpenResourceDrawer,
    handleNavigateToMap,
  } = useDashboard();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-ci-bg flex items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-ci-bg flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full z-50 transition-transform duration-300
        lg:sticky lg:translate-x-0 lg:flex lg:flex-shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <DashboardSidebar />
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <DashboardTopbar onToggleSidebar={() => setSidebarOpen(v => !v)} />

        {/* Scan progress bar */}
        {scanning && (
          <div className="glass mx-4 lg:mx-6 mt-3 rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-ci-accent">{scanStage}</span>
              <span className="text-sm font-bold text-white">{scanProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-ci-accent rounded-full transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Main content */}
        <main className="flex-1 overflow-y-auto ci-scroll p-4 lg:p-6">
          {!selectedAccountId ? (
            <div className="glass rounded-2xl flex flex-col items-center justify-center text-center p-16 mt-4">
              <Server size={44} className="text-ci-muted mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">No AWS Environment Connected</h2>
              <p className="text-ci-muted max-w-md mb-5 text-sm">
                To start cloud security scans and evaluate attack pathways, connect your AWS environment credentials.
              </p>
              <Button asChild>
                <a href="/accounts">Connect AWS Account</a>
              </Button>
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-24">
              <Spinner />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {/* Resource detail drawer */}
      {selectedDrawerResource && (
        <ResourceDetailDrawer
          resourceId={selectedDrawerResource}
          serviceName={selectedDrawerService}
          findings={findings}
          attackPaths={attackPaths}
          recommendations={recommendations}
          nodes={mapNodes}
          onClose={handleCloseResourceDrawer}
          onNavigateToAttackPath={() => {}}
          onNavigateToRecommendation={() => {}}
          onNavigateToMap={handleNavigateToMap}
        />
      )}
    </div>
  );
}

export default function DashboardShell() {
  return (
    <DashboardProvider>
      <ShellInner />
    </DashboardProvider>
  );
}
