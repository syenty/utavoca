# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Utavoca is a Japanese vocabulary learning service that uses Japanese song lyrics. It leverages LLM to extract vocabulary from lyrics and provides vocabulary testing features.

**Key Technologies:**
- Next.js 15 (App Router) with TypeScript
- Supabase (PostgreSQL with Row Level Security)
- Tailwind CSS

## Common Commands

### Development
```bash
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Supabase Local Development
```bash
npx supabase start   # Start local Supabase instance (ports: API 54321, DB 54322, Studio 54323)
npx supabase stop    # Stop local Supabase instance
npx supabase status  # Check Supabase status
npx supabase db reset # Reset local database and apply migrations
```

### Database Migrations
- Migration files are in `supabase/migrations/`
- Apply to cloud: Copy SQL to Supabase Dashboard > SQL Editor
- Seed data: Use `supabase/seed-artists.sql` (not auto-loaded)

## Architecture

### Database Schema

**Content Tables (Admin-managed, read-only for users):**
- `artists` - Artist information with multi-language support:
  - `name` (TEXT) - Japanese name (primary)
  - `name_en` (TEXT) - English/romanized name
  - `name_ko` (TEXT) - Korean name for search
  - Indexes on all three fields for efficient multi-language search
- `albums` - Album information (optional, can be added later)
- `songs` - Song information with:
  - `summary` (TEXT) - LLM-generated song summary
  - `vocabs` (JSONB) - Array of vocabulary objects: `[{name, meaning, pronunciation}]`
  - GIN index on `vocabs` for efficient JSONB queries

**User Data Tables (Per-user CRUD via RLS):**
- `favorites` - Polymorphic favorites (artist or song) using `favoritable_type` and `favoritable_id`
- `wrong_vocabs` - User's incorrect vocabulary records with `wrong_count` for spaced repetition

**Database Functions:**
- `get_favorite_vocabs(p_user_id)` - Retrieve all vocabs from favorited artists/songs
- `get_wrong_vocabs_for_review(p_user_id, p_limit)` - Get wrong vocabs sorted by `wrong_count` DESC

### Supabase Client Patterns

**Client Components:**
```tsx
'use client'
import { createClient } from '@/lib/supabase'

const supabase = createClient()
```

**Server Components/Actions:**
```tsx
import { createClient } from '@/lib/supabase-server'

const supabase = await createClient()  // Note: await is required
```

**Middleware:** Uses `@supabase/ssr` with `createServerClient` for session management

### Server Actions Pattern

All data operations are in `app/actions/`:
- `auth.ts` - Authentication (signOut only, no signup)
- `favorites.ts` - Favorite management (add, remove, list, get vocabs)
- `wrong-vocabs.ts` - Wrong vocab tracking (record, retrieve, delete)
- `search.ts` - Search and retrieval (artists, songs, vocabs)

Server Actions follow this pattern:
```tsx
'use server'
import { createClient } from '@/lib/supabase-server'

export async function actionName() {
  const supabase = await createClient()
  // ... perform operation
  return { data, error }
}
```

### Type Safety

- Database types are defined in `types/database.ts`
- Generated from Supabase schema with helper types:
  - `Artist`, `Album`, `Song`, `Favorite`, `WrongVocab`
  - `Vocab` interface for JSONB structure
  - `Database` type includes table schemas and function signatures

### Authentication Flow

- Email/password only (no signup - users added manually via Supabase Dashboard)
- Session managed by middleware (auto-refresh)
- Auth callback route at `app/auth/callback/route.ts`
- Protected routes can be added in `middleware.ts` (currently commented out)

## Important Patterns

### JSONB Vocabulary Structure

Each song's `vocabs` field stores an array of vocabulary objects:
```typescript
interface Vocab {
  name: string           // Japanese word (愛)
  meaning: string        // Korean translation (사랑)
  pronunciation: string  // Romanization (ai)
}
```

Expandable in the future with fields like: `partOfSpeech`, `difficulty`, `examples`

### Polymorphic Favorites

The `favorites` table uses a polymorphic pattern:
- `favoritable_type`: 'artist' | 'song' (extensible to 'album')
- `favoritable_id`: UUID reference to the entity
- Unique constraint: `(user_id, favoritable_type, favoritable_id)`

### Wrong Vocab Tracking

- Only wrong answers are stored (not correct ones) for data minimization
- UPSERT pattern: increment `wrong_count` if exists, insert if new
- Used for spaced repetition and review features

## Development Guidelines

### Database Queries

- Use TypeScript types from `types/database.ts`
- Leverage JSONB operators for vocab queries:
  ```typescript
  // Find songs containing a specific word
  .select().contains('vocabs', [{name: '愛'}])
  ```
- Always apply RLS - user data operations auto-filter by `auth.uid()`

### Security

- RLS is enabled on all tables
- Content tables (artists, albums, songs): SELECT only for everyone
- User tables (favorites, wrong_vocabs): Full CRUD only for own data
- Never expose raw database credentials in client-side code

### Future LLM Integration

When implementing lyrics processing:
1. Upload interface should be admin-only (add role check)
2. Process lyrics through LLM to generate `summary` and `vocabs`
3. Consider adding `processing_status` field to `songs` table
4. Implement retry logic for LLM API failures
5. Store lyrics text temporarily only - do NOT persist in DB (copyright)

### Code Organization

- **Server-only code**: `app/actions/`, `lib/supabase-server.ts`, middleware
- **Client-capable code**: `lib/supabase.ts`, client components
- **Shared types**: `types/database.ts`
- **Database**: `supabase/migrations/` for schema changes

### Path Aliases

- `@/*` maps to project root (configured in `tsconfig.json`)
- Use absolute imports: `@/lib/supabase` instead of relative paths

## Environment Variables

Required in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

Note: `.env.local` is gitignored - never commit credentials

## Project Status

This is an MVP in active development. See `SETUP.md` for detailed roadmap including:
- Phase 1: User UI implementation (search, favorites, vocabulary tests)
- Phase 2: LLM integration for lyrics processing
- Phase 3: Advanced features (spaced repetition, difficulty levels, TTS)
