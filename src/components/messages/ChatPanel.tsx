import { useState, useRef, useEffect, memo } from "react";
import { User, Users, Send, SmilePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  seedConversations,
  seedMessages,
  seedGroupMessages,
  type SeedConversation,
  type SeedMessage,
} from "@/data/seedData";

interface ChatPanelProps {
  conversationId: string | null;
}

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

const ChatPanel = memo(({ conversationId }: ChatPanelProps) => {
  const [inputValue, setInputValue] = useState('');
  const [localMessages, setLocalMessages] = useState<SeedMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversation = seedConversations.find(c => c.id === conversationId);
  const isGroup = conversation?.type === 'group';

  // Load seed messages for selected conversation
  useEffect(() => {
    if (!conversationId) {
      setLocalMessages([]);
      return;
    }
    const allMessages = [...seedMessages, ...seedGroupMessages];
    const convMessages = allMessages.filter(m => m.conversationId === conversationId);
    setLocalMessages(convMessages);
  }, [conversationId]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages]);

  const handleSend = () => {
    if (!inputValue.trim() || !conversationId) return;
    const newMsg: SeedMessage = {
      id: `local-${Date.now()}`,
      conversationId,
      senderId: 'me',
      text: inputValue.trim(),
      timestamp: 'Just now',
    };
    setLocalMessages(prev => [...prev, newMsg]);
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Empty state
  if (!conversationId || !conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background/50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-medium text-foreground mb-1">Select a conversation</h3>
          <p className="text-sm text-muted-foreground">Choose a chat from the list to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center",
          isGroup ? "bg-accent/20" : "bg-primary/20"
        )}>
          {isGroup ? (
            <Users className="w-5 h-5 text-accent" />
          ) : (
            <User className="w-5 h-5 text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm truncate">{conversation.participantName}</h3>
          <p className="text-xs text-muted-foreground truncate">
            {isGroup && conversation.participantNames
              ? conversation.participantNames.join(', ')
              : `${conversation.participantSchool}${conversation.participantBadge ? ` • ${conversation.participantBadge}` : ''}`
            }
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {localMessages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-muted-foreground">No messages yet. Say hello!</p>
          </div>
        )}
        {localMessages.map((msg) => {
          const isMe = msg.senderId === 'me';
          return (
            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
              <div className={cn("max-w-[75%]")}>
                {/* Sender name for group chats */}
                {isGroup && !isMe && msg.senderName && (
                  <p className="text-[10px] text-primary font-medium mb-0.5 ml-3">{msg.senderName}</p>
                )}
                <div className={cn(
                  "px-4 py-2.5 rounded-2xl text-sm",
                  isMe
                    ? "bg-primary text-primary-foreground rounded-br-md"
                    : "bg-card border border-border rounded-bl-md"
                )}>
                  <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                </div>
                <p className={cn(
                  "text-[10px] text-muted-foreground mt-0.5",
                  isMe ? "text-right mr-1" : "ml-3"
                )}>
                  {msg.timestamp}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-border/50 bg-background/80 backdrop-blur-sm flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-full bg-secondary/50 border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim()}
            className="rounded-full flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});

ChatPanel.displayName = 'ChatPanel';

export default ChatPanel;
