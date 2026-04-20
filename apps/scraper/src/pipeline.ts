import { createClient } from '@supabase/supabase-js';
import type { ScrapedJob } from '@jobness/shared';
import { run as runCareerPages } from './scrapers/career-pages.js';
import { run as runLinkedInJobs } from './scrapers/linkedin-jobs.js';
import { run as runLinkedInPosts } from './scrapers/linkedin-posts.js';
import { run as runDrushim } from './scrapers/drushim.js';
import { scoreJob } from './scorer.js';
import { parseSalaryNIS } from './utils/fx.js';
import { logger } from './utils/logger.js';

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (_supabase) return _supabase;
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !key) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  _supabase = createClient(url, key);
  return _supabase;
}

function isBlocked(company: string, patterns: string[]): boolean {
  const lower = company.toLowerCase();
  return patterns.some(p => lower.includes(p.toLowerCase()));
}

const ISRAEL_PASS = [
  'israel', 'tel aviv', 'haifa', 'jerusalem', 'beer sheva', 'herzliya', 'petah tikva',
  'remote', 'worldwide', 'anywhere', 'hybrid',
];

function isLocationAllowed(location: string | undefined): boolean {
  if (!location) return true; // unknown location passes through — scorer will judge
  const loc = location.toLowerCase();
  return ISRAEL_PASS.some(kw => loc.includes(kw));
}

function stripUndefined(obj: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined));
}

async function runSource(
  sourceName: string,
  scraper: () => Promise<ScrapedJob[]>,
  blocklistPatterns: string[],
  minSalaryNIS: number,
): Promise<void> {
  const supabase = getSupabase();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: runRow, error: runErr } = await (supabase.from('scrape_runs') as any)
    .insert({ source: sourceName, status: 'running' })
    .select('id')
    .single();

  if (runErr || !runRow) {
    logger.error({ err: runErr, source: sourceName }, 'failed to create scrape_run row');
    return;
  }

  const runId = runRow.id as number;
  const tag = { runId, source: sourceName };

  try {
    const scraped = await scraper();
    logger.info({ ...tag, found: scraped.length }, 'scraped');

    // Blocklist filter
    const afterBlocklist = scraped.filter(j => !isBlocked(j.company, blocklistPatterns));

    // Location filter — only Israel or remote
    const afterLocation = afterBlocklist.filter(j => {
      if (isLocationAllowed(j.location)) return true;
      logger.debug({ ...tag, title: j.title, location: j.location }, 'filtered by location');
      return false;
    });

    // Salary filter — unknown salary passes through (let score judge)
    const afterSalary: ScrapedJob[] = [];
    for (const j of afterLocation) {
      const salaryNIS = j.salary_nis ?? parseSalaryNIS(j.salary_text);
      if (salaryNIS !== undefined && salaryNIS < minSalaryNIS) {
        logger.debug({ ...tag, title: j.title, salaryNIS }, 'filtered by salary');
        continue;
      }
      afterSalary.push(salaryNIS !== undefined ? { ...j, salary_nis: salaryNIS } : j);
    }

    // Dedup against existing job IDs
    const ids = afterSalary.map(j => j.id);
    const newJobs: ScrapedJob[] = [];
    if (ids.length > 0) {
      const { data: existing } = await supabase.from('jobs').select('id').in('id', ids);
      const existingIds = new Set<string>(
        ((existing ?? []) as { id: string }[]).map(r => r.id),
      );
      for (const j of afterSalary) {
        if (!existingIds.has(j.id)) newJobs.push(j);
      }
    }

    logger.info({ ...tag, new: newJobs.length }, 'new jobs after dedup');

    // Score and insert
    let inserted = 0;
    for (const job of newJobs) {
      try {
        const scoring = await scoreJob(job);
        if (scoring.score < 50) {
          logger.debug({ ...tag, title: job.title, score: scoring.score }, 'dropped by score');
          continue;
        }
        const row = stripUndefined({
          ...(job as unknown as Record<string, unknown>),
          score: scoring.score,
          fit_note: scoring.fit_note,
          match_bullets: scoring.match_bullets,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertErr } = await supabase.from('jobs').insert(row as any);
        if (insertErr) throw insertErr;
        inserted++;
        logger.info({ ...tag, title: job.title, score: scoring.score }, 'inserted');
      } catch (err) {
        logger.error({ ...tag, title: job.title, err }, 'failed to score/insert');
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('scrape_runs') as any)
      .update({ status: 'ok', completed_at: new Date().toISOString(), jobs_found: scraped.length, jobs_new: inserted })
      .eq('id', runId);

    logger.info({ ...tag, inserted }, 'source complete');
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('scrape_runs') as any)
      .update({ status: 'failed', completed_at: new Date().toISOString(), error: String(err) })
      .eq('id', runId);
    logger.error({ ...tag, err }, 'source failed');
  }
}

export async function runAllScrapers(): Promise<void> {
  logger.info('scrape run started');

  const db = getSupabase();
  const [{ data: bl }, { data: settings }] = await Promise.all([
    db.from('blocklist').select('pattern'),
    db.from('settings').select('min_salary_nis').eq('id', 1).single(),
  ]);

  const patterns = ((bl ?? []) as { pattern: string }[]).map(r => r.pattern);
  const minSalary = (settings as { min_salary_nis: number } | null)?.min_salary_nis ?? 18000;

  await runSource('LinkedIn', runLinkedInJobs, patterns, minSalary);
  await runSource('HiddenMarket', runLinkedInPosts, patterns, minSalary);
  await runSource('CareerPage', runCareerPages, patterns, minSalary);
  await runSource('Drushim', runDrushim, patterns, minSalary);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (getSupabase().from('settings') as any).update({ last_sync_at: new Date().toISOString() }).eq('id', 1);
  logger.info('scrape run complete');
}
