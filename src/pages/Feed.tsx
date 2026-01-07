import { useState, useMemo, memo } from "react";
import { useOnboarding } from "@/context/OnboardingContext";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Heart, MessageCircle, Bookmark, User } from "lucide-react";

interface FeedPost {
  id: string;
  authorName: string;
  authorBadge?: string;
  createdAt: string;
  bodyText: string;
  tags: string[];
  schoolScope: 'current' | 'aspirational' | 'general';
  schoolName?: string;
  likes: number;
  comments: number;
}

const samplePosts: FeedPost[] = [
  {
    id: '1',
    authorName: 'Sarah M.',
    authorBadge: 'Senior',
    createdAt: '2h ago',
    bodyText: 'Just submitted my college applications! The stress is finally over. Good luck to everyone still working on theirs! 🎉',
    tags: ['#Applications', '#CollegePrep'],
    schoolScope: 'current',
    likes: 42,
    comments: 8,
  },
  {
    id: '2',
    authorName: 'Alex K.',
    authorBadge: 'Freshman',
    createdAt: '4h ago',
    bodyText: 'Looking for study group partners for AP Chemistry. DM me if interested! We meet Tuesdays and Thursdays after school.',
    tags: ['#StudyGroup', '#APChem'],
    schoolScope: 'current',
    likes: 15,
    comments: 12,
  },
  {
    id: '3',
    authorName: 'College Advisor',
    authorBadge: 'Staff',
    createdAt: '6h ago',
    bodyText: 'Reminder: Early decision deadlines are coming up! Make sure to check each school\'s requirements and deadlines.',
    tags: ['#Admissions', '#Deadlines'],
    schoolScope: 'aspirational',
    likes: 89,
    comments: 23,
  },
  {
    id: '4',
    authorName: 'Mike T.',
    createdAt: '8h ago',
    bodyText: 'Pro tip: Start your scholarship applications early! I found over $10,000 in local scholarships that most people overlook.',
    tags: ['#Scholarships', '#Tips'],
    schoolScope: 'general',
    likes: 156,
    comments: 45,
  },
  {
    id: '5',
    authorName: 'Emma L.',
    authorBadge: 'Junior',
    createdAt: '12h ago',
    bodyText: 'The new robotics club is accepting members! We\'re building a drone for the state competition. No experience needed.',
    tags: ['#Clubs', '#Robotics'],
    schoolScope: 'current',
    likes: 28,
    comments: 7,
  },
  {
    id: '6',
    authorName: 'Campus Tours',
    authorBadge: 'Official',
    createdAt: '1d ago',
    bodyText: 'Virtual campus tours now available every Saturday! Sign up through the admissions portal to explore our facilities from home.',
    tags: ['#CampusTour', '#Admissions'],
    schoolScope: 'aspirational',
    likes: 67,
    comments: 15,
  },
  {
    id: '7',
    authorName: 'Study Tips Daily',
    createdAt: '1d ago',
    bodyText: 'The Pomodoro Technique changed my study habits completely. 25 minutes of focus, 5 minute break. Try it during finals week!',
    tags: ['#StudyTips', '#Productivity'],
    schoolScope: 'general',
    likes: 234,
    comments: 56,
  },
  {
    id: '8',
    authorName: 'Jason R.',
    authorBadge: 'Sophomore',
    createdAt: '1d ago',
    bodyText: 'Anyone else struggling with SAT prep? Found this great free resource that really helped me improve my math score by 80 points.',
    tags: ['#SAT', '#TestPrep'],
    schoolScope: 'current',
    likes: 98,
    comments: 34,
  },
  {
    id: '9',
    authorName: 'Financial Aid Office',
    authorBadge: 'Official',
    createdAt: '2d ago',
    bodyText: 'FAFSA opens October 1st! Make sure you have your family\'s tax documents ready. We\'re here to help with any questions.',
    tags: ['#FAFSA', '#FinancialAid'],
    schoolScope: 'aspirational',
    likes: 145,
    comments: 28,
  },
  {
    id: '10',
    authorName: 'Career Center',
    createdAt: '2d ago',
    bodyText: 'Summer internship applications are now open! Don\'t wait until the last minute - many positions fill up fast.',
    tags: ['#Internships', '#Career'],
    schoolScope: 'general',
    likes: 178,
    comments: 41,
  },
  {
    id: '11',
    authorName: 'Lisa W.',
    authorBadge: 'Senior',
    createdAt: '2d ago',
    bodyText: 'Just got accepted to my dream school! All those late nights studying were worth it. Never give up on your goals! 🌟',
    tags: ['#Accepted', '#DreamSchool'],
    schoolScope: 'aspirational',
    likes: 312,
    comments: 67,
  },
  {
    id: '12',
    authorName: 'Student Council',
    authorBadge: 'Official',
    createdAt: '3d ago',
    bodyText: 'Spring formal tickets go on sale next Monday! Early bird pricing available for the first 100 students.',
    tags: ['#Events', '#SchoolLife'],
    schoolScope: 'current',
    likes: 89,
    comments: 22,
  },
];

const PostCard = memo(({ post }: { post: FeedPost }) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
        {/* Author Header */}
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{post.authorName}</span>
              {post.authorBadge && (
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                  {post.authorBadge}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{post.createdAt}</span>
          </div>
        </div>

        {/* Content */}
        <p className="text-foreground text-sm leading-relaxed mb-3">
          {post.bodyText}
        </p>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {post.tags.map((tag) => (
            <span 
              key={tag} 
              className="text-xs text-primary font-medium hover:underline cursor-pointer"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6 pt-3 border-t border-border/50">
          <button 
            onClick={() => setLiked(!liked)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Heart 
              className={`w-5 h-5 ${liked ? 'fill-primary text-primary' : ''}`} 
            />
            <span className="text-sm">{liked ? post.likes + 1 : post.likes}</span>
          </button>
          <button className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm">{post.comments}</span>
          </button>
          <button 
            onClick={() => setSaved(!saved)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors ml-auto"
          >
            <Bookmark 
              className={`w-5 h-5 ${saved ? 'fill-primary text-primary' : ''}`} 
            />
          </button>
        </div>
      </div>
    </div>
  );
});

PostCard.displayName = 'PostCard';

type FilterType = 'all' | 'current' | 'aspirational';

const Feed = () => {
  const { data } = useOnboarding();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const hasAspirationalSchool = !!data.aspirationalSchool;

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') {
      return samplePosts;
    }
    if (activeFilter === 'current') {
      return samplePosts.filter(
        (post) => post.schoolScope === 'current' || post.schoolScope === 'general'
      );
    }
    if (activeFilter === 'aspirational') {
      return samplePosts.filter(
        (post) => post.schoolScope === 'aspirational' || post.schoolScope === 'general'
      );
    }
    return samplePosts;
  }, [activeFilter]);

  const filters: { key: FilterType; label: string; show: boolean }[] = [
    { key: 'all', label: 'All', show: true },
    { key: 'current', label: 'Current School', show: true },
    { key: 'aspirational', label: 'Aspirational School', show: hasAspirationalSchool },
  ];

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="px-6 py-3">
          <h1 className="text-lg font-semibold text-foreground">Feed</h1>
          <p className="text-xs text-muted-foreground">Tailored to you</p>
        </div>
        
        {/* Filter Pills */}
        <div className="px-6 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
          {filters.filter(f => f.show).map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                activeFilter === filter.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-4">
        {filteredPosts.map((post, index) => (
          <div
            key={post.id}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
          >
            <PostCard post={post} />
          </div>
        ))}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Feed;
