import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { School, GraduationCap, BookOpen, Activity, Sparkles, User, MessageSquare } from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";

interface EditFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditFieldModal = ({ open, onOpenChange }: EditFieldModalProps) => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const isCollege = data.schoolType === 'college';
  const majorList = isCollege
    ? (data.major || '').split(',').map((m) => m.trim()).filter(Boolean)
    : (data.interests || []);

  const fields = [
    {
      label: "Name & Username",
      icon: User,
      route: "/onboarding/name",
      value: data.fullName || "Not set",
    },
    {
      label: "Referral Source",
      icon: MessageSquare,
      route: "/onboarding/how-did-you-hear",
      value: data.referralSource || "Not set",
    },
    {
      label: "School",
      icon: data.schoolType === 'college' ? GraduationCap : School,
      route: "/onboarding/school",
      value: data.schoolName || "Not set",
    },
    ...(data.schoolType === 'high_school' ? [{
      label: "Dream School",
      icon: Sparkles,
      route: "/onboarding/aspirational-school",
      value: data.aspirationalSchool || "Not set",
    }] : []),
    {
      label: isCollege ? "Major(s)" : "Intended Major(s)",
      icon: BookOpen,
      // College users edit their major on the school selection step
      // (majors are captured inline there). High schoolers use the
      // standalone intended-majors step.
      route: isCollege ? "/onboarding/school" : "/onboarding/interests",
      value: majorList.length ? majorList.slice(0, 2).join(", ") : "Not set",
    },
    {
      label: "Extracurriculars",
      icon: Activity,
      route: "/onboarding/extracurriculars",
      value: data.extracurriculars?.length ? data.extracurriculars.slice(0, 2).join(", ") : "Not set",
    },
    {
      label: "About",
      icon: MessageSquare,
      route: "/onboarding/about",
      value: data.about?.trim() ? data.about.trim().slice(0, 40) + (data.about.trim().length > 40 ? "…" : "") : "Not set",
    },
  ];

  const handleNavigate = (route: string) => {
    onOpenChange(false);
    navigate(route);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">Edit your details</DialogTitle>
        </DialogHeader>
        <div className="space-y-1 -mx-2">
          {fields.map((field) => (
            <button
              key={field.route}
              onClick={() => handleNavigate(field.route)}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                <field.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{field.label}</p>
                <p className="text-xs text-muted-foreground truncate">{field.value}</p>
              </div>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditFieldModal;
