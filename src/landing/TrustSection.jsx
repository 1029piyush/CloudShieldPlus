import React from "react";
import Reveal from "@/components/Reveal";
import { trustIndicators } from "@/lib/cloudintercept-data";
import { Eye, ShieldAlert, BrainCircuit, Network } from "lucide-react";

const icons = [Eye, ShieldAlert, BrainCircuit, Network];

export default function TrustSection() {
  return (
    <section id="about" className="relative z-10 bg-ci-bg py-24">
      <div className="mx-auto max-w-7xl px-6">
        <Reveal className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ci-glow">
            Security Visibility
          </p>
          <h2
            className="mt-3 font-semibold text-white tracking-tight"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 2.75rem)" }}
          >
            Security Visibility Starts With Knowing What Is Happening.
          </h2>
          <p className="mt-5 text-base text-ci-muted leading-relaxed">
            Cloud environments generate large amounts of network and security
            data. CloudIntercept helps turn that data into clear security
            intelligence so users can understand activity, identify suspicious
            behavior, and respond faster.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {trustIndicators.map((t, i) => {
            const Icon = icons[i];
            return (
              <Reveal key={t.title} delay={i * 80}>
                <div className="group h-full rounded-2xl glass p-6 transition-all duration-300 hover:-translate-y-1 hover:border-ci-glow/30">
                  <div className="w-11 h-11 rounded-xl bg-ci-accent/12 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-ci-accent" />
                  </div>
                  <h3 className="text-base font-semibold text-white">{t.title}</h3>
                  <p className="mt-2 text-sm text-ci-muted leading-relaxed">{t.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
