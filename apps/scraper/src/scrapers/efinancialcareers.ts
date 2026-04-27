import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import {
  extractJobPostingsFromHtml,
  extractJobsFromAnchors,
  fetchHtml,
  dedupById,
} from '../utils/json-ld.js';

// ─── eFinancialCareers — finance-specialist board ────────────────────────
//
// Israel-only queries. Job detail URLs follow:
//   /jobs-Israel-{City}-{Title}.id{NumericID}
// Search results page: /search?location=Israel&q={keyword}
// Also: /jobs/remote/in-israel for remote-Israel listings.

const BASE = 'https://www.efinancialcareers.com';
const JOB_LINK_RE = /\/jobs-[A-Za-z_-]+\.id\d+/;

const QUERIES = [
  'relationship manager',
  'private banker',
  'wealth manager',
  'family office',
  'investment advisor',
  'investor relations',
  'business development',
  'account manager',
  'financial analyst',
  'treasury',
  'partnerships',
];

function israelSearchUrl(query: string, page: number): string {
  const params = new URLSearchParams({ q: query, location: 'Israel', page: String(page) });
  return `${BASE}/search?${params}`;
}

const REMOTE_ISRAEL_URL = `${BASE}/jobs/remote/in-israel`;

async function fetchPage(url: string): Promise<ScrapedJob[]> {
  const html = await fetchHtml(url, 14_000);
  if (!html) return [];
  const ld = extractJobPostingsFromHtml(html, 'eFinancialCareers', url);
  if (ld.length > 0) return ld;
  return extractJobsFromAnchors(html, {
    source: 'eFinancialCareers',
    baseUrl: BASE,
    linkPattern: JOB_LINK_RE,
    defaultLocation: 'Israel',
  });
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const out: ScrapedJob[] = [];
  for (let page = 1; page <= 2; page++) {
    const jobs = await fetchPage(israelSearchUrl(query, page));
    if (jobs.length === 0) break;
    out.push(...jobs);
    await new Promise(r => setTimeout(r, 1200)); // polite pacing
  }
  return out;
}

export async function run(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];

  // Per-keyword Israel-targeted searches
  for (const query of QUERIES) {
    try {
      const jobs = await fetchQuery(query);
      logger.info({ query, count: jobs.length }, 'efinancialcareers query');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ query, err: String(err) }, 'efinancialcareers query failed');
    }
  }

  // Plus the remote-Israel landing page (no keyword filter)
  try {
    const remote = await fetchPage(REMOTE_ISRAEL_URL);
    logger.info({ count: remote.length }, 'efinancialcareers remote-israel');
    all.push(...remote);
  } catch (err) {
    logger.warn({ err: String(err) }, 'efinancialcareers remote-israel failed');
  }

  return dedupById(all);
}
