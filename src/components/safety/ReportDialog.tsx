import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Flag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ReportTargetType =
  | "post"
  | "thread"
  | "comment"
  | "message"
  | "group_message"
  | "image"
  | "profile"
  | "group"
  | "conversation";

export type ReportReason =
  | "harassment"
  | "bullying"
  | "hate_speech"
  | "spam"
  | "impersonation"
  | "threats"
  | "sexual_content"
  | "violence"
  | "illegal_activity"
  | "self_harm"
  | "scam_fraud"
  | "misinformation"
  | "other";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "harassment", label: "Harassment" },
  { value: "bullying", label: "Bullying" },
  { value: "hate_speech", label: "Hate speech" },
  { value: "threats", label: "Threats" },
  { value: "sexual_content", label: "Sexual content" },
  { value: "violence", label: "Violence" },
  { value: "self_harm", label: "Self-harm concerns" },
  { value: "spam", label: "Spam" },
  { value: "scam_fraud", label: "Scam / Fraud" },
  { value: "impersonation", label: "Impersonation" },
  { value: "misinformation", label: "Misinformation" },
  { value: "illegal_activity", label: "Illegal activity" },
  { value: "other", label: "Other" },
];

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  targetType: ReportTargetType;
  targetId: string;
  targetOwnerId?: string | null;
  targetLabel?: string;
}

const ReportDialog = ({ open, onOpenChange, targetType, targetId, targetOwnerId, targetLabel }: ReportDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setReason(null);
    setDetails("");
    setSubmitting(false);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Sign in to submit a report");
      return;
    }
    if (!reason) {
      toast.error("Please choose a reason");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reports").insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      target_owner_id: targetOwnerId ?? null,
      reason,
      details: details.trim().slice(0, 2000) || null,
    });
    setSubmitting(false);
    if (error) {
      console.error("Report error:", error);
      toast.error("Failed to submit report");
      return;
    }
    toast.success("Report submitted. Our moderators will review it.");
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-destructive" />
            Report {targetLabel ?? targetType.replace("_", " ")}
          </DialogTitle>
          <DialogDescription>
            Your report is confidential. Our team reviews every submission.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">Reason</Label>
            <div className="grid grid-cols-2 gap-2">
              {REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setReason(r.value)}
                  className={cn(
                    "text-left text-sm px-3 py-2 rounded-lg border transition-colors",
                    reason === r.value
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary",
                  )}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="report-details" className="text-xs uppercase tracking-wide text-muted-foreground">
              Additional details (optional)
            </Label>
            <Textarea
              id="report-details"
              value={details}
              onChange={(e) => setDetails(e.target.value.slice(0, 2000))}
              placeholder="Add any context that will help our moderators…"
              className="min-h-[90px] resize-none"
            />
            <p className="text-[10px] text-muted-foreground text-right">{details.length}/2000</p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={submitting || !reason}>
            {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Flag className="w-4 h-4 mr-2" />}
            Submit report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportDialog;