import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNow, isToday, isYesterday, subDays } from "date-fns";
import { Search, Plus, MoreHorizontal, Pencil, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { AIConversation } from "@/hooks/useAIConversations";
import {
  archiveConversation,
  deleteConversation,
  renameConversation,
  searchConversations,
} from "@/hooks/useAIConversations";
import { useAuth } from "@/context/AuthContext";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

interface Props {
  conversations: AIConversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onArchivedClick?: () => void;
  showArchivedButton?: boolean;
}

const AIChatSidebar = ({ conversations, activeId, onSelect, onNew, onArchivedClick, showArchivedButton = true }: Props) => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const debounced = useDebouncedValue(search, 300);
  const [searchResults, setSearchResults] = useState<AIConversation[] | null>(null);
  const [renameTarget, setRenameTarget] = useState<AIConversation | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AIConversation | null>(null);

  useEffect(() => {
    if (!user || !debounced.trim()) { setSearchResults(null); return; }
    let cancelled = false;
    void searchConversations(user.id, debounced).then((r) => { if (!cancelled) setSearchResults(r); });
    return () => { cancelled = true; };
  }, [debounced, user]);

  const list = searchResults ?? conversations;

  const groups = useMemo(() => {
    if (searchResults) return [{ label: `Results (${list.length})`, items: list }];
    const today: AIConversation[] = [];
    const yesterday: AIConversation[] = [];
    const week: AIConversation[] = [];
    const older: AIConversation[] = [];
    const sevenDaysAgo = subDays(new Date(), 7);
    for (const c of list) {
      const d = new Date(c.last_message_at);
      if (isToday(d)) today.push(c);
      else if (isYesterday(d)) yesterday.push(c);
      else if (d > sevenDaysAgo) week.push(c);
      else older.push(c);
    }
    return [
      { label: "Today", items: today },
      { label: "Yesterday", items: yesterday },
      { label: "Previous 7 days", items: week },
      { label: "Older", items: older },
    ].filter((g) => g.items.length > 0);
  }, [list, searchResults]);

  return (
    <div className="flex flex-col h-full w-full bg-background/40">
      <div className="p-3 space-y-2 border-b border-border/50">
        <button
          onClick={onNew}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> New chat
        </button>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search chats…"
            className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-secondary/40 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-2">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-6 px-3">
            {searchResults ? "No matches" : "No chats yet — start a conversation"}
          </p>
        )}
        {groups.map((g) => (
          <div key={g.label} className="mb-3">
            <p className="px-2 text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
              {g.label}
            </p>
            <ul className="space-y-0.5">
              {g.items.map((c) => (
                <li key={c.id} className="group relative">
                  <button
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm transition-colors",
                      activeId === c.id
                        ? "bg-primary/10 text-primary"
                        : "text-foreground/80 hover:bg-secondary/50",
                    )}
                  >
                    <span className="flex-1 truncate">{c.title || "New Chat"}</span>
                    {c.archived_at && (
                      <Archive className="w-3 h-3 text-muted-foreground shrink-0" aria-label="Archived" />
                    )}
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center hover:bg-secondary text-muted-foreground"
                        aria-label="Chat options"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem onClick={() => { setRenameTarget(c); setRenameValue(c.title || ""); }}>
                        <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void archiveConversation(c.id, !c.archived_at)}>
                        {c.archived_at ? (
                          <><ArchiveRestore className="w-3.5 h-3.5 mr-2" /> Unarchive</>
                        ) : (
                          <><Archive className="w-3.5 h-3.5 mr-2" /> Archive</>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => setDeleteTarget(c)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {showArchivedButton && onArchivedClick && (
        <div className="border-t border-border/50 p-2">
          <button
            onClick={onArchivedClick}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:bg-secondary/50 hover:text-foreground transition-colors"
          >
            <Archive className="w-3.5 h-3.5" /> Archived chats
          </button>
        </div>
      )}

      <AlertDialog open={!!renameTarget} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename chat</AlertDialogTitle>
          </AlertDialogHeader>
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-1 focus:ring-primary/40"
            autoFocus
            maxLength={60}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (renameTarget && renameValue.trim()) {
                await renameConversation(renameTarget.id, renameValue.trim());
              }
              setRenameTarget(null);
            }}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{deleteTarget?.title}" and its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await deleteConversation(deleteTarget.id);
                setDeleteTarget(null);
              }}
            >Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AIChatSidebar;