import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import { useOnboarding } from "@/context/OnboardingContext";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import CompleteProfilePrompt from "@/components/CompleteProfilePrompt";
import { Sparkles, TrendingUp, Users, Calendar, Check, ChevronRight, BookOpen, GraduationCap, Compass } from "lucide-react";

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, isProfileComplete, hasCompletedOnboarding } = useProfileCompletion();
  const { data } = useOnboarding();
  const navigate = useNavigate();
  
  const [showProfilePrompt, setShowProfilePrompt] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(false);

  useEffect(() => {
    if (user && !hasCompletedOnboarding && !isProfileComplete && !promptDismissed) {
      const dismissed = sessionStorage.getItem('profile-prompt-dismissed');
      if (!dismissed) {
        setShowProfilePrompt(true);
      }
    }
  }, [user, hasCompletedOnboarding, isProfileComplete, promptDismissed]);

  const handleSkipPrompt = () => {
    setShowProfilePrompt(false);
    setPromptDismissed(true);
    sessionStorage.setItem('profile-prompt-dismissed', 'true');
  };

  const firstName = profile?.display_name?.split(' ')[0] || user?.email?.split('@')[0] || 'there';

  const quickStats = [
    { icon: Users, label: "Connections", value: "0" },
    { icon: TrendingUp, label: "Profile Views", value: "0" },
    { icon: Calendar, label: "Events", value: "0" },
  ];

  const steps = [
    { 
      label: "Complete your profile", 
      completed: isProfileComplete,
      action: () => navigate("/edit-profile"),
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

  const quickActions = [
    { icon: Compass, label: "Explore", description: "Find people & groups", action: () => navigate("/explore") },
    { icon: BookOpen, label: "Feed", description: "See what's new", action: () => navigate("/feed") },
    { icon: GraduationCap, label: "School", description: "Your school community", action: () => navigate("/school-info") },
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      
      {showProfilePrompt && (
        <CompleteProfilePrompt onSkip={handleSkipPrompt} />
      )}

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <Logo showText={false} />
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-8">
        {/* Welcome Section */}
        <div className="animate-fade-in">
          <h2 className="text-2xl font-bold text-foreground">
            Welcome back, <span className="gradient-text">{firstName}</span>!
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening in your community
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-3 gap-3 animate-fade-in" style={{ animationDelay: '0.05s', animationFillMode: 'both' }}>
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={action.action}
              className="gradient-border group"
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 text-center transition-colors group-hover:bg-secondary/50">
                <action.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{action.description}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 animate-fade-in" style={{ animationDelay: '0.1s', animationFillMode: 'both' }}>
          {quickStats.map((stat) => (
            <div key={stat.label} className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 text-center">
                <stat.icon className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-xl font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Your Interests Summary */}
        {(data.interests?.length > 0 || data.extracurriculars?.length > 0) && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-3">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Your Interests
              </h3>
              {data.interests?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Intended Majors</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.interests.slice(0, 4).map((i) => (
                      <span key={i} className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">{i}</span>
                    ))}
                    {data.interests.length > 4 && (
                      <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs">+{data.interests.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
              {data.extracurriculars?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Extracurriculars</p>
                  <div className="flex flex-wrap gap-1.5">
                    {data.extracurriculars.slice(0, 4).map((e) => (
                      <span key={e} className="px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-medium">{e}</span>
                    ))}
                    {data.extracurriculars.length > 4 && (
                      <span className="px-2.5 py-1 rounded-full bg-secondary text-muted-foreground text-xs">+{data.extracurriculars.length - 4}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Getting Started */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.2s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Getting Started</h3>
            </div>
            <div className="grid gap-3">
              {steps.map((step, index) => (
                <button
                  key={index}
                  onClick={step.action}
                  className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30 backdrop-blur-sm hover:bg-secondary/50 transition-colors group text-left w-full"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    step.completed ? 'bg-accent/20' : 'bg-primary/20'
                  }`}>
                    {step.completed ? (
                      <Check className="w-4 h-4 text-accent" />
                    ) : (
                      <span className="text-sm font-bold text-primary">{index + 1}</span>
                    )}
                  </div>
                  <span className={`text-sm flex-1 ${
                    step.completed ? 'text-muted-foreground line-through' : 'text-foreground'
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
        <div className="text-center py-12 animate-fade-in" style={{ animationDelay: '0.25s', animationFillMode: 'both' }}>
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
