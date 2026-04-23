import type { ScrapedJob } from '@jobness/shared';
import { CAREER_PAGES } from '../config/career-pages.js';
import { jobId, mono } from '../utils/hash.js';
import { logger } from '../utils/logger.js';

interface GreenhouseJob {
  id: number;
  title: string;
  location: { name: string };
  absolute_url: string;
  updated_at: string;
  content?: string;
}

interface GreenhouseResponse {
  jobs: GreenhouseJob[];
}

interface LeverJob {
  id: string;
  text: string;
  hostedUrl: string;
  categories: { location?: string; team?: string };
  createdAt: number;
  descriptionPlain?: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000);
}

async function fromGreenhouse(company: string, slug: string, website: string | undefined): Promise<ScrapedJob[]> {
  const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`);
  if (!res.ok) throw new Error(`Greenhouse ${slug}: HTTP ${res.status}`);
  const data = (await res.json()) as GreenhouseResponse;

  return data.jobs.map(j => {
    const job: ScrapedJob = {
      id: jobId(company, j.title, j.location.name),
      title: j.title,
      company,
      mono: mono(company),
      location: j.location.name,
      source: 'CareerPage',
      url: j.absolute_url,
      posted_at: j.updated_at,
    };
    if (website) job.company_site = website;
    if (j.content) job.description = stripHtml(j.content);
    return job;
  });
}

async function fromLever(company: string, slug: string, website: string | undefined): Promise<ScrapedJob[]> {
  const res = await fetch(`https://api.lever.co/v0/postings/${slug}?mode=json`);
  if (!res.ok) throw new Error(`Lever ${slug}: HTTP ${res.status}`);
  const data = (await res.json()) as LeverJob[];

  return data.map(j => {
    const location = j.categories.location ?? '';
    const job: ScrapedJob = {
      id: jobId(company, j.text, location),
      title: j.text,
      company,
      mono: mono(company),
      location,
      source: 'CareerPage',
      url: j.hostedUrl,
      posted_at: new Date(j.createdAt).toISOString(),
    };
    if (website) job.company_site = website;
    if (j.descriptionPlain) job.description = j.descriptionPlain.slice(0, 2000);
    return job;
  });
}

export async function run(): Promise<ScrapedJob[]> {
  const results: ScrapedJob[] = [];
  for (const target of CAREER_PAGES) {
    try {
      let jobs: ScrapedJob[] = [];
      if (target.ats === 'greenhouse') {
        jobs = await fromGreenhouse(target.company, target.slug, target.website);
      } else if (target.ats === 'lever') {
        jobs = await fromLever(target.company, target.slug, target.website);
      }
      logger.info(`career-pages scraped [${target.company}]: ${jobs.length} jobs`);
      results.push(...jobs);
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const e = err as any;
      const detail = e?.status ? `[${e.status}] ${e.message}` : (e?.message ?? String(err));
      logger.error(`career-pages scrape failed [${target.company}]: ${detail}`);
    }
  }
  return results;
}
