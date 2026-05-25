import { memo } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import {
  Inbox,
  MailOpen,
  Mail,
  Star,
  Heart,
  Archive,
  Pin,
  BellOff,
  Bell,
  Volume2,
  Eye,
  Clock,
  Infinity as InfinityIcon,
} from "lucide-react";
import type { ChatPreferences, NotificationPrefs } from "@/hooks/useChatPreferences";

export type ChatStatusFilter =
  | "all"
  | "unread"
  | "read"
  | "starred"
  | "favorited"
  | "archived"
  | "pinned";

interface ChatSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statusFilter: ChatStatusFilter;
  onStatusChange: (s: ChatStatusFilter) => void;
  counts: Record<ChatStatusFilter, number>;
  prefs: ChatPreferences;
  selectedConversationId: string | null;
  selectedConversationName?: string;
  isSelectedMuted: boolean;
  onMuteSelected: (durationMs: number | "indefinite" | null) => void;
  onSetNotification: (key: keyof NotificationPrefs, value: boolean) => void;
}

const FILTERS: { key: ChatStatusFilter; label: string; icon: typeof Inbox }[] = [
  { key: "all", label: "All chats", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "read", label: "Read", icon: MailOpen },
  { key: "starred", label: "Starred", icon: Star },
  { key: "favorited", label: "Favorites", icon: Heart },
  { key: "pinned", label: "Pinned", icon: Pin },
  { key: "archived", label: "Archived", icon: Archive },
];

const MUTE_OPTIONS: { label: string; value: number | "indefinite"; icon: typeof Clock }[] = [
  { label: "1 hour", value: 60 * 60 * 1000, icon: Clock },
  { label: "8 hours", value: 8 * 60 * 60 * 1000, icon: Clock },
  { label: "24 hours", value: 24 * 60 * 60 * 1000, icon: Clock },
  { label: "Indefinitely", value: "indefinite", icon: InfinityIcon },
];

const ChatSidebar = memo(
  ({
    open,
    onOpenChange,
    statusFilter,
    onStatusChange,
    counts,
    prefs,
    selectedConversationId,
    selectedConversationName,
    isSelectedMuted,
    onMuteSelected,
    onSetNotification,
  }: ChatSidebarProps) => {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="left"
          className="w-[300px] sm:max-w-[320px] p-0 flex flex-col bg-background/95 backdrop-blur-xl"
        >
          <SheetHeader className="px-5 pt-5 pb-3 border-b border-border/50">
            <SheetTitle className="text-base">Messages</SheetTitle>
            <SheetDescription className="text-xs">
              Organize, filter, and manage notifications.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
            {/* Filters */}
            <section>
              <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Categories
              </p>
              <ul className="space-y-0.5">
                {FILTERS.map((f) => {
                  const active = statusFilter === f.key;
                  const count = counts[f.key] ?? 0;
                  return (
                    <li key={f.key}>
                      <button
                        onClick={() => {
                          onStatusChange(f.key);
                          onOpenChange(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-150",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-foreground/80 hover:bg-secondary/50",
                        )}
                      >
                        <f.icon className="w-4 h-4" />
                        <span className="flex-1 text-left">{f.label}</span>
                        {count > 0 && (
                          <span
                            className={cn(
                              "text-[10px] font-semibold rounded-full px-2 py-0.5",
                              active
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground",
                            )}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Conversation mute controls */}
            <section>
              <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Mute conversation
              </p>
              {selectedConversationId ? (
                <div className="space-y-2">
                  <p className="px-2 text-xs text-muted-foreground truncate">
                    {isSelectedMuted ? "Muted: " : "Active: "}
                    <span className="text-foreground font-medium">
                      {selectedConversationName ?? "Selected chat"}
                    </span>
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {MUTE_OPTIONS.map((opt) => (
                      <button
                        key={opt.label}
                        onClick={() => onMuteSelected(opt.value)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/40 hover:bg-secondary text-xs text-foreground transition-colors"
                      >
                        <opt.icon className="w-3.5 h-3.5 text-primary" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {isSelectedMuted && (
                    <button
                      onClick={() => onMuteSelected(null)}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs text-foreground hover:bg-secondary/40 transition-colors"
                    >
                      <Bell className="w-3.5 h-3.5" /> Unmute
                    </button>
                  )}
                </div>
              ) : (
                <div className="px-3 py-3 rounded-lg bg-secondary/30 text-xs text-muted-foreground flex items-center gap-2">
                  <BellOff className="w-4 h-4" />
                  Select a chat to mute it.
                </div>
              )}
            </section>

            {/* Notification toggles */}
            <section>
              <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                Notifications
              </p>
              <div className="space-y-1">
                <NotifRow
                  icon={Bell}
                  label="Desktop notifications"
                  checked={prefs.notifications.desktop}
                  onChange={(v) => onSetNotification("desktop", v)}
                />
                <NotifRow
                  icon={Volume2}
                  label="Sound notifications"
                  checked={prefs.notifications.sound}
                  onChange={(v) => onSetNotification("sound", v)}
                />
                <NotifRow
                  icon={Eye}
                  label="Message previews"
                  checked={prefs.notifications.preview}
                  onChange={(v) => onSetNotification("preview", v)}
                />
              </div>
            </section>
          </div>
        </SheetContent>
      </Sheet>
    );
  },
);

ChatSidebar.displayName = "ChatSidebar";

const NotifRow = ({
  icon: Icon,
  label,
  checked,
  onChange,
}: {
  icon: typeof Bell;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) => (
  <label className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer">
    <span className="flex items-center gap-3 text-sm text-foreground">
      <Icon className="w-4 h-4 text-muted-foreground" />
      {label}
    </span>
    <Switch checked={checked} onCheckedChange={onChange} />
  </label>
);

export default ChatSidebar;