import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import {
  extractJobPostingsFromHtml,
  extractJobsFromAnchors,
  fetchHtml,
  dedupById,
} from '../utils/json-ld.js';

// ─── AllJobs (alljobs.co.il) — Israel's broadest job board ────────────────
//
// ASP.NET site. Real search endpoint: /SearchResultsGuest.aspx
// (Default.aspx returns a 404). Job-detail anchors look like:
//   /jobs/PositionDetailsAccount.aspx?PositionId={ID}
//   /jobs/PositionDetailsGuest.aspx?PositionId={ID}
// We accept either pattern.

const BASE = 'https://www.alljobs.co.il';
const JOB_LINK_RE = /\/jobs\/PositionDetails(Account|Guest)\.aspx\?PositionId=\d+/i;

const QUERIES = [
  'פיתוח עסקי',
  'מנהל לקוחות',
  'שותפויות',
  'יועץ השקעות',
  'מנהל קשרי לקוחות',
  'אנליסט',
  'יועץ לקוחות',
  'business development',
  'partnerships',
  'account manager',
  'relationship manager',
  'investor relations',
];

function searchUrl(query: string, page: number): string {
  const params = new URLSearchParams({ page: String(page), freetext: query });
  return `${BASE}/SearchResultsGuest.aspx?${params}`;
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const out: ScrapedJob[] = [];
  for (let page = 1; page <= 2; page++) {
    const url = searchUrl(query, page);
    // AllJobs is slow — needs >12s default timeout
    const html = await fetchHtml(url, 30_000);
    if (!html) break;

    const ld = extractJobPostingsFromHtml(html, 'AllJobs', url);
    const anchors = extractJobsFromAnchors(html, {
      source: 'AllJobs',
      baseUrl: BASE,
      linkPattern: JOB_LINK_RE,
    });
    const merged = dedupById([...ld, ...anchors]);
    if (merged.length === 0) break;
    out.push(...merged);
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
