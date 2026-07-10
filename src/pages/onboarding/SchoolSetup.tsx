import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/context/OnboardingContext";
import { toast } from "sonner";
import { GraduationCap, ShieldCheck, Mail, IdCard } from "lucide-react";
import SchoolSearchDropdown from "@/components/SchoolSearchDropdown";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import BackSkipRow from "@/components/onboarding/BackSkipRow";
import { cn } from "@/lib/utils";

type Status = 'high_school' | 'college' | 'graduate' | 'alumni' | 'not_student';

const STATUS_OPTIONS: { key: Status; label: string; hint: string }[] = [
  { key: 'high_school', label: 'High School Student', hint: 'Currently in high school' },
  { key: 'college', label: 'Undergraduate Student', hint: 'Pursuing a bachelor\'s or associate degree' },
  { key: 'graduate', label: 'Graduate Student', hint: "Master's, PhD, or professional program" },
  { key: 'alumni', label: 'Alumni / Graduate', hint: 'Finished school' },
  { key: 'not_student', label: 'Not a Student', hint: 'Just here to connect' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 20 }, (_, i) => CURRENT_YEAR - 10 + i);

const deriveInitialStatus = (data: {
  educationStatus: string;
  schoolType: string;
  studentLevel: string;
}): Status | '' => {
  if (data.educationStatus) return data.educationStatus as Status;
  if (data.schoolType === 'high_school') return 'high_school';
  if (data.schoolType === 'college') {
    if (data.studentLevel === 'grad') return 'graduate';
    if (data.studentLevel === 'alumni') return 'alumni';
    return 'college';
  }
  if (data.schoolType === 'other') return 'not_student';
  return '';
};

const SchoolSetup = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [status, setStatus] = useState<Status | ''>(deriveInitialStatus(data));
  const [schoolName, setSchoolName] = useState(data.schoolName || '');
  const [major, setMajor] = useState(data.major || '');
  const [degree, setDegree] = useState(data.degree || '');
  const [graduationYear, setGraduationYear] = useState<string>(
    data.graduationYear ? String(data.graduationYear) : ''
  );

  const isHS = status === 'high_school';
  const isUG = status === 'college';
  const isGrad = status === 'graduate';
  const isAlum = status === 'alumni';
  const isStudent = isHS || isUG || isGrad;
  const needsSchool = isHS || isUG || isGrad || isAlum;

  const canContinue = (): boolean => {
    if (!status) return false;
    if (status === 'not_student') return true;
    if (!schoolName.trim()) return false;
    if (!graduationYear) return false;
    return true;
  };

  const buildUpdate = () => {
    const schoolType: 'high_school' | 'college' | 'other' | '' =
      isHS ? 'high_school' : needsSchool ? 'college' : 'other';
    const studentLevel: 'undergrad' | 'grad' | 'alumni' | '' =
      isUG ? 'undergrad' : isGrad ? 'grad' : isAlum ? 'alumni' : '';
    return {
      educationStatus: status || '',
      schoolType,
      schoolName: needsSchool ? schoolName.trim() : '',
      studentLevel,
      major: (isUG || isGrad || isAlum) ? major.trim() : '',
      degree: (isGrad || isAlum) ? degree.trim() : '',
      graduationYear: needsSchool && graduationYear ? parseInt(graduationYear, 10) : null,
      // Keep gradeOrYear cleared — deprecated by this consolidated screen.
      gradeOrYear: '',
      // Clear undergrad/associate detail from the old questionnaire so
      // confirm and profile screens don't show stale values.
      undergraduateDegreeType: '' as const,
      collegeMajor: isUG && major.trim() ? major.split(',').map((s) => s.trim()).filter(Boolean) : [],
      associateDegreeMajor: [],
      highSchoolPursuingAssociates: null,
      // High-schoolers still get the aspirational-school step; clear any
      // stale "intended major" for other paths.
      intendedMajor: isHS ? data.intendedMajor || [] : [],
    };
  };

  const handleContinue = () => {
    if (!canContinue()) {
      if (!status) toast.error('Please select what best describes you');
      else if (!schoolName.trim()) toast.error('Please enter your school name');
      else toast.error('Please select your graduation year');
      return;
    }
    updateData(buildUpdate());
    if (isHS) navigate('/onboarding/aspirational-school');
    else navigate('/onboarding/extracurriculars');
  };

  const handleBack = () => {
    updateData(buildUpdate());
    navigate('/onboarding/how-did-you-hear');
  };

  const handleVerify = () => {
    updateData(buildUpdate());
    navigate('/verify-student');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContinue();
    }
  };

  const schoolLabel = isHS ? 'High School' : 'College / University';
  const schoolPlaceholder = isHS ? 'e.g. Lincoln High School' : 'e.g. University of Michigan';

  return (
    <OnboardingLayout>
      <div className="text-center space-y-2 animate-fade-in">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full gradient-bg mx-auto mb-1">
          <GraduationCap className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Your education</h1>
        <p className="text-muted-foreground px-4">
          Tell us where you are — we'll only ask what's relevant.
        </p>
      </div>

      <div className="space-y-5 animate-fade-in" onKeyDown={handleKeyDown}>
        <div>
          <p className="text-sm font-medium text-foreground mb-2">What best describes you?</p>
          <div className="grid grid-cols-1 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatus(opt.key)}
                className={cn(
                  'gradient-border text-left',
                  status === opt.key && 'ring-2 ring-primary/50 rounded-lg',
                )}
              >
                <div
                  className={cn(
                    'bg-card rounded-lg px-4 py-3 transition-colors',
                    status === opt.key ? 'bg-primary/10' : 'hover:bg-secondary/40',
                  )}
                >
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {needsSchool && (
          <div className="space-y-4 animate-fade-in">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">{schoolLabel}</label>
              <SchoolSearchDropdown
                value={schoolName}
                onChange={setSchoolName}
                schoolType={isHS ? 'high_school' : 'university'}
                placeholder={schoolPlaceholder}
              />
            </div>

            {isUG && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Major <span className="text-muted-foreground">(optional)</span>
                </label>
                <MajorMultiSelect
                  value={major}
                  onChange={setMajor}
                  placeholder="Search majors..."
                  maxSelections={3}
                />
              </div>
            )}

            {isGrad && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Graduate program <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="gradient-border">
                  <Input
                    value={degree}
                    onChange={(e) => setDegree(e.target.value.slice(0, 100))}
                    placeholder="e.g. M.S. in Computer Science"
                    className="bg-card border-0 focus-visible:ring-0"
                  />
                </div>
              </div>
            )}

            {isAlum && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Degree <span className="text-muted-foreground">(optional)</span>
                </label>
                <div className="gradient-border">
                  <Input
                    value={degree}
                    onChange={(e) => setDegree(e.target.value.slice(0, 100))}
                    placeholder="e.g. B.A. in Economics"
                    className="bg-card border-0 focus-visible:ring-0"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                {isAlum ? 'Graduation year' : 'Expected graduation year'}
              </label>
              <div className="gradient-border">
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-card text-sm text-foreground focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">Select a year</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {isStudent && (
          <div className="animate-fade-in gradient-border">
            <div className="bg-card rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full gradient-bg flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    Verify your student status <span className="text-muted-foreground font-normal">(optional)</span>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Verified students get a badge on their profile to build trust. You can skip and verify later from your dashboard.
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleVerify}
                  className="flex items-center justify-center gap-2 rounded-md bg-secondary/60 hover:bg-secondary transition-colors py-2 text-xs font-medium text-foreground"
                >
                  <Mail className="w-3.5 h-3.5" /> School email
                </button>
                <button
                  type="button"
                  onClick={handleVerify}
                  className="flex items-center justify-center gap-2 rounded-md bg-secondary/60 hover:bg-secondary transition-colors py-2 text-xs font-medium text-foreground"
                >
                  <IdCard className="w-3.5 h-3.5" /> Upload student ID
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3 pt-1">
          <GradientButton
            variant="filled"
            className="w-full"
            onClick={handleContinue}
            disabled={!canContinue()}
          >
            Continue
          </GradientButton>
          <BackSkipRow onBack={handleBack} />
        </div>
      </div>

      <div className="flex justify-center gap-2 pt-4 animate-fade-in">
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full gradient-bg" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
        <div className="w-8 h-1 rounded-full bg-muted" />
      </div>
    </OnboardingLayout>
  );
};

export default SchoolSetup;
