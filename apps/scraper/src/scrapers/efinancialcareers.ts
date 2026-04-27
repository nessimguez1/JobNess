import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';
import { extractJobPostingsFromHtml, fetchHtml, dedupById } from '../utils/json-ld.js';

// ─── eFinancialCareers — finance-specialist job board ─────────────────────
//
// Israel-only queries. Switzerland, UK, Singapore are excluded by Nessim's
// geo filter — don't pollute the queue with hard-fails.

const BASE = 'https://www.efinancialcareers.com';

// Israel-specific URL paths — eFC uses a /jobs-{Country}/{Role} convention.
const ISRAEL_ROLES = [
  'Relationship_Manager',
  'Private_Banker',
  'Wealth_Manager',
  'Family_Office',
  'Investment_Advisor',
  'Investor_Relations',
  'Business_Development',
  'Account_Manager',
  'Financial_Analyst',
  'Treasury_Analyst',
];

function israelUrl(role: string, page: number): string {
  return `${BASE}/jobs-Israel/${role}?page=${page}`;
}

async function fetchRole(role: string): Promise<ScrapedJob[]> {
  const out: ScrapedJob[] = [];
  for (let page = 1; page <= 3; page++) {
    const url = israelUrl(role, page);
    const html = await fetchHtml(url, 14_000);
    if (!html) break;
    const jobs = extractJobPostingsFromHtml(html, 'eFinancialCareers', url);
    if (jobs.length === 0) break;
    out.push(...jobs);
    // Polite pacing — eFC is sensitive to bursts
    await new Promise(r => setTimeout(r, 1500));
  }
  return out;
}

export async function run(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];
  for (const role of ISRAEL_ROLES) {
    try {
      const jobs = await fetchRole(role);
      logger.info({ role, count: jobs.length }, 'efinancialcareers role');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ role, err: String(err) }, 'efinancialcareers role failed');
    }
  }
  return dedupById(all);
}
