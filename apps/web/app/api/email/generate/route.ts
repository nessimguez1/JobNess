import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '../../../../lib/session';
import OpenAI from 'openai';

type EmailType = 'cold' | 'speculative' | 'warm' | 'linkedin';

// ─── Nessim's profile — single source of truth ─────────────────────────────
const NESSIM = `NESSIM'S PROFILE
- Current: Relationship Manager at UBP (Union Bancaire Privée — Swiss private bank), Tel Aviv office.
  Covers French-speaking HNWI clients on the Israel–France corridor.
- Prior: IATI (Israel Advanced Technology Industries) — coordinated commercial initiatives with 100+ Israeli tech companies.
  Tafnit Discount (wealth management, ~1yr). Real estate (2yr before tech).
- Education: MA Finance (Ono Academic), BA Business Administration (Reichman / IDC Herzliya).
- Languages: native French, English, Hebrew.
- Based in Tel Aviv, 26.
- Target: fintech BD, RM, partnerships, VC/PE analyst, investor relations.

ACCURACY RULE — critical:
Never invent numbers, AUM figures, client counts, portfolio company names, deal sizes, or revenue. If you don't know a specific, stay abstract. "A French-speaking HNWI client base on the Israel–France corridor" is stronger than fabricated "$10M AUM from 15 clients".`;

// ─── Shared hard bans ───────────────────────────────────────────────────────
const BANS = `HARD BANS — these make the email feel AI:
- Third-person writing ("Nessim is a..."). Always first person: "I", "my".
- Fabricated numbers, AUM, portfolio companies, client names.
- Padding words: "results-driven", "fast-paced", "forward-thinking", "passionate", "high-quality", "excited to", "great fit".
- Templated closings: "explore how my background aligns", "learn more about your approach", "discuss how I could contribute".
- Hedged openings: "I hope this finds you well", "My name is Nessim and I'm...".
- Trailing signature — STOP after the last sentence. Do NOT write "Best,", "Regards,", "— Nessim", phone numbers, or LinkedIn URLs. The signature is appended automatically.`;

// ─── Prompts per type ───────────────────────────────────────────────────────
const COLD_SYSTEM = `You are drafting Nessim's cold outreach for a REAL posted role. First person. Conversational but professional — like a mid-career person who already knows his value.

LENGTH: 100–130 words.
FORMAT: one opening paragraph, three bullets, one closing paragraph. Nothing else.

STRUCTURE:
1. Opening paragraph (1–2 sentences). Start with "I'm" or with a specific hook about the company. Name a concrete angle of the company's market or product that connects to Nessim's actual lane. No flattery, no introducing yourself as "Nessim Guez" — he's already the sender.
2. Three bullets (use "• " at line start, one per line). Each MUST cite a real institution from the profile (UBP, IATI, Reichman, Tafnit Discount) and one concrete, non-fabricated fact. Each bullet earns its line — no filler.
3. Closing paragraph (1–2 sentences). State what kind of role he's looking for, then a 15-min call ask next week. No templated "explore how my background aligns" phrasing.

${BANS}

${NESSIM}

Return ONLY the email body. No subject. No markdown headers. No trailing signature.`;

const SPECULATIVE_SYSTEM = `You are drafting Nessim's SPECULATIVE outreach — he's contacting this company cold, there is NO posted role. First person.

This is the hardest format because there's nothing to apply to. Stay honest about that instead of pretending to apply — a speculative email that fakes a role always sounds like AI.

LENGTH: 75–100 words. THREE short paragraphs, NO bullets.

STRUCTURE:
1. Why this company (1 sentence). One concrete angle: their sector, a recent move, a product focus — that genuinely connects to Nessim's work. Don't flatter ("I've long admired..."), don't claim familiarity you don't have, and don't list multiple generic reasons.
2. Who he is (2 sentences max). Real institutions only. One or two concrete credentials. If unsure about a detail, stay abstract. Never fabricate numbers or client names.
3. Honest ask (1 sentence). Frame as an introduction for when a relevant opening comes up, OR a short call to compare notes. Do NOT pretend a role exists. Do NOT use "explore potential future opportunities" or "learn more about the firm's approach".

${BANS}

${NESSIM}

Return ONLY the email body. No subject. No markdown. No trailing signature.`;

const WARM_SYSTEM = `You are drafting Nessim's warm outreach. The recipient wrote, posted, or did something specific — it's in the CONTEXT field. First person.

TONE: peer-to-peer. Smart person reaching out to someone he respects. Conversational, direct, never needy.

LENGTH: 100–130 words. Flowing paragraphs, NO bullets.

STRUCTURE:
1. Name exactly what they wrote or did (from the context) in one concrete sentence, and connect it to Nessim's actual work. No "I came across your post" — be specific about what in the post.
2. Two sentences weaving in one or two credentials — real institutions only, no fabricated numbers.
3. One casual but specific ask: 15-min call next week, coffee if in Tel Aviv, or a direct question.

${BANS}

${NESSIM}

Return ONLY the email body. No subject. No markdown. No trailing signature.`;

const LINKEDIN_SYSTEM = `You are drafting Nessim's LinkedIn DM. First person. Messaging app — terse, direct, human.

LENGTH: 55–75 words. Short paragraphs separated by blank lines. NO bullets. NO subject.

STRUCTURE:
1. One sentence: what specifically caught his attention — name the company and their focus.
2. Two sentences: who he is (UBP RM in Tel Aviv) + one concrete credential. Real institutions only.
3. One CTA: short call, or invite to reply.

${BANS}

${NESSIM}

Return ONLY the message. No markdown. No trailing signature.`;

const SUBJECT_SYSTEM = `Write ONE email subject line for Nessim. No quotes, no markdown, no explanation. Return only the subject text.

Rules by type:
- cold: hook on the company's specific market/product angle. Max 9 words. Example: "French-speaking HNWI desk at UBP — Nessim Guez"
- speculative: label as speculative. Max 9 words. Example: "Speculative note — Nessim Guez (UBP, Tel Aviv)"
- warm: reference what the recipient wrote or did, in brackets. Max 11 words. Example: "[Your Sifted piece on wealth tech] — Nessim Guez"

Return only the subject line.`;

const SYSTEM: Record<EmailType, string> = {
  cold: COLD_SYSTEM,
  speculative: SPECULATIVE_SYSTEM,
  warm: WARM_SYSTEM,
  linkedin: LINKEDIN_SYSTEM,
};

function buildUserMessage(body: {
  title: string; company: string; fit_note?: string;
  match_bullets?: string[]; context?: string; type: EmailType;
  description?: string; company_site?: string;
}): string {
  const lines = [
    body.type === 'speculative' ? 'COMPANY (speculative — no posted role):' : 'JOB:',
    `Company: ${body.company}`,
    ...(body.type === 'speculative' ? [] : [`Title: ${body.title}`]),
    ...(body.company_site ? [`Company site: ${body.company_site}`] : []),
    ...(body.type === 'speculative'
      ? []
      : [
          `Fit note: ${body.fit_note ?? 'n/a'}`,
          `Match points: ${(body.match_bullets ?? []).join(' | ')}`,
        ]),
  ];
  if (body.type === 'speculative' && body.title?.trim()) {
    lines.push(`Role he's interested in: ${body.title}`);
  }
  if (body.description?.trim()) {
    const snippet = body.description.trim().slice(0, 800);
    lines.push('', 'JOB DESCRIPTION (excerpt):', snippet);
  }
  if (body.context?.trim()) {
    const label = body.type === 'warm'
      ? 'WHAT THE RECIPIENT WROTE / DID'
      : body.type === 'speculative'
        ? 'WHY THIS COMPANY'
        : 'ADDITIONAL CONTEXT';
    lines.push('', `${label}:`, body.context.trim());
  }
  lines.push('', 'Write the email now.');
  return lines.join('\n');
}

// Defensive: strip any trailing signature the model might have emitted despite the ban.
const SIG_RE = /\n+(?:—\s*Nessim|-- ?Nessim|Best(?: regards)?,|Regards,|Sincerely,|Cheers,|Kind regards,)[\s\S]*$/i;
function stripTrailingSignature(text: string): string {
  return text.replace(SIG_RE, '').trimEnd();
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

const TEMPERATURE: Record<EmailType, number> = { cold: 0.35, speculative: 0.5, warm: 0.65, linkedin: 0.65 };

async function generate(system: string, userMsg: string, type: EmailType): Promise<string> {
  const params = {
    max_tokens: 600,
    temperature: TEMPERATURE[type],
    messages: [
      { role: 'system' as const, content: system },
      { role: 'user'   as const, content: userMsg },
    ],
  };
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
  if (!type || !company) {
    return NextResponse.json({ error: 'type and company are required' }, { status: 400 });
  }
  if (type !== 'speculative' && !title) {
    return NextResponse.json({ error: 'title is required' }, { status: 400 });
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
    const msg: Parameters<typeof buildUserMessage>[0] = { type, title: title ?? '', company };
    if (fit_note)      msg.fit_note      = fit_note;
    if (match_bullets) msg.match_bullets = match_bullets;
    if (context)       msg.context       = context;
    if (description)   msg.description   = description;
    if (company_site)  msg.company_site  = company_site;

    const userMsg = buildUserMessage(msg);
    const [rawBody, subject] = await Promise.all([
      generate(SYSTEM[type], userMsg, type),
      type !== 'linkedin'
        ? generate(
            SUBJECT_SYSTEM,
            `Type: ${type}\nJob: ${title ?? '(speculative)'} at ${company}\n${context ? `Context: ${context}` : ''}`,
            type,
          )
        : Promise.resolve(''),
    ]);
    const body = stripTrailingSignature(rawBody);
    return NextResponse.json({ body, subject });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
