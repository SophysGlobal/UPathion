import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { X, MapPin, Users, Award, Building2, GraduationCap, BookOpen, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
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

const SchoolBottomSheet = ({ open, onOpenChange, school, isOwnSchool = false }: SchoolBottomSheetProps) => {
  const navigate = useNavigate();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [isLoadingId, setIsLoadingId] = useState(false);
  
  // Look up the school ID when the sheet opens
  useEffect(() => {
    const findSchoolId = async () => {
      if (!school?.name || !open) return;
      
      setIsLoadingId(true);
      try {
        const { data } = await supabase
          .from('schools')
          .select('id')
          .ilike('name', school.name)
          .maybeSingle();
        
        setSchoolId(data?.id || null);
      } catch (err) {
        console.error('Error finding school:', err);
        setSchoolId(null);
      } finally {
        setIsLoadingId(false);
      }
    };
    
    findSchoolId();
  }, [school?.name, open]);
  
  if (!school) return null;
  
  const isHighSchool = school.type === 'high_school';
  const typeLabel = isHighSchool ? 'High School' : 'University';
  
  const handleConnect = () => {
    onOpenChange(false);
    navigate(`/school-community?school=${encodeURIComponent(school.name)}`);
  };

  const handleViewProfile = () => {
    if (schoolId) {
      onOpenChange(false);
      navigate(`/school/${schoolId}`);
    }
  };

  // Generate a basic description if not provided
  const description = school.description || 
    `${school.name} is a distinguished educational institution committed to academic excellence and student success.`;

  // Generate tags based on school type if not provided
  const tags = school.tags || (isHighSchool 
    ? ["Academics", "Athletics", "Arts", "Clubs", "College Prep"]
    : ["Research", "STEM", "Liberal Arts", "Internships", "Student Life"]);

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
              {school.location && (
                <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm truncate">{school.location}</span>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
              <Users className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Students</p>
                <p className="text-sm font-semibold text-foreground">
                  {school.studentCount || "—"}
                </p>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary/50 flex items-center gap-3">
              <Award className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-muted-foreground">Ranking</p>
                <p className="text-sm font-semibold text-foreground">
                  {school.ranking || "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">About</h4>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
              {description}
            </p>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <h4 className="text-sm font-medium text-foreground">Highlights</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 5).map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {/* View Full Profile Button - ALWAYS show this button */}
            {isLoadingId ? (
              <Skeleton className="h-12 w-full" />
            ) : (
              <Button
                onClick={handleViewProfile}
                variant="outline"
                className="w-full py-6 group"
                disabled={!schoolId}
              >
                View Full School Profile
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              </Button>
            )}

            {/* Connect Button */}
            <Button
              onClick={handleConnect}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
            >
              <Users className="w-4 h-4 mr-2" />
              {isOwnSchool ? "Connect with others at your school" : "Connect with people from this school"}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default SchoolBottomSheet;
