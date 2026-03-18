import { useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { toast } from "sonner";
import { GraduationCap, School, ChevronLeft } from "lucide-react";
import SchoolSearchDropdown from "@/components/SchoolSearchDropdown";

const SchoolSetup = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [schoolType, setSchoolType] = useState<'high_school' | 'college' | ''>(
    data.schoolType === 'other' ? '' : data.schoolType
  );
  const [schoolName, setSchoolName] = useState(data.schoolName);
  const [gradeOrYear, setGradeOrYear] = useState(data.gradeOrYear);
  const [major, setMajor] = useState(data.major);

  const highSchoolGrades = ["Freshman (9th)", "Sophomore (10th)", "Junior (11th)", "Senior (12th)"];
  const collegeYears = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"];

  const handleContinue = () => {
    if (!schoolType) {
      toast.error("Please select your school type");
      return;
    }
    if (!schoolName.trim()) {
      toast.error("Please enter your school name");
      return;
    }
    if (!gradeOrYear) {
      toast.error("Please select your grade or year");
      return;
    }

    updateData({ 
      schoolType, 
      schoolName: schoolName.trim(), 
      gradeOrYear,
      major: major.trim(),
    });
    
    // High schoolers get the aspirational school question, then interests
    if (schoolType === 'high_school') {
      navigate("/onboarding/aspirational-school");
    } else {
      // College students go directly to interests
      navigate("/onboarding/interests");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleContinue();
    }
  };

  return (
    <OnboardingLayout>
    <div className="w-full max-w-md space-y-6 relative z-10 p-4" onKeyDown={handleKeyDown}>
      <div className="h-12" />

        {/* Title */}
        <div className="text-center space-y-2 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Where do you go?</h1>
          <p className="text-muted-foreground">Tell us about your school</p>
        </div>

        {/* School Type Selection */}
        <div className="grid grid-cols-2 gap-4 animate-fade-in">
          <button
            onClick={() => setSchoolType('high_school')}
            className={`p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
              schoolType === 'high_school'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground'
            }`}
          >
            <School className={`w-8 h-8 ${schoolType === 'high_school' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${schoolType === 'high_school' ? 'text-primary' : 'text-foreground'}`}>
              High School
            </span>
          </button>
          
          <button
            onClick={() => setSchoolType('college')}
            className={`p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
              schoolType === 'college'
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-muted-foreground'
            }`}
          >
            <GraduationCap className={`w-8 h-8 ${schoolType === 'college' ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`font-medium ${schoolType === 'college' ? 'text-primary' : 'text-foreground'}`}>
              College
            </span>
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {schoolType && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-foreground">
                {schoolType === 'high_school' ? 'High School' : 'College / University'}
              </label>
              <SchoolSearchDropdown
                value={schoolName}
                onChange={setSchoolName}
                schoolType={schoolType === 'high_school' ? 'high_school' : 'university'}
                placeholder={schoolType === 'high_school' ? 'Search for your high school...' : 'Search for your college...'}
              />
            </div>
          )}
          
          {schoolType && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-foreground">
                {schoolType === 'high_school' ? 'Grade' : 'Year'}
              </label>
              <div className="gradient-border">
                <select
                  value={gradeOrYear}
                  onChange={(e) => setGradeOrYear(e.target.value)}
                  className="w-full h-12 px-4 rounded-lg bg-card text-foreground focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="" className="bg-card">Select {schoolType === 'high_school' ? 'grade' : 'year'}</option>
                  {(schoolType === 'high_school' ? highSchoolGrades : collegeYears).map((option) => (
                    <option key={option} value={option} className="bg-card">
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {schoolType === 'college' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-foreground">
                Major(s) <span className="text-muted-foreground">(optional)</span>
              </label>
              <GradientInput
                type="text"
                placeholder="e.g., Computer Science, Business"
                value={major}
                onChange={(e) => setMajor(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-3 animate-fade-in pt-2">
            <GradientButton 
              variant="filled" 
              className="w-full"
              onClick={handleContinue}
            >
              Continue
            </GradientButton>

            <button
              onClick={() => { updateData({ schoolType, schoolName: schoolName.trim(), gradeOrYear, major: major.trim() }); navigate("/onboarding/how-did-you-hear"); }}
              className="w-full flex items-center justify-center gap-1 py-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center gap-2 pt-4 animate-fade-in">
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full gradient-bg" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
          <div className="w-8 h-1 rounded-full bg-muted" />
        </div>
    </div>
    </OnboardingLayout>
  );
};

export default SchoolSetup;
