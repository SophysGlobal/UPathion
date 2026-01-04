import { useNavigate } from "react-router-dom";
import { useUserProfile } from "@/hooks/useUserProfile";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { 
  ChevronLeft, 
  Crown, 
  CreditCard, 
  RefreshCw, 
  XCircle, 
  Receipt, 
  HelpCircle,
  ChevronRight,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { toast } from "sonner";

const PlanManagement = () => {
  const navigate = useNavigate();
  const { profile, loading } = useUserProfile();

  const isPremium = profile?.is_premium ?? false;

  // Mock subscription data - in production would come from Stripe/backend
  const subscriptionData = {
    plan: isPremium ? "Premium" : "Free",
    status: isPremium ? "Active" : "N/A",
    renewalDate: isPremium ? "February 4, 2026" : null,
    platform: "Web",
    price: isPremium ? "$9.99/month" : "Free",
  };

  const handleCancelSubscription = () => {
    toast.info("Cancel subscription flow coming soon. Contact support for assistance.");
  };

  const handleRestorePurchases = () => {
    toast.info("Restore purchases initiated. This may take a moment...");
  };

  const handleUpdatePayment = () => {
    toast.info("Payment method management coming soon.");
  };

  const handleBillingHistory = () => {
    toast.info("Billing history coming soon.");
  };

  const handleContactSupport = () => {
    toast.info("Opening support channel...");
  };

  const managementItems = [
    {
      icon: CreditCard,
      label: "Update Payment Method",
      description: "Change your card or billing details",
      action: handleUpdatePayment,
    },
    {
      icon: Receipt,
      label: "Billing History",
      description: "View past invoices and receipts",
      action: handleBillingHistory,
    },
    {
      icon: RefreshCw,
      label: "Restore Purchases",
      description: "Restore your subscription if not showing",
      action: handleRestorePurchases,
    },
    {
      icon: XCircle,
      label: "Cancel Subscription",
      description: "Cancel your Premium membership",
      action: handleCancelSubscription,
      destructive: true,
    },
  ];

  const supportItems = [
    {
      icon: HelpCircle,
      label: "Billing Support",
      description: "Get help with billing issues",
      action: handleContactSupport,
    },
  ];

  // Premium benefits for reference
  const premiumBenefits = [
    "Unlimited AI assistant messages",
    "Priority support",
    "Advanced analytics",
    "Custom profile themes",
    "Early access to new features",
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Manage Plan</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Current Plan Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6">
            <div className="flex items-start gap-4">
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                isPremium ? "bg-accent/20" : "bg-primary/20"
              }`}>
                <Crown className={`w-7 h-7 ${isPremium ? "text-accent" : "text-primary"}`} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-foreground">{subscriptionData.plan}</h2>
                  {isPremium && (
                    <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {subscriptionData.price}
                </p>
                {subscriptionData.renewalDate && (
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Renews {subscriptionData.renewalDate}</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">
                  Platform: {subscriptionData.platform}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Benefits (shown for Premium users) */}
        {isPremium && (
          <div className="animate-fade-in" style={{ animationDelay: '0.05s' }}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Your Benefits
            </h2>
            <div className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
                <div className="space-y-3">
                  {premiumBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                      <span className="text-sm text-foreground">{benefit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Subscription Management */}
        {isPremium && (
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              Subscription Management
            </h2>
            <div className="space-y-2">
              {managementItems.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.action}
                  className="w-full gradient-border group"
                >
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between transition-all group-hover:bg-secondary/50">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        item.destructive ? "bg-destructive/20" : "bg-primary/20"
                      }`}>
                        <item.icon className={`w-5 h-5 ${
                          item.destructive ? "text-destructive" : "text-primary"
                        }`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${
                          item.destructive ? "text-destructive" : "text-foreground"
                        }`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 ${
                      item.destructive ? "text-destructive" : "text-muted-foreground"
                    }`} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Support Section */}
        <div className="animate-fade-in" style={{ animationDelay: isPremium ? '0.15s' : '0.05s' }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
            Support
          </h2>
          <div className="space-y-2">
            {supportItems.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.action}
                className="w-full gradient-border group"
              >
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between transition-all group-hover:bg-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-primary/20">
                      <item.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Upgrade CTA for Free users */}
        {!isPremium && !loading && (
          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <button
              onClick={() => navigate("/subscription")}
              className="w-full gradient-border group"
            >
              <div className="bg-gradient-to-r from-primary/20 to-accent/20 backdrop-blur-sm rounded-lg p-6 text-center transition-all group-hover:from-primary/30 group-hover:to-accent/30">
                <Crown className="w-10 h-10 text-accent mx-auto mb-3" />
                <h3 className="text-lg font-bold text-foreground mb-1">Upgrade to Premium</h3>
                <p className="text-sm text-muted-foreground">
                  Unlock all features and get the most out of your experience
                </p>
              </div>
            </button>
          </div>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default PlanManagement;
