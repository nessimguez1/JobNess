import { createHash } from 'crypto';

export function jobId(company: string, title: string, location: string): string {
  const raw = `${company.toLowerCase()}|${title.toLowerCase()}|${location.toLowerCase()}`;
  return createHash('sha256').update(raw).digest('hex').slice(0, 12);
}

export function companyId(name: string): string {
  const norm = name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 40);
  return `c_${norm}`;
}

export function mono(company: string): string {
  const words = company.trim().split(/\s+/);
  if (words.length >= 2 && words[0] && words[1]) {
    return ((words[0][0] ?? '') + (words[1][0] ?? '')).toUpperCase();
  }
  return company.slice(0, 2).toUpperCase();
}
