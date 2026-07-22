import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import BottomNav from '@/components/BottomNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useProfileCompletion } from '@/hooks/useProfileCompletion';
import { useSuspensionStatus } from '@/hooks/useSuspensionStatus';
import { useFilteredVisibility, useCanUseSchoolOnly } from '@/hooks/useVisibilityOptions';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';

const CATEGORIES = [
  'academic','career','social','sports','arts',
  'volunteering','research','gaming','entrepreneurship','other',
] as const;

const VISIBILITY = [
  { value: 'public', label: 'Public' },
  { value: 'school_only', label: 'School only' },
  { value: 'invite_only', label: 'Invite only' },
] as const;

const acronym = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0]?.toUpperCase())
    .join('')
    .slice(0, 3);

const CreateGroup = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfileCompletion();
  const { isSuspended, suspension } = useSuspensionStatus();
  const { canUseSchoolOnly } = useCanUseSchoolOnly();
  const visibilityOptions = useFilteredVisibility(VISIBILITY);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('other');
  const [visibility, setVisibility] = useState<(typeof VISIBILITY)[number]['value']>(
    canUseSchoolOnly ? 'school_only' : 'public',
  );
  const [attachSchool, setAttachSchool] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!user) return toast.error('Sign in first');
    if (isSuspended) return toast.error('Your account is suspended');
    const trimmed = name.trim();
    if (trimmed.length < 2) return toast.error('Name is too short');
    if (trimmed.length > 80) return toast.error('Name is too long');
    if (description.length > 1000) return toast.error('Description is too long');

    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        creator_id: user.id,
        name: trimmed,
        description: description.trim() || null,
        category,
        visibility,
      };
      if (attachSchool && profile?.school_name) {
        payload.school_name = profile.school_name;
      }
      const { data, error } = await (supabase as any)
        .from('groups')
        .insert(payload)
        .select('id')
        .single();
      if (error) throw error;
      toast.success('Group created!');
      if (data?.id) {
        navigate(`/group/${data.id}`);
      } else {
        navigate('/explore?tab=groups');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message ?? 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background/80 pb-20">
      <AppHeader title="New Group" subtitle="Create a group or club" />

      <main className="relative z-10 px-5 py-6 max-w-xl mx-auto space-y-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {isSuspended ? (
          <div className="p-4 rounded-lg border border-destructive/40 bg-destructive/10 text-sm">
            Your account is suspended and cannot create groups.
            {suspension?.reason && <> Reason: {suspension.reason}.</>}
          </div>
        ) : (
          <>
            {/* Avatar preview */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-lg font-semibold">
                {name.trim() ? acronym(name) : '·'}
              </div>
              <p className="text-xs text-muted-foreground">
                Image upload coming soon — an acronym is used for now.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Name *</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Robotics Club"
                maxLength={80}
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Description</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                maxLength={1000}
                placeholder="What is this group about? Who should join?"
              />
              <p className="text-xs text-muted-foreground text-right">{description.length}/1000</p>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Category</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border capitalize transition-colors',
                      category === c
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-muted-foreground">Visibility</label>
              <div className="flex flex-wrap gap-2">
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
                <p className="text-[11px] text-muted-foreground">
                  Verify with your school email to create a school-only group.
                </p>
              )}
            </div>

            {profile?.school_name && (
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={attachSchool}
                  onChange={(e) => setAttachSchool(e.target.checked)}
                />
                Associate with <span className="font-medium">{profile.school_name}</span>
              </label>
            )}

            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate(-1)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={submit} disabled={submitting || name.trim().length < 2}>
                {submitting ? 'Creating…' : 'Create Group'}
              </Button>
            </div>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default CreateGroup;