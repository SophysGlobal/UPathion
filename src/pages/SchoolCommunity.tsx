import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { ChevronLeft, User, UserPlus, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CommunityMember {
  id: string;
  name: string;
  role: 'Student' | 'Teacher' | 'Counselor' | 'Administrator' | 'Coach' | 'Advisor' | 'Staff';
  gradeOrPosition?: string;
  bio?: string;
  avatarUrl?: string;
}

// Sample community members - changes based on school
const generateSampleMembers = (schoolName: string): CommunityMember[] => {
  const isHighSchool = schoolName.toLowerCase().includes('high school') || 
                       schoolName.toLowerCase().includes('high') ||
                       schoolName.toLowerCase().includes('academy');

  if (isHighSchool) {
    return [
      { id: '1', name: 'Sarah Mitchell', role: 'Student', gradeOrPosition: 'Senior (12th)', bio: 'Captain of debate team, aspiring law student' },
      { id: '2', name: 'James Chen', role: 'Student', gradeOrPosition: 'Junior (11th)', bio: 'Math club president, robotics enthusiast' },
      { id: '3', name: 'Dr. Emily Watson', role: 'Teacher', gradeOrPosition: 'AP Chemistry', bio: 'PhD in Chemistry, 15 years teaching' },
      { id: '4', name: 'Michael Brown', role: 'Counselor', gradeOrPosition: 'College Counselor', bio: 'Helping students find their path since 2010' },
      { id: '5', name: 'Lisa Park', role: 'Student', gradeOrPosition: 'Sophomore (10th)', bio: 'Artist and environmental club member' },
      { id: '6', name: 'Coach Rodriguez', role: 'Coach', gradeOrPosition: 'Track & Field', bio: 'Former Olympic athlete, state champion coach' },
      { id: '7', name: 'Alex Johnson', role: 'Student', gradeOrPosition: 'Senior (12th)', bio: 'Student body president, community volunteer' },
      { id: '8', name: 'Mrs. Thompson', role: 'Administrator', gradeOrPosition: 'Vice Principal', bio: 'Dedicated to student success and school culture' },
    ];
  } else {
    return [
      { id: '1', name: 'David Kim', role: 'Student', gradeOrPosition: 'Junior, CS Major', bio: 'Software engineering intern at tech startup' },
      { id: '2', name: 'Prof. Rebecca Stone', role: 'Teacher', gradeOrPosition: 'Economics Dept.', bio: 'Published researcher, former Fed advisor' },
      { id: '3', name: 'Maya Patel', role: 'Student', gradeOrPosition: 'Sophomore, Pre-Med', bio: 'Research assistant, campus health volunteer' },
      { id: '4', name: 'Dr. James Wright', role: 'Advisor', gradeOrPosition: 'Academic Advisor', bio: 'Helping students navigate college life' },
      { id: '5', name: 'Chris Anderson', role: 'Student', gradeOrPosition: 'Senior, Business', bio: 'Startup founder, entrepreneurship club lead' },
      { id: '6', name: 'Sarah Liu', role: 'Student', gradeOrPosition: 'Graduate Student', bio: 'PhD candidate in Neuroscience' },
      { id: '7', name: 'Mark Davis', role: 'Staff', gradeOrPosition: 'Career Services', bio: 'Connecting students with opportunities' },
      { id: '8', name: 'Dr. Amanda Cole', role: 'Counselor', gradeOrPosition: 'Mental Health', bio: 'Supporting student wellness and success' },
    ];
  }
};

const MemberCard = ({ member, onConnect }: { member: CommunityMember; onConnect: () => void }) => {
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Student': return 'bg-primary/20 text-primary';
      case 'Teacher': return 'bg-blue-500/20 text-blue-400';
      case 'Counselor': return 'bg-green-500/20 text-green-400';
      case 'Administrator': return 'bg-purple-500/20 text-purple-400';
      case 'Coach': return 'bg-orange-500/20 text-orange-400';
      case 'Advisor': return 'bg-cyan-500/20 text-cyan-400';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-6 h-6 text-primary" />
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-medium text-foreground">{member.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(member.role)}`}>
                {member.role}
              </span>
            </div>
            {member.gradeOrPosition && (
              <p className="text-xs text-muted-foreground mt-0.5">{member.gradeOrPosition}</p>
            )}
            {member.bio && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{member.bio}</p>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onConnect}
          >
            <UserPlus className="w-4 h-4 mr-1" />
            Connect
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toast.info("Messaging coming soon!")}
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const SchoolCommunity = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const schoolName = searchParams.get('school') || 'School';
  
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [selectedMember, setSelectedMember] = useState<CommunityMember | null>(null);
  
  const members = useMemo(() => generateSampleMembers(schoolName), [schoolName]);

  const handleConnect = (member: CommunityMember) => {
    setSelectedMember(member);
    setShowComingSoon(true);
  };

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-4 px-6 py-3">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold text-foreground truncate">{schoolName} Community</h1>
            <p className="text-xs text-muted-foreground">{members.length} people</p>
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-4">
        {/* Filter pills - could add later */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {['All', 'Students', 'Staff', 'Faculty'].map((filter) => (
            <button
              key={filter}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                filter === 'All'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Members List */}
        {members.map((member, index) => (
          <div
            key={member.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
          >
            <MemberCard member={member} onConnect={() => handleConnect(member)} />
          </div>
        ))}
      </main>

      {/* Coming Soon Dialog */}
      <Dialog open={showComingSoon} onOpenChange={setShowComingSoon}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Coming Soon!</DialogTitle>
            <DialogDescription>
              Connection requests are coming soon! You'll be able to connect with {selectedMember?.name} and others from this school.
            </DialogDescription>
          </DialogHeader>
          <Button onClick={() => setShowComingSoon(false)} className="w-full mt-4">
            Got it
          </Button>
        </DialogContent>
      </Dialog>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default SchoolCommunity;
