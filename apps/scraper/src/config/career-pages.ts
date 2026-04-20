export interface CareerPageTarget {
  company: string;
  slug: string;
  ats: 'greenhouse' | 'lever' | 'workday' | 'custom';
  website?: string;
}

export const CAREER_PAGES: CareerPageTarget[] = [
  // ── Israeli Fintech ──────────────────────────────────
  { company: 'Melio',        slug: 'melio',        ats: 'greenhouse', website: 'https://meliopayments.com' },
  { company: 'Rapyd',        slug: 'rapyd',        ats: 'greenhouse', website: 'https://rapyd.net' },
  { company: 'Payoneer',     slug: 'payoneer',     ats: 'greenhouse', website: 'https://payoneer.com' },
  { company: 'Pagaya',       slug: 'pagaya',       ats: 'greenhouse', website: 'https://pagaya.com' },
  { company: 'eToro',        slug: 'etoro',        ats: 'greenhouse', website: 'https://etoro.com' },
  { company: 'Tipalti',      slug: 'tipalti',      ats: 'greenhouse', website: 'https://tipalti.com' },
  { company: 'Papaya Global', slug: 'papayaglobal', ats: 'greenhouse', website: 'https://papayaglobal.com' },
  { company: 'Riskified',    slug: 'riskified',    ats: 'greenhouse', website: 'https://riskified.com' },
  { company: 'monday.com',   slug: 'mondaycom',    ats: 'greenhouse', website: 'https://monday.com' },
  { company: 'Lemonade',     slug: 'lemonade',     ats: 'greenhouse', website: 'https://lemonade.com' },
  { company: 'Wix',          slug: 'wix',          ats: 'greenhouse', website: 'https://wix.com' },
  { company: 'Fiverr',       slug: 'fiverr',       ats: 'greenhouse', website: 'https://fiverr.com' },
  { company: 'Kaltura',      slug: 'kaltura',      ats: 'greenhouse', website: 'https://kaltura.com' },
  { company: 'Lusha',        slug: 'lusha',        ats: 'greenhouse', website: 'https://lusha.com' },
  { company: 'Nuvei',        slug: 'nuvei',        ats: 'greenhouse', website: 'https://nuvei.com' },
  { company: 'OurCrowd',     slug: 'ourcrowd',     ats: 'greenhouse', website: 'https://ourcrowd.com' },
  { company: 'Fundbox',      slug: 'fundbox',      ats: 'greenhouse', website: 'https://fundbox.com' },
  { company: 'Global-e',     slug: 'global-e',     ats: 'greenhouse', website: 'https://global-e.com' },

  // ── Global Fintech ───────────────────────────────────
  { company: 'Wise',         slug: 'wise',         ats: 'greenhouse', website: 'https://wise.com' },
  { company: 'Checkout.com', slug: 'checkout',     ats: 'greenhouse', website: 'https://checkout.com' },
  { company: 'Airwallex',    slug: 'airwallex',    ats: 'greenhouse', website: 'https://airwallex.com' },
  { company: 'Deel',         slug: 'deel',         ats: 'greenhouse', website: 'https://deel.com' },

  // ── French & European Fintech (Lever) ───────────────
  { company: 'Qonto',        slug: 'qonto',        ats: 'lever',      website: 'https://qonto.com' },
  { company: 'Alan',         slug: 'alan',         ats: 'lever',      website: 'https://alan.com' },
  { company: 'Ledger',       slug: 'ledger',       ats: 'lever',      website: 'https://ledger.com' },
  { company: 'Pennylane',    slug: 'pennylane',    ats: 'lever',      website: 'https://pennylane.com' },
  { company: 'Spendesk',     slug: 'spendesk',     ats: 'lever',      website: 'https://spendesk.com' },
];
