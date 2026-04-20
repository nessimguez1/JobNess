'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Globe, Linkedin, Search, Pin, PinOff, Edit3, X, Sparkles, Loader2,
  Copy, Check, AlertCircle, Briefcase, ChevronDown,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Company } from '@jobness/shared';

const AVATAR_PALETTE = ['#e6ece0', '#e4ebf2', '#f2e9cc', '#f2e4e0', '#ede8f2', '#e4ede0'];
function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length]!;
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

function CompanyEmailModal({ company, onClose }: { company: Company; onClose: () => void }) {
  const [role, setRole]       = useState('Business Development / Partnerships');
  const [context, setContext] = useState('');
  const [subject, setSubject] = useState(`Speculative note — ${company.name}`);
  const [body, setBody]       = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError]     = useState('');
  const [copied, setCopied]         = useState(false);

  async function generate() {
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: 'cold',
          title: role || 'relevant role',
          company: company.name,
          context: context.trim() ? `Speculative outreach — no posted role. ${context.trim()}` : 'Speculative outreach — no posted role. Frame as exploring a future opening rather than applying to a specific one.',
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

  function copy() {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg"
      style={{ backgroundColor: 'rgba(26, 24, 21, 0.4)' }} onClick={onClose}>
      <div className="bg-card border b-line rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col modal-panel shadow-modal"
        onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b b-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md border b-line flex items-center justify-center shrink-0"
              style={{ backgroundColor: avatarColor(company.id) }}>
              <span className="text-[12px] t-ink font-semibold num">{company.mono ?? genMono(company.name)}</span>
            </div>
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider font-semibold">Speculative outreach</div>
              <div className="t-ink text-[14px] font-medium">{company.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto scroll-thin flex-1">
          <div>
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">Role focus</div>
            <input value={role} onChange={e => setRole(e.target.value)}
              placeholder="Business Development, Partnerships, RM…"
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim" />
          </div>

          <div>
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">Why this company (optional)</div>
            <div className="flex gap-2">
              <input value={context} onChange={e => setContext(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !generating) generate(); }}
                placeholder="Recent news, product angle, mutual connection…"
                className="flex-1 bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim" />
              <button onClick={generate} disabled={generating}
                className="px-3 py-2 rounded-md bg-ink t-paper text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-40 shrink-0">
                {generating ? <><Loader2 size={12} className="animate-spin" /> Writing…</> : <><Sparkles size={12} /> Generate</>}
              </button>
            </div>
            {genError && <div className="text-[12px] text-red-500 mt-1">{genError}</div>}
          </div>

          <div>
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">Subject</div>
            <input value={subject} onChange={e => setSubject(e.target.value)}
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px]" />
          </div>

          <div>
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">Body</div>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={14}
              placeholder={generating ? '' : 'Click Generate above to draft with AI…'}
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none placeholder:t-dim" />
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[12px] t-steel">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <div>Attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail. Destination: check {company.name}&apos;s website or LinkedIn.</div>
          </div>
        </div>

        <div className="p-3 border-t b-line flex items-center justify-end gap-2 bg-paper">
          <button onClick={copy} disabled={!body}
            className="btn-primary px-4 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-40">
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy to clipboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function CompanyCard({ company, onDraft, onTogglePin }: {
  company: Company;
  onDraft: (c: Company) => void;
  onTogglePin: (c: Company) => void;
}) {
  const hasJobs = company.job_count > 0;
  return (
    <div className="bg-card border b-line rounded-lg p-4 card-hover fade-in relative">
      {company.pinned && (
        <div className="absolute top-2 right-2 t-muted">
          <Pin size={11} fill="currentColor" />
        </div>
      )}

      <div className="flex items-start gap-3 mb-3">
        <div className="w-10 h-10 rounded-md border b-line flex items-center justify-center shrink-0"
          style={{ backgroundColor: avatarColor(company.id) }}>
          <span className="text-[12px] t-ink font-semibold num">{company.mono ?? genMono(company.name)}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="t-ink text-[15px] leading-tight font-semibold truncate">{company.name}</div>
          <div className="t-muted text-[12px] num mt-0.5 flex items-center gap-1.5">
            {company.sector && <span className="truncate">{company.sector}</span>}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        {hasJobs ? (
          <div className="bg-forest-soft t-forest px-2 py-1 rounded text-[12px] num font-semibold flex items-center gap-1">
            <Briefcase size={11} /> {company.job_count} open
          </div>
        ) : (
          <div className="t-dim text-[12px] num">No open jobs</div>
        )}
        {company.priority === 'high' && (
          <div className="bg-amber-soft t-amber text-[12px] num uppercase tracking-wider px-2 py-0.5 rounded font-semibold">high</div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t b-line">
        <div className="flex items-center gap-1">
          {company.website && <a href={company.website} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded" title="Website"><Globe size={12} /></a>}
          {company.linkedin && <a href={company.linkedin} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded" title="LinkedIn"><Linkedin size={12} /></a>}
          <button onClick={() => onTogglePin(company)} className="btn-ghost p-1.5 rounded" title={company.pinned ? 'Unpin' : 'Pin'}>
            {company.pinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
        </div>
        <button onClick={() => onDraft(company)} className="btn-primary px-3 py-1.5 rounded-md text-[12px] num font-medium flex items-center gap-1.5">
          <Edit3 size={11} /> Draft email
        </button>
      </div>
    </div>
  );
}

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading]     = useState(true);
  const [emailCompany, setEmailCompany] = useState<Company | null>(null);
  const [filter, setFilter] = useState<Filter>({ q: '', sector: 'all', priority: 'all', hasJobs: false });

  useEffect(() => {
    supabase.from('companies')
      .select('*')
      .order('pinned', { ascending: false })
      .order('job_count', { ascending: false })
      .order('name', { ascending: true })
      .then(({ data }) => {
        if (data) setCompanies(data as unknown as Company[]);
        setLoading(false);
      });
  }, []);

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

  async function togglePin(c: Company) {
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
          <div className="t-muted text-[12px] num mt-1">
            {companies.length} companies · {withJobsCount} with open jobs
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b b-line">
        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 t-dim" />
          <input value={filter.q} onChange={e => setFilter(f => ({ ...f, q: e.target.value }))}
            placeholder="Search company…"
            className="w-full bg-card border b-line rounded-md pl-8 pr-3 py-1.5 text-[12px] placeholder:t-dim" />
        </div>

        <div className="relative">
          <select value={filter.sector}
            onChange={e => setFilter(f => ({ ...f, sector: e.target.value }))}
            className="appearance-none bg-card border b-line rounded-md pl-3 pr-7 py-1.5 text-[12px] num cursor-pointer">
            <option value="all">All sectors</option>
            {sectors.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 t-dim pointer-events-none" />
        </div>

        <div className="flex items-center gap-0.5 bg-card border b-line rounded-md p-0.5">
          {(['all', 'high', 'med', 'low'] as const).map(p => (
            <button key={p}
              onClick={() => setFilter(f => ({ ...f, priority: p }))}
              className={`px-2.5 py-1 rounded text-[12px] num font-medium capitalize transition-colors ${filter.priority === p ? 'bg-ink t-paper' : 't-muted hover:t-ink'}`}>
              {p}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-1.5 text-[12px] num t-muted cursor-pointer select-none pl-1">
          <input type="checkbox" checked={filter.hasJobs}
            onChange={e => setFilter(f => ({ ...f, hasJobs: e.target.checked }))}
            className="accent-[#1a1815]" />
          Has open jobs
        </label>
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="bg-card border b-line rounded-lg p-4 h-[148px] shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Building2 size={20} className="mx-auto mb-3 t-dim" />
          <div className="t-dim text-[12px] num max-w-[240px] mx-auto">
            No companies match your filters. Try clearing the search or sector.
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {pinned.length > 0 && (
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider mb-3 font-semibold flex items-center gap-1.5">
                <Pin size={10} fill="currentColor" /> Pinned
              </div>
              <div className="grid grid-cols-3 gap-3">
                {pinned.map(c => <CompanyCard key={c.id} company={c} onDraft={setEmailCompany} onTogglePin={togglePin} />)}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {pinned.length > 0 && (
                <div className="t-dim num text-[12px] uppercase tracking-wider mb-3 font-semibold">All</div>
              )}
              <div className="grid grid-cols-3 gap-3">
                {rest.map(c => <CompanyCard key={c.id} company={c} onDraft={setEmailCompany} onTogglePin={togglePin} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {emailCompany && <CompanyEmailModal company={emailCompany} onClose={() => setEmailCompany(null)} />}
    </>
  );
}
