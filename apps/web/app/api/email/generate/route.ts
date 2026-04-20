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

const COLD_SYSTEM = `You are drafting a cold outreach email that Nessim Guez will send himself. Write as Nessim, in first person.

Here is a perfect example of the output format and tone:

---
Hi [First Name],

I'm a Relationship Manager at UBP in Tel Aviv, where I originate and manage a French-speaking HNWI client base between Israel and France. SimilarWeb's enterprise push into French-speaking markets is exactly the territory I work in daily.

• Currently managing a recurring pipeline of French-speaking HNWI clients across the Israel–France corridor at UBP (Union Bancaire Privée).
• Coordinated commercial initiatives with 100+ Israeli tech companies at IATI — the same ecosystem of companies that [company]'s target customers come from.
• Native trilingual (French, English, Hebrew) — built to cover French-speaking enterprise accounts from day one.

I'm looking for an AE or BD role where French-market access and relationship-first selling translate into measurable pipeline from week one.

Would you be open to a brief 15-minute call next week to explore fit?

Best,
Nessim Guez
linkedin.com/in/nessim-guez-0519411b8 | +972 54 649 5846
---

Follow this format exactly. Adapt the content to the actual job and company provided. Keep the same tone, length, and structure.

RULES:
- First person only ("I", "my"). Never "Nessim Guez is..." or "He is..."
- Every bullet must name a specific company, number, or outcome — no generic claims
- Opening sentence 2 must name the company and their specific market/product focus
- Never use: "results-driven", "fast-paced", "forward-thinking", "high-quality", "passionate", "great fit", "excited to"

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

const SUBJECT_SYSTEM = `You are writing an email subject line for Nessim Guez.

Given the job title, company, and email type, write ONE subject line only. No quotes, no markdown, no explanation.

For cold emails: hook on the company's specific market/product angle. Max 10 words.
  Example: "SimilarWeb's French-speaking enterprise push — Nessim Guez"

For warm emails: reference what the recipient wrote or did, in brackets. Max 12 words.
  Example: "[Your post on private wealth distribution] — Nessim Guez"

Return only the subject line text. Nothing else.`;

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
  description?: string; company_site?: string;
}): string {
  const lines = [
    'JOB:',
    `Title: ${body.title}`,
    `Company: ${body.company}`,
    ...(body.company_site ? [`Company site: ${body.company_site}`] : []),
    `Fit note: ${body.fit_note ?? 'n/a'}`,
    `Match points: ${(body.match_bullets ?? []).join(' | ')}`,
  ];
  if (body.description?.trim()) {
    const snippet = body.description.trim().slice(0, 800);
    lines.push('', 'JOB DESCRIPTION (excerpt):', snippet);
  }
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

const TEMPERATURE: Record<EmailType, number> = { cold: 0.35, warm: 0.65, linkedin: 0.65 };

async function generate(system: string, userMsg: string, type: EmailType): Promise<string> {
  const params = {
    max_tokens: 600,
    temperature: TEMPERATURE[type],
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user'   as const, content: userMsg },
    ],
  };
  // GPT-4o-mini primary — better instruction following for stylistic tasks
  try {
    const res = await openai().chat.completions.create({ ...params, model: 'gpt-4o-mini' });
    const text = res.choices[0]?.message.content?.trim() ?? '';
    if (!text) throw new Error('empty openai response');
    return text;
  } catch {
    const res = await groq().chat.completions.create({ ...params, model: 'llama-3.3-70b-versatile' });
    const text = res.choices[0]?.message.content?.trim() ?? '';
    if (!text) throw new Error('empty groq response');
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
    description?: string; company_site?: string;
  };

  const { type, title, company, fit_note, match_bullets, context, description, company_site } = payload;
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
    if (description)   msg.description   = description;
    if (company_site)  msg.company_site  = company_site;

    const userMsg = buildUserMessage(msg);
    const [body, subject] = await Promise.all([
      generate(SYSTEM[type], userMsg, type),
      type !== 'linkedin'
        ? generate(
            SUBJECT_SYSTEM,
            `Type: ${type}\nJob: ${title} at ${company}\n${context ? `Context: ${context}` : ''}`,
            type,
          )
        : Promise.resolve(''),
    ]);
    return NextResponse.json({ body, subject });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
