import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  status?: string | null;
  size?: "sm" | "md";
  className?: string;
  showLabel?: boolean;
}

/**
 * Small shield-check badge rendered next to a user's name when their student
 * status has been verified via institutional email.
 */
const VerifiedBadge = ({ status, size = "sm", className, showLabel = false }: VerifiedBadgeProps) => {
  if (status !== "verified") return null;
  const dim = size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  return (
    <span
      title="Verified student"
      aria-label="Verified student"
      className={cn(
        "inline-flex items-center gap-1 text-primary",
        className,
      )}
    >
      <BadgeCheck className={cn(dim, "fill-primary/20 stroke-primary")} strokeWidth={2.25} />
      {showLabel && <span className="text-[10px] font-semibold uppercase tracking-wide">Verified</span>}
    </span>
  );
};

export default VerifiedBadge;