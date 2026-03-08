import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { X, Search, Award, Building2, Sparkles, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useEffect } from "react";
import { useAdminStatus } from "@/hooks/useAdminStatus";

const PRICES = {
  monthly: "price_1T8nR6QaZOki2KO0sb3eSsvK",
  yearly: "price_1T8nR6QaZOki2KO0ujPE1DA0",
} as const;

const Subscription = () => {
  const navigate = useNavigate();
  const [isYearly, setIsYearly] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubscribe = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const priceId = isYearly ? PRICES.yearly : PRICES.monthly;
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to start checkout");
      setIsLoading(false);
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
        <div className="flex justify-center animate-fade-in"><Logo /></div>

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
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Processing...
              </span>
            ) : (
              "Start Premium"
            )}
          </GradientButton>
        </div>

        <p className="text-center text-xs text-muted-foreground animate-fade-in">Cancel anytime. Terms apply.</p>
      </div>
    </div>
  );
};

export default Subscription;
