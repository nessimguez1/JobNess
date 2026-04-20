-- Outreach tracking fields on jobs
alter table jobs
  add column if not exists sent_to        text,
  add column if not exists outreach_method text,   -- 'email' | 'linkedin' | 'website'
  add column if not exists outreach_date  date,    -- user-set send date (manual override)
  add column if not exists follow_up_at   date;    -- next follow-up reminder

create index if not exists jobs_follow_up_idx on jobs(follow_up_at)
  where follow_up_at is not null;
