import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface LiveFeedPost {
  id: string;
  author_id: string;
  title: string | null;
  content: string;
  visibility: 'public' | 'school_only' | 'connections';
  category: string;
  like_count: number;
  comment_count: number;
  created_at: string;
}

export const useFeedPosts = () => {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['feed-posts', 'live'],
    staleTime: 30_000,
    queryFn: async (): Promise<LiveFeedPost[]> => {
      const { data, error } = await (supabase as any)
        .from('feed_posts')
        .select('id,author_id,title,content,visibility,category,like_count,comment_count,created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) {
        console.error('[useFeedPosts]', error);
        return [];
      }
      return (data ?? []) as LiveFeedPost[];
    },
  });
  return { ...q, refresh: () => qc.invalidateQueries({ queryKey: ['feed-posts'] }) };
};