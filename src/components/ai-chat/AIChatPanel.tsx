import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AIMessageRow } from "@/hooks/useAIConversations";

interface Props {
  messages: AIMessageRow[];
  streamingText: string;
  streaming: boolean;
  submitting: boolean;
  emptyTitle?: string;
}

const AIChatPanel = ({ messages, streamingText, streaming, submitting, emptyTitle }: Props) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (autoScroll) el.scrollTop = el.scrollHeight;
  }, [messages, streamingText, autoScroll]);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(nearBottom);
  };

  const isEmpty = messages.length === 0 && !streaming && !submitting;

  return (
    <div className="flex-1 relative overflow-hidden">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="absolute inset-0 overflow-y-auto px-4 py-4"
      >
        {isEmpty && (
          <div className="h-full flex flex-col items-center justify-center text-center px-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <p className="text-base font-medium text-foreground mb-1">
              {emptyTitle ?? "Premium AI Chat"}
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Ask about schools, majors, applications, or anything else. I'll remember useful details for later.
            </p>
          </div>
        )}

        <div className="space-y-4 max-w-2xl mx-auto">
          {messages.map((m) => (
            <MessageBubble key={m.id} message={m} />
          ))}
          {streaming && streamingText && (
            <div className="flex justify-start">
              <div className="max-w-[85%] text-sm text-foreground leading-relaxed">
                <MarkdownContent content={streamingText} />
              </div>
            </div>
          )}
          {submitting && !streamingText && (
            <div className="flex justify-start">
              <div className="rounded-2xl px-4 py-2 bg-secondary/40">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:100ms]" />
                  <span className="w-1.5 h-1.5 bg-foreground/40 rounded-full animate-bounce [animation-delay:200ms]" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!autoScroll && (
        <button
          onClick={() => {
            const el = scrollRef.current;
            if (el) el.scrollTop = el.scrollHeight;
            setAutoScroll(true);
          }}
          className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="Jump to latest"
        >
          <ArrowDown className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const MessageBubble = ({ message }: { message: AIMessageRow }) => {
  const isUser = message.role === "user";
  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] flex flex-col gap-2", isUser ? "items-end" : "items-start")}>
        {message.attachments && message.attachments.length > 0 && (
          <div className={cn("flex flex-wrap gap-1.5", isUser ? "justify-end" : "justify-start")}>
            {message.attachments.map((a) => (
              a.signedUrl && (
                <a key={a.id} href={a.signedUrl} target="_blank" rel="noreferrer">
                  <img
                    src={a.signedUrl}
                    alt=""
                    className="max-w-[200px] max-h-[200px] rounded-xl object-cover border border-border/60"
                  />
                </a>
              )
            ))}
          </div>
        )}
        {message.content && (
          isUser ? (
            <div className="rounded-2xl px-4 py-2 bg-primary text-primary-foreground">
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
          ) : (
            <div className="text-sm text-foreground leading-relaxed">
              <MarkdownContent content={message.content} />
            </div>
          )
        )}
        {message.error && (
          <p className="text-xs text-destructive">{message.error}</p>
        )}
      </div>
    </div>
  );
};

const MarkdownContent = ({ content }: { content: string }) => (
  <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-headings:mt-3 prose-headings:mb-1">
    <ReactMarkdown>{content}</ReactMarkdown>
  </div>
);

export default AIChatPanel;