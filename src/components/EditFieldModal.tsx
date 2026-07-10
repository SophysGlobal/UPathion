import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { School, GraduationCap, BookOpen, Activity, Sparkles, User, MessageSquare, Award } from "lucide-react";
import { useOnboarding } from "@/context/OnboardingContext";

interface EditFieldModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditFieldModal = ({ open, onOpenChange }: EditFieldModalProps) => {
  const navigate = useNavigate();
  const { data } = useOnboarding();

  const status = data.educationStatus;
  const isCollege = status === 'college' || (!status && data.schoolType === 'college');
  const isHs = status === 'high_school' || (!status && data.schoolType === 'high_school');
  const isGrad = status === 'graduate';

  const educationValue =
    status === 'college'
      ? `College${data.undergraduateDegreeType ? ` · ${
          data.undergraduateDegreeType === 'bachelors' ? "Bachelor's"
            : data.undergraduateDegreeType === 'associates' ? 'Associate'
            : "Bachelor's & Associate"
        }` : ''}`
      : status === 'high_school'
      ? `High School${data.highSchoolPursuingAssociates ? ' · Assoc.' : ''}`
      : status === 'graduate'
      ? 'Graduate'
      : 'Not set';

  const collegeMajors = data.collegeMajor || [];
  const associateMajors = data.associateDegreeMajor || [];
  const intendedMajors = data.interests || [];

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
    ...(isHs ? [{
      label: "Dream School",
      icon: Sparkles,
      route: "/onboarding/aspirational-school",
      value: data.aspirationalSchool || "Not set",
    }] : []),
    {
      label: "Education",
      icon: GraduationCap,
      route: "/onboarding/school",
      value: educationValue,
    },
    ...(isCollege && (data.undergraduateDegreeType === 'bachelors' || data.undergraduateDegreeType === 'both' || collegeMajors.length) ? [{
      label: "Bachelor's Major(s)",
      icon: BookOpen,
      route: "/onboarding/school",
      value: collegeMajors.length ? collegeMajors.slice(0, 2).join(', ') : 'Not set',
    }] : []),
    ...((isCollege && (data.undergraduateDegreeType === 'associates' || data.undergraduateDegreeType === 'both')) ||
        (isHs && data.highSchoolPursuingAssociates)
      ? [{
          label: "Associate Major(s)",
          icon: BookOpen,
          route: "/onboarding/school",
          value: associateMajors.length ? associateMajors.slice(0, 2).join(', ') : 'Not set',
        }]
      : []),
    ...(isHs ? [{
      label: "Intended Major(s)",
      icon: BookOpen,
      route: "/onboarding/interests",
      value: intendedMajors.length ? intendedMajors.slice(0, 2).join(', ') : 'Not set',
    }] : []),
    ...(isGrad ? [{
      label: "Degree",
      icon: Award,
      route: "/onboarding/school",
      value: data.degree || 'Not set',
    }] : []),
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
