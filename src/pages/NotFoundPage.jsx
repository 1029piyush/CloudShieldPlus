import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import HeroClouds from "@/components/HeroClouds";

export default function NotFoundPage() {
  useEffect(() => { document.title = "CloudShieldPlus — Page Not Found"; }, []);
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-ci-bg">
      <HeroClouds />
      <div className="relative z-10 glass rounded-2xl glow-cyan p-12 text-center max-w-md mx-4">
        <p className="text-6xl font-bold text-gradient-cyan mb-4">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Page Not Found</h1>
        <p className="text-ci-muted text-sm mb-6">
          The page you are looking for does not exist or has been moved.
        </p>
        <Button asChild>
          <Link to="/">Back to Home</Link>
        </Button>
      </div>
    </div>
  );
}
