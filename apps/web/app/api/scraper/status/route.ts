import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '../../../../lib/session';
import { supabase } from '../../../../lib/supabase';
import type { ScrapeRun } from '@jobness/shared';

export async function GET(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase.from('scrape_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(40);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as ScrapeRun[];

  // Collapse to one row per source — the latest started_at wins.
  const latestPerSource = new Map<string, ScrapeRun>();
  for (const r of rows) {
    if (!latestPerSource.has(r.source)) latestPerSource.set(r.source, r);
  }
  const sources = [...latestPerSource.values()]
    .sort((a, b) => a.source.localeCompare(b.source));

  const is_running = sources.some(s => s.status === 'running');

  let last_started_at: string | null = null;
  let last_completed_at: string | null = null;
  let total_jobs_new = 0;
  let total_jobs_found = 0;
  for (const s of sources) {
    total_jobs_new   += s.jobs_new   ?? 0;
    total_jobs_found += s.jobs_found ?? 0;
    if (!last_started_at || s.started_at > last_started_at) last_started_at = s.started_at;
    if (s.completed_at && (!last_completed_at || s.completed_at > last_completed_at)) {
      last_completed_at = s.completed_at;
    }
  }

  return NextResponse.json({
    is_running,
    last_started_at,
    last_completed_at,
    total_jobs_new,
    total_jobs_found,
    sources,
  }, {
    headers: { 'cache-control': 'no-store' },
  });
}
