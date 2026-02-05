import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { X, User, School, MessageCircle, UserPlus, Check, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useUserConnection } from "@/hooks/useUserConnection";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import SchoolBottomSheet from "./SchoolBottomSheet";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";

// Public-safe profile interface (excludes email, is_premium, subscription_ends_at)
interface PublicUserProfile {
  id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  school_name: string | null;
  school_type: string | null;
  grade_or_year: string | null;
  major: string | null;
}

interface UserProfileBottomSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
  // For seed data fallback
  seedUser?: {
    id: string;
    name: string;
    role?: string;
    badge?: string;
    school?: string;
    bio?: string;
  } | null;
}

const UserProfileBottomSheet = ({ 
  open, 
  onOpenChange, 
  userId,
  seedUser 
}: UserProfileBottomSheetProps) => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<PublicUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [schoolSheetOpen, setSchoolSheetOpen] = useState(false);
  
  // Use provided userId, or generate stable ID from seed user for sample data
  const effectiveUserId = userId || (seedUser?.id ? `sample-${seedUser.id}` : null);
  const isSampleUser = !userId && !!seedUser;
  
  const { connectionState, isLoading: connectLoading, toggleConnection, getConnectionLabel } = useUserConnection(effectiveUserId);
  
  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId;

  // Fetch real user profile (only for real users with valid UUIDs)
  useEffect(() => {
    const fetchProfile = async () => {
      // Skip fetch for sample users or if no userId
      if (!userId || !open || isSampleUser) return;
      
      setIsLoading(true);
      try {
        // Use public_profiles view to avoid exposing sensitive business data
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, display_name, username, avatar_url, bio, school_name, school_type, grade_or_year, major')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile:', error);
          setProfile(null);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId, open, isSampleUser]);

  // Derive display data from real profile or seed user
  const displayData = {
    name: profile?.display_name || seedUser?.name || 'Unknown User',
    username: profile?.username,
    role: seedUser?.role || 'Student',
    badge: profile?.grade_or_year || seedUser?.badge,
    school: profile?.school_name || seedUser?.school,
    bio: profile?.bio || seedUser?.bio || '',
    major: profile?.major,
    avatarUrl: profile?.avatar_url,
  };

  const handleViewProfile = () => {
    // For real users, navigate to their profile
    if (userId) {
      onOpenChange(false);
      navigate(`/user/${userId}`);
      return;
    }
    
    // For sample users, show a toast since they don't have real profiles
    if (isSampleUser && seedUser) {
      onOpenChange(false);
      // Navigate to a demo profile page with sample data
      toast.info(`${seedUser.name} is a sample user. Sign up to connect with real students!`);
      return;
    }
    
    // Fallback - show error toast
    toast.error('Unable to load profile');
  };

  const handleMessage = () => {
    onOpenChange(false);
    navigate('/messages');
  };

  const handleSchoolClick = () => {
    if (displayData.school) {
      setSchoolSheetOpen(true);
    }
  };

  // Generate default interest tags
  const interestTags = ['Academic', 'Community', 'Learning'];

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[85vh] bg-background/95 backdrop-blur-xl border-t border-border/50">
          {/* Header */}
          <DrawerHeader className="flex flex-row items-center justify-between px-6 py-4 border-b border-border/30">
            <DrawerTitle className="text-lg font-semibold text-foreground">
              Profile Preview
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
              // Loading skeleton
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <>
                {/* User Identity */}
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {displayData.avatarUrl ? (
                      <img 
                        src={displayData.avatarUrl} 
                        alt={displayData.name} 
                        className="w-16 h-16 object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-lg">{displayData.name}</h3>
                    </div>
                    {displayData.username && (
                      <p className="text-sm text-primary">@{displayData.username}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                        {displayData.role}
                      </span>
                      {displayData.badge && (
                        <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs font-medium">
                          {displayData.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* School */}
                {displayData.school && (
                  <button
                    onClick={handleSchoolClick}
                    className="w-full p-3 rounded-lg bg-secondary/50 flex items-center gap-3 hover:bg-secondary/70 transition-colors text-left"
                  >
                    <School className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{displayData.school}</p>
                      {displayData.major && (
                        <p className="text-xs text-muted-foreground truncate">{displayData.major}</p>
                      )}
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  </button>
                )}

                {/* Bio */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">About</h4>
                  <p className="text-sm text-foreground leading-relaxed">
                    {displayData.bio || "No bio yet"}
                  </p>
                </div>

                {/* Interests */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {interestTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                {!isOwnProfile && (
                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={toggleConnection}
                      disabled={connectLoading}
                      variant={connectionState === 'none' ? 'default' : 'outline'}
                      className="w-full py-6"
                    >
                      {connectLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : connectionState === 'none' ? (
                        <UserPlus className="w-4 h-4 mr-2" />
                      ) : (
                        <Check className="w-4 h-4 mr-2" />
                      )}
                      {getConnectionLabel()}
                    </Button>

                    <div className="flex gap-3">
                      <Button
                        onClick={handleMessage}
                        variant="outline"
                        className="flex-1 py-6"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                      <Button
                        onClick={handleViewProfile}
                        className="flex-1 py-6 group"
                      >
                        View Full Profile
                        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </div>
                  </div>
                )}

                {isOwnProfile && (
                  <Button
                    onClick={() => {
                      onOpenChange(false);
                      navigate('/profile');
                    }}
                    className="w-full py-6"
                  >
                    Go to My Profile
                  </Button>
                )}
              </>
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Nested School Bottom Sheet */}
      <SchoolBottomSheet
        open={schoolSheetOpen}
        onOpenChange={setSchoolSheetOpen}
        school={displayData.school ? {
          name: displayData.school,
          type: displayData.school.toLowerCase().includes('high') ? 'high_school' : 'university',
        } : null}
      />
    </>
  );
};

export default UserProfileBottomSheet;
