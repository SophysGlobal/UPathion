import { useEffect, useRef, useState } from "react";
import { Mic, Send, Paperclip, X, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVoiceRecorder } from "@/hooks/useVoiceRecorder";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export type PendingAttachment = {
  localId: string;
  file: File;
  previewUrl: string;
  storagePath?: string;
  uploading: boolean;
  error?: string;
};

interface Props {
  disabled: boolean;
  onSend: (text: string, attachments: PendingAttachment[]) => Promise<void> | void;
}

const MAX_ATTACHMENTS = 4;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED = ["image/png", "image/jpeg", "image/jpg", "image/webp"];

const AIChatComposer = ({ disabled, onSend }: Props) => {
  const { user } = useAuth();
  const [text, setText] = useState("");
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { state: micState, error: micError, start, stop, cancel, reset } = useVoiceRecorder((transcript) => {
    setText((prev) => (prev ? `${prev} ${transcript}` : transcript));
    setTimeout(() => textareaRef.current?.focus(), 0);
  });

  useEffect(() => {
    if (micError) toast.error(micError);
  }, [micError]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [text]);

  const handleFiles = async (files: FileList | null) => {
    if (!files || !user) return;
    const list = Array.from(files);
    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) return toast.error(`Max ${MAX_ATTACHMENTS} images per message`);
    for (const file of list.slice(0, room)) {
      if (!ACCEPTED.includes(file.type.toLowerCase())) {
        toast.error(`${file.name}: unsupported format`);
        continue;
      }
      if (file.size > MAX_FILE_BYTES) {
        toast.error(`${file.name}: too large (max 10MB)`);
        continue;
      }
      const localId = crypto.randomUUID();
      const pending: PendingAttachment = {
        localId,
        file,
        previewUrl: URL.createObjectURL(file),
        uploading: true,
      };
      setAttachments((prev) => [...prev, pending]);
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}-${localId}.${ext}`;
      const { error } = await supabase.storage.from("ai-chat-uploads").upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      setAttachments((prev) =>
        prev.map((p) =>
          p.localId === localId
            ? { ...p, uploading: false, storagePath: error ? undefined : path, error: error?.message }
            : p,
        ),
      );
      if (error) toast.error(`Upload failed: ${error.message}`);
    }
  };

  const removeAttachment = (localId: string) => {
    setAttachments((prev) => {
      const removed = prev.find((p) => p.localId === localId);
      if (removed?.storagePath) {
        void supabase.storage.from("ai-chat-uploads").remove([removed.storagePath]);
      }
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return prev.filter((p) => p.localId !== localId);
    });
  };

  const canSend = !disabled && (text.trim().length > 0 || attachments.some((a) => a.storagePath)) &&
    !attachments.some((a) => a.uploading);

  const send = async () => {
    if (!canSend) return;
    const t = text.trim();
    const ready = attachments.filter((a) => a.storagePath);
    setText("");
    setAttachments([]);
    await onSend(t, ready);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  const isRecording = micState === "recording";
  const isTranscribing = micState === "transcribing";

  return (
    <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl p-3">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((a) => (
            <div key={a.localId} className="relative w-16 h-16 rounded-lg overflow-hidden border border-border/60">
              <img src={a.previewUrl} alt="" className="w-full h-full object-cover" />
              {a.uploading && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                </div>
              )}
              <button
                type="button"
                onClick={() => removeAttachment(a.localId)}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center"
                aria-label="Remove image"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {isRecording && (
        <div className="flex items-center justify-between mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30">
          <span className="flex items-center gap-2 text-xs text-red-500">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Recording…
          </span>
          <div className="flex gap-2">
            <button onClick={cancel} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded">Cancel</button>
            <button onClick={() => void stop()} className="text-xs bg-red-500 text-white px-2 py-1 rounded flex items-center gap-1">
              <Square className="w-3 h-3" /> Stop
            </button>
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={disabled || attachments.length >= MAX_ATTACHMENTS}
          className="w-10 h-10 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-40 transition-colors"
          aria-label="Attach image"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED.join(",")}
          multiple
          className="hidden"
          onChange={(e) => { void handleFiles(e.target.files); e.target.value = ""; }}
        />

        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled || isRecording || isTranscribing}
          placeholder={isTranscribing ? "Transcribing…" : "Message the AI…"}
          className="flex-1 resize-none rounded-2xl bg-secondary/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 min-h-[40px] max-h-[160px]"
          rows={1}
        />

        {!isRecording && !text.trim() && attachments.length === 0 ? (
          <button
            type="button"
            onClick={() => { reset(); void start(); }}
            disabled={disabled || isTranscribing}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              "text-muted-foreground hover:text-foreground hover:bg-secondary/50 disabled:opacity-40",
            )}
            aria-label="Voice input"
          >
            {isTranscribing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Mic className="w-5 h-5" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSend}
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0",
              "bg-primary text-primary-foreground hover:opacity-90",
              "disabled:opacity-40 disabled:cursor-not-allowed",
            )}
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default AIChatComposer;