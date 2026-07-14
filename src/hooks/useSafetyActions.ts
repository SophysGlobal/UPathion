import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export const useSafetyActions = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const requireAuth = () => {
    if (!user?.id) {
      toast.error("Sign in to use safety controls");
      return false;
    }
    return true;
  };

  const blockUser = async (targetId: string) => {
    if (!requireAuth()) return false;
    if (targetId === user!.id) {
      toast.error("You cannot block yourself");
      return false;
    }
    const { error } = await supabase
      .from("user_blocks")
      .insert({ blocker_id: user!.id, blocked_id: targetId });
    if (error && !error.message?.toLowerCase().includes("duplicate")) {
      toast.error("Failed to block user");
      return false;
    }
    toast.success("User blocked");
    qc.invalidateQueries({ queryKey: ["user-blocks", user!.id] });
    return true;
  };

  const unblockUser = async (targetId: string) => {
    if (!requireAuth()) return false;
    const { error } = await supabase
      .from("user_blocks")
      .delete()
      .eq("blocker_id", user!.id)
      .eq("blocked_id", targetId);
    if (error) {
      toast.error("Failed to unblock user");
      return false;
    }
    toast.success("User unblocked");
    qc.invalidateQueries({ queryKey: ["user-blocks", user!.id] });
    return true;
  };

  const muteUser = async (targetId: string) => {
    if (!requireAuth()) return false;
    if (targetId === user!.id) return false;
    const { error } = await supabase
      .from("user_mutes")
      .insert({ muter_id: user!.id, muted_id: targetId });
    if (error && !error.message?.toLowerCase().includes("duplicate")) {
      toast.error("Failed to mute user");
      return false;
    }
    toast.success("User muted");
    qc.invalidateQueries({ queryKey: ["user-mutes", user!.id] });
    return true;
  };

  const unmuteUser = async (targetId: string) => {
    if (!requireAuth()) return false;
    const { error } = await supabase
      .from("user_mutes")
      .delete()
      .eq("muter_id", user!.id)
      .eq("muted_id", targetId);
    if (error) {
      toast.error("Failed to unmute user");
      return false;
    }
    toast.success("User unmuted");
    qc.invalidateQueries({ queryKey: ["user-mutes", user!.id] });
    return true;
  };

  return { blockUser, unblockUser, muteUser, unmuteUser };
};