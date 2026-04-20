-- Unified outreach log: one row per message sent, keyed to either a job or a
-- company. Replaces the inline jobs.sent_to/outreach_method/outreach_date/
-- follow_up_at fields as the source of truth, while keeping those columns in
-- place so existing Feed reads don't break during the transition.

create extension if not exists pgcrypto;

create table if not exists outreach (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id) on delete cascade,
  job_id     text references jobs(id)      on delete cascade,
  type       text not null default 'cold',  -- 'cold' | 'speculative' | 'warm' | 'linkedin'
  sent_to    text,
  method     text,                          -- 'email' | 'linkedin' | 'website'
  subject    text,
  body       text,
  sent_at    date default current_date,
  follow_up_at date,
  notes      text,
  created_at timestamptz default now(),

  -- Exactly one target (company or job, never both, never neither).
  constraint outreach_target_check check (
    (company_id is not null and job_id is null) or
    (company_id is null and job_id is not null)
  )
);

create index if not exists outreach_company_idx   on outreach(company_id);
create index if not exists outreach_job_idx       on outreach(job_id);
create index if not exists outreach_sent_idx      on outreach(sent_at desc);
create index if not exists outreach_followup_idx  on outreach(follow_up_at)
  where follow_up_at is not null;

-- Backfill from legacy jobs.outreach_* columns so history carries over.
insert into outreach (job_id, type, sent_to, method, sent_at, follow_up_at)
select id, 'cold', sent_to, outreach_method, outreach_date, follow_up_at
from jobs
where outreach_date is not null;

alter table outreach enable row level security;

create policy "anon read outreach"   on outreach for select to anon using (true);
create policy "anon insert outreach" on outreach for insert to anon with check (true);
create policy "anon update outreach" on outreach for update to anon using (true) with check (true);
create policy "anon delete outreach" on outreach for delete to anon using (true);
