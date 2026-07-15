# Premium AI Assistant — Full Redesign

## What you get

A modern chat UI inside the existing Premium AI modal with:

- Persistent conversation history (survives refresh/sign-out)
- Collapsible left sidebar with search, rename, archive (archive chats should be available to view and recover in settings in a dedicated location), delete
- AI-generated conversation titles (created after first exchange, not regenerated)
- Voice input → server-side transcription → editable transcript in composer
- Image uploads (multi-image, previews, sent to ANY MODEL/Auto)
- Long-term memory: auto-extracted durable facts, retrieved by relevance per request, user-manageable
- Proper centering when sidebar collapses (no phantom spacing)
- Streaming responses, robust error/loading states, mobile drawer, safe areas

## Architecture

**Model:** `ANY MODEL/Auto` for chat, title generation, memory extraction (all server-side via Lovable AI Gateway, existing `LOVABLE_API_KEY`).
**Transcription:** `openai/gpt-4o-mini-transcribe` via Lovable AI STT.
**Storage:** Supabase Storage bucket `ai-chat-uploads` (private, signed URLs, per-user paths).
**DB:** Supabase Postgres with RLS scoped to `auth.uid()`.

## Database (single migration)

New tables (all with RLS `user_id = auth.uid()`, GRANTs to `authenticated` + `service_role`):

- `**ai_conversations**` — `id, user_id, title, summary, archived_at, deleted_at, last_message_at, created_at, updated_at`
- `**ai_messages**` — `id, conversation_id, user_id, role (user|assistant|system), content, error, created_at`
- `**ai_message_attachments**` — `id, message_id, user_id, storage_path, mime_type, size_bytes, width, height, created_at`
- `**ai_memories**` — `id, user_id, content, category, source_conversation_id, source_message_id, importance, active, created_at, updated_at`
- **Storage bucket** `ai-chat-uploads` (private) with RLS policies restricting objects to `auth.uid()::text` as first path segment.

Full-text search: GIN index on `to_tsvector(ai_messages.content)` + `ai_conversations.title` for the search feature.

## Edge functions

- `**premium-chat**` (rewrite): accepts `{ conversationId, messages, attachments }`, validates JWT + premium, retrieves top-K relevant memories via keyword match + recency, streams `openai/gpt-5.5` response, saves user + assistant messages, updates `last_message_at`.
- `**generate-chat-title**` (new): triggered after first assistant reply; short prompt → saves title.
- `**extract-chat-memory**` (new): triggered after each assistant reply (async, non-blocking); asks model to extract 0-3 durable facts as JSON, inserts into `ai_memories` (dedupe by cosine-ish keyword match).
- `**transcribe-audio**` (new): accepts multipart audio, forwards to `openai/gpt-4o-mini-transcribe`, returns text. JWT-gated.
- `web-search`(new): utilised when user's query requires/demands it

All functions (old): try Lovable AI first, fall back to OpenAI direct if gateway fails (matches your existing AI provider strategy memory).  
  
All functions (NEW): only utilize Lovable AI. No fallback to OpenAI anymore (new updated flow).

## Frontend

Replace `PremiumChatModal.tsx` with a new layout:

```text
┌─────────────────────────────────────────────┐
│ [☰]        Premium AI              [X]      │
├──────────────┬──────────────────────────────┤
│ + New chat   │  Conversation title          │
│ [search...]  ├──────────────────────────────┤
│              │                              │
│ Today        │  messages scroll...          │
│  • Chat A ●  │                              │
│  • Chat B    │                              │
│ Yesterday    │                              │
│  • Chat C    │                              │
│              ├──────────────────────────────┤
│              │ [📎] type... [🎤][→]          │
└──────────────┴──────────────────────────────┘
```

Components:

- `AIChatWindow.tsx` — outer flex, centers the block; sidebar collapse animates width with framer-motion; on mobile the sidebar is a `Sheet` drawer.
- `AIChatSidebar.tsx` — new-chat button, debounced search (300ms), grouped list (Today/Yesterday/7d/Older), per-item menu (rename/archive/delete via `DropdownMenu`).
- `AIChatPanel.tsx` — message list (auto-scroll only if near bottom, "jump to latest" button), streamed markdown rendering via `react-markdown`.
- `AIChatComposer.tsx` — textarea (auto-resize, Enter=send, Shift+Enter=newline), mic button (states: idle/recording/transcribing/error), image button (multi-select, previews with remove), send button.
- `useVoiceRecorder.ts` — Web Audio API → WAV encode → POST to `transcribe-audio` → drops text into composer. Stops stream on unmount / chat switch / cancel / errors.
- `useAIConversations.ts` — CRUD + realtime subscription on `ai_conversations` and `ai_messages` for current user.
- `useAIMemory.ts` — list/delete for a future memory settings page (data model ready even if UI is deferred).

Centering fix: sidebar uses `motion.div` with `width: collapsed ? 0 : 280` and `overflow: hidden`; the chat panel is `flex-1` inside a `justify-center` wrapper so it centers automatically when sidebar width goes to 0.

## What's explicitly out of scope for this pass

Documented as production gaps in a table at end of implementation:

- Full memory management settings page UI (data model + hook ready, minimal inline "what do you remember?" only)
- Chat export
- Long-conversation summarization (context truncation used instead)
- Admin-facing rate limits beyond existing premium gate
- HEIC conversion (rejected with clear error)
- Analytics / cost dashboards

## Order of implementation

1. Migration (tables + bucket + RLS + indexes)
2. Edge functions (`premium-chat` rewrite, `generate-chat-title`, `extract-chat-memory`, `transcribe-audio`)
3. Frontend hooks (`useAIConversations`, `useVoiceRecorder`)
4. New chat components + wire into existing `PremiumChatModal` entry point in `BottomNav`
5. Remove old `PremiumChatModal.tsx` contents, replace with new `AIChatWindow`
6. Manual test pass (create/reload/search/voice/image/memory recall/sidebar collapse centering)
7. Production-gap table in final response

Approve to proceed?