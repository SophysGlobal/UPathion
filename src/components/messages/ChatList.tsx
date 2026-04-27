import { memo } from "react";
import {
  User,
  Users,
  VolumeX,
  Pin,
  PinOff,
  Volume2,
  CheckCheck,
  Mail,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { type SeedConversation } from "@/data/seedData";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ChatListProps {
  conversations: SeedConversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onTogglePin?: (id: string) => void;
  onToggleMute?: (id: string) => void;
  onToggleRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const ChatList = memo(({
  conversations,
  selectedId,
  onSelect,
  onTogglePin,
  onToggleMute,
  onToggleRead,
  onDelete,
}: ChatListProps) => {
  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-muted-foreground">No conversations found</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 p-2">
      {conversations.map((conv, index) => {
        const isGroup = conv.type === 'group';
        const isSelected = selectedId === conv.id;
        const isUnread = conv.unreadCount > 0;

        const row = (
          <button
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-all duration-200 text-left group",
              isSelected
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-secondary/50 border border-transparent"
            )}
          >
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center",
                isGroup ? "bg-accent/20" : "bg-primary/20"
              )}>
                {isGroup ? (
                  <Users className="w-5 h-5 text-accent" />
                ) : (
                  <User className="w-5 h-5 text-primary" />
                )}
              </div>
              {isUnread && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                </span>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                {conv.isPinned && (
                  <Pin className="w-3 h-3 text-primary flex-shrink-0 fill-primary" />
                )}
                <span className={cn(
                  "text-sm truncate",
                  isUnread ? "font-semibold text-foreground" : "font-medium text-foreground/80"
                )}>
                  {conv.participantName}
                </span>
                {conv.isMuted && <VolumeX className="w-3 h-3 text-muted-foreground flex-shrink-0" />}
              </div>
              <p className={cn(
                "text-xs truncate mt-0.5",
                isUnread ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {conv.lastMessage}
              </p>
            </div>

            {/* Time */}
            <span className="text-[10px] text-muted-foreground flex-shrink-0 self-start mt-1">
              {conv.lastMessageTime}
            </span>
          </button>
        );

        // If no menu handlers were passed, fall back to plain row.
        if (!onTogglePin && !onToggleMute && !onToggleRead && !onDelete) {
          return <div key={conv.id}>{row}</div>;
        }

        return (
          <ContextMenu key={conv.id}>
            <ContextMenuTrigger asChild>{row}</ContextMenuTrigger>
            <ContextMenuContent className="w-52">
              {onTogglePin && (
                <ContextMenuItem onClick={() => onTogglePin(conv.id)}>
                  {conv.isPinned ? (
                    <>
                      <PinOff className="w-4 h-4 mr-2" /> Unpin
                    </>
                  ) : (
                    <>
                      <Pin className="w-4 h-4 mr-2" /> Pin to top
                    </>
                  )}
                </ContextMenuItem>
              )}
              {onToggleMute && (
                <ContextMenuItem onClick={() => onToggleMute(conv.id)}>
                  {conv.isMuted ? (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" /> Unmute
                    </>
                  ) : (
                    <>
                      <VolumeX className="w-4 h-4 mr-2" /> Mute
                    </>
                  )}
                </ContextMenuItem>
              )}
              {onToggleRead && (
                <ContextMenuItem onClick={() => onToggleRead(conv.id)}>
                  {isUnread ? (
                    <>
                      <CheckCheck className="w-4 h-4 mr-2" /> Mark as read
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" /> Mark as unread
                    </>
                  )}
                </ContextMenuItem>
              )}
              {onDelete && (
                <>
                  <ContextMenuSeparator />
                  <ContextMenuItem
                    onClick={() => onDelete(conv.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </ContextMenuItem>
                </>
              )}
            </ContextMenuContent>
          </ContextMenu>
        );
      })}
    </div>
  );
});

ChatList.displayName = 'ChatList';

export default ChatList;
