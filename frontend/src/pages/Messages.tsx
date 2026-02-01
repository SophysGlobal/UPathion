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
  PenSquare,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConversations, type Conversation } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow } from "date-fns";

const Messages = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  
  const {
    conversations,
    loading,
    markAsRead,
    toggleMute,
    deleteConversation,
  } = useConversations();

  const filteredConversations = useMemo(() => 
    conversations.filter(c => {
      const otherParticipant = c.participants.find(p => p.user_id !== user?.id);
      const name = otherParticipant?.profile?.display_name || '';
      const lastMessage = c.last_message?.content || '';
      return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    }), [conversations, searchQuery, user?.id]);

  const handleOpenThread = (conversation: Conversation) => {
    markAsRead(conversation.id);
    navigate(`/messages/${conversation.id}`);
  };

  const handleViewProfile = (e: React.MouseEvent, participantId: string) => {
    e.stopPropagation();
    navigate(`/user/${participantId}`);
  };

  const handleToggleMute = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    await toggleMute(conversationId);
    toast.success('Conversation updated');
  };

  const handleToggleRead = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    await markAsRead(conversationId);
  };

  const handleDeleteConversation = async (e: React.MouseEvent, conversationId: string) => {
    e.stopPropagation();
    await deleteConversation(conversationId);
    toast.success('Conversation deleted');
  };

  const handleNewMessage = () => {
    navigate('/messages/compose');
  };

  const getOtherParticipant = (conversation: Conversation) => {
    return conversation.participants.find(p => p.user_id !== user?.id);
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: false });
    } catch {
      return '';
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
              {conversations.filter(c => c.unread_count > 0).length} unread
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

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {/* Conversations List */}
        {!loading && filteredConversations.length === 0 ? (
          renderEmptyState()
        ) : !loading && (
          <div className="space-y-2">
            {filteredConversations.map((conversation, index) => {
              const otherParticipant = getOtherParticipant(conversation);
              const isMuted = conversation.participants.find(p => p.user_id === user?.id)?.is_muted;
              
              return (
                <button
                  key={conversation.id}
                  onClick={() => handleOpenThread(conversation)}
                  className="w-full gradient-border group animate-fade-in"
                  style={{ animationDelay: `${index * 0.04}s`, animationFillMode: 'both' }}
                >
                  <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 flex items-center gap-3 transition-colors group-hover:bg-secondary/50">
                    {/* Avatar - clickable for profile */}
                    <button
                      onClick={(e) => otherParticipant && handleViewProfile(e, otherParticipant.user_id)}
                      className="relative flex-shrink-0 hover:opacity-80 transition-opacity"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                        {otherParticipant?.profile?.avatar_url ? (
                          <img 
                            src={otherParticipant.profile.avatar_url} 
                            alt={otherParticipant.profile.display_name || 'User'} 
                            className="w-12 h-12 object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {conversation.unread_count > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                          {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
                        </span>
                      )}
                    </button>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => otherParticipant && handleViewProfile(e, otherParticipant.user_id)}
                          className="font-medium hover:underline"
                        >
                          <span className={conversation.unread_count > 0 ? 'text-foreground' : 'text-foreground/80'}>
                            {otherParticipant?.profile?.display_name || 'Unknown User'}
                          </span>
                        </button>
                        {otherParticipant?.profile?.grade_or_year && (
                          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                            {otherParticipant.profile.grade_or_year}
                          </span>
                        )}
                        {isMuted && (
                          <VolumeX className="w-3 h-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className={`text-sm truncate ${conversation.unread_count > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                        {conversation.last_message?.content || 'No messages yet'}
                      </p>
                      {conversation.last_message && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatTime(conversation.last_message.created_at)}
                        </p>
                      )}
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
                          {conversation.unread_count > 0 ? (
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
                          {isMuted ? (
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
              );
            })}
          </div>
        )}
      </main>

      <PremiumChatFAB />
      <BottomNav />
    </div>
  );
};

export default Messages;
