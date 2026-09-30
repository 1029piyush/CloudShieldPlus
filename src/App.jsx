import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import ScrollToTop from "@/components/ScrollToTop";
import ProtectedRoute from "@/components/ProtectedRoute";

// Public pages
import LandingPage from "@/pages/LandingPage";
import LoginPage from "@/pages/LoginPage";
import NotFoundPage from "@/pages/NotFoundPage";

// Dashboard shell
import DashboardShell from "@/layout/DashboardShell";

// Protected pages
import DashboardOverview from "@/pages/DashboardOverview";
import FindingsExplorer from "@/pages/FindingsExplorer";
import AttackPathsView from "@/pages/AttackPathsView";
import RecommendationsView from "@/pages/RecommendationsView";
import ServicesView from "@/pages/ServicesView";
import ThreatsView from "@/pages/ThreatsView";
import ResourceMapPage from "@/pages/ResourceMapPage";
import ScansPage from "@/pages/ScansPage";
import AccountsPage from "@/pages/AccountsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsView from "@/pages/SettingsView";

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Protected dashboard routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardShell />}>
            <Route path="/dashboard"       element={<DashboardOverview />} />
            <Route path="/findings"        element={<FindingsExplorer />} />
            <Route path="/attack-paths"    element={<AttackPathsView />} />
            <Route path="/recommendations" element={<RecommendationsView />} />
            <Route path="/services"        element={<ServicesView />} />
            <Route path="/threats"         element={<ThreatsView />} />
            <Route path="/resource-map"    element={<ResourceMapPage />} />
            <Route path="/scans"           element={<ScansPage />} />
            <Route path="/accounts"        element={<AccountsPage />} />
            <Route path="/reports"         element={<ReportsPage />} />
            <Route path="/settings"        element={<SettingsView />} />
          </Route>
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  );
}
