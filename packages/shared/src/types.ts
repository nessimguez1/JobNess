export type JobColumn = 'inbox' | 'interested' | 'applied' | 'archive';
export type JobStatus = 'new' | 'interested' | 'applied' | 'rejected';
export type JobSource = 'LinkedIn' | 'CareerPage' | 'Drushim' | 'HiddenMarket';
export type ScrapeRunStatus = 'running' | 'ok' | 'failed';
export type TargetPriority = 'high' | 'med' | 'low';

/** Raw job as returned by a scraper before scoring */
export interface ScrapedJob {
  id: string;
  title: string;
  company: string;
  mono?: string;
  location?: string;
  salary_text?: string;
  salary_nis?: number;
  source: JobSource;
  url: string;
  company_site?: string;
  company_linkedin?: string;
  hm_linkedin?: string;
  posted_at?: string;
  description?: string;
}

/** Scoring result returned by Claude */
export interface Scoring {
  score: number;
  fit_note: string;
  match_bullets: string[];
}

/** Full job row as stored in Supabase */
export interface Job extends ScrapedJob {
  score: number;
  fit_note?: string;
  match_bullets?: string[];
  column_name: JobColumn;
  status: JobStatus;
  applied_at?: string;
  trashed_at?: string;
  created_at: string;
  updated_at: string;
}

/** Target company row */
export interface Target {
  id: string;
  name: string;
  mono?: string;
  type?: string;
  location?: string;
  website?: string;
  linkedin?: string;
  notes?: string;
  priority: TargetPriority;
  created_at: string;
}

/** Settings row (always id = 1) */
export interface Settings {
  id: 1;
  min_salary_nis: number;
  role_focus: string[];
  geo: string[];
  last_sync_at?: string;
}

/** Scrape audit row */
export interface ScrapeRun {
  id: number;
  source: string;
  started_at: string;
  completed_at?: string;
  jobs_found: number;
  jobs_new: number;
  status: ScrapeRunStatus;
  error?: string;
}
