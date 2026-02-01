import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
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
  BookOpen,
  Calendar,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, display_name, username, bio, school_name, school_type, grade_or_year, major, aspirational_school')
          .eq('id', userId)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  const handleMessage = () => {
    toast.success(`Starting conversation with ${profile?.display_name}`);
    navigate('/messages');
  };

  const handleConnect = () => {
    toast.success(`Connection request sent to ${profile?.display_name}!`);
  };

  const handleReport = () => {
    toast.info('Report functionality coming soon');
  };

  const handleBlock = () => {
    toast.info('Block functionality coming soon');
  };

  const roleLabel = getRoleLabel(profile?.school_type);
  const isHighSchool = profile?.school_type === 'high_school';
  const SchoolIcon = isHighSchool ? School : GraduationCap;

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
          <div className="gradient-border animate-fade-in">
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
              <Skeleton className="w-24 h-24 rounded-full mx-auto mb-4" />
              <Skeleton className="h-6 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto" />
            </div>
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-12 flex-1" />
            <Skeleton className="h-12 flex-1" />
          </div>
        </main>
        <BottomNav />
      </div>
    );
  }

  if (!profile) {
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
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Profile Card */}
        <div className="gradient-border animate-fade-in">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-6 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-12 h-12 text-primary" />
              </div>
            </div>
            <h2 className="text-xl font-bold text-foreground">{profile.display_name}</h2>
            {profile.username && (
              <p className="text-sm text-muted-foreground mt-1">@{profile.username}</p>
            )}
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(profile.school_type)}`}>
                {roleLabel}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 animate-fade-in" style={{ animationDelay: '0.04s', animationFillMode: 'both' }}>
          <Button className="flex-1" onClick={handleMessage}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Message
          </Button>
          <Button variant="outline" className="flex-1" onClick={handleConnect}>
            <UserPlus className="w-4 h-4 mr-2" />
            Connect
          </Button>
        </div>

        {/* School Info */}
        {profile.school_name && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.08s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Education</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <SchoolIcon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{profile.school_name}</p>
                  {profile.grade_or_year && (
                    <p className="text-sm text-muted-foreground">{profile.grade_or_year}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bio */}
        {profile.bio && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BookOpen className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">About</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </div>
          </div>
        )}

        {/* Major */}
        {profile.major && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.16s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Major(s)</p>
                  <p className="font-medium text-foreground">{profile.major}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aspirational School */}
        {profile.aspirational_school && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.20s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">Dream School</p>
                  <p className="font-medium text-foreground truncate">{profile.aspirational_school}</p>
                </div>
              </div>
            </div>
          </div>
        )}
              <div>
                <p className="font-medium text-foreground">{user.school}</p>
                {user.badge && (
                  <p className="text-sm text-muted-foreground">{user.badge}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.12s', animationFillMode: 'both' }}>
            <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">About</h3>
              <p className="text-foreground">{user.bio}</p>
            </div>
          </div>
        )}

        {/* Interests/Tags Placeholder */}
        <div className="gradient-border animate-fade-in" style={{ animationDelay: '0.16s', animationFillMode: 'both' }}>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Interests</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">Academic</span>
              <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">Community</span>
              <span className="px-3 py-1 rounded-full bg-secondary text-sm text-foreground">Learning</span>
            </div>
          </div>
        </div>
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default UserProfile;
