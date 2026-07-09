import { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useOnboarding } from "@/context/OnboardingContext";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import ProfileAvatar from "@/components/ProfileAvatar";
import { GradientButton } from "@/components/ui/GradientButton";
import { useUserProfile } from "@/hooks/useUserProfile";
import UpgradeModal from "@/components/UpgradeModal";
import { supabase } from "@/integrations/supabase/client";
import { School, Settings, LogOut, ChevronRight, User, Crown, MessageSquare, FlaskConical, ShieldCheck, GraduationCap } from "lucide-react";
import { usePlanSimulation } from "@/hooks/usePlanSimulation";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import VerifiedBadge from "@/components/VerifiedBadge";

const Profile = () => {
  const { user, signOut } = useAuth();
  const { data, loading: onboardingLoading } = useOnboarding();
  const { profile, loading: profileLoading } = useUserProfile();
  const navigate = useNavigate();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const { isAdmin, simulatedPlan, togglePlan } = usePlanSimulation();
  const { status: verificationStatus } = useVerificationStatus();

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

    if (isReady && data.schoolType === 'college') {
      const verifyLabel = verificationStatus === 'verified' ? "Verified Student" : "Verify Student Status";
      items.push({ icon: ShieldCheck, label: verifyLabel, action: () => navigate("/verify-student"), hidden: false });
    }

    return items;
  }, [profile.is_premium, isReady, navigate, verificationStatus, data.schoolType])

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      
      <AppHeader title="Profile" />

      <main className="relative z-10 px-5 py-5 space-y-5 max-w-5xl mx-auto">
        {isReady ? (
          <>
            {/* Profile screen — 50/50 split:
                LEFT  → identity content block (avatar, name, school, majors,
                         extracurriculars, About)
                RIGHT → action buttons (Edit, School, Settings, Plan, Sign Out)
                Stacks vertically on mobile. */}
            {(() => {
              const isCollege = data.schoolType === 'college';
              const majorsList = isCollege
                ? (data.major || '').split(',').map((m) => m.trim()).filter(Boolean)
                : (data.interests || []);
              const majorsLabel = isCollege ? 'Majors' : 'Intended Majors';
              const aboutText = (profile.bio || data.about || '').trim();
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in items-start">
                  {/* LEFT — identity content block */}
                  <div className="gradient-border">
                    <div className="bg-card/90 backdrop-blur-sm rounded-lg p-5 space-y-4 h-full">
                      <div className="flex items-center gap-4">
                        <ProfileAvatar
                          avatarUrl={profile.avatar_url}
                          isPremium={profile.is_premium}
                          size="lg"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <h2 className="text-lg font-bold text-foreground truncate">
                              {data.fullName || profile.display_name || user?.email?.split('@')[0] || 'User'}
                            </h2>
                            <VerifiedBadge status={verificationStatus} size="md" />
                          </div>
                          {data.username && (
                            <p className="text-sm text-primary truncate">@{data.username}</p>
                          )}
                          <span
                            className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              profile.is_premium
                                ? 'bg-accent/20 text-accent'
                                : 'bg-secondary text-muted-foreground'
                            }`}
                          >
                            {profile.is_premium ? 'Premium' : 'Free'}
                          </span>
                        </div>
                      </div>

                      <div className="border-t border-border/40" />

                      {/* School */}
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">School</p>
                        {data.schoolName ? (
                          <button
                            onClick={() => schoolId && navigate(`/school/${schoolId}`)}
                            className={`block text-sm text-left transition-colors truncate ${
                              schoolId
                                ? 'text-primary hover:underline cursor-pointer'
                                : 'text-foreground cursor-default'
                            }`}
                          >
                            {data.schoolName}
                          </button>
                        ) : (
                          <p className="text-sm text-muted-foreground">No school set</p>
                        )}
                        {data.gradeOrYear && (
                          <p className="text-xs text-muted-foreground mt-0.5">{data.gradeOrYear}</p>
                        )}
                      </div>

                      {/* Majors */}
                      {majorsList.length > 0 && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">{majorsLabel}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {majorsList.map((m) => (
                              <span key={m} className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-xs font-medium">
                                {m}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Extracurriculars */}
                      {data.extracurriculars && data.extracurriculars.length > 0 && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5">Extracurriculars</p>
                          <div className="flex flex-wrap gap-1.5">
                            {data.extracurriculars.slice(0, 8).map((ec) => (
                              <span key={ec} className="px-2.5 py-0.5 rounded-full bg-accent/10 text-accent text-xs">
                                {ec}
                              </span>
                            ))}
                            {data.extracurriculars.length > 8 && (
                              <span className="px-2.5 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                                +{data.extracurriculars.length - 8}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Education */}
                      {isCollege && (data.degree || data.graduationYear || data.studentLevel) && (
                        <div>
                          <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                            <GraduationCap className="w-3 h-3" /> Education
                          </p>
                          <div className="text-sm text-foreground/90 space-y-0.5">
                            {data.schoolName && <p className="font-medium">{data.schoolName}</p>}
                            {data.degree && <p className="text-muted-foreground">{data.degree}</p>}
                            {(data.graduationYear || data.studentLevel) && (
                              <p className="text-xs text-muted-foreground">
                                {data.studentLevel === 'alumni'
                                  ? `Class of ${data.graduationYear || '—'}`
                                  : data.graduationYear
                                  ? `Expected ${data.graduationYear}`
                                  : ''}
                                {data.studentLevel === 'grad' && (data.graduationYear ? ' · ' : '') + 'Graduate'}
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* About */}
                      <div>
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> About
                        </p>
                        {aboutText ? (
                          <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {aboutText}
                          </p>
                        ) : (
                          <button
                            onClick={() => navigate('/edit-profile')}
                            className="text-sm text-muted-foreground italic hover:text-primary transition-colors text-left"
                          >
                            Add a short intro so others can get to know you.
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* RIGHT — action buttons */}
                  <div className="space-y-2.5">
                    {menuItems.filter(item => !item.hidden).map((item) => (
                      <button
                        key={item.label}
                        onClick={item.action}
                        className="w-full gradient-border group"
                      >
                        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center justify-between transition-colors group-hover:bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-primary" />
                            <span className="font-medium text-foreground">{item.label}</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))}
                    {isAdmin && (
                      <button
                        onClick={togglePlan}
                        className="w-full gradient-border group"
                        aria-label="Admin plan toggle"
                      >
                        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center justify-between transition-colors group-hover:bg-secondary/50">
                          <div className="flex items-center gap-3">
                            <FlaskConical className="w-5 h-5 text-accent" />
                            <div className="text-left">
                              <span className="font-medium text-foreground block leading-tight">
                                Switch Plan (Admin)
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                Currently testing: {(simulatedPlan ?? "premium") === "premium" ? "Premium" : "Free"}
                              </span>
                            </div>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full gradient-border group"
                    >
                      <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-3 flex items-center justify-between transition-colors group-hover:bg-destructive/10">
                        <div className="flex items-center gap-3">
                          <LogOut className="w-5 h-5 text-destructive" />
                          <span className="font-medium text-destructive">Sign Out</span>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </button>
                  </div>
                </div>
              );
            })()}
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
