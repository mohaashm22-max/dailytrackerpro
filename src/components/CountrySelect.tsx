import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { COUNTRIES, findCountry } from "@/data/countries";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  value: string | null;
  onChange: (code: string | null) => void;
  id?: string;
  className?: string;
}

export function CountrySelect({ value, onChange, id, className }: Props) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();
  const selected = findCountry(value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <span aria-hidden>{selected.flag}</span>
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{t("country.select")}</span>
            )}
          </span>
          <ChevronsUpDown className="ms-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder={t("country.searchPlaceholder")} />
          <CommandList>
            <CommandEmpty>{t("common.noResults")}</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.name} ${c.code}`}
                  onSelect={() => {
                    onChange(c.code === value ? null : c.code);
                    setOpen(false);
                  }}
                >
                  <span className="me-2" aria-hidden>{c.flag}</span>
                  <span className="flex-1 truncate">{c.name}</span>
                  <Check
                    className={cn(
                      "ms-2 h-4 w-4",
                      selected?.code === c.code ? "opacity-100" : "opacity-0",
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
