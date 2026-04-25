import { useMemo, useState } from "react";
import {
  addDays,
  format as dfFormat,
  parseISO,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { dateKey, startDate, endDate } from "@/lib/dates";
import { loadJSON } from "@/lib/storage";
import { computeDayStats, DayState, emptyDayState } from "@/lib/dayProgress";
import { COMMON_CATEGORIES } from "@/data/template";
import { useLanguage } from "@/contexts/LanguageContext";

interface DayRow {
  date: Date;
  key: string;
  done: number;
  total: number;
  percent: number;
  perCategory: { id: string; title: string; done: number; total: number }[];
}

function buildAllDays(): DayRow[] {
  const out: DayRow[] = [];
  let d = startDate;
  while (d <= endDate) {
    const k = dateKey(d);
    const s = loadJSON<DayState>(`day:${k}`, emptyDayState);
    const st = computeDayStats(s);
    out.push({
      date: d,
      key: k,
      done: st.done,
      total: st.total,
      percent: st.percent,
      perCategory: st.perCategory,
    });
    d = addDays(d, 1);
  }
  return out;
}

const COLORS = [
  "hsl(215 70% 55%)",
  "hsl(160 55% 50%)",
  "hsl(35 92% 60%)",
  "hsl(280 60% 60%)",
  "hsl(190 70% 55%)",
  "hsl(340 70% 60%)",
  "hsl(120 50% 50%)",
  "hsl(45 90% 55%)",
  "hsl(255 60% 65%)",
];

export default function AnalysisPage() {
  const { t, format } = useLanguage();
  const allDays = useMemo(buildAllDays, []);
  const today = new Date();
  const defaultMonth = today >= startDate && today <= endDate ? today : startDate;
  const [monthKey, setMonthKey] = useState(format(defaultMonth, "yyyy-MM"));

  const months = useMemo(() => {
    const set = new Set<string>();
    allDays.forEach((r) => set.add(format(r.date, "yyyy-MM")));
    return Array.from(set);
  }, [allDays]);

  const monthDate = parseISO(monthKey + "-01");
  const monthDays = useMemo(
    () =>
      allDays.filter((r) =>
        isWithinInterval(r.date, {
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate),
        })
      ),
    [allDays, monthKey]
  );

  // Yearly: aggregate per month
  const yearly = useMemo(() => {
    const map = new Map<string, { done: number; total: number; days: number; tracked: number }>();
    allDays.forEach((r) => {
      const mk = format(r.date, "yyyy-MM");
      const cur = map.get(mk) ?? { done: 0, total: 0, days: 0, tracked: 0 };
      cur.done += r.done;
      cur.total += r.total;
      cur.days += 1;
      if (r.done > 0) cur.tracked += 1;
      map.set(mk, cur);
    });
    return Array.from(map.entries()).map(([mk, v]) => ({
      month: format(parseISO(mk + "-01"), "MMM"),
      monthKey: mk,
      avgPercent: v.total ? Math.round((v.done / v.total) * 100) : 0,
      tracked: v.tracked,
      days: v.days,
    }));
  }, [allDays]);

  // Year stats
  const yearStats = useMemo(() => {
    const tracked = allDays.filter((r) => r.done > 0).length;
    const totalDays = allDays.length;
    const totalDone = allDays.reduce((n, r) => n + r.done, 0);
    const totalTasks = allDays.reduce((n, r) => n + r.total, 0);
    // Streak (current, ending today or last tracked)
    let bestStreak = 0;
    let currentStreak = 0;
    let temp = 0;
    allDays.forEach((r) => {
      if (r.percent >= 0.5) {
        temp++;
        if (temp > bestStreak) bestStreak = temp;
      } else {
        temp = 0;
      }
    });
    // current streak: count back from today
    for (let i = allDays.length - 1; i >= 0; i--) {
      if (allDays[i].date > today) continue;
      if (allDays[i].percent >= 0.5) currentStreak++;
      else break;
    }
    return {
      tracked,
      totalDays,
      avgPercent: totalTasks ? Math.round((totalDone / totalTasks) * 100) : 0,
      totalDone,
      bestStreak,
      currentStreak,
    };
  }, [allDays]);

  // Monthly category breakdown
  const monthCategoryData = useMemo(() => {
    const acc = new Map<string, { title: string; done: number; total: number }>();
    monthDays.forEach((r) => {
      r.perCategory.forEach((c) => {
        const cur = acc.get(c.id) ?? { title: c.title, done: 0, total: 0 };
        cur.done += c.done;
        cur.total += c.total;
        acc.set(c.id, cur);
      });
    });
    return Array.from(acc.entries()).map(([id, v]) => ({
      id,
      name: v.title.replace(/[\u{1F300}-\u{1FAFF}]/gu, "").trim().slice(0, 18),
      done: v.done,
      total: v.total,
      percent: v.total ? Math.round((v.done / v.total) * 100) : 0,
    }));
  }, [monthDays]);

  const monthDailyData = monthDays.map((r) => ({
    day: format(r.date, "d"),
    percent: Math.round(r.percent * 100),
  }));

  const monthAvg = monthDays.length
    ? Math.round(
        (monthDays.reduce((n, r) => n + r.done, 0) /
          Math.max(1, monthDays.reduce((n, r) => n + r.total, 0))) *
          100
      )
    : 0;
  const monthBestDay = monthDays.reduce(
    (best, r) => (r.percent > best.percent ? r : best),
    monthDays[0] ?? { percent: 0, date: new Date() }
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("analysis.title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("analysis.subtitle")}
        </p>
      </header>

      {/* Year summary */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label={t("analysis.yearCompletion")} value={`${yearStats.avgPercent}%`} sub={t("analysis.tasksDone", { n: yearStats.totalDone })} />
        <StatCard label={t("analysis.daysTracked")} value={`${yearStats.tracked}`} sub={t("analysis.ofN", { n: yearStats.totalDays })} />
        <StatCard label={t("analysis.currentStreak")} value={`${yearStats.currentStreak}`} sub={t("analysis.daysGte50")} tone="accent" />
        <StatCard label={t("analysis.bestStreak")} value={`${yearStats.bestStreak}`} sub={t("analysis.daysGte50")} tone="primary" />
      </section>

      {/* Yearly chart */}
      <section className="rounded-2xl border border-border bg-card shadow-soft p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">{t("analysis.yearlyProgress")}</h2>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 12,
                }}
                formatter={(v: number) => [`${v}%`, t("analysis.completion")]}
              />
              <Bar dataKey="avgPercent" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Month picker */}
      <section className="rounded-2xl border border-border bg-card shadow-soft p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">{t("analysis.monthly")}</h2>
          <select
            value={monthKey}
            onChange={(e) => setMonthKey(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {months.map((m) => (
              <option key={m} value={m}>
                {format(parseISO(m + "-01"), "MMMM yyyy")}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label={t("analysis.avgCompletion")} value={`${monthAvg}%`} />
          <StatCard
            label={t("analysis.bestDay")}
            value={monthBestDay && monthBestDay.percent > 0 ? `${Math.round(monthBestDay.percent * 100)}%` : "—"}
            sub={monthBestDay && monthBestDay.percent > 0 ? format(monthBestDay.date, "MMM d") : ""}
          />
          <StatCard
            label={t("analysis.daysAt50")}
            value={`${monthDays.filter((r) => r.percent >= 0.5).length}`}
          />
          <StatCard label={t("analysis.tasksDoneShort")} value={`${monthDays.reduce((n, r) => n + r.done, 0)}`} />
        </div>

        <div>
          <h3 className="text-sm font-medium mb-2 text-muted-foreground">{t("analysis.dailyCompletion")}</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthDailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                  }}
                  formatter={(v: number) => [`${v}%`, "Completion"]}
                  labelFormatter={(l) => `Day ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="percent"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--primary))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">By category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthCategoryData} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} width={110} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                    }}
                    formatter={(v: number) => [`${v}%`, "Completion"]}
                  />
                  <Bar dataKey="percent" fill="hsl(var(--accent))" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Task share by category</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={monthCategoryData.filter((c) => c.done > 0)}
                    dataKey="done"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {monthCategoryData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "primary" | "accent";
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={
          "mt-1 text-2xl font-bold tracking-tight " +
          (tone === "primary" ? "text-primary" : tone === "accent" ? "text-accent" : "text-foreground")
        }
      >
        {value}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}
