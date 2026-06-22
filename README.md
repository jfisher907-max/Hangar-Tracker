# Hangar Tracker

Aircraft hangar usage tracker for Aero Air operations at PAJN (Juneau, AK). Tracks two
Learjet 45XR aircraft (N254AL, N253AL) between **Wings Hangar** and **ALNW**, with
real-time multi-device sync.

## Stack

Mirrors the `aeroair-ops` (135 ops) platform:

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind v4**
- **Supabase** (Postgres + Realtime) — project `hangar-tracker`
- Deployed on **Vercel** (push to `main` → auto-deploy)

## Local development

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
npm run lint
```

Requires `.env.local` (gitignored):

```
NEXT_PUBLIC_SUPABASE_URL=https://dlfjgslufkkxjmqkqhsu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<publishable key>
```

## Backend

Supabase tables (`public`):

- **`sessions`** — aircraft hangar stays (`exit` NULL = currently in hangar)
- **`unavailability`** — Wings Hangar unavailable periods (`end_time` NULL = ongoing)
- **`app_config`** — single `auth` row holding the access PIN

RLS is enabled with permissive anon policies; access is gated by the app-level PIN
(changeable in Settings). All three tables are in the `supabase_realtime` publication.

## Structure

```
app/            layout, globals.css (design system), page.tsx (PIN gate → app)
lib/            supabase client, types, stats/formatters, data layer + realtime hook, report builders
components/     HangarApp shell, PIN gate, modals, and one component per tab
```
