import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import { extractJobPostingsFromHtml, fetchHtml, dedupById } from '../utils/json-ld.js';

// ─── JobMaster (jobmaster.co.il) — niche Israeli board ───────────────────
//
// Smaller volume than AllJobs/Drushim but sometimes surfaces tech-finance
// roles others miss. JSON-LD parsing where available.

const BASE = 'https://www.jobmaster.co.il';

const QUERIES = [
  'פיתוח עסקי',
  'מנהל לקוחות',
  'יועץ השקעות',
  'אנליסט',
  'business development',
  'partnerships',
  'account manager',
  'analyst',
];

function searchUrl(query: string, page: number): string {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return `${BASE}/jobs?${params}`;
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const out: ScrapedJob[] = [];
  for (let page = 1; page <= 2; page++) {
    const url = searchUrl(query, page);
    const html = await fetchHtml(url);
    if (!html) break;
    const jobs = extractJobPostingsFromHtml(html, 'JobMaster', url);
    if (jobs.length === 0) break;
    out.push(...jobs);
  }
  return out;
}

export async function run(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];
  for (const query of QUERIES) {
    try {
      const jobs = await fetchQuery(query);
      logger.info({ query, count: jobs.length }, 'jobmaster query');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ query, err: String(err) }, 'jobmaster query failed');
    }
  }
  return dedupById(all);
}
