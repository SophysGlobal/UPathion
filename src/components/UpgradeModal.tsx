import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GradientButton } from "@/components/ui/GradientButton";
import { Switch } from "@/components/ui/switch";
import { 
  Crown, 
  Search, 
  Badge, 
  Building2, 
  Sparkles, 
  Check 
} from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UpgradeModal = ({ open, onOpenChange }: UpgradeModalProps) => {
  const [isYearly, setIsYearly] = useState(false);
  const navigate = useNavigate();

  const pricing = {
    monthly: { price: 4.99, period: "month" },
    yearly: { price: 49.99, period: "year", savings: "Save $9.89" },
  };

  const currentPlan = isYearly ? pricing.yearly : pricing.monthly;

  const benefits = [
    {
      icon: Search,
      title: "Priority Search Ranking",
      description: "Appear more frequently in search results",
    },
    {
      icon: Badge,
      title: "Exclusive Badge",
      description: "Stand out with a premium profile badge",
    },
    {
      icon: Building2,
      title: "Enhanced Reputation",
      description: "Look more reputable to organizations",
    },
    {
      icon: Sparkles,
      title: "AI Assistant",
      description: "Specialized searching & profile building",
    },
  ];

  const handleSubscribe = () => {
    onOpenChange(false);
    navigate("/subscription");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-card/95 backdrop-blur-xl border-border/50 p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="gradient-bg p-6 text-center">
          <Crown className="w-12 h-12 text-primary-foreground mx-auto mb-3" />
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary-foreground">
              Upgrade to Premium
            </DialogTitle>
          </DialogHeader>
          <p className="text-primary-foreground/80 text-sm mt-2">
            Unlock exclusive features and stand out
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={`text-sm ${!isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
            />
            <span className={`text-sm ${isYearly ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {isYearly && (
              <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded-full">
                {pricing.yearly.savings}
              </span>
            )}
          </div>

          {/* Price Display */}
          <div className="text-center">
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-4xl font-bold text-foreground">${currentPlan.price}</span>
              <span className="text-muted-foreground">/{currentPlan.period}</span>
            </div>
          </div>

          {/* Benefits */}
          <div className="space-y-3">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
              >
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <benefit.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{benefit.title}</p>
                  <p className="text-xs text-muted-foreground">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <GradientButton 
            className="w-full" 
            size="lg"
            onClick={handleSubscribe}
          >
            <Check className="w-4 h-4 mr-2" />
            Start Premium
          </GradientButton>

          <p className="text-xs text-center text-muted-foreground">
            Cancel anytime. No commitments.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UpgradeModal;
