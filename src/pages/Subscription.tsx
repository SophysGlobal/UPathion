import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/ui/GradientButton";
import { X, Search, Award, Building2, Sparkles, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStatus } from "@/hooks/useAdminStatus";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { usePlanSimulation } from "@/hooks/usePlanSimulation";

const Subscription = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAdminStatus();
  const { simulatedPlan, togglePlan } = usePlanSimulation();
  const [isYearly, setIsYearly] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const { isLoading, isWaiting, startCheckout, cancelWaiting } = useStripeCheckout();

  useEffect(() => {
    const timer = setTimeout(() => setShowClose(true), 3000);
    return () => clearTimeout(timer);
  }, []);

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

  const handleSubscribe = () => startCheckout(isYearly ? "yearly" : "monthly");

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
              <>
                <Loader2 className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : isWaiting ? (
              <>
                <Loader2 className="animate-spin" />
                <span>Waiting for payment...</span>
              </>
            ) : (
              "Start Premium"
            )}
          </GradientButton>
          {isWaiting && (
            <button
              onClick={cancelWaiting}
              className="mt-3 w-full py-2 text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              Cancel and return
            </button>
          )}
        </div>

        <p className="text-center text-xs text-muted-foreground animate-fade-in">Cancel anytime. Terms apply.</p>

        {isAdmin && (
          <div className="animate-fade-in space-y-2 pt-2 border-t border-border/30">
            <p className="text-center text-[10px] uppercase tracking-wider text-muted-foreground">
              Admin testing
            </p>
            <button
              onClick={togglePlan}
              className="w-full py-2 text-xs text-foreground bg-secondary/60 hover:bg-secondary rounded-lg transition-colors"
            >
              Switch to {(simulatedPlan ?? "premium") === "premium" ? "Free" : "Premium"} (testing)
            </button>
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
