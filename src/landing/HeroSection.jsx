import React from "react";
import { Link } from "react-router-dom";
import HeroClouds from "@/components/HeroClouds";
import { ArrowRight, ShieldCheck, Activity, Bell, Network } from "lucide-react";
import { heroMetrics, DEMO_NOTE } from "@/lib/cloudintercept-data";

const toneClasses = {
  secure: "text-ci-secure",
  warning: "text-ci-warning",
  critical: "text-ci-critical",
  neutral: "text-ci-glow",
};

const dotClasses = {
  secure: "bg-ci-secure",
  warning: "bg-ci-warning",
  critical: "bg-ci-critical",
  neutral: "bg-ci-glow",
};

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden">
      <HeroClouds />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pt-28 pb-16 text-center">
        <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-xs font-medium tracking-[0.12em] uppercase text-ci-glow">
          <span className="ci-pulse w-2 h-2 rounded-full bg-ci-secure text-ci-secure" />
          Live Monitoring Preview
        </div>

        <h1
          className="mt-7 font-bold text-white leading-[1.05] tracking-tight"
          style={{ fontSize: "clamp(2.5rem, 5vw, 4.5rem)", letterSpacing: "-0.02em" }}
        >
          See Your Cloud. Detect the Threat.
          <br />
          <span className="text-gradient-cyan">Protect What Matters.</span>
        </h1>

        <p className="mt-6 mx-auto max-w-2xl text-base sm:text-lg text-ci-muted leading-relaxed">
          CloudIntercept brings cloud visibility, security monitoring, and threat
          intelligence together in one unified platform.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="group inline-flex items-center gap-2 rounded-full bg-ci-accent px-7 py-3.5 text-sm font-semibold text-ci-bg hover:bg-ci-glow transition-colors glow-cyan"
          >
            Get Started
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 rounded-full glass px-7 py-3.5 text-sm font-semibold text-white hover:border-ci-glow/40 transition-colors"
          >
            Explore Dashboard
          </Link>
        </div>
      </div>

      {/* Floating glass dashboard preview card */}
      <div className="relative z-10 mx-auto w-full max-w-4xl px-6 pb-20">
        <div className="rounded-2xl glass-strong p-5 sm:p-6 glow-cyan">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-ci-accent/15 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-ci-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">CloudIntercept Security Center</p>
                <p className="text-[11px] text-ci-muted">{DEMO_NOTE}</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ci-secure">
              <span className="ci-pulse w-1.5 h-1.5 rounded-full bg-ci-secure text-ci-secure" />
              Protected
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {heroMetrics.map((m) => (
              <div
                key={m.label}
                className="rounded-xl bg-white/[0.03] border border-white/10 px-4 py-3.5"
              >
                <p className="text-[11px] uppercase tracking-wider text-ci-muted">{m.label}</p>
                <p className={`mt-1 text-lg font-bold flex items-center gap-1.5 ${toneClasses[m.tone]}`}>
                  {m.dot && (
                    <span className={`ci-pulse w-1.5 h-1.5 rounded-full ${dotClasses[m.tone]} ${toneClasses[m.tone]}`} />
                  )}
                  {m.value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-4 text-[11px] text-ci-muted">
            <span className="inline-flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-ci-accent" /> Real-time</span>
            <span className="inline-flex items-center gap-1.5"><Network className="w-3.5 h-3.5 text-ci-accent" /> 26+ scanners</span>
            <span className="inline-flex items-center gap-1.5"><Bell className="w-3.5 h-3.5 text-ci-accent" /> Alerting</span>
          </div>
        </div>
      </div>
    </section>
  );
}
