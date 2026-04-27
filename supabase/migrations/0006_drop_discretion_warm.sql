-- Defensive: roll back discretion_tier / warm_contacts if a prior phase introduced them.
-- Idempotent — safe to run even if the columns never existed.
alter table companies drop column if exists discretion_tier;
alter table companies drop column if exists warm_contacts;
