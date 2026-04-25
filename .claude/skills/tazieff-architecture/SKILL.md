---
name: tazieff-architecture
description: Architecture rules and invariants for Tazieff EPS project. Apply these rules to ANY code modification involving database schema, RLS policies, authentication, multi-tenant data, premium feature gating, content editing, payments, offline support, internationalization, or PWA features. Read this skill BEFORE writing any code that touches Supabase, teacher annotations, student data, organizations, licenses, or feature visibility.
---

# Tazieff EPS - Architecture Skill

This skill encodes the systematic rules from the architectural reference document. Apply them to every implementation. When in doubt, refer to the full document in project knowledge.

## Three Sacred Layers (NEVER violate)

The entire data model rests on three layers:

1. **Official content (Layer 1)**: 80 exercises, 19 methods, BAC pages. Owned by Laurent. Source of truth: MDX files in Git. Modified ONLY via Git commits, NEVER via UI.
2. **Teacher annotations (Layer 2)**: overlays created by teachers on top of official content. Owned by teachers. Stored in Supabase with organization_id.
3. **Student notes (Layer 3)**: personal training notebook entries. Owned by students. Strictly private.

Hierarchy: Layer 1 is sacred, Layer 2 is sacred, Layer 3 is sacred. Each layer respects the boundaries of the others.

## Invariants - Apply systematically

1. Every new table with user data MUST include : organization_id (when relevant), created_at, updated_at, deleted_at (soft delete pattern).
2. Every new table MUST enable RLS : alter table X enable row level security.
3. Every RLS policy MUST wrap auth.uid() in (select auth.uid()) - 100x performance gain via Postgres InitPlan.
4. Every RLS policy MUST specify TO authenticated.
5. Every column referenced in an RLS policy MUST have an index.
6. Every sensitive write (annotations, profiles, licenses, memberships) MUST log to audit_log via trigger.
7. Every premium feature MUST be gated server-side (RLS or Edge Function), NEVER only client-side.
8. Every modification of official catalog MUST go through Git (MDX files), NEVER through a UI.
9. Every webhook from Lemon Squeezy or Stripe MUST verify signature before processing.
10. Every new PWA feature MUST work offline (at minimum read-only).
11. Every user-facing text MUST support FR/EN/ES via the existing i18n system.
12. Every DELETE MUST be a soft delete (set deleted_at), except explicit RGPD purge.

## Standard Patterns

### Adding a premium feature
- Add check on profiles.plan column (values: free, teacher_free, premium, school, alumni)
- Server-side gating via RLS policy or Edge Function
- UI shows contextual counter or paywall, never surprise blocking
- For quota-based features, use quotas_usage table with monthly period_start

### Adding a sharing scope
- Add value to visibility_scope ENUM (currently: private, class, school, public)
- Add corresponding RLS policy
- UI offers scope selection in annotation creation

### Versioned entity
- Add version int column
- No destructive UPDATE - INSERT a new version row instead
- Use checksum for integrity

### Multi-tenant query
- Filter by organization_id matching user's memberships
- Use helper function user_org_ids() returning setof uuid, with security definer
- Index on (organization_id, ...)

### Offline-first feature
- Local writes go to Dexie (IndexedDB) first with _dirty flag
- Add to outbox queue
- Replay on online event via Service Worker Background Sync
- Conflict resolution: LWW with server timestamp

## Anti-patterns - REFUSE these

- Schema-per-tenant in Supabase (use single schema with RLS)
- Editing MDX official content via web UI (Git only, except future Keystatic adoption validated by Laurent)
- Nx for monorepo (use Turborepo + pnpm workspaces only, when monorepo time comes)
- ElectricSQL or Zero for offline sync (incompatible - use Dexie + outbox v1, PowerSync v2 if needed)
- Contentlayer (abandoned - use Content Collections or Velite)
- CRDT or Yjs without proven real-time collaborative need
- Supabase Team plan (599 USD per month) without explicit justification
- Forgetting to index columns used in RLS policies
- Buy buttons inside TWA Play Store pointing to external payment (use Reader App pattern instead)
- Medical claims in app or store description (cure, treat, diagnose, heal)
- Targeting under 13 audience on Play Store (Families Policy too heavy)
- Annotations without organization_id
- RLS policy without TO authenticated
- Direct physical DELETE without prior soft delete

## Critical Decisions Locked In (do not re-explore)

- Annotation scope v1: private + class only (school in v2, public in v3)
- Student visibility: automatic via class enrollment
- Catalog edit channel: Git-based (MDX + Vercel preview)
- Teacher-to-teacher marketplace: NOT in next 3 years
- Monorepo: when 2nd app starts (Turborepo)
- TWA Google Play: year 2
- VPS migration: NOT until Supabase bill exceeds 100 EUR per month or sovereignty contract requires
- iOS app: year 3 if traction
- GAR SSO: start process year 2 (6-12 months admin process)
- Auth SAML: custom proxy with passport-saml (not Supabase Team plan)
- Payment stack: Lemon Squeezy for B2C, Stripe Invoicing for B2B (Chorus Pro compatible)
- Sync engine v1: Dexie + outbox pattern (PowerSync only if multi-device bidirectional sync needed)

## Pre-merge Checklist

Before any commit or merge, verify:

- New tables have RLS enabled
- Policies wrap auth.uid() in (select ...) and specify TO authenticated
- Critical columns are indexed
- Code compiles with next build using webpack flag (Serwist requirement)
- Texts are translated FR/EN/ES or use i18n keys
- New offline features work without wifi
- Webhooks verify signature
- Vitest covers RLS policies with different authenticated clients
- Changelog mentions RGPD impact if applicable
- New endpoints have JSDoc comments

## Workflow Rules (Tazieff specific)

- Branch redesign is wired to design.muscu-eps.fr for Laurent visual validation
- Branch main is production on muscu-eps.fr
- All new development on redesign first
- Merge to main ONLY after Laurent visual validation
- Never push directly to main without explicit instruction
- Always run npm run build before commit
- Always commit and push systematically after each modification
- Phase 0 audit (grep + show context) before any modification
- Atomic commits with conventional commit messages

## When to Read Full Reference Document

This skill covers the WHAT and the rules. For the WHY and the strategic context (personas, business model, legal framework, sectoral variations roadmap, full database schema, complete RLS examples), read the full document Tazieff_EPS_Architectural_Reference in project knowledge.

Read the full document when:
- Designing a feature touching multiple layers
- Making a strategic decision impacting roadmap
- Encountering a scenario not covered by this skill
- Onboarding to a new sectoral variation (general public, coach, kine, club, corporate)
