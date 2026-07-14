import { useState } from "react";
import { MoreVertical, Flag, Ban, VolumeX, Volume2, CheckCircle2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import ReportDialog, { ReportTargetType } from "./ReportDialog";
import { useBlockedUsers, useMutedUsers } from "@/hooks/useBlockedUsers";
import { useSafetyActions } from "@/hooks/useSafetyActions";
import { cn } from "@/lib/utils";

interface UserSafetyMenuProps {
  targetUserId: string | null | undefined;
  targetType?: ReportTargetType; // defaults to 'profile'
  targetId?: string; // defaults to targetUserId
  targetLabel?: string;
  className?: string;
  align?: "start" | "end" | "center";
  /** Called after block/unblock so parent sheets can close if desired. */
  onBlocked?: () => void;
}

/**
 * Universal safety dropdown: Report, Block, Mute. Renders nothing when the
 * target user is missing or is the current user (handled at call site).
 */
const UserSafetyMenu = ({
  targetUserId,
  targetType = "profile",
  targetId,
  targetLabel,
  className,
  align = "end",
  onBlocked,
}: UserSafetyMenuProps) => {
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const { isBlocked } = useBlockedUsers();
  const { isMuted } = useMutedUsers();
  const { blockUser, unblockUser, muteUser, unmuteUser } = useSafetyActions();

  const blocked = isBlocked(targetUserId);
  const muted = isMuted(targetUserId);

  const handleBlock = async () => {
    if (!targetUserId) return;
    const ok = await blockUser(targetUserId);
    if (ok) onBlocked?.();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="More options"
            className={cn(
              "p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors",
              className,
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-48">
          <DropdownMenuItem onClick={() => setReportOpen(true)}>
            <Flag className="w-4 h-4 mr-2 text-destructive" />
            Report
          </DropdownMenuItem>
          {targetUserId && (
            <>
              <DropdownMenuItem
                onClick={() => (muted ? unmuteUser(targetUserId) : muteUser(targetUserId))}
              >
                {muted ? (
                  <>
                    <Volume2 className="w-4 h-4 mr-2" />
                    Unmute user
                  </>
                ) : (
                  <>
                    <VolumeX className="w-4 h-4 mr-2" />
                    Mute user
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={blocked ? "" : "text-destructive focus:text-destructive"}
                onClick={() =>
                  blocked ? unblockUser(targetUserId) : setConfirmBlock(true)
                }
              >
                {blocked ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Unblock user
                  </>
                ) : (
                  <>
                    <Ban className="w-4 h-4 mr-2" />
                    Block user
                  </>
                )}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportDialog
        open={reportOpen}
        onOpenChange={setReportOpen}
        targetType={targetType}
        targetId={targetId ?? targetUserId ?? "unknown"}
        targetOwnerId={targetUserId ?? null}
        targetLabel={targetLabel}
      />

      <AlertDialog open={confirmBlock} onOpenChange={setConfirmBlock}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Block this user?</AlertDialogTitle>
            <AlertDialogDescription>
              They won't be able to message you or see your interactions. You can
              unblock them anytime from your privacy settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleBlock}
            >
              Block
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserSafetyMenu;