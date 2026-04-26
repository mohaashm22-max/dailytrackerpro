import { cn } from "@/lib/utils";

interface FlagProps {
  /** ISO 3166-1 alpha-2 country code (case-insensitive). */
  country: string | null | undefined;
  /** Optional alt text. */
  alt?: string;
  className?: string;
}

/**
 * Render a country flag as an image from flagcdn.com.
 * Works on all platforms (including Windows) where Unicode flag emojis don't render.
 * Uses a 4:3 aspect ratio at 40px wide (2x for retina via srcset).
 */
export function Flag({ country, alt, className }: FlagProps) {
  if (!country) {
    return (
      <span
        aria-hidden
        className={cn(
          "inline-block w-5 h-[15px] rounded-[2px] bg-muted align-[-2px]",
          className,
        )}
      />
    );
  }
  const code = country.toLowerCase();
  return (
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={20}
      height={15}
      alt={alt ?? ""}
      loading="lazy"
      className={cn(
        "inline-block w-5 h-[15px] rounded-[2px] object-cover align-[-2px] shadow-[0_0_0_1px_hsl(var(--border))]",
        className,
      )}
    />
  );
}
