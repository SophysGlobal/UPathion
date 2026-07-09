import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientButton } from "@/components/ui/GradientButton";
import { Input } from "@/components/ui/input";
import { useOnboarding } from "@/context/OnboardingContext";
import BackSkipRow from "@/components/onboarding/BackSkipRow";
import { GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";
import MajorMultiSelect from "@/components/MajorMultiSelect";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 4 + i);

type EducationStatus = "high_school" | "college" | "graduate";
type UndergradType = "bachelors" | "associates" | "both";

const STATUS_OPTIONS: { key: EducationStatus; label: string; hint: string }[] = [
  { key: "high_school", label: "High School Student", hint: "Currently in high school" },
  { key: "college", label: "College Student", hint: "Currently pursuing an undergraduate degree" },
  { key: "graduate", label: "Graduate Student", hint: "Master's, PhD, or professional program" },
];

const UNDERGRAD_OPTIONS: { key: UndergradType; label: string; hint: string }[] = [
  { key: "bachelors", label: "Bachelor's degree", hint: "4-year undergraduate degree" },
  { key: "associates", label: "Associate degree", hint: "2-year undergraduate degree" },
  { key: "both", label: "Both", hint: "Pursuing both a bachelor's and an associate degree" },
];

const Education = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();

  const [status, setStatus] = useState<EducationStatus | "">(
    (data.educationStatus as EducationStatus) ||
      (data.schoolType === "college"
        ? "college"
        : data.schoolType === "high_school"
        ? "high_school"
        : data.studentLevel === "grad"
        ? "graduate"
        : ""),
  );
  const [undergradType, setUndergradType] = useState<UndergradType | "">(
    (data.undergraduateDegreeType as UndergradType) || "",
  );
  const [collegeMajor, setCollegeMajor] = useState<string>((data.collegeMajor || []).join(", "));
  const [associateMajor, setAssociateMajor] = useState<string>((data.associateDegreeMajor || []).join(", "));
  const [hsPursuingAssoc, setHsPursuingAssoc] = useState<boolean | null>(
    typeof data.highSchoolPursuingAssociates === "boolean" ? data.highSchoolPursuingAssociates : null,
  );
  const [degree, setDegree] = useState(data.degree || "");
  const [gradYear, setGradYear] = useState<string>(data.graduationYear ? String(data.graduationYear) : "");

  const toArr = (csv: string) =>
    csv.split(",").map((s) => s.trim()).filter(Boolean);

  const save = () => {
    const isCollege = status === "college";
    const isHs = status === "high_school";
    const isGrad = status === "graduate";
    updateData({
      educationStatus: status || "",
      undergraduateDegreeType: isCollege ? (undergradType || "") : "",
      collegeMajor: isCollege && (undergradType === "bachelors" || undergradType === "both") ? toArr(collegeMajor) : [],
      associateDegreeMajor:
        (isCollege && (undergradType === "associates" || undergradType === "both")) ||
        (isHs && hsPursuingAssoc === true)
          ? toArr(associateMajor)
          : [],
      highSchoolPursuingAssociates: isHs ? !!hsPursuingAssoc : null,
      // Keep legacy student_level in sync for compatibility with existing UI
      studentLevel: isGrad ? "grad" : isCollege ? (data.studentLevel === "alumni" ? "alumni" : "undergrad") : "",
      degree: isGrad ? degree.trim() : "",
      graduationYear: isGrad && gradYear ? parseInt(gradYear, 10) : isCollege && gradYear ? parseInt(gradYear, 10) : null,
      // Legacy `major` field kept aligned with college_major so nothing that
      // still reads it breaks.
      major:
        isCollege && (undergradType === "bachelors" || undergradType === "both")
          ? toArr(collegeMajor).join(", ")
          : "",
    });
  };

  const canContinue = (): boolean => {
    if (!status) return false;
    if (status === "college" && !undergradType) return false;
    if (status === "high_school" && hsPursuingAssoc === null) return false;
    return true;
  };

  const handleContinue = () => {
    if (!canContinue()) return;
    save();
    navigate("/onboarding/school-confirm");
  };

  const handleSkip = () => {
    // Preserve existing values rather than nulling them out.
    save();
    navigate("/onboarding/school-confirm");
  };

  const handleBack = () => {
    save();
    navigate("/onboarding/about");
  };

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

      <div className="space-y-5 animate-fade-in">
        {/* Status */}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">I am a…</p>
          <div className="grid grid-cols-1 gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setStatus(opt.key)}
                className={cn(
                  "gradient-border text-left",
                  status === opt.key && "ring-2 ring-primary/50 rounded-lg",
                )}
              >
                <div className={cn(
                  "bg-card rounded-lg px-4 py-3 transition-colors",
                  status === opt.key ? "bg-primary/10" : "hover:bg-secondary/40",
                )}>
                  <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground">{opt.hint}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* College conditional */}
        {status === "college" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">What are you pursuing?</p>
              <div className="grid grid-cols-1 gap-2">
                {UNDERGRAD_OPTIONS.map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setUndergradType(opt.key)}
                    className={cn(
                      "gradient-border text-left",
                      undergradType === opt.key && "ring-2 ring-primary/50 rounded-lg",
                    )}
                  >
                    <div className={cn(
                      "bg-card rounded-lg px-4 py-3 transition-colors",
                      undergradType === opt.key ? "bg-primary/10" : "hover:bg-secondary/40",
                    )}>
                      <p className="text-sm font-semibold text-foreground">{opt.label}</p>
                      <p className="text-xs text-muted-foreground">{opt.hint}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {(undergradType === "bachelors" || undergradType === "both") && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Bachelor's major(s)
                </label>
                <MajorMultiSelect value={collegeMajor} onChange={setCollegeMajor} />
              </div>
            )}

            {(undergradType === "associates" || undergradType === "both") && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Associate degree major(s)
                </label>
                <MajorMultiSelect value={associateMajor} onChange={setAssociateMajor} />
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Expected graduation year (optional)
              </label>
              <div className="gradient-border">
                <select
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full bg-card rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                >
                  <option value="">Select a year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* High school conditional */}
        {status === "high_school" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Are you currently pursuing an associate degree while in high school?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: true, label: "Yes" },
                  { key: false, label: "No" },
                ].map((opt) => (
                  <button
                    key={String(opt.key)}
                    type="button"
                    onClick={() => setHsPursuingAssoc(opt.key)}
                    className={cn(
                      "gradient-border text-center",
                      hsPursuingAssoc === opt.key && "ring-2 ring-primary/50 rounded-lg",
                    )}
                  >
                    <div className={cn(
                      "bg-card rounded-lg px-4 py-3 transition-colors text-sm font-semibold text-foreground",
                      hsPursuingAssoc === opt.key ? "bg-primary/10" : "hover:bg-secondary/40",
                    )}>
                      {opt.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {hsPursuingAssoc === true && (
              <div className="animate-fade-in">
                <label className="text-sm font-medium text-foreground block mb-1.5">
                  Associate degree major(s)
                </label>
                <MajorMultiSelect value={associateMajor} onChange={setAssociateMajor} />
                <p className="text-xs text-muted-foreground mt-1.5">
                  This is separate from what you plan to study in college.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Graduate conditional */}
        {status === "graduate" && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Degree (optional)</label>
              <div className="gradient-border">
                <Input
                  value={degree}
                  onChange={(e) => setDegree(e.target.value.slice(0, 80))}
                  placeholder="e.g. M.S. in Computer Science, JD, PhD in Biology"
                  className="bg-card border-0 focus-visible:ring-0"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">
                Expected graduation year (optional)
              </label>
              <div className="gradient-border">
                <select
                  value={gradYear}
                  onChange={(e) => setGradYear(e.target.value)}
                  className="w-full bg-card rounded-lg h-10 px-3 text-sm text-foreground focus:outline-none"
                >
                  <option value="">Select a year</option>
                  {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3 animate-fade-in pt-1">
        <GradientButton
          variant="filled"
          className="w-full"
          onClick={handleContinue}
          disabled={!canContinue()}
        >
          Continue
        </GradientButton>
        <BackSkipRow onBack={handleBack} onSkip={handleSkip} />
      </div>

      <div className="flex justify-center gap-2 pt-4 animate-fade-in">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="w-8 h-1 rounded-full gradient-bg" />
        ))}
      </div>
    </OnboardingLayout>
  );
};

export default Education;