import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Loader2, User, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import VerifiedBadge from "./VerifiedBadge";

interface CommentRow {
  id: string;
  post_id: string;
  parent_id: string | null;
  user_id: string;
  body: string;
  like_count: number;
  created_at: string;
  updated_at: string;
}

interface AuthorInfo {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  verification_status: string | null;
}

interface PostCommentsModalProps {
  postId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCountChange?: (postId: string, count: number) => void;
}

const MAX_DEPTH = 6;

function timeAgo(iso: string) {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}d`;
}

const PostCommentsModal = ({ postId, open, onOpenChange, onCountChange }: PostCommentsModalProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentRow[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorInfo>>({});
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchAll = useCallback(async (pid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("post_comments")
      .select("*")
      .eq("post_id", pid)
      .order("created_at", { ascending: true });
    if (error) {
      toast.error("Failed to load comments");
      setLoading(false);
      return;
    }
    const rows = (data || []) as CommentRow[];
    setComments(rows);

    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    if (userIds.length > 0) {
      const { data: profs } = await supabase
        .from("public_profiles")
        .select("id, display_name, avatar_url, verification_status")
        .in("id", userIds);
      const map: Record<string, AuthorInfo> = {};
      (profs || []).forEach((p: any) => {
        map[p.id] = p as AuthorInfo;
      });
      setAuthors(map);
    }

    if (user?.id && rows.length > 0) {
      const { data: likes } = await supabase
        .from("comment_likes")
        .select("comment_id")
        .eq("user_id", user.id)
        .in("comment_id", rows.map((r) => r.id));
      setLikedIds(new Set((likes || []).map((l: any) => l.comment_id)));
    } else {
      setLikedIds(new Set());
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    if (!open || !postId) return;
    fetchAll(postId);

    const channel = supabase
      .channel(`post-comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        () => fetchAll(postId),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_likes" },
        (payload: any) => {
          const cid = payload.new?.comment_id || payload.old?.comment_id;
          if (cid && comments.some((c) => c.id === cid)) fetchAll(postId);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, postId]);

  useEffect(() => {
    if (postId && onCountChange) onCountChange(postId, comments.length);
  }, [postId, comments.length, onCountChange]);

  const tree = useMemo(() => {
    const byParent = new Map<string | null, CommentRow[]>();
    comments.forEach((c) => {
      const list = byParent.get(c.parent_id) || [];
      list.push(c);
      byParent.set(c.parent_id, list);
    });
    return byParent;
  }, [comments]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Sign in to comment");
      return;
    }
    const trimmed = body.trim();
    if (!trimmed || !postId) return;
    setSubmitting(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      parent_id: replyTo?.id ?? null,
      user_id: user.id,
      body: trimmed.slice(0, 4000),
    });
    setSubmitting(false);
    if (error) {
      toast.error("Failed to post comment");
      return;
    }
    setBody("");
    setReplyTo(null);
  };

  const handleToggleLike = async (c: CommentRow) => {
    if (!user?.id) {
      toast.error("Sign in to like");
      return;
    }
    const isLiked = likedIds.has(c.id);
    // optimistic
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(c.id); else next.add(c.id);
      return next;
    });
    setComments((prev) => prev.map((x) => x.id === c.id ? { ...x, like_count: Math.max(0, x.like_count + (isLiked ? -1 : 1)) } : x));
    if (isLiked) {
      await supabase.from("comment_likes").delete().eq("comment_id", c.id).eq("user_id", user.id);
    } else {
      await supabase.from("comment_likes").insert({ comment_id: c.id, user_id: user.id });
    }
  };

  const handleDelete = async (c: CommentRow) => {
    if (!user?.id || c.user_id !== user.id) return;
    if (!window.confirm("Delete this comment?")) return;
    const { error } = await supabase.from("post_comments").delete().eq("id", c.id);
    if (error) toast.error("Failed to delete");
  };

  const renderNode = (c: CommentRow, depth: number) => {
    const author = authors[c.user_id];
    const kids = tree.get(c.id) || [];
    const isLiked = likedIds.has(c.id);
    const isMine = user?.id === c.user_id;
    return (
      <div key={c.id} className="flex flex-col gap-2">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
            {author?.avatar_url ? (
              <img src={author.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <User className="w-4 h-4 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="bg-secondary/60 rounded-2xl px-3 py-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-semibold text-foreground truncate">
                  {author?.display_name || "User"}
                </span>
                <VerifiedBadge status={author?.verification_status} />
                <span className="text-[10px] text-muted-foreground">· {timeAgo(c.created_at)}</span>
              </div>
              <p className="text-sm text-foreground/90 whitespace-pre-wrap break-words">{c.body}</p>
            </div>
            <div className="flex items-center gap-3 mt-1 pl-2 text-[11px] text-muted-foreground">
              <button
                onClick={() => handleToggleLike(c)}
                className={cn("flex items-center gap-1 hover:text-primary transition-colors", isLiked && "text-primary")}
              >
                <Heart className={cn("w-3.5 h-3.5", isLiked && "fill-primary")} />
                {c.like_count > 0 && <span>{c.like_count}</span>}
              </button>
              {depth < MAX_DEPTH && (
                <button onClick={() => setReplyTo(c)} className="hover:text-primary transition-colors">Reply</button>
              )}
              {isMine && (
                <button onClick={() => handleDelete(c)} className="hover:text-destructive transition-colors ml-auto">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
        {kids.length > 0 && (
          <div className={cn("border-l border-border/40 ml-4 pl-3 space-y-3", depth >= MAX_DEPTH - 1 && "ml-2 pl-2")}>
            {kids.map((k) => renderNode(k, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  const roots = tree.get(null) || [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0 rounded-t-2xl">
        <SheetHeader className="px-5 py-3 border-b border-border/50">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="w-4 h-4 text-primary" />
            {comments.length} {comments.length === 1 ? "Comment" : "Comments"}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : roots.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              Be the first to comment.
            </div>
          ) : (
            roots.map((r) => renderNode(r, 0))
          )}
        </div>

        <div className="border-t border-border/50 p-3 bg-background/95 backdrop-blur">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2 px-1">
              <span>Replying to <span className="text-foreground">{authors[replyTo.user_id]?.display_name || "user"}</span></span>
              <button className="hover:text-foreground" onClick={() => setReplyTo(null)}>Cancel</button>
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value.slice(0, 4000))}
              placeholder={user ? (replyTo ? "Write a reply…" : "Add a comment…") : "Sign in to comment"}
              disabled={!user || submitting}
              className="min-h-[44px] max-h-32 resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <Button
              size="icon"
              onClick={handleSubmit}
              disabled={!body.trim() || submitting || !user}
              className="flex-shrink-0"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default PostCommentsModal;