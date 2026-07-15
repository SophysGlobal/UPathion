import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useAdminStatus } from '@/hooks/useAdminStatus';
import { Navigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Shield, AlertTriangle, Check, X, Clock, Ban } from 'lucide-react';
import { cn } from '@/lib/utils';

type ReportStatus = 'pending' | 'under_review' | 'action_taken' | 'dismissed';

interface ReportRow {
  id: string;
  reporter_id: string;
  target_type: string;
  target_id: string;
  target_owner_id: string | null;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
}

const STATUS_TABS: { key: ReportStatus | 'all'; label: string }[] = [
  { key: 'pending', label: 'Pending' },
  { key: 'under_review', label: 'In Review' },
  { key: 'action_taken', label: 'Actioned' },
  { key: 'dismissed', label: 'Dismissed' },
  { key: 'all', label: 'All' },
];

const Moderation = () => {
  const { user } = useAuth();
  const { isAdmin, isLoading } = useAdminStatus();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ReportStatus | 'all'>('pending');
  const [actionModal, setActionModal] = useState<{
    report: ReportRow;
    kind: 'suspend' | 'ban' | 'warn';
  } | null>(null);
  const [reason, setReason] = useState('');
  const [suspendHours, setSuspendHours] = useState<number>(24);

  const { data: reports = [], isFetching } = useQuery({
    queryKey: ['mod-reports', tab],
    enabled: isAdmin,
    queryFn: async (): Promise<ReportRow[]> => {
      let q = supabase
        .from('reports')
        .select('id,reporter_id,target_type,target_id,target_owner_id,reason,details,status,created_at')
        .order('created_at', { ascending: false })
        .limit(200);
      if (tab !== 'all') q = q.eq('status', tab);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ReportRow[];
    },
  });

  const counts = useMemo(() => {
    return reports.reduce<Record<string, number>>((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1;
      return acc;
    }, {});
  }, [reports]);

  if (isLoading) return null;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const closeModal = () => {
    setActionModal(null);
    setReason('');
    setSuspendHours(24);
  };

  const logAction = async (
    report: ReportRow,
    action: 'dismiss' | 'warn' | 'suspend' | 'ban' | 'note',
    extraMeta: Record<string, unknown> = {},
  ) => {
    const { error } = await supabase.from('moderation_actions').insert({
      report_id: report.id,
      moderator_id: user!.id,
      target_user_id: report.target_owner_id ?? undefined,
      action,
      reason: reason || undefined,
      metadata: extraMeta as never,
    } as never);
    if (error) throw error;
  };

  const setReportStatus = async (report: ReportRow, status: ReportStatus) => {
    const { error } = await supabase
      .from('reports')
      .update({
        status,
        moderator_id: user!.id,
        moderator_notes: reason || null,
        resolved_at: status === 'action_taken' || status === 'dismissed' ? new Date().toISOString() : null,
      })
      .eq('id', report.id);
    if (error) throw error;
  };

  const handleDismiss = async (report: ReportRow) => {
    try {
      await logAction(report, 'dismiss');
      await setReportStatus(report, 'dismissed');
      toast.success('Report dismissed');
      qc.invalidateQueries({ queryKey: ['mod-reports'] });
    } catch (e) {
      toast.error('Failed to dismiss');
      console.error(e);
    }
  };

  const handleReview = async (report: ReportRow) => {
    try {
      await setReportStatus(report, 'under_review');
      qc.invalidateQueries({ queryKey: ['mod-reports'] });
    } catch (e) {
      toast.error('Failed to update');
      console.error(e);
    }
  };

  const submitModal = async () => {
    if (!actionModal) return;
    const { report, kind } = actionModal;
    if (!reason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      if (kind === 'warn') {
        await logAction(report, 'warn');
        await setReportStatus(report, 'action_taken');
        toast.success('User warned');
      } else if (kind === 'suspend') {
        if (!report.target_owner_id) {
          toast.error('Report has no target user');
          return;
        }
        const expiresAt = new Date(Date.now() + suspendHours * 60 * 60 * 1000).toISOString();
        const { error: sErr } = await supabase.from('user_suspensions').insert({
          user_id: report.target_owner_id,
          moderator_id: user!.id,
          reason,
          is_permanent: false,
          expires_at: expiresAt,
        });
        if (sErr) throw sErr;
        await logAction(report, 'suspend', { hours: suspendHours, expires_at: expiresAt });
        await setReportStatus(report, 'action_taken');
        toast.success(`Suspended for ${suspendHours}h`);
      } else if (kind === 'ban') {
        if (!report.target_owner_id) {
          toast.error('Report has no target user');
          return;
        }
        const { error: sErr } = await supabase.from('user_suspensions').insert({
          user_id: report.target_owner_id,
          moderator_id: user!.id,
          reason,
          is_permanent: true,
        });
        if (sErr) throw sErr;
        await logAction(report, 'ban');
        await setReportStatus(report, 'action_taken');
        toast.success('User banned');
      }
      qc.invalidateQueries({ queryKey: ['mod-reports'] });
      closeModal();
    } catch (e) {
      console.error(e);
      toast.error('Action failed');
    }
  };

  return (
    <div className="min-h-screen bg-background/80 pb-20">
      <AppHeader title="Moderation" subtitle="Reports queue (admin)" />
      <main className="relative z-10 px-5 py-6 space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                tab === t.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground',
              )}
            >
              {t.label}
              {counts[t.key] ? ` (${counts[t.key]})` : ''}
            </button>
          ))}
        </div>

        {isFetching && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 animate-pulse" /> Loading reports…
          </p>
        )}

        {!isFetching && reports.length === 0 && (
          <div className="text-center py-12">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No reports in this queue.</p>
          </div>
        )}

        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="gradient-border">
              <div className="bg-card/90 backdrop-blur-sm rounded-lg p-4 space-y-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium">
                        {r.reason.replace(/_/g, ' ')}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                        {r.target_type}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-secondary text-muted-foreground text-xs">
                        {r.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Reported {new Date(r.created_at).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Target ID: <code>{r.target_id}</code>
                    </p>
                    {r.target_owner_id && (
                      <p className="text-xs text-muted-foreground truncate">
                        Owner: <code>{r.target_owner_id}</code>
                      </p>
                    )}
                    {r.details && (
                      <p className="text-sm text-foreground mt-2 whitespace-pre-wrap">
                        {r.details}
                      </p>
                    )}
                  </div>
                </div>

                {(r.status === 'pending' || r.status === 'under_review') && (
                  <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border">
                    {r.status === 'pending' && (
                      <Button size="sm" variant="outline" onClick={() => handleReview(r)}>
                        <Clock className="w-4 h-4 mr-1" /> Mark reviewing
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleDismiss(r)}>
                      <X className="w-4 h-4 mr-1" /> Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModal({ report: r, kind: 'warn' })}
                      disabled={!r.target_owner_id}
                    >
                      <AlertTriangle className="w-4 h-4 mr-1" /> Warn
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setActionModal({ report: r, kind: 'suspend' })}
                      disabled={!r.target_owner_id}
                    >
                      <Clock className="w-4 h-4 mr-1" /> Suspend
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => setActionModal({ report: r, kind: 'ban' })}
                      disabled={!r.target_owner_id}
                    >
                      <Ban className="w-4 h-4 mr-1" /> Ban
                    </Button>
                  </div>
                )}
                {r.status === 'action_taken' && (
                  <p className="text-xs text-emerald-500 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Action taken
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>

      <Dialog open={!!actionModal} onOpenChange={(o) => !o && closeModal()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionModal?.kind === 'warn' && 'Warn user'}
              {actionModal?.kind === 'suspend' && 'Suspend user'}
              {actionModal?.kind === 'ban' && 'Permanently ban user'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {actionModal?.kind === 'suspend' && (
              <div>
                <label className="text-xs text-muted-foreground">Duration (hours)</label>
                <div className="flex gap-2 mt-1 flex-wrap">
                  {[1, 24, 72, 168, 720].map((h) => (
                    <button
                      key={h}
                      onClick={() => setSuspendHours(h)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs border',
                        suspendHours === h
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground',
                      )}
                    >
                      {h < 24 ? `${h}h` : `${Math.round(h / 24)}d`}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className="text-xs text-muted-foreground">
                Reason (visible in audit log)
              </label>
              <Textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain the moderation decision…"
                maxLength={500}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal}>
              Cancel
            </Button>
            <Button
              variant={actionModal?.kind === 'ban' ? 'destructive' : 'default'}
              onClick={submitModal}
            >
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
};

export default Moderation;