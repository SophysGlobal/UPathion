import { useState, useMemo, useRef, useEffect } from "react";
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
  Paperclip
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
  seedMessages,
  type SeedMessage,
  type SeedConversation
} from "@/data/seedData";
import { useLocalStorage } from "@/hooks/useLocalStorage";

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const MESSAGES_STORAGE_KEY = 'upathion_messages';
const CONVERSATIONS_STORAGE_KEY = 'upathion_conversations';

const MessageThread = () => {
  const navigate = useNavigate();
  const { conversationId } = useParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [inputValue, setInputValue] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);

  // Get initial messages for this conversation
  const getInitialMessages = (): SeedMessage[] => {
    if (!USE_SEED_DATA) return [];
    return seedMessages.filter(m => m.conversationId === conversationId);
  };

  // Use localStorage for message persistence
  const [storedMessages, setStoredMessages] = useLocalStorage<Record<string, SeedMessage[]>>(
    MESSAGES_STORAGE_KEY,
    {}
  );

  const [storedConversations, setStoredConversations] = useLocalStorage<SeedConversation[]>(
    CONVERSATIONS_STORAGE_KEY,
    USE_SEED_DATA ? seedConversations : []
  );

  // Initialize messages for this conversation
  const [messages, setMessages] = useState<SeedMessage[]>(() => {
    const stored = storedMessages[conversationId || ''];
    if (stored && stored.length > 0) {
      return stored;
    }
    return getInitialMessages();
  });

  // Find conversation info
  const conversation: SeedConversation | undefined = storedConversations.find(c => c.id === conversationId) 
    || (USE_SEED_DATA ? seedConversations.find(c => c.id === conversationId) : undefined);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (conversationId) {
      setStoredMessages(prev => ({
        ...prev,
        [conversationId]: messages
      }));
    }
  }, [messages, conversationId, setStoredMessages]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;
    
    const newMessage: SeedMessage = {
      id: `m${Date.now()}`,
      conversationId: conversationId || '',
      senderId: 'me',
      text: inputValue.trim(),
      timestamp: 'Just now',
    };
    
    setMessages(prev => [...prev, newMessage]);
    
    // Update conversation's last message
    setStoredConversations(prev => 
      prev.map(c => c.id === conversationId 
        ? { ...c, lastMessage: inputValue.trim(), lastMessageTime: 'Just now' }
        : c
      )
    );
    
    setInputValue('');
    toast.success('Message sent!');
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

  const handleDeleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    toast.success('Message deleted');
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === messageId) {
        const reactions = m.reactions || [];
        if (reactions.includes(emoji)) {
          return { ...m, reactions: reactions.filter(r => r !== emoji) };
        }
        return { ...m, reactions: [...reactions, emoji] };
      }
      return m;
    }));
    setShowEmojiPicker(null);
  };

  const handleAttachment = () => {
    toast.info('Attachments coming soon!');
  };

  const handleViewProfile = () => {
    if (conversationId) {
      navigate(`/user/${conversationId}`);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'Student': return 'bg-primary/20 text-primary';
      case 'Teacher': return 'bg-blue-500/20 text-blue-400';
      case 'Counselor': return 'bg-green-500/20 text-green-400';
      default: return 'bg-secondary text-muted-foreground';
    }
  };

  if (!conversation) {
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
            className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 hover:opacity-80 transition-opacity"
          >
            <User className="w-5 h-5 text-primary" />
          </button>
          
          <button onClick={handleViewProfile} className="flex-1 min-w-0 text-left hover:opacity-80 transition-opacity">
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground truncate">{conversation.participantName}</span>
              {conversation.participantBadge && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-medium ${getRoleBadgeColor(conversation.participantRole)}`}>
                  {conversation.participantBadge}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">{conversation.participantSchool}</p>
          </button>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 relative z-10 px-4 py-4 space-y-3 overflow-y-auto">
        {messages.map((message, index) => {
          const isMe = message.senderId === 'me';
          const showTimestamp = index === 0 || 
            messages[index - 1]?.timestamp !== message.timestamp;

          return (
            <div key={message.id}>
              {showTimestamp && (
                <div className="text-center mb-3">
                  <span className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
                    {message.timestamp}
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
                    <p className="text-sm whitespace-pre-wrap break-words">{message.text}</p>
                  </div>
                  
                  {/* Reactions */}
                  {message.reactions && message.reactions.length > 0 && (
                    <div className={`flex gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {message.reactions.map((emoji, i) => (
                        <span 
                          key={i} 
                          className="text-sm bg-secondary/80 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-secondary"
                          onClick={() => handleAddReaction(message.id, emoji)}
                        >
                          {emoji}
                        </span>
                      ))}
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
                        <DropdownMenuItem onClick={() => handleCopyMessage(message.text)}>
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
            disabled={!inputValue.trim()}
            className="rounded-full"
          >
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default MessageThread;
