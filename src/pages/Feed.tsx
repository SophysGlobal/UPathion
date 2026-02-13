import { useState, useMemo, memo } from "react";
import { useProfileCompletion } from "@/hooks/useProfileCompletion";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import SchoolBottomSheet from "@/components/SchoolBottomSheet";
import UserProfileBottomSheet from "@/components/UserProfileBottomSheet";
import { Heart, MessageCircle, Bookmark, User } from "lucide-react";
import { USE_SEED_DATA, seedFeedPosts, type SeedFeedPost } from "@/data/seedData";

interface PostCardProps {
  post: SeedFeedPost;
  onSchoolClick: (schoolName: string) => void;
  onUserClick: (authorName: string) => void;
  userSchool?: string;
}

const PostCard = memo(({ post, onSchoolClick, onUserClick, userSchool }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div className="gradient-border">
      <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4">
        {/* Author Header */}
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => onUserClick(post.authorName)}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center hover:opacity-80 transition-opacity"
          >
            <User className="w-5 h-5 text-primary" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <button 
                onClick={() => onUserClick(post.authorName)}
                className="font-medium text-foreground hover:underline"
              >
                {post.authorName}
              </button>
              {post.authorBadge && (
                <span className="px-2 py-0.5 rounded-full bg-accent/20 text-accent text-xs font-medium">
                  {post.authorBadge}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.authorRole && (
                <span className="text-xs text-muted-foreground">{post.authorRole}</span>
              )}
              {post.authorRole && post.schoolName && (
                <span className="text-xs text-muted-foreground">•</span>
              )}
              {post.schoolName && (
                <button
                  onClick={() => onSchoolClick(post.schoolName!)}
                  className="text-xs text-primary hover:underline truncate max-w-[200px]"
                >
                  {post.schoolName}
                </button>
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
  const { profile } = useProfileCompletion();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);
  const [schoolSheetOpen, setSchoolSheetOpen] = useState(false);
  
  // User profile preview state
  const [selectedUser, setSelectedUser] = useState<{ name: string; role?: string; badge?: string; school?: string } | null>(null);
  const [userSheetOpen, setUserSheetOpen] = useState(false);

  const hasAspirationalSchool = !!profile?.aspirational_school;
  const userSchool = profile?.school_name || '';

  const posts = USE_SEED_DATA ? seedFeedPosts : [];

  const filteredPosts = useMemo(() => {
    if (activeFilter === 'all') {
      return posts;
    }
    if (activeFilter === 'current') {
      return posts.filter(
        (post) => post.schoolScope === 'current' || post.schoolScope === 'general'
      );
    }
    if (activeFilter === 'aspirational') {
      return posts.filter(
        (post) => post.schoolScope === 'aspirational' || post.schoolScope === 'general'
      );
    }
    return posts;
  }, [activeFilter, posts]);

  const filters: { key: FilterType; label: string; show: boolean }[] = [
    { key: 'all', label: 'All', show: true },
    { key: 'current', label: 'Current School', show: true },
    { key: 'aspirational', label: 'Aspirational School', show: hasAspirationalSchool },
  ];

  const handleSchoolClick = (schoolName: string) => {
    setSelectedSchool(schoolName);
    setSchoolSheetOpen(true);
  };

  const handleUserClick = (authorName: string) => {
    // Find post with this author to get more info
    const post = posts.find(p => p.authorName === authorName);
    setSelectedUser({
      name: authorName,
      role: post?.authorRole,
      badge: post?.authorBadge,
      school: post?.schoolName,
    });
    setUserSheetOpen(true);
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-secondary/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">No Posts Yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        Posts from your school community will appear here
      </p>
    </div>
  );

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      
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
        {filteredPosts.length === 0 ? (
          renderEmptyState()
        ) : (
          filteredPosts.map((post, index) => (
            <div
              key={post.id}
              className="animate-fade-in"
              style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
            >
              <PostCard 
                post={post} 
                onSchoolClick={handleSchoolClick}
                onUserClick={handleUserClick}
                userSchool={userSchool}
              />
            </div>
          ))
        )}
      </main>

      {/* School Bottom Sheet */}
      <SchoolBottomSheet
        open={schoolSheetOpen}
        onOpenChange={setSchoolSheetOpen}
        school={selectedSchool ? { 
          name: selectedSchool, 
          type: selectedSchool.toLowerCase().includes('high') ? 'high_school' : 'university' 
        } : null}
        isOwnSchool={selectedSchool === userSchool}
      />

      {/* User Profile Bottom Sheet */}
      <UserProfileBottomSheet
        open={userSheetOpen}
        onOpenChange={setUserSheetOpen}
        userId={null}
        seedUser={selectedUser ? {
          id: selectedUser.name.toLowerCase().replace(/\s+/g, '-'),
          name: selectedUser.name,
          role: selectedUser.role,
          badge: selectedUser.badge,
          school: selectedUser.school,
        } : null}
      />

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Feed;
