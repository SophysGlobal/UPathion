import { useSyncExternalStore, useCallback } from "react";
import { useAdminStatus } from "./useAdminStatus";

/**
 * Admin-only plan simulation. Lets admins toggle between Free/Premium
 * locally to validate gating without touching real Stripe state.
 *
 * Storage:
 *   localStorage["upathion_simulated_plan"] = "free" | "premium" | undefined
 * When undefined, admins default to "premium" (Part A requirement).
 */

const KEY = "upathion_simulated_plan";
const EVENT = "upathion-plan-sim-changed";

export type SimulatedPlan = "free" | "premium";

const subscribe = (cb: () => void) => {
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) cb();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(EVENT, cb);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(EVENT, cb);
  };
};

const getSnapshot = (): SimulatedPlan | null => {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "free" || v === "premium" ? v : null;
};

const getServerSnapshot = (): SimulatedPlan | null => null;

export const useSimulatedPlan = () =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

export const usePlanSimulation = () => {
  const { isAdmin } = useAdminStatus();
  const stored = useSimulatedPlan();

  // Admins default to premium when no preference stored.
  const effective: SimulatedPlan | null = isAdmin ? stored ?? "premium" : null;

  const setPlan = useCallback((plan: SimulatedPlan) => {
    window.localStorage.setItem(KEY, plan);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  const togglePlan = useCallback(() => {
    const current = (window.localStorage.getItem(KEY) as SimulatedPlan | null) ?? "premium";
    const next: SimulatedPlan = current === "premium" ? "free" : "premium";
    setPlan(next);
  }, [setPlan]);

  return {
    isAdmin,
    /** Effective simulated plan for admins, null for non-admins. */
    simulatedPlan: effective,
    setPlan,
    togglePlan,
  };
};

/**
 * Apply admin/simulation override to a raw is_premium flag.
 * - Non-admin: returns the raw value.
 * - Admin: returns simulated plan === "premium" (defaults to premium).
 */
export const applyPlanOverride = (
  rawIsPremium: boolean,
  isAdmin: boolean,
  simulated: SimulatedPlan | null,
): boolean => {
  if (!isAdmin) return rawIsPremium;
  return (simulated ?? "premium") === "premium";
};
