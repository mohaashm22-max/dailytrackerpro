import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { startDate, endDate, isInTracker } from "@/lib/dates";
import { toast } from "@/hooks/use-toast";
import {
  bulkAddBlock,
  bulkAddSection,
  bulkAddTask,
  ScheduleScope,
} from "@/lib/bulkSchedule";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialDate?: Date | null;
  onSaved?: () => void;
}

type Mode = "task" | "section" | "block";
type Range = "single" | "range" | "all-year";

function DatePickerField({
  value,
  onChange,
  label,
  placeholder = "Pick a date",
}: {
  value: Date | undefined;
  onChange: (d: Date | undefined) => void;
  label: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-9",
              !value && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={onChange}
            defaultMonth={value ?? startDate}
            disabled={(d) => !isInTracker(d)}
            initialFocus
            className={cn("p-3 pointer-events-auto")}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const isRTL = (s: string) => /[\u0600-\u06FF]/.test(s);

export default function QuickAddDialog({
  open,
  onOpenChange,
  initialDate,
  onSaved,
}: Props) {
  const [mode, setMode] = useState<Mode>("task");
  const [range, setRange] = useState<Range>("single");
  const [single, setSingle] = useState<Date | undefined>(initialDate ?? undefined);
  const [start, setStart] = useState<Date | undefined>(initialDate ?? undefined);
  const [end, setEnd] = useState<Date | undefined>(undefined);

  // Task fields
  const [taskText, setTaskText] = useState("");
  const [taskBlock, setTaskBlock] = useState("Tasks");
  const [taskSection, setTaskSection] = useState("");

  // Section fields
  const [sectionBlock, setSectionBlock] = useState("Tasks");
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionInitialTasksRaw, setSectionInitialTasksRaw] = useState("");

  // Block fields
  const [blockTitle, setBlockTitle] = useState("");
  const [blockSectionsRaw, setBlockSectionsRaw] = useState("");

  useEffect(() => {
    if (!open) return;
    setSingle(initialDate ?? undefined);
    setStart(initialDate ?? undefined);
    setEnd(undefined);
    setRange("single");
    setMode("task");
    setTaskText("");
    setTaskBlock("Tasks");
    setTaskSection("");
    setSectionBlock("Tasks");
    setSectionTitle("");
    setSectionInitialTasksRaw("");
    setBlockTitle("");
    setBlockSectionsRaw("");
  }, [open, initialDate]);

  const scope: ScheduleScope | null = useMemo(() => {
    if (range === "all-year") return { kind: "all-year" };
    if (range === "single") return single ? { kind: "single", date: single } : null;
    if (start && end && start <= end) return { kind: "range", start, end };
    return null;
  }, [range, single, start, end]);

  const handleSave = () => {
    if (!scope) {
      toast({ title: "Pick a date first", variant: "destructive" });
      return;
    }

    if (mode === "task") {
      const text = taskText.trim();
      if (!text) {
        toast({ title: "Task text is required", variant: "destructive" });
        return;
      }
      const block = taskBlock.trim() || "Tasks";
      const section = taskSection.trim();
      const target = section
        ? ({ kind: "section", blockTitle: block, title: section } as const)
        : ({ kind: "block", title: block } as const);
      const n = bulkAddTask(scope, { text, target });
      toast({
        title: "Task added",
        description: `Applied to ${n} day${n === 1 ? "" : "s"}.`,
      });
    } else if (mode === "section") {
      const title = sectionTitle.trim();
      if (!title) {
        toast({ title: "Section title is required", variant: "destructive" });
        return;
      }
      const initialTasks = sectionInitialTasksRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const n = bulkAddSection(scope, {
        blockTitle: sectionBlock.trim() || "Tasks",
        title,
        initialTasks,
      });
      toast({
        title: "Section added",
        description: `Applied to ${n} day${n === 1 ? "" : "s"}.`,
      });
    } else {
      const title = blockTitle.trim();
      if (!title) {
        toast({ title: "Block title is required", variant: "destructive" });
        return;
      }
      // Each line: "Section title: task1, task2, task3" — task list optional.
      const sections = blockSectionsRaw
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [secTitle, ...rest] = line.split(":");
          const tasksPart = rest.join(":");
          const tasks = tasksPart
            ? tasksPart.split(",").map((t) => t.trim()).filter(Boolean)
            : [];
          return { title: secTitle.trim(), tasks };
        });
      const n = bulkAddBlock(scope, { title, sections });
      toast({
        title: "Block created",
        description: `Applied to ${n} day${n === 1 ? "" : "s"}.`,
      });
    }

    onSaved?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick add</DialogTitle>
          <DialogDescription>
            Add a task, a whole section, or an entire block to one day, a date range, or every day of the year.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="section">Section</TabsTrigger>
            <TabsTrigger value="block">Block</TabsTrigger>
          </TabsList>

          {/* Task tab */}
          <TabsContent value="task" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-text" className="text-xs">Task</Label>
              <Input
                id="task-text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                dir={isRTL(taskText) ? "rtl" : "ltr"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Block</Label>
                <Input
                  value={taskBlock}
                  onChange={(e) => setTaskBlock(e.target.value)}
                  dir={isRTL(taskBlock) ? "rtl" : "ltr"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Section (optional)</Label>
                <Input
                  value={taskSection}
                  onChange={(e) => setTaskSection(e.target.value)}
                  dir={isRTL(taskSection) ? "rtl" : "ltr"}
                />
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Block and section will be created on each selected day if they don't exist yet.
            </p>
          </TabsContent>

          {/* Section tab */}
          <TabsContent value="section" className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Block</Label>
                <Input
                  value={sectionBlock}
                  onChange={(e) => setSectionBlock(e.target.value)}
                  dir={isRTL(sectionBlock) ? "rtl" : "ltr"}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Section title</Label>
                <Input
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  dir={isRTL(sectionTitle) ? "rtl" : "ltr"}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec-tasks" className="text-xs">
                Starter tasks (one per line, optional)
              </Label>
              <Textarea
                id="sec-tasks"
                value={sectionInitialTasksRaw}
                onChange={(e) => setSectionInitialTasksRaw(e.target.value)}
                rows={4}
                dir={isRTL(sectionInitialTasksRaw) ? "rtl" : "ltr"}
              />
            </div>
          </TabsContent>

          {/* Block tab */}
          <TabsContent value="block" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="block-title" className="text-xs">Block title</Label>
              <Input
                id="block-title"
                value={blockTitle}
                onChange={(e) => setBlockTitle(e.target.value)}
                dir={isRTL(blockTitle) ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="block-sections" className="text-xs">
                Sections (one per line — format: <code className="text-[10px]">Section title: task1, task2</code>)
              </Label>
              <Textarea
                id="block-sections"
                value={blockSectionsRaw}
                onChange={(e) => setBlockSectionsRaw(e.target.value)}
                rows={5}
                dir={isRTL(blockSectionsRaw) ? "rtl" : "ltr"}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Scheduling scope */}
        <div className="mt-2 space-y-3 rounded-lg border border-border bg-muted/30 p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Apply to
            </Label>
            <div className="flex items-center gap-2">
              <Label htmlFor="all-year" className="text-xs text-muted-foreground">
                All year
              </Label>
              <Switch
                id="all-year"
                checked={range === "all-year"}
                onCheckedChange={(v) => setRange(v ? "all-year" : "single")}
              />
            </div>
          </div>

          {range !== "all-year" && (
            <RadioGroup
              value={range}
              onValueChange={(v) => setRange(v as Range)}
              className="flex gap-4"
            >
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="single" id="r-single" />
                Single day
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <RadioGroupItem value="range" id="r-range" />
                Date range
              </label>
            </RadioGroup>
          )}

          {range === "single" && (
            <DatePickerField value={single} onChange={setSingle} label="Date" />
          )}
          {range === "range" && (
            <div className="grid grid-cols-2 gap-3">
              <DatePickerField value={start} onChange={setStart} label="Start" />
              <DatePickerField value={end} onChange={setEnd} label="End" />
            </div>
          )}
          {range === "all-year" && (
            <p className="text-xs text-muted-foreground">
              Will apply to every day from {format(startDate, "MMM d")} – {format(endDate, "MMM d, yyyy")}.
            </p>
          )}
        </div>

        <DialogFooter className="mt-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Add</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
