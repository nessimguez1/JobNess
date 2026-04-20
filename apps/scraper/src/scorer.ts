import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { ScrapedJob, Scoring } from '@jobness/shared';
import { PROFILE } from '@jobness/shared';
import { logger } from './utils/logger.js';

const SCORING_SYSTEM = `You are a job-fit scorer for Nessim Guez's private job hunt. Given a scraped job listing and his profile, score fit 0–100.

HARD RULES (any violation → score ≤ 35, no exceptions):
- Location must be Israel (any city) OR explicitly remote/worldwide. A role in London, NYC, Paris, Dubai etc. with no remote option = hard fail.
- Language: role must be workable in French, English, or Hebrew. Roles requiring German, Dutch, Arabic etc. as primary = hard fail.

SENIORITY (Nessim is 26, ~4 years real experience excl. IDF, currently RM at a Swiss private bank):
- Good fit: Analyst, Associate, Junior/Senior Associate, Junior BD, Account Manager, RM, early-stage startup BD Lead (Seed/Series A)
- Stretch but ok: Manager if the team is small (<30 people) or role is clearly individual-contributor
- Hard fail: VP, Director, Managing Director, Partner, C-suite, "Head of" at a large company (200+ people)

SCORING:
- 85+: excellent fit — Israel/remote, right seniority, right industry, right role type
- 70–84: solid — minor mismatch (e.g. slightly senior or non-fintech but strong interest signal)
- 50–69: tangential — worth seeing but real gaps
- <50: filter out

ROLE TYPES (positive signal): Private banking RM, Fintech BD/Partnerships, VC/PE Analyst-Associate, Corporate Development, Account Executive (B2B), Finance ops/treasury IF salary clearly exceeds 18,000 NIS/month.

SALARY: Convert to NIS using 1 USD=2.95, 1 EUR=3.5, 1 CHF=3.8, 1 GBP=3.75. If salary unknown, don't penalise — leave to human judgment.

Write a 1–2 sentence "fit_note" in direct language. List 2–4 "match_bullets" — short concrete match points.

Return ONLY valid JSON, no markdown, no prose:
{"score": number, "fit_note": string, "match_bullets": string[]}`;

let _anthropic: Anthropic | undefined;
let _openai: OpenAI | undefined;

function anthropicClient(): Anthropic {
  if (!_anthropic) {
    const key = process.env['ANTHROPIC_API_KEY'];
    if (!key) throw new Error('Missing ANTHROPIC_API_KEY');
    _anthropic = new Anthropic({ apiKey: key });
  }
  return _anthropic;
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

async function scoreWithAnthropic(job: ScrapedJob): Promise<Scoring> {
  const res = await anthropicClient().messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: SCORING_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `PROFILE:\n${JSON.stringify(PROFILE, null, 2)}\n\nJOB:\n${JSON.stringify(job, null, 2)}\n\nReturn the JSON scoring.`,
      },
    ],
  });
  const block = res.content[0];
  const text = block?.type === 'text' ? block.text : '';
  if (!text) throw new Error('Empty response from Claude scorer');
  return parseJson(text);
}

async function scoreWithOpenAI(job: ScrapedJob): Promise<Scoring> {
  const res = await openaiClient().chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 512,
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
    const scoring = await scoreWithAnthropic(job);
    logger.debug({ title: job.title, score: scoring.score }, 'scored (claude)');
    return scoring;
  } catch (err: unknown) {
    const status = (err as { status?: number }).status;
    const isUsageLimit = status === 400 && String(err).includes('usage limits');
    if (!isUsageLimit) throw err;
    // Anthropic usage limit hit — fall back to OpenAI
    logger.debug({ title: job.title }, 'claude limit — falling back to openai');
    const scoring = await scoreWithOpenAI(job);
    logger.debug({ title: job.title, score: scoring.score }, 'scored (openai)');
    return scoring;
  }
}
