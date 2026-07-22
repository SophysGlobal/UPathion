import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { supabase as supabaseTyped } from '@/integrations/supabase/client';
const supabase = supabaseTyped as any;
import { useAdminStatus } from '@/hooks/useAdminStatus';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, RefreshCw, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type Tab = 'security' | 'moderation';

interface SecurityEvent {
  id: string;
  event_type: string;
  user_id: string | null;
  severity: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

interface ModerationAction {
  id: string;
  report_id: string | null;
  moderator_id: string;
  target_user_id: string | null;
  action: string;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const AuditLog = () => {
  const { isAdmin, isLoading } = useAdminStatus();
  const [tab, setTab] = useState<Tab>('security');
  const [filter, setFilter] = useState('');

  const secQuery = useQuery({
    queryKey: ['audit-security'],
    enabled: isAdmin && tab === 'security',
    staleTime: 30_000,
    queryFn: async (): Promise<SecurityEvent[]> => {
      const { data, error } = await supabase
        .from('security_events')
        .select('id,event_type,user_id,severity,metadata,created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as SecurityEvent[];
    },
  });

  const modQuery = useQuery({
    queryKey: ['audit-moderation'],
    enabled: isAdmin && tab === 'moderation',
    staleTime: 30_000,
    queryFn: async (): Promise<ModerationAction[]> => {
      const { data, error } = await supabase
        .from('moderation_actions')
        .select('id,report_id,moderator_id,target_user_id,action,reason,metadata,created_at')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data ?? []) as ModerationAction[];
    },
  });

  const rows = tab === 'security' ? secQuery.data ?? [] : modQuery.data ?? [];
  const filtered = useMemo(() => {
    const f = filter.trim().toLowerCase();
    if (!f) return rows;
    return rows.filter((r: any) => JSON.stringify(r).toLowerCase().includes(f));
  }, [rows, filter]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const refetch = () => (tab === 'security' ? secQuery.refetch() : modQuery.refetch());
  const fetching = tab === 'security' ? secQuery.isFetching : modQuery.isFetching;

  const sevColor = (s: string) =>
    s === 'critical' || s === 'error'
      ? 'bg-destructive/15 text-destructive'
      : s === 'warn'
      ? 'bg-amber-500/15 text-amber-500'
      : 'bg-secondary text-muted-foreground';

  return (
    <div className="min-h-screen bg-background/80 pb-20">
      <AppHeader title="Audit Log" subtitle="Security & moderation history" />
      <main className="relative z-10 px-5 py-6 space-y-4 max-w-5xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          {(['security', 'moderation'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors capitalize',
                tab === k
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {k}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter…"
              className="h-8 w-48"
            />
            <Button size="sm" variant="outline" onClick={() => refetch()} disabled={fetching}>
              <RefreshCw className={cn('w-4 h-4', fetching && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-sm">
              {fetching ? 'Loading…' : 'No entries.'}
            </p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((r: any) => (
            <div key={r.id} className="rounded-lg border border-border bg-card/70 p-3 text-sm">
              <div className="flex items-center gap-2 flex-wrap">
                {tab === 'security' ? (
                  <>
                    <span className="font-medium">{r.event_type}</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px]', sevColor(r.severity))}>
                      {r.severity}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="font-medium capitalize">{r.action}</span>
                    {r.report_id && (
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] text-muted-foreground">
                        report {r.report_id.slice(0, 8)}
                      </span>
                    )}
                  </>
                )}
                <span className="ml-auto text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-1 text-xs text-muted-foreground space-x-3">
                {r.user_id && <span>user: <code>{r.user_id.slice(0, 8)}</code></span>}
                {r.target_user_id && <span>target: <code>{r.target_user_id.slice(0, 8)}</code></span>}
                {r.moderator_id && <span>mod: <code>{r.moderator_id.slice(0, 8)}</code></span>}
              </div>
              {r.reason && (
                <p className="mt-2 text-xs whitespace-pre-wrap flex gap-1">
                  <Info className="w-3 h-3 mt-0.5 flex-shrink-0" /> {r.reason}
                </p>
              )}
              {r.metadata && Object.keys(r.metadata).length > 0 && (
                <pre className="mt-2 text-[10px] bg-muted/30 rounded p-2 overflow-x-auto">
                  {JSON.stringify(r.metadata, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground flex items-center gap-1 pt-2">
          <AlertTriangle className="w-3 h-3" /> Showing up to 500 most-recent entries.
        </p>
      </main>
      <BottomNav />
    </div>
  );
};

export default AuditLog;