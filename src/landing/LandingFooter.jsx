import React from "react";
import { Link } from "react-router-dom";
import CloudInterceptLogo from "@/components/CloudInterceptLogo";

const cols = [
  {
    title: "Product",
    links: ["Security", "Features", "Dashboard", "Documentation"],
  },
  {
    title: "Resources",
    links: ["Monitoring", "Analytics", "Architecture", "Status"],
  },
  {
    title: "Company",
    links: ["About", "Contact", "Legal", "Privacy"],
  },
];

export default function LandingFooter() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-ci-bg/80">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <CloudInterceptLogo height={40} />
            <p className="mt-4 text-sm font-medium tracking-[0.18em] uppercase text-ci-muted">
              Data Intelligence &amp; Security
            </p>
            <p className="mt-4 text-sm text-ci-muted/80 max-w-xs leading-relaxed">
              Unified cloud visibility, security monitoring, and threat
              intelligence for modern cloud environments.
            </p>
          </div>

          {cols.map((c) => (
            <div key={c.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.15em] text-ci-glow/80">
                {c.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {c.links.map((l) => (
                  <li key={l}>
                    <a
                      href="#"
                      className="text-sm text-ci-muted hover:text-white transition-colors"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ci-muted/70">
            Â© 2026 CloudIntercept. All rights reserved.
          </p>
          <p className="text-xs text-ci-muted/60">
            Demo interface â€” sample data shown for illustration.
          </p>
        </div>
      </div>
    </footer>
  );
}
