import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";
import { X, Search, Award, Building2, Sparkles, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const PRICES = {
  monthly: "price_1T8nR6QaZOki2KO0sb3eSsvK",
  yearly: "price_1T8nR6QaZOki2KO0ujPE1DA0",
} as const;

const Subscription = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminStatus();
  const [isYearly, setIsYearly] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const pollRef = useRef<number | null>(null);
  const checkoutWindowRef = useRef<Window | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Safety: if user navigates back via bfcache restore, clear stuck state.
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

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) return false;
      return !!(data as { subscribed?: boolean } | null)?.subscribed;
    } catch {
      return false;
    }
  }, []);

  const handleCancelWaiting = useCallback(() => {
    stopPolling();
    setIsWaiting(false);
    setIsLoading(false);
    toast.message("Payment canceled", {
      description: "You can restart your premium upgrade anytime.",
    });
  }, [stopPolling]);

  const monthlyPrice = 4.99;
  const yearlyPrice = 49.99;
  const yearlyMonthlyEquivalent = (yearlyPrice / 12).toFixed(2);
  const yearlySavings = (monthlyPrice * 12 - yearlyPrice).toFixed(2);

  const benefits = [
    { icon: Search, title: "Priority Search Visibility", description: "Appear more frequently in search results" },
    { icon: Award, title: "Exclusive Profile Badge", description: "Stand out with a premium badge on your profile" },
    { icon: Building2, title: "Enhanced Reputation", description: "Look more reputable to community organizations" },
    { icon: Sparkles, title: "AI-Powered Features", description: "Use AI for specialized searching and profile building" },
  ];

  const handleSubscribe = async () => {
    if (isLoading || isWaiting) return;
    setIsLoading(true);
    try {
      const priceId = isYearly ? PRICES.yearly : PRICES.monthly;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      const url = (data as { url?: string } | null)?.url;
      if (!url) throw new Error("No checkout URL returned");

      // Open Stripe checkout in a new tab so the main app stays stable.
      const popup = window.open(url, "_blank", "noopener,noreferrer");
      if (!popup) {
        // Popup blocked — fall back to same-tab redirect.
        window.location.href = url;
        return;
      }
      checkoutWindowRef.current = popup;
      setIsLoading(false);
      setIsWaiting(true);

      // Poll subscription status; stop when active or after ~10 minutes.
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
        const ok = await checkSubscription();
        if (ok) {
          stopPolling();
          setIsWaiting(false);
          toast.success("Welcome to Premium!");
          navigate("/dashboard");
        }
      }, 4000);
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setIsLoading(false);
      setIsWaiting(false);
    }
  };

  const handleSkip = () => {
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <button
        onClick={handleSkip}
        className={cn(
          "absolute top-6 right-6 z-20 p-2 rounded-full bg-secondary/80 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200",
          showClose ? "opacity-100 scale-100" : "opacity-0 scale-75 pointer-events-none"
        )}
      >
        <X className="w-5 h-5" />
      </button>

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Spacer aligns content below the docked UPathion lockup.
            Bumped to h-20 so the branding sits comfortably above
            "Unlock Premium" with proper breathing room. */}
        <div className="h-20" />

        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">
            Unlock <span className="gradient-text">Premium</span>
          </h1>
          <p className="text-muted-foreground text-sm">Get the most out of UPathion with premium features</p>
        </div>

        <div className="flex justify-center animate-fade-in">
          <div className="flex items-center gap-2 p-1 bg-secondary rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                !isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >Monthly</button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
                isYearly ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >Yearly</button>
          </div>
        </div>

        <div className="gradient-border animate-fade-in">
          <div className="bg-card/80 backdrop-blur-sm rounded-lg p-6 text-center space-y-2">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold gradient-text">
                ${isYearly ? yearlyMonthlyEquivalent : monthlyPrice.toFixed(2)}
              </span>
              <span className="text-muted-foreground">/month</span>
            </div>
            {isYearly && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Billed ${yearlyPrice} annually</p>
                <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-sm font-medium">
                  Save ${yearlySavings}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {benefits.map((benefit) => (
            <div key={benefit.title} className="flex items-start gap-3 animate-fade-in bg-card/60 backdrop-blur-sm rounded-lg p-3">
              <div className="w-10 h-10 rounded-full bg-secondary/70 flex items-center justify-center flex-shrink-0">
                <benefit.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-foreground text-sm">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground">{benefit.description}</p>
              </div>
              <Check className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
            </div>
          ))}
        </div>

        <div className="animate-fade-in">
          <GradientButton
            variant="filled"
            size="lg"
            className="w-full"
            onClick={handleSubscribe}
            disabled={isLoading || isWaiting}
          >
            {isLoading ? (
              <span className="inline-flex items-center justify-center gap-2 leading-none">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Processing...</span>
              </span>
            ) : isWaiting ? (
              <span className="inline-flex items-center justify-center gap-2 leading-none">
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                <span>Waiting for payment...</span>
              </span>
            ) : (
              "Start Premium"
            )}
          </GradientButton>
          {isWaiting && (
            <button
              onClick={handleCancelWaiting}
              className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Cancel and return
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground animate-fade-in">Cancel anytime. Terms apply.</p>

        {isAdmin && (
          <div className="animate-fade-in">
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Go to Admin Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscription;
