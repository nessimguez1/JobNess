import type { ScrapedJob } from '@jobness/shared';
import { jobId, mono } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

const BASE = 'https://www.drushim.co.il';

// Queries in English and Hebrew targeting Nessim's role profile
const QUERIES = [
  'business development',
  'account manager',
  'partnerships',
  'investor relations',
  'treasury analyst',
  'relationship manager',
  'fintech analyst',
  'venture capital analyst',
  'פיתוח עסקי',      // business development (Hebrew)
  'מנהל תיקים',      // portfolio/account manager (Hebrew)
  'אנליסט פיננסי',   // financial analyst (Hebrew)
];

// Possible shapes from Drushim's JSON API
interface DrushimItem {
  id?: number;
  jobId?: number;
  title?: string;
  jobTitle?: string;
  companyName?: string;
  company?: string;
  cityName?: string;
  city?: string;
  location?: string;
  publishDate?: string;
  createdAt?: string;
  updatedAt?: string;
  jobUrl?: string;
  url?: string;
  slug?: string;
  description?: string;
  snippet?: string;
  shortDescription?: string;
}

type DrushimResponse =
  | DrushimItem[]
  | { jobs?: DrushimItem[]; results?: DrushimItem[]; data?: DrushimItem[]; items?: DrushimItem[]; total?: number };

function toScrapedJob(raw: DrushimItem): ScrapedJob | null {
  const title    = raw.title ?? raw.jobTitle;
  const company  = raw.companyName ?? raw.company;
  const rawId    = raw.jobId ?? raw.id;
  if (!title || !rawId) return null;

  const location = raw.cityName ?? raw.city ?? raw.location ?? 'Israel';
  const url      = raw.jobUrl ?? raw.url ?? `${BASE}/job/${rawId}/${raw.slug ?? ''}`;
  const posted   = raw.publishDate ?? raw.createdAt ?? raw.updatedAt;
  const desc     = raw.description ?? raw.snippet ?? raw.shortDescription;

  return {
    id:       jobId(company ?? 'unknown', title, location),
    title,
    company:  company ?? 'Unknown',
    mono:     mono(company ?? '??'),
    location,
    source:   'Drushim',
    url,
    ...(posted ? { posted_at: new Date(posted).toISOString() } : {}),
    ...(desc   ? { description: desc.slice(0, 2000) } : {}),
  };
}

function extractItems(data: DrushimResponse): DrushimItem[] {
  if (Array.isArray(data)) return data;
  return data.jobs ?? data.results ?? data.data ?? data.items ?? [];
}

async function fetchQuery(query: string): Promise<ScrapedJob[]> {
  const params = new URLSearchParams({ q: query, cityId: '0', pageSize: '50', pageIndex: '1' });

  // Try known Drushim API endpoint patterns in order
  const candidates = [
    `${BASE}/api/jobs/search?${params}`,
    `${BASE}/api/v2/jobs/search?${params}`,
    `${BASE}/api/search/jobs?${params}`,
    `${BASE}/api/v1/jobs?${params}`,
  ];

  for (const endpoint of candidates) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'Mozilla/5.0 (compatible; JobNess/1.0)',
          Referer: BASE,
        },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) continue;
      const ct = res.headers.get('content-type') ?? '';
      if (!ct.includes('application/json')) continue;

      const data = (await res.json()) as DrushimResponse;
      const items = extractItems(data);
      if (items.length === 0) continue;

      logger.debug({ endpoint, query, count: items.length }, 'drushim endpoint hit');
      return items.flatMap(r => { const j = toScrapedJob(r); return j ? [j] : []; });
    } catch {
      // try next candidate
    }
  }

  // Fallback: HTML page — extract job IDs from href="/job/{id}/" patterns
  return fetchHtmlFallback(query);
}

async function fetchHtmlFallback(query: string): Promise<ScrapedJob[]> {
  try {
    const url = `${BASE}/jobs/?q=${encodeURIComponent(query)}&cityid=0`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; JobNess/1.0)' },
      signal: AbortSignal.timeout(12_000),
    });
    if (!res.ok) return [];
    const html = await res.text();

    // Try JSON-LD (schema.org JobPosting) first
    const ldMatches = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];
    const jobs: ScrapedJob[] = [];

    for (const m of ldMatches) {
      try {
        const parsed = JSON.parse(m[1]!) as
          | { '@type'?: string; title?: string; hiringOrganization?: { name?: string }; jobLocation?: { address?: { addressLocality?: string } }; url?: string; datePosted?: string; description?: string }
          | Array<unknown>;
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (typeof item !== 'object' || item === null) continue;
          const obj = item as Record<string, unknown>;
          if (obj['@type'] !== 'JobPosting') continue;
          const title    = obj['title'] as string | undefined;
          const company  = (obj['hiringOrganization'] as { name?: string } | undefined)?.name;
          const loc      = ((obj['jobLocation'] as { address?: { addressLocality?: string } } | undefined)?.address?.addressLocality) ?? 'Israel';
          const jobUrl   = obj['url'] as string | undefined ?? url;
          const posted   = obj['datePosted'] as string | undefined;
          const desc     = obj['description'] as string | undefined;
          if (!title) continue;
          jobs.push({
            id:      jobId(company ?? 'unknown', title, loc),
            title,
            company: company ?? 'Unknown',
            mono:    mono(company ?? '??'),
            location: loc,
            source:  'Drushim',
            url:     jobUrl,
            ...(posted ? { posted_at: new Date(posted).toISOString() } : {}),
            ...(desc   ? { description: desc.replace(/<[^>]*>/g, ' ').trim().slice(0, 2000) } : {}),
          });
        }
      } catch { /* malformed JSON-LD */ }
    }

    if (jobs.length > 0) return jobs;

    // Last resort: extract job IDs from href patterns like /job/12345/
    const hrefMatches = [...html.matchAll(/href="(\/job\/(\d+)\/[^"]*?)"/g)];
    return hrefMatches.map(m => ({
      id:       jobId('Drushim', `job-${m[2]}`, 'Israel'),
      title:    `Job ${m[2]}`,
      company:  'Unknown',
      mono:     '??',
      location: 'Israel',
      source:   'Drushim',
      url:      `${BASE}${m[1]}`,
    }));
  } catch (err) {
    logger.warn({ query, err }, 'drushim html fallback failed');
    return [];
  }
}

export async function run(): Promise<ScrapedJob[]> {
  const all: ScrapedJob[] = [];

  for (const query of QUERIES) {
    try {
      const jobs = await fetchQuery(query);
      logger.info({ query, count: jobs.length }, 'drushim query');
      all.push(...jobs);
    } catch (err) {
      logger.warn({ query, err }, 'drushim query failed');
    }
  }

  // Deduplicate by ID
  const seen = new Set<string>();
  return all.filter(j => {
    if (seen.has(j.id)) return false;
    seen.add(j.id);
    return true;
  });
}
