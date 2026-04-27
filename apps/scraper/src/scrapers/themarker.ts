import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import { extractJobPostingsFromHtml, fetchHtml, dedupById } from '../utils/json-ld.js';

// ─── TheMarker Jobs (jobs.themarker.com) — Haaretz business board ────────
//
// Same structure as Globes — Hebrew business press job board, JSON-LD parsing.

const BASE = 'https://jobs.themarker.com';

const QUERIES = [
  'פיתוח עסקי',
  'מנהל לקוחות',
  'אנליסט',
  'יועץ השקעות',
  'פינטק',
  'business development',
  'partnerships',
  'investor relations',
  'wealth manager',
  'analyst',
  'relationship manager',
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
    const jobs = extractJobPostingsFromHtml(html, 'TheMarker', url);
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
      logger.info({ query, count: jobs.length }, 'themarker query');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ query, err: String(err) }, 'themarker query failed');
    }
  }
  return dedupById(all);
}
