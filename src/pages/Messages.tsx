import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AppHeader from "@/components/AppHeader";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import ChatList from "@/components/messages/ChatList";
import ChatPanel from "@/components/messages/ChatPanel";
import { GradientInput } from "@/components/ui/GradientInput";
import { Button } from "@/components/ui/button";
import { Search, PenSquare, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { USE_SEED_DATA, seedConversations, type SeedConversation, type SeedConversationType } from "@/data/seedData";
import { useIsMobile } from "@/hooks/use-mobile";

type ChatFilter = 'all' | 'individual' | 'group';

const Messages = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

  // Use seed data or empty
  const conversations: SeedConversation[] = USE_SEED_DATA ? seedConversations : [];

  const filteredConversations = useMemo(() => {
    let filtered = conversations;

    // Apply type filter
    if (activeFilter === 'individual') {
      filtered = filtered.filter(c => c.type === 'individual');
    } else if (activeFilter === 'group') {
      filtered = filtered.filter(c => c.type === 'group');
    }

    // Apply search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.participantName.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [conversations, activeFilter, searchQuery]);

  const filters: { key: ChatFilter; label: string }[] = [
    { key: 'all', label: 'All Chats' },
    { key: 'individual', label: 'Individual' },
    { key: 'group', label: 'Group' },
  ];

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    // On mobile, navigate to thread view
    if (isMobile) {
      // For seed data, stay on page; for real data, navigate
      // For now, just select it
    }
  };

  const handleNewMessage = () => {
    navigate('/messages/compose');
  };

  const unreadTotal = conversations.filter(c => c.unreadCount > 0).length;

  // Mobile: show either list or chat panel
  if (isMobile) {
    if (selectedConversationId) {
      return (
        <div className="min-h-screen bg-background/80 pb-20 flex flex-col relative">
          {/* Back button header */}
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
            <div className="flex items-center gap-3 px-4 py-3">
              <button
                onClick={() => setSelectedConversationId(null)}
                className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors text-foreground"
              >
                ←
              </button>
              <h1 className="text-base font-semibold text-foreground truncate">
                {seedConversations.find(c => c.id === selectedConversationId)?.participantName || 'Chat'}
              </h1>
            </div>
          </header>
          <ChatPanel conversationId={selectedConversationId} />
          <BottomNav />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        {/* Header */}
        <AppHeader title="Messages" subtitle={`${unreadTotal} unread`}
          rightSlot={<Button size="icon" variant="ghost" onClick={handleNewMessage}><PenSquare className="w-5 h-5" /></Button>}
        />

          {/* Filters */}
          <div className="px-6 pb-3 flex gap-2">
            {filters.map(f => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all",
                  activeFilter === f.key
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </header>

        <main className="relative z-10 px-4 py-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <GradientInput
              placeholder="Search messages..."
              className="pl-9 h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {filteredConversations.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-foreground mb-2">No Messages Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
                Start a conversation with someone from your school community
              </p>
              <Button onClick={handleNewMessage} size="sm">
                <PenSquare className="w-4 h-4 mr-2" />
                New Message
              </Button>
            </div>
          ) : (
            <ChatList
              conversations={filteredConversations}
              selectedId={selectedConversationId}
              onSelect={handleSelectConversation}
            />
          )}
        </main>

        <PremiumChatFAB />
        <BottomNav />
      </div>
    );
  }

  // Desktop: split panel layout
  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <div className="flex h-[calc(100vh-4rem)]">
        {/* Left Panel - Chat List */}
        <div className="w-[340px] flex-shrink-0 border-r border-border/50 flex flex-col bg-background/60">
          {/* Header */}
          <div className="px-4 py-3 border-b border-border/50">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h1 className="text-lg font-semibold text-foreground">Messages</h1>
                <p className="text-xs text-muted-foreground">{unreadTotal} unread</p>
              </div>
              <Button size="icon" variant="ghost" onClick={handleNewMessage} className="h-8 w-8">
                <PenSquare className="w-4 h-4" />
              </Button>
            </div>

            {/* Filters */}
            <div className="flex gap-1.5 mb-3">
              {filters.map(f => (
                <button
                  key={f.key}
                  onClick={() => setActiveFilter(f.key)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all",
                    activeFilter === f.key
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <GradientInput
                placeholder="Search..."
                className="pl-9 h-8 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 px-4">
                <MessageCircle className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No conversations found</p>
              </div>
            ) : (
              <ChatList
                conversations={filteredConversations}
                selectedId={selectedConversationId}
                onSelect={handleSelectConversation}
              />
            )}
          </div>
        </div>

        {/* Right Panel - Chat */}
        <div className="flex-1 flex flex-col min-w-0">
          <ChatPanel conversationId={selectedConversationId} />
        </div>
      </div>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Messages;
