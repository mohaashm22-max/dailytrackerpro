import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  FREE_LIMITS,
  PREMIUM_LIMITS,
  isPremiumPlan,
  type Subscription,
} from "@/lib/subscription";

interface Ctx {
  subscription: Subscription | null;
  isPremium: boolean;
  loading: boolean;
  limits: { maxFiles: number; maxFileSize: number };
  refresh: () => Promise<void>;
}

const SubscriptionContext = createContext<Ctx | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setSubscription(null);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setSubscription((data as unknown as Subscription) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isPremium = isPremiumPlan(
    subscription?.subscription_plan,
    subscription?.subscription_status,
  );

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        isPremium,
        loading,
        limits: isPremium ? PREMIUM_LIMITS : FREE_LIMITS,
        refresh,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error("useSubscription must be used within SubscriptionProvider");
  return ctx;
}
