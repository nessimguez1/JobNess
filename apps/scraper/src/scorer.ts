import OpenAI from 'openai';
import type { ScrapedJob, Scoring } from '@jobness/shared';
import { logger } from './utils/logger.js';
import { FX_TO_NIS } from './utils/fx.js';

// Compact job representation for the scorer. Nessim's profile is already
// embedded in SCORING_SYSTEM, so don't re-send it per call. Trim the
// description and drop fields the scorer doesn't need (IDs, source, URL).
function jobForScoring(job: ScrapedJob): string {
  const desc = (job.description ?? '').slice(0, 1200).replace(/\s+/g, ' ').trim();
  const parts = [
    `Title: ${job.title}`,
    `Company: ${job.company}`,
    job.location ? `Location: ${job.location}` : null,
    job.salary_text ? `Salary: ${job.salary_text}` : null,
    desc ? `Description: ${desc}` : null,
  ].filter(Boolean);
  return parts.join('\n');
}

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
- Native trilingual: Hebrew (strongest, native), English (native-level, 10 yrs in US, American accent), French (native oral, fluent written).
- BD background: real estate 2yr, tech ecosystem 1yr, wealth management 1yr+.
- MA Finance (Ono Academic), BA Business Admin (Reichman/IDC).
- 26, Tel Aviv. Targets: private banking RM, family office IR, fintech BD, partnerships, VC/PE analyst — Israel or remote, plus Miami if fully sponsored.`;

const COLD_EMAIL_SYSTEM = `You are drafting a cold outreach email on behalf of Nessim Guez for a specific job opening.

TONE: Professional but direct. Not corporate. Confident. Gets to the point in the first sentence.

STRUCTURE — write in this exact order, no section headers:
1. Opening (2 sentences): who Nessim is + one specific reason why this company/role caught his attention. Reference the company by name and their known focus.
2. Three accomplishment bullets (use "•"):
   • Each bullet = one concrete reason he's a fit, in outcome language (not "I have experience in X" but "managed/originated/coordinated X")
   • At least one should echo wording from the job description
3. One sentence: what he's looking for, framed as value he adds — not career goals
4. CTA (exactly): "Would you be open to a brief 15-minute call next week to explore fit?"
5. NO sign-off — appended client-side. End after the CTA.

LENGTH: 130–170 words. Mobile-readable.

AVOID: "I'm very passionate", "I believe I'd be a great fit", "dream company", multiple asks, vague adjectives without proof, "I want to grow into X", fabricated AUM/revenue numbers.

${NESSIM}

Return ONLY the email body. No subject line. No markdown. No section headers. No signature.`;

const WARM_EMAIL_SYSTEM = `You are writing a warm outreach email on behalf of Nessim Guez.

TONE: peer-to-peer. Confident, curious, human — NOT a job application. Like someone reaching out to a person they genuinely respect, having done their homework. No corporate language. No "I believe I would be a great fit." Conversational, slightly direct, never needy.

DO NOT use bullet points or headers. Write in flowing prose with short paragraphs.
LENGTH: 110–150 words. Must be readable on mobile.

STRUCTURE (no labels, just prose):
1. Opening: reference what the recipient wrote/did and why it landed with Nessim's world (1–2 sentences)
2. Proof: weave in 2–3 concrete credentials naturally — no list (2–3 sentences)
3. Intent: what he's exploring, framed as mutual discovery — not desperation (1 sentence)
4. CTA: one casual but specific ask (1 sentence)
5. NO sign-off — appended client-side.

${NESSIM}

Return ONLY the email body. No subject line. No markdown. No labels or section headers. No signature.`;

const LINKEDIN_DM_SYSTEM = `You are writing a LinkedIn DM on behalf of Nessim Guez.

TONE: direct, warm, human. Like a smart person reaching out — not a recruiter template. Punchy.
LENGTH: 60–90 words. Short paragraphs separated by blank lines. No bullets. No headers.

STRUCTURE (pure prose):
1. One sentence: what specifically caught his attention about this role or company — reference the company by name
2. Two sentences: who he is + one concrete credential that's directly relevant
3. One sentence CTA: 15-min call next week
4. NO sign-off — appended client-side.

${NESSIM}

Return ONLY the message body. No markdown. No headers. No signature.`;

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

// ─── SCORING ───────────────────────────────────────────────────────────────

const FX_BLOCK = `Convert to NIS/month: 1 USD=${FX_TO_NIS.USD} · 1 EUR=${FX_TO_NIS.EUR} · 1 CHF=${FX_TO_NIS.CHF} · 1 GBP=${FX_TO_NIS.GBP}.`;

const SCORING_SYSTEM = `You are a job-fit scorer for Nessim Guez. Score each job 0–100.

━━ HARD RULES (any violation → score ≤ 30) ━━

LOCATION:
- Tel Aviv area (incl. Herzliya, Ramat Gan, Petah Tikva, Givatayim, Holon, Bnei Brak, Rishon LeTzion, Netanya, Raanana, Kfar Saba) → OK
- Anywhere in Israel → OK
- Remote / worldwide / global / hybrid (where the hybrid base is Israel or remote) → OK
- Miami / Florida → OK ONLY if the posting EXPLICITLY says "visa sponsorship" / "relocation" / "relocation package" / "willing to sponsor". Otherwise hard-fail.
- Anywhere else (Switzerland, UK, Singapore, France, Germany, NYC, Dubai, Lisbon, etc.) → HARD-FAIL.
- "EU-anywhere" / "Europe" without explicit Israel-friendliness → hard-fail.

LANGUAGE:
- Role must be workable in Hebrew, English, or French.
- Roles requiring German, Dutch, Arabic, Spanish, Italian, Mandarin as the *primary* language → hard-fail.

EMPLOYER BLOCKLIST (auto-fail to 0):
- UBP / Union Bancaire Privée
- Tafnit Discount
- IATI / Israel Advanced Technology Industries
- Eden Property Group
- Reichman University

━━ NESSIM'S PROFILE ━━
- 26, Tel Aviv. Hebrew (native, strongest) · English (native-level, 10 yrs in US, American accent) · French (native oral, fluent written).
- 4.5 yrs: BD Associate real estate (2yr) → Tech Ecosystem at IATI (1yr) → RM at UBP (current, ~6mo as RM, but ~18mo total wealth-mgmt since Tafnit).
- MA Finance in progress (Ono Academic), BA Business Admin (Reichman/IDC, 2023).
- KEY DIFFERENTIATORS: Native French + Israeli network; HNWI relationship origination at a top-tier Swiss private bank; trilingual at native or near-native in all three languages.

━━ HEBREW BONUS ━━
+5 if the role explicitly works on Israeli market / Israeli clients / requires Hebrew. (Most TLV-located roles already implicitly do — don't double-count.)

━━ FRENCH BONUS ━━
+10 if any of:
- Role explicitly requires French
- Company targets French-speaking clients (Switzerland Romande, Monaco, Belgium, Luxembourg) AND the role is based in Israel or remote
- Role involves France–Israel corridors

━━ SENIORITY RULES ━━
Strong fit (no cap): Analyst · Associate · Junior/Senior Associate · Account Manager · Relationship Manager · Client Advisor · Wealth Manager · Private Banker · Investment Counselor · BD Associate / BD Manager at <200 ppl · VC/PE Analyst / Associate · IR Analyst / Associate · Finance / Treasury Analyst · Corp Dev Analyst · Partnerships Manager · Alliance Manager · GTM at early-stage startup.
Stretch (cap 74): Manager at scale-up if clearly IC; Senior Manager; Lead at <50-person startup.
Hard fail (≤30): VP · Director · MD · Partner · C-suite · "Head of" at >200 ppl · any role explicitly requiring 7+ years.

━━ SCORING BANDS ━━
85+  : excellent
70–84: solid (minor mismatch)
50–69: tangential
40–49: weak signal
<40  : filter out

━━ POSITIVE ROLE SIGNALS (compound) ━━
- Private banking / HNWI relationship management at a Swiss bank's TLV desk OR remote-Israel-friendly role → STRONG
- Family office banker / IR / wealth associate based in TLV or remote-friendly → STRONG
- Israeli premium / private banking (Hapoalim Premium, Leumi PB, Mizrahi Premium, etc.)
- Fintech BD / Sales / Partnerships / Growth / Alliances at Israeli company
- VC or PE analyst / associate at Israeli firm
- Corporate development / M&A analyst at Israeli firm
- IR (Investor Relations) at Israeli scale-up
- Treasury / Cash management / FX
- Account Executive B2B (especially selling to financial institutions) at Israeli company
- Strategic partnerships / ecosystem manager
- French-speaking market coverage where ROLE LOCATION is Israel or remote

━━ NEGATIVE SIGNALS ━━
- Pure engineering, data science, product role
- Retail / consumer sales
- Requires specific technical degree (CS) as hard requirement
- Senior IC or management requiring 5+ years where Nessim has only 4.5
- Role at one of the OFF-LIMITS EMPLOYERS → auto-fail to 0

━━ SALARY ━━
${FX_BLOCK}
If salary unknown → don't penalise. If salary < 18,000 NIS and explicitly stated → lower score by 5.

━━ OUTPUT ━━
fit_note: 1–2 sentences, direct.
match_bullets: 2–4 concrete match points.

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
      { role: 'user', content: `${jobForScoring(job)}\n\nReturn the JSON scoring.` },
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
      { role: 'user', content: `${jobForScoring(job)}\n\nReturn the JSON scoring.` },
    ],
  });
  const text = res.choices[0]?.message.content ?? '';
  if (!text) throw new Error('Empty response from OpenAI scorer');
  return parseJson(text);
}

function describeErr(err: unknown): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const e = err as any;
  const status = e?.status ?? e?.response?.status;
  const code   = e?.code   ?? e?.error?.code;
  const msg    = e?.message ?? String(err);
  return [status && `[${status}]`, code && `(${code})`, msg].filter(Boolean).join(' ');
}

// Groq free-tier has a 100K tokens-per-day cap. Once we hit it, every remaining
// Groq call in this process is a guaranteed 429 — skip straight to OpenAI so we
// don't burn ~1s of latency per job on a doomed request.
let _groqDisabledReason: string | null = null;

function isGroqTpdExhaustion(err: unknown): boolean {
  const msg = describeErr(err).toLowerCase();
  return msg.includes('tokens per day') || msg.includes('(tpd)');
}

// Global concurrency gate across all sources. 3 is deliberately conservative —
// above that we saturate OpenAI's 200k TPM on gpt-4o-mini and every excess
// request comes back 429, which actively wastes tokens on the retries.
const SCORE_GATE_LIMIT = 3;
let _scoreInFlight = 0;
const _scoreWaiters: Array<() => void> = [];

async function acquireScoreSlot(): Promise<void> {
  if (_scoreInFlight < SCORE_GATE_LIMIT) {
    _scoreInFlight++;
    return;
  }
  await new Promise<void>(resolve => _scoreWaiters.push(resolve));
  _scoreInFlight++;
}

function releaseScoreSlot(): void {
  _scoreInFlight--;
  const next = _scoreWaiters.shift();
  if (next) next();
}

export async function scoreJob(job: ScrapedJob): Promise<Scoring> {
  await acquireScoreSlot();
  try {
    return await _scoreJobInner(job);
  } finally {
    releaseScoreSlot();
  }
}

async function _scoreJobInner(job: ScrapedJob): Promise<Scoring> {
  if (!_groqDisabledReason) {
    try {
      const scoring = await scoreWithGroq(job);
      logger.debug({ title: job.title, score: scoring.score }, 'scored (groq)');
      return scoring;
    } catch (groqErr: unknown) {
      if (isGroqTpdExhaustion(groqErr)) {
        _groqDisabledReason = describeErr(groqErr);
        logger.warn(`groq TPD exhausted — skipping groq for rest of run: ${_groqDisabledReason}`);
      } else {
        logger.warn(`groq failed [${job.title}]: ${describeErr(groqErr)} — falling back to openai`);
      }
    }
  }

  try {
    const scoring = await scoreWithOpenAI(job);
    logger.debug({ title: job.title, score: scoring.score }, 'scored (openai)');
    return scoring;
  } catch (openaiErr: unknown) {
    logger.error(`openai failed [${job.title}]: ${describeErr(openaiErr)}`);
    throw openaiErr;
  }
}
