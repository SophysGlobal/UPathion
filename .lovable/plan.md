# Implementation Plan — Splash, Loading, Questionnaire, Theme & Messaging Polish

## Part A — Splash Animation Final Position & Flicker Fix

**File: `src/components/SplashScreen.tsx**`

- The current splash migrates the logo to `top: 16px` (`top-4`) while `PersistentLogoLayer` for the auth/onboarding state renders at `top-4` centered. This is correct in CSS, but the splash uses `translateY` from screen-center, while the persistent logo is anchored absolutely — measuring from the wrong reference frame causes the visible "jump."
- Refactor migration math:
  - Compute the splash content's actual centered-position bounding-box top via a `ref` after first render (using `getBoundingClientRect`), then animate translateY toward `(targetTop - currentTop)` where `targetTop = 24px` (slightly below edge, matches header padding).
  - Increase final position to `top-6` (24px) so it's not flush with the very top edge.
- Update `PersistentLogoLayer.tsx` to also use `top-6` for the centered (auth/onboarding) variant so handoff matches exactly.

**File: `src/components/AppEntryGate.tsx**`

- Mount `<PersistentLogoLayer />` immediately (always rendered), and use opacity transition keyed off `isReady` instead of conditional mount, so there's no remount-induced flicker at handoff. Splash overlay fades out as persistent logo fades in over the same 250ms window.

## Part B — Welcome Text Logic (New vs Returning)

**File: `src/pages/SignIn.tsx**`

- Read `localStorage` flag `upathion_has_signed_in_on_device` (already maintained in `useAppEntry`).
- Show heading `"Welcome back"` if flag is true, else `"Welcome"`.
- Subtitle stays consistent: `"Sign in to connect with your school community"`.

## Part C — Username Availability Check (Real-Time, Debounced)

**Files: `src/pages/onboarding/NameSetup.tsx`, new `src/hooks/useUsernameAvailability.ts**`

- New hook `useUsernameAvailability(username)`:
  - Uses existing `useDebouncedValue` (300ms) on username input.
  - Validates format first (length ≥ 3, regex `/^[a-zA-Z0-9_]+$/`).
  - Queries `public_profiles` view: `select('id').eq('username', debounced).maybeSingle()`.
  - Skips check for the user's own existing username.
  - Returns `{ status: 'idle' | 'checking' | 'available' | 'taken' | 'invalid_short' | 'invalid_chars', message }`.
- In `NameSetup.tsx`:
  - Render inline indicator below username input:
    - `checking` → small spinner + "Checking availability…"
    - `available` → green ✓ "Username is available"
    - `taken` → red "Username already taken"
    - `invalid_short` → "Username must be at least 3 characters"
    - `invalid_chars` → "Only letters, numbers, and underscores allowed"
  - Disable Continue button if `taken` or invalid.

## Part D — Loading Screen Centering Fix

**Files: `src/components/AuthGate.tsx`, `src/pages/Index.tsx**`

- Currently uses `fixed inset-0 flex items-center justify-center` which IS correctly centered, but the inner flex container has `text-center` plus mixed gap. Wrap spinner+text in a single `flex flex-col items-center gap-3` and remove redundant `text-center`. Verify spinner has fixed dimensions and no margin offset.

## Part E — Questionnaire Animation Coverage

**Files: All `src/pages/onboarding/*.tsx**`

- Audit each onboarding page; ensure every text block, card, and button group has `animate-fade-in`.
- Wrap each page's root `OnboardingLayout` children in a keyed `div` with `key={location.pathname}` to force fade-in on each step transition (no abrupt swap).
- Add a stagger-free synchronized fade-in (per memory: `animation-synchronization` — no delays).
- Targets confirmed lacking full coverage:
  - `NameConfirm.tsx`, `HowDidYouHear.tsx`, `SchoolConfirm.tsx`, `Extracurriculars.tsx`, `Interests.tsx` — add `animate-fade-in` to any unwrapped blocks.
- Verify timing remains 300ms ease-out (already in tailwind config).

## Part F — Theme Enhancement (Dark + Light)

**File: `src/index.css**`

- **Dark mode:** Replace flat `--background: 222 47% 6%` with a layered approach:
  - Add a subtle radial gradient overlay on `body` in dark mode (e.g., `radial-gradient(ellipse at top, hsl(222 47% 10%) 0%, hsl(222 47% 5%) 80%)`).
  - Lift `--card` slightly to `222 47% 10%` for better depth contrast.
  - Strengthen `--border` opacity for clearer surface boundaries.
  - Add subtle inner highlight to `.glass-card` via inset box-shadow.
- **Light mode:**
  - Change `--background` from `220 20% 97%` to `220 25% 98%` with a soft gradient overlay (warm tint at top).
  - Soften `--card` to off-white `0 0% 99%`.
  - Increase contrast for `--muted-foreground` for readability.
- Add `.surface-elevated` utility class with depth shadow + subtle gradient for both modes.

## Part G — Messaging System Improvements

### G1: Sorting (Pinned > Unread > Read)

**Files: `src/data/seedData.ts`, `src/pages/Messages.tsx`, `src/components/messages/ChatList.tsx**`

- Add `isPinned: boolean` to `SeedConversation` interface and seed entries (default `false`, mark 1-2 as pinned for demo).
- In `Messages.tsx`, sort `filteredConversations`:
  ```ts
  .sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    const aUnread = a.unreadCount > 0, bUnread = b.unreadCount > 0;
    if (aUnread !== bUnread) return aUnread ? -1 : 1;
    return 0;
  })
  ```
- Show a small pin icon on pinned chat rows in `ChatList.tsx`.

### G2: Right-Click Context Menu

**Files: `src/components/messages/ChatList.tsx`, `src/pages/Messages.tsx**`

- Use existing shadcn `ContextMenu` from `@/components/ui/context-menu`.
- Wrap each chat row with `<ContextMenu><ContextMenuTrigger>…</ContextMenuTrigger><ContextMenuContent>…</ContextMenuContent></ContextMenu>`.
- Menu items:
  - Pin / Unpin (toggles `isPinned`)
  - Mute / Unmute (toggles `isMuted`)
  - Mark as Read / Unread (toggles `unreadCount`)
  - Delete (removes from local state) — separator above
- State management: lift conversation list into `useState` in `Messages.tsx` (initialized from seed), and pass handlers down to `ChatList`. Real backend wiring stays in `useMessages.ts` for non-seed mode.

## Files to Modify

- `src/components/SplashScreen.tsx`
- `src/components/PersistentLogoLayer.tsx`
- `src/components/AppEntryGate.tsx`
- `src/pages/SignIn.tsx`
- `src/pages/onboarding/NameSetup.tsx`
- `src/hooks/useUsernameAvailability.ts` (new)
- `src/components/AuthGate.tsx`
- `src/pages/Index.tsx`
- `src/pages/onboarding/NameConfirm.tsx`
- `src/pages/onboarding/HowDidYouHear.tsx`
- `src/pages/onboarding/SchoolConfirm.tsx`
- `src/pages/onboarding/Extracurriculars.tsx`
- `src/pages/onboarding/Interests.tsx`
- `src/index.css`
- `src/data/seedData.ts`
- `src/pages/Messages.tsx`
- `src/components/messages/ChatList.tsx`  
  


**Part H — Implementation Safeguards & Clarifications**

H1: Splash Animation Measurement Timing

Ensure the `getBoundingClientRect` measurement for the logo's final target position happens after all fonts and any async resources have settled — not just after component mount. Both the splash logo and persistent logo measurements must occur in the same paint frame to guarantee the handoff math is accurate. If they're measured across different frames, a subtle jump can still occur even with correct CSS.

H2: Questionnaire Key-Based Remount Safety

When using `key={location.pathname}` to trigger fade-in on step transitions, confirm that none of the affected onboarding pages perform data fetching or Supabase queries on mount. If any do, the remount will re-trigger those calls on every step transition, which could cause flicker or redundant network requests. Pages that fetch on mount should instead receive data via props or a parent-level cache.

H3: Pinned/Muted State Persistence Scope

The plan scopes `isPinned` and `isMuted` to local `useState` initialized from seed data. This is acceptable for the current demo phase, but must be explicitly noted as non-persistent — state resets on page refresh. When real backend wiring occurs in `useMessages.ts`, these fields must be added to the conversations table schema and synced via Supabase. Do not design the local state shape in a way that makes this migration harder.

H4: Theme Gradient Specificity

Part F describes gradients and depth improvements at a high level without pinning exact values. Before finalizing, verify both dark and light gradient overlays against the app's existing brand colors rather than using generic defaults. The goal is cohesion with existing UI, not a generic "premium" aesthetic that drifts from the established palette.

## Acceptance Criteria

- Logo lands at `top-6` smoothly with no jump or flicker (single source of truth for handoff position).
- "Welcome" / "Welcome back" toggles based on device sign-in history.
- Username field shows real-time available/taken/invalid feedback.
- Loading spinner + text are perfectly centered.
- Every questionnaire step animates in cleanly.
- Dark and light themes feel layered and premium.
- Pinned chats float to top, then unread, then read.
- Right-click on chat opens menu with Pin/Mute/Read-Unread/Delete.

&nbsp;