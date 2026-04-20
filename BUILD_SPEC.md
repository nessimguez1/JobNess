# JobNess — Build Specification

## Context

You are building a private job-hunting platform for **Nessim Guez**. The platform scrapes job listings from multiple sources twice a day, uses Claude to score each listing against Nessim's profile and write a short fit note, and presents everything in a Kanban-style UI where Nessim swipes jobs into Interested / Applied / Archive columns and generates email drafts for outreach.

This is a single-user system — Nessim is the only user. No multi-tenancy, no public signup. Password-gate on the web app is sufficient.

**Attached to this prompt:** `ng-terminal.jsx` — a finished React prototype that establishes the visual design, mock data shape, and interaction model. You will adapt its UI into the real Next.js app. **Throw away its state/persistence layer** (it uses `window.storage`); replace with Supabase.

## Current state
- GitHub repo exists and is empty: `github.com/nessimguez1/JobNess` (already imported into Vercel, no code deployed yet)
- Supabase project exists: `bkxgkelzfcyvckjhuyzu` (no schema yet)
- Railway account exists (empty, no service yet)
- Nessim will push his own git commits — you produce code, he commits

---

## Architecture

Three services:

1. **Web app** — Next.js 14 (App Router) + TypeScript + Tailwind → deployed to **Vercel**
2. **Scraper worker** — Node.js + TypeScript + Playwright → deployed to **Railway**
3. **Database** — **Supabase** (Postgres) — single DB, both services talk to it

Monorepo structure:

```
JobNess/
├── apps/
│   ├── web/           # Next.js → Vercel
│   └── scraper/       # Node worker → Railway
├── packages/
│   └── shared/        # shared TS types + Nessim's profile
├── supabase/
│   └── migrations/    # SQL migration files
├── .gitignore
├── package.json       # pnpm workspaces
└── README.md
```

Use **pnpm workspaces**. TypeScript everywhere.

---

## Credentials (for .env files — never commit)

**Add these to `.gitignore` first thing:** `.env`, `.env.local`, `apps/*/.env`, `apps/*/.env.local`.

### `apps/web/.env.local` (used by Next.js)
```
NEXT_PUBLIC_SUPABASE_URL=https://bkxgkelzfcyvckjhuyzu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreGdrZWx6ZmN5dmNramh1eXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2NzAxOTYsImV4cCI6MjA5MjI0NjE5Nn0.OVQWMpBxsWomFx4XEPBERzDYbmO89Du79HP171q2rnc
APP_PASSWORD_HASH=<SET BY NESSIM — bcrypt hash of a password he picks>
SESSION_SECRET=<32-byte random hex string>
```

### `apps/scraper/.env` (used by Railway worker)
```
SUPABASE_URL=https://bkxgkelzfcyvckjhuyzu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJreGdrZWx6ZmN5dmNramh1eXp1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY3MDE5NiwiZXhwIjoyMDkyMjQ2MTk2fQ.aNd3fMQIEHnYQ4tOlcw5_6G2RBr3Owsie8RoJFAWUBc
ANTHROPIC_API_KEY=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
LINKEDIN_LI_AT_COOKIE=<to be added later — leave blank; scraper should skip LinkedIn if missing>
TZ=Asia/Jerusalem
```

These same values will also need to be configured in Vercel's project env vars and Railway's service env vars when deploying.

---

## Database schema

Generate a Supabase migration file at `supabase/migrations/0001_init.sql`:

```sql
-- Jobs: every scraped posting (after blocklist + dedup)
create table jobs (
  id text primary key,                   -- sha256(company|title|location) short hash
  title text not null,
  company text not null,
  mono text,                             -- 2-char monogram for UI (auto from company)
  location text,
  salary_text text,
  salary_nis integer,                    -- normalized to NIS/month
  source text not null,                  -- 'LinkedIn' | 'CareerPage' | 'Drushim' | 'HiddenMarket'
  url text not null,
  company_site text,
  company_linkedin text,
  hm_linkedin text,                      -- hiring manager LinkedIn, nullable
  posted_at timestamptz,
  score integer,                         -- 0-100 from Claude
  fit_note text,
  match_bullets jsonb,                   -- string[]
  description text,
  column_name text not null default 'inbox',   -- 'inbox' | 'interested' | 'applied' | 'archive'
  status text not null default 'new',
  applied_at timestamptz,
  trashed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index jobs_column_idx on jobs(column_name);
create index jobs_score_idx on jobs(score desc);
create index jobs_created_idx on jobs(created_at desc);

-- Targets: companies Nessim wants to work for with no current openings
create table targets (
  id text primary key,
  name text not null,
  mono text,
  type text,                             -- 'Private Bank' | 'Fintech' | 'VC' etc.
  location text,
  website text,
  linkedin text,
  notes text,
  priority text default 'med',           -- 'high' | 'med' | 'low'
  created_at timestamptz default now()
);

-- Blocklist: patterns matched against company name (case-insensitive, substring)
create table blocklist (
  id serial primary key,
  pattern text not null unique,
  created_at timestamptz default now()
);

-- Settings: single row (id=1)
create table settings (
  id integer primary key default 1,
  min_salary_nis integer default 18000,
  role_focus jsonb default '["Private Banking","Fintech BD","VC / IR","Tech BD"]',
  geo jsonb default '["Israel","Remote EU","Remote US"]',
  last_sync_at timestamptz,
  constraint one_row check (id = 1)
);

-- Scrape runs: audit log
create table scrape_runs (
  id serial primary key,
  source text not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  jobs_found integer default 0,
  jobs_new integer default 0,
  status text default 'running',         -- 'running' | 'ok' | 'failed'
  error text
);

-- Seed initial blocklist
insert into blocklist (pattern) values
  ('UBP'), ('Union Bancaire Privée'), ('Tafnit Discount'),
  ('IATI'), ('Israel Advanced Technology Industries'),
  ('Eden Property Group'), ('Reichman University');

-- Seed settings
insert into settings (id, min_salary_nis) values (1, 18000);

-- RLS: enable but use service_role for writes, anon for reads
alter table jobs enable row level security;
alter table targets enable row level security;
alter table blocklist enable row level security;
alter table settings enable row level security;

-- Anon can read everything (the web app uses anon key but is password-gated at middleware level)
create policy "anon read jobs" on jobs for select to anon using (true);
create policy "anon read targets" on targets for select to anon using (true);
create policy "anon read blocklist" on blocklist for select to anon using (true);
create policy "anon read settings" on settings for select to anon using (true);

-- Anon can update jobs column_name + status (for the UI moving cards around)
create policy "anon update jobs kanban" on jobs for update to anon
  using (true) with check (true);

-- Anon can CRUD targets
create policy "anon insert targets" on targets for insert to anon with check (true);
create policy "anon update targets" on targets for update to anon using (true) with check (true);
create policy "anon delete targets" on targets for delete to anon using (true);

-- Anon can update settings + blocklist (single-user app)
create policy "anon update settings" on settings for update to anon using (true) with check (true);
create policy "anon insert blocklist" on blocklist for insert to anon with check (true);
create policy "anon delete blocklist" on blocklist for delete to anon using (true);

-- Service role bypasses RLS automatically (used by scraper)
```

Run this via `supabase db push` or paste into the Supabase SQL Editor.

Also seed the target companies from `ng-terminal.jsx`'s `INITIAL_TARGETS` array — write a one-off script that upserts them.

---

## Nessim's profile (for AI scoring)

Put this in `packages/shared/profile.ts` — the scorer uses it as context when evaluating each job:

```typescript
export const PROFILE = {
  name: "Nessim Guez",
  age: 26,
  location: "Tel Aviv, Israel",
  contact: {
    email: "nessimguez1@gmail.com",
    phone: "+972 54 649 5846",
    linkedin: "https://www.linkedin.com/in/nessim-guez-0519411b8/",
  },
  languages: [
    { lang: "French", level: "native" },
    { lang: "English", level: "fluent (10 years lived in the US)" },
    { lang: "Hebrew", level: "professional" },
  ],
  currentRole: {
    title: "Relationship Manager",
    company: "UBP (Union Bancaire Privée)",
    location: "Tel Aviv",
    since: "2025",
    description: "Originates and services HNWI clients across Israel and France. Works with Geneva on KYC and onboarding. French desk focus.",
  },
  experience: [
    {
      company: "Tafnit Discount (Discount Bank wealth arm)",
      role: "Intern, Wealth Management",
      years: "2023–2024",
    },
    {
      company: "IATI (Israel Advanced Technology Industries)",
      role: "Project Coordinator",
      years: "2022–2023",
      description: "Inside the Israeli tech ecosystem. Coordinated initiatives with 100+ tech companies.",
    },
    {
      company: "Eden Property Group",
      role: "Business Development",
      years: "2020–2022",
    },
    {
      company: "IDF — Sayeret Harouv",
      role: "Combat soldier (elite recon unit)",
      years: "2018–2020",
    },
  ],
  education: [
    { school: "Ono Academic College", degree: "MA Finance", year: "Nov 2025" },
    { school: "Reichman University (IDC)", degree: "BA Business Administration", year: "2023" },
  ],
  sideProject: "Co-founder of Sayeret Harouv Association — 3,000+ alumni network",
  targetRoles: [
    "Private banking / Relationship Manager (French desk especially)",
    "Fintech BD / Partnerships (Israel or remote EU/US)",
    "VC / IR / Platform roles",
    "Tech BD at scale-ups",
  ],
  seniority: {
    paper: "Associate / Analyst level",
    realistic: "Punches above — Private Banking RM for FR-speaking HNWI at tier-1 Swiss banks (Pictet, Lombard Odier, Julius Baer, Edmond de Rothschild). Head of BD at early-stage fintech (Seed/Series A, 5-30 people). Skip middle-management BD at large companies.",
  },
  constraints: {
    minSalaryNIS: 18000,
    geographies: ["Israel", "Remote EU", "Remote US"],
    blocklist: [
      "UBP", "Union Bancaire Privée",
      "Tafnit Discount",
      "IATI", "Israel Advanced Technology Industries",
      "Eden Property Group",
      "Reichman University",
    ],
  },
} as const;
```

---

## Scoring logic (scraper side)

For each new job, call Anthropic API:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SCORING_SYSTEM = `You are a job-fit scorer for Nessim Guez's private job hunt. You are given a scraped job listing and Nessim's profile. Score the fit 0–100 where:

- 85+: excellent fit, apply with conviction
- 70–84: solid fit, worth applying
- 50–69: tangential, only if the person is stretching
- <50: poor fit, should be filtered out

Consider: role seniority match, language requirements (FR/EN/HE), industry alignment (private banking, fintech BD, VC), geography (Israel/remote EU-US), and salary (must exceed ${18000} NIS/mo equivalent).

Also write a 1–2 sentence "fit note" explaining why this job does or does not fit, in direct language. And list 2–4 "match bullets" — short concrete match points.

Return ONLY a JSON object with this exact shape, no markdown, no prose:
{"score": number, "fit_note": string, "match_bullets": string[]}`;

async function scoreJob(job: ScrapedJob): Promise<Scoring> {
  const res = await client.messages.create({
    model: "claude-sonnet-4-5-20250929",  // or latest Sonnet available
    max_tokens: 512,
    system: SCORING_SYSTEM,
    messages: [{
      role: "user",
      content: `PROFILE:\n${JSON.stringify(PROFILE, null, 2)}\n\nJOB:\n${JSON.stringify(job, null, 2)}\n\nReturn the JSON scoring.`,
    }],
  });
  const text = res.content[0].type === "text" ? res.content[0].text : "";
  return JSON.parse(text.replace(/```json|```/g, "").trim());
}
```

Use **whatever Sonnet model is current** when you build — check the Anthropic docs. Sonnet 4.5 is a good default. Batch where possible. Cache by job ID hash so a re-scrape doesn't re-score.

---

## Scrapers

All scrapers live in `apps/scraper/src/scrapers/`. Each exports:

```typescript
export async function run(): Promise<ScrapedJob[]>;
```

### 1. Career pages (`career-pages.ts`)
Static list of ~20 URLs. For each, fetch the page HTML, parse out job listings. Most career pages use one of these patterns:
- Workday (URLs contain `/myworkdayjobs.com` or `/wd5/`)
- Greenhouse (URLs contain `/boards.greenhouse.io/`)
- Lever (URLs contain `/jobs.lever.co/`)
- Custom HTML

Start with Greenhouse + Lever (clean JSON endpoints, no scraping):
- Greenhouse: `GET https://boards-api.greenhouse.io/v1/boards/{company}/jobs`
- Lever: `GET https://api.lever.co/v0/postings/{company}?mode=json`

For Workday and custom pages, use Playwright. Implement one at a time and log clearly which worked / failed in `scrape_runs`.

**Verify URLs before hardcoding.** My list is a best guess — visit each and confirm the actual ATS (applicant tracking system) they use, then wire up the right parser.

Initial target list (confirm each and adjust):
```
Private banks (verify career page URLs):
- Julius Baer
- Pictet & Cie
- Lombard Odier
- Edmond de Rothschild
- Banque Syz
- REYL Intesa Sanpaolo
- Mirabaud
- Bordier & Cie
- UBS (FR desk roles)
- BNP Paribas Wealth Management

Israeli fintech:
- Rapyd
- Melio
- Papaya Global
- Payoneer
- Pagaya
- eToro
- Tipalti
- Fundbox

French fintech (for IL-based or remote roles):
- Qonto
- Alan
- Ledger
- Pennylane
- Spendesk
- Swile

Israeli VC / foundry:
- Team8
- Aleph
- OurCrowd
- Viola Ventures
- TLV Partners
- Grove Ventures
- Pitango
```

Save the confirmed list to `apps/scraper/src/config/career-pages.ts` as an array of `{ company, url, ats: 'greenhouse'|'lever'|'workday'|'custom' }`.

### 2. Israeli job boards (`drushim.ts`)
- Drushim: `https://www.drushim.co.il/jobs/cat/1/` (Finance/Banking) and `.../cat/16/` (BD/Sales)
- AllJobs: `https://www.alljobs.co.il/`

Both require Playwright. Filter server-side by: salary (if visible), role keywords (private banking, relationship manager, BD, partnerships, VC).

### 3. LinkedIn Jobs (`linkedin-jobs.ts`)
Needs `LINKEDIN_LI_AT_COOKIE` env var. **If the env var is empty or missing, the scraper must log "LinkedIn skipped — no cookie" and return []. Do not fail the whole run.**

When cookie is present:
- Open `https://www.linkedin.com/jobs/search/?keywords=<role>&location=<loc>` with Playwright
- Set the `li_at` cookie before navigating
- Parse job cards, extract title / company / location / URL / posted date
- Search queries: `"relationship manager" Geneva`, `"private banker" "French desk"`, `"BD manager" fintech Tel Aviv`, `"partnerships" fintech remote`, `"country manager" Israel`

Keep it ≤5 searches per run to avoid getting flagged.

### 4. LinkedIn hiring posts (`linkedin-posts.ts`)
Also cookie-gated, also no-op without cookie. Search LinkedIn posts for phrases like "we're hiring", "looking for", combined with job-relevant keywords. Fetch the first 2–3 pages. This is the "hidden market" signal — posts from people who are hiring but the role isn't formally listed yet.

### Orchestrator (`apps/scraper/src/index.ts`)

```typescript
import cron from "node-cron";
import { runAllScrapers } from "./pipeline";

// Twice daily: 07:30 and 19:00 Tel Aviv time
cron.schedule("30 7 * * *", runAllScrapers, { timezone: "Asia/Jerusalem" });
cron.schedule("0 19 * * *", runAllScrapers, { timezone: "Asia/Jerusalem" });

// Also expose a /run HTTP endpoint for manual trigger from the web app
import express from "express";
const app = express();
app.post("/run", async (req, res) => {
  // require a shared secret header to prevent abuse
  if (req.headers["x-auth"] !== process.env.SCRAPER_SHARED_SECRET) return res.status(401).end();
  runAllScrapers().catch(console.error);
  res.json({ status: "started" });
});
app.listen(process.env.PORT || 3001);

// Optional: run once immediately on boot for testing
if (process.env.RUN_ON_BOOT === "true") runAllScrapers().catch(console.error);
```

### Pipeline (`apps/scraper/src/pipeline.ts`)
```
for each scraper in [linkedinJobs, linkedinPosts, careerPages, drushim]:
  1. Start a scrape_runs row
  2. Run scraper → list of ScrapedJob
  3. Filter out jobs where salary < 18K NIS or blocklist matches company name
  4. Dedupe against jobs table (by id hash)
  5. For each new job, call scoreJob()
  6. Discard jobs with score < 50
  7. Insert remaining into jobs table
  8. Mark scrape_runs row as ok / failed with counts
After all scrapers:
  9. Update settings.last_sync_at
```

Salary parsing util: handle "CHF 110K–140K/yr", "€55K–70K", "25,000 NIS/mo", "$120K/yr" etc. Convert yearly to monthly, any currency to NIS using a hardcoded rate (CHF = 4.15, EUR = 3.95, USD = 3.65, GBP = 4.60, ILS = 1.0). Don't call a live FX API.

---

## Web app

Location: `apps/web/`. Next.js 14 App Router + TypeScript + Tailwind.

### Auth
Simple password gate via middleware:
- `app/api/auth/route.ts` POST — accepts `{ password }`, compares to `bcrypt.compare(password, APP_PASSWORD_HASH)`, sets an HTTP-only session cookie signed with `SESSION_SECRET` (use `iron-session` or `jose`).
- `middleware.ts` — on every request except `/login` and `/api/auth`, validates the session cookie. Redirects to `/login` if missing/invalid.
- `app/login/page.tsx` — bare password input.

Nessim sets `APP_PASSWORD_HASH` himself:
```bash
node -e "console.log(require('bcryptjs').hashSync('his-password', 10))"
```

### Supabase client
`lib/supabase.ts` — create with anon key, browser-safe. No service role on the client ever.

### UI — adapt `ng-terminal.jsx`

The attached `ng-terminal.jsx` is the approved design. Port it to Next.js components:

- `app/page.tsx` — the main terminal (header + tab router)
- `components/Feed.tsx` — Kanban columns
- `components/Targets.tsx`
- `components/Stats.tsx`
- `components/Settings.tsx`
- `components/JobCard.tsx`, `components/JobDetailModal.tsx`, `components/EmailModal.tsx`, `components/TargetCard.tsx`, `components/TargetEmailModal.tsx`

**Preserve the visual design exactly** — same Geist font, same color palette (#faf7f0 paper, #1a1815 ink, #e5dfce borders, etc.), same layout, same interaction model. **Replace only the data layer**:

- Remove `INITIAL_JOBS`, `INITIAL_TARGETS`, `BLOCKLIST` constants → fetch from Supabase
- Remove `window.storage` calls → write to Supabase
- Card moves (`moveJob`, `trashJob`, `markApplied`) become Supabase `update` calls
- Target add/remove become `insert`/`delete`
- Settings changes write to `settings` row
- Blocklist changes write to `blocklist` table
- "Refresh" button in header POSTs to the scraper's `/run` endpoint through a Next.js API proxy (so the shared secret stays server-side)

### Email drafting
The `genEmails()` and `genTargetEmail()` functions in the JSX use hardcoded templates. **Upgrade these to Anthropic API calls** — call a Next.js API route `/api/draft-email` that runs Claude with the job context + Nessim's profile + the chosen style (cold/warm/LinkedIn DM) and returns subject + body. Keep the template as a fallback if the API fails.

Language toggle EN/FR should translate the body (separate API call with `{ language: "fr" }`).

### Fit score transparency
On the job detail modal, add a small "how this was scored" collapsible that shows the match_bullets as returned by Claude. Already partially built in the JSX prototype — just wire to real data.

---

## Deployment

### Supabase
1. Run the migration via SQL Editor or `supabase db push`
2. Seed the targets table (one-off script)
3. Verify RLS policies are active

### Railway (scraper)
1. New service from GitHub (JobNess repo), root directory `apps/scraper`
2. Build command: `pnpm install && pnpm --filter scraper build`
3. Start command: `pnpm --filter scraper start`
4. Env vars: everything from `apps/scraper/.env` above, plus `SCRAPER_SHARED_SECRET` (random string, also add to Vercel)
5. Enable public URL (for the `/run` endpoint)
6. Add the Playwright browser install step to the build

### Vercel (web)
1. Import the repo (already done), set root directory to `apps/web`
2. Framework preset: Next.js
3. Env vars: everything from `apps/web/.env.local` above, plus `SCRAPER_URL` (Railway public URL) and `SCRAPER_SHARED_SECRET`
4. Deploy

---

## Build order

Do this in order. Don't boil the ocean.

### Phase 1: Foundation
- [ ] Init pnpm workspace, set up TypeScript configs, create directory structure
- [ ] Create `packages/shared/types.ts` with `ScrapedJob`, `Job`, `Target`, `Scoring` types
- [ ] Create `packages/shared/profile.ts` with the PROFILE constant above
- [ ] Write the migration file, run it on Supabase, seed targets
- [ ] Set up `.env` files with placeholders (not committed) + `.env.example` (committed)
- [ ] Get `.gitignore` right before first commit

### Phase 2: Scraper skeleton
- [ ] Scaffold `apps/scraper` with a trivial scraper (one Greenhouse company, hardcoded)
- [ ] Wire Anthropic scoring
- [ ] Wire Supabase writes (service role)
- [ ] Test end-to-end: one scrape → one scored job → one row in Supabase
- [ ] Add dedup, salary parsing, blocklist filtering, scrape_runs logging

### Phase 3: Web app scaffold
- [ ] Scaffold Next.js in `apps/web`, install Tailwind + iron-session + supabase-js + lucide-react
- [ ] Password gate: login page + middleware + /api/auth route
- [ ] Port header + tab nav from `ng-terminal.jsx`
- [ ] Wire one tab (Feed) to read from Supabase

### Phase 4: UI complete
- [ ] Port all 4 tabs (Feed, Targets, Stats, Settings) + all modals
- [ ] Wire card moves to Supabase updates
- [ ] Wire email drafter to `/api/draft-email` (Anthropic)
- [ ] Wire "Refresh" button to scraper's `/run` via API proxy

### Phase 5: More scrapers
- [ ] Finish all Greenhouse/Lever career pages
- [ ] Add Drushim scraper
- [ ] Add Workday career pages (Playwright)
- [ ] Add LinkedIn scrapers (stubbed until cookie provided — must no-op cleanly when env var missing)

### Phase 6: Deploy
- [ ] Push to GitHub
- [ ] Deploy scraper to Railway, run once manually, verify jobs appear in Supabase
- [ ] Deploy web to Vercel, verify login works and jobs render
- [ ] Verify cron triggers twice daily

### Phase 7: LinkedIn cookie (Nessim adds)
- [ ] Document the cookie extraction process in `docs/linkedin-cookie.md`
- [ ] Nessim adds `LINKEDIN_LI_AT_COOKIE` to Railway env
- [ ] Verify LinkedIn scraper kicks in on next run

---

## Conventions

- TypeScript strict mode everywhere
- No `any` without a comment explaining why
- All async functions have try/catch with structured logging
- No console.log in production code — use a logger (pino is fine)
- Salary is always stored in NIS/month (integer)
- Dates are always timestamptz in DB, ISO strings in API
- Dedup hash: first 12 chars of `sha256(lowercase(company) + "|" + lowercase(title) + "|" + lowercase(location))`
- Logger tag every scraper run with the `scrape_runs.id` so logs are traceable

## Security

- Never log API keys or cookies
- Service role key lives only on the Railway worker, never on the client
- Anon key is fine to expose client-side — it's scoped by RLS policies
- Add rate limiting on `/api/draft-email` (10 req/min per session) via `@upstash/ratelimit` or a simple in-memory counter
- The scraper's `/run` endpoint requires the shared secret header
- `.gitignore` must exclude all `.env*` files before the first commit

## Gotchas to watch for

1. **LinkedIn ToS**: scraping LinkedIn technically violates their ToS. This is for personal single-user use — don't distribute the code publicly, don't use rotating proxies, don't run it at scale. Respect `robots.txt` on career pages.
2. **Cookie expiry**: `li_at` cookies expire every ~30 days. Build a simple Slack/email alert (optional) when LinkedIn scraper returns 0 jobs 3 runs in a row.
3. **Rate limits on Anthropic**: Claude API has tier-based rate limits. Batch scoring or add exponential backoff on 429s.
4. **Playwright on Railway**: you'll need a Dockerfile that installs Playwright browsers (`npx playwright install --with-deps chromium`). Don't rely on Nixpacks default.
5. **Supabase free tier**: 500MB DB, 2GB bandwidth, 50K MAU. More than enough for one user. Don't accidentally expose public pages that would pull it into paid tier.
6. **FX rates**: hardcoded in scraper, not live. Document where to update them (`apps/scraper/src/utils/fx.ts`).

---

## What Nessim will do after you're done

1. Set `APP_PASSWORD_HASH` in Vercel env (bcrypt of his chosen password)
2. Generate `SESSION_SECRET` + `SCRAPER_SHARED_SECRET` (random 32-byte hex)
3. Extract his LinkedIn `li_at` cookie and add to Railway env (separate task, separate prompt later)
4. Rotate all the credentials in this document after things are working end-to-end

---

## Acceptance criteria

**Minimum viable delivery:**
- Web app deployed to Vercel, password-gated, matching the design of `ng-terminal.jsx`
- At least 3 career-page scrapers working (Greenhouse + Lever endpoints)
- One full scrape run produces real scored jobs in Supabase that appear in the web UI
- Kanban actions (move cards, trash, mark applied) persist to Supabase
- Target companies tab works end-to-end (add/remove/draft email)
- Settings tab can edit salary filter + blocklist
- Refresh button triggers scraper
- LinkedIn scrapers are in place but no-op without cookie

**Not required for MVP** (follow-up work):
- More than 3 career pages
- LinkedIn scrapers actually firing (waiting on cookie)
- Email drafting via Claude (template fallback is fine for MVP)
- Response-rate tracking (nice-to-have)
- Any analytics beyond what's in the Stats tab mock

---

## Reference file

**`ng-terminal.jsx`** (attached) is the visual and interaction spec. Treat the design, colors, fonts, layouts, and component structure as locked. The data layer (mock data, `window.storage`) is throwaway — replace with Supabase.

Start with Phase 1 and work through sequentially. Confirm each phase works end-to-end before moving to the next. Ask me if any decision is ambiguous.
