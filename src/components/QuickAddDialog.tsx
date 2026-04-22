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
  bulkAddSection,
  bulkAddTask,
  ScheduleScope,
} from "@/lib/bulkSchedule";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional date pre-selection (e.g. opened from a calendar cell). */
  initialDate?: Date | null;
  /** Called after a successful save so the parent can refresh. */
  onSaved?: () => void;
}

type Mode = "task" | "section";
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
  const [taskTarget, setTaskTarget] = useState<"workout" | "section">("section");
  const [sectionTitleForTask, setSectionTitleForTask] = useState("Tasks");

  // Section fields
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [initialTasksRaw, setInitialTasksRaw] = useState("");

  // Reset when reopened
  useEffect(() => {
    if (!open) return;
    setSingle(initialDate ?? undefined);
    setStart(initialDate ?? undefined);
    setEnd(undefined);
    setRange("single");
    setMode("task");
    setTaskText("");
    setTaskTarget("section");
    setSectionTitleForTask("Tasks");
    setNewSectionTitle("");
    setInitialTasksRaw("");
  }, [open, initialDate]);

  const scope: ScheduleScope | null = useMemo(() => {
    if (range === "all-year") return { kind: "all-year" };
    if (range === "single") return single ? { kind: "single", date: single } : null;
    if (start && end && start <= end) return { kind: "range", start, end };
    return null;
  }, [range, single, start, end]);

  const isRTL = (s: string) => /[\u0600-\u06FF]/.test(s);

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
      const target =
        taskTarget === "workout"
          ? ({ kind: "workout" } as const)
          : ({ kind: "section", title: sectionTitleForTask.trim() || "Tasks" } as const);
      const n = bulkAddTask(scope, { text, target });
      toast({
        title: "Task added",
        description: `Applied to ${n} day${n === 1 ? "" : "s"}.`,
      });
    } else {
      const title = newSectionTitle.trim();
      if (!title) {
        toast({ title: "Section title is required", variant: "destructive" });
        return;
      }
      const initialTasks = initialTasksRaw
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
      const n = bulkAddSection(scope, { title, initialTasks });
      toast({
        title: "Section added",
        description: `Created on ${n} day${n === 1 ? "" : "s"}.`,
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
            Add a task or a whole section to one day, a date range, or every day of the year.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as Mode)} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="task">Task</TabsTrigger>
            <TabsTrigger value="section">Section</TabsTrigger>
          </TabsList>

          {/* Task tab */}
          <TabsContent value="task" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="task-text" className="text-xs">Task</Label>
              <Input
                id="task-text"
                value={taskText}
                onChange={(e) => setTaskText(e.target.value)}
                placeholder="e.g. Drink 2L of water"
                dir={isRTL(taskText) ? "rtl" : "ltr"}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Place in</Label>
              <RadioGroup
                value={taskTarget}
                onValueChange={(v) => setTaskTarget(v as "workout" | "section")}
                className="flex gap-4"
              >
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="section" id="t-section" />
                  Section
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="workout" id="t-workout" />
                  Workout block
                </label>
              </RadioGroup>
              {taskTarget === "section" && (
                <Input
                  value={sectionTitleForTask}
                  onChange={(e) => setSectionTitleForTask(e.target.value)}
                  placeholder="Section title (created if missing)"
                  className="mt-2"
                  dir={isRTL(sectionTitleForTask) ? "rtl" : "ltr"}
                />
              )}
            </div>
          </TabsContent>

          {/* Section tab */}
          <TabsContent value="section" className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="sec-title" className="text-xs">Section title</Label>
              <Input
                id="sec-title"
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="e.g. Health, Study, Habits…"
                dir={isRTL(newSectionTitle) ? "rtl" : "ltr"}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sec-tasks" className="text-xs">
                Starter tasks (one per line, optional)
              </Label>
              <Textarea
                id="sec-tasks"
                value={initialTasksRaw}
                onChange={(e) => setInitialTasksRaw(e.target.value)}
                rows={4}
                placeholder={"Task 1\nTask 2\nTask 3"}
                dir={isRTL(initialTasksRaw) ? "rtl" : "ltr"}
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
