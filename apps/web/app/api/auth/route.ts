import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import bcrypt from 'bcryptjs';
import { sessionOptions, type SessionData } from '../../../lib/session';

export async function POST(req: NextRequest) {
  const { password } = (await req.json()) as { password: string };
  const hash = process.env['APP_PASSWORD_HASH'];

  if (!hash || !(await bcrypt.compare(password, hash).catch(() => false))) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isLoggedIn = true;
  await session.save();
  return res;
}

export async function DELETE(req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  const session = await getIronSession<SessionData>(req, res, sessionOptions);
  session.isLoggedIn = false;
  await session.save();
  return res;
}
