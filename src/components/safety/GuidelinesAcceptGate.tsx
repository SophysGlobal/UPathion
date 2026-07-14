import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

/**
 * Shows a one-time modal requiring existing users to accept the Community
 * Guidelines. New sign-ups are prompted at first authenticated load.
 * The dialog is intentionally non-dismissible until accepted.
 */
const GuidelinesAcceptGate = () => {
  const { user } = useAuth();
  const [needsAccept, setNeedsAccept] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.id) {
      setNeedsAccept(false);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("guidelines_accepted_at")
        .eq("id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setNeedsAccept(!data?.guidelines_accepted_at);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const handleAccept = async () => {
    if (!user?.id) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("profiles")
      .update({ guidelines_accepted_at: new Date().toISOString() })
      .eq("id", user.id);
    setSubmitting(false);
    if (error) {
      toast.error("Couldn't save your acceptance. Try again.");
      return;
    }
    setNeedsAccept(false);
  };

  if (!user?.id || !needsAccept) return null;

  return (
    <Dialog open modal>
      <DialogContent
        className="max-w-md [&>button.absolute]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Welcome to UPathion
          </DialogTitle>
          <DialogDescription>
            Before you get started, please review and accept our Community Guidelines. They keep
            this space safe for high school, undergraduate, and graduate students.
          </DialogDescription>
        </DialogHeader>

        <div className="text-sm text-muted-foreground space-y-2 py-2">
          <p>
            By continuing you agree to be respectful, avoid harassment or hate speech, and not
            share explicit, illegal, or harmful content. Violations may result in content removal,
            suspension, or a permanent ban.
          </p>
          <p>
            <Link
              to="/community-guidelines"
              target="_blank"
              className="text-primary hover:underline"
            >
              Read the full Community Guidelines →
            </Link>
          </p>
        </div>

        <DialogFooter>
          <Button className="w-full" onClick={handleAccept} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            I understand and agree
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GuidelinesAcceptGate;