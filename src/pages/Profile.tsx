import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { User, School, Settings, LogOut, ChevronRight } from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data } = useOnboarding();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = [
    { icon: User, label: "Edit Profile", action: () => {} },
    { icon: School, label: "School Info", action: () => {} },
    { icon: Settings, label: "Settings", action: () => {} },
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
        {/* Profile Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card rounded-lg p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {data.fullName || user?.email?.split('@')[0] || 'User'}
            </h2>
            {data.username && (
              <p className="text-sm text-primary">@{data.username}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {data.schoolName || 'No school set'}
            </p>
            {data.major && (
              <p className="text-xs text-muted-foreground">{data.major}</p>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-2 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full gradient-border group"
            >
              <div className="bg-card rounded-lg p-4 flex items-center justify-between transition-colors group-hover:bg-secondary">
                <div className="flex items-center gap-3">
                  <item.icon className="w-5 h-5 text-primary" />
                  <span className="font-medium text-foreground">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </div>
            </button>
          ))}
        </div>

        {/* Sign Out */}
        <div className="pt-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <GradientButton
            variant="ghost"
            className="w-full text-destructive hover:bg-destructive/10"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </GradientButton>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
