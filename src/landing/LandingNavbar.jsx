import React, { useState } from "react";
import { Link } from "react-router-dom";
import CloudInterceptLogo from "@/components/CloudInterceptLogo";
import { Menu, X } from "lucide-react";

const links = [
  { label: "Features", href: "#features" },
  { label: "Security", href: "#security" },
  { label: "Monitoring", href: "#monitoring" },
  { label: "Analytics", href: "#analytics" },
  { label: "About", href: "#about" },
];

export default function LandingNavbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="mt-3 flex items-center justify-between rounded-2xl glass-strong px-4 sm:px-6 py-3">
          <Link to="/" className="flex items-center" aria-label="CloudIntercept home">
            <CloudInterceptLogo height={34} />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-ci-muted hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-medium text-ci-muted hover:text-white transition-colors px-3 py-2"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="text-sm font-semibold text-ci-bg bg-ci-accent hover:bg-ci-glow transition-colors px-5 py-2.5 rounded-full glow-cyan"
            >
              Get Started
            </Link>
          </div>

          <button
            className="md:hidden text-white p-2"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </nav>
      </div>

      {open && (
        <div className="md:hidden mx-4 mt-2 rounded-2xl glass-strong p-4 flex flex-col gap-1">
          {links.map((l) => (
            <a
              key={l.label}
              href={l.href}
              onClick={() => setOpen(false)}
              className="px-3 py-2.5 rounded-lg text-sm font-medium text-ci-muted hover:text-white hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <div className="h-px bg-white/10 my-2" />
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            className="px-3 py-2.5 rounded-lg text-sm font-medium text-ci-muted hover:text-white hover:bg-white/5"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            onClick={() => setOpen(false)}
            className="px-3 py-2.5 rounded-full text-sm font-semibold text-ci-bg bg-ci-accent text-center"
          >
            Get Started
          </Link>
        </div>
      )}
    </header>
  );
}
