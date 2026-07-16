import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PanelLeft, PanelLeftClose, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import {
  useAIConversationsList,
  useAIMessages,
  createConversation,
  type AIMessageRow,
  type AIConversation,
} from "@/hooks/useAIConversations";
import AIChatPanel from "./AIChatPanel";
import AIChatComposer, { type PendingAttachment } from "./AIChatComposer";
import AIChatSidebar from "./AIChatSidebar";

interface Props {
  onClose: () => void;
}

const AIChatWindow = ({ onClose }: Props) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { conversations, refresh } = useAIConversationsList(showArchived);
  const { messages, setMessages, reload } = useAIMessages(activeId);
  const [streamingText, setStreamingText] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [localMessages, setLocalMessages] = useState<AIMessageRow[]>([]);

  useEffect(() => { setSidebarOpen(!isMobile); }, [isMobile]);

  // Select most recent conversation on open
  useEffect(() => {
    if (!activeId && conversations.length > 0) {
      setActiveId(conversations[0].id);
    }
  }, [conversations, activeId]);

  const activeConvo: AIConversation | undefined = useMemo(
    () => conversations.find((c) => c.id === activeId),
    [conversations, activeId],
  );

  const handleNew = useCallback(async () => {
    if (!user) return;
    setActiveId(null);
    setMessages([]);
    setLocalMessages([]);
    setStreamingText("");
    if (isMobile) setSidebarOpen(false);
  }, [user, setMessages, isMobile]);

  const handleSelect = useCallback((id: string) => {
    setActiveId(id);
    setLocalMessages([]);
    setStreamingText("");
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleSend = useCallback(async (text: string, attachments: PendingAttachment[]) => {
    if (!user) return;
    if (submitting || streaming) return;

    setSubmitting(true);
    setStreamingText("");

    // Optimistic user message
    const tempId = `tmp-${Date.now()}`;
    const optimistic: AIMessageRow = {
      id: tempId,
      role: "user",
      content: text,
      error: null,
      created_at: new Date().toISOString(),
      attachments: attachments
        .filter((a) => a.storagePath)
        .map((a) => ({
          id: a.localId,
          storage_path: a.storagePath!,
          mime_type: a.file.type,
          signedUrl: a.previewUrl,
        })),
    };
    setLocalMessages((prev) => [...prev, optimistic]);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Please sign in");

      // Build message array (existing + new)
      const historyForApi = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        {
          role: "user" as const,
          content: text || "(image)",
          attachments: attachments
            .filter((a) => a.storagePath)
            .map((a) => ({ storagePath: a.storagePath!, mimeType: a.file.type })),
        },
      ];

      const resp = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/premium-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({ conversationId: activeId, messages: historyForApi }),
        },
      );

      if (!resp.ok || !resp.body) {
        const raw = await resp.text().catch(() => "");
        console.error("premium-chat error", resp.status, raw);
        let m = `Request failed (${resp.status})`;
        try { const j = JSON.parse(raw); if (j?.error) m = j.error; } catch { /* ignore */ }
        throw new Error(m);
      }

      const newConversationId = resp.headers.get("X-Conversation-Id") ?? activeId;

      setSubmitting(false);
      setStreaming(true);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buf = "";
      let full = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        let nl: number;
        while ((nl = buf.indexOf("\n")) !== -1) {
          let line = buf.slice(0, nl);
          buf = buf.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const j = line.slice(6).trim();
          if (j === "[DONE]") continue;
          try {
            const parsed = JSON.parse(j);
            const delta = parsed?.choices?.[0]?.delta?.content;
            if (typeof delta === "string") {
              full += delta;
              setStreamingText(full);
            }
          } catch { /* ignore */ }
        }
      }

      setStreaming(false);
      setStreamingText("");
      // Switch to the persisted conversation and reload from DB
      if (newConversationId && newConversationId !== activeId) {
        setActiveId(newConversationId);
      } else {
        await reload();
      }
      setLocalMessages([]);
      await refresh();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      console.error("AI chat send failed:", e);
      toast.error(msg);
      // Keep user's message and append an inline error bubble so the UI doesn't just "reset"
      setLocalMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: "",
          error: msg,
          created_at: new Date().toISOString(),
        },
      ]);
      setStreaming(false);
      setStreamingText("");
    } finally {
      setSubmitting(false);
    }
  }, [user, submitting, streaming, activeId, messages, setMessages, reload, refresh]);

  const sidebar = (
    <AIChatSidebar
      conversations={conversations}
      activeId={activeId}
      onSelect={handleSelect}
      onNew={handleNew}
      onArchivedClick={() => setShowArchived((v) => !v)}
      showArchivedButton
    />
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-md p-2 sm:p-4">
      <div
        className={cn(
          "relative flex bg-background border border-border/60 rounded-2xl shadow-2xl overflow-hidden",
          "w-full max-w-4xl h-[90vh]",
        )}
      >
        {/* Desktop sidebar with animated width */}
        {!isMobile && (
          <AnimatePresence initial={false}>
            {sidebarOpen && (
              <motion.div
                key="sidebar"
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 260, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                className="shrink-0 overflow-hidden border-r border-border/50"
              >
                <div className="w-[260px] h-full">{sidebar}</div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Mobile drawer */}
        {isMobile && (
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetContent side="left" className="w-[280px] p-0">
              {sidebar}
            </SheetContent>
          </Sheet>
        )}

        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
              >
                {sidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
              </button>
              <span className="text-sm font-medium truncate">
                {activeConvo?.title || "Premium AI"}
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <AIChatPanel
            messages={[...messages, ...localMessages]}
            streamingText={streamingText}
            streaming={streaming}
            submitting={submitting}
            emptyTitle="Premium AI"
          />

          <AIChatComposer disabled={streaming || submitting} onSend={handleSend} />
        </div>
      </div>
    </div>
  );
};

export default AIChatWindow;