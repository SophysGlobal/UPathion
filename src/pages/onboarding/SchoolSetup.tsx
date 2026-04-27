import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingLayout from "@/components/OnboardingLayout";
import { GradientInput } from "@/components/ui/GradientInput";
import { GradientButton } from "@/components/ui/GradientButton";
import { useOnboarding } from "@/context/OnboardingContext";
import { toast } from "sonner";
import { GraduationCap, School } from "lucide-react";
import SchoolSearchDropdown from "@/components/SchoolSearchDropdown";
import BackSkipRow from "@/components/onboarding/BackSkipRow";

const SchoolSetup = () => {
  const navigate = useNavigate();
  const { data, updateData } = useOnboarding();
  const [schoolType, setSchoolType] = useState<'high_school' | 'college' | ''>(
    data.schoolType === 'other' ? '' : data.schoolType
  );

  // Separate state per school type to prevent cross-contamination
  const [highSchoolName, setHighSchoolName] = useState(
    data.schoolType === 'high_school' ? data.schoolName : ''
  );
  const [collegeName, setCollegeName] = useState(
    data.schoolType === 'college' ? data.schoolName : ''
  );

  const [gradeOrYear, setGradeOrYear] = useState(data.gradeOrYear);
  const [major, setMajor] = useState(data.major);

  // Derived active school name
  const schoolName = schoolType === 'high_school' ? highSchoolName : schoolType === 'college' ? collegeName : '';

  const highSchoolGrades = ["Freshman (9th)", "Sophomore (10th)", "Junior (11th)", "Senior (12th)"];
  const collegeYears = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate Student"];

  // Reset grade when switching types since grade options differ
  const handleSchoolTypeChange = (type: 'high_school' | 'college') => {
    if (type !== schoolType) {
      setGradeOrYear('');
    }
    setSchoolType(type);
  };

  const handleContinue = () => {
    if (!schoolType) { toast.error("Please select your school type"); return; }
    if (!schoolName.trim()) { toast.error("Please enter your school name"); return; }
    if (!gradeOrYear) { toast.error("Please select your grade or year"); return; }
    updateData({ schoolType, schoolName: schoolName.trim(), gradeOrYear, major: major.trim() });
    if (schoolType === 'high_school') { navigate("/onboarding/aspirational-school"); }
    else { navigate("/onboarding/interests"); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); handleContinue(); }
  };

  return (
    <OnboardingLayout>
      <div className="text-center space-y-2 animate-fade-in">
        <h1 className="text-3xl font-bold text-foreground">Where do you go?</h1>
        <p className="text-muted-foreground">Tell us about your school</p>
      </div>

      <div className="grid grid-cols-2 gap-4 animate-fade-in">
        <button onClick={() => handleSchoolTypeChange('high_school')}
          className={`p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
            schoolType === 'high_school' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground'
          }`}>
          <School className={`w-8 h-8 ${schoolType === 'high_school' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`font-medium ${schoolType === 'high_school' ? 'text-primary' : 'text-foreground'}`}>High School</span>
        </button>
        <button onClick={() => handleSchoolTypeChange('college')}
          className={`p-4 rounded-lg border-2 transition-all duration-300 flex flex-col items-center gap-2 ${
            schoolType === 'college' ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground'
          }`}>
          <GraduationCap className={`w-8 h-8 ${schoolType === 'college' ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className={`font-medium ${schoolType === 'college' ? 'text-primary' : 'text-foreground'}`}>College</span>
        </button>
      </div>

      <div className="space-y-4" onKeyDown={handleKeyDown}>
        {schoolType === 'high_school' && (
          <div className="space-y-2 animate-fade-in" key="hs-search">
            <label className="text-sm font-medium text-foreground">High School</label>
            <SchoolSearchDropdown
              value={highSchoolName}
              onChange={setHighSchoolName}
              schoolType="high_school"
              placeholder="e.g: Lincoln High School"
            />
          </div>
        )}
        {schoolType === 'college' && (
          <div className="space-y-2 animate-fade-in" key="college-search">
            <label className="text-sm font-medium text-foreground">College / University</label>
            <SchoolSearchDropdown
              value={collegeName}
              onChange={setCollegeName}
              schoolType="university"
              placeholder="e.g: University of Michigan"
            />
          </div>
        )}
        {schoolType && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium text-foreground">{schoolType === 'high_school' ? 'Grade' : 'Year'}</label>
            <div className="gradient-border">
              <select value={gradeOrYear} onChange={(e) => setGradeOrYear(e.target.value)}
                className="w-full h-12 px-4 rounded-lg bg-card text-foreground focus:outline-none appearance-none cursor-pointer">
                <option value="" className="bg-card">Select {schoolType === 'high_school' ? 'grade' : 'year'}</option>
                {(schoolType === 'high_school' ? highSchoolGrades : collegeYears).map((option) => (
                  <option key={option} value={option} className="bg-card">{option}</option>
                ))}
              </select>
            </div>
          </div>
        )}
        {schoolType === 'college' && (
          <div className="space-y-2 animate-fade-in">
            <label className="text-sm font-medium text-foreground">Major(s) <span className="text-muted-foreground">(optional)</span></label>
            <GradientInput type="text" placeholder="e.g., Computer Science, Business" value={major} onChange={(e) => setMajor(e.target.value)} />
          </div>
        )}
        <div className="space-y-3 animate-fade-in pt-2">
          <GradientButton variant="filled" className="w-full" onClick={handleContinue}>Continue</GradientButton>
          <BackSkipRow
            onBack={() => {
              updateData({ schoolType, schoolName: schoolName.trim(), gradeOrYear, major: major.trim() });
              navigate("/onboarding/how-did-you-hear");
            }}
          />
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
