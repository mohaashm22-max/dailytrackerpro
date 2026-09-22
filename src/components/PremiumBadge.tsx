import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

export default function PremiumBadge({
  className,
  size = "sm",
}: {
  className?: string;
  size?: "xs" | "sm";
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft font-semibold text-primary",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs",
        className,
      )}
    >
      <Star className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} fill="currentColor" />
      Premium
    </span>
  );
}
