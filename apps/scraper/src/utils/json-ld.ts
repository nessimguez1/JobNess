import type { ScrapedJob, JobSource } from '@jobness/shared';
import { jobId, mono } from './hash.js';
import { logger } from './logger.js';

// ─────────────────────────────────────────────────────────────────────────────
// JSON-LD extractor for schema.org JobPosting microdata.
//
// Most modern job boards embed structured JobPosting data in <script
// type="application/ld+json"> blocks for SEO. This function parses every
// such block and yields ScrapedJob entries — robust to HTML structure
// changes since it relies on the standardized schema.org shape, not CSS
// selectors.
//
// Used by AllJobs, Globes, TheMarker, JobMaster, and eFinancialCareers
// scrapers. Each scraper just feeds in HTML pages from its own search URLs.
// ─────────────────────────────────────────────────────────────────────────────

interface JobPostingLD {
  '@type'?: string | string[];
  title?: string;
  hiringOrganization?: { name?: string } | string;
  jobLocation?:
    | { address?: { addressLocality?: string; addressCountry?: string | { name?: string } } }
    | Array<{ address?: { addressLocality?: string; addressCountry?: string | { name?: string } } }>;
  url?: string;
  datePosted?: string;
  description?: string;
  baseSalary?: {
    value?: { value?: number; minValue?: number; maxValue?: number; unitText?: string };
    currency?: string;
  };
}

function asArray<T>(v: T | T[] | undefined): T[] {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

function extractLocation(loc: JobPostingLD['jobLocation']): string {
  const arr = asArray(loc);
  for (const l of arr) {
    const city = l?.address?.addressLocality;
    if (city) return city;
  }
  // Fallback to country
  for (const l of arr) {
    const country = l?.address?.addressCountry;
    if (typeof country === 'string') return country;
    if (country?.name) return country.name;
  }
  return 'Israel';
}

function extractCompany(org: JobPostingLD['hiringOrganization']): string {
  if (!org) return 'Unknown';
  if (typeof org === 'string') return org;
  return org.name ?? 'Unknown';
}

function extractSalaryText(b: JobPostingLD['baseSalary']): string | undefined {
  if (!b?.value) return undefined;
  const { value, minValue, maxValue, unitText } = b.value;
  const unit = unitText ? `/${unitText.toLowerCase()}` : '';
  const cur  = b.currency ?? '';
  if (typeof value === 'number') return `${cur} ${value}${unit}`.trim();
  if (typeof minValue === 'number' && typeof maxValue === 'number') {
    return `${cur} ${minValue}–${maxValue}${unit}`.trim();
  }
  return undefined;
}

function isJobPosting(item: unknown): item is JobPostingLD {
  if (typeof item !== 'object' || item === null) return false;
  const t = (item as { '@type'?: string | string[] })['@type'];
  if (!t) return false;
  if (typeof t === 'string') return t === 'JobPosting';
  return t.includes('JobPosting');
}

function flatten(parsed: unknown): unknown[] {
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed.flatMap(flatten);
  if (typeof parsed === 'object') {
    const obj = parsed as Record<string, unknown>;
    // @graph wrapper from some schema.org implementations
    if (Array.isArray(obj['@graph'])) return obj['@graph'].flatMap(flatten);
    return [obj];
  }
  return [];
}

/** Extract ScrapedJob entries from any HTML string by parsing JSON-LD JobPosting blocks. */
export function extractJobPostingsFromHtml(html: string, source: JobSource, fallbackUrl: string): ScrapedJob[] {
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const out: ScrapedJob[] = [];
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const raw = match[1];
    if (!raw) continue;
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.trim());
    } catch {
      continue;
    }
    for (const item of flatten(parsed)) {
      if (!isJobPosting(item)) continue;
      const job = jobPostingToScrapedJob(item, source, fallbackUrl);
      if (job) out.push(job);
    }
  }
  return out;
}

function jobPostingToScrapedJob(j: JobPostingLD, source: JobSource, fallbackUrl: string): ScrapedJob | null {
  const title = j.title?.trim();
  if (!title) return null;
  const company = extractCompany(j.hiringOrganization);
  const location = extractLocation(j.jobLocation);
  const url = j.url ?? fallbackUrl;
  const description = j.description?.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
  const salaryText = extractSalaryText(j.baseSalary);

  const job: ScrapedJob = {
    id: jobId(company, title, location),
    title,
    company,
    mono: mono(company),
    location,
    source,
    url,
  };
  if (j.datePosted) {
    try { job.posted_at = new Date(j.datePosted).toISOString(); } catch { /* ignore */ }
  }
  if (description) job.description = description;
  if (salaryText)  job.salary_text = salaryText;
  return job;
}

// Real Chrome UA — many Israeli sites block the obvious "JobNess/1.0" UA
// with a generic 403 or empty result page. This matches a current Chrome
// build closely enough to pass naive bot filters.
const BROWSER_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

const BROWSER_HEADERS = {
  'User-Agent': BROWSER_UA,
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9,he;q=0.8,fr;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
};

/** Standard fetch with timeout + browser UA. Logs every failure visibly so we
 *  can diagnose blocked / redirected / captcha-walled scrapes from Railway logs. */
export async function fetchHtml(url: string, timeoutMs = 12_000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: BROWSER_HEADERS,
      signal: AbortSignal.timeout(timeoutMs),
      redirect: 'follow',
    });
    if (!res.ok) {
      logger.warn({ url, status: res.status }, 'fetchHtml non-200');
      return null;
    }
    const html = await res.text();
    if (html.length < 500) {
      logger.warn({ url, length: html.length, preview: html.slice(0, 200) }, 'fetchHtml suspiciously short');
    }
    return html;
  } catch (err) {
    logger.warn({ url, err: String(err) }, 'fetchHtml threw');
    return null;
  }
}

/** Dedup an array of ScrapedJobs by id, preserving first occurrence. */
export function dedupById(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  const out: ScrapedJob[] = [];
  for (const j of jobs) {
    if (seen.has(j.id)) continue;
    seen.add(j.id);
    out.push(j);
  }
  return out;
}

// ─── HTML anchor-pattern extractor ───────────────────────────────────────
//
// For sites that don't expose JSON-LD JobPosting microdata (most Israeli
// boards: JobMaster, AllJobs, etc.) we extract the visible <a> tag text
// pointing at job-detail URLs. The title alone is enough for the LLM
// scorer to triage; the user clicks through to the URL for full context.
//
// `linkPattern` is a regex that matches the relative or absolute URL of
// a job detail page. The captured anchor's inner text is treated as the
// title.

interface AnchorJobOptions {
  source: JobSource;
  baseUrl: string;
  /** Regex matching the href of a job-detail link. Should have one capture group: the captured href. */
  linkPattern: RegExp;
  /** Default company name when not extractable from the page. */
  defaultCompany?: string;
  /** Default location when not extractable. */
  defaultLocation?: string;
}

export function extractJobsFromAnchors(html: string, opts: AnchorJobOptions): ScrapedJob[] {
  const { source, baseUrl, linkPattern, defaultCompany = 'Unknown', defaultLocation = 'Israel' } = opts;
  // Match <a ... href="..."> ... </a> where href satisfies linkPattern
  const anchorRe = /<a\b[^>]*?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const out: ScrapedJob[] = [];
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html)) !== null) {
    const href = m[1];
    const inner = m[2];
    if (!href || !inner) continue;
    if (!linkPattern.test(href)) continue;

    // Extract visible text (strip nested tags + collapse whitespace)
    const title = inner
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&#x?[0-9a-f]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title || title.length < 3 || title.length > 200) continue;

    const fullUrl = href.startsWith('http')
      ? href
      : href.startsWith('/')
        ? new URL(href, baseUrl).toString()
        : new URL(`/${href}`, baseUrl).toString();

    out.push({
      id: jobId(defaultCompany, title, defaultLocation),
      title,
      company: defaultCompany,
      mono: mono(defaultCompany),
      location: defaultLocation,
      source,
      url: fullUrl,
    });
  }
  return dedupById(out);
}
