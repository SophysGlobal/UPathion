import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useSuspensionStatus } from '@/hooks/useSuspensionStatus';
import { useFilteredVisibility, useCanUseSchoolOnly } from '@/hooks/useVisibilityOptions';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'question', label: 'Question' },
  { value: 'advice', label: 'Advice' },
  { value: 'event', label: 'Event' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'announcement', label: 'Announcement' },
] as const;

const VISIBILITY = [
  { value: 'public', label: 'Public' },
  { value: 'school_only', label: 'School only' },
  { value: 'connections', label: 'Connections' },
] as const;

interface PostComposerProps {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onPosted?: () => void;
}

const PostComposer = ({ open, onOpenChange, onPosted }: PostComposerProps) => {
  const { user } = useAuth();
  const { isSuspended, suspension } = useSuspensionStatus();
  const { canUseSchoolOnly } = useCanUseSchoolOnly();
  const visibilityOptions = useFilteredVisibility(VISIBILITY);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]['value']>('general');
  const [visibility, setVisibility] = useState<typeof VISIBILITY[number]['value']>(
    canUseSchoolOnly ? 'school_only' : 'public',
  );
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setVisibility(canUseSchoolOnly ? 'school_only' : 'public');
  };

  const close = (o: boolean) => {
    if (submitting) return;
    if (!o) reset();
    onOpenChange(o);
  };

  const submit = async () => {
    if (!user) return toast.error('Sign in to post');
    if (isSuspended) return toast.error('Your account is suspended');
    const trimmed = content.trim();
    if (!trimmed) return toast.error('Please write something');
    if (trimmed.length > 5000) return toast.error('Post is too long');
    setSubmitting(true);
    try {
      const { error } = await (supabase as any).from('feed_posts').insert({
        author_id: user.id,
        title: title.trim() || null,
        content: trimmed,
        category,
        visibility,
      });
      if (error) throw error;
      toast.success('Posted!');
      reset();
      onOpenChange(false);
      onPosted?.();
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Failed to post');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create a post</DialogTitle>
        </DialogHeader>

        {isSuspended ? (
          <div className="p-4 rounded-lg border border-destructive/40 bg-destructive/10 text-sm">
            Your account is currently suspended. Reason: {suspension?.reason}.
            {suspension?.expires_at && (
              <> Suspension lifts on {new Date(suspension.expires_at).toLocaleString()}.</>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={140}
              placeholder="Optional title"
            />
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={5000}
              rows={6}
              placeholder="Share something with your school community…"
            />
            <p className="text-xs text-muted-foreground text-right">{content.length}/5000</p>

            <div>
              <label className="text-xs text-muted-foreground">Category</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      category === c.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs text-muted-foreground">Visibility</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {visibilityOptions.map((v) => (
                  <button
                    key={v.value}
                    type="button"
                    onClick={() => setVisibility(v.value)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      visibility === v.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
              {!canUseSchoolOnly && (
                <p className="text-[11px] text-muted-foreground mt-1">
                  Verify with your school email to post to your school community.
                </p>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => close(false)} disabled={submitting}>
            Cancel
          </Button>
          {!isSuspended && (
            <Button onClick={submit} disabled={submitting || !content.trim()}>
              {submitting ? 'Posting…' : 'Post'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PostComposer;