import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import type { ScrapedJob, Scoring } from '@jobness/shared';
import { PROFILE } from '@jobness/shared';
import { logger } from './utils/logger.js';

const SCORING_SYSTEM = `You are a job-fit scorer for Nessim Guez's private job hunt. Given a scraped job listing and his profile, score fit 0–100:

- 85+: excellent fit, apply with conviction
- 70–84: solid fit, worth applying
- 50–69: tangential, only if stretching
- <50: poor fit, filter out

Consider: seniority match, language requirements (FR/EN/HE), industry alignment (private banking, fintech BD, VC), geography (Israel/remote EU-US), salary (must exceed 18000 NIS/month equivalent).

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
