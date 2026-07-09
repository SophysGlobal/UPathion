# Comments, Alumni Onboarding & Student Verification

## 1. Explore/Feed Comments (nested + realtime)

New table `post_comments`:
- `id`, `post_id` (text — supports seed and future real posts), `parent_id` (nullable, self-FK for full nested threads), `user_id`, `body`, `like_count`, `created_at`, `updated_at`.
- Plus `comment_likes` (user_id + comment_id unique).
- RLS: anyone signed in can read; authors edit/delete their own; likes toggle per user.
- Enabled on `supabase_realtime` publication so new comments stream in.

New component `PostCommentsModal.tsx`:
- Sheet opened from the comment icon on Feed posts and Dashboard Feed posts.
- Renders a threaded tree (indented replies, "Reply" and "Like" per node, collapse deep chains).
- Composer at bottom; realtime subscription for inserts/updates/deletes.
- Wire into `src/pages/Feed.tsx` and `src/pages/Dashboard.tsx` (DashboardFeed posts).

## 2. Alumni / College Onboarding

Add optional fields to `profiles`: `degree`, `graduation_year` (int), `student_level` (`undergrad` | `grad` | `alumni`).

New onboarding step `src/pages/onboarding/Education.tsx`:
- Shown only when `schoolType === 'college'`, inserted between existing steps and `SchoolConfirm`.
- Fields: undergrad/grad toggle, degree (optional), graduation year (dropdown), major already exists.
- Skippable.

Updates:
- `OnboardingContext` — add the three fields.
- `SchoolConfirm` — save the fields; show them in the summary.
- `Profile.tsx` — new **Education** section rendering university + degree in major + class year, when present.
- `EditProfile.tsx` — editable fields.

## 3. Student Verification (email-only, institution-aware)

Schema:
- `schools.domains text[]` (nullable) — populated later; used first when matching.
- `profiles.verification_status` (`unverified` | `pending` | `verified` | `failed`), `verified_at`, `verified_email`, `verified_school_id`.
- New table `student_verification_codes`: `user_id`, `code_hash`, `email`, `school_id`, `expires_at`, `attempts`, `consumed_at`. RLS: user reads/writes only their own rows; service_role full.

Email allowlist: address is accepted if its domain is in the matched school's `domains`, or ends with `.edu`, `.ac.uk`, `.edu.au`, `.ac.in`, `.edu.cn`, `.ac.jp`, `.edu.sg` (curated list, easy to extend).

Edge functions (JWT-verified):
- `send-student-verification` — validates email + domain, generates 6-digit code, stores hashed, sends via existing Resend integration, sets `verification_status='pending'`.
- `confirm-student-verification` — checks code (rate-limited, max 5 attempts, 15-min expiry), on success marks `verified` and stamps `verified_at`, `verified_email`, `verified_school_id`.

UI:
- `src/pages/StudentVerification.tsx` — flow: enter school email → OTP → success. Handles all four statuses (unverified / pending / verified / failed) with resubmit.
- Route `/verify-student` added in `App.tsx`.
- Dashboard: prominent "Verify Your Student Status" gradient banner for college users with `verification_status !== 'verified'`; collapses to a small "Verified student" confirmation once verified.
- Verified badge (shield-check icon in accent color) rendered next to name on `Profile.tsx`, `UserProfileBottomSheet`, feed post authors, and comment authors.

## Out of scope for this pass
- Student ID photo upload (user chose email-only for v1).
- Backfilling `schools.domains` — column added; UI falls back to academic-TLD allowlist until it's populated.
- Making seed feed posts real DB rows (comments key off the existing post IDs; works for both seed and future real posts).

## Technical notes
- One migration covers all schema changes with GRANTs, RLS policies, and `ALTER PUBLICATION supabase_realtime ADD TABLE public.post_comments;`.
- Comments use Supabase realtime with proper `useEffect` cleanup (per project rule).
- Verification codes hashed with SHA-256 before storage; never returned to client.
- Edge functions validate JWT via `supabase.auth.getClaims` (matches existing `enrich-school-profile` pattern).
