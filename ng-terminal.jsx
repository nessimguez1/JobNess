import { useState, useEffect } from 'react';
import {
  Briefcase, Heart, Mail, ExternalLink, Linkedin,
  Settings, BarChart2, Check, RotateCcw, Copy, Inbox,
  Trash2, RefreshCw, Target, Plus, Sliders, Globe,
  Archive, Shield, Lock, AlertCircle, Send, FileText,
  MapPin, X, UserCheck, Edit3, Star,
} from 'lucide-react';

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap');

* { -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }

.app-font {
  font-family: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
}

.num { font-variant-numeric: tabular-nums; letter-spacing: -0.01em; }

.bg-paper { background-color: #faf7f0; }
.bg-card { background-color: #ffffff; }
.bg-soft { background-color: #f4f0e6; }
.bg-softer { background-color: #efeadd; }
.bg-ink { background-color: #1a1815; }
.b-line { border-color: #e5dfce; }
.b-line-strong { border-color: #d4cdb8; }

.t-ink { color: #1a1815; }
.t-muted { color: #6b6558; }
.t-dim { color: #9c9585; }
.t-paper { color: #faf7f0; }

.t-forest { color: #3f5c2e; }
.t-brick { color: #8b3a2e; }
.t-steel { color: #3a5a7a; }
.t-amber { color: #8a6d1f; }

.bg-forest-soft { background-color: #e6ece0; }
.bg-brick-soft { background-color: #f2e4e0; }
.bg-steel-soft { background-color: #e4ebf2; }
.bg-amber-soft { background-color: #f2e9cc; }

.b-olive-soft { border-color: #c9d3a8; }
.b-brick-soft { border-color: #d9b8b0; }
.b-steel-soft { border-color: #b5c4d6; }
.b-amber-soft { border-color: #d9c888; }

.shadow-card { box-shadow: 0 1px 2px rgba(26, 24, 21, 0.04); }
.shadow-modal { box-shadow: 0 20px 50px rgba(26, 24, 21, 0.18), 0 8px 20px rgba(26, 24, 21, 0.08); }

.scroll-thin::-webkit-scrollbar { width: 6px; height: 6px; }
.scroll-thin::-webkit-scrollbar-track { background: transparent; }
.scroll-thin::-webkit-scrollbar-thumb { background: #d4cdb8; border-radius: 3px; }
.scroll-thin::-webkit-scrollbar-thumb:hover { background: #b8af95; }

.card-hover { transition: all 0.15s ease; }
.card-hover:hover { border-color: #c7bfa8; box-shadow: 0 4px 12px rgba(26, 24, 21, 0.06); }

.btn-ghost { transition: all 0.12s ease; color: #6b6558; }
.btn-ghost:hover { color: #1a1815; background-color: #f4f0e6; }
.btn-ghost-sage:hover { color: #3f5c2e; background-color: #e6ece0; }
.btn-ghost-brick:hover { color: #8b3a2e; background-color: #f2e4e0; }
.btn-ghost-steel:hover { color: #3a5a7a; background-color: #e4ebf2; }

.btn-primary {
  background: #1a1815;
  color: #faf7f0;
  transition: all 0.12s ease;
}
.btn-primary:hover { background: #2d2923; }

.pulse-dot { animation: pdot 2.4s ease-in-out infinite; }
@keyframes pdot { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

.fade-in { animation: fin 0.2s ease; }
@keyframes fin { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }

.modal-bg { animation: mbg 0.18s ease; }
@keyframes mbg { from { opacity: 0; } to { opacity: 1; } }

.modal-panel { animation: mp 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
@keyframes mp { from { opacity: 0; transform: translateY(6px) scale(0.99); } to { opacity: 1; transform: translateY(0) scale(1); } }

input, textarea, select {
  font-family: 'Geist', sans-serif;
  color: #1a1815;
  background: #ffffff;
}
input:focus, textarea:focus { outline: none; border-color: #1a1815; }
input[type="range"] { accent-color: #1a1815; }

.paper-texture {
  background-image:
    radial-gradient(circle at 20% 30%, rgba(138, 109, 31, 0.025) 0%, transparent 50%),
    radial-gradient(circle at 80% 70%, rgba(58, 90, 122, 0.02) 0%, transparent 50%);
}
`;

const INITIAL_JOBS = [
  { id: 'j1', column: 'inbox', status: 'new', title: 'Relationship Manager — French Desk', company: 'Julius Baer', mono: 'JB', location: 'Geneva, CH (hybrid)', salaryText: 'CHF 110K–140K/yr', salaryNIS: 38000, source: 'CareerPage', url: 'https://www.juliusbaer.com/careers', companySite: 'https://www.juliusbaer.com', companyLinkedin: 'https://www.linkedin.com/company/julius-baer/', hmLinkedin: null, postedDaysAgo: 2, score: 92,
    fitNote: 'Ideal crossborder FR–IL fit. Julius Baer\'s French Desk is actively growing, and your UBP background + trilingual profile maps 1:1 to what they hire.',
    description: 'Senior RM role covering French-speaking HNWI clients across EMEA. Build book of business, coordinate with product specialists, manage regulatory KYC with Geneva.',
    matchBullets: ['Swiss PB experience (UBP)', 'FR-speaking HNWI origination', 'Geneva KYC/onboarding workflow'] },
  { id: 'j2', column: 'inbox', status: 'new', title: 'BD Manager — EMEA', company: 'Rapyd', mono: 'RP', location: 'Tel Aviv (hybrid)', salaryText: '25,000–30,000 NIS/mo', salaryNIS: 27500, source: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/rapyd-bd-emea', companySite: 'https://www.rapyd.net', companyLinkedin: 'https://www.linkedin.com/company/rapyd-net/', hmLinkedin: 'https://www.linkedin.com/in/mock-hm-rapyd', postedDaysAgo: 1, score: 88,
    fitNote: 'Fintech BD with EMEA scope in TLV. Your IATI network overlaps with Rapyd\'s partner ecosystem; FR angle is a bonus.',
    description: 'Drive partnership revenue across European payment rails. Work with banking partners and merchants.',
    matchBullets: ['B2B partnerships track record', 'TLV tech ecosystem access (IATI)', 'Cross-border EMEA fluency'] },
  { id: 'j3', column: 'inbox', status: 'new', title: 'Country Lead — Israel', company: 'Qonto', mono: 'QO', location: 'Remote (TLV-based)', salaryText: '€55K–70K/yr + equity', salaryNIS: 22500, source: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/qonto-country-lead-il', companySite: 'https://qonto.com', companyLinkedin: 'https://www.linkedin.com/company/qonto/', hmLinkedin: 'https://www.linkedin.com/in/mock-qonto-founder', postedDaysAgo: 4, score: 91,
    fitNote: 'French fintech entering Israel — you are literally the profile they need. Founder is FR; Head-of-BD trajectory at a Series D unicorn.',
    description: 'Stand up Qonto\'s Israel presence. Build local banking partnerships, hire first IL team, own P&L.',
    matchBullets: ['Native FR + IL market access', 'BD + partnerships experience', 'Startup-scale operator mindset'] },
  { id: 'j4', column: 'inbox', status: 'new', title: 'Associate RM — Franco-Israeli Clients', company: 'Pictet & Cie', mono: 'PT', location: 'Zurich, CH', salaryText: 'CHF 95K–115K/yr', salaryNIS: 32000, source: 'CareerPage', url: 'https://www.pictet.com/careers', companySite: 'https://www.pictet.com', companyLinkedin: 'https://www.linkedin.com/company/pictet/', hmLinkedin: null, postedDaysAgo: 6, score: 85,
    fitNote: 'Top-tier Swiss PB, exact client profile you already serve. Zurich relocation to consider.',
    description: 'Support senior RMs covering HNWI families with French-Israeli footprint.',
    matchBullets: ['UBP pedigree', 'FR-HE-EN fluency', 'Cross-border KYC experience'] },
  { id: 'j5', column: 'inbox', status: 'new', title: 'Head of Partnerships — EU Expansion', company: 'Melio', mono: 'ML', location: 'TLV + remote EU', salaryText: '28,000–35,000 NIS/mo + equity', salaryNIS: 31500, source: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/melio-partnerships-eu', companySite: 'https://meliopayments.com', companyLinkedin: 'https://www.linkedin.com/company/melio-payments/', hmLinkedin: 'https://www.linkedin.com/in/mock-melio-cro', postedDaysAgo: 3, score: 87,
    fitNote: 'B2B fintech scaling into EU. Your FR/EN network + BD skillset is precisely the leverage they need.',
    description: 'Own EU partner pipeline: banks, accounting platforms, SaaS integrations.',
    matchBullets: ['BD + partner sourcing track', 'EU relationships (FR specifically)', 'Fluency in SaaS deal cycles'] },
  { id: 'j6', column: 'inbox', status: 'new', title: 'Private Banker — Israel Desk', company: 'Edmond de Rothschild', mono: 'ER', location: 'Geneva / TLV liaison', salaryText: 'CHF 95K–125K/yr', salaryNIS: 34000, source: 'CareerPage', url: 'https://www.edmond-de-rothschild.com/careers', companySite: 'https://www.edmond-de-rothschild.com', companyLinkedin: 'https://www.linkedin.com/company/edmond-de-rothschild/', hmLinkedin: null, postedDaysAgo: 5, score: 90,
    fitNote: 'Legendary name, strong Israel book, aligned with your client origination pattern. Family-owned — culture matches private banking discretion.',
    description: 'Manage full life-cycle HNWI relationships across Israel with structured products support from Geneva.',
    matchBullets: ['Trilingual HNWI servicing', 'Tel Aviv + Paris referral network', 'Swiss PB ops knowledge'] },
  { id: 'j7', column: 'inbox', status: 'new', title: 'Strategic Partnerships Director', company: 'Pagaya', mono: 'PG', location: 'Tel Aviv', salaryText: '30,000–38,000 NIS/mo + RSUs', salaryNIS: 34000, source: 'Drushim', url: 'https://www.drushim.co.il/jobs/pagaya', companySite: 'https://pagaya.com', companyLinkedin: 'https://www.linkedin.com/company/pagaya/', hmLinkedin: null, postedDaysAgo: 8, score: 76,
    fitNote: 'Public IL fintech (NASDAQ:PGY) with institutional reach. Seniority is a stretch — they may push you to manager-level.',
    description: 'Build strategic credit partnerships with banks and asset managers. Director-level, reports to CRO.',
    matchBullets: ['Institutional BD appetite', 'Credit market fluency', 'IL tech ecosystem exposure'] },
  { id: 'j8', column: 'interested', status: 'interested', title: 'Senior Client Advisor — French Market', company: 'Lombard Odier', mono: 'LO', location: 'Geneva, CH', salaryText: 'CHF 115K–145K/yr', salaryNIS: 40000, source: 'CareerPage', url: 'https://www.lombardodier.com/careers', companySite: 'https://www.lombardodier.com', companyLinkedin: 'https://www.linkedin.com/company/lombard-odier/', hmLinkedin: null, postedDaysAgo: 9, score: 89,
    fitNote: 'Prestige Geneva PB. FR market desk specifically — strong for FR-speaking HNWI origination.',
    description: 'Classic PB path covering French-market clients; full Geneva platform support.',
    matchBullets: ['FR-native client fluency', 'Swiss PB framework (UBP)', 'Strong referral network'] },
  { id: 'j9', column: 'interested', status: 'interested', title: 'Partnerships Lead — Israel', company: 'Alan', mono: 'AL', location: 'Remote (TLV-based)', salaryText: '€65K–80K/yr + equity', salaryNIS: 27000, source: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/alan-partnerships-il', companySite: 'https://alan.com', companyLinkedin: 'https://www.linkedin.com/company/alan-france/', hmLinkedin: 'https://www.linkedin.com/in/mock-alan-head-partnerships', postedDaysAgo: 11, score: 82,
    fitNote: 'FR health fintech exploring IL. Good lateral if you want EU-adjacent fintech experience.',
    description: 'Source and close broker + enterprise partnerships for Alan\'s Israel market-entry phase.',
    matchBullets: ['FR-IL market bridge', 'BD track record', 'Startup operator instincts'] },
  { id: 'j10', column: 'applied', status: 'applied', title: 'Relationship Manager', company: 'Banque Syz', mono: 'BS', location: 'Geneva, CH', salaryText: 'CHF 100K–130K/yr', salaryNIS: 35000, source: 'CareerPage', url: 'https://www.syzgroup.com/careers', companySite: 'https://www.syzgroup.com', companyLinkedin: 'https://www.linkedin.com/company/syz-group/', hmLinkedin: null, postedDaysAgo: 14, appliedDaysAgo: 3, score: 90,
    fitNote: 'Boutique Swiss PB, strong entrepreneurial culture — good seat to grow a book.',
    description: 'Independent-minded Swiss PB with a meritocratic RM track.',
    matchBullets: ['Proven HNWI origination', 'Trilingual profile', 'Cross-border EU/IL fluency'] },
  { id: 'j11', column: 'applied', status: 'applied', title: 'BD Manager — Wealth Division', company: 'eToro', mono: 'ET', location: 'Tel Aviv (hybrid)', salaryText: '26,000–32,000 NIS/mo + RSUs', salaryNIS: 29000, source: 'LinkedIn', url: 'https://www.linkedin.com/jobs/view/etoro-bd-wealth', companySite: 'https://www.etoro.com', companyLinkedin: 'https://www.linkedin.com/company/etoro/', hmLinkedin: 'https://www.linkedin.com/in/mock-etoro-wealth-lead', postedDaysAgo: 21, appliedDaysAgo: 7, score: 84,
    fitNote: 'Retail-adjacent wealth push at eToro. Good visibility, mixed between retail and HNWI segments.',
    description: 'Build wealth-product partnerships and institutional channels for eToro\'s new wealth tier.',
    matchBullets: ['Wealth product familiarity', 'IL tech ecosystem', 'Partnership sourcing'] },
  { id: 'j12', column: 'archive', status: 'rejected', title: 'Junior SDR — Outbound', company: 'Generic SaaS', mono: 'SS', location: 'Tel Aviv', salaryText: '15,000–18,000 NIS/mo', salaryNIS: 16500, source: 'LinkedIn', url: '#', companySite: '#', companyLinkedin: '#', hmLinkedin: null, postedDaysAgo: 30, trashedDaysAgo: 12, score: 42,
    fitNote: 'Below your salary floor. Junior SDR is a downgrade from your UBP track.',
    description: 'Cold-calling outbound role for a mid-stage SaaS.', matchBullets: [] },
];

const INITIAL_TARGETS = [
  { id: 't1', name: 'REYL Intesa Sanpaolo', mono: 'RY', type: 'Private Bank', location: 'Geneva, CH', website: 'https://www.reyl.com', linkedin: 'https://www.linkedin.com/company/reyl-cie/', notes: 'Geneva boutique with Middle East & Israel book. Worth a speculative FR-language note to head of HR.', priority: 'high' },
  { id: 't2', name: 'Mirabaud', mono: 'MR', type: 'Private Bank', location: 'Geneva, CH', website: 'https://www.mirabaud.com', linkedin: 'https://www.linkedin.com/company/mirabaud/', notes: 'Old-school Geneva family-owned PB, active FR market. UBP contact knows their head of desk.', priority: 'high' },
  { id: 't3', name: 'Bordier & Cie', mono: 'BO', type: 'Private Bank', location: 'Geneva, CH', website: 'https://www.bordier.com', linkedin: 'https://www.linkedin.com/company/bordier-cie/', notes: 'Independent Geneva PB, discreet, FR-first. Cold note via a mutual in Paris.', priority: 'med' },
  { id: 't4', name: 'Ledger', mono: 'LG', type: 'Fintech / Crypto', location: 'Paris, FR', website: 'https://www.ledger.com', linkedin: 'https://www.linkedin.com/company/ledger-hq/', notes: 'FR crypto hardware leader. BD/partnerships at their institutional arm would fit.', priority: 'med' },
  { id: 't5', name: 'Pennylane', mono: 'PL', type: 'Fintech', location: 'Paris, FR', website: 'https://www.pennylane.com', linkedin: 'https://www.linkedin.com/company/pennylane/', notes: 'FR accounting fintech, Series C. Could use a BD lead for international expansion.', priority: 'med' },
  { id: 't6', name: 'Payoneer', mono: 'PY', type: 'Fintech', location: 'Tel Aviv / NYC', website: 'https://www.payoneer.com', linkedin: 'https://www.linkedin.com/company/payoneer/', notes: 'Large IL fintech, multiple BD teams. Warm intro via IATI network.', priority: 'high' },
  { id: 't7', name: 'Papaya Global', mono: 'PP', type: 'Fintech', location: 'Tel Aviv', website: 'https://www.papayaglobal.com', linkedin: 'https://www.linkedin.com/company/papaya-global/', notes: 'IL global payroll fintech. BD/partnerships scope frequently opens — monitor.', priority: 'med' },
  { id: 't8', name: 'Team8', mono: 'T8', type: 'VC / Foundry', location: 'Tel Aviv', website: 'https://team8.vc', linkedin: 'https://www.linkedin.com/company/team8/', notes: 'Fintech foundry. IR / platform role would suit. Warm intro via IATI plausible.', priority: 'high' },
  { id: 't9', name: 'Aleph', mono: 'AP', type: 'VC', location: 'Tel Aviv', website: 'https://aleph.vc', linkedin: 'https://www.linkedin.com/company/aleph-vc/', notes: 'Top IL VC. Platform / LP relations role would be 10/10 fit for my profile.', priority: 'high' },
];

const BLOCKLIST = ['UBP', 'Union Bancaire Privée', 'Tafnit Discount', 'IATI', 'Israel Advanced Technology Industries', 'Eden Property Group', 'Reichman University'];

function scoreTone(score) {
  if (score >= 85) return { text: 't-forest', bg: 'bg-forest-soft', border: 'b-olive-soft' };
  if (score >= 70) return { text: 't-ink', bg: 'bg-soft', border: 'b-line' };
  return { text: 't-dim', bg: 'bg-soft', border: 'b-line' };
}

function sourceIcon(source, size = 11) {
  if (source === 'LinkedIn') return <Linkedin size={size} />;
  if (source === 'CareerPage') return <Globe size={size} />;
  if (source === 'Drushim') return <Briefcase size={size} />;
  return <Globe size={size} />;
}

function formatRelative(days) {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

function genEmails(job) {
  const firstName = 'Hiring Team';
  const matchLines = (job.matchBullets || []).map(b => `• ${b}`).join('\n');
  const cold = {
    subject: `Application — ${job.title} — Nessim Guez`,
    body: `Dear ${firstName},

I'm writing to apply for the ${job.title} role at ${job.company}. My profile maps cleanly to what the position requires:

${matchLines}

A brief summary: I'm currently a Relationship Manager at UBP (Tel Aviv) where I originate and service HNWI clients across Israel and France, working with Geneva on KYC and onboarding. Before UBP, I spent time inside the Israeli tech ecosystem (IATI) and in wealth at Tafnit Discount. I'm a native trilingual (French, English, Hebrew) with ten years lived in the United States.

I'd welcome a conversation about how this background could contribute to ${job.company}. My CV is attached.

Best regards,
Nessim Guez
nessimguez1@gmail.com | +972 54 649 5846
linkedin.com/in/nessim-guez`,
  };
  const warm = {
    subject: `${job.title} — quick note before I apply`,
    body: `Hi ${firstName},

Saw the ${job.title} opening at ${job.company} and wanted to reach out directly before going through the standard channel.

Quick context: I'm at UBP covering HNWI clients across Israel and France, reporting into the French desk. Prior to UBP, IATI (Israeli tech ecosystem) and Tafnit Discount. Trilingual FR/EN/HE, based in Tel Aviv.

Two reasons the fit feels sharp for ${job.company}:
${matchLines}

Would 15 minutes next week work to discuss? Happy to send the CV ahead of the call.

Best,
Nessim
+972 54 649 5846`,
  };
  const linkedin = {
    subject: `LinkedIn DM — ${job.company}`,
    body: `Hi ${firstName} — saw the ${job.title} role at ${job.company} and the fit is sharp:

I'm at UBP covering French-speaking HNWI clients in TLV/Paris, trilingual FR/EN/HE, with prior exposure to the IL tech ecosystem via IATI. Would 15 min next week work to discuss? I'll send the CV ahead.

— Nessim`,
  };
  return { cold, warm, linkedin };
}

function genTargetEmail(target) {
  return {
    subject: `Speculative note — ${target.name}`,
    body: `Dear ${target.name} Team,

I'm writing on a speculative basis. I follow ${target.name} closely and the trajectory of the firm fits tightly with where I'd like to build the next chapter of my career.

Brief context: I'm currently a Relationship Manager at UBP (Tel Aviv) covering HNWI clients across Israel and France. Before UBP, the Israeli tech ecosystem at IATI and wealth at Tafnit Discount. Native trilingual (FR / EN / HE), ten years lived in the United States, with a live referral network across Tel Aviv and Paris.

If there is any appetite for a conversation — now or in the coming months — I would be delighted to share my CV and discuss how I could contribute.

Best regards,
Nessim Guez
nessimguez1@gmail.com | +972 54 649 5846
linkedin.com/in/nessim-guez`,
  };
}

function JobCard({ job, onMove, onOpen, onTrash, onDraftEmail }) {
  const isApplied = job.column === 'applied';
  const isArchived = job.column === 'archive';
  const tone = scoreTone(job.score);

  return (
    <div className="bg-card border b-line rounded-lg p-3 card-hover fade-in cursor-pointer" onClick={() => onOpen(job)}>
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-soft border b-line flex items-center justify-center shrink-0">
            <span className="text-[10px] t-ink font-semibold num">{job.mono}</span>
          </div>
          <div className="min-w-0">
            <div className="t-ink text-[13px] font-medium truncate">{job.company}</div>
            <div className="t-dim text-[10px] num flex items-center gap-1">
              {sourceIcon(job.source, 10)}<span>{job.source}</span><span>·</span><span>{formatRelative(job.postedDaysAgo)}</span>
            </div>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded-md border text-[11px] num font-semibold shrink-0 ${tone.bg} ${tone.border}`}>
          <span className={tone.text}>{job.score}</span>
        </div>
      </div>

      <div className="text-[14px] leading-snug t-ink font-medium mb-1.5">{job.title}</div>

      <div className="flex items-center gap-1.5 text-[11px] t-muted mb-1.5 num">
        <MapPin size={10} /><span className="truncate">{job.location}</span>
      </div>

      <div className="text-[11px] t-amber num mb-2.5 font-semibold">{job.salaryText}</div>

      {!isArchived && (
        <div className="text-[12px] t-muted leading-snug mb-3 bg-soft rounded-md p-2 border b-line">{job.fitNote}</div>
      )}

      {isApplied && job.appliedDaysAgo !== undefined && (
        <div className="text-[11px] t-forest num mb-2 flex items-center gap-1">
          <Check size={10} /> applied {formatRelative(job.appliedDaysAgo)}
        </div>
      )}

      <div className="flex items-center justify-between gap-1 pt-2 border-t b-line" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-0.5">
          {job.column === 'inbox' && (
            <>
              <button onClick={() => onMove(job.id, 'interested')} className="btn-ghost btn-ghost-sage p-1.5 rounded" title="Interested"><Heart size={13} /></button>
              <button onClick={() => onDraftEmail(job)} className="btn-ghost p-1.5 rounded" title="Draft email"><Mail size={13} /></button>
              <button onClick={() => onTrash(job.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Trash"><Trash2 size={13} /></button>
            </>
          )}
          {job.column === 'interested' && (
            <>
              <button onClick={() => onDraftEmail(job)} className="btn-ghost btn-ghost-steel p-1.5 rounded" title="Draft email"><Send size={13} /></button>
              <button onClick={() => onMove(job.id, 'inbox')} className="btn-ghost p-1.5 rounded" title="Back"><RotateCcw size={13} /></button>
              <button onClick={() => onTrash(job.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Trash"><Trash2 size={13} /></button>
            </>
          )}
          {job.column === 'applied' && (
            <>
              <button onClick={() => onMove(job.id, 'interested')} className="btn-ghost p-1.5 rounded" title="Back to interested"><RotateCcw size={13} /></button>
              <button onClick={() => onTrash(job.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Rejected"><X size={13} /></button>
            </>
          )}
          {job.column === 'archive' && (
            <button onClick={() => onMove(job.id, 'inbox')} className="btn-ghost p-1.5 rounded" title="Restore"><RotateCcw size={13} /></button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {job.companyLinkedin && job.companyLinkedin !== '#' && (
            <a href={job.companyLinkedin} target="_blank" rel="noreferrer" className="btn-ghost p-1 rounded" title="LinkedIn" onClick={(e) => e.stopPropagation()}><Linkedin size={12} /></a>
          )}
          {job.companySite && job.companySite !== '#' && (
            <a href={job.companySite} target="_blank" rel="noreferrer" className="btn-ghost p-1 rounded" title="Website" onClick={(e) => e.stopPropagation()}><ExternalLink size={12} /></a>
          )}
        </div>
      </div>
    </div>
  );
}

function Column({ title, icon, jobs, onMove, onOpen, onTrash, onDraftEmail }) {
  return (
    <div className="flex flex-col bg-soft border b-line rounded-lg min-w-[310px] w-[310px]">
      <div className="flex items-center justify-between px-3 py-2.5 border-b b-line">
        <div className="flex items-center gap-2">
          <span className="t-muted">{icon}</span>
          <span className="t-ink text-[13px] font-semibold">{title}</span>
        </div>
        <span className="t-dim num text-[11px] bg-card px-1.5 rounded border b-line">{jobs.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {jobs.length === 0 ? (
          <div className="text-center py-12 t-dim text-[11px] num italic">empty</div>
        ) : (
          jobs.map((j) => <JobCard key={j.id} job={j} onMove={onMove} onOpen={onOpen} onTrash={onTrash} onDraftEmail={onDraftEmail} />)
        )}
      </div>
    </div>
  );
}

function JobDetailModal({ job, onClose, onDraftEmail, onMove, onTrash }) {
  if (!job) return null;
  const tone = scoreTone(job.score);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg" style={{ backgroundColor: 'rgba(26, 24, 21, 0.35)' }} onClick={onClose}>
      <div className="bg-card border b-line rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col modal-panel shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b b-line flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-md bg-soft border b-line flex items-center justify-center shrink-0">
              <span className="text-[12px] t-ink font-semibold num">{job.mono}</span>
            </div>
            <div className="min-w-0">
              <div className="t-muted text-[12px] num mb-0.5">{job.company}</div>
              <div className="t-ink text-[22px] leading-tight font-semibold">{job.title}</div>
              <div className="t-muted text-[12px] num mt-1">{job.location} · {job.salaryText}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-md border num font-semibold ${tone.bg} ${tone.border}`}>
              <span className={`text-[14px] ${tone.text}`}>{job.score}</span>
              <span className="t-dim text-[11px]">/100</span>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
          </div>
        </div>

        <div className="overflow-y-auto scroll-thin p-5 space-y-5">
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-2 font-semibold">Why it fits</div>
            <div className="t-ink text-[14px] leading-relaxed">{job.fitNote}</div>
          </div>

          {job.matchBullets && job.matchBullets.length > 0 && (
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider mb-2 font-semibold">Match points</div>
              <ul className="space-y-1.5">
                {job.matchBullets.map((b, i) => (
                  <li key={i} className="t-ink text-[13px] flex items-start gap-2">
                    <span className="t-forest mt-1">▸</span><span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-2 font-semibold">Description</div>
            <p className="t-ink text-[13px] leading-relaxed">{job.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <a href={job.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
              <div>
                <div className="t-dim num text-[9px] uppercase tracking-wider font-semibold">Posting</div>
                <div className="t-ink text-[12px]">{job.source}</div>
              </div>
              <ExternalLink size={14} className="t-muted" />
            </a>
            {job.companyLinkedin && job.companyLinkedin !== '#' && (
              <a href={job.companyLinkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
                <div>
                  <div className="t-dim num text-[9px] uppercase tracking-wider font-semibold">Company</div>
                  <div className="t-ink text-[12px]">LinkedIn</div>
                </div>
                <Linkedin size={14} className="t-muted" />
              </a>
            )}
            {job.companySite && job.companySite !== '#' && (
              <a href={job.companySite} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
                <div>
                  <div className="t-dim num text-[9px] uppercase tracking-wider font-semibold">Company</div>
                  <div className="t-ink text-[12px]">Website</div>
                </div>
                <Globe size={14} className="t-muted" />
              </a>
            )}
            {job.hmLinkedin && (
              <a href={job.hmLinkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-amber-soft rounded-md bg-amber-soft transition-colors">
                <div>
                  <div className="t-amber num text-[9px] uppercase tracking-wider font-semibold">Hiring Mgr</div>
                  <div className="t-ink text-[12px]">LinkedIn</div>
                </div>
                <UserCheck size={14} className="t-amber" />
              </a>
            )}
          </div>
        </div>

        <div className="p-4 border-t b-line flex items-center justify-between gap-2 bg-paper">
          <div className="flex items-center gap-2">
            <button onClick={() => { onTrash(job.id); onClose(); }} className="btn-ghost btn-ghost-brick px-3 py-1.5 rounded text-[12px] num flex items-center gap-1.5">
              <Trash2 size={12} /> Trash
            </button>
            {job.column !== 'interested' && job.column !== 'applied' && (
              <button onClick={() => { onMove(job.id, 'interested'); onClose(); }} className="btn-ghost btn-ghost-sage px-3 py-1.5 rounded text-[12px] num flex items-center gap-1.5">
                <Heart size={12} /> Interested
              </button>
            )}
          </div>
          <button onClick={() => onDraftEmail(job)} className="btn-primary px-4 py-2 rounded-md text-[13px] font-medium flex items-center gap-2">
            <Mail size={13} /> Draft Email
          </button>
        </div>
      </div>
    </div>
  );
}

function EmailModal({ job, onClose, onMarkApplied }) {
  const [tab, setTab] = useState('cold');
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState('EN');
  const emails = genEmails(job);
  const [subject, setSubject] = useState(emails[tab].subject);
  const [body, setBody] = useState(emails[tab].body);

  useEffect(() => {
    setSubject(emails[tab].subject);
    setBody(emails[tab].body);
  }, [tab, job.id]);

  const copy = () => {
    const text = tab === 'linkedin' ? body : `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg" style={{ backgroundColor: 'rgba(26, 24, 21, 0.4)' }} onClick={onClose}>
      <div className="bg-card border b-line rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col modal-panel shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b b-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-soft border b-line flex items-center justify-center">
              <Mail size={14} className="t-ink" />
            </div>
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider font-semibold">Draft for</div>
              <div className="t-ink text-[14px] font-medium">{job.company} — {job.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>

        <div className="flex items-center border-b b-line bg-paper">
          {[
            { k: 'cold', label: 'Cold Apply', icon: <Send size={12} /> },
            { k: 'warm', label: 'Warm Intro', icon: <Mail size={12} /> },
            { k: 'linkedin', label: 'LinkedIn DM', icon: <Linkedin size={12} /> },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-2.5 text-[12px] num flex items-center gap-1.5 border-b-2 transition-colors ${
                tab === t.k ? 't-ink font-semibold' : 't-muted border-transparent hover:t-ink'
              }`}
              style={{ borderBottomColor: tab === t.k ? '#1a1815' : 'transparent' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 pr-3">
            <button onClick={() => setLang('EN')} className={`px-2 py-1 text-[10px] num rounded font-semibold ${lang === 'EN' ? 'bg-ink t-paper' : 't-dim'}`}>EN</button>
            <button onClick={() => setLang('FR')} className={`px-2 py-1 text-[10px] num rounded font-semibold ${lang === 'FR' ? 'bg-ink t-paper' : 't-dim'}`}>FR</button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto scroll-thin">
          {tab !== 'linkedin' && (
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Subject</div>
              <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px]" />
            </div>
          )}
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
              {tab === 'linkedin' ? 'Message' : 'Body'}
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={tab === 'linkedin' ? 6 : 14}
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none"
            />
          </div>

          {tab !== 'linkedin' && (
            <div className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[11px] t-steel">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Reminder: </span>
                attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail before sending. Bot drafts only — you hit send (most discrete).
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t b-line flex items-center justify-between gap-2 bg-paper">
          <div className="flex items-center gap-2 text-[11px] t-dim num">
            <Lock size={11} /> drafts never leave your browser
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="px-3 py-1.5 rounded-md bg-card border b-line t-ink text-[12px] flex items-center gap-1.5 hover:border-b-line-strong">
              {copied ? <><Check size={12} className="t-forest" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <button onClick={() => { onMarkApplied(job.id); onClose(); }} className="btn-primary px-4 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5">
              <Check size={12} /> Mark Applied
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function TargetCard({ target, onDraft, onRemove }) {
  const priorityBg = target.priority === 'high' ? 'bg-amber-soft' : 'bg-soft';
  const priorityText = target.priority === 'high' ? 't-amber' : 't-muted';
  return (
    <div className="bg-card border b-line rounded-lg p-4 card-hover fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-md bg-soft border b-line flex items-center justify-center shrink-0">
            <span className="text-[12px] t-ink font-semibold num">{target.mono}</span>
          </div>
          <div className="min-w-0">
            <div className="t-ink text-[16px] leading-tight font-semibold">{target.name}</div>
            <div className="t-muted text-[11px] num flex items-center gap-1.5 mt-0.5">
              <span>{target.type}</span><span>·</span><span>{target.location}</span>
            </div>
          </div>
        </div>
        <div className={`${priorityBg} ${priorityText} text-[10px] num uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded font-semibold`}>
          <Star size={10} fill="currentColor" /> {target.priority}
        </div>
      </div>

      <div className="t-ink text-[12px] leading-relaxed mb-3 bg-soft rounded-md p-2.5 border b-line">{target.notes}</div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t b-line">
        <div className="flex items-center gap-1">
          {target.website && <a href={target.website} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded" title="Website"><Globe size={12} /></a>}
          {target.linkedin && <a href={target.linkedin} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded" title="LinkedIn"><Linkedin size={12} /></a>}
          <button onClick={() => onRemove(target.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Remove"><X size={12} /></button>
        </div>
        <button onClick={() => onDraft(target)} className="btn-primary px-3 py-1.5 rounded-md text-[11px] num font-medium flex items-center gap-1.5">
          <Edit3 size={11} /> Draft email
        </button>
      </div>
    </div>
  );
}

function TargetEmailModal({ target, onClose }) {
  const email = genTargetEmail(target);
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg" style={{ backgroundColor: 'rgba(26, 24, 21, 0.4)' }} onClick={onClose}>
      <div className="bg-card border b-line rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col modal-panel shadow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b b-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-soft border b-line flex items-center justify-center">
              <Target size={14} className="t-ink" />
            </div>
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider font-semibold">Speculative outreach</div>
              <div className="t-ink text-[14px] font-medium">{target.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto scroll-thin">
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Subject</div>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px]" />
          </div>
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Body</div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14} className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none" />
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[11px] t-steel">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <div>Attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail. Destination: check {target.name}'s website or LinkedIn.</div>
          </div>
        </div>

        <div className="p-3 border-t b-line flex items-center justify-end gap-2 bg-paper">
          <button onClick={copy} className="btn-primary px-4 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5">
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy to clipboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatsTab({ jobs }) {
  const interested = jobs.filter(j => j.column === 'interested').length;
  const applied = jobs.filter(j => j.column === 'applied').length;
  const responseRate = applied > 0 ? Math.round((1 / applied) * 100) : 0;
  const bySource = jobs.reduce((acc, j) => { acc[j.source] = (acc[j.source] || 0) + 1; return acc; }, {});
  const maxBySource = Math.max(...Object.values(bySource));
  const byType = {
    'Private Banking': jobs.filter(j => ['Julius Baer', 'Pictet', 'Lombard', 'Edmond', 'Banque Syz'].some(b => j.company.includes(b))).length,
    'Fintech BD': jobs.filter(j => ['Rapyd', 'Melio', 'Qonto', 'Alan', 'eToro', 'Pagaya'].some(b => j.company.includes(b))).length,
    'Other': jobs.filter(j => !['Julius Baer', 'Pictet', 'Lombard', 'Edmond', 'Banque Syz', 'Rapyd', 'Melio', 'Qonto', 'Alan', 'eToro', 'Pagaya'].some(b => j.company.includes(b))).length,
  };
  const maxByType = Math.max(...Object.values(byType), 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Jobs Surfaced', value: jobs.length },
          { label: 'Interested', value: interested },
          { label: 'Applied', value: applied },
          { label: 'Response Rate', value: responseRate + '%' },
        ].map((m) => (
          <div key={m.label} className="bg-card border b-line rounded-lg p-4">
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-2 font-semibold">{m.label}</div>
            <div className="num t-ink text-[34px] leading-none font-semibold">{m.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-card border b-line rounded-lg p-5">
          <div className="t-dim num text-[10px] uppercase tracking-wider mb-4 font-semibold">By Source</div>
          <div className="space-y-3">
            {Object.entries(bySource).map(([src, count]) => (
              <div key={src}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 t-ink text-[12px]">
                    {sourceIcon(src)} {src}
                  </div>
                  <span className="num text-[12px] t-ink font-semibold">{count}</span>
                </div>
                <div className="h-1.5 bg-soft rounded-full overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${(count / maxBySource) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border b-line rounded-lg p-5">
          <div className="t-dim num text-[10px] uppercase tracking-wider mb-4 font-semibold">By Role Type</div>
          <div className="space-y-3">
            {Object.entries(byType).map(([t, count]) => (
              <div key={t}>
                <div className="flex items-center justify-between mb-1">
                  <div className="t-ink text-[12px]">{t}</div>
                  <span className="num text-[12px] t-ink font-semibold">{count}</span>
                </div>
                <div className="h-1.5 bg-soft rounded-full overflow-hidden">
                  <div className="h-full bg-ink" style={{ width: `${(count / maxByType) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-card border b-line rounded-lg p-5">
        <div className="t-dim num text-[10px] uppercase tracking-wider mb-4 font-semibold">Last 14 days — pipeline activity</div>
        <div className="h-28 flex items-end justify-between gap-1">
          {[2, 3, 1, 4, 5, 3, 6, 4, 7, 5, 8, 6, 9, 7].map((v, i) => (
            <div key={i} className="flex-1 bg-ink rounded-t" style={{ height: `${(v / 9) * 100}%`, minHeight: 4, opacity: 0.35 + (i / 14) * 0.65 }}></div>
          ))}
        </div>
        <div className="flex justify-between text-[10px] num t-dim mt-2">
          <span>14d ago</span><span>today</span>
        </div>
      </div>
    </div>
  );
}

function SettingsTab({ filters, setFilters, blocklist, setBlocklist }) {
  const [newBlock, setNewBlock] = useState('');
  const toggleRole = (r) => setFilters({ ...filters, roles: filters.roles.includes(r) ? filters.roles.filter(x => x !== r) : [...filters.roles, r] });
  const toggleGeo = (g) => setFilters({ ...filters, geo: filters.geo.includes(g) ? filters.geo.filter(x => x !== g) : [...filters.geo, g] });

  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-card border b-line rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Sliders size={14} className="t-ink" />
          <div className="t-ink text-[14px] font-semibold">Filters</div>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="t-muted text-[12px]">Minimum monthly salary (NIS)</div>
              <div className="num t-ink text-[13px] font-semibold">{filters.minSalary.toLocaleString()}</div>
            </div>
            <input type="range" min="10000" max="50000" step="500" value={filters.minSalary} onChange={(e) => setFilters({ ...filters, minSalary: parseInt(e.target.value) })} className="w-full" />
            <div className="flex justify-between text-[10px] num t-dim mt-1">
              <span>10K</span><span>30K</span><span>50K</span>
            </div>
          </div>
          <div>
            <div className="t-muted text-[12px] mb-2">Role focus</div>
            <div className="flex flex-wrap gap-2">
              {['Private Banking', 'Fintech BD', 'VC / IR', 'Tech BD'].map((r) => (
                <button key={r} onClick={() => toggleRole(r)}
                  className={`px-3 py-1.5 rounded-md border text-[11px] num font-medium transition-colors ${filters.roles.includes(r) ? 'bg-ink t-paper' : 'bg-card t-muted b-line hover:border-b-line-strong'}`}
                  style={{ borderColor: filters.roles.includes(r) ? '#1a1815' : '' }}>{r}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="t-muted text-[12px] mb-2">Geography</div>
            <div className="flex flex-wrap gap-2">
              {['Israel', 'Remote EU', 'Remote US'].map((g) => (
                <button key={g} onClick={() => toggleGeo(g)}
                  className={`px-3 py-1.5 rounded-md border text-[11px] num font-medium transition-colors ${filters.geo.includes(g) ? 'bg-ink t-paper' : 'bg-card t-muted b-line hover:border-b-line-strong'}`}
                  style={{ borderColor: filters.geo.includes(g) ? '#1a1815' : '' }}>{g}</button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border b-line rounded-lg p-5">
        <div className="flex items-center gap-2 mb-4">
          <Shield size={14} className="t-brick" />
          <div className="t-ink text-[14px] font-semibold">Discretion blocklist</div>
          <div className="t-dim text-[11px] num ml-auto">these never appear in feed</div>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {blocklist.map((b) => (
            <div key={b} className="flex items-center gap-1.5 px-2.5 py-1 bg-brick-soft border b-brick-soft rounded-md t-brick text-[11px] num font-medium">
              <span>{b}</span>
              <button onClick={() => setBlocklist(blocklist.filter(x => x !== b))} className="hover:opacity-70"><X size={10} /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={newBlock} onChange={(e) => setNewBlock(e.target.value)} placeholder="Add company to exclude..." className="flex-1 bg-paper border b-line rounded-md px-3 py-1.5 text-[12px]"
            onKeyDown={(e) => { if (e.key === 'Enter' && newBlock.trim()) { setBlocklist([...blocklist, newBlock.trim()]); setNewBlock(''); } }} />
          <button onClick={() => { if (newBlock.trim()) { setBlocklist([...blocklist, newBlock.trim()]); setNewBlock(''); } }} className="px-3 py-1.5 rounded-md bg-card border b-line t-ink text-[12px] hover:border-b-line-strong">Add</button>
        </div>
      </div>

      <div className="bg-card border b-line rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <FileText size={14} className="t-ink" />
          <div className="t-ink text-[14px] font-semibold">Master CV</div>
        </div>
        <div className="flex items-center justify-between p-3 bg-soft border b-line rounded-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-md bg-card border b-line flex items-center justify-center">
              <FileText size={14} className="t-ink" />
            </div>
            <div>
              <div className="t-ink text-[13px] num font-medium">CV_Nessim_Guez.pdf</div>
              <div className="t-dim text-[11px] num">attached to every outgoing draft</div>
            </div>
          </div>
          <button className="t-ink text-[11px] num font-semibold hover:underline">Replace</button>
        </div>
      </div>

      <div className="bg-card border b-line rounded-lg p-5">
        <div className="flex items-center gap-2 mb-3">
          <RefreshCw size={14} className="t-ink" />
          <div className="t-ink text-[14px] font-semibold">Sources &amp; refresh</div>
        </div>
        <div className="space-y-2 text-[12px]">
          {[
            { name: 'LinkedIn Jobs', last: '3h ago' },
            { name: 'Company career pages (18 monitored)', last: '2h ago' },
            { name: 'Drushim / AllJobs', last: '3h ago' },
            { name: 'LinkedIn hiring posts (hidden mkt)', last: '5h ago' },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between p-2.5 bg-soft border b-line rounded-md">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#3f5c2e' }}></div>
                <span className="t-ink">{s.name}</span>
              </div>
              <div className="t-dim num text-[11px]">{s.last}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-[11px] t-dim num">Refresh cadence: twice daily (morning + evening)</div>
      </div>
    </div>
  );
}

export default function NGTerminal() {
  const [activeTab, setActiveTab] = useState('feed');
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [targets, setTargets] = useState(INITIAL_TARGETS);
  const [blocklist, setBlocklist] = useState(BLOCKLIST);
  const [selectedJob, setSelectedJob] = useState(null);
  const [emailJob, setEmailJob] = useState(null);
  const [targetEmail, setTargetEmail] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [filters, setFilters] = useState({ minSalary: 18000, roles: ['Private Banking', 'Fintech BD', 'VC / IR', 'Tech BD'], geo: ['Israel', 'Remote EU', 'Remote US'] });
  const [newTargetName, setNewTargetName] = useState('');
  const [showAddTarget, setShowAddTarget] = useState(false);

  useEffect(() => {
    async function load() {
      try { const j = await window.storage.get('ng2:jobs'); if (j) setJobs(JSON.parse(j.value)); } catch (e) {}
      try { const t = await window.storage.get('ng2:targets'); if (t) setTargets(JSON.parse(t.value)); } catch (e) {}
      try { const b = await window.storage.get('ng2:blocklist'); if (b) setBlocklist(JSON.parse(b.value)); } catch (e) {}
      try { const f = await window.storage.get('ng2:filters'); if (f) setFilters(JSON.parse(f.value)); } catch (e) {}
      setLoaded(true);
    }
    load();
  }, []);

  useEffect(() => { if (loaded) window.storage.set('ng2:jobs', JSON.stringify(jobs)).catch(() => {}); }, [jobs, loaded]);
  useEffect(() => { if (loaded) window.storage.set('ng2:targets', JSON.stringify(targets)).catch(() => {}); }, [targets, loaded]);
  useEffect(() => { if (loaded) window.storage.set('ng2:blocklist', JSON.stringify(blocklist)).catch(() => {}); }, [blocklist, loaded]);
  useEffect(() => { if (loaded) window.storage.set('ng2:filters', JSON.stringify(filters)).catch(() => {}); }, [filters, loaded]);

  const moveJob = (id, col) => setJobs(jobs.map(j => j.id === id ? { ...j, column: col, status: col === 'applied' ? 'applied' : col === 'interested' ? 'interested' : col === 'archive' ? 'rejected' : 'new' } : j));
  const trashJob = (id) => setJobs(jobs.map(j => j.id === id ? { ...j, column: 'archive', status: 'rejected', trashedDaysAgo: 0 } : j));
  const markApplied = (id) => setJobs(jobs.map(j => j.id === id ? { ...j, column: 'applied', status: 'applied', appliedDaysAgo: 0 } : j));
  const removeTarget = (id) => setTargets(targets.filter(t => t.id !== id));
  const addTarget = () => {
    if (!newTargetName.trim()) return;
    const mono = newTargetName.trim().split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
    setTargets([...targets, { id: 't' + Date.now(), name: newTargetName.trim(), mono, type: 'Company', location: 'TBD', website: '', linkedin: '', notes: 'Add notes...', priority: 'med' }]);
    setNewTargetName('');
    setShowAddTarget(false);
  };

  const filteredJobs = jobs.filter(j => {
    if (j.column === 'archive') return true;
    if (j.column === 'inbox') return j.salaryNIS >= filters.minSalary;
    return true;
  });
  const byCol = (c) => filteredJobs.filter(j => j.column === c);

  return (
    <>
      <style>{STYLES}</style>
      <div className="app-font bg-paper t-ink min-h-screen paper-texture">
        <header className="border-b b-line bg-paper sticky top-0 z-30">
          <div className="px-6 py-3 flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center">
                <span className="t-paper text-[15px] font-semibold num">N</span>
              </div>
              <div>
                <div className="t-ink text-[16px] font-semibold leading-none">Terminal</div>
                <div className="num t-dim text-[9px] uppercase tracking-widest mt-0.5">v0.2 · private</div>
              </div>
            </div>

            <nav className="flex items-center gap-0.5">
              {[
                { k: 'feed', label: 'Feed', icon: <Inbox size={13} /> },
                { k: 'targets', label: 'Targets', icon: <Target size={13} /> },
                { k: 'stats', label: 'Stats', icon: <BarChart2 size={13} /> },
                { k: 'settings', label: 'Settings', icon: <Settings size={13} /> },
              ].map((t) => (
                <button key={t.k} onClick={() => setActiveTab(t.k)}
                  className={`px-3 py-1.5 rounded-md text-[12px] num font-medium flex items-center gap-1.5 transition-colors ${activeTab === t.k ? 'bg-ink t-paper' : 't-muted hover:t-ink hover:bg-soft'}`}>
                  {t.icon} {t.label}
                </button>
              ))}
            </nav>

            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[11px] num t-dim">
                <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#3f5c2e' }}></div>
                last sync · 2h ago
              </div>
              <button className="btn-ghost p-1.5 rounded" title="Refresh now"><RefreshCw size={13} /></button>
              <div className="w-px h-6 bg-softer"></div>
              <div className="text-[11px] num t-muted flex items-center gap-1.5">
                <Lock size={11} /> Nessim G.
              </div>
            </div>
          </div>
        </header>

        <main className="px-6 py-5">
          {activeTab === 'feed' && (
            <div className="flex gap-3 overflow-x-auto scroll-thin pb-2">
              <Column title="Inbox" icon={<Inbox size={13} />} jobs={byCol('inbox')} onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
              <Column title="Interested" icon={<Heart size={13} />} jobs={byCol('interested')} onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
              <Column title="Applied" icon={<Send size={13} />} jobs={byCol('applied')} onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
              <Column title="Archive" icon={<Archive size={13} />} jobs={byCol('archive')} onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
            </div>
          )}

          {activeTab === 'targets' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="t-ink text-[24px] font-semibold leading-tight">Target Companies</h2>
                  <div className="t-muted text-[12px] num mt-1">
                    {targets.length} companies · no current openings · speculative outreach list
                  </div>
                </div>
                {showAddTarget ? (
                  <div className="flex items-center gap-2">
                    <input value={newTargetName} onChange={(e) => setNewTargetName(e.target.value)} placeholder="Company name..." className="bg-card border b-line rounded-md px-3 py-1.5 text-[12px] w-56" onKeyDown={(e) => e.key === 'Enter' && addTarget()} autoFocus />
                    <button onClick={addTarget} className="btn-primary px-3 py-1.5 rounded-md text-[12px] font-medium">Add</button>
                    <button onClick={() => { setShowAddTarget(false); setNewTargetName(''); }} className="btn-ghost p-1.5 rounded"><X size={13} /></button>
                  </div>
                ) : (
                  <button onClick={() => setShowAddTarget(true)} className="btn-primary px-3 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5">
                    <Plus size={13} /> Add company
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {targets.map((t) => <TargetCard key={t.id} target={t} onDraft={setTargetEmail} onRemove={removeTarget} />)}
              </div>
            </div>
          )}

          {activeTab === 'stats' && (
            <div>
              <h2 className="t-ink text-[24px] font-semibold leading-tight mb-1">Pipeline</h2>
              <div className="t-muted text-[12px] num mb-5">current state of the hunt</div>
              <StatsTab jobs={jobs} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="t-ink text-[24px] font-semibold leading-tight mb-1">Settings</h2>
              <div className="t-muted text-[12px] num mb-5">filters, sources, blocklist, CV</div>
              <SettingsTab filters={filters} setFilters={setFilters} blocklist={blocklist} setBlocklist={setBlocklist} />
            </div>
          )}
        </main>

        {selectedJob && !emailJob && (
          <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} onDraftEmail={(j) => { setEmailJob(j); setSelectedJob(null); }} onMove={moveJob} onTrash={trashJob} />
        )}
        {emailJob && <EmailModal job={emailJob} onClose={() => setEmailJob(null)} onMarkApplied={markApplied} />}
        {targetEmail && <TargetEmailModal target={targetEmail} onClose={() => setTargetEmail(null)} />}
      </div>
    </>
  );
}
