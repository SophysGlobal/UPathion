import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AnimatedBackground from "@/components/AnimatedBackground";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  User, 
  Send, 
  MoreVertical, 
  Copy, 
  Trash2,
  SmilePlus,
  Paperclip,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMessages, useConversations, type Message } from "@/hooks/useMessages";
import { useAuth } from "@/context/AuthContext";
import { formatDistanceToNow, format, isToday, isYesterday } from "date-fns";

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const MessageThread = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  const { conversations, markAsRead } = useConversations();
  const { 
    messages, 
    loading, 
    sendMessage, 
    deleteMessage, 
    addReaction 
  } = useMessages(conversationId);

  // Find the conversation
  const conversation = conversations.find(c => c.id === conversationId);
  const otherParticipant = conversation?.participants.find(p => p.user_id !== user?.id);

  // Mark as read when opening
  useEffect(() => {
    if (conversationId) {
      markAsRead(conversationId);
    }
  }, [conversationId, markAsRead]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isSending) return;
    
    setIsSending(true);
    try {
      await sendMessage(inputValue.trim());
      setInputValue('');
    } catch (err) {
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCopyMessage = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await deleteMessage(messageId);
      toast.success('Message deleted');
    } catch {
      toast.error('Failed to delete message');
    }
  };

  const handleAddReaction = async (messageId: string, emoji: string) => {
    try {
      await addReaction(messageId, emoji);
    } catch {
      toast.error('Failed to add reaction');
    }
    setShowEmojiPicker(null);
  };

  const handleAttachment = () => {
    toast.info('Attachments coming soon!');
  };

  const handleViewProfile = () => {
    if (otherParticipant) {
      navigate(`/user/${otherParticipant.user_id}`);
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isToday(date)) {
        return format(date, 'h:mm a');
      } else if (isYesterday(date)) {
        return `Yesterday ${format(date, 'h:mm a')}`;
      }
      return format(date, 'MMM d, h:mm a');
    } catch {
      return '';
    }
  };

  const shouldShowTimestamp = (currentMsg: Message, prevMsg: Message | undefined) => {
    if (!prevMsg) return true;
    try {
      const current = new Date(currentMsg.created_at);
      const prev = new Date(prevMsg.created_at);
      // Show timestamp if more than 5 minutes apart
      return (current.getTime() - prev.getTime()) > 5 * 60 * 1000;
    } catch {
      return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative flex items-center justify-center">
        <AnimatedBackground />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <BottomNav />
      </div>
    );
  }

  if (!conversation && !loading) {
    return (
      <div className="min-h-screen bg-background/80 pb-20 relative">
        <AnimatedBackground />
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-4 px-6 py-3">
            <button onClick={() => navigate('/messages')} className="p-2 -ml-2 hover:bg-secondary/50 rounded-lg transition-colors">
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <h1 className="text-lg font-semibold text-foreground">Conversation Not Found</h1>
          </div>
        </header>
        <main className="relative z-10 px-6 py-12 text-center">
          <p className="text-muted-foreground">This conversation doesn't exist or was deleted.</p>
          <Button className="mt-4" onClick={() => navigate('/messages')}>
            Back to Messages
          </Button>
        </main>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background/80 pb-20 relative flex flex-col">
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
          
          <button
            onClick={handleViewProfile}
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity overflow-hidden"
          >
            {otherParticipant?.profile?.avatar_url ? (
              <img 
                src={otherParticipant.profile.avatar_url} 
                alt={otherParticipant.profile.display_name || 'User'} 
                className="w-10 h-10 object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-primary" />
            )}
          </button>
          
          <button onClick={handleViewProfile} className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">
                {otherParticipant?.profile?.display_name || 'Unknown User'}
              </span>
              {otherParticipant?.profile?.grade_or_year && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-primary/20 text-primary">
                  {otherParticipant.profile.grade_or_year}
                </span>
              )}
            </div>
            {otherParticipant?.profile?.school_name && (
              <p className="text-xs text-muted-foreground truncate">
                {otherParticipant.profile.school_name}
              </p>
            )}
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 relative z-10 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
          </div>
        )}
        
        {messages.map((message, index) => {
          const isMe = message.sender_id === user?.id;
          const showTimestamp = shouldShowTimestamp(message, messages[index - 1]);

          return (
            <div key={message.id}>
              {showTimestamp && (
                <div className="text-center mb-3">
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`relative max-w-[80%] ${isMe ? 'order-2' : ''}`}>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl ${
                      isMe 
                        ? 'bg-primary text-primary-foreground rounded-br-md' 
                        : 'bg-card border border-border rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {Array.from(new Set(message.reactions.map(r => r.emoji))).map((emoji, i) => {
                        const count = message.reactions?.filter(r => r.emoji === emoji).length || 0;
                        return (
                          <span 
                            key={i} 
                            className="text-sm bg-secondary/80 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-secondary"
                            onClick={() => handleAddReaction(message.id, emoji)}
                          >
                            {emoji} {count > 1 && <span className="text-xs">{count}</span>}
                          </span>
                        );
                      })}
                    </div>
                  )}
                  
                  {/* Message Actions */}
                  <div className={`absolute top-0 ${isMe ? 'right-full mr-1' : 'left-full ml-1'} opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}>
                    <DropdownMenu open={showEmojiPicker === message.id} onOpenChange={(open) => setShowEmojiPicker(open ? message.id : null)}>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <SmilePlus className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isMe ? 'end' : 'start'} className="bg-card border-border p-2 flex gap-1 min-w-0">
                        {EMOJI_REACTIONS.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => handleAddReaction(message.id, emoji)}
                            className="text-lg hover:scale-125 transition-transform p-1"
                          >
                            {emoji}
                          </button>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-7 w-7">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isMe ? 'end' : 'start'} className="bg-card border-border">
                        <DropdownMenuItem onClick={() => handleCopyMessage(message.content)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </DropdownMenuItem>
                        {isMe && (
                          <DropdownMenuItem 
                            onClick={() => handleDeleteMessage(message.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <div className="sticky bottom-16 z-40 bg-background/80 backdrop-blur-xl border-t border-border/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <Button size="icon" variant="ghost" onClick={handleAttachment}>
            <Paperclip className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="w-full px-4 py-2.5 rounded-full bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          
          <Button 
            size="icon" 
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isSending}
            className="rounded-full"
          >
            {isSending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MessageThread;
