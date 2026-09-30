import React from "react";

const LOGO_URL =
  "https://media.base44.com/images/public/user_6abbcdd6ac04fc828f779002/85f993673_3cec1d620_Screenshot2026-09-29192327.png";

/**
 * Official CloudIntercept brand logo (provided asset, used unmodified).
 * Renders the full lockup. Pass `height` (px) to scale; width auto-keeps ratio.
 */
export default function CloudInterceptLogo({ height = 40, className = "", blend = true }) {
  return (
    <img
      src={LOGO_URL}
      alt="CloudIntercept — Data Intelligence & Security"
      height={height}
      style={{
        height: `${height}px`,
        width: "auto",
        // The source asset is an opaque screenshot with a dark-navy background
        // (~#07172E), slightly darker than our theme surfaces. `lighten` replaces
        // that darker background with the surface behind it (no residue) while
        // keeping the brighter cyan logo — so it reads as a seamless glow, not a
        // pasted box.
        mixBlendMode: blend ? "lighten" : "normal",
        filter: blend ? "drop-shadow(0 0 10px rgba(125,232,255,0.28))" : "none",
      }}
      className={`object-contain select-none ${className}`}
      draggable={false}
    />
  );
}