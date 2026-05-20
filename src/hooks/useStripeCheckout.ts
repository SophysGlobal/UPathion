import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const STRIPE_PRICES = {
  monthly: "price_1T8nR6QaZOki2KO0sb3eSsvK",
  yearly: "price_1T8nR6QaZOki2KO0ujPE1DA0",
} as const;

export type StripeInterval = "monthly" | "yearly";

/**
 * Shared Stripe checkout flow: opens checkout in a new tab, polls
 * subscription status, handles cancellation/completion gracefully.
 * Used by both the Subscription page and the in-app UpgradeModal so
 * Stripe mechanics stay identical across entry points.
 */
export const useStripeCheckout = (onSuccess?: () => void) => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const pollRef = useRef<number | null>(null);
  const checkoutWindowRef = useRef<Window | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // bfcache safety: clear stuck state when the user navigates back.
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setIsLoading(false);
        setIsWaiting(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) return false;
      return !!(data as { subscribed?: boolean } | null)?.subscribed;
    } catch {
      return false;
    }
  }, []);

  const cancelWaiting = useCallback(() => {
    stopPolling();
    setIsWaiting(false);
    setIsLoading(false);
    toast.message("Payment canceled", {
      description: "You can restart your premium upgrade anytime.",
    });
  }, [stopPolling]);

  const startCheckout = useCallback(async (interval: StripeInterval) => {
    if (isLoading || isWaiting) return;
    setIsLoading(true);
    try {
      const priceId = STRIPE_PRICES[interval];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      const url = (data as { url?: string } | null)?.url;
      if (!url) throw new Error("No checkout URL returned");

      const popup = window.open(url, "_blank");
      if (!popup || popup.closed || typeof popup.closed === "undefined") {
        window.location.href = url;
        return;
      }
      checkoutWindowRef.current = popup;
      setIsLoading(false);
      setIsWaiting(true);

      const startedAt = Date.now();
      const MAX_MS = 10 * 60 * 1000;
      pollRef.current = window.setInterval(async () => {
        if (Date.now() - startedAt > MAX_MS) {
          stopPolling();
          setIsWaiting(false);
          toast.message("Checkout session expired", {
            description: "Please try again if you'd like to upgrade.",
          });
          return;
        }
        const popupRef = checkoutWindowRef.current;
        if (popupRef && popupRef.closed) {
          const ok = await checkSubscription();
          stopPolling();
          setIsWaiting(false);
          if (ok) {
            toast.success("Welcome to Premium!");
            onSuccess?.();
            navigate("/dashboard");
          } else {
            toast.error("Payment canceled or incomplete", {
              description:
                "Your checkout was closed before payment finished. You can try again anytime.",
            });
          }
          return;
        }
        const ok = await checkSubscription();
        if (ok) {
          stopPolling();
          setIsWaiting(false);
          toast.success("Welcome to Premium!");
          onSuccess?.();
          navigate("/dashboard");
        }
      }, 4000);
    } catch (err: any) {
      toast.error(err?.message || "Failed to start checkout");
      setIsLoading(false);
      setIsWaiting(false);
    }
  }, [isLoading, isWaiting, stopPolling, checkSubscription, navigate, onSuccess]);

  return { isLoading, isWaiting, startCheckout, cancelWaiting };
};
