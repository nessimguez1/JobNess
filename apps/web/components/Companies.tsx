'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Globe, Linkedin, Search, Pin, PinOff, Edit3, X, Sparkles, Loader2,
  Copy, Check, AlertCircle, Briefcase, ChevronDown, Clock, Send,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { copyEmail } from '../lib/signature';
import { logOutreach, lastSentToForCompany } from '../lib/outreach';
import type { Company, OutreachMethod } from '@jobness/shared';
import Modal from './Modal';

type CompanyRow = Company & { last_sent_at?: string; next_follow_up_at?: string };

function fmtDate(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const AVATAR_VARS = [
  'var(--avatar-1)',
  'var(--avatar-2)',
  'var(--avatar-3)',
  'var(--avatar-4)',
  'var(--avatar-5)',
  'var(--avatar-6)',
];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_VARS[h % AVATAR_VARS.length]!;
}

function genMono(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

type Filter = {
  q: string;
  sector: string | 'all';
  priority: 'all' | 'high' | 'med' | 'low';
  hasJobs: boolean;
};

function CompanyEmailModal({ company, onClose, onLogged }: { company: Company; onClose: () => void; onLogged: (companyId: string, sentAt: string, followUpAt?: string) => void }) {
  const [role, setRole]       = useState('Business Development / Partnerships');
  const [context, setContext] = useState('');
  const [subject, setSubject] = useState(`Speculative note — ${company.name}`);
  const [body, setBody]       = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');
  const [copied, setCopied]         = useState(false);
  const [hasCopiedOnce, setHasCopiedOnce] = useState(false);

  const today = new Date().toISOString().split('T')[0]!;
  const [sentTo, setSentTo]         = useState('');
  const [method, setMethod]         = useState<OutreachMethod>('email');
  const [sentAt, setSentAt]         = useState(today);
  const [followUpAt, setFollowUpAt] = useState('');
  const [logging, setLogging]       = useState(false);
  const [logError, setLogError]     = useState('');

  const titleId = `company-email-title-${company.id}`;

  useEffect(() => {
    let cancelled = false;
    lastSentToForCompany(company.name).then(prev => {
      if (!cancelled && prev) setSentTo(prev);
    });
    return () => { cancelled = true; };
  }, [company.name]);

  async function generate() {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'speculative',
          title: role || undefined,
          company: company.name,
          context: context.trim() || undefined,
          company_site: company.website || undefined,
        }),
      });
      const data = await res.json() as { body?: string; subject?: string; error?: string };
      if (!res.ok || !data.body) throw new Error(data.error ?? 'Generation failed');
      setBody(data.body);
      if (data.subject) setSubject(data.subject);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function copy() {
    await copyEmail({ kind: 'email', subject, body });
    setCopied(true);
    setHasCopiedOnce(true);
    setTimeout(() => setCopied(false), 1600);
  }

  async function markContacted() {
    setLogging(true);
    setLogError('');
    const { error } = await logOutreach({
      companyId: company.id,
      type: 'speculative',
      method,
      sentAt,
      ...(sentTo.trim()  ? { sentTo: sentTo.trim() } : {}),
      ...(followUpAt     ? { followUpAt }           : {}),
      ...(subject.trim() ? { subject: subject.trim() } : {}),
      ...(body.trim()    ? { body: body.trim() }       : {}),
    });
    setLogging(false);
    if (error) { setLogError(error); return; }
    onLogged(company.id, sentAt, followUpAt || undefined);
    onClose();
  }

  return (
    <Modal onClose={onClose} labelledBy={titleId} panelClassName="max-w-3xl max-h-[90vh]">
      <div className="p-4 border-b b-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md border b-line flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarColor(company.id) }}
            aria-hidden="true">
            <span className="text-[13px] t-ink font-semibold num">{company.mono ?? genMono(company.name)}</span>
          </div>
          <div className="min-w-0">
            <div className="t-muted num text-[11px] uppercase tracking-wider font-semibold">Speculative outreach</div>
            <h2 id={titleId} className="t-ink text-[14px] font-medium truncate">{company.name}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded shrink-0"
        ><X size={16} aria-hidden="true" /></button>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto scroll-thin flex-1">
        <label className="block">
          <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">Role focus</span>
          <input value={role} onChange={e => setRole(e.target.value)}
            placeholder="Business Development, Partnerships, RM…"
            className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim" />
        </label>

        <div>
          <label className="block">
            <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">Why this company (optional)</span>
            <div className="flex gap-2">
              <input value={context} onChange={e => setContext(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !generating) generate(); }}
                placeholder="Recent news, product angle, mutual connection…"
                className="flex-1 bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim" />
              <button type="button" onClick={generate} disabled={generating}
                className="min-h-10 px-3 rounded-md bg-ink t-paper text-[13px] font-medium flex items-center gap-1.5 disabled:opacity-40 shrink-0">
                {generating ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Writing…</> : <><Sparkles size={13} aria-hidden="true" /> Generate</>}
              </button>
            </div>
          </label>
          {genError && <div role="alert" className="text-[12px] t-brick mt-1">{genError}</div>}
        </div>

        <label className="block">
          <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">Subject</span>
          <input value={subject} onChange={e => setSubject(e.target.value)}
            className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px]" />
        </label>

        <label className="block">
          <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">Body</span>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
            placeholder={generating ? '' : 'Click Generate above to draft with AI…'}
            className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none placeholder:t-dim" />
        </label>

        <div role="note" className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[13px] t-steel">
          <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          <div>Attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail. Destination: check {company.name}&apos;s website or LinkedIn.</div>
        </div>

        {hasCopiedOnce ? (
          <section aria-labelledby="company-log-heading" className="border b-line rounded-lg p-3 space-y-2.5 bg-soft fade-in">
            <div className="flex items-center gap-2">
              <Check size={13} className="t-forest" aria-hidden="true" />
              <h3 id="company-log-heading" className="t-ink num text-[12px] uppercase tracking-wider font-semibold">Log this outreach</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block">
                <span className="block t-muted num text-[12px] mb-1">Date sent</span>
                <input type="date" value={sentAt} onChange={e => setSentAt(e.target.value)}
                  className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[13px] num min-h-9" />
              </label>
              <label className="block">
                <span className="block t-muted num text-[12px] mb-1">Sent to</span>
                <input value={sentTo} onChange={e => setSentTo(e.target.value)}
                  placeholder="Name, email, or LinkedIn…"
                  className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[13px] placeholder:t-dim min-h-9" />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <div className="t-muted num text-[12px] mb-1">Via</div>
                <div role="radiogroup" aria-label="Send method" className="flex gap-1 flex-wrap">
                  {(['email', 'linkedin', 'website'] as OutreachMethod[]).map(m => (
                    <button type="button" key={m} role="radio" aria-checked={method === m} onClick={() => setMethod(m)}
                      className={`px-2.5 py-1 min-h-8 rounded text-[13px] num font-medium capitalize border transition-colors ${method === m ? 'bg-ink t-paper b-ink' : 'bg-paper b-line t-muted hover:t-ink'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="block t-muted num text-[12px] mb-1">Follow-up reminder</span>
                <input type="date" value={followUpAt} onChange={e => setFollowUpAt(e.target.value)}
                  className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[13px] num min-h-9" />
              </label>
            </div>
            {logError && <div role="alert" className="text-[12px] t-brick">{logError}</div>}
          </section>
        ) : (
          <button
            type="button"
            onClick={() => setHasCopiedOnce(true)}
            className="w-full border b-line border-dashed rounded-lg p-2.5 text-[12px] t-muted hover:t-ink hover:bg-soft transition-colors flex items-center justify-center gap-1.5 num"
          >
            <ChevronDown size={12} aria-hidden="true" />
            Log details (shown after you copy)
          </button>
        )}
      </div>

      <div className="p-3 border-t b-line flex items-center justify-end gap-2 bg-paper">
        <button
          type="button"
          onClick={copy}
          disabled={!body}
          className={`min-h-9 px-3 rounded-md border text-[13px] flex items-center gap-1.5 disabled:opacity-40 transition-colors ${hasCopiedOnce ? 'bg-card b-line t-muted hover:t-ink' : 'bg-ink t-paper b-ink hover:opacity-90'}`}
        >
          {copied ? <><Check size={13} className="t-forest" aria-hidden="true" /> Copied</> : <><Copy size={13} aria-hidden="true" /> Copy</>}
        </button>
        <button
          type="button"
          onClick={markContacted}
          disabled={logging || !hasCopiedOnce}
          aria-disabled={!hasCopiedOnce}
          title={hasCopiedOnce ? 'Log this outreach and mark the company as contacted' : 'Copy the email first'}
          className={`min-h-9 px-4 rounded-md text-[13px] font-semibold flex items-center gap-1.5 border transition-colors ${hasCopiedOnce ? 'bg-forest-soft t-forest b-olive-soft hover:opacity-90' : 'bg-soft t-dim b-line cursor-not-allowed opacity-60'}`}
        >
          {logging ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Logging…</> : <><Check size={13} aria-hidden="true" /> Mark contacted</>}
        </button>
      </div>
    </Modal>
  );
}

function CompanyCard({ company, onDraft, onTogglePin }: {
  company: CompanyRow;
  onDraft: (c: CompanyRow) => void;
  onTogglePin: (c: CompanyRow) => void;
}) {
  const hasJobs = company.job_count > 0;
  const today = new Date().toISOString().split('T')[0]!;
  const followDue = company.next_follow_up_at && company.next_follow_up_at <= today;
  return (
    <div className={`border rounded-lg p-4 card-hover fade-in relative ${company.pinned ? 'bg-soft b-line-strong shadow-card' : 'bg-card b-line'}`}>
      {company.pinned && (
        <div className="absolute top-2 right-2 t-ink" aria-hidden="true">
          <Pin size={12} fill="currentColor" />
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-md border b-line flex items-center justify-center shrink-0"
          style={{ backgroundColor: avatarColor(company.id) }}
          aria-hidden="true">
          <span className="text-[13px] t-ink font-semibold num">{company.mono ?? genMono(company.name)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className={`t-ink leading-tight truncate ${company.pinned ? 'font-serif-display text-[17px]' : 'text-[15px] font-semibold'}`}>{company.name}</div>
          <div className="t-muted text-[12px] num mt-0.5 flex items-center gap-1.5">
            {company.sector && <span className="truncate">{company.sector}</span>}
            {company.ats === 'custom' && (
              <span
                title="No automated scraping; speculative outreach only"
                className="shrink-0 px-1.5 py-0.5 rounded bg-soft b-line border text-[10px] uppercase tracking-wider t-muted"
              >
                speculative
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        {hasJobs ? (
          <div className="bg-forest-soft t-forest px-2 py-1 rounded text-[12px] num font-semibold flex items-center gap-1">
            <Briefcase size={12} aria-hidden="true" /> {company.job_count} open
          </div>
        ) : (
          <div className="t-dim text-[12px] num">No open jobs</div>
        )}
        {company.priority === 'high' && (
          <div className="bg-ink t-paper text-[11px] num uppercase tracking-wider px-2 py-0.5 rounded font-semibold">high</div>
        )}
      </div>

      {(company.last_sent_at || company.next_follow_up_at) && (
        <div className="flex items-center gap-2 mb-3 text-[12px] num flex-wrap">
          {company.last_sent_at && (
            <span className="t-muted flex items-center gap-1"><Send size={11} aria-hidden="true" /> {fmtDate(company.last_sent_at)}</span>
          )}
          {company.next_follow_up_at && (
            <span className={`flex items-center gap-1 ${followDue ? 't-brick font-semibold' : 't-muted'}`}>
              <Clock size={11} aria-hidden="true" /> {followDue ? 'Follow up' : fmtDate(company.next_follow_up_at)}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t b-line">
        <div className="flex items-center gap-1">
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" aria-label={`${company.name} website`} className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"><Globe size={13} aria-hidden="true" /></a>}
          {company.linkedin && <a href={company.linkedin} target="_blank" rel="noreferrer" aria-label={`${company.name} on LinkedIn`} className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"><Linkedin size={13} aria-hidden="true" /></a>}
          <button type="button" onClick={() => onTogglePin(company)} aria-label={company.pinned ? `Unpin ${company.name}` : `Pin ${company.name}`} aria-pressed={company.pinned} className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded">
            {company.pinned ? <PinOff size={13} aria-hidden="true" /> : <Pin size={13} aria-hidden="true" />}
          </button>
        </div>
        <button type="button" onClick={() => onDraft(company)} className="btn-primary min-h-9 px-3 rounded-md text-[13px] num font-medium flex items-center gap-1.5">
          <Edit3 size={12} aria-hidden="true" /> Draft email
        </button>
      </div>
    </div>
  );
}

export default function Companies() {
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [loading, setLoading]     = useState(true);
  const [emailCompany, setEmailCompany] = useState<CompanyRow | null>(null);
  const [filter, setFilter] = useState<Filter>({ q: '', sector: 'all', priority: 'all', hasJobs: false });

  useEffect(() => {
    async function load() {
      const { data: companyData } = await supabase.from('companies')
        .select('*')
        .order('pinned', { ascending: false })
        .order('job_count', { ascending: false })
        .order('name', { ascending: true });
      const list = (companyData ?? []) as unknown as CompanyRow[];

      const { data: outreachData } = await supabase.from('outreach')
        .select('company_id, sent_at, follow_up_at')
        .not('company_id', 'is', null)
        .order('sent_at', { ascending: false });
      const rows = (outreachData ?? []) as unknown as { company_id: string; sent_at: string; follow_up_at: string | null }[];

      const today = new Date().toISOString().split('T')[0]!;
      const lastByCompany = new Map<string, string>();
      const nextByCompany = new Map<string, string>();
      for (const r of rows) {
        if (!lastByCompany.has(r.company_id)) lastByCompany.set(r.company_id, r.sent_at);
        if (r.follow_up_at && r.follow_up_at >= today) {
          const existing = nextByCompany.get(r.company_id);
          if (!existing || r.follow_up_at < existing) nextByCompany.set(r.company_id, r.follow_up_at);
        }
      }
      for (const c of list) {
        const last = lastByCompany.get(c.id);
        const next = nextByCompany.get(c.id);
        if (last) c.last_sent_at = last;
        if (next) c.next_follow_up_at = next;
      }
      setCompanies(list);
      setLoading(false);
    }
    load();
  }, []);

  function applyLogged(companyId: string, sentAt: string, followUpAt?: string) {
    setCompanies(prev => prev.map(c => {
      if (c.id !== companyId) return c;
      const updated: CompanyRow = { ...c };
      if (!updated.last_sent_at || sentAt > updated.last_sent_at) updated.last_sent_at = sentAt;
      if (followUpAt && (!updated.next_follow_up_at || followUpAt < updated.next_follow_up_at)) {
        updated.next_follow_up_at = followUpAt;
      }
      return updated;
    }));
  }

  const sectors = useMemo(() => {
    const s = new Set<string>();
    for (const c of companies) if (c.sector) s.add(c.sector);
    return [...s].sort();
  }, [companies]);

  const filtered = useMemo(() => {
    const q = filter.q.trim().toLowerCase();
    return companies.filter(c => {
      if (q && !c.name.toLowerCase().includes(q)) return false;
      if (filter.sector !== 'all' && c.sector !== filter.sector) return false;
      if (filter.priority !== 'all' && c.priority !== filter.priority) return false;
      if (filter.hasJobs && c.job_count <= 0) return false;
      return true;
    });
  }, [companies, filter]);

  const withJobsCount = useMemo(() => companies.filter(c => c.job_count > 0).length, [companies]);

  async function togglePin(c: CompanyRow) {
    const next = !c.pinned;
    setCompanies(prev => prev.map(x => x.id === c.id ? { ...x, pinned: next } : x));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('companies') as any).update({ pinned: next }).eq('id', c.id);
  }

  const pinned = filtered.filter(c => c.pinned);
  const rest   = filtered.filter(c => !c.pinned);

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="t-ink text-[24px] font-semibold leading-tight">Companies</h2>
          <div className="t-muted text-[13px] num mt-1">
            {companies.length} companies · {withJobsCount} with open jobs
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b b-line">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 t-dim" aria-hidden="true" />
          <input value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
            placeholder="Search company…"
            aria-label="Search company"
            className="w-full bg-card border b-line rounded-md pl-8 pr-3 py-1.5 text-[13px] placeholder:t-dim" />
        </div>

        <label className="relative">
          <span className="sr-only">Filter by sector</span>
          <select value={filter.sector}
            onChange={e => setFilter(f => ({ ...f, sector: e.target.value }))}
            className="appearance-none bg-card border b-line rounded-md pl-3 pr-7 py-1.5 text-[13px] num cursor-pointer">
            <option value="all">All sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 t-dim pointer-events-none" aria-hidden="true" />
        </label>

        <div role="radiogroup" aria-label="Filter by priority" className="flex items-center gap-0.5 bg-card border b-line rounded-md p-0.5">
          {(['all', 'high', 'med', 'low'] as const).map(p => (
            <button type="button" key={p} role="radio" aria-checked={filter.priority === p}
              onClick={() => setFilter(f => ({ ...f, priority: p }))}
              className={`px-2.5 py-1 min-h-8 rounded text-[13px] num font-medium capitalize transition-colors ${filter.priority === p ? 'bg-ink t-paper' : 't-muted hover:t-ink'}`}>
              {p}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-[13px] num t-muted cursor-pointer select-none pl-1">
          <input type="checkbox" checked={filter.hasJobs}
            onChange={e => setFilter(f => ({ ...f, hasJobs: e.target.checked }))}
            style={{ accentColor: 'var(--ink)' }} />
          Has open jobs
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="border b-line rounded-lg p-4 h-[148px] shimmer" aria-hidden="true" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={22} className="mx-auto mb-3 t-dim" aria-hidden="true" />
          <div className="t-muted text-[13px] num max-w-[240px] mx-auto">
            No companies match your filters. Try clearing the search or sector.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <section aria-labelledby="pinned-heading">
              <h3 id="pinned-heading" className="t-muted num text-[11px] uppercase tracking-wider mb-3 font-semibold flex items-center gap-1.5">
                <Pin size={11} fill="currentColor" aria-hidden="true" /> Pinned
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {pinned.map(c => <CompanyCard key={c.id} company={c} onDraft={setEmailCompany} onTogglePin={togglePin} />)}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section aria-labelledby={pinned.length > 0 ? 'rest-heading' : undefined}>
              {pinned.length > 0 && (
                <h3 id="rest-heading" className="t-muted num text-[11px] uppercase tracking-wider mb-3 font-semibold">All</h3>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {rest.map(c => <CompanyCard key={c.id} company={c} onDraft={setEmailCompany} onTogglePin={togglePin} />)}
              </div>
            </section>
          )}
        </div>
      )}

      {emailCompany && <CompanyEmailModal company={emailCompany} onClose={() => setEmailCompany(null)} onLogged={applyLogged} />}
    </>
  );
}
