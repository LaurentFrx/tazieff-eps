"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "./useAuth";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isAcademicEmail } from "@/lib/auth/academic-domains";

type Plan = "free" | "pro";

type UsePlanResult = {
  plan: Plan;
  isPro: boolean;
  isLoading: boolean;
};

const ORG_CODE_KEY = "tazieff-org-code";
const PLAN_CACHE_KEY = "tazieff-plan-cache";
const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

type PlanCache = { plan: Plan; timestamp: number };

function readPlanCache(): PlanCache | null {
  try {
    const raw = localStorage.getItem(PLAN_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlanCache;
    if (Date.now() - parsed.timestamp > CACHE_MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePlanCache(plan: Plan) {
  try {
    const cache: PlanCache = { plan, timestamp: Date.now() };
    localStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* ignore */
  }
}

export function usePlan(): UsePlanResult {
  const { user, isLoading: authLoading } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [isLoading, setIsLoading] = useState(true);

  const checkPlan = useCallback(async () => {
    // Priority 1: academic email → instant Pro
    if (user?.email && isAcademicEmail(user.email)) {
      setPlan("pro");
      writePlanCache("pro");
      setIsLoading(false);
      return;
    }

    // Priority 2: organization code
    const code = localStorage.getItem(ORG_CODE_KEY);
    if (!code) {
      setPlan("free");
      writePlanCache("free");
      setIsLoading(false);
      return;
    }

    // Try online check
    if (navigator.onLine) {
      const supabase = getSupabaseBrowserClient();
      if (supabase) {
        try {
          const { data } = await supabase
            .from("organizations")
            .select("id, is_pro, pro_expires_at")
            .eq("code", code)
            .eq("is_pro", true)
            .maybeSingle();

          if (
            data &&
            (!data.pro_expires_at || new Date(data.pro_expires_at) > new Date())
          ) {
            setPlan("pro");
            writePlanCache("pro");
          } else {
            setPlan("free");
            writePlanCache("free");
          }
          setIsLoading(false);
          return;
        } catch {
          // Fall through to cache
        }
      }
    }

    // Offline fallback: use cache
    const cached = readPlanCache();
    setPlan(cached?.plan ?? "free");
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    checkPlan();
  }, [authLoading, user, checkPlan]);

  return { plan, isPro: plan === "pro", isLoading: isLoading || authLoading };
}
