# Premium Pro Upgrade — Workers Conference (2026-08-25)

## Summary
Modular premium decomposition (Approach B) to fix "bad gateway" on refresh/logout, mobile jank, and deliver Stripe/Linear-grade UI. Decomposes 1705-line monolith, introduces elevation design system, lazy charts, bottom nav, and per-section error boundaries. Preserves DCLM indigo brand and RBAC.

## Goals
- Stability: zero crash on refresh/logout; healthcheck decoupled from DB.
- Performance: -60% initial JS, <1.5s FCP on mid-tier phone.
- Premium Pro: elevation, typography, micro-interactions, branded tooltips, shimmer.
- Mobile: thumb-reachable nav, 44px targets, no GPU thrash.

## Non-Goals
- Full RSC rewrite, PWA offline (deferred).
- Palette change beyond refined indigo/violet/emerald.

## Architecture
- **Before:** `src/app/dashboard/page.tsx` (client, 1705 LOC) imports all sections + recharts eagerly. Single `fetch("/api/auth/me")` blocks shell. Middleware imports `verifyToken` statically.
- **After:**
  ```
  src/app/dashboard/
    layout.tsx          // shell: sidebar/header/bottom-nav, theme, ErrorBoundary
    page.tsx            // 200 LOC: section switch + dynamic imports
    _components/
      OverviewSection.tsx
      WorkerRegistrationSection.tsx
      VerificationSection.tsx
      ApprovalSection.tsx
      AttendanceSection.tsx
      BroadcastSection.tsx
      UserManagementSection.tsx
      SessionsSection.tsx
      AuditSection.tsx
      Shared.tsx        // KPIBlock, PBICard, InsightCard, Shimmers
    _hooks/useAuth.ts   // cached /me with retry
  ```
- Dynamic: `const OverviewSection = dynamic(() => import("./_components/OverviewSection"), { ssr: false, loading: () => <OverviewShimmer/> })`
- Recharts: `const RechartsLazy = dynamic(() => import("@/components/charts/LazyRecharts"), { ssr: false })`

## Components & Data Flow
- Shell `DashboardInner` keeps `section` state, provides `queryClient`. Each section owns its `useQuery` with `staleTime:30s, gcTime:300s, refetchOnWindowFocus:false, retry:2`.
- Auth: `useAuth` wraps `fetch("/api/auth/me")` with 5s timeout + 1 retry → fallback to `/login`. No blocking Suspense.
- Charts: `ResponsiveContainer` + branded `Tooltip` (`glass` + `shadow-elevation-3`) + gradients per design token.
- Images: replace `<img src="/dclmlogo.JPG">` with `next/image` (`priority` on login, `sizes` elsewhere). Keep `public/dclmlogo.JPG` 38KB, add `fetchPriority high` for login hero.

## Design System (Premium)
- `globals.css` tokens:
  ```css
  :root {
    --elevation-1: 0 1px 2px rgba(0,0,0,.06), 0 4px 12px rgba(0,0,0,.04);
    --elevation-2: 0 4px 16px rgba(0,0,0,.08), 0 12px 32px rgba(0,0,0,.06);
    --elevation-3: 0 8px 24px rgba(0,0,0,.10), 0 20px 48px rgba(0,0,0,.08);
    --radius-premium: 16px; --radius-premium-lg: 24px;
  }
  ```
- Typography: `Geist Sans` + `Fraunces` (display KPI). `font-variant-numeric: tabular-nums` for numbers. `tracking-tight` on headings.
- Motion: `duration:160-200ms easeOut`, `translateY(-1px)` on card hover, respects `prefers-reduced-motion`. Remove `AnimatePresence mode="wait"` jank on mobile (fade only).
- Blobs: `filter: blur(60px)` hidden on `<768px` to save GPU. Glass: `backdrop-blur(20px) saturate(180%)` only on login/ header.

## Mobile Pro
- Header: `h-14` sticky, `backdrop-blur`, left `Menu`, center title, right `theme|bell|avatar|logout-icon`.
- Bottom tab bar (`md:hidden`): 4 items (Dashboard, Workers, Verify, More) → `More` opens drawer. `44px` min, `safe-area-inset-bottom`, haptic via `navigator.vibrate(10)` on tap.
- Drawer: `w-[300px]`, `swipe-to-dismiss`, `overscroll-behavior: contain`, focus trap, `shadow-elevation-3`.
- Tables: `sticky` first col, swipe hint, card fallback `<640px` (transform rows to cards).
- Touch: all interactive `min-h-[44px]`.

## Stability & Error Handling
- Middleware `src/middleware.ts`: outer `try/catch`, dynamic `import("@/lib/auth/jwt")` inside, `matcher` excludes `_next/static|image|api/auth/me`, on error `return NextResponse.next()` + `console.error("[middleware]")`.
- `src/lib/db/pg.ts`: Pool `max:20, idleTimeoutMillis:30000, connectionTimeoutMillis:5000`, `pool.on("error", ...)` non-fatal, `init()` idempotent.
- `withError` returns `503` with `Retry-After:5` on `ECONNREFUSED/EAI_AGAIN`. TanStack retries with exponential backoff.
- Per-section `ErrorBoundary` (class component) → fallback with retry button, not full app crash.
- Dockerfile healthcheck: `wget --spider http://localhost:3056/login` (static) instead of `/api/auth/me`.

## Security & RBAC
- No change to `src/lib/auth/rbac.ts`, JWT, or role checks. Sections remain gated by `getVisibleSections`.

## Testing & Verification
- `tsc --noEmit` + `next build` must pass.
- Manual: login → dashboard refresh (desktop + 375px phone) → logout → login again. No bad gateway.
- Lighthouse mobile: Performance >85, Best Practices >90.
- Check: bottom nav appears `<768px`, charts lazy-load, images use `next/image`.

## Rollout
- Phase 1: Decompose + dynamic + image + middleware/pool fixes.
- Phase 2: Premium tokens + motion + bottom nav + skeletons.
- Phase 3: Polish charts/tooltips + Lighthouse tuning.

## Risks
- Dynamic import path typo → build fail (mitigated by `tsc`).
- Recharts SSR:false flash → mitigated by shimmer.
- Brand drift → keep `#1a237e` primary, vet with user.

## File Touch List
- `src/app/dashboard/page.tsx` (split), new `layout.tsx`, `src/app/dashboard/_components/*`, `src/app/dashboard/_hooks/useAuth.ts`, `src/app/globals.css`, `src/middleware.ts`, `src/lib/db/pg.ts`, `Dockerfile`, `next.config.ts` (image optimization).

## Spec Self-Review
- No TBD/TODO. Internally consistent. Scoped to single plan (Approach B). No ambiguity.
