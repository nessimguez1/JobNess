import { parse } from 'node-html-parser';
import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';

const BASE = 'https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search';

const QUERIES = [
  'software engineer',
  'backend engineer',
  'fullstack engineer',
  'python developer',
  'fintech engineer',
  'algorithmic trading developer',
  'quantitative developer',
];

const GEO_ID = '101570771';   // Tel Aviv-Yafo metro anchor
const DISTANCE = '25';         // miles ≈ 40km — covers TLV, Herzliya, Ra'anana, Netanya, Petah Tikva, Holon, Rishon, Ramat Gan

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function parseRelativeTime(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const t = text.toLowerCase().trim();
  const n = parseInt(t, 10);
  if (isNaN(n)) return undefined;
  const now = Date.now();
  if (t.includes('minute')) return new Date(now - n * 60_000).toISOString();
  if (t.includes('hour'))   return new Date(now - n * 3_600_000).toISOString();
  if (t.includes('day'))    return new Date(now - n * 86_400_000).toISOString();
  if (t.includes('week'))   return new Date(now - n * 604_800_000).toISOString();
  return undefined;
}

async function fetchPage(query: string): Promise<ScrapedJob[]> {
  const url = new URL(BASE);
  url.searchParams.set('keywords', query);
  url.searchParams.set('geoId', GEO_ID);
  url.searchParams.set('distance', DISTANCE);
  url.searchParams.set('f_TPR', 'r86400');
  url.searchParams.set('start', '0');

  let html: string;
  try {
    const res = await fetch(url.toString(), { headers: HEADERS });
    if (res.status === 429) {
      logger.warn({ query }, 'LinkedIn rate limited — skipping query');
      return [];
    }
    if (!res.ok) {
      logger.warn({ query, status: res.status }, 'LinkedIn fetch non-ok');
      return [];
    }
    html = await res.text();
  } catch (err) {
    logger.warn({ err, query }, 'LinkedIn fetch error');
    return [];
  }

  const root = parse(html);
  const jobs: ScrapedJob[] = [];

  for (const li of root.querySelectorAll('li')) {
    try {
      const urn = li.getAttribute('data-entity-urn') ?? '';
      const jobId = urn.split(':').pop();

      const title   = li.querySelector('.base-search-card__title')?.text.trim();
      const company = li.querySelector('.base-search-card__subtitle')?.text.trim();
      const loc     = li.querySelector('.job-search-card__location')?.text.trim();

      const timeEl  = li.querySelector('time');
      const relTime = timeEl?.getAttribute('datetime')
                   ?? li.querySelector('.job-search-card__listdate')?.text.trim();

      const href   = li.querySelector('a.base-card__full-link')?.getAttribute('href') ?? '';
      const jobUrl = href.split('?')[0];

      if (!jobId || !title || !company || !jobUrl) continue;

      const job: ScrapedJob = {
        id: `linkedin_${jobId}`,
        title,
        company,
        source: 'LinkedIn',
        url: jobUrl,
      };
      if (loc) job.location = loc;
      const posted = parseRelativeTime(relTime) ?? relTime;
      if (posted) job.posted_at = posted;

      jobs.push(job);
    } catch {
      // skip malformed card
    }
  }

  return jobs;
}

export async function run(): Promise<ScrapedJob[]> {
  const allJobs: ScrapedJob[][] = [];

  for (let i = 0; i < QUERIES.length; i += 4) {
    const batch = QUERIES.slice(i, i + 4);
    const results = await Promise.all(batch.map(async q => {
      const page = await fetchPage(q);
      await sleep(1_200);
      return page;
    }));
    allJobs.push(...results);
  }

  const seen = new Set<string>();
  const unique: ScrapedJob[] = [];
  for (const page of allJobs) {
    for (const job of page) {
      if (!seen.has(job.id)) {
        seen.add(job.id);
        unique.push(job);
      }
    }
  }

  logger.info({ total: unique.length, queries: QUERIES.length }, 'LinkedIn jobs fetched');
  return unique;
}
