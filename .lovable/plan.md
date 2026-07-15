# Scope & Execution Plan

Your message combines **three huge workstreams**. Bundling them into one turn would produce shallow work and likely regressions. Here is how I propose to sequence them. Approve, or tell me to reorder / trim.

---

## Workstream 1 — Trust & Safety Phases 2 & 3

**Phase 2 — Moderator Dashboard**
- `/admin/moderation` route, admin-only via `has_role`
- Reports queue: filter by status (open / reviewed / actioned / dismissed), reason, date
- Actions: dismiss, warn user, temp-suspend, permanent ban, escalate
- `moderation_actions` audit table (immutable, admin-only read)
- `user_suspensions` table + gate that blocks posting/messaging when active
- Appeals form on suspension screen

**Phase 3 — Automated Moderation**
- Edge function `moderate-content` calling OpenAI `omni-moderation-latest` (text + image)
- Hook into post create, comment create, message send, profile bio, group description
- Configurable thresholds; auto-flag → queue, hard-block only on `sexual/minors` or `violence/graphic` above threshold
- Image blur-gate UI for flagged media with "View anyway" confirm
- Minor protections: HS users default to private profile, standard discovery/DMs (per your earlier choice)

---

## Workstream 2 — Creation Flows

**Groups**
- `groups`, `group_members` tables (with RLS + GRANTs)
- `+` button in Explore → Groups header
- `/groups/new` page: name, description, category, school association (prefilled), visibility (public / school-only / invite-only), acronym fallback avatar
- Creator auto-added as owner in `group_members`
- Wire into existing `GroupDetail` page

**Feed Posts**
- Detect existing `posts` table or create it (with `like_count`, `comment_count` synced by trigger like `post_comments`)
- Floating `+` FAB on Feed
- Composer modal: content, visibility, category, optional title
- Runs through Phase 3 moderation before insert
- Optimistic insert into feed list

---

## Workstream 3 — Full Assurance Audit

I will drive Playwright against localhost across the 12 areas you listed (auth, onboarding, subscription, dashboard, explore, feed, profile, messages, schools, AI, responsiveness, performance), capture screenshots + console/network signals, then deliver the **Production Readiness Table** (Area / Issue / Severity / Status / Fix / Blocker).

This step only makes sense **after** Workstreams 1 & 2 land, otherwise the audit re-reports things I'm about to build.

---

## Proposed order of execution

1. **Turn A** — T&S Phase 2 (migration + dashboard + suspension gate)
2. **Turn B** — T&S Phase 3 (moderation edge function + wiring + minor defaults)
3. **Turn C** — Groups creation (migration + button + page + detail wiring)
4. **Turn D** — Feed post creation (migration if needed + FAB + composer + moderation hook)
5. **Turn E** — Playwright assurance sweep + Production Readiness Table

Each turn ends with a build/type check and a short verification note. I will not claim "done" on any phase without evidence.

---

## What I need from you

1. **Approve the order above**, or reorder (e.g. "creation flows first, T&S later").
2. **Suspension enforcement scope for Phase 2** — should an active suspension block: posting only, or posting + commenting + messaging + group creation? Default I'll use: all four.
3. **Auto-moderation strictness for Phase 3** — hard-block threshold. Default: OpenAI category score ≥ 0.85 for `sexual/minors` and `violence/graphic` blocks immediately; anything else ≥ 0.5 flags for review but publishes.
4. **Group visibility default** — public, school-only, or invite-only? Default: school-only.

Reply with approvals / overrides and I'll start Turn A.
