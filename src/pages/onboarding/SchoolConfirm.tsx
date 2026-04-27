import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import EditFieldModal from "@/components/EditFieldModal";
import { useOnboarding } from "@/context/OnboardingContext";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { School, GraduationCap, BookOpen, Calendar, Sparkles, Activity } from "lucide-react";
import { toast } from "sonner";

const SchoolConfirm = () => {
  const navigate = useNavigate();
  const { data } = useOnboarding();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const handleConfirm = async () => {
    if (!user?.id) {
      toast.error("Please sign in to continue");
      navigate("/signin");
      return;
    }

    setIsLoading(true);
    try {
      const isHighSchool = data.schoolType === 'high_school';
      const updates: Record<string, any> = {
        display_name: data.fullName || null,
        username: data.username || null,
        school_name: data.schoolName || null,
        school_type: data.schoolType || null,
        grade_or_year: data.gradeOrYear || null,
        major: data.major || null,
        aspirational_school: isHighSchool ? (data.aspirationalSchool || null) : null,
        is_high_school: isHighSchool,
        referral_source: data.referralSource || null,
        referral_source_other: data.referralSourceOther || null,
        interests: data.interests?.length ? data.interests : [],
        extracurriculars: data.extracurriculars?.length ? data.extracurriculars : [],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      window.dispatchEvent(new CustomEvent('admin-questionnaire-complete'));

      toast.success("Profile saved!", {
        description: "Just one more step...",
      });
      
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      handleConfirm();
    }
  };

  return (
    <OnboardingLayout>
      <div onKeyDown={handleKeyDown} tabIndex={0}>
        <div className="text-center space-y-2 mb-4 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Almost there!</h1>
          <p className="text-muted-foreground">Confirm your details</p>
        </div>

        <div className="space-y-3 animate-fade-in">
          <DetailCard
            icon={
              data.schoolType === 'college' ? (
                <GraduationCap className="w-4 h-4 text-primary-foreground" />
              ) : (
                <School className="w-4 h-4 text-primary-foreground" />
              )
            }
            iconBg="gradient-bg"
            label="School"
            value={data.schoolName || '—'}
          />

          <DetailCard
            icon={<Calendar className="w-4 h-4 text-primary" />}
            iconBg="bg-secondary"
            label={data.schoolType === 'college' ? 'Year' : 'Grade'}
            value={data.gradeOrYear || '—'}
          />

          {data.interests && data.interests.length > 0 && (
            <DetailCard
              icon={<BookOpen className="w-4 h-4 text-accent" />}
              iconBg="bg-secondary"
              label={data.schoolType === 'college' ? 'Major(s)' : 'Intended Major(s)'}
              value={data.interests.join(', ')}
            />
          )}

          {data.extracurriculars && data.extracurriculars.length > 0 && (
            <DetailCard
              icon={<Activity className="w-4 h-4 text-primary" />}
              iconBg="bg-secondary"
              label="Extracurriculars"
              value={
                data.extracurriculars.slice(0, 3).join(', ') +
                (data.extracurriculars.length > 3
                  ? ` +${data.extracurriculars.length - 3} more`
                  : '')
              }
            />
          )}

          {data.aspirationalSchool && (
            <DetailCard
              icon={<Sparkles className="w-4 h-4 text-primary" />}
              iconBg="bg-secondary"
              label="Dream School"
              value={data.aspirationalSchool}
            />
          )}
        </div>

        <div className="flex gap-3 animate-fade-in mt-5">
          <GradientButton 
            variant="default"
            className="flex-1"
            onClick={() => setEditModalOpen(true)}
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

        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
        </div>
      </div>

      <EditFieldModal open={editModalOpen} onOpenChange={setEditModalOpen} />
    </OnboardingLayout>
  );
};

interface DetailCardProps {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
}

const DetailCard = ({ icon, iconBg, label, value }: DetailCardProps) => {
  const [expanded, setExpanded] = useState(false);
  // Only show expand affordance when content is long enough to warrant it
  const isLong = value.length > 42;

  return (
    <div className="gradient-border">
      <button
        type="button"
        onClick={() => isLong && setExpanded((v) => !v)}
        className={`w-full text-left bg-card rounded-lg px-4 py-3 flex items-start gap-3 transition-colors ${
          isLong ? "hover:bg-card/80 cursor-pointer" : "cursor-default"
        }`}
        aria-expanded={isLong ? expanded : undefined}
      >
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${iconBg}`}
        >
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
          <p
            className={`text-sm font-semibold text-foreground break-words transition-all duration-300 ${
              isLong && !expanded ? "line-clamp-1" : ""
            }`}
          >
            {value}
          </p>
        </div>
        {isLong && (
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground flex-shrink-0 mt-2 transition-transform duration-300 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        )}
      </button>
    </div>
  );
};

export default SchoolConfirm;
