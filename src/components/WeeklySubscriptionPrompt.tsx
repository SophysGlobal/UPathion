import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import UpgradeModal from "@/components/UpgradeModal";

const STORAGE_KEY_PREFIX = "upathion_last_sub_prompt_";
const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const INITIAL_DELAY_MS = 4000; // wait a few seconds after entering app

/**
 * Weekly subscription nudge for normal (non-admin, non-premium) users who
 * have completed onboarding. Shows a non-intrusive UpgradeModal at most once
 * every 7 days, and at most once per session.
 */
const WeeklySubscriptionPrompt = () => {
  const { user } = useAuth();
  const { profile, hasCompletedOnboarding, isLoading } = useProfileCompletion();
  const { isAdmin, isLoading: adminLoading } = useAdminStatus();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || isLoading || adminLoading) return;
    if (isAdmin) return;
    if (profile?.is_premium) return;
    if (!hasCompletedOnboarding) return;

    const key = `${STORAGE_KEY_PREFIX}${user.id}`;
    const sessionKey = `${key}_session`;

    try {
      if (sessionStorage.getItem(sessionKey) === "true") return;
      const last = Number(localStorage.getItem(key) ?? 0);
      if (Date.now() - last < ONE_WEEK_MS) return;

      const t = window.setTimeout(() => {
        setOpen(true);
        try {
          localStorage.setItem(key, String(Date.now()));
          sessionStorage.setItem(sessionKey, "true");
        } catch {}
      }, INITIAL_DELAY_MS);
      return () => window.clearTimeout(t);
    } catch {}
  }, [user, isLoading, adminLoading, isAdmin, profile?.is_premium, hasCompletedOnboarding]);

  if (!user) return null;
  return <UpgradeModal open={open} onOpenChange={setOpen} />;
};

export default WeeklySubscriptionPrompt;
