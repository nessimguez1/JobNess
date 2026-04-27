import type { CareerPageTarget, CompanySector } from './career-pages.js';

// Outreach-only targets. ats:'custom' so the scraper skips them; they show
// in the Companies UI as a "speculative" badge for cold outreach to TLV
// desks. None of these are Singapore-located by intent.

type SpeculativeEntry = Omit<CareerPageTarget, 'sector' | 'ats'>;
function tagged(sector: CompanySector, entries: SpeculativeEntry[]): CareerPageTarget[] {
  return entries.map(e => ({ ...e, sector, ats: 'custom' as const }));
}

const SWISS_PRIVATE_BANKS: SpeculativeEntry[] = [
  { company: 'Pictet & Cie',                     slug: 'pictet',           website: 'https://www.pictet.com' },
  { company: 'Lombard Odier',                    slug: 'lombardodier',     website: 'https://www.lombardodier.com' },
  { company: 'Julius Baer',                      slug: 'juliusbaer',       website: 'https://www.juliusbaer.com' },
  { company: 'Edmond de Rothschild',             slug: 'edrothschild',     website: 'https://www.edmond-de-rothschild.com' },
  { company: 'Mirabaud',                         slug: 'mirabaud',         website: 'https://www.mirabaud.com' },
  { company: 'Bordier & Cie',                    slug: 'bordier',          website: 'https://www.bordier.com' },
  { company: 'Banque Syz',                       slug: 'syz',              website: 'https://www.syzgroup.com' },
  { company: 'REYL Intesa Sanpaolo',             slug: 'reyl',             website: 'https://www.reyl.com' },
  { company: 'Vontobel',                         slug: 'vontobel',         website: 'https://www.vontobel.com' },
  { company: 'Bank J. Safra Sarasin',            slug: 'safrasarasin',     website: 'https://www.jsafrasarasin.com' },
  { company: 'LGT Group',                        slug: 'lgt',              website: 'https://www.lgt.com' },
  { company: 'Banque Heritage',                  slug: 'banqueheritage',   website: 'https://www.banqueheritage.ch' },
  { company: 'EFG International',                slug: 'efginternational', website: 'https://www.efginternational.com' },
  { company: 'Banque Cramer',                    slug: 'banquecramer',     website: 'https://www.banquecramer.ch' },
  { company: 'Gonet & Cie',                      slug: 'gonet',            website: 'https://www.gonet.ch' },
  { company: 'Banque Pâris Bertrand',            slug: 'parisbertrand',    website: 'https://www.parisbertrand.com' },
  { company: 'CBH Compagnie Bancaire',           slug: 'cbh',              website: 'https://www.cbhbank.com' },
  { company: 'Quintet Private Bank',             slug: 'quintet',          website: 'https://www.quintet.com' },
  { company: 'Hottinger & Co',                   slug: 'hottinger',        website: 'https://www.hottinger.com' },
  { company: 'Privatbank IHAG',                  slug: 'ihag',             website: 'https://www.ihag.ch' },
  { company: 'Banque Audi (Suisse)',             slug: 'banqueaudi',       website: 'https://www.bankaudipb.com' },
];

const FAMILY_OFFICES: SpeculativeEntry[] = [
  { company: 'Stonehage Fleming',          slug: 'stonehagefleming', website: 'https://www.stonehagefleming.com' },
  { company: 'Bedrock Group',              slug: 'bedrockgroup',     website: 'https://www.bedrockgroup.ch' },
  { company: 'Iconiq Capital',             slug: 'iconiqcapital',    website: 'https://www.iconiqcapital.com' },
  { company: 'Cain International',         slug: 'cain',             website: 'https://www.cain.co' },
  { company: 'Pacenote Family Office',     slug: 'pacenote',         website: 'https://www.pacenotefamilyoffice.com' },
  { company: 'Hottinger Family Office',    slug: 'hottingerfo',      website: 'https://www.hottinger.com/family-office/' },
  { company: 'LJ Partnership',             slug: 'ljpartnership',    website: 'https://www.ljpartnership.com' },
  { company: 'Sandaire',                   slug: 'sandaire',         website: 'https://www.sandaire.com' },
  { company: 'Pamoja Capital',             slug: 'pamojacapital',    website: 'https://www.pamojacapital.com' },
  { company: 'Tikvah Capital',             slug: 'tikvahcap',        website: 'https://www.tikvahcap.com' },
];

const ISRAELI_WEALTH: SpeculativeEntry[] = [
  { company: 'Bank Hapoalim Premium',          slug: 'hapoalimpremium',  website: 'https://www.bankhapoalim.com' },
  { company: 'Bank Leumi Private Banking',     slug: 'leumiprivate',     website: 'https://www.bankleumi.co.il' },
  { company: 'Mizrahi Tefahot Premium',        slug: 'mizrahipremium',   website: 'https://www.mizrahi-tefahot.co.il' },
  { company: 'IBI Israel Brokerage',           slug: 'ibi',              website: 'https://www.ibi.co.il' },
  { company: 'Excellence Investments',         slug: 'excellence',       website: 'https://www.excellence.co.il' },
  { company: 'Migdal Capital Markets',         slug: 'migdalcap',        website: 'https://www.migdal.co.il' },
  { company: 'Phoenix Investments',            slug: 'phoenixinv',       website: 'https://www.fnx.co.il' },
  { company: 'Harel Investments',              slug: 'harel',            website: 'https://www.harel-group.co.il' },
  { company: 'Meitav Dash',                    slug: 'meitavdash',       website: 'https://www.meitavdash.co.il' },
  { company: 'Psagot Investment House',        slug: 'psagot',           website: 'https://www.psagot.co.il' },
  { company: 'Altshuler Shaham',               slug: 'altshul',          website: 'https://www.altshul.co.il' },
  { company: 'Yelin Lapidot',                  slug: 'yelinlapidot',     website: 'https://www.yl-invest.co.il' },
  { company: 'Analyst Investment House',       slug: 'analystih',        website: 'https://www.analyst.co.il' },
  { company: 'More Investment House',          slug: 'moreih',           website: 'https://www.more.co.il' },
];

export const SPECULATIVE_COMPANIES: CareerPageTarget[] = [
  ...tagged('Swiss Private Bank', SWISS_PRIVATE_BANKS),
  ...tagged('Family Office',      FAMILY_OFFICES),
  ...tagged('Israeli Wealth',     ISRAELI_WEALTH),
];
