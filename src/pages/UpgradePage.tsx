import { useState } from "react";
import { toast } from "sonner";
import { Check, Loader2, Sparkles, Star, Shield, Zap, Infinity as InfinityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import PremiumBadge from "@/components/PremiumBadge";
import { cn } from "@/lib/utils";

type Cycle = "monthly" | "yearly";

export default function UpgradePage() {
  const { t } = useLanguage();
  const { isPremium, subscription } = useSubscription();
  const [pending, setPending] = useState<Cycle | null>(null);

  const startCheckout = async (cycle: Cycle) => {
    setPending(cycle);
    try {
      // Checkout is wired to the payment provider once payments are enabled
      // on the workspace. Until then, inform the user instead of failing silently.
      await new Promise((r) => setTimeout(r, 400));
      toast.error(t("upgrade.checkoutUnavailable"));
    } finally {
      setPending(null);
    }
  };

  const plans: {
    cycle: Cycle;
    price: string;
    per: string;
    note: string;
    best?: boolean;
  }[] = [
    { cycle: "monthly", price: "$9.99", per: t("upgrade.perMonth"), note: t("upgrade.monthlyNote") },
    { cycle: "yearly", price: "$99", per: t("upgrade.perYear"), note: t("upgrade.yearlyNote"), best: true },
  ];

  const benefits = [
    { icon: InfinityIcon, title: t("upgrade.b1.title"), desc: t("upgrade.b1.desc") },
    { icon: Star, title: t("upgrade.b2.title"), desc: t("upgrade.b2.desc") },
    { icon: Zap, title: t("upgrade.b3.title"), desc: t("upgrade.b3.desc") },
    { icon: Shield, title: t("upgrade.b4.title"), desc: t("upgrade.b4.desc") },
  ];

  const compare = [
    { label: t("upgrade.cmp.core"), free: true, premium: true },
    { label: t("upgrade.cmp.files"), free: t("upgrade.cmp.files5"), premium: t("upgrade.cmp.unlimited") },
    { label: t("upgrade.cmp.size"), free: "10 MB", premium: "100 MB" },
    { label: t("upgrade.cmp.badge"), free: false, premium: true },
    { label: t("upgrade.cmp.ai"), free: false, premium: t("upgrade.cmp.soon") },
    { label: t("upgrade.cmp.analytics"), free: false, premium: true },
  ];

  const faqs = [1, 2, 3, 4, 5].map((n) => ({
    q: t(`upgrade.faq${n}.q`),
    a: t(`upgrade.faq${n}.a`),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:px-8 space-y-12">
      <header className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          {t("upgrade.eyebrow")}
        </div>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">{t("upgrade.title")}</h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground md:text-base">
          {t("upgrade.subtitle")}
        </p>
        {isPremium && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <PremiumBadge />
            <span className="text-sm text-muted-foreground">
              {subscription?.current_period_end
                ? t("upgrade.renews", {
                    date: new Date(subscription.current_period_end).toLocaleDateString(),
                  })
                : t("upgrade.active")}
            </span>
          </div>
        )}
      </header>

      {/* Pricing */}
      <section className="grid gap-5 md:grid-cols-2">
        {plans.map((p) => (
          <Card
            key={p.cycle}
            className={cn(
              "relative overflow-hidden",
              p.best && "border-primary shadow-soft ring-1 ring-primary/30",
            )}
          >
            {p.best && (
              <span className="absolute end-4 top-4 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground">
                {t("upgrade.bestValue")}
              </span>
            )}
            <CardHeader>
              <CardTitle className="text-lg">
                {p.cycle === "monthly" ? t("upgrade.monthly") : t("upgrade.yearly")}
              </CardTitle>
              <CardDescription>{p.note}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-end gap-1">
                <span className="text-4xl font-bold tracking-tight">{p.price}</span>
                <span className="pb-1.5 text-sm text-muted-foreground">/{p.per}</span>
              </div>
              <ul className="space-y-2 text-sm">
                {[t("upgrade.b1.title"), t("upgrade.b2.title"), t("upgrade.b3.title"), t("upgrade.b4.title")].map(
                  (f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {f}
                    </li>
                  ),
                )}
              </ul>
              <Button
                className="w-full"
                variant={p.best ? "default" : "outline"}
                disabled={isPremium || pending !== null}
                onClick={() => startCheckout(p.cycle)}
              >
                {pending === p.cycle && <Loader2 className="h-4 w-4 animate-spin" />}
                {isPremium ? t("upgrade.currentPlan") : t("upgrade.choose")}
              </Button>
              <p className="text-center text-[11px] text-muted-foreground">
                {t("upgrade.paymentMethods")}
              </p>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Benefits */}
      <section className="grid gap-4 sm:grid-cols-2">
        {benefits.map((b) => (
          <div key={b.title} className="flex gap-3 rounded-xl border border-border p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
              <b.icon className="h-4.5 w-4.5" />
            </div>
            <div>
              <p className="text-sm font-medium">{b.title}</p>
              <p className="text-xs text-muted-foreground">{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Comparison */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("upgrade.compare")}</h2>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="p-3 text-start font-medium">{t("upgrade.feature")}</th>
                <th className="p-3 font-medium">{t("upgrade.free")}</th>
                <th className="p-3 font-medium text-primary">{t("upgrade.premium")}</th>
              </tr>
            </thead>
            <tbody>
              {compare.map((row) => (
                <tr key={row.label} className="border-t border-border">
                  <td className="p-3">{row.label}</td>
                  <td className="p-3 text-center text-muted-foreground">
                    {row.free === true ? (
                      <Check className="mx-auto h-4 w-4 text-primary" />
                    ) : row.free === false ? (
                      "—"
                    ) : (
                      row.free
                    )}
                  </td>
                  <td className="p-3 text-center">
                    {row.premium === true ? (
                      <Check className="mx-auto h-4 w-4 text-primary" />
                    ) : (
                      row.premium
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">{t("upgrade.faq")}</h2>
        <Accordion type="single" collapsible className="rounded-xl border border-border px-4">
          {faqs.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-start text-sm">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
