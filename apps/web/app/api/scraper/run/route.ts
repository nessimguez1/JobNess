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

  const upstream = await fetch(`${scraperUrl}/run`, {
    method: 'POST',
    headers: { 'x-auth': secret },
  });

  return NextResponse.json(await upstream.json(), { status: upstream.status });
}
