# Plan: Comment Counter Fix + Education Flow Consolidation

## Part A — Comment Counter Integrity

**Root cause:** `src/pages/Feed.tsx` and `DashboardFeed` render `post.comments` from `seedFeedPosts` (fake seeded numbers), while `PostCommentsModal` reads real rows from `post_comments`. The two sources never agree.

**Fix approach (single source of truth = `post_comments` table):**
1. Add a new hook `useCommentCounts(postIds: string[])` that:
   - Runs one grouped query on `post_comments` (`select post_id` filtered by `post_id in (...)`) and reduces to a `{ postId: count }` map.
   - Subscribes to the `post_comments` realtime channel; on any insert/delete for a known `postId`, updates the map.
   - Returns `{ counts, getCount(postId) }` with `0` as the default (never a random fallback).
2. `Feed.tsx` and `Dashboard.tsx` feed cards read `getCount(feedId)` instead of `post.comments`.
3. `PostCommentsModal` already exposes `onCountChange`; wire it so the parent's counts map is updated immediately on add/delete without waiting for the realtime round-trip.
4. Remove the seeded `comments: <number>` value from being rendered (keep the field on the type for other uses if needed, but always show DB count).
5. Empty state = `0`. Loading (before first fetch resolves) = show `0` too, not a placeholder number.

**Files touched:** new `src/hooks/useCommentCounts.ts`; edited `src/pages/Feed.tsx`, `src/pages/Dashboard.tsx` (feed card), `src/components/PostCommentsModal.tsx` (ensure `onCountChange` fires reliably).

## Part B — Consolidated Education Flow

### New data model (migration on `profiles`)

Add columns:
- `education_status text` — `high_school` | `college` | `graduate`
- `undergraduate_degree_type text` — `bachelors` | `associates` | `both` (college only)
- `college_major text[]` — majors tied to bachelor's / general college
- `associate_degree_major text[]` — majors for associate track (college OR high-school-pursuing-associate)
- `high_school_pursuing_associates boolean`
- `intended_major text[]` — high school future study interest (migrated from existing `interests`)

Backfill:
- Where `school_type = 'high_school'` → `education_status = 'high_school'`, `intended_major = interests`.
- Where `school_type = 'college'` and `student_level = 'undergrad'` (or empty) → `education_status = 'college'`, `undergraduate_degree_type = 'bachelors'`, `college_major = string_to_array(major, ',')`.
- Where `student_level = 'grad'` → `education_status = 'graduate'`.
- Never overwrite with NULL; use `COALESCE`.

### New UI: single consolidated step

Replace the current split (`Education.tsx` + separate major/interests logic on `SchoolConfirm`) with **one** progressive-disclosure page: `src/pages/onboarding/EducationStatus.tsx`.

Flow inside the page:

```text
[Status] High school | College | Graduate

  if College:
    [Degree type] Bachelor's | Associate | Both
      if Bachelor's or Both → <MajorMultiSelect> for college_major
      if Associate  or Both → <MajorMultiSelect> for associate_degree_major

  if High school:
    [Pursuing an associate degree?] Yes | No
      if Yes → <MajorMultiSelect> for associate_degree_major
    (intended_major stays on the existing dedicated HS "what do you want to study" step)

  if Graduate:
    keep existing degree + graduation_year fields; hide undergrad selectors
```

### OnboardingContext + route wiring
- Extend `OnboardingContext` state with the 6 new fields; hydrate from profile; persist on `SchoolConfirm` save.
- Replace the route `/onboarding/education` with the new consolidated step; keep the same URL so `AuthGate`'s allow-list keeps working.
- Remove the now-dead separate "your education" details step from the flow ordering.

### Confirmation screen (`EditFieldModal` + `SchoolConfirm` summary)
Rewrite the education-related rows to render conditionally:
- College → `Education: College` · `Degree type: …` · `Major(s): …` (+ Associate major if `both`)
- HS + associates=Yes → `Education: High School` · `Pursuing associate: Yes` · `Associate major: …` · `Intended major: …`
- HS + associates=No → `Education: High School` · `Pursuing associate: No` · `Intended major: …`
- Graduate → `Education: Graduate` · `Degree: …` · `Grad year: …`

All rows route to `/onboarding/education` (the consolidated page). Intended-major row still routes to `/onboarding/interests` for HS users.

### Profile page (`src/pages/Profile.tsx`)
Update the Education section to read the new fields with the same conditional rules above so college users never show "intended major" and HS users' associate major isn't mislabeled as college major.

## Testing checklist
- Post with 0 / 1 / N comments → card count == modal count; add/delete updates both.
- Onboarding: College→Bachelor's, College→Associate, College→Both, HS→Yes, HS→No, Graduate.
- Edit-field modal routes never land on removed pages.
- Existing users load without data loss (backfill migration verified with a `SELECT` after apply).
- School search + major search still function unchanged.

## Out of scope
- No changes to Auth, Stripe, messaging, or the school-search engine.
- No changes to the existing `MajorMultiSelect` component internals — only new call sites.

Awaiting approval before running the profile migration and touching the onboarding routes.
