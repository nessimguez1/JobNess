import type { SessionOptions } from 'iron-session';

export interface SessionData {
  isLoggedIn?: boolean;
}

export const sessionOptions: SessionOptions = {
  password: process.env['SESSION_SECRET'] ?? 'fallback-dev-secret-change-in-prod-32ch',
  cookieName: 'jobness_session',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 30,
  },
};
