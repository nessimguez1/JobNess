import type { SupabaseClient } from '@supabase/supabase-js';
import { CAREER_PAGES } from '../config/career-pages.js';
import { SPECULATIVE_COMPANIES } from '../config/speculative-companies.js';
import { companyId, mono } from './hash.js';
import { logger } from './logger.js';

/**
 * Upsert career-pages + speculative-companies into the `companies` table.
 * Idempotent: rows keyed by computed ID. Only seeds config-sourced rows;
 * manually-added companies (source='manual') are left untouched. Pinned/notes
 * fields are not in the upsert payload, so they're preserved across syncs.
 *
 * Also refreshes job_count + last_job_at from the jobs table so the Companies
 * page always shows a live view.
 */
export async function syncCompanies(supabase: SupabaseClient): Promise<void> {
  const allTargets = [...CAREER_PAGES, ...SPECULATIVE_COMPANIES];
  const rows = allTargets.map(t => ({
    id: companyId(t.company),
    name: t.company,
    mono: mono(t.company),
    slug: t.slug,
    ats: t.ats,
    website: t.website ?? null,
    sector: t.sector,
    source: 'config' as const,
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('companies') as any).upsert(rows, {
    onConflict: 'id',
    ignoreDuplicates: false,
  });

  if (error) {
    logger.error({ err: error }, 'syncCompanies upsert failed');
    return;
  }

  logger.info(
    { total: rows.length, scrapeable: CAREER_PAGES.length, speculative: SPECULATIVE_COMPANIES.length },
    'companies synced from config',
  );
}

/**
 * Refresh job_count + last_job_at on every company row from the jobs table.
 * Matches on company name (case-insensitive). Called after each scrape run.
 */
export async function refreshCompanyJobStats(supabase: SupabaseClient): Promise<void> {
  // Pull every company name + id
  const { data: companies, error: cErr } = await supabase
    .from('companies')
    .select('id, name');

  if (cErr || !companies) {
    logger.error({ err: cErr }, 'refreshCompanyJobStats: failed to load companies');
    return;
  }

  // Pull live-ish jobs (not archived, not trashed)
  const { data: jobs, error: jErr } = await supabase
    .from('jobs')
    .select('company, created_at')
    .neq('column_name', 'archive')
    .is('trashed_at', null);

  if (jErr || !jobs) {
    logger.error({ err: jErr }, 'refreshCompanyJobStats: failed to load jobs');
    return;
  }

  type JobRow = { company: string; created_at: string };
  const stats = new Map<string, { count: number; last: string }>();
  for (const j of jobs as JobRow[]) {
    const key = j.company.toLowerCase().trim();
    const existing = stats.get(key);
    if (!existing) {
      stats.set(key, { count: 1, last: j.created_at });
    } else {
      existing.count++;
      if (j.created_at > existing.last) existing.last = j.created_at;
    }
  }

  type CompanyRow = { id: string; name: string };
  let updated = 0;
  for (const c of companies as CompanyRow[]) {
    const hit = stats.get(c.name.toLowerCase().trim());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from('companies') as any)
      .update({ job_count: hit?.count ?? 0, last_job_at: hit?.last ?? null })
      .eq('id', c.id);
    if (error) {
      logger.warn({ err: error, id: c.id }, 'refreshCompanyJobStats: update failed');
    } else {
      updated++;
    }
  }

  logger.info({ updated }, 'company job stats refreshed');
}
