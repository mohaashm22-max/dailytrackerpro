import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { findLanguage } from "@/data/languages";

interface Props {
  /** Compact icon-only trigger (for nav bars). */
  compact?: boolean;
  align?: "start" | "center" | "end";
  className?: string;
}

export function LanguageSelector({ compact = false, align = "end", className }: Props) {
  const [open, setOpen] = useState(false);
  const { lang, setLang, t, available } = useLanguage();
  const current = findLanguage(lang);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {compact ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            aria-label={t("lang.select")}
            className={cn("h-9 gap-1.5 px-2", className)}
          >
            <span className="text-base leading-none" aria-hidden>{current?.flag ?? "🌐"}</span>
            <span className="text-xs font-medium uppercase">{current?.code ?? "en"}</span>
          </Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("min-w-[10rem] justify-between font-normal", className)}
          >
            <span className="flex items-center gap-2 truncate">
              <span aria-hidden>{current?.flag ?? "🌐"}</span>
              <span className="truncate">{current?.native ?? "English"}</span>
            </span>
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align={align}>
        <Command
          filter={(value, search) => {
            const v = value.toLowerCase();
            const s = search.toLowerCase();
            return v.includes(s) ? 1 : 0;
          }}
        >
          <CommandInput placeholder={t("lang.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup>
              {available.map((l) => (
                <CommandItem
                  key={l.code}
                  value={`${l.name} ${l.native} ${l.code}`}
                  onSelect={() => {
                    setLang(l.code);
                    setOpen(false);
                  }}
                >
                  <span className="me-2" aria-hidden>{l.flag}</span>
                  <span className="flex-1 truncate">
                    <span className="font-medium">{l.native}</span>
                    <span className="ms-2 text-xs text-muted-foreground">{l.name}</span>
                  </span>
                  <Check
                    className={cn(
                      "ms-2 h-4 w-4",
                      lang === l.code ? "opacity-100" : "opacity-0",
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
