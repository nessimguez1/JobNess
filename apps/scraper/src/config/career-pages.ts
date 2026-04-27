export interface CareerPageTarget {
  company: string;
  slug: string;
  ats: 'greenhouse' | 'lever' | 'workday' | 'custom';
  website?: string;
  sector: CompanySector;
}

export type CompanySector =
  | 'Israeli Fintech'
  | 'Israeli Tech'
  | 'European Fintech'
  | 'Global Fintech'
  | 'WealthTech'
  | 'VC / Growth'
  | 'HR-Tech / SaaS'
  | 'Swiss Private Bank'
  | 'Family Office'
  | 'Israeli Wealth';

type RawEntry = Omit<CareerPageTarget, 'sector'>;
function tag(sector: CompanySector, entries: RawEntry[]): CareerPageTarget[] {
  return entries.map(e => ({ ...e, sector }));
}

// Verified Greenhouse boards only. Slugs that 404'd in production (Lemonade,
// Hippo, Tipalti, Rapyd, Papaya Global, Nayax, BlueVine, Earnix, Justt, eToro)
// were removed — those companies are on different ATS systems (Workday,
// Comeet, custom) and need dedicated scrapers, not Greenhouse guesses.
const ISRAELI_FINTECH: RawEntry[] = [
  { company: 'Melio',          slug: 'melio',          ats: 'greenhouse', website: 'https://meliopayments.com' },
  { company: 'Payoneer',       slug: 'payoneer',       ats: 'greenhouse', website: 'https://payoneer.com' },
  { company: 'Pagaya',         slug: 'pagaya',         ats: 'greenhouse', website: 'https://pagaya.com' },
  { company: 'Riskified',      slug: 'riskified',      ats: 'greenhouse', website: 'https://riskified.com' },
  { company: 'Check',          slug: 'check',          ats: 'greenhouse', website: 'https://checkhq.com' },
  { company: 'Obligo',         slug: 'obligo',         ats: 'greenhouse', website: 'https://obligo.com' },
  { company: 'Pontera',        slug: 'pontera',        ats: 'greenhouse', website: 'https://pontera.com' },
  { company: 'Capitolis',      slug: 'capitolis',      ats: 'greenhouse', website: 'https://capitolis.com' },
  { company: 'Forter',         slug: 'forter',         ats: 'greenhouse', website: 'https://forter.com' },
];

// Verified Greenhouse boards only. Slugs that 404'd in production
// (monday.com, Fiverr, Snyk, Wiz, Hibob, Outbrain, WalkMe, Verbit,
// Coralogix, Aqua Security, Armis, HoneyBook) were removed — those
// companies are on different ATS (Workday, Comeet, Lever-not-found, custom).
const ISRAELI_TECH: RawEntry[] = [
  { company: 'Orca Security',  slug: 'orcasecurity',   ats: 'greenhouse', website: 'https://orca.security' },
  { company: 'SimilarWeb',     slug: 'similarweb',     ats: 'greenhouse', website: 'https://similarweb.com' },
  { company: 'AppsFlyer',      slug: 'appsflyer',      ats: 'greenhouse', website: 'https://appsflyer.com' },
  { company: 'Taboola',        slug: 'taboola',        ats: 'greenhouse', website: 'https://taboola.com' },
  { company: 'Bringg',         slug: 'bringg',         ats: 'greenhouse', website: 'https://bringg.com' },
  { company: 'Lightricks',     slug: 'lightricks',     ats: 'greenhouse', website: 'https://lightricks.com' },
  { company: 'Cybereason',     slug: 'cybereason',     ats: 'greenhouse', website: 'https://cybereason.com' },
  { company: 'Connecteam',     slug: 'connecteam',     ats: 'greenhouse', website: 'https://connecteam.com' },
  { company: 'Cato Networks',  slug: 'catonetworks',   ats: 'greenhouse', website: 'https://catonetworks.com' },
  { company: 'Yotpo',          slug: 'yotpo',          ats: 'greenhouse', website: 'https://yotpo.com' },
  { company: 'Sisense',        slug: 'sisense',        ats: 'greenhouse', website: 'https://sisense.com' },
  { company: 'JFrog',          slug: 'jfrog',          ats: 'greenhouse', website: 'https://jfrog.com' },
  { company: 'BigID',          slug: 'bigid',          ats: 'greenhouse', website: 'https://bigid.com' },
  { company: 'Salt Security',  slug: 'saltsecurity',   ats: 'greenhouse', website: 'https://salt.security' },
];

// No France-based companies — the user's geo excludes France entirely.
const EUROPEAN_FINTECH: RawEntry[] = [
  { company: 'Pleo',           slug: 'pleo',           ats: 'greenhouse', website: 'https://pleo.io' },
  { company: 'Liberis',        slug: 'liberis',        ats: 'greenhouse', website: 'https://liberis.com' },
  { company: 'Trade Republic', slug: 'traderepublic',  ats: 'greenhouse', website: 'https://traderepublic.com' },
];

const GLOBAL_FINTECH: RawEntry[] = [
  { company: 'Ripple',         slug: 'ripple',         ats: 'greenhouse', website: 'https://ripple.com' },
  { company: 'Stripe',         slug: 'stripe',         ats: 'greenhouse', website: 'https://stripe.com' },
  { company: 'Brex',           slug: 'brex',           ats: 'greenhouse', website: 'https://brex.com' },
  { company: 'Marqeta',        slug: 'marqeta',        ats: 'greenhouse', website: 'https://marqeta.com' },
  { company: 'Ebury',          slug: 'ebury',          ats: 'greenhouse', website: 'https://ebury.com' },
  { company: 'Fireblocks',     slug: 'fireblocks',     ats: 'greenhouse', website: 'https://fireblocks.com' },
  { company: 'Bitpanda',       slug: 'bitpanda',       ats: 'greenhouse', website: 'https://bitpanda.com' },
  { company: 'Adyen',          slug: 'adyen',          ats: 'greenhouse', website: 'https://adyen.com' },
  { company: 'Mercury',        slug: 'mercury',        ats: 'greenhouse', website: 'https://mercury.com' },
  { company: 'BILL',           slug: 'billcom',        ats: 'greenhouse', website: 'https://bill.com' },
];

const WEALTHTECH: RawEntry[] = [
  { company: 'Carta',          slug: 'carta',          ats: 'greenhouse', website: 'https://carta.com' },
  { company: 'Vestwell',       slug: 'vestwell',       ats: 'greenhouse', website: 'https://vestwell.com' },
  { company: 'iCapital',       slug: 'icapitalnetwork', ats: 'greenhouse', website: 'https://icapitalnetwork.com' },
  { company: 'Moonfare',       slug: 'moonfare',       ats: 'greenhouse', website: 'https://moonfare.com' },
  { company: 'Betterment',     slug: 'betterment',     ats: 'greenhouse', website: 'https://betterment.com' },
];

const VC_GROWTH: RawEntry[] = [
  { company: 'General Atlantic', slug: 'generalatlantic', ats: 'greenhouse', website: 'https://generalatlantic.com' },
  { company: 'Atomico',         slug: 'atomico',       ats: 'greenhouse', website: 'https://atomico.com' },
];

const HR_SAAS: RawEntry[] = [
  { company: 'Remote.com',     slug: 'remote',         ats: 'greenhouse', website: 'https://remote.com' },
  { company: 'Pendo',          slug: 'pendo',          ats: 'greenhouse', website: 'https://pendo.io' },
  { company: 'Salesloft',      slug: 'salesloft',      ats: 'greenhouse', website: 'https://salesloft.com' },
  { company: 'ZoomInfo',       slug: 'zoominfo',       ats: 'greenhouse', website: 'https://zoominfo.com' },
];

export const CAREER_PAGES: CareerPageTarget[] = [
  ...tag('Israeli Fintech',   ISRAELI_FINTECH),
  ...tag('Israeli Tech',      ISRAELI_TECH),
  ...tag('European Fintech',  EUROPEAN_FINTECH),
  ...tag('Global Fintech',    GLOBAL_FINTECH),
  ...tag('WealthTech',        WEALTHTECH),
  ...tag('VC / Growth',       VC_GROWTH),
  ...tag('HR-Tech / SaaS',    HR_SAAS),
];
