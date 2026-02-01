import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { School, GraduationCap, BookOpen, Calendar, Sparkles } from "lucide-react";
import { toast } from "sonner";

const SchoolConfirm = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      navigate("/signin");
      return;
    }

    setIsLoading(true);
    try {
      const isHighSchool = data.schoolType === 'high_school';
      const updates = {
        display_name: data.fullName || null,
        username: data.username || null,
        school_name: data.schoolName || null,
        school_type: data.schoolType || null,
        grade_or_year: data.gradeOrYear || null,
        major: data.major || null,
        aspirational_school: isHighSchool ? (data.aspirationalSchool || null) : null,
        is_high_school: isHighSchool,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Signal to AuthGate that admin questionnaire is done for this session
      window.dispatchEvent(new CustomEvent('admin-questionnaire-complete'));

      toast.success("Profile saved!", {
        description: "Just one more step...",
      });
      
      // Navigate to subscription screen after onboarding (paywall)
      navigate("/subscription");
    } catch (error: any) {
      console.error('Error saving profile:', error);
      if (error.message?.includes('duplicate key') || error.message?.includes('unique')) {
        toast.error("That username is already taken. Please go back and choose another.");
      } else {
        toast.error("Failed to save profile. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      
      <div className="w-full max-w-md space-y-8 relative z-10">
        {/* Logo */}
        <div className="flex justify-center animate-fade-in">
          <Logo />
        </div>

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Almost there!</h1>
          <p className="text-muted-foreground">Confirm your details</p>
        </div>

        {/* Info Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full gradient-bg flex items-center justify-center">
                {data.schoolType === 'college' ? (
                  <GraduationCap className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <School className="w-6 h-6 text-primary-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">School</p>
                <p className="text-lg font-semibold text-foreground">{data.schoolName}</p>
              </div>
            </div>
            
            <div className="h-px bg-border" />
            
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {data.schoolType === 'college' ? 'Year' : 'Grade'}
                </p>
                <p className="text-lg font-semibold text-foreground">{data.gradeOrYear}</p>
              </div>
            </div>

            {data.major && (
              <>
                <div className="h-px bg-border" />
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Major(s)</p>
                    <p className="text-lg font-semibold text-foreground">{data.major}</p>
                  </div>
                </div>
              </>
            )}

            {data.aspirationalSchool && (
              <>
                <div className="h-px bg-border" />
                
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Dream School</p>
                    <p className="text-lg font-semibold text-foreground">{data.aspirationalSchool}</p>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 animate-fade-in">
          <GradientButton 
            variant="default"
            className="flex-1"
            onClick={() => navigate("/onboarding/school")}
            disabled={isLoading}
          >
            Edit
          </GradientButton>
          <GradientButton 
            variant="filled"
            className="flex-1"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Confirm"}
          </GradientButton>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
        </div>
      </div>
    </div>
  );
};

export default SchoolConfirm;
