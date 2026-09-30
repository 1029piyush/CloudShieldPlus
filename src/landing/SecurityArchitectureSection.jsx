import React from "react";
import Reveal from "@/components/Reveal";
import { architectureNodes } from "@/lib/cloudintercept-data";
import { Cloud, Network, Database, Boxes, ScanSearch, Activity, Bell } from "lucide-react";

const tierIcons = { Network, Database, Boxes };
const outIcons = { Activity, ScanSearch, Bell };

function Node({ icon: Icon, label, sub, prominent = false }) {
  return (
    <div
      className={`relative flex flex-col items-center justify-center rounded-2xl px-6 py-5 text-center transition-all duration-300 ${
        prominent
          ? "glass-strong glow-cyan min-w-[180px]"
          : "glass hover:border-ci-glow/30"
      }`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mb-2.5 ${
          prominent ? "bg-ci-accent/20" : "bg-ci-accent/12"
        }`}
      >
        <Icon className="w-6 h-6 text-ci-accent" />
      </div>
      <p className={`font-semibold tracking-wide ${prominent ? "text-white text-base" : "text-white text-sm"}`}>
        {label}
      </p>
      {sub && <p className="mt-0.5 text-[11px] uppercase tracking-wider text-ci-muted">{sub}</p>}
    </div>
  );
}

function Connector() {
  return (
    <div className="relative mx-auto h-10 w-px overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-ci-accent/40 to-ci-accent/10" />
      <div
        className="absolute left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-ci-glow"
        style={{ animation: "ci-particle 3s linear infinite", position: "absolute", top: 0 }}
      />
    </div>
  );
}

export default function SecurityArchitecture() {
  return (
    <section id="security" className="relative z-10 bg-ci-surface py-24 overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(32,196,232,0.08) 0%, transparent 70%)" }}
      />
      <div className="relative mx-auto max-w-5xl px-6">
        <Reveal className="text-center max-w-2xl mx-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ci-glow">
            How It Works
          </p>
          <h2
            className="mt-3 font-semibold text-white tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            A Connected View of Your Cloud Security
          </h2>
          <p className="mt-4 text-sm text-ci-muted">
            CloudIntercept sits between your environment and your response â€”
            ingesting signals, analyzing them, and surfacing what matters.
          </p>
        </Reveal>

        <Reveal className="mt-14 flex flex-col items-center">
          {/* Source */}
          <Node icon={Cloud} label={architectureNodes.source.label} sub={architectureNodes.source.sub} />

          <Connector />

          {/* Tier row */}
          <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {architectureNodes.tier.map((t) => (
              <Node key={t.label} icon={tierIcons[t.icon]} label={t.label} />
            ))}
          </div>

          <Connector />

          {/* Core */}
          <Node icon={ScanSearch} label={architectureNodes.core.label} sub={architectureNodes.core.sub} prominent />

          <Connector />

          {/* Output row */}
          <div className="grid w-full grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {architectureNodes.output.map((t) => (
              <Node key={t.label} icon={outIcons[t.icon]} label={t.label} />
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
