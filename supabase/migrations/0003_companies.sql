-- Companies: the canonical directory, seeded from career-pages.ts and kept
-- in sync by the scraper on every run. Replaces the old "targets" table as
-- the source of truth for the Companies page (speculative outreach + jobs view).
create table if not exists companies (
  id text primary key,                   -- 'c_' + normalized(name)
  name text not null,
  mono text,
  slug text,                             -- ATS slug (greenhouse/lever board)
  ats text,                              -- 'greenhouse' | 'lever' | 'workday' | 'custom' | null
  website text,
  linkedin text,
  sector text,                           -- 'Israeli Fintech' | 'Global Fintech' | 'WealthTech' | 'European Fintech' | 'VC' | 'Israeli Tech' | 'HR-Tech / SaaS'
  priority text not null default 'med',  -- 'high' | 'med' | 'low'
  notes text,
  pinned boolean not null default false,
  job_count integer not null default 0,  -- live count of open postings (updated by scraper)
  last_job_at timestamptz,               -- last time a new job was scraped from this company
  source text not null default 'config', -- 'config' = from career-pages.ts, 'manual' = added via UI
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists companies_sector_idx   on companies(sector);
create index if not exists companies_priority_idx on companies(priority);
create index if not exists companies_jobcount_idx on companies(job_count desc);
create index if not exists companies_name_idx     on companies(name);

-- Backfill any rows from the legacy targets table so we don't lose manual entries.
insert into companies (id, name, mono, sector, website, linkedin, notes, priority, source, created_at)
select
  'c_legacy_' || id,
  name,
  mono,
  type,
  website,
  linkedin,
  notes,
  coalesce(priority, 'med'),
  'manual',
  created_at
from targets
on conflict (id) do nothing;

-- RLS — same pattern as the rest of the app.
alter table companies enable row level security;

create policy "anon read companies"   on companies for select to anon using (true);
create policy "anon insert companies" on companies for insert to anon with check (true);
create policy "anon update companies" on companies for update to anon using (true) with check (true);
create policy "anon delete companies" on companies for delete to anon using (true);
