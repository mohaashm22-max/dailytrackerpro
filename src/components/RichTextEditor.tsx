import { useEffect, useRef } from "react";
import { Bold, Italic, List, ListOrdered } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (html: string) => void;
  className?: string;
  dir?: "ltr" | "rtl";
}

/**
 * Lightweight rich text editor based on contentEditable + document.execCommand.
 * Supports bold, italic, bullet and numbered lists. Stores HTML.
 */
export default function RichTextEditor({ value, onChange, className, dir = "ltr" }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Keep DOM in sync when external value changes (e.g. switching active note)
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || "";
    }
  }, [value]);

  const exec = (command: string) => {
    document.execCommand(command, false);
    if (ref.current) onChange(ref.current.innerHTML);
    ref.current?.focus();
  };

  return (
    <div className={cn("flex flex-col rounded-lg border border-border bg-card overflow-hidden", className)}>
      <div className="flex items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
        <ToolbarButton icon={Bold} label="Bold" onClick={() => exec("bold")} />
        <ToolbarButton icon={Italic} label="Italic" onClick={() => exec("italic")} />
        <span className="mx-1 h-4 w-px bg-border" />
        <ToolbarButton icon={List} label="Bullet list" onClick={() => exec("insertUnorderedList")} />
        <ToolbarButton icon={ListOrdered} label="Numbered list" onClick={() => exec("insertOrderedList")} />
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        dir={dir}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="flex-1 min-h-[40vh] p-4 text-base leading-relaxed outline-none focus:ring-1 focus:ring-ring rounded-b-lg [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6"
      />
    </div>
  );
}

function ToolbarButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      className="h-7 w-7 p-0"
      onMouseDown={(e) => {
        e.preventDefault();
        onClick();
      }}
      aria-label={label}
      title={label}
    >
      <Icon className="h-3.5 w-3.5" />
    </Button>
  );
}
