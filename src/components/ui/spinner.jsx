import { cn } from "@/lib/utils";

export function Spinner({ className }) {
  return (
    <div
      className={cn(
        "w-8 h-8 rounded-full border-4 border-white/10 border-t-ci-accent animate-spin",
        className
      )}
    />
  );
}
