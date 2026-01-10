import { useNavigate } from "react-router-dom";
import { X, MapPin, Users, Award, Building2, GraduationCap, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

interface SchoolInfo {
  name: string;
  type: 'high_school' | 'college' | 'university';
  location?: string;
  description?: string;
  tags?: string[];
  studentCount?: string;
  ranking?: string;
}

interface SchoolBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  school: SchoolInfo | null;
  isOwnSchool?: boolean;
}

// Mock data for school details - in production this would come from API
const getSchoolDetails = (schoolName: string): SchoolInfo => {
  const isHighSchool = schoolName.toLowerCase().includes('high school') || 
                       schoolName.toLowerCase().includes('high') ||
                       schoolName.toLowerCase().includes('academy');
  
  return {
    name: schoolName,
    type: isHighSchool ? 'high_school' : 'university',
    location: "Boston, MA",
    description: `${schoolName} is a distinguished educational institution committed to academic excellence and student success. The school offers a diverse curriculum and vibrant extracurricular programs.`,
    tags: isHighSchool 
      ? ["STEM", "Arts", "Athletics", "College Prep", "Clubs"]
      : ["Research", "STEM", "Liberal Arts", "Internships", "Greek Life"],
    studentCount: isHighSchool ? "1,800+" : "25,000+",
    ranking: isHighSchool ? "Top 50 MA" : "#42 National",
  };
};

const SchoolBottomSheet = ({ open, onOpenChange, school, isOwnSchool = false }: SchoolBottomSheetProps) => {
  const navigate = useNavigate();
  
  if (!school) return null;
  
  const schoolDetails = getSchoolDetails(school.name);
  const typeLabel = schoolDetails.type === 'high_school' ? 'High School' : 'University';
  
  const handleConnect = () => {
    onOpenChange(false);
    navigate(`/school-community?school=${encodeURIComponent(school.name)}`);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-background/95 backdrop-blur-xl border-t border-border/50">
        {/* Header with title and close button */}
        <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/30">
          <DrawerTitle className="text-lg font-semibold text-foreground truncate pr-4">
            {school.name}
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="p-2 hover:bg-secondary/50 rounded-full transition-colors flex-shrink-0">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Content */}
        <div className="px-6 py-4 space-y-5 overflow-y-auto max-h-[60vh]">
          {/* School Type & Location */}
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-primary">{typeLabel}</p>
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm truncate">{schoolDetails.location}</span>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-sm font-semibold text-foreground">{schoolDetails.studentCount}</p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Ranking</p>
                <p className="text-sm font-semibold text-foreground">{schoolDetails.ranking}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">About</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {schoolDetails.description}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Highlights</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {schoolDetails.tags?.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Connect Button */}
          <Button
            onClick={handleConnect}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
          >
            <Users className="w-4 h-4 mr-2" />
            {isOwnSchool ? "Connect with others at your school" : "Connect with people from this school"}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SchoolBottomSheet;
