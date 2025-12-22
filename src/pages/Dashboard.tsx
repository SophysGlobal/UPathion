import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
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
        <div className="flex items-center justify-between px-4 py-3 max-w-md mx-auto">
          <Logo />
        </div>
      </header>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6">
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
        <div className="grid grid-cols-3 gap-3 animate-fade-in">
          {quickStats.map((stat) => (
            <div key={stat.label} className="gradient-border">
              <div className="bg-card rounded-lg p-3 text-center">
                <stat.icon className="w-5 h-5 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Getting Started</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">1</span>
                </div>
                <span className="text-sm text-foreground">Complete your profile</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">2</span>
                </div>
                <span className="text-sm text-muted-foreground">Explore your school community</span>
              </div>
              <div className="flex items-center gap-3 p-2 rounded-lg bg-secondary/50">
                <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">3</span>
                </div>
                <span className="text-sm text-muted-foreground">Connect with classmates</span>
              </div>
            </div>
          </div>
        </div>

        {/* Empty State for Feed */}
        <div className="text-center py-8 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">No activity yet</h3>
          <p className="text-sm text-muted-foreground">
            Start exploring to see what's happening in your community
          </p>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
