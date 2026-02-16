# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm run dev          # Start dev server at localhost:3000 (keep running during development)
npm run build        # Production build (runs prebuild script first)
npm start            # Start production server (NOT for iteration)
```

**Critical**: Always keep `npm run dev` running during development sessions. After changes, verify with:
- `curl.exe -I --max-time 20 http://127.0.0.1:3000` → expect 200/3xx
- Smoke test routes: `/exos`, `/exos/<slug>`, `/seances/<slug>`
- Report: "✅ Local dev OK (127.0.0.1:3000) + routes testées"

If dev server hangs: stop Node on port 3000, delete `.next/`, restart `npm run dev`.

### Testing
```bash
npm test             # Run Vitest in watch mode
npm run test:ui      # Run Vitest with UI
npm run test:run     # Run all tests once (CI mode)
npm run type-check   # TypeScript type checking
npm run lint         # ESLint
```

### PDF Image Extraction
```bash
npm run pdf:extract:parametres  # Extract images from Paramètres PDF to webp
```

## Architecture

### Exercise Content — Three Sources with Merge Priority

Exercises come from three sources, merged with strict priority: **MDX > Live (Supabase) > v2 imports**

1. **MDX files** (`content/exercices/*.mdx`)
   - Gray-matter frontmatter + MDX content
   - Loaded via `getAllExercises()` from `src/lib/content/fs.ts`
   - Schema validated with Zod in `src/lib/content/schema.ts`

2. **Live exercises** (Supabase `live_exercises` table)
   - JSON-stored exercises created via teacher mode
   - Real-time sync with `useExercisesLiveSync` hook (Supabase realtime + 20s polling fallback)
   - Fetched via `fetchLiveExercises(locale)` from `src/lib/live/queries.ts`

3. **v2 imports** (`public/import/v2/`)
   - Legacy PDF-imported exercises
   - Indexed via `getV2ImportIndex()` from `src/lib/exercices/getV2ImportIndex.ts`
   - Media files in `public/images/exos/` (unified location)

**Merge logic**: `getExercisesIndex(locale)` in `src/lib/exercices/getExercisesIndex.ts` combines all three sources. Deduplication by slug ensures MDX exercises override live exercises, which override v2 imports.

**Static generation**: `generateStaticParams()` in `src/app/exercices/[slug]/page.tsx` uses `getExercisesIndex("fr")` to pre-generate all exercise pages at build time.

### Media System

All exercise media unified under `/images/exos/`:
- Hero images: `/images/exos/{slug}.webp`
- Thumbnails: `/images/exos/thumb-{slug}.webp`
- Aspect-ratio variants:
  - `thumb169-{slug}.webp` (16:9)
  - `thumb916-{slug}.webp` (9:16)
- Video support: `.webm` files (e.g., `S1-002.webm`)

Thumbnail resolution uses filesystem checks at build time (see `getV2ImportIndex.ts` lines 218-235).

### External Store Pattern (Favorites, Teacher Mode, View Mode)

Three external stores use `useSyncExternalStore` for React integration:

1. **`favoritesStore`** (`src/lib/stores/favoritesStore.ts`)
   - localStorage-backed set of favorite exercise slugs
   - Wrapped by `useFavorites()` hook (`src/hooks/useFavorites.ts`)
   - Returns: `{ favorites, isFavorite, toggle, set }`

2. **`window.__teacherMode`** (global)
   - In-memory teacher authentication state
   - Wrapped by `useTeacherMode()` hook (`src/hooks/useTeacherMode.ts`)
   - Returns: `{ unlocked, pin, unlock, lock }`
   - **Critical**: Snapshot must be cached with `Object.freeze()` to prevent infinite re-renders

3. **View mode store** (inline in `ExerciseListClient.tsx`)
   - localStorage for grid/list view preference
   - Uses custom subscribe/getSnapshot pattern

### Hooks

- **`useFavorites()`**: Access favoritesStore (read-only view, toggle, set)
- **`useTeacherMode()`**: Access teacher mode state (unlock, lock)
- **`useExercisesLiveSync(locale, initialData)`**: Supabase realtime sync for live exercises
  - Subscribes to `live_exercises` table via Supabase channel
  - Polls every 20s when realtime unavailable
  - Returns: `{ liveExercises, isRealtimeReady }`

### Filters

Pure filter functions in `src/lib/exercices/filters.ts`:
- **`mergeExercises(exercises, liveRows)`**: Merge MDX + live exercises
- **`filterVisibleExercises(merged, teacherUnlocked)`**: Hide drafts unless teacher unlocked
- **`filterExercises(visible, criteria)`**: Apply search query + level/equipment/tags/themes/favorites filters

All filters are tested in `src/lib/exercices/filters.test.ts` (46 tests).

### UI Components (Phase 3 Extraction)

Exercise list UI split into focused components:
- **`ExerciseFilters`** (`src/components/exercices/ExerciseFilters.tsx`): Multi-select menus, chips, search
- **`ExerciseGrid`** (`src/components/exercices/ExerciseGrid.tsx`): Grid/list view toggle, favorite button
- **`TeacherToolbar`** (`src/components/exercices/TeacherToolbar.tsx`): Exercise creation for teacher mode

Main client component: `ExerciseListClient` (`src/app/exercices/ExerciseListClient.tsx`) coordinates all UI.

### Testing

- **Framework**: Vitest 4.0.18 + jsdom
- **React testing**: @testing-library/react
- **Coverage**: 80 tests across filters, hooks
- **Mock strategy**: Supabase client fully mocked in hook tests (see `useExercisesLiveSync.test.ts`)

Config: `vitest.config.ts` with globals, jsdom, path alias `@` → `src`

## Critical Rules

### CMS-Ready (Non-Negotiable)

All content must remain editable via Git-based CMS (e.g., Keystatic) without refactoring.

**Invariants**:
1. Content in `content/**/*.mdx`, media in `public/media/**`
2. Frontmatter must be simple and backward-compatible (no breaking renames/deletions)
3. No hardcoded content in TypeScript/JSON (only derived indexes)
4. No database dependency for content (Supabase only for live exercises, separate layer)
5. App is read-only for MDX (editing via CMS only)
6. Indexes derived from `content/**` at build time
7. UI decoupled from content (MDX files remain renderable)

**CMS-Ready Gate** (every PR):
- Can a Git-based CMS edit this content without refactoring? ✅
- Is frontmatter schema backward-compatible? ✅
- Content in `content/**`, media in `public/media/**`? ✅

If any answer is NO → reject, propose backward-compatible alternative.

### Search Rules (Anti-iCloud)

**Never** run global searches (e.g., `rg "pattern" C:\Users\...`).

Always scope searches to repo:
```bash
rg "pattern" src docs README.md package.json  # ✅ Correct
rg "pattern" .                                 # ✅ Correct
rg "pattern" C:\Users\...                      # ❌ FORBIDDEN
```

Execute all commands from repo root.

## Key Files

- **Exercise index**: `src/lib/exercices/getExercisesIndex.ts` (merges 3 sources)
- **v2 imports**: `src/lib/exercices/getV2ImportIndex.ts` (legacy PDF imports)
- **Filters**: `src/lib/exercices/filters.ts` (pure functions)
- **Live sync hook**: `src/hooks/useExercisesLiveSync.ts` (Supabase realtime + polling)
- **Exercise detail page**: `src/app/exercices/[slug]/page.tsx` (uses `generateStaticParams`)
- **Exercise detail UI**: `src/app/exercices/[slug]/ExerciseLiveDetail.tsx` (4000+ lines, main detail component)
- **Content schema**: `src/lib/content/schema.ts` (Zod validation)

## Environment

- **Node**: >=20.9 <23 (Next.js 16 requirement)
- **npm**: >=10
- **Next.js**: 16.1.4 (App Router)
- **React**: 19.2.3
- **Supabase**: @supabase/supabase-js 2.93.1

## Deployment

- **Platform**: Vercel
- **Production URL**: https://tazieff-eps.vercel.app
- **Static generation**: All exercise routes pre-generated via `generateStaticParams()`
- **Revalidation**: `revalidatePath` + `revalidateTag` for on-demand ISR
- **Service Worker**: Serwist for PWA (disabled in dev)
