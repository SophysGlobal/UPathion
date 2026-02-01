import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { X, School, GraduationCap, Users, BookOpen, ArrowRight } from "lucide-react";
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
import { toast } from "sonner";

interface UserProfile {
  id: string;
  display_name: string;
  username?: string;
  bio?: string;
  school_name?: string;
  school_type?: string;
  grade_or_year?: string;
  major?: string;
  aspirational_school?: string;
}

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const getRoleBadgeColor = (schoolType?: string) => {
  if (!schoolType) return 'bg-primary/20 text-primary';
  switch (schoolType) {
    case 'high_school': return 'bg-blue-500/20 text-blue-400';
    case 'college': 
    case 'university': return 'bg-primary/20 text-primary';
    default: return 'bg-secondary text-muted-foreground';
  }
};

const getRoleLabel = (schoolType?: string) => {
  if (!schoolType) return 'Student';
  switch (schoolType) {
    case 'high_school': return 'High School Student';
    case 'college':
    case 'university': return 'College Student';
    default: return 'Student';
  }
};

const UserProfileSheet = ({ open, onOpenChange, userId }: UserProfileSheetProps) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId || !open) return;
      
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, username, bio, school_name, school_type, grade_or_year, major, aspirational_school')
          .eq('id', userId)
          .single();
        
        if (error) throw error;
        setProfile(data);

        // Look up school ID if school name exists
        if (data?.school_name) {
          const { data: schoolData } = await supabase
            .from('schools')
            .select('id')
            .ilike('name', data.school_name)
            .maybeSingle();
          
          setSchoolId(schoolData?.id || null);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        toast.error('Failed to load profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, open]);
  
  if (!open) return null;

  const handleConnect = () => {
    onOpenChange(false);
    toast.success(`Connection request sent to ${profile?.display_name || 'user'}!`);
  };

  const handleViewProfile = () => {
    if (userId) {
      onOpenChange(false);
      navigate(`/user/${userId}`);
    }
  };

  const handleSchoolClick = () => {
    if (schoolId) {
      onOpenChange(false);
      navigate(`/school/${schoolId}`);
    }
  };

  const roleLabel = getRoleLabel(profile?.school_type);
  const isHighSchool = profile?.school_type === 'high_school';
  const SchoolIcon = isHighSchool ? School : GraduationCap;

  // Generate interests/tags from profile data
  const interests: string[] = [];
  if (profile?.major) interests.push(profile.major);
  if (profile?.grade_or_year) interests.push(profile.grade_or_year);
  if (profile?.aspirational_school) interests.push(`Aspiring: ${profile.aspirational_school}`);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] bg-background/95 backdrop-blur-xl border-t border-border/50">
        {/* Header */}
        <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/30">
          <DrawerTitle className="text-lg font-semibold text-foreground truncate pr-4">
            {isLoading ? 'Loading...' : profile?.display_name || 'User Profile'}
          </DrawerTitle>
          <DrawerClose asChild>
            <button className="p-2 hover:bg-secondary/50 rounded-full transition-colors flex-shrink-0">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Content */}
        <div className="px-6 py-4 space-y-5 overflow-y-auto max-h-[60vh]">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : profile ? (
            <>
              {/* Profile Header */}
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-7 h-7 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-primary">{roleLabel}</p>
                  {profile.username && (
                    <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
                  )}
                </div>
              </div>

              {/* School Info - Clickable */}
              {profile.school_name && (
                <button
                  onClick={handleSchoolClick}
                  disabled={!schoolId}
                  className="w-full p-3 rounded-lg bg-secondary/50 flex items-center gap-3 hover:bg-secondary transition-colors text-left"
                >
                  <SchoolIcon className="w-5 h-5 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">School</p>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {profile.school_name}
                    </p>
                  </div>
                  {schoolId && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
                </button>
              )}

              {/* Bio */}
              {profile.bio && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    <h4 className="text-sm font-medium text-foreground">About</h4>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Interests/Tags */}
              {interests.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {interests.map((interest, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                {/* Connect Button */}
                <Button
                  onClick={handleConnect}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-6"
                >
                  <Users className="w-4 h-4 mr-2" />
                  Connect
                </Button>

                {/* View Full Profile Button */}
                <Button
                  onClick={handleViewProfile}
                  variant="outline"
                  className="w-full py-6 group"
                >
                  View Full Profile
                  <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Profile not found</p>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default UserProfileSheet;
