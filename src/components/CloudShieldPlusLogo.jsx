import { Shield } from "lucide-react";

export default function CloudShieldPlusLogo({ height = 40 }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div
        className="rounded-xl bg-ci-accent/20 flex items-center justify-center"
        style={{ width: height, height: height }}
      >
        <Shield
          style={{ width: height * 0.55, height: height * 0.55 }}
          className="text-ci-accent"
        />
      </div>
      <div className="leading-tight">
        <p className="font-bold text-white" style={{ fontSize: height * 0.38 }}>
          CloudShieldPlus
        </p>
        <p
          className="text-ci-muted uppercase tracking-widest"
          style={{ fontSize: height * 0.22 }}
        >
          Cloud Security
        </p>
      </div>
    </div>
  );
}
