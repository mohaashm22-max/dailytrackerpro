import { useEffect, useMemo, useState } from "react";
import { parseISO } from "date-fns";
import { Plus, Trash2, Search, CalendarIcon, Link2Off } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocalState } from "@/lib/storage";
import { cn } from "@/lib/utils";
import { dateKey, startDate, isInTracker } from "@/lib/dates";
import RichTextEditor from "@/components/RichTextEditor";
import { useLanguage } from "@/contexts/LanguageContext";

interface Note {
  id: string;
  title: string;
  body: string; // HTML
  updatedAt: number;
  linkedDate?: string | null; // YYYY-MM-DD
}

function newNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "",
    body: "",
    updatedAt: Date.now(),
    linkedDate: null,
  };
}

function stripHtml(html: string): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return div.textContent || div.innerText || "";
}

export default function NotesPage() {
  const { t, format, locale } = useLanguage();
  const [notes, setNotes] = useLocalState<Note[]>("notes", []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!activeId && notes.length) setActiveId(notes[0].id);
  }, [notes, activeId]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const sorted = [...notes].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (n) => n.title.toLowerCase().includes(q) || stripHtml(n.body).toLowerCase().includes(q)
    );
  }, [notes, query]);

  const active = notes.find((n) => n.id === activeId) ?? null;

  const create = () => {
    const n = newNote();
    setNotes((prev) => [n, ...prev]);
    setActiveId(n.id);
  };

  const update = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((prev) =>
      prev.map((n) => (n.id === active.id ? { ...n, ...patch, updatedAt: Date.now() } : n))
    );
  };

  const remove = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const linkedDateObj = active?.linkedDate ? parseISO(active.linkedDate) : undefined;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("notes.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t("notes.subtitle")}
          </p>
        </div>
        <Button onClick={create} className="gap-2">
          <Plus className="h-4 w-4" />
          {t("notes.new")}
        </Button>
      </header>

      <div className="grid md:grid-cols-[280px_1fr] gap-4 rounded-2xl border border-border bg-card shadow-soft overflow-hidden min-h-[60vh]">
        {/* List */}
        <aside className="border-b md:border-b-0 md:border-r border-border bg-muted/20 flex flex-col">
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8 h-9 bg-card"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {notes.length === 0 ? t("notes.empty") : t("notes.noMatches")}
              </div>
            ) : (
              <ul className="p-2 space-y-1">
                {filtered.map((n) => {
                  const preview = stripHtml(n.body).split("\n")[0];
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => setActiveId(n.id)}
                        className={cn(
                          "w-full text-left rounded-lg px-3 py-2.5 transition-base group flex items-start justify-between gap-2",
                          activeId === n.id
                            ? "bg-primary-soft"
                            : "hover:bg-muted/60"
                        )}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {n.title || "Untitled note"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {preview || "No content"}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[10px] text-muted-foreground">
                              {format(n.updatedAt, "MMM d, p")}
                            </p>
                            {n.linkedDate && (
                              <span className="text-[10px] text-primary inline-flex items-center gap-0.5">
                                <CalendarIcon className="h-2.5 w-2.5" />
                                {format(parseISO(n.linkedDate), "MMM d")}
                              </span>
                            )}
                          </div>
                        </div>
                        <Trash2
                          className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive shrink-0 mt-0.5"
                          onClick={(e) => {
                            e.stopPropagation();
                            remove(n.id);
                          }}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        {/* Editor */}
        <section className="flex flex-col">
          {active ? (
            <div className="flex flex-col flex-1 p-5 gap-4">
              <div dir="ltr">
                <Input
                  value={active.title}
                  onChange={(e) => update({ title: e.target.value })}
                  dir="ltr"
                  className="text-xl md:text-2xl font-bold border-0 px-0 focus-visible:ring-0 shadow-none h-auto bg-transparent text-left"
                />
                <p className="text-xs text-muted-foreground mt-1 text-left">
                  Last updated {format(active.updatedAt, "PPp")}
                </p>
              </div>

              {/* Date link */}
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Label className="text-xs text-muted-foreground">Linked day:</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-2">
                      <CalendarIcon className="h-3.5 w-3.5" />
                      {linkedDateObj ? format(linkedDateObj, "PPP") : "Link to a calendar day"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={linkedDateObj}
                      onSelect={(d) => update({ linkedDate: d ? dateKey(d) : null })}
                      defaultMonth={linkedDateObj ?? startDate}
                      disabled={(d) => !isInTracker(d)}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {active.linkedDate && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 gap-1 text-muted-foreground"
                    onClick={() => update({ linkedDate: null })}
                  >
                    <Link2Off className="h-3.5 w-3.5" />
                    Unlink
                  </Button>
                )}
              </div>

              <RichTextEditor
                value={active.body}
                onChange={(html) => update({ body: html })}
                className="flex-1"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
              Select or create a note to begin.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
