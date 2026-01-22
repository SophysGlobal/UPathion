import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import PremiumChatFAB from "@/components/PremiumChatFAB";
import AnimatedBackground from "@/components/AnimatedBackground";
import { GradientInput } from "@/components/ui/GradientInput";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  User, 
  MoreVertical, 
  VolumeX, 
  Volume2, 
  Trash2, 
  MailOpen, 
  Mail,
  MessageCircle,
  PenSquare
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  USE_SEED_DATA, 
  seedConversations, 
  type SeedConversation 
} from "@/data/seedData";

const Messages = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<SeedConversation[]>(
    USE_SEED_DATA ? seedConversations : []
  );

  const filteredConversations = useMemo(() => 
    conversations.filter(c => 
      c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
    ), [conversations, searchQuery]);

  const handleOpenThread = (conversation: SeedConversation) => {
    // Mark as read when opening
    setConversations(prev => 
      prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c)
    );
    navigate(`/messages/${conversation.id}`);
  };

  const handleToggleMute = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversations(prev => 
      prev.map(c => c.id === conversationId ? { ...c, isMuted: !c.isMuted } : c)
    );
    const conv = conversations.find(c => c.id === conversationId);
    toast.success(conv?.isMuted ? 'Unmuted conversation' : 'Muted conversation');
  };

  const handleToggleRead = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversations(prev => 
      prev.map(c => c.id === conversationId 
        ? { ...c, unreadCount: c.unreadCount > 0 ? 0 : 1 } 
        : c
      )
    );
  };

  const handleDeleteConversation = (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    toast.success('Conversation deleted');
  };

  const handleNewMessage = () => {
    toast.info('Compose new message coming soon!');
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Student': return 'bg-primary/20 text-primary';
      case 'Teacher': return 'bg-blue-500/20 text-blue-400';
      case 'Counselor': return 'bg-green-500/20 text-green-400';
      case 'Staff': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  const renderEmptyState = () => (
    <div className="text-center py-12">
      <div className="w-20 h-20 rounded-full bg-secondary/50 backdrop-blur-sm flex items-center justify-center mx-auto mb-4">
        <MessageCircle className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="font-medium text-foreground mb-2">No Messages Yet</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto mb-4">
        Start a conversation with someone from your school community
      </p>
      <Button onClick={handleNewMessage}>
        <PenSquare className="w-4 h-4 mr-2" />
        New Message
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative">
      <AnimatedBackground />
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center justify-between px-6 py-3">
          <div>
            <h1 className="text-lg font-semibold text-foreground">Messages</h1>
            <p className="text-xs text-muted-foreground">
              {conversations.filter(c => c.unreadCount > 0).length} unread
            </p>
          </div>
          <Button size="icon" variant="ghost" onClick={handleNewMessage}>
            <PenSquare className="w-5 h-5" />
          </Button>
        </div>
      </header>

      <main className="relative z-10 px-6 py-6 space-y-4">
        {/* Search */}
        <div className="animate-fade-in">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <GradientInput 
              placeholder="Search messages..." 
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conversation, index) => (
              <button
                key={conversation.id}
                onClick={() => handleOpenThread(conversation)}
                className="w-full gradient-border group animate-fade-in"
                style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
              >
                <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 transition-colors group-hover:bg-secondary/50">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <User className="w-6 h-6 text-primary" />
                    </div>
                    {conversation.unreadCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </span>
                    )}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${conversation.unreadCount > 0 ? 'text-foreground' : 'text-foreground/80'}`}>
                        {conversation.participantName}
                      </span>
                      {conversation.participantBadge && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getRoleBadgeColor(conversation.participantRole)}`}>
                          {conversation.participantBadge}
                        </span>
                      )}
                      {conversation.isMuted && (
                        <VolumeX className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className={`text-sm truncate ${conversation.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                      {conversation.lastMessage}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {conversation.lastMessageTime}
                    </p>
                  </div>

                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button size="icon" variant="ghost" className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border">
                      <DropdownMenuItem onClick={(e) => handleToggleRead(e as any, conversation.id)}>
                        {conversation.unreadCount > 0 ? (
                          <>
                            <MailOpen className="w-4 h-4 mr-2" />
                            Mark as read
                          </>
                        ) : (
                          <>
                            <Mail className="w-4 h-4 mr-2" />
                            Mark as unread
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => handleToggleMute(e as any, conversation.id)}>
                        {conversation.isMuted ? (
                          <>
                            <Volume2 className="w-4 h-4 mr-2" />
                            Unmute
                          </>
                        ) : (
                          <>
                            <VolumeX className="w-4 h-4 mr-2" />
                            Mute
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={(e) => handleDeleteConversation(e as any, conversation.id)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Messages;
