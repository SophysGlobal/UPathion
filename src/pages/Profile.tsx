import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import Logo from "@/components/Logo";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import ProfileAvatar from "@/components/ProfileAvatar";
import { GradientButton } from "@/components/ui/GradientButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { School, Settings, LogOut, ChevronRight, User, Crown } from "lucide-react";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data, loading: onboardingLoading } = useOnboarding();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const isReady = !profileLoading && !onboardingLoading;

  // Look up school ID for navigation
  useEffect(() => {
    const findSchoolId = async () => {
      if (!data.schoolName) return;
      
      try {
        const { data: schoolData } = await supabase
          .from('schools')
          .select('id')
          .ilike('name', data.schoolName)
          .maybeSingle();
        
        setSchoolId(schoolData?.id || null);
      } catch (err) {
        console.error('Error finding school:', err);
      }
    };
    
    if (isReady && data.schoolName) {
      findSchoolId();
    }
  }, [data.schoolName, isReady]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuItems = useMemo(() => {
    const items = [
      { icon: User, label: "Edit Profile", action: () => navigate("/edit-profile"), hidden: false },
      { icon: School, label: "School Info", action: () => navigate("/school-info"), hidden: false },
      { icon: Settings, label: "Settings", action: () => navigate("/settings"), hidden: false },
    ];

    if (isReady && profile.is_premium) {
      items.push({ icon: Crown, label: "Manage Your Plan", action: () => navigate("/plan-management"), hidden: false });
    } else if (isReady) {
      items.push({ icon: Crown, label: "Upgrade to Premium", action: () => setUpgradeOpen(true), hidden: false });
    }

    return items;
  }, [profile.is_premium, isReady, navigate])

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <Logo showText={false} />
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {isReady ? (
          <>
            {/* Profile Card */}
            <div className="gradient-border animate-fade-in">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <ProfileAvatar
                    avatarUrl={profile.avatar_url}
                    isPremium={profile.is_premium}
                    size="lg"
                  />
                </div>
                <h2 className="text-xl font-bold text-foreground">
                  {data.fullName || profile.display_name || user?.email?.split('@')[0] || 'User'}
                </h2>
                {data.username && (
                  <p className="text-sm text-primary">@{data.username}</p>
                )}
                {data.schoolName ? (
                  <button
                    onClick={() => schoolId && navigate(`/school/${schoolId}`)}
                    className={`text-sm mt-1 transition-colors ${
                      schoolId 
                        ? 'text-primary hover:underline cursor-pointer' 
                        : 'text-muted-foreground cursor-default'
                    }`}
                  >
                    {data.schoolName}
                  </button>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">No school set</p>
                )}
                {data.major && (
                  <p className="text-xs text-muted-foreground">{data.major}</p>
                )}
                <div className="h-6 mt-2">
                  {profile.is_premium && (
                    <span className="inline-block px-3 py-1 rounded-full bg-accent/20 text-accent text-xs font-medium">
                      Premium Member
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="space-y-3">
              {menuItems.filter(item => !item.hidden).map((item) => (
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
          </>
        ) : (
          <div className="space-y-6">
            {/* Loading Skeleton - Profile Card */}
            <div className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="flex justify-center mb-4">
                  <div className="w-24 h-24 rounded-full bg-muted animate-pulse" />
                </div>
                <div className="h-6 bg-muted rounded w-40 mx-auto mb-3 animate-pulse" />
                <div className="h-4 bg-muted rounded w-32 mx-auto mb-3 animate-pulse" />
                <div className="h-4 bg-muted rounded w-48 mx-auto mb-3 animate-pulse" />
                <div className="h-6 bg-muted rounded-full w-32 mx-auto mt-4 animate-pulse" />
              </div>
            </div>

            {/* Loading Skeleton - Menu Items */}
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="gradient-border">
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                      <div className="h-4 bg-muted rounded flex-1 max-w-xs animate-pulse" />
                    </div>
                    <div className="w-5 h-5 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              ))}
            </div>

            {/* Loading Skeleton - Sign Out */}
            <div className="pt-4">
              <div className="h-10 bg-muted rounded-lg animate-pulse" />
            </div>
          </div>
        )}
      </main>

      <UpgradeModal open={upgradeOpen} onOpenChange={setUpgradeOpen} />
      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Profile;
