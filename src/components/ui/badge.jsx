import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider transition-colors",
  {
    variants: {
      variant: {
        default:  "border-transparent bg-ci-accent/20 text-ci-accent",
        critical: "bg-ci-critical/15 text-ci-critical border-ci-critical/40",
        high:     "bg-ci-warning/15 text-ci-warning border-ci-warning/40",
        medium:   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
        low:      "bg-ci-secure/15 text-ci-secure border-ci-secure/40",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export function Badge({ className, variant, ...props }) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { badgeVariants };
