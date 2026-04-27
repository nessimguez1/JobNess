import { NextRequest, NextResponse } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions, type SessionData } from '../../../../lib/session';
import OpenAI from 'openai';
import {
  NESSIM_SYSTEM_BLOCK,
  COVER_LETTER_EXAMPLES,
} from '@jobness/shared';

// ─── Email types ────────────────────────────────────────────────────────────
// Three primary tabs in the EmailModal: cover_letter, cold, linkedin.
// 'speculative' is kept as a back-end variant for the Companies tab — same
// voice as cold, but framed for a company that has no posted role.
type EmailType = 'cover_letter' | 'cold' | 'linkedin' | 'speculative';

// ─── Format rules per type ─────────────────────────────────────────────────
const COVER_LETTER_FORMAT = `FORMAT — COVER LETTER

Length: 220–280 words.
Open: "Dear {Company} Hiring Team,"  (use the actual company name)
Body: 4–5 short paragraphs of flowing prose. NO bullet points anywhere.

Paragraph plan:
  P1 (1–2 sentences): the gold-standard scaffold —
       "The {role} role looks like a strong fit for the {capability} I've been doing at {institutions}."
       If the role is in a sector Nessim hasn't worked in, append the cross-sector pivot:
       "applied to a sector I haven't worked in yet, but one where the underlying skills translate directly."
       For operational/coordination roles, a softer pivot works: "Different industry from yours, but the same execution discipline." (use this only in the body, not the opener.)
  P2 (3–5 sentences): UBP capability paragraph. What the work IS in concrete operational terms — French/Israeli HNW prospecting, intermediary network, Geneva coordination, full client lifecycle. NEVER imply a deal book, AUM, named clients, or production numbers.
  P3 (3–5 sentences): depth paragraph weaving Tafnit and IATI. Use Tafnit's "150+ inbound leads converted into qualified portfolio clients over 10 months" when a concrete benchmark fits. IATI framing must stay within "ran programs connecting Israeli founders and CEOs with international investors" / "working knowledge of the Israeli tech ecosystem" — never "I have a network of executives."
       For operational/ops-coordination roles, P2 may be IATI (operational coordination) and P3 may be UBP (operational onboarding). Pick the order that fits the role.
  P4 (1 sentence): tactical languages line, tailored to the company's footprint. "Native-level English, plus French and Hebrew at native level, in case any of your partner base sits outside Israel." Tailor the tail.
  P5 (1 sentence): "I'd welcome a conversation about the role."

End after P5. NO signature. No "Best, Nessim" — appended client-side.`;

const COLD_FORMAT = `FORMAT — COLD EMAIL

Length: 130–170 words. The compressed cover letter — same voice, fewer paragraphs.
Open: dive straight into the body with the gold-standard scaffold. No "Hi {name}," — the user prepends the greeting.
Body: 3 short paragraphs of flowing prose. NO bullets.
  P1 (1 sentence): "The {role} role looks like a strong fit for the {capability} I've been doing at {institutions}." Add the cross-sector pivot if relevant.
  P2 (3–4 sentences): one UBP capability anchor + one prior-role anchor (Tafnit metric OR IATI ecosystem framing OR Tel Aviv/Paris referral network). Woven, not listed.
  P3 (1–2 sentences): one tactical line (languages or a specific company-relevant angle) + a short, specific ask.
Ask register: "I'd welcome a short conversation if the role is open." OR "Open to a brief call next week to compare notes?" Never "explore how my background aligns" or "learn more about your approach."

End after the ask. NO signature.`;

const LINKEDIN_FORMAT = `FORMAT — LINKEDIN DM

Length: 55–80 words. Messaging app — terse, direct, human. Short paragraphs separated by blank lines.
Open: one sentence naming the company and what specifically caught attention.
Middle: two sentences — who I am ("I'm Nessim, Relationship Manager at UBP in Tel Aviv, covering French-speaking HNW clients") + one concrete prior-role anchor (Tafnit's 150+/10mo OR IATI ecosystem OR Tel Aviv/Paris referral network — pick one).
Close: one short line — "Open to a quick call?" or "Worth a short chat?"

NO bullets. NO subject line. NO signature.`;

const SPECULATIVE_FORMAT = `FORMAT — SPECULATIVE COLD MAIL

There is NO posted role — this is a cold introduction to a company that is not currently hiring publicly. Stay honest about that; do NOT fabricate a role.

Length: 120–160 words. Three short paragraphs, prose only, NO bullets.

Body plan:
  P1 (1 sentence): one concrete angle on why this company specifically — their sector, a recent move, a product focus — that genuinely connects to Nessim's lane. No flattery ("I've long admired"), no claimed familiarity he doesn't have.
  P2 (2–3 sentences): who I am — Relationship Manager at UBP covering French-speaking HNW clients — plus one concrete prior-role anchor (Tafnit's 150+/10mo OR Tel Aviv/Paris referral network OR IATI ecosystem framing). Real institutions only.
  P3 (1–2 sentences): honest ask — frame as an introduction for when a relevant opening fits, OR a short call to compare notes. Do NOT pretend a specific role exists.

NO bullets. NO signature.`;

const FORMAT_BY_TYPE: Record<EmailType, string> = {
  cover_letter: COVER_LETTER_FORMAT,
  cold:         COLD_FORMAT,
  linkedin:     LINKEDIN_FORMAT,
  speculative:  SPECULATIVE_FORMAT,
};

// Lower temp = more faithful to the prompt + few-shot. We want voice
// replication, not creativity, so these stay deliberately moderate.
const TEMPERATURE: Record<EmailType, number> = {
  cover_letter: 0.5,
  cold:         0.55,
  linkedin:     0.6,
  speculative:  0.55,
};

const MAX_TOKENS: Record<EmailType, number> = {
  cover_letter: 700,
  cold:         420,
  linkedin:     220,
  speculative:  420,
};

const SUBJECT_SYSTEM = `Write ONE email subject line for Nessim Guez. No quotes, no markdown, no explanation. Return only the subject text.

Patterns by type:
- cover_letter: "{Role} — Nessim Guez" or a tighter variant. Max 9 words.
- cold:         hook on the role's specific angle. Max 9 words. Example: "French-speaking HNWI desk at UBP — Nessim Guez"
- speculative:  label as speculative. Max 9 words. Example: "Speculative note — Nessim Guez (UBP, Tel Aviv)"

Return only the subject line.`;

// ─── Build user message ─────────────────────────────────────────────────────
interface GenerateBody {
  type: EmailType;
  title?: string;
  company: string;
  fit_note?: string;
  match_bullets?: string[];
  context?: string;
  description?: string;
  company_site?: string;
}

function buildUserMessage(body: GenerateBody): string {
  const { type, title, company, fit_note, match_bullets, context, description, company_site } = body;
  const lines: string[] = [];

  if (type === 'speculative') {
    lines.push('COMPANY (speculative — no posted role):');
    lines.push(`Company: ${company}`);
    if (company_site) lines.push(`Company site: ${company_site}`);
    if (title?.trim()) lines.push(`Role focus he'd want to discuss: ${title.trim()}`);
  } else {
    lines.push('JOB:');
    lines.push(`Company: ${company}`);
    if (title?.trim()) lines.push(`Title: ${title.trim()}`);
    if (company_site)  lines.push(`Company site: ${company_site}`);
    if (fit_note)      lines.push(`Fit note: ${fit_note}`);
    if (match_bullets && match_bullets.length > 0) {
      lines.push(`Match points: ${match_bullets.join(' | ')}`);
    }
  }

  if (description?.trim()) {
    const snippet = description.trim().slice(0, 1000);
    lines.push('', 'Job description (excerpt):', snippet);
  }

  if (context?.trim()) {
    const label = type === 'speculative' ? 'WHY THIS COMPANY' : 'ADDITIONAL CONTEXT';
    lines.push('', `${label}:`, context.trim());
  }

  lines.push('');
  lines.push(
    type === 'cover_letter' ? 'Write the cover letter now.' :
    type === 'linkedin'     ? 'Write the LinkedIn DM now.' :
    type === 'speculative'  ? 'Write the speculative note now.' :
                              'Write the cold email now.',
  );
  return lines.join('\n');
}

// ─── Build messages array ──────────────────────────────────────────────────
type Msg = { role: 'system' | 'user' | 'assistant'; content: string };

function buildMessages(type: EmailType, userMsg: string): Msg[] {
  const system: Msg = {
    role: 'system',
    content: `${NESSIM_SYSTEM_BLOCK}\n\n${FORMAT_BY_TYPE[type]}`,
  };

  // Few-shot only for cover_letter — the three real letters are the voice
  // anchor. Other types use the system block (which references the voice
  // fingerprint) without primed assistant turns; including 700-word example
  // letters in a 60-word LinkedIn DM prompt would format-bleed.
  if (type === 'cover_letter') {
    const examples: Msg[] = COVER_LETTER_EXAMPLES.flatMap<Msg>(ex => [
      { role: 'user',      content: ex.user },
      { role: 'assistant', content: ex.assistant },
    ]);
    return [system, ...examples, { role: 'user', content: userMsg }];
  }

  return [system, { role: 'user', content: userMsg }];
}

// ─── OpenAI client ──────────────────────────────────────────────────────────
let _openai: OpenAI | undefined;
function openai(): OpenAI {
  if (!_openai) _openai = new OpenAI({ apiKey: process.env['OPENAI_API_KEY']! });
  return _openai;
}

// gpt-4.1 is the voice/instruction-following model — meaningfully stronger
// than gpt-4o-mini for replicating the cover-letter style. Fallback to gpt-4o
// if 4.1 is unavailable on the account.
const PRIMARY_MODEL  = 'gpt-4.1';
const FALLBACK_MODEL = 'gpt-4o';

async function callOpenAI(model: string, type: EmailType, userMsg: string): Promise<string> {
  const res = await openai().chat.completions.create({
    model,
    max_tokens: MAX_TOKENS[type],
    temperature: TEMPERATURE[type],
    messages: buildMessages(type, userMsg),
  });
  const text = res.choices[0]?.message.content?.trim() ?? '';
  if (!text) throw new Error(`empty response from ${model}`);
  return text;
}

async function generateBody(type: EmailType, userMsg: string): Promise<string> {
  try {
    return await callOpenAI(PRIMARY_MODEL, type, userMsg);
  } catch (err) {
    console.warn(`primary model ${PRIMARY_MODEL} failed, falling back: ${String(err)}`);
    return callOpenAI(FALLBACK_MODEL, type, userMsg);
  }
}

async function generateSubject(type: EmailType, title: string | undefined, company: string, context: string | undefined): Promise<string> {
  if (type === 'linkedin') return '';
  const prompt = [
    `Type: ${type}`,
    title?.trim() ? `Role: ${title.trim()}` : null,
    `Company: ${company}`,
    context?.trim() ? `Context: ${context.trim()}` : null,
  ].filter(Boolean).join('\n');
  try {
    const res = await openai().chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 40,
      temperature: 0.4,
      messages: [
        { role: 'system', content: SUBJECT_SYSTEM },
        { role: 'user',   content: prompt },
      ],
    });
    return res.choices[0]?.message.content?.trim().replace(/^["']|["']$/g, '') ?? '';
  } catch {
    return '';
  }
}

// ─── Defensive: strip any trailing signature ────────────────────────────────
const SIG_RE = /\n+(?:—\s*Nessim|--\s?Nessim|Best(?:\s+regards)?,|Regards,|Sincerely,|Cheers,|Kind\s+regards,|Thanks,|Thank\s+you,)[\s\S]*$/i;
function stripTrailingSignature(text: string): string {
  return text.replace(SIG_RE, '').trimEnd();
}

// ─── POST handler ───────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ironRes = NextResponse.next();
  const session = await getIronSession<SessionData>(req, ironRes, sessionOptions);
  if (!session.isLoggedIn) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env['OPENAI_API_KEY']) {
    return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 503 });
  }

  // Parse + validate. Type 'string' (not EmailType) so we can detect legacy
  // 'warm' requests from any in-flight clients and migrate them.
  const payload = (await req.json()) as {
    type?: string;
    title?: string;
    company?: string;
    fit_note?: string;
    match_bullets?: string[];
    context?: string;
    description?: string;
    company_site?: string;
  };

  // Migrate legacy 'warm' requests to 'cold' so old in-flight clients don't 500.
  // The new EmailModal never sends 'warm'.
  const rawType = payload.type === 'warm' ? 'cold' : payload.type;

  if (!rawType || !['cover_letter', 'cold', 'linkedin', 'speculative'].includes(rawType)) {
    return NextResponse.json({ error: `Invalid type: ${rawType ?? '(missing)'}` }, { status: 400 });
  }
  const type = rawType as EmailType;

  if (!payload.company?.trim()) {
    return NextResponse.json({ error: 'company is required' }, { status: 400 });
  }
  if (type !== 'speculative' && !payload.title?.trim()) {
    return NextResponse.json({ error: 'title is required for this type' }, { status: 400 });
  }

  const body: GenerateBody = {
    type,
    company: payload.company.trim(),
    ...(payload.title         ? { title:         payload.title.trim() } : {}),
    ...(payload.fit_note      ? { fit_note:      payload.fit_note      } : {}),
    ...(payload.match_bullets ? { match_bullets: payload.match_bullets } : {}),
    ...(payload.context       ? { context:       payload.context       } : {}),
    ...(payload.description   ? { description:   payload.description   } : {}),
    ...(payload.company_site  ? { company_site:  payload.company_site  } : {}),
  };

  try {
    const userMsg = buildUserMessage(body);
    const [rawBody, subject] = await Promise.all([
      generateBody(type, userMsg),
      generateSubject(type, body.title, body.company, body.context),
    ]);
    const cleanBody = stripTrailingSignature(rawBody);
    return NextResponse.json({ body: cleanBody, subject });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
