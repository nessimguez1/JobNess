import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import { extractJobPostingsFromHtml, fetchHtml, dedupById } from '../utils/json-ld.js';

// ─── AllJobs (alljobs.co.il) — Israel's broadest job board ─────────────────
//
// Strategy:
//   1. Hit each search URL (English + Hebrew queries targeting Nessim's lane)
//   2. Parse JSON-LD JobPosting blocks (.NET / SEO-tooled sites usually have them)
//   3. Fallback: anchor-pattern extraction from HTML
//
// AllJobs is a .NET ASP page under heavy client-side rendering, so JSON-LD
// is more reliable than DOM scraping. If the JSON-LD path returns 0 we log
// and move on rather than fabricating.

const BASE = 'https://www.alljobs.co.il';

// Hebrew-first queries (the board is primarily Hebrew).
const QUERIES = [
  'פיתוח עסקי',           // business development
  'מנהל לקוחות',          // account manager
  'שותפויות',              // partnerships
  'יועץ השקעות',          // investment advisor
  'מנהל קשרי לקוחות',    // relationship manager
  'אנליסט',                // analyst
  'יועץ לקוחות',           // client advisor
  'business development',
  'partnerships',
  'account manager',
  'relationship manager',
  'investor relations',
];

function searchUrl(query: string, page: number): string {
  // The /Search/Default.aspx endpoint takes Region (TLV cluster) + Type=BD/Sales.
  // We build broad queries; the title/location filter happens downstream.
  const params = new URLSearchParams({
    page: String(page),
    freetext: query,
  });
  return `${BASE}/Search/Default.aspx?${params}`;
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const out: ScrapedJob[] = [];
  for (let page = 1; page <= 2; page++) {
    const url = searchUrl(query, page);
    const html = await fetchHtml(url);
    if (!html) break;
    const jobs = extractJobPostingsFromHtml(html, 'AllJobs', url);
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
      logger.info({ query, count: jobs.length }, 'alljobs query');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ query, err: String(err) }, 'alljobs query failed');
    }
  }
  return dedupById(all);
}
