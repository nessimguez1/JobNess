import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '../../../../lib/session';

export async function POST(req: NextRequest) {
  const res = NextResponse.next();
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const scraperUrl = process.env['SCRAPER_URL'];
  const secret = process.env['SCRAPER_SHARED_SECRET'];
  if (!scraperUrl || !secret) {
    return NextResponse.json({ error: 'Scraper not configured' }, { status: 503 });
  }

  const target = `${scraperUrl.replace(/\/$/, '')}/run`;

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: 'POST',
      headers: { 'x-auth': secret },
    });
  } catch (err) {
    return NextResponse.json({
      error: `Network error reaching scraper at ${target}: ${err instanceof Error ? err.message : String(err)}`,
    }, { status: 502 });
  }

  const raw = await upstream.text();

  if (!upstream.ok) {
    if (upstream.status === 401) {
      return NextResponse.json({
        error: 'Scraper rejected auth — SCRAPER_SHARED_SECRET on Vercel does not match Railway',
      }, { status: 401 });
    }
    return NextResponse.json({
      error: `Scraper returned ${upstream.status}: ${raw.slice(0, 200) || '(empty body)'}`,
    }, { status: upstream.status });
  }

  try {
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({
      error: `Scraper returned non-JSON body: ${raw.slice(0, 200)}`,
    }, { status: 502 });
  }
}
