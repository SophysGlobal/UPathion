import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import { Sparkles, TrendingUp, Users, Calendar } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { data } = useOnboarding();

  const firstName = data.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const quickStats = [
    { icon: Users, label: "Connections", value: "0" },
    { icon: TrendingUp, label: "Profile Views", value: "0" },
    { icon: Calendar, label: "Events", value: "0" },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-6 py-3">
          <Logo showText={false} />
        </div>
      </header>

      <main className="px-6 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{firstName}</span>!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening in your community
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in">
          {quickStats.map((stat) => (
            <div key={stat.label} className="gradient-border">
              <div className="bg-card rounded-lg p-4 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Getting Started</h2>
            </div>
            <div className="grid gap-3">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-primary">1</span>
                </div>
                <span className="text-sm text-foreground">Complete your profile</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">2</span>
                </div>
                <span className="text-sm text-muted-foreground">Explore your school community</span>
              </div>
              <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-bold text-muted-foreground">3</span>
                </div>
                <span className="text-sm text-muted-foreground">Connect with classmates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State for Feed */}
        <div className="text-center py-12 animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-2">No activity yet</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Start exploring to see what's happening in your community
          </p>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Dashboard;
