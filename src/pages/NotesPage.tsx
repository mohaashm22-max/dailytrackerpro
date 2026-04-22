import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLocalState } from "@/lib/storage";
import { cn } from "@/lib/utils";

interface Note {
  id: string;
  title: string;
  body: string;
  updatedAt: number;
}

function newNote(): Note {
  return {
    id: crypto.randomUUID(),
    title: "Untitled note",
    body: "",
    updatedAt: Date.now(),
  };
}

export default function NotesPage() {
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
      (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q)
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Notes</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Free-form thoughts, reminders, and ideas.
          </p>
        </div>
        <Button onClick={create} className="gap-2">
          <Plus className="h-4 w-4" />
          New note
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
                placeholder="Search notes…"
                className="pl-8 h-9 bg-card"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                {notes.length === 0 ? "No notes yet — create one." : "No matches."}
              </div>
            ) : (
              <ul className="p-2 space-y-1">
                {filtered.map((n) => (
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
                          {n.body.split("\n")[0] || "No content"}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(n.updatedAt, "MMM d, p")}
                        </p>
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
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Editor */}
        <section className="flex flex-col">
          {active ? (
            <>
              <div className="px-5 pt-5" dir="ltr">
                <Input
                  value={active.title}
                  onChange={(e) => update({ title: e.target.value })}
                  dir="ltr"
                  className="text-xl md:text-2xl font-bold border-0 px-0 focus-visible:ring-0 shadow-none h-auto bg-transparent text-left"
                  placeholder="Note title"
                />
                <p className="text-xs text-muted-foreground mt-1 text-left">
                  Last updated {format(active.updatedAt, "PPp")}
                </p>
              </div>
              <Textarea
                value={active.body}
                onChange={(e) => update({ body: e.target.value })}
                placeholder="Start writing…"
                dir="ltr"
                className="flex-1 m-5 mt-4 min-h-[40vh] resize-none border-0 bg-muted/30 focus-visible:ring-1 text-base leading-relaxed text-left"
              />
            </>
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
