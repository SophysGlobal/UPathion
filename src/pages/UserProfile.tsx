import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import SchoolBottomSheet from "@/components/SchoolBottomSheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ChevronLeft, 
  User, 
  MessageCircle, 
  UserPlus, 
  MoreVertical,
  Flag,
  Ban,
  School,
  GraduationCap,
  Check,
  Loader2,
  ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useUserConnection } from "@/hooks/useUserConnection";
import { USE_SEED_DATA, seedPeople, seedConversations } from "@/data/seedData";

// Public-safe profile interface (excludes email, is_premium, subscription_ends_at)
// When viewing OTHER users, use public_profiles view to protect sensitive data
interface PublicUserProfileData {
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

// Find user by ID from seed data
const findSeedUserById = (userId: string) => {
  const person = seedPeople.find(p => p.id === userId);
  if (person) {
    return {
      id: person.id,
      name: person.name,
      role: person.role,
      badge: person.badge,
      school: person.school,
      bio: person.bio,
      avatarColor: person.avatarColor,
    };
  }

  const conv = seedConversations.find(c => c.id === userId);
  if (conv) {
    return {
      id: conv.id,
      name: conv.participantName,
      role: conv.participantRole,
      badge: conv.participantBadge,
      school: conv.participantSchool,
      bio: '',
      avatarColor: 'bg-primary/20',
    };
  }

  return null;
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case 'Student': return 'bg-primary/20 text-primary';
    case 'Teacher': return 'bg-blue-500/20 text-blue-400';
    case 'Counselor': return 'bg-green-500/20 text-green-400';
    default: return 'bg-secondary text-muted-foreground';
  }
};

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const { user: currentUser } = useAuth();
  
  const [profile, setProfile] = useState<PublicUserProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [schoolSheetOpen, setSchoolSheetOpen] = useState(false);
  
  const { connectionState, isLoading: connectLoading, toggleConnection, getConnectionLabel } = useUserConnection(userId || null);
  
  const isOwnProfile = currentUser?.id === userId;

  // Fetch real profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        // Use public_profiles view to protect sensitive business data
        // (is_premium, subscription_ends_at, email are excluded)
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, display_name, username, avatar_url, bio, school_name, school_type, grade_or_year, major')
          .eq('id', userId)
          .maybeSingle();
        
        if (error) {
          console.error('Error fetching profile:', error);
        }
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfile();
  }, [userId]);

  // Fallback to seed data if real profile not found
  const seedUser = USE_SEED_DATA && userId ? findSeedUserById(userId) : null;
  
  // Use real profile if available, otherwise seed data
  const hasRealProfile = profile !== null;
  const displayData = hasRealProfile ? {
    name: profile.display_name || 'Unknown User',
    username: profile.username,
    role: 'Student',
    badge: profile.grade_or_year || undefined,
    school: profile.school_name,
    bio: profile.bio || '',
    major: profile.major,
    avatarUrl: profile.avatar_url,
    avatarColor: 'bg-primary/20',
  } : seedUser ? {
    name: seedUser.name,
    username: undefined,
    role: seedUser.role,
    badge: seedUser.badge,
    school: seedUser.school,
    bio: seedUser.bio,
    major: undefined,
    avatarUrl: undefined,
    avatarColor: seedUser.avatarColor,
  } : null;

  const handleMessage = () => {
    toast.success(`Starting conversation with ${displayData?.name}`);
    navigate('/messages');
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  const handleBlock = () => {
    toast.info('Block functionality coming soon');
  };

  const handleSchoolClick = () => {
    if (displayData?.school) {
      setSchoolSheetOpen(true);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <AnimatedBackground />
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-6 space-y-6">
          <div className="gradient-border">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
              <div className="flex justify-center mb-4">
                <Skeleton className="w-24 h-24 rounded-full" />
              </div>
              <Skeleton className="h-6 w-40 mx-auto mb-2" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  // User not found
  if (!displayData) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <AnimatedBackground />
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">User Not Found</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-12 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <User className="w-10 h-10 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">This user doesn't exist or their profile is private.</p>
          <Button className="mt-4" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  const interestTags = ['Academic', 'Community', 'Learning'];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)} 
              className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Profile</h1>
          </div>
          
          {!isOwnProfile && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="ghost">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-card border-border">
                <DropdownMenuItem onClick={handleReport}>
                  <Flag className="w-4 h-4 mr-2" />
                  Report User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleBlock} className="text-destructive focus:text-destructive">
                  <Ban className="w-4 h-4 mr-2" />
                  Block User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Profile Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className={`w-24 h-24 rounded-full ${displayData.avatarColor} flex items-center justify-center overflow-hidden`}>
                {displayData.avatarUrl ? (
                  <img 
                    src={displayData.avatarUrl} 
                    alt={displayData.name} 
                    className="w-24 h-24 object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-bold text-foreground">{displayData.name}</h2>
            </div>
            {displayData.username && (
              <p className="text-sm text-primary mt-1">@{displayData.username}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(displayData.role)}`}>
                {displayData.role}
              </span>
              {displayData.badge && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-muted-foreground">
                  {displayData.badge}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {!isOwnProfile && (
          <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
            <Button className="flex-1" onClick={handleMessage}>
              <MessageCircle className="w-4 h-4 mr-2" />
              Message
            </Button>
            <Button 
              variant={connectionState === 'none' ? 'outline' : 'secondary'} 
              className="flex-1" 
              onClick={toggleConnection}
              disabled={connectLoading}
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
          </div>
        )}

        {isOwnProfile && (
          <Button 
            className="w-full animate-fade-in" 
            style={{ animationDelay: '0.04s', animationFillMode: 'both' }}
            onClick={() => navigate('/edit-profile')}
          >
            Edit Profile
          </Button>
        )}

        {/* School Info */}
        {displayData.school && (
          <button
            onClick={handleSchoolClick}
            className="w-full gradient-border animate-fade-in group"
            style={{ animationDelay: '0.08s', animationFillMode: 'both' }}
          >
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 transition-colors group-hover:bg-secondary/50">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                {displayData.school.toLowerCase().includes('university') || displayData.school.toLowerCase().includes('college') 
                  ? <GraduationCap className="w-5 h-5 text-primary" />
                  : <School className="w-5 h-5 text-primary" />
                }
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{displayData.school}</p>
                {displayData.major && (
                  <p className="text-sm text-muted-foreground">{displayData.major}</p>
                )}
                {displayData.badge && !displayData.major && (
                  <p className="text-sm text-muted-foreground">{displayData.badge}</p>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        )}

        {/* Bio */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
            <p className="text-foreground">{displayData.bio || 'No bio yet'}</p>
          </div>
        </div>

        {/* Interests */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.16s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Interests</h3>
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
        </div>
      </main>

      {/* School Bottom Sheet */}
      <SchoolBottomSheet
        open={schoolSheetOpen}
        onOpenChange={setSchoolSheetOpen}
        school={displayData.school ? {
          name: displayData.school,
          type: displayData.school.toLowerCase().includes('high') ? 'high_school' : 'university',
        } : null}
      />

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default UserProfile;
