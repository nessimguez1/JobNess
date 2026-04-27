// FX → NIS. Single source of truth — exported so the scorer prompt and salary
// parsers both read FX_TO_NIS and can never drift apart.

export const FX_TO_NIS = {
  USD: 3.65,
  EUR: 3.95,
  CHF: 4.15,  // Swiss firms paying remote-Israel hires in CHF
  GBP: 4.60,
  ILS: 1.0,
  NIS: 1.0,
} as const;

type SupportedCurrency = keyof typeof FX_TO_NIS;

/**
 * Parse a salary string like "CHF 110K–140K/yr", "€55K", "25,000 NIS/mo", "$120K/yr"
 * into NIS/month. Returns the lower bound of a range. Returns undefined if unparseable.
 */
export function parseSalaryNIS(text: string | undefined): number | undefined {
  if (!text) return undefined;

  const upper = text.toUpperCase().replace(/,/g, '');

  let currency: SupportedCurrency = 'ILS';
  if (upper.includes('CHF'))                                currency = 'CHF';
  else if (upper.includes('EUR') || upper.includes('€'))    currency = 'EUR';
  else if (upper.includes('USD') || upper.includes('$'))    currency = 'USD';
  else if (upper.includes('GBP') || upper.includes('£'))    currency = 'GBP';

  // K-suffixed number (e.g. 110K) takes priority over plain large number
  const kMatch = upper.match(/(\d+(?:\.\d+)?)\s*K/);
  const plainMatch = upper.match(/(\d{4,})/);

  let amount: number;
  if (kMatch?.[1])         amount = parseFloat(kMatch[1]) * 1000;
  else if (plainMatch?.[1]) amount = parseFloat(plainMatch[1]);
  else return undefined;

  const isYearly = /\bYR\b|\bYEAR\b|\bANNUAL\b|\/YR|PER YEAR|P\.?A\.?\b/.test(upper);
  const monthly = isYearly ? amount / 12 : amount;

  return Math.round(monthly * FX_TO_NIS[currency]);
}
