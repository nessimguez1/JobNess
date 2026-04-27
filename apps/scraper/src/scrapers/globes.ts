import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import { extractJobPostingsFromHtml, fetchHtml, dedupById } from '../utils/json-ld.js';

// ─── Globes Jobs (jobs.globes.co.il) — Israeli business press ─────────────
//
// Skews finance / BD / VC. JSON-LD parsing works on most search pages.

const BASE = 'https://jobs.globes.co.il';

const QUERIES = [
  'פיתוח עסקי',
  'מנהל לקוחות',
  'אנליסט',
  'יועץ השקעות',
  'מנהל קשרי לקוחות',
  'פינטק',                   // fintech
  'בנקאות פרטית',           // private banking
  'business development',
  'partnerships',
  'investor relations',
  'wealth manager',
  'private banker',
];

function searchUrl(query: string, page: number): string {
  const params = new URLSearchParams({ q: query, page: String(page) });
  return `${BASE}/search?${params}`;
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const out: ScrapedJob[] = [];
  for (let page = 1; page <= 2; page++) {
    const url = searchUrl(query, page);
    const html = await fetchHtml(url);
    if (!html) break;
    const jobs = extractJobPostingsFromHtml(html, 'Globes', url);
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
      logger.info({ query, count: jobs.length }, 'globes query');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ query, err: String(err) }, 'globes query failed');
    }
  }
  return dedupById(all);
}
