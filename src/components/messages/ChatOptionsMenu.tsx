import { ReactNode, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { Clock, Check, Sliders } from "lucide-react";
import { toast } from "sonner";
import {
  EXPIRATION_PRESETS,
  useConversationExpiration,
  formatExpirationLabel,
} from "@/hooks/useMessages";
import CustomTimerModal from "./CustomTimerModal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  conversationId: string | undefined;
  children: ReactNode;
}

export default function ChatOptionsMenu({ conversationId, children }: Props) {
  const { expirationSeconds, updateExpiration } = useConversationExpiration(conversationId);
  const [customOpen, setCustomOpen] = useState(false);
  const [pendingSeconds, setPendingSeconds] = useState<number | null | undefined>(undefined);

  const applyPreset = async (seconds: number | null) => {
    // If there are already messages, ask whether to apply to existing.
    setPendingSeconds(seconds);
  };

  const confirmApply = async (applyToExisting: boolean) => {
    if (pendingSeconds === undefined) return;
    try {
      await updateExpiration(pendingSeconds, applyToExisting);
      toast.success(formatExpirationLabel(pendingSeconds));
    } catch (e) {
      toast.error("Couldn't update timer");
    } finally {
      setPendingSeconds(undefined);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-56">
          <ContextMenuLabel>Chat Options</ContextMenuLabel>
          <ContextMenuSeparator />
          <ContextMenuSub>
            <ContextMenuSubTrigger>
              <Clock className="w-4 h-4 mr-2" />
              Message Removal Timing
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {EXPIRATION_PRESETS.map((p) => {
                const active = (p.seconds ?? null) === (expirationSeconds ?? null);
                return (
                  <ContextMenuItem
                    key={p.label}
                    onSelect={(e) => {
                      e.preventDefault();
                      applyPreset(p.seconds);
                    }}
                  >
                    <span className="flex-1">{p.label}</span>
                    {active && <Check className="w-4 h-4 ml-2 text-primary" />}
                  </ContextMenuItem>
                );
              })}
              <ContextMenuSeparator />
              <ContextMenuItem
                onSelect={(e) => {
                  e.preventDefault();
                  setCustomOpen(true);
                }}
              >
                <Sliders className="w-4 h-4 mr-2" />
                Custom…
              </ContextMenuItem>
            </ContextMenuSubContent>
          </ContextMenuSub>
        </ContextMenuContent>
      </ContextMenu>

      <CustomTimerModal
        open={customOpen}
        onOpenChange={setCustomOpen}
        initialSeconds={expirationSeconds}
        onSave={(seconds) => applyPreset(seconds)}
      />

      <AlertDialog
        open={pendingSeconds !== undefined}
        onOpenChange={(o) => !o && setPendingSeconds(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update disappearing messages</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingSeconds !== undefined && formatExpirationLabel(pendingSeconds)}. Apply this
              timer to existing messages too, or only to future messages?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSeconds(undefined)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmApply(false)}>
              Future messages only
            </AlertDialogAction>
            <AlertDialogAction onClick={() => confirmApply(true)}>
              Apply to existing
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}