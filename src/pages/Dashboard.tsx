import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Sparkles, TrendingUp, Users, Calendar, Check, ChevronRight } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { data } = useOnboarding();
  const navigate = useNavigate();

  const firstName = data.fullName?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const quickStats = [
    { icon: Users, label: "Connections", value: "0" },
    { icon: TrendingUp, label: "Profile Views", value: "0" },
    { icon: Calendar, label: "Events", value: "0" },
  ];

  // Check completion status based on onboarding data
  const steps = [
    { 
      label: "Complete your profile", 
      completed: !!(data.fullName && data.username),
      action: () => navigate("/profile"),
    },
    { 
      label: "Explore your school community", 
      completed: false,
      action: () => navigate("/explore"),
    },
    { 
      label: "Connect with classmates", 
      completed: false,
      action: () => navigate("/explore"),
    },
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <Logo showText={false} />
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in" style={{ animationDelay: '0ms' }}>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{firstName}</span>!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening in your community
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4">
          {quickStats.map((stat, index) => (
            <div 
              key={stat.label} 
              className="gradient-border animate-fade-in"
              style={{ animationDelay: `${(index + 1) * 50}ms` }}
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="font-semibold text-foreground">Getting Started</h2>
              <span className="text-xs text-muted-foreground ml-auto">Optional</span>
            </div>
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={step.action}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-colors group text-left w-full"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed 
                      ? 'bg-accent/20' 
                      : 'bg-primary/20'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${
                    step.completed 
                      ? 'text-muted-foreground line-through' 
                      : 'text-foreground'
                  }`}>
                    {step.label}
                  </span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Empty State for Feed */}
        <div className="text-center py-12 animate-fade-in" style={{ animationDelay: '250ms' }}>
          <div className="w-20 h-20 rounded-full bg-secondary/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
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
