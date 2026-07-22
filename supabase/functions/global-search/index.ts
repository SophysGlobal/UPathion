import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders, jsonError, jsonOk } from '../_shared/http.ts';

// Global search across people, schools, posts, groups, events, places, hashtags.
// Uses ilike + pg_trgm similarity where available. Public function (verify_jwt=false)
// so it works during onboarding, but only reads from safe / public-read sources.

interface SearchHit {
  type: 'person' | 'school' | 'post' | 'group' | 'event' | 'place' | 'hashtag';
  id: string;
  label: string;
  sublabel?: string;
  avatar_url?: string | null;
  meta?: Record<string, unknown>;
  score: number;
}

function scoreText(haystack: string | null | undefined, needle: string): number {
  if (!haystack) return 0;
  const h = haystack.toLowerCase();
  const n = needle.toLowerCase();
  if (h === n) return 100;
  if (h.startsWith(n)) return 80;
  // token starts-with
  if (h.split(/[\s._-]+/).some((t) => t.startsWith(n))) return 65;
  if (h.includes(n)) return 45;
  return 0;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));
    const q = String(body.q ?? '').trim();
    const limitPerType = Math.min(Math.max(Number(body.limit ?? 6), 1), 20);
    const userSchoolName: string | null = body.userSchoolName ?? null;

    if (q.length < 1) {
      return jsonOk({ hits: [], suggestions: [] });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const like = `%${q.replace(/[%_]/g, (m) => '\\' + m)}%`;

    const [people, schoolsRes, posts, groups, events, places] = await Promise.all([
      supabase
        .from('public_profiles')
        .select('id, display_name, username, avatar_url, school_name, verification_status')
        .or(`display_name.ilike.${like},username.ilike.${like},school_name.ilike.${like}`)
        .limit(limitPerType * 2),
      supabase.rpc('search_schools', { search_query: q, school_type: null, result_limit: limitPerType * 2 }),
      supabase
        .from('feed_posts')
        .select('id, title, content, like_count, comment_count, created_at, category, author_id')
        .eq('is_deleted', false)
        .or(`title.ilike.${like},content.ilike.${like},category.ilike.${like}`)
        .order('like_count', { ascending: false })
        .limit(limitPerType * 2),
      supabase
        .from('groups')
        .select('id, name, description, category, member_count, image_url, school_name')
        .eq('is_active', true)
        .or(`name.ilike.${like},description.ilike.${like},category.ilike.${like}`)
        .order('member_count', { ascending: false })
        .limit(limitPerType * 2),
      supabase
        .from('events')
        .select('id, title, description, starts_at, attendee_count, image_url, location_name')
        .eq('is_deleted', false)
        .or(`title.ilike.${like},description.ilike.${like},location_name.ilike.${like}`)
        .order('starts_at', { ascending: true })
        .limit(limitPerType * 2),
      supabase
        .from('places')
        .select('id, name, description, category, address, image_url')
        .eq('is_deleted', false)
        .or(`name.ilike.${like},description.ilike.${like},address.ilike.${like},category.ilike.${like}`)
        .limit(limitPerType * 2),
    ]);

    const hits: SearchHit[] = [];

    for (const p of (people.data ?? []) as any[]) {
      const s = Math.max(
        scoreText(p.display_name, q),
        scoreText(p.username, q),
        scoreText(p.school_name, q) * 0.5,
      );
      if (s <= 0) continue;
      hits.push({
        type: 'person',
        id: p.id,
        label: p.display_name || p.username || 'User',
        sublabel: p.username ? `@${p.username}` : p.school_name ?? undefined,
        avatar_url: p.avatar_url,
        meta: { verified: p.verification_status === 'verified', school_name: p.school_name },
        score:
          s +
          (p.verification_status === 'verified' ? 8 : 0) +
          (userSchoolName && p.school_name === userSchoolName ? 12 : 0),
      });
    }

    for (const s of (schoolsRes.data ?? []) as any[]) {
      const base = scoreText(s.name, q) || 30;
      hits.push({
        type: 'school',
        id: s.id,
        label: s.name,
        sublabel: [s.city, s.state, s.country].filter(Boolean).join(', '),
        meta: { school_type: s.type, is_notable: s.is_notable },
        score: base + (s.is_notable ? 10 : 0) - (s.match_rank ?? 5),
      });
    }

    for (const p of (posts.data ?? []) as any[]) {
      const s = Math.max(scoreText(p.title, q), scoreText(p.content, q) * 0.9, scoreText(p.category, q) * 0.7);
      if (s <= 0) continue;
      hits.push({
        type: 'post',
        id: p.id,
        label: p.title || (p.content ?? '').slice(0, 80),
        sublabel: p.category ?? undefined,
        meta: {
          like_count: p.like_count,
          comment_count: p.comment_count,
          created_at: p.created_at,
          content: p.content,
          author_id: p.author_id,
        },
        score: s + Math.min((p.like_count ?? 0) / 10, 15) + Math.min((p.comment_count ?? 0) / 5, 8),
      });
    }

    for (const g of (groups.data ?? []) as any[]) {
      const s = Math.max(scoreText(g.name, q), scoreText(g.description, q) * 0.7, scoreText(g.category, q) * 0.8);
      if (s <= 0) continue;
      hits.push({
        type: 'group',
        id: g.id,
        label: g.name,
        sublabel: g.category ?? g.school_name ?? undefined,
        avatar_url: g.image_url,
        meta: { member_count: g.member_count },
        score: s + Math.min((g.member_count ?? 0) / 5, 20),
      });
    }

    for (const e of (events.data ?? []) as any[]) {
      const s = Math.max(scoreText(e.title, q), scoreText(e.description, q) * 0.7, scoreText(e.location_name, q) * 0.6);
      if (s <= 0) continue;
      hits.push({
        type: 'event',
        id: e.id,
        label: e.title,
        sublabel: e.location_name ?? undefined,
        avatar_url: e.image_url,
        meta: { starts_at: e.starts_at, attendee_count: e.attendee_count },
        score: s + Math.min((e.attendee_count ?? 0) / 3, 15),
      });
    }

    for (const pl of (places.data ?? []) as any[]) {
      const s = Math.max(
        scoreText(pl.name, q),
        scoreText(pl.description, q) * 0.6,
        scoreText(pl.category, q) * 0.7,
        scoreText(pl.address, q) * 0.5,
      );
      if (s <= 0) continue;
      hits.push({
        type: 'place',
        id: pl.id,
        label: pl.name,
        sublabel: pl.category ?? pl.address ?? undefined,
        avatar_url: pl.image_url,
        score: s,
      });
    }

    // Hashtag suggestions: derive from category + a tiny common list; the search string itself becomes a tag.
    const tagQ = q.replace(/^#/, '');
    if (tagQ.length >= 1) {
      hits.push({
        type: 'hashtag',
        id: tagQ.toLowerCase(),
        label: `#${tagQ}`,
        sublabel: 'Hashtag',
        score: scoreText(tagQ, tagQ) - 5,
      });
    }

    hits.sort((a, b) => b.score - a.score);

    // Build suggestion chips: top mixed hits, deduped by label, capped to 12
    const seen = new Set<string>();
    const suggestions = hits
      .filter((h) => {
        const k = `${h.type}:${h.label.toLowerCase()}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .slice(0, 12)
      .map((h) => ({ type: h.type, id: h.id, label: h.label }));

    // Group hits per type with per-type cap
    const grouped: Record<string, SearchHit[]> = {};
    for (const h of hits) {
      (grouped[h.type] ??= []).push(h);
    }
    for (const k of Object.keys(grouped)) grouped[k] = grouped[k].slice(0, limitPerType);

    return jsonOk({ hits, grouped, suggestions });
  } catch (err) {
    console.error('global-search error', err);
    return jsonError(500, 'Search failed');
  }
});