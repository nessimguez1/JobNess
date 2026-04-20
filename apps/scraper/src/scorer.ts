import OpenAI from 'openai';
import type { ScrapedJob, Scoring } from '@jobness/shared';
import { PROFILE } from '@jobness/shared';
import { logger } from './utils/logger.js';

export type EmailType = 'cold' | 'warm' | 'linkedin';

export interface EmailRequest {
  type: EmailType;
  title: string;
  company: string;
  fit_note?: string;
  match_bullets?: string[];
  context?: string;
}

const NESSIM = `NESSIM'S PROFILE:
- RM at UBP (Swiss private bank), Tel Aviv — French-speaking HNWI desk, Israel–France corridor.
- IATI project coordinator — 100+ Israeli tech companies.
- Native trilingual: French, English, Hebrew.
- BD background: real estate 2yr, tech ecosystem 1yr, wealth management 1yr+.
- MA Finance (Ono Academic), BA Business Admin (Reichman/IDC).
- 26 years old, Tel Aviv. Target: fintech BD, RM, partnerships, VC/PE analyst roles.`;

const COLD_EMAIL_SYSTEM = `You are drafting a cold outreach email on behalf of Nessim Guez for a specific job opening.

TONE: Professional but direct. Not corporate. Confident. Gets to the point in the first sentence.

STRUCTURE — write in this exact order, no section headers:
1. Opening (2 sentences): who Nessim is + one specific reason why this company/role caught his attention. Reference the company by name and their known focus.
2. Three accomplishment bullets (use "•"):
   • Each bullet = one concrete reason he's a fit, in outcome language (not "I have experience in X" but "managed/originated/coordinated X")
   • At least one should echo wording from the job description
3. One sentence: what he's looking for, framed as value he adds — not career goals
4. CTA (exactly): "Would you be open to a brief 15-minute call next week to explore fit?"
5. Sign-off: "Best,\\nNessim Guez\\nlinkedin.com/in/nessim-guez-0519411b8 | +972 54 649 5846"

LENGTH: 130–170 words excluding sign-off. Mobile-readable.

AVOID: "I'm very passionate", "I believe I'd be a great fit", "dream company", multiple asks, vague adjectives without proof, "I want to grow into X".

${NESSIM}

Return ONLY the email body. No subject line. No markdown. No section headers.`;

const WARM_EMAIL_SYSTEM = `You are writing a warm outreach email on behalf of Nessim Guez.

TONE: peer-to-peer. Confident, curious, human — NOT a job application. Like someone reaching out to a person they genuinely respect, having done their homework. No corporate language. No "I believe I would be a great fit." Conversational, slightly direct, never needy.

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

const LINKEDIN_DM_SYSTEM = `You are writing a LinkedIn DM on behalf of Nessim Guez.

TONE: direct, warm, human. Like a smart person reaching out — not a recruiter template. Punchy.
LENGTH: 60–90 words. Short paragraphs separated by blank lines. No bullets. No headers.

STRUCTURE (pure prose):
1. One sentence: what specifically caught his attention about this role or company — reference the company by name
2. Two sentences: who he is + one concrete credential that's directly relevant
3. One sentence CTA: 15-min call next week

Sign-off: "— Nessim\\nlinkedin.com/in/nessim-guez-0519411b8"

${NESSIM}

Return ONLY the message body. No markdown. No headers.`;

const SYSTEM_BY_TYPE: Record<EmailType, string> = {
  cold: COLD_EMAIL_SYSTEM,
  warm: WARM_EMAIL_SYSTEM,
  linkedin: LINKEDIN_DM_SYSTEM,
};

function buildUserMessage(req: EmailRequest): string {
  const lines = [
    `JOB:`,
    `Title: ${req.title}`,
    `Company: ${req.company}`,
    `Fit note: ${req.fit_note ?? 'n/a'}`,
    `Match points: ${(req.match_bullets ?? []).join(' | ')}`,
  ];
  if (req.context?.trim()) {
    const label = req.type === 'warm' ? 'WHAT THE RECIPIENT WROTE / DID' : 'ADDITIONAL CONTEXT';
    lines.push('', `${label}:`, req.context.trim());
  }
  lines.push('', 'Write the email now.');
  return lines.join('\n');
}

async function callGroq(system: string, userMsg: string): Promise<string> {
  const res = await groqClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMsg },
    ],
  });
  const text = res.choices[0]?.message.content?.trim() ?? '';
  if (!text) throw new Error('Empty response from Groq');
  return text;
}

async function callOpenAI(system: string, userMsg: string): Promise<string> {
  const res = await openaiClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 500,
    temperature: 0.7,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userMsg },
    ],
  });
  const text = res.choices[0]?.message.content?.trim() ?? '';
  if (!text) throw new Error('Empty response from OpenAI');
  return text;
}

export async function generateEmail(req: EmailRequest): Promise<string> {
  const system = SYSTEM_BY_TYPE[req.type];
  const userMsg = buildUserMessage(req);
  try {
    return await callGroq(system, userMsg);
  } catch (err) {
    logger.warn({ type: req.type, err: String(err) }, 'groq email generation failed — falling back to openai');
    return callOpenAI(system, userMsg);
  }
}

const SCORING_SYSTEM = `You are a job-fit scorer for Nessim Guez's private job hunt. Score each job 0–100.

━━ HARD RULES (any violation → score ≤ 35, no exceptions) ━━
• Location: must be Israel OR explicitly remote/worldwide/global/europe/international.
  A London/NYC/Paris/Dubai office role with zero remote option = hard fail.
• Language: role must be workable in French, English, or Hebrew.
  Roles requiring German, Dutch, Arabic as the *primary* language = hard fail.

━━ NESSIM'S PROFILE ━━
• 26, Tel Aviv. Native French · Fluent English · Professional Hebrew.
• 4.5 yrs experience: BD Associate real estate (2yr) → Tech Ecosystem Coordinator at IATI / 100+ Israeli tech companies (1yr) → RM at UBP Swiss private bank, French-speaking HNWI desk, Israel–France corridor (current, ~18mo total WM).
• Education: MA Finance in progress (Ono Academic, Nov 2025) · BA Business Admin (Reichman/IDC, 2023).
• KEY DIFFERENTIATORS: native French + Israeli tech ecosystem network (rare combo); HNWI relationship experience at a top-tier private bank; trilingual.

━━ FRENCH LANGUAGE BONUS ━━
After computing the base score, add +10 if ANY of:
• The role explicitly requires French
• The company targets French-speaking clients or markets
• The role involves the France–Israel corridor
Native French is Nessim's single strongest differentiator vs. Israeli competition. This bonus can push the score past 85.

━━ SENIORITY RULES ━━
Strong fit (no cap): Analyst · Associate · Junior/Senior Associate · Account Manager · Relationship Manager · BD Associate/Manager at Seed–Series C (<200 people) · VC/PE Analyst/Associate · Finance/Treasury Analyst · IR Analyst/Associate · Partnerships Manager · GTM at early-stage startup.
Stretch (cap 74): Manager at a scale-up if clearly IC; Senior Manager; Lead at <50-person startup.
Hard fail (≤ 30): VP · Director · MD · Partner · C-suite · "Head of" at company >200 people · any role requiring 7+ years explicitly.

━━ SCORING BANDS ━━
85+  : excellent — right location, right seniority, high role-type match
70–84: solid — minor mismatch (slightly senior, or adjacent industry)
50–69: tangential — real gaps but worth a look
40–49: weak signal — visible but low priority
<40  : filter out

━━ POSITIVE ROLE SIGNALS (each raises score) ━━
• Private banking / HNWI relationship management
• Fintech BD / Sales / Partnerships / Growth / Alliances
• VC or PE analyst/associate
• Corporate development / M&A analyst
• Investor Relations (IR)
• Treasury / Cash management / FX / Liquidity
• Account Executive B2B (especially selling to financial institutions)
• Strategic partnerships / ecosystem manager / channel partnerships
• French-speaking market coverage or French client base (strong signal)
• Israeli tech ecosystem involvement
• Revenue/Sales Operations at early-stage fintech

━━ NEGATIVE SIGNALS (each lowers score) ━━
• Pure engineering, data science, or product role (not BD-adjacent)
• Retail / consumer sales / door-to-door
• Requires specific technical degree (CS, engineering) as hard requirement
• >5 years required and role is clearly senior IC or management

━━ SALARY ━━
Convert to NIS/month: 1 USD=2.95 · 1 EUR=3.5 · 1 CHF=3.8 · 1 GBP=4.0.
If salary unknown → do not penalise. If salary < 18,000 NIS and explicitly stated → lower score by 5.

━━ OUTPUT ━━
fit_note: 1–2 sentences, direct language, name the specific match or mismatch.
match_bullets: 2–4 concrete match points between his background and this role.

Return ONLY valid JSON, no markdown:
{"score": number, "fit_note": string, "match_bullets": string[]}`;

let _groq: OpenAI | undefined;
let _openai: OpenAI | undefined;

function groqClient(): OpenAI {
  if (!_groq) {
    const key = process.env['GROQ_API_KEY'];
    if (!key) throw new Error('Missing GROQ_API_KEY');
    _groq = new OpenAI({ apiKey: key, baseURL: 'https://api.groq.com/openai/v1' });
  }
  return _groq;
}

function openaiClient(): OpenAI {
  if (!_openai) {
    const key = process.env['OPENAI_API_KEY'];
    if (!key) throw new Error('Missing OPENAI_API_KEY');
    _openai = new OpenAI({ apiKey: key });
  }
  return _openai;
}

function parseJson(text: string): Scoring {
  return JSON.parse(text.replace(/```json|```/g, '').trim()) as Scoring;
}

async function scoreWithGroq(job: ScrapedJob): Promise<Scoring> {
  const res = await groqClient().chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    max_tokens: 512,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SCORING_SYSTEM },
      {
        role: 'user',
        content: `PROFILE:\n${JSON.stringify(PROFILE, null, 2)}\n\nJOB:\n${JSON.stringify(job, null, 2)}\n\nReturn the JSON scoring.`,
      },
    ],
  });
  const text = res.choices[0]?.message.content ?? '';
  if (!text) throw new Error('Empty response from Groq scorer');
  return parseJson(text);
}

async function scoreWithOpenAI(job: ScrapedJob): Promise<Scoring> {
  const res = await openaiClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
    temperature: 0.1,
    messages: [
      { role: 'system', content: SCORING_SYSTEM },
      {
        role: 'user',
        content: `PROFILE:\n${JSON.stringify(PROFILE, null, 2)}\n\nJOB:\n${JSON.stringify(job, null, 2)}\n\nReturn the JSON scoring.`,
      },
    ],
  });
  const text = res.choices[0]?.message.content ?? '';
  if (!text) throw new Error('Empty response from OpenAI scorer');
  return parseJson(text);
}

export async function scoreJob(job: ScrapedJob): Promise<Scoring> {
  try {
    const scoring = await scoreWithGroq(job);
    logger.debug({ title: job.title, score: scoring.score }, 'scored (groq)');
    return scoring;
  } catch (err: unknown) {
    // Groq rate-limit or unavailable — fall back to OpenAI gpt-4o-mini
    logger.warn({ title: job.title, err: String(err) }, 'groq failed — falling back to openai');
    const scoring = await scoreWithOpenAI(job);
    logger.debug({ title: job.title, score: scoring.score }, 'scored (openai)');
    return scoring;
  }
}
