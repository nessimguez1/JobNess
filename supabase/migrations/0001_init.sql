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

-- Anon can read everything (web app uses anon key, password-gated at middleware level)
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
