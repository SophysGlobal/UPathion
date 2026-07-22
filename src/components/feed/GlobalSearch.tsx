import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Loader2, User, School as SchoolIcon, Hash, Users, Calendar, MapPin, FileText, TrendingUp, Clock } from 'lucide-react';
import { useGlobalSearch, type SearchHit, type SearchHitType, type SearchSuggestion } from '@/hooks/useGlobalSearch';
import SchoolBottomSheet from '@/components/SchoolBottomSheet';
import UserProfileBottomSheet from '@/components/UserProfileBottomSheet';

const RECENT_KEY = 'upathion:recent-searches:v1';
const MAX_RECENT = 8;

const TRENDING_HASHTAGS = ['#StudyTips', '#CollegePrep', '#STEM', '#Scholarships', '#Applications', '#DormLife'];

const TYPE_ORDER: SearchHitType[] = ['person', 'school', 'hashtag', 'post', 'group', 'event', 'place'];

const TYPE_LABEL: Record<SearchHitType, string> = {
  person: 'People',
  school: 'Schools',
  hashtag: 'Hashtags',
  post: 'Posts',
  group: 'Groups',
  event: 'Events',
  place: 'Places',
};

function IconFor({ type, className = 'w-4 h-4' }: { type: SearchHitType; className?: string }) {
  const Cmp =
    type === 'person' ? User :
    type === 'school' ? SchoolIcon :
    type === 'hashtag' ? Hash :
    type === 'group' ? Users :
    type === 'event' ? Calendar :
    type === 'place' ? MapPin :
    FileText;
  return <Cmp className={className} />;
}

function loadRecent(): SearchSuggestion[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as SearchSuggestion[]) : [];
  } catch { return []; }
}

function saveRecent(list: SearchSuggestion[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, MAX_RECENT))); } catch {/*noop*/}
}

interface Props {
  userSchoolName?: string | null;
  /** Called when user picks a hashtag chip so Feed can filter live posts. */
  onHashtagPick?: (tag: string) => void;
  /** Called when user picks a free-text query (Enter) so Feed can filter body text. */
  onQueryPick?: (q: string) => void;
}

const GlobalSearch = ({ userSchoolName, onHashtagPick, onQueryPick }: Props) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [recent, setRecent] = useState<SearchSuggestion[]>(() => loadRecent());
  const [schoolSheet, setSchoolSheet] = useState<{ name: string; type: 'high_school' | 'university' } | null>(null);
  const [userSheetId, setUserSheetId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, isFetching } = useGlobalSearch(query, { userSchoolName });
  const hasQuery = query.trim().length > 0;
  const suggestions = data?.suggestions ?? [];
  const grouped = data?.grouped ?? {};

  // Flat list for keyboard nav
  const flatHits = useMemo<SearchHit[]>(() => {
    const out: SearchHit[] = [];
    for (const t of TYPE_ORDER) for (const h of grouped[t] ?? []) out.push(h);
    return out;
  }, [grouped]);

  useEffect(() => { setHighlight(0); }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setFocused(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const pushRecent = useCallback((s: SearchSuggestion) => {
    setRecent((prev) => {
      const next = [s, ...prev.filter((p) => !(p.type === s.type && p.id === s.id))].slice(0, MAX_RECENT);
      saveRecent(next);
      return next;
    });
  }, []);

  const openHit = useCallback((h: SearchHit) => {
    pushRecent({ type: h.type, id: h.id, label: h.label });
    setFocused(false);
    switch (h.type) {
      case 'person':
        setUserSheetId(h.id);
        break;
      case 'school':
        setSchoolSheet({ name: h.label, type: (h.meta?.school_type as 'high_school' | 'university') ?? 'university' });
        break;
      case 'hashtag': {
        const tag = h.label.startsWith('#') ? h.label : `#${h.label}`;
        onHashtagPick?.(tag);
        setQuery('');
        break;
      }
      case 'post':
        onQueryPick?.(h.label);
        setQuery('');
        break;
      case 'group': navigate(`/group/${h.id}`); break;
      case 'event': navigate(`/event/${h.id}`); break;
      case 'place': navigate(`/place/${h.id}`); break;
    }
  }, [navigate, onHashtagPick, onQueryPick, pushRecent]);

  const openSuggestion = useCallback((s: SearchSuggestion) => {
    const match = flatHits.find((h) => h.type === s.type && h.id === s.id);
    if (match) return openHit(match);
    // Fallback shallow open (for recent hashtag chips etc.)
    if (s.type === 'hashtag') { onHashtagPick?.(s.label.startsWith('#') ? s.label : `#${s.label}`); setQuery(''); setFocused(false); return; }
    setQuery(s.label);
    inputRef.current?.focus();
  }, [flatHits, openHit, onHashtagPick]);

  const handleKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(h + 1, Math.max(flatHits.length - 1, 0))); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (flatHits[highlight]) openHit(flatHits[highlight]);
      else if (hasQuery) { onQueryPick?.(query.trim()); pushRecent({ type: 'hashtag', id: query.trim().toLowerCase(), label: query.trim() }); setFocused(false); }
    } else if (e.key === 'Escape') { setFocused(false); inputRef.current?.blur(); }
  };

  const clearRecent = () => { setRecent([]); saveRecent([]); };
  const removeRecent = (s: SearchSuggestion) => {
    setRecent((prev) => { const n = prev.filter((p) => !(p.type === s.type && p.id === s.id)); saveRecent(n); return n; });
  };

  const showPanel = focused;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={handleKey}
          placeholder="Search people, schools, posts, clubs…"
          aria-label="Global search"
          className="w-full h-10 pl-9 pr-16 rounded-full bg-secondary/60 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isFetching && hasQuery && <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />}
          {hasQuery && (
            <button onClick={() => { setQuery(''); inputRef.current?.focus(); }} aria-label="Clear search"
              className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Suggestion chip bar (only when typing and we have suggestions) */}
      {hasQuery && suggestions.length > 0 && (
        <div className="mt-2 -mx-1 px-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2">
            {suggestions.map((s) => (
              <button
                key={`${s.type}-${s.id}`}
                onClick={() => openSuggestion(s)}
                className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/60 hover:bg-secondary text-xs font-medium text-foreground whitespace-nowrap transition-colors border border-border/40"
              >
                <IconFor type={s.type} className="w-3.5 h-3.5 text-primary" />
                <span className="truncate max-w-[160px]">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Dropdown panel */}
      {showPanel && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl shadow-2xl max-h-[70vh] overflow-y-auto animate-fade-in">
          {!hasQuery ? (
            <EmptyState
              recent={recent}
              onPick={openSuggestion}
              onRemove={removeRecent}
              onClear={clearRecent}
              onHashtag={(t) => { onHashtagPick?.(t); setFocused(false); }}
            />
          ) : flatHits.length === 0 && !isFetching ? (
            <NoResults
              query={query}
              onHashtag={(t) => { onHashtagPick?.(t); setFocused(false); }}
            />
          ) : (
            <ResultSections
              grouped={grouped}
              flatHits={flatHits}
              highlight={highlight}
              onHit={openHit}
            />
          )}
        </div>
      )}

      <SchoolBottomSheet
        open={!!schoolSheet}
        onOpenChange={(o) => !o && setSchoolSheet(null)}
        school={schoolSheet}
        isOwnSchool={schoolSheet?.name === userSchoolName}
      />
      <UserProfileBottomSheet
        open={!!userSheetId}
        onOpenChange={(o) => !o && setUserSheetId(null)}
        userId={userSheetId}
        seedUser={null}
      />
    </div>
  );
};

export default GlobalSearch;

/* ------------------- subcomponents ------------------- */

function EmptyState({
  recent, onPick, onRemove, onClear, onHashtag,
}: {
  recent: SearchSuggestion[];
  onPick: (s: SearchSuggestion) => void;
  onRemove: (s: SearchSuggestion) => void;
  onClear: () => void;
  onHashtag: (tag: string) => void;
}) {
  return (
    <div className="p-4 space-y-5">
      {recent.length > 0 && (
        <section>
          <header className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground font-medium">
              <Clock className="w-3.5 h-3.5" /> Recent
            </div>
            <button onClick={onClear} className="text-xs text-muted-foreground hover:text-foreground">Clear all</button>
          </header>
          <div className="flex flex-col gap-1">
            {recent.map((s) => (
              <div key={`${s.type}-${s.id}`} className="flex items-center gap-2 group">
                <button
                  onClick={() => onPick(s)}
                  className="flex-1 flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-secondary/60 transition-colors text-left"
                >
                  <IconFor type={s.type} className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm text-foreground truncate">{s.label}</span>
                </button>
                <button
                  onClick={() => onRemove(s)}
                  aria-label="Remove"
                  className="p-1 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-secondary transition"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="flex items-center gap-1.5 mb-2 text-xs uppercase tracking-wider text-muted-foreground font-medium">
          <TrendingUp className="w-3.5 h-3.5" /> Trending
        </div>
        <div className="flex flex-wrap gap-2">
          {TRENDING_HASHTAGS.map((t) => (
            <button key={t} onClick={() => onHashtag(t)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary transition-colors">
              <Hash className="w-3 h-3" />{t.replace('#','')}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function NoResults({ query, onHashtag }: { query: string; onHashtag: (tag: string) => void }) {
  return (
    <div className="p-6 text-center">
      <p className="text-sm text-foreground font-medium">No results found for "{query}"</p>
      <p className="text-xs text-muted-foreground mt-1 mb-4">Try a different keyword or explore what's trending.</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {TRENDING_HASHTAGS.map((t) => (
          <button key={t} onClick={() => onHashtag(t)}
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-xs font-medium text-primary transition-colors">
            <Hash className="w-3 h-3" />{t.replace('#','')}
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultSections({
  grouped, flatHits, highlight, onHit,
}: {
  grouped: Partial<Record<SearchHitType, SearchHit[]>>;
  flatHits: SearchHit[];
  highlight: number;
  onHit: (h: SearchHit) => void;
}) {
  let idx = -1;
  return (
    <div className="py-2">
      {TYPE_ORDER.map((t) => {
        const items = grouped[t];
        if (!items || items.length === 0) return null;
        return (
          <section key={t} className="px-2 py-1">
            <h3 className="px-2 py-1 text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">{TYPE_LABEL[t]}</h3>
            <ul>
              {items.map((h) => {
                idx += 1;
                const active = idx === highlight;
                return (
                  <li key={`${h.type}-${h.id}`}>
                    <button
                      onClick={() => onHit(h)}
                      className={`w-full flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors ${active ? 'bg-primary/15' : 'hover:bg-secondary/60'}`}
                    >
                      <span className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center overflow-hidden shrink-0">
                        {h.avatar_url ? (
                          <img src={h.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <IconFor type={h.type} className="w-4 h-4 text-primary" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5">
                          <span className="text-sm text-foreground font-medium truncate">{h.label}</span>
                          {h.meta?.verified ? <span className="text-[10px] text-primary">✓</span> : null}
                        </span>
                        {h.sublabel && <span className="block text-xs text-muted-foreground truncate">{h.sublabel}</span>}
                      </span>
                      <MetaBadge hit={h} />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function MetaBadge({ hit }: { hit: SearchHit }) {
  if (hit.type === 'group' && hit.meta?.member_count != null)
    return <span className="text-[10px] text-muted-foreground shrink-0">{hit.meta.member_count} members</span>;
  if (hit.type === 'event' && hit.meta?.attendee_count != null)
    return <span className="text-[10px] text-muted-foreground shrink-0">{hit.meta.attendee_count} going</span>;
  if (hit.type === 'post' && hit.meta?.like_count != null)
    return <span className="text-[10px] text-muted-foreground shrink-0">♥ {hit.meta.like_count}</span>;
  return null;
}