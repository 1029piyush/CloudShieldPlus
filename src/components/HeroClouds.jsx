import React, { useMemo } from "react";

/**
 * Animated anime-style cloud sky. Layered SVG clouds drift horizontally at
 * different speeds under a dark gradient overlay. Content sits above (z-10).
 * Lightweight: pure CSS transforms, no canvas. Respects prefers-reduced-motion.
 */

const CloudShape = ({ scale = 1, opacity = 0.5, tint = "#7DE8FF" }) => (
  <svg
    width={260 * scale}
    height={120 * scale}
    viewBox="0 0 260 120"
    fill="none"
    style={{ display: "block" }}
  >
    <g fill={tint} opacity={opacity}>
      <ellipse cx="80" cy="78" rx="62" ry="34" />
      <ellipse cx="135" cy="64" rx="52" ry="40" />
      <ellipse cx="185" cy="80" rx="48" ry="30" />
      <ellipse cx="115" cy="86" rx="70" ry="24" />
    </g>
  </svg>
);

const cloudConfigs = [
  { top: "8%",  scale: 1.5, opacity: 0.10, dur: 90,  dir: "r", delay: 0,   tint: "#7DE8FF" },
  { top: "22%", scale: 1.1, opacity: 0.08, dur: 120, dir: "l", delay: -30,  tint: "#38bdf8" },
  { top: "40%", scale: 1.8, opacity: 0.07, dur: 150, dir: "r", delay: -60,  tint: "#7DE8FF" },
  { top: "58%", scale: 1.2, opacity: 0.09, dur: 100, dir: "l", delay: -20,  tint: "#20C4E8" },
  { top: "70%", scale: 1.6, opacity: 0.06, dur: 140, dir: "r", delay: -80,  tint: "#38bdf8" },
  { top: "82%", scale: 1.0, opacity: 0.08, dur: 110, dir: "l", delay: -10,  tint: "#7DE8FF" },
];

export default function HeroClouds({ className = "", overlay = true }) {
  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        id: i,
        top: Math.random() * 100,
        left: Math.random() * 100,
        delay: Math.random() * 4,
        size: Math.random() > 0.7 ? 3 : 2,
      })),
    []
  );

  const particles = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        bottom: Math.random() * 60,
        delay: Math.random() * 9,
        dur: 8 + Math.random() * 6,
      })),
    []
  );

  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      aria-hidden="true"
    >
      {/* Base sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-ci-bg via-[#0a1f38] to-[#071A2F]" />

      {/* Stars */}
      <div className="absolute inset-0">
        {stars.map((s) => (
          <span
            key={s.id}
            className="ci-star"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              width: s.size,
              height: s.size,
              animationDelay: `${s.delay}s`,
            }}
          />
        ))}
      </div>

      {/* Soft radial cyan glow */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 35%, rgba(32,196,232,0.10) 0%, transparent 70%)",
        }}
      />

      {/* Moving clouds */}
      <div className="absolute inset-0">
        {cloudConfigs.map((c, i) => (
          <div
            key={i}
            className="ci-cloud"
            style={{
              top: c.top,
              left: 0,
              animation: `ci-drift-${c.dir} ${c.dur}s linear ${c.delay}s infinite`,
            }}
          >
            <CloudShape scale={c.scale} opacity={c.opacity} tint={c.tint} />
          </div>
        ))}
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="ci-particle"
            style={{
              left: `${p.left}%`,
              bottom: `${p.bottom}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.dur}s`,
            }}
          />
        ))}
      </div>

      {/* Dark gradient overlay above clouds, below content */}
      {overlay && (
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(6,20,38,0.25) 0%, rgba(6,20,38,0.55) 45%, rgba(6,20,38,0.92) 100%)",
          }}
        />
      )}
    </div>
  );
}
