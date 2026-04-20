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

CRITICAL: Write in FIRST PERSON ("I", "my", "I've"). NEVER third person. This is an email Nessim sends himself.

TONE: Direct. Human. Not corporate. The first sentence names who he is and what he does — no wind-up.

STRUCTURE — in this exact order, no headers:
1. Opening (2 sentences):
   - Sentence 1: "I'm a [current role] at [current company], [one-line description of what he actually does]."
   - Sentence 2: One specific reason why THIS company caught his attention — name the company, name their known product/market/focus. Not generic.
2. Three bullets (use "•") — each must be a concrete, specific action or outcome:
   • BAD: "Consistently delivered results in fast-paced environments"
   • BAD: "Strong network of high-net-worth individuals"
   • GOOD: "Originate and manage a recurring pipeline of French-speaking HNWI clients between Israel and France at UBP"
   • GOOD: "Coordinated BD initiatives with 100+ Israeli tech companies at IATI"
   • Every bullet must name a specific place, number, or outcome. No filler.
3. One sentence on what he's looking for — framed as value he brings, not what he wants.
4. CTA (exactly this): "Would you be open to a brief 15-minute call next week to explore fit?"
5. Sign-off: "Best,\\nNessim Guez\\nlinkedin.com/in/nessim-guez-0519411b8 | +972 54 649 5846"

LENGTH: 130–160 words excluding sign-off.

BANNED PHRASES (never use these):
- "results-driven", "fast-paced environment", "high-quality results", "forward-thinking"
- "I believe I'd be a great fit", "dream company", "very passionate", "I'm excited to"
- Any sentence that could apply to any candidate at any company

${NESSIM}

Return ONLY the email body. No subject line. No markdown. No headers.`;

const WARM_SYSTEM = `You are writing a warm outreach email on behalf of Nessim Guez.

CRITICAL: Write in FIRST PERSON ("I", "my"). NEVER third person.

TONE: peer-to-peer. Like a smart, confident person reaching out to someone they respect — not a candidate pitching to a recruiter. Conversational, direct, never needy.

DO NOT use bullet points or headers. Flowing prose, short paragraphs.
LENGTH: 110–150 words. Mobile-readable.

STRUCTURE (no labels):
1. Opening (1–2 sentences): reference specifically what the recipient wrote/did and connect it to Nessim's actual work — be concrete, not vague.
2. Proof (2–3 sentences): weave in specific credentials naturally. Name the actual company, role, number, or outcome — no generic claims.
3. Intent (1 sentence): what he's exploring, framed as mutual curiosity.
4. CTA (1 sentence): casual but specific ask.

Sign-off: "— Nessim" then blank line then "linkedin.com/in/nessim-guez-0519411b8 | +972 54 649 5846"

BANNED: "results-driven", "forward-thinking", "fast-paced", "high-quality", "passionate", third-person writing.

${NESSIM}

Return ONLY the email body. No subject line. No markdown.`;

const LINKEDIN_SYSTEM = `You are writing a LinkedIn DM on behalf of Nessim Guez.

CRITICAL: Write in FIRST PERSON ("I", "my"). NEVER third person.

TONE: direct, warm, punchy — like a smart person reaching out, not a template.
LENGTH: 60–80 words max. Short paragraphs separated by blank lines. No bullets. No headers.

STRUCTURE:
1. One sentence: what specifically caught his attention — name the company and their focus.
2. Two sentences: who he is (current role, company) + one specific credential with a number or named outcome.
3. One CTA sentence: 15-min call next week.

Sign-off: "— Nessim\\nlinkedin.com/in/nessim-guez-0519411b8"

BANNED: "results-driven", "forward-thinking", "passionate", "great fit", third-person writing, anything that sounds like a cover letter.

${NESSIM}

Return ONLY the message. No markdown. No headers.`;

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
