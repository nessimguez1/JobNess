import OpenAI from 'openai';
import type { ScrapedJob, Scoring } from '@jobness/shared';
import { PROFILE } from '@jobness/shared';
import { logger } from './utils/logger.js';

const SCORING_SYSTEM = `You are a job-fit scorer for Nessim Guez's private job hunt. Given a scraped job listing and his profile, score fit 0–100.

HARD RULES (any violation → score ≤ 35, no exceptions):
- Location must be Israel (any city) OR explicitly remote/worldwide. A role in London, NYC, Paris, Dubai etc. with no remote option = hard fail.
- Language: role must be workable in French, English, or Hebrew. Roles requiring German, Dutch, Arabic etc. as primary = hard fail.

NESSIM'S PROFILE SUMMARY:
- 26 years old, Tel Aviv. Native French, fluent English, professional Hebrew.
- 4.5 years real experience (IDF excluded): BD Associate (real estate 2yr) → Tech Ecosystem Coordinator (1yr) → Wealth Management Intern (1yr) → Relationship Manager at UBP Swiss private bank (current, ~6mo).
- MA Finance in progress (Nov 2025). BA Business Administration (2023).
- Target: fintech/financial services BD, partnerships, RM, or VC roles in Israel or remote.

SENIORITY RULES:
- Good fit: Analyst, Associate, Junior/Senior Associate, Account Manager, RM, BD Associate/Manager at Seed–Series B company (<50 people), VC/PE Analyst-Associate, Finance/Treasury Analyst
- Stretch (score max 72): Manager at a scale-up if clearly individual-contributor; Senior Associate
- Hard fail (score ≤ 30): VP, Director, Managing Director, Partner, C-suite, "Head of" at company >100 people, any role requiring 7+ years

SCORING:
- 85+: excellent fit — Israel/remote, right seniority, right industry, right role type
- 70–84: solid — minor mismatch (slightly senior or adjacent industry)
- 50–69: tangential — real gaps but worth seeing
- <50: filter out

ROLE TYPES (positive signal): Private banking RM, Fintech BD/Partnerships, VC/PE Analyst-Associate, Corporate Development, Account Executive B2B, Finance ops/treasury if salary ≥ 18,000 NIS/month.

SALARY: Convert to NIS using 1 USD=2.95, 1 EUR=3.5, 1 CHF=3.8, 1 GBP=3.75. Unknown salary → don't penalise.

Write a 1–2 sentence "fit_note" in direct language. List 2–4 "match_bullets" — short concrete match points.

Return ONLY valid JSON, no markdown, no prose:
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
