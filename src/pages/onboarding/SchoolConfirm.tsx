import { useNavigate } from "react-router-dom";
import AnimatedBackground from "@/components/AnimatedBackground";
import Logo from "@/components/Logo";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { School, GraduationCap, BookOpen, Calendar } from "lucide-react";
import { toast } from "sonner";

const SchoolConfirm = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const handleConfirm = () => {
    toast.success("Welcome to Campfire! 🔥", {
      description: "Your profile is all set up. Time to connect with your community!",
    });
    navigate("/welcome");
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
        <div className="text-center space-y-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h1 className="text-3xl font-bold text-foreground">Almost there!</h1>
          <p className="text-muted-foreground">Confirm your school details</p>
        </div>

        {/* Info Card */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <GradientButton 
            variant="default"
            className="flex-1"
            onClick={() => navigate("/onboarding/school")}
          >
            Edit
          </GradientButton>
          <GradientButton 
            variant="filled"
            className="flex-1"
            onClick={handleConfirm}
          >
            Confirm
          </GradientButton>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
