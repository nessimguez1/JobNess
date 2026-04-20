import { CAREER_PAGES } from './config/career-pages.js';
import { companyId, mono } from './utils/hash.js';

function esc(v: string | null | undefined): string {
  if (v === null || v === undefined) return 'null';
  return `'${v.replace(/'/g, "''")}'`;
}

const rows = CAREER_PAGES.map(t => [
  esc(companyId(t.company)),
  esc(t.company),
  esc(mono(t.company)),
  esc(t.slug),
  esc(t.ats),
  esc(t.website ?? null),
  esc(t.sector),
  "'config'",
].join(', '));

console.log('-- Seed companies from career-pages.ts — idempotent via ON CONFLICT.');
console.log('insert into companies (id, name, mono, slug, ats, website, sector, source) values');
console.log(rows.map(r => `  (${r})`).join(',\n'));
console.log('on conflict (id) do nothing;');
