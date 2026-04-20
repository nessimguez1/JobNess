import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '../../../../lib/session';
import OpenAI from 'openai';

type EmailType = 'cold' | 'warm' | 'linkedin';

const NESSIM = `NESSIM'S PROFILE:
- RM at UBP (Swiss private bank), Tel Aviv — French-speaking HNWI desk, Israel–France corridor.
- IATI project coordinator — 100+ Israeli tech companies.
- Native trilingual: French, English, Hebrew.
- BD background: real estate 2yr, tech ecosystem 1yr, wealth management 1yr+.
- MA Finance (Ono Academic), BA Business Admin (Reichman/IDC).
- 26 years old, Tel Aviv. Target: fintech BD, RM, partnerships, VC/PE analyst roles.`;

const COLD_SYSTEM = `You are drafting a cold outreach email on behalf of Nessim Guez for a specific job opening.

TONE: Professional but direct. Not corporate. Confident. Gets to the point in the first sentence.

STRUCTURE — write in this exact order, no section headers:
1. Opening (2 sentences): who Nessim is + one specific reason why this company/role caught his attention. Reference the company by name and their known focus.
2. Three accomplishment bullets (use "•"):
   • Each bullet = one concrete reason he's a fit, in outcome language
   • At least one should echo wording from the job description
3. One sentence: what he's looking for, framed as value he adds — not career goals
4. CTA (exactly): "Would you be open to a brief 15-minute call next week to explore fit?"
5. Sign-off: "Best,\\nNessim Guez\\nlinkedin.com/in/nessim-guez-0519411b8 | +972 54 649 5846"

LENGTH: 130–170 words excluding sign-off. Mobile-readable.
AVOID: "I'm very passionate", "I believe I'd be a great fit", "dream company", multiple asks, vague adjectives without proof.

${NESSIM}

Return ONLY the email body. No subject line. No markdown. No section headers.`;

const WARM_SYSTEM = `You are writing a warm outreach email on behalf of Nessim Guez.

TONE: peer-to-peer. Confident, curious, human — NOT a job application. Like someone reaching out to a person they genuinely respect, having done their homework. No corporate language. Conversational, slightly direct, never needy.

DO NOT use bullet points or headers. Write in flowing prose with short paragraphs.
LENGTH: 110–150 words. Must be readable on mobile.

STRUCTURE (no labels, just prose):
1. Opening: reference what the recipient wrote/did and why it landed with Nessim's world (1–2 sentences)
2. Proof: weave in 2–3 concrete credentials naturally — no list (2–3 sentences)
3. Intent: what he's exploring, framed as mutual discovery — not desperation (1 sentence)
4. CTA: one casual but specific ask (1 sentence)

Sign-off: "— Nessim" then a blank line then "linkedin.com/in/nessim-guez-0519411b8 | +972 54 649 5846"

${NESSIM}

Return ONLY the email body. No subject line. No markdown. No labels or section headers.`;

const LINKEDIN_SYSTEM = `You are writing a LinkedIn DM on behalf of Nessim Guez.

TONE: direct, warm, human. Like a smart person reaching out — not a recruiter template. Punchy.
LENGTH: 60–90 words. Short paragraphs separated by blank lines. No bullets. No headers.

STRUCTURE (pure prose):
1. One sentence: what specifically caught his attention about this role or company — reference the company by name
2. Two sentences: who he is + one concrete credential that's directly relevant
3. One sentence CTA: 15-min call next week

Sign-off: "— Nessim\\nlinkedin.com/in/nessim-guez-0519411b8"

${NESSIM}

Return ONLY the message body. No markdown. No headers.`;

const SYSTEM: Record<EmailType, string> = {
  cold: COLD_SYSTEM,
  warm: WARM_SYSTEM,
  linkedin: LINKEDIN_SYSTEM,
};

function buildUserMessage(body: {
  title: string; company: string; fit_note?: string;
  match_bullets?: string[]; context?: string; type: EmailType;
}): string {
  const lines = [
    'JOB:',
    `Title: ${body.title}`,
    `Company: ${body.company}`,
    `Fit note: ${body.fit_note ?? 'n/a'}`,
    `Match points: ${(body.match_bullets ?? []).join(' | ')}`,
  ];
  if (body.context?.trim()) {
    const label = body.type === 'warm' ? 'WHAT THE RECIPIENT WROTE / DID' : 'ADDITIONAL CONTEXT';
    lines.push('', `${label}:`, body.context.trim());
  }
  lines.push('', 'Write the email now.');
  return lines.join('\n');
}

let _groq: OpenAI | undefined;
let _openai: OpenAI | undefined;

function groq() {
  if (!_groq) _groq = new OpenAI({ apiKey: process.env['GROQ_API_KEY']!, baseURL: 'https://api.groq.com/openai/v1' });
  return _groq;
}
function openai() {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
  return _openai;
}

async function generate(system: string, userMsg: string): Promise<string> {
  const params = {
    max_tokens: 500,
    temperature: 0.7,
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user'   as const, content: userMsg },
    ],
  };
  try {
    const res = await groq().chat.completions.create({ ...params, model: 'llama-3.3-70b-versatile' });
    const text = res.choices[0]?.message.content?.trim() ?? '';
    if (!text) throw new Error('empty groq response');
    return text;
  } catch {
    const res = await openai().chat.completions.create({ ...params, model: 'gpt-4o-mini' });
    const text = res.choices[0]?.message.content?.trim() ?? '';
    if (!text) throw new Error('empty openai response');
    return text;
  }
}

export async function POST(req: NextRequest) {
  const ironRes = NextResponse.next();
  const session = await getIronSession<SessionData>(req, ironRes, sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await req.json() as {
    type?: EmailType; title?: string; company?: string;
    fit_note?: string; match_bullets?: string[]; context?: string;
  };

  const { type, title, company, fit_note, match_bullets, context } = payload;
  if (!type || !title || !company) {
    return NextResponse.json({ error: 'type, title, and company are required' }, { status: 400 });
  }
  if (type === 'warm' && !context?.trim()) {
    return NextResponse.json({ error: 'context is required for warm emails' }, { status: 400 });
  }

  const groqKey   = process.env['GROQ_API_KEY'];
  const openaiKey = process.env['OPENAI_API_KEY'];
  if (!groqKey && !openaiKey) {
    return NextResponse.json({ error: 'No LLM API key configured' }, { status: 503 });
  }

  try {
    const msg: Parameters<typeof buildUserMessage>[0] = { type, title, company };
    if (fit_note)      msg.fit_note      = fit_note;
    if (match_bullets) msg.match_bullets = match_bullets;
    if (context)       msg.context       = context;
    const body = await generate(SYSTEM[type], buildUserMessage(msg));
    return NextResponse.json({ body });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
