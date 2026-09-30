import React from "react";
import { useEffect } from "react";
import LandingNavbar from "@/landing/LandingNavbar";
import LandingFooter from "@/landing/LandingFooter";
import HeroSection from "@/landing/HeroSection";
import TrustSection from "@/landing/TrustSection";
import FeaturesSection from "@/landing/FeaturesSection";
import SecurityArchitecture from "@/landing/SecurityArchitecture";
import DashboardPreview from "@/landing/DashboardPreview";

export default function LandingPage() {
  useEffect(() => { document.title = "CloudIntercept — Data Intelligence & Security"; }, []);

  return (
    <div className="relative min-h-screen bg-ci-bg text-white">
      <LandingNavbar />
      <main>
        <HeroSection />
        <TrustSection />
        <FeaturesSection />
        <SecurityArchitecture />
        <DashboardPreview />
      </main>
      <LandingFooter />
    </div>
  );
}
