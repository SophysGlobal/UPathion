import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import ProfileAvatar from "@/components/ProfileAvatar";
import { GradientButton } from "@/components/ui/GradientButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import UpgradeModal from "@/components/UpgradeModal";
import { School, Settings, LogOut, ChevronRight, User, Crown } from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data } = useOnboarding();
  const { profile } = useUserProfile();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = useMemo(() => [
    { icon: User, label: "Edit Profile", action: () => {}, hidden: false },
    { icon: School, label: "School Info", action: () => navigate("/school-info"), hidden: false },
    { icon: Settings, label: "Settings", action: () => navigate("/settings"), hidden: false },
    { icon: Crown, label: "Upgrade to Premium", action: () => setUpgradeOpen(true), hidden: profile?.is_premium ?? false },
  ], [profile?.is_premium]);

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <Logo showText={false} />
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Profile Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <ProfileAvatar
                avatarUrl={profile?.avatar_url}
                isPremium={profile?.is_premium ?? false}
                size="lg"
              />
            </div>
            <h2 className="text-xl font-bold text-foreground">
              {data.fullName || profile?.display_name || user?.email?.split('@')[0] || 'User'}
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
            {profile?.is_premium && (
              <span className="inline-block mt-2 px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                Premium Member
              </span>
            )}
          </div>
        </div>

        {/* Menu Items */}
        <div className="space-y-3">
          {menuItems.filter(item => !item.hidden).map((item, index) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full gradient-border group animate-fade-in"
            >
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between transition-colors group-hover:bg-secondary/50">
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
        <div className="pt-4 animate-fade-in">
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

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Profile;
