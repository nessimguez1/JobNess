import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import {
  extractJobPostingsFromHtml,
  extractJobsFromAnchors,
  fetchHtml,
  dedupById,
} from '../utils/json-ld.js';

// ─── JobMaster (jobmaster.co.il) ──────────────────────────────────────────
//
// Server-rendered ASP page. No JSON-LD. Job-detail anchors match:
//   /jobs/checknum.asp?key={ID}
// Titles are the visible anchor text — enough for the scorer to triage.

const BASE = 'https://www.jobmaster.co.il';
const JOB_LINK_RE = /\/jobs\/checknum\.asp\?key=\d+/i;

const QUERIES = [
  'פיתוח עסקי',
  'מנהל לקוחות',
  'יועץ השקעות',
  'אנליסט',
  'קשרי משקיעים',
  'business development',
  'partnerships',
  'account manager',
  'analyst',
  'investor relations',
];

function searchUrl(query: string): string {
  return `${BASE}/jobs/?q=${encodeURIComponent(query)}`;
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const url = searchUrl(query);
  const html = await fetchHtml(url);
  if (!html) return [];

  // Try JSON-LD first (in case they add it later)
  const ld = extractJobPostingsFromHtml(html, 'JobMaster', url);
  if (ld.length > 0) return ld;

  // Fallback: anchor-pattern extraction
  return extractJobsFromAnchors(html, {
    source: 'JobMaster',
    baseUrl: BASE,
    linkPattern: JOB_LINK_RE,
  });
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
