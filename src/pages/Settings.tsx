import { useNavigate } from "react-router-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import { usePremiumStatus } from "@/hooks/usePremiumStatus";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, Moon, Sun, Bell, Shield, HelpCircle, FileText, Mail, Trash2, ChevronRight, Crown, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const ThemeToggle = () => {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const active = (t: "system" | "light" | "dark") =>
    theme === t
      ? "bg-card text-foreground shadow-sm"
      : "text-muted-foreground hover:text-foreground";

  return (
    <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-lg">
      <button
        type="button"
        onClick={() => setTheme("system")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active(
          "system"
        )}`}
        aria-pressed={theme === "system"}
      >
        <span className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full border border-border" />
        System
        <span className="text-[10px] text-muted-foreground">({resolvedTheme})</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme("light")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active(
          "light"
        )}`}
        aria-pressed={theme === "light"}
      >
        <Sun className="w-3.5 h-3.5" />
        Light
      </button>
      <button
        type="button"
        onClick={() => setTheme("dark")}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${active(
          "dark"
        )}`}
        aria-pressed={theme === "dark"}
      >
        <Moon className="w-3.5 h-3.5" />
        Dark
      </button>
    </div>
  );
};

interface SettingsItem {
  icon: React.ElementType;
  label: string;
  description: string;
  action: React.ReactNode;
  onClick?: () => void;
  destructive?: boolean;
  premium?: boolean;
}

interface SettingsSection {
  title: string;
  items: SettingsItem[];
}

const Settings = () => {
  const navigate = useNavigate();
  const { theme, resolvedTheme } = useTheme();
  const { signOut } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremiumStatus();
  const [notifications, setNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailUpdates, setEmailUpdates] = useState(false);

  const handleDeleteAccount = () => {
    toast.error("Account deletion requires confirmation. Please contact support.");
  };

  const handleSubscriptionClick = () => {
    if (isPremium) {
      navigate("/plan-management");
    } else {
      navigate("/subscription");
    }
  };

  const settingsSections: SettingsSection[] = [
    {
      title: "Account & Billing",
      items: [
        {
          icon: isPremium ? Crown : CreditCard,
          label: isPremium ? "Manage Plan" : "Upgrade Plan",
          description: isPremium ? "Manage your premium subscription" : "Unlock premium features",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: handleSubscriptionClick,
          premium: isPremium,
        },
      ],
    },
    {
      title: "Appearance",
      items: [
        {
          icon: resolvedTheme === "dark" ? Moon : Sun,
          label: "Theme",
          description: "Choose light, dark, or follow your device",
          action: <ThemeToggle />,
        },
      ],
    },
    {
      title: "Notifications",
      items: [
        {
          icon: Bell,
          label: "In-App Notifications",
          description: "Receive notifications within the app",
          action: (
            <Switch 
              checked={notifications} 
              onCheckedChange={setNotifications}
            />
          ),
        },
        {
          icon: Bell,
          label: "Push Notifications",
          description: "Receive push notifications on your device",
          action: (
            <Switch 
              checked={pushNotifications} 
              onCheckedChange={setPushNotifications}
            />
          ),
        },
        {
          icon: Mail,
          label: "Email Updates",
          description: "Receive updates and news via email",
          action: (
            <Switch 
              checked={emailUpdates} 
              onCheckedChange={setEmailUpdates}
            />
          ),
        },
      ],
    },
    {
      title: "Privacy & Security",
      items: [
        {
          icon: Shield,
          label: "Privacy Settings",
          description: "Manage your privacy preferences",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: () => navigate("/privacy-settings"),
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: HelpCircle,
          label: "Help Center",
          description: "Get help and find answers",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: () => toast.info("Help center coming soon"),
        },
        {
          icon: FileText,
          label: "Terms of Service",
          description: "Read our terms and conditions",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: () => toast.info("Terms of service coming soon"),
        },
        {
          icon: Shield,
          label: "Privacy Policy",
          description: "Learn how we protect your data",
          action: <ChevronRight className="w-5 h-5 text-muted-foreground" />,
          onClick: () => toast.info("Privacy policy coming soon"),
        },
      ],
    },
    {
      title: "Danger Zone",
      items: [
        {
          icon: Trash2,
          label: "Delete Account",
          description: "Permanently delete your account and data",
          action: <ChevronRight className="w-5 h-5 text-destructive" />,
          onClick: handleDeleteAccount,
          destructive: true,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">Settings</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {settingsSections.map((section, sectionIndex) => (
          <div 
            key={section.title} 
            className="animate-fade-in" 
            style={{ animationDelay: `${sectionIndex * 0.04}s`, animationFillMode: 'both' }}
          >
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1">
              {section.title}
            </h2>
            <div className="space-y-2">
              {section.items.map((item, itemIndex) => {
                const row = (
                  <div
                    className={`bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between transition-all ${
                      item.onClick ? "group-hover:bg-secondary/50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          item.destructive 
                            ? "bg-destructive/20" 
                            : item.premium 
                            ? "bg-gradient-to-br from-primary/20 to-accent/20" 
                            : "bg-primary/20"
                        }`}
                      >
                        <item.icon
                          className={`w-5 h-5 ${
                            item.destructive 
                              ? "text-destructive" 
                              : item.premium 
                              ? "text-primary" 
                              : "text-primary"
                          }`}
                        />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${item.destructive ? "text-destructive" : "text-foreground"}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      </div>
                    </div>
                    {item.action}
                  </div>
                );

                return item.onClick ? (
                  <button
                    key={item.label}
                    type="button"
                    onClick={item.onClick}
                    className="w-full gradient-border group"
                  >
                    {row}
                  </button>
                ) : (
                  <div key={item.label} className="w-full gradient-border">
                    {row}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="text-center pt-4 text-xs text-muted-foreground">
          <p>Upathion v1.0.0</p>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Settings;
