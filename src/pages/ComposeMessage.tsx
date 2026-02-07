import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AnimatedBackground from "@/components/AnimatedBackground";
import { GradientInput } from "@/components/ui/GradientInput";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Search, 
  User,
  Check,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { createConversation, findExistingConversation } from "@/hooks/useMessages";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface SearchResult {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  school_name: string | null;
  grade_or_year: string | null;
}

const ComposeMessage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  // Search for users
  useMemo(() => {
    const searchUsers = async () => {
      if (!debouncedQuery.trim() || debouncedQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('public_profiles')
          .select('id, display_name, avatar_url, school_name, grade_or_year')
          .neq('id', user?.id || '')
          .or(`display_name.ilike.%${debouncedQuery}%,username.ilike.%${debouncedQuery}%`)
          .limit(20);

        if (error) throw error;
        setSearchResults(data || []);
      } catch (err) {
        console.error('Search error:', err);
        toast.error('Failed to search users');
      } finally {
        setIsSearching(false);
      }
    };

    searchUsers();
  }, [debouncedQuery, user?.id]);

  const handleSelectUser = (result: SearchResult) => {
    setSelectedUser(result);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleRemoveSelection = () => {
    setSelectedUser(null);
  };

  const handleStartConversation = async () => {
    if (!selectedUser || !user) return;

    setIsCreating(true);
    try {
      // Check for existing conversation
      const existingConvId = await findExistingConversation(user.id, selectedUser.id);
      
      if (existingConvId) {
        navigate(`/messages/${existingConvId}`);
        return;
      }

      // Create new conversation
      const conversationId = await createConversation([user.id, selectedUser.id]);
      
      if (conversationId) {
        toast.success('Conversation started!');
        navigate(`/messages/${conversationId}`);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (err) {
      console.error('Error starting conversation:', err);
      toast.error('Failed to start conversation');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-6 py-3">
          <button 
            onClick={() => navigate('/messages')} 
            className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">New Message</h1>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-6">
        {/* Recipient Selection */}
        <div className="space-y-3 animate-fade-in">
          <label className="text-sm font-medium text-foreground">To:</label>
          
          {selectedUser ? (
            <div className="flex items-center gap-3 p-3 bg-card/90 backdrop-blur-sm rounded-lg border border-border">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                {selectedUser.avatar_url ? (
                  <img 
                    src={selectedUser.avatar_url} 
                    alt={selectedUser.display_name || 'User'} 
                    className="w-10 h-10 rounded-full object-cover"
                  />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">
                  {selectedUser.display_name || 'Unknown User'}
                </p>
                {selectedUser.school_name && (
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedUser.school_name}
                    {selectedUser.grade_or_year && ` • ${selectedUser.grade_or_year}`}
                  </p>
                )}
              </div>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={handleRemoveSelection}
                className="text-muted-foreground"
              >
                ✕
              </Button>
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <GradientInput 
                placeholder="Search by name or username..." 
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin" />
              )}
            </div>
          )}
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedUser && (
          <div className="space-y-2 animate-fade-in">
            <p className="text-xs text-muted-foreground">Search Results</p>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {searchResults.map((result) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectUser(result)}
                  className="w-full gradient-border group"
                >
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 flex items-center gap-3 transition-colors group-hover:bg-secondary/50">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      {result.avatar_url ? (
                        <img 
                          src={result.avatar_url} 
                          alt={result.display_name || 'User'} 
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-foreground truncate">
                        {result.display_name || 'Unknown User'}
                      </p>
                      {result.school_name && (
                        <p className="text-xs text-muted-foreground truncate">
                          {result.school_name}
                          {result.grade_or_year && ` • ${result.grade_or_year}`}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Empty Search State */}
        {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && !selectedUser && (
          <div className="text-center py-8 animate-fade-in">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No users found matching "{searchQuery}"</p>
          </div>
        )}

        {/* Start Button */}
        {selectedUser && (
          <Button 
            className="w-full" 
            onClick={handleStartConversation}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Start Conversation
              </>
            )}
          </Button>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default ComposeMessage;
