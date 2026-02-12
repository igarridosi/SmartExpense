# CONTEXTO TÉCNICO EXTERNO (Source: Context7)

## LIB: NEXT.JS (App Router)
- **Routing:** File-system based router inside `src/app`.
- **Rendering:** All components are Server Components by default. Use `"use client"` at the top of the file for client-side interactivity (onClick, useState).
- **Data Fetching:** Async/await in Server Components. No `useEffect` for data fetching unless specific client needs.
- **Caching:** Fetch requests are cached by default. Use `revalidatePath` or `revalidateTag` for updates.

## LIB: SUPABASE (SSR Auth)
- **Package:** `@supabase/ssr` (Do not use the old auth-helpers).
- **Client Creation:**
  - `createBrowserClient` for client components.
  - `createServerClient` for server components/actions (needs cookie store access).
- **Middleware:** Essential for refreshing auth tokens. Update `middleware.ts` to use `updateSession`.

## LIB: TAILWIND CSS (v4)
- CSS-first configuration: use `@theme` directive in CSS instead of `tailwind.config.js` when possible.
- Use arbitrary values `w-[320px]` sparingly.
- Prefer semantic class names or utility grouping via `clsx` / `tailwind-merge`.
- Automatic content detection: no `content` array needed in config.
