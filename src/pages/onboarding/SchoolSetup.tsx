import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/context/OnboardingContext";
import { toast } from "sonner";
import { GraduationCap, School, ShieldCheck, Mail, IdCard } from "lucide-react";
import SchoolSearchDropdown from "@/components/SchoolSearchDropdown";
import MajorMultiSelect from "@/components/MajorMultiSelect";
import BackSkipRow from "@/components/onboarding/BackSkipRow";
import { cn } from "@/lib/utils";

type Status = 'high_school' | 'college' | 'graduate' | 'alumni' | 'not_student';
type DegreeType = 'bachelors' | 'associates' | 'both';

const OTHER_OPTIONS: { key: Status; label: string }[] = [
  { key: 'graduate', label: 'Graduate Student' },
  { key: 'alumni', label: 'Alumni' },
  { key: 'not_student', label: 'Not a Student' },
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
  const [degreeType, setDegreeType] = useState<DegreeType | ''>(
    (data.undergraduateDegreeType as DegreeType) || ''
  );
  const [associateMajor, setAssociateMajor] = useState<string>(
    (data.associateDegreeMajor || []).join(', ')
  );
  const [hsPursuingAssociates, setHsPursuingAssociates] = useState<boolean | null>(
    typeof data.highSchoolPursuingAssociates === 'boolean'
      ? data.highSchoolPursuingAssociates
      : null
  );

  const isHS = status === 'high_school';
  const isUG = status === 'college';
  const isGrad = status === 'graduate';
  const isAlum = status === 'alumni';
  const isStudent = isHS || isUG || isGrad;
  const needsSchool = isHS || isUG || isGrad || isAlum;

  const showAssociateMajor =
    (isUG && (degreeType === 'associates' || degreeType === 'both')) ||
    (isHS && hsPursuingAssociates === true);

  const canContinue = (): boolean => {
    if (!status) return false;
    if (status === 'not_student') return true;
    if (!schoolName.trim()) return false;
    if (!graduationYear) return false;
    if (isUG && !degreeType) return false;
    if (isHS && hsPursuingAssociates === null) return false;
    return true;
  };

  const buildUpdate = () => {
    const schoolType: 'high_school' | 'college' | 'other' | '' =
      isHS ? 'high_school' : needsSchool ? 'college' : 'other';
    const studentLevel: 'undergrad' | 'grad' | 'alumni' | '' =
      isUG ? 'undergrad' : isGrad ? 'grad' : isAlum ? 'alumni' : '';
    const parseMajors = (s: string) =>
      s.split(',').map((v) => v.trim()).filter(Boolean);
    return {
      educationStatus: (status || '') as Status | '',
      schoolType,
      schoolName: needsSchool ? schoolName.trim() : '',
      studentLevel,
      major: (isUG || isGrad || isAlum) ? major.trim() : '',
      degree: (isGrad || isAlum) ? degree.trim() : '',
      graduationYear: needsSchool && graduationYear ? parseInt(graduationYear, 10) : null,
      gradeOrYear: '',
      undergraduateDegreeType: (isUG ? (degreeType || '') : '') as DegreeType | '',
      collegeMajor:
        isUG && (degreeType === 'bachelors' || degreeType === 'both') && major.trim()
          ? parseMajors(major)
          : [],
      associateDegreeMajor: showAssociateMajor ? parseMajors(associateMajor) : [],
      highSchoolPursuingAssociates: isHS ? hsPursuingAssociates : null,
      intendedMajor: isHS ? data.intendedMajor || [] : [],
    };
  };

  const handleContinue = () => {
    if (!canContinue()) {
      if (!status) toast.error('Please select what best describes you');
      else if (!schoolName.trim()) toast.error('Please enter your school name');
      else if (isUG && !degreeType) toast.error('Please select your degree type');
      else if (isHS && hsPursuingAssociates === null)
        toast.error('Please tell us if you\'re pursuing an associate degree');
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
          <p className="text-sm font-medium text-foreground mb-2">I'm currently in…</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setStatus('high_school')}
              className={cn('gradient-border text-left', isHS && 'ring-2 ring-primary/50 rounded-lg')}
            >
              <div className={cn('bg-card rounded-lg p-4 flex flex-col items-center gap-2 transition-colors', isHS ? 'bg-primary/10' : 'hover:bg-secondary/40')}>
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                  <School className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">High School</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setStatus('college')}
              className={cn('gradient-border text-left', isUG && 'ring-2 ring-primary/50 rounded-lg')}
            >
              <div className={cn('bg-card rounded-lg p-4 flex flex-col items-center gap-2 transition-colors', isUG ? 'bg-primary/10' : 'hover:bg-secondary/40')}>
                <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-sm font-semibold text-foreground">College</p>
              </div>
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="text-xs text-muted-foreground self-center mr-1">Something else?</span>
            {OTHER_OPTIONS.map((opt) => {
              const active = status === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setStatus(opt.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-medium transition-colors border',
                    active
                      ? 'bg-primary/15 text-foreground border-primary/40'
                      : 'bg-secondary/40 text-muted-foreground border-transparent hover:bg-secondary',
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
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
                  What are you pursuing?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { k: 'bachelors', l: "Bachelor's" },
                    { k: 'associates', l: 'Associate' },
                    { k: 'both', l: 'Both' },
                  ] as { k: DegreeType; l: string }[]).map((o) => {
                    const active = degreeType === o.k;
                    return (
                      <button
                        key={o.k}
                        type="button"
                        onClick={() => setDegreeType(o.k)}
                        className={cn(
                          'rounded-lg py-2 text-sm font-medium transition-colors border',
                          active
                            ? 'bg-primary/15 text-foreground border-primary/50'
                            : 'bg-card text-muted-foreground border-border hover:bg-secondary/50',
                        )}
                      >
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {isUG && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  {degreeType === 'associates' ? "Bachelor's major " : "Major "}
                  <span className="text-muted-foreground">(optional)</span>
                </label>
                <MajorMultiSelect
                  value={major}
                  onChange={setMajor}
                  placeholder="Search majors..."
                  maxSelections={3}
                />
              </div>
            )}

            {isHS && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Are you also pursuing an associate degree?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { k: true, l: 'Yes' },
                    { k: false, l: 'No' },
                  ].map((o) => {
                    const active = hsPursuingAssociates === o.k;
                    return (
                      <button
                        key={String(o.k)}
                        type="button"
                        onClick={() => setHsPursuingAssociates(o.k)}
                        className={cn(
                          'rounded-lg py-2 text-sm font-medium transition-colors border',
                          active
                            ? 'bg-primary/15 text-foreground border-primary/50'
                            : 'bg-card text-muted-foreground border-border hover:bg-secondary/50',
                        )}
                      >
                        {o.l}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showAssociateMajor && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Associate degree major <span className="text-muted-foreground">(optional)</span>
                </label>
                <MajorMultiSelect
                  value={associateMajor}
                  onChange={setAssociateMajor}
                  placeholder="Search majors..."
                  maxSelections={2}
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
