import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Live count of comments per post, sourced from `post_comments`.
 * Single source of truth used by feed cards so the number matches what
 * the comments modal actually shows.
 */
export function useCommentCounts(postIds: string[]) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const key = postIds.join("|");

  const fetchAll = useCallback(async () => {
    if (postIds.length === 0) return;
    const { data, error } = await supabase
      .from("post_comments")
      .select("post_id")
      .in("post_id", postIds);
    if (error) return;
    const next: Record<string, number> = {};
    postIds.forEach((id) => (next[id] = 0));
    (data || []).forEach((row: any) => {
      next[row.post_id] = (next[row.post_id] || 0) + 1;
    });
    setCounts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    fetchAll();
    if (postIds.length === 0) return;
    const channel = supabase
      .channel(`comment-counts-${key}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        (payload: any) => {
          const pid: string | undefined = payload.new?.post_id ?? payload.old?.post_id;
          if (pid && postIds.includes(pid)) fetchAll();
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const getCount = useCallback((postId: string) => counts[postId] ?? 0, [counts]);
  const setCount = useCallback((postId: string, value: number) => {
    setCounts((prev) => ({ ...prev, [postId]: Math.max(0, value) }));
  }, []);

  return { counts, getCount, setCount, refetch: fetchAll };
}
