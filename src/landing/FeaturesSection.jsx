import React from "react";
import Reveal from "@/components/Reveal";
import { features } from "@/lib/cloudintercept-data";
import { Activity, ShieldAlert, BarChart3, Network, Siren, Database, Shield } from "lucide-react";

const iconMap = {
  Activity,
  ShieldAlert,
  BarChart3,
  Network,
  Siren,
  Database,
};

export default function FeaturesSection() {
  return (
    <section id="features" className="relative z-10 bg-gradient-to-b from-ci-bg to-ci-surface py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ci-glow">
            Platform Capabilities
          </p>
          <h2
            className="mt-3 font-semibold text-white tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Everything You Need to Understand Your Cloud Security
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const Icon = iconMap[f.icon] ?? Shield;
            return (
              <Reveal key={f.title} delay={i * 70}>
                <div className="group relative h-full overflow-hidden rounded-2xl glass p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-ci-glow/30">
                  <div
                    className="pointer-events-none absolute -right-10 -top-10 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                    style={{ background: "radial-gradient(circle, rgba(32,196,232,0.18) 0%, transparent 70%)" }}
                  />
                  <div className="relative w-12 h-12 rounded-xl bg-ci-accent/12 flex items-center justify-center mb-5">
                    <Icon className="w-6 h-6 text-ci-accent" />
                  </div>
                  <h3 className="relative text-lg font-semibold text-white">{f.title}</h3>
                  <p className="relative mt-2.5 text-sm text-ci-muted leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
