'use client';

import { useEffect, useMemo, useState } from 'react';
import { Send, Mail, Linkedin, Globe, Clock, Trash2, Search, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Outreach as OutreachRow, OutreachType, OutreachMethod } from '@jobness/shared';

type Row = OutreachRow & { target_name: string; target_kind: 'company' | 'job' };

function fmtDate(iso?: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

const METHOD_ICON: Record<OutreachMethod, React.ReactNode> = {
  email:    <Mail size={12} aria-hidden="true" />,
  linkedin: <Linkedin size={12} aria-hidden="true" />,
  website:  <Globe size={12} aria-hidden="true" />,
};

const TYPE_STYLE: Record<OutreachType, string> = {
  cold:        'bg-steel-soft t-steel',
  speculative: 'bg-soft t-muted',
  warm:        'bg-forest-soft t-forest',
  linkedin:    'bg-soft t-muted',
};

export default function Outreach() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [type, setType]       = useState<'all' | OutreachType>('all');
  const [scope, setScope]     = useState<'all' | 'pending' | 'due'>('all');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data: outreachData } = await supabase.from('outreach')
      .select('*')
      .order('sent_at', { ascending: false });
    const list = (outreachData ?? []) as unknown as OutreachRow[];

    const companyIds = [...new Set(list.map(r => r.company_id).filter((x): x is string => !!x))];
    const jobIds     = [...new Set(list.map(r => r.job_id).filter((x): x is string => !!x))];

    const [companiesRes, jobsRes] = await Promise.all([
      companyIds.length
        ? supabase.from('companies').select('id, name').in('id', companyIds)
        : Promise.resolve({ data: [] }),
      jobIds.length
        ? supabase.from('jobs').select('id, company, title').in('id', jobIds)
        : Promise.resolve({ data: [] }),
    ]);

    const companyName = new Map<string, string>();
    for (const c of (companiesRes.data ?? []) as { id: string; name: string }[]) companyName.set(c.id, c.name);
    const jobName = new Map<string, string>();
    for (const j of (jobsRes.data ?? []) as { id: string; company: string; title: string }[]) {
      jobName.set(j.id, `${j.company} · ${j.title}`);
    }

    const hydrated: Row[] = list.map(r => ({
      ...r,
      target_kind: r.company_id ? 'company' : 'job',
      target_name: r.company_id
        ? (companyName.get(r.company_id) ?? '(deleted company)')
        : (r.job_id ? (jobName.get(r.job_id) ?? '(deleted job)') : '—'),
    }));
    setRows(hydrated);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]!;
    const needle = q.trim().toLowerCase();
    return rows.filter(r => {
      if (type !== 'all' && r.type !== type) return false;
      if (scope === 'pending' && !r.follow_up_at) return false;
      if (scope === 'due' && !(r.follow_up_at && r.follow_up_at <= today)) return false;
      if (needle) {
        const hay = `${r.target_name} ${r.sent_to ?? ''} ${r.subject ?? ''} ${r.notes ?? ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [rows, q, type, scope]);

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]!;
    return {
      total:   rows.length,
      pending: rows.filter(r => r.follow_up_at).length,
      due:     rows.filter(r => r.follow_up_at && r.follow_up_at <= today).length,
    };
  }, [rows]);

  async function deleteRow(id: string) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('outreach') as any).delete().eq('id', id);
    setRows(prev => prev.filter(r => r.id !== id));
    setPendingDelete(null);
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="t-ink text-[24px] sm:text-[28px] font-semibold leading-tight tracking-tight">Outreach</h2>
          <div className="t-muted text-[13px] num mt-1">
            {stats.total} sent · {stats.pending} with follow-up · {stats.due > 0 ? <span className="t-brick font-semibold">{stats.due} due today</span> : 'none due'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b b-line">
        <div className="relative flex-1 min-w-[200px] max-w-[360px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 t-dim" aria-hidden="true" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search company, recipient, subject…"
            aria-label="Search outreach"
            className="w-full bg-card border b-line rounded-md pl-8 pr-3 py-1.5 text-[13px] placeholder:t-dim min-h-9" />
        </div>

        <label className="relative">
          <span className="sr-only">Filter by type</span>
          <select value={type} onChange={e => setType(e.target.value as 'all' | OutreachType)}
            className="appearance-none bg-card border b-line rounded-md pl-3 pr-7 py-1.5 text-[13px] num cursor-pointer">
            <option value="all">All types</option>
            <option value="cold">Cold</option>
            <option value="speculative">Speculative</option>
            <option value="warm">Warm</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 t-dim pointer-events-none" aria-hidden="true" />
        </label>

        <div role="radiogroup" aria-label="Filter by follow-up scope" className="flex items-center gap-0.5 bg-card border b-line rounded-md p-0.5">
          {(['all', 'pending', 'due'] as const).map(s => (
            <button type="button" key={s} role="radio" aria-checked={scope === s}
              onClick={() => setScope(s)}
              className={`px-2.5 min-h-9 rounded text-[13px] num font-medium capitalize transition-colors ${scope === s ? 'bg-ink t-paper' : 't-muted hover:t-ink'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border b-line rounded-md h-[52px] shimmer" aria-hidden="true" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Send size={22} className="mx-auto mb-3 t-dim" aria-hidden="true" />
          <div className="t-muted text-[13px] num max-w-[320px] mx-auto">
            {rows.length === 0
              ? 'No outreach yet. Draft an email from Feed or Companies and click Mark Applied / Mark Contacted.'
              : 'No outreach matches your filters.'}
          </div>
        </div>
      ) : (
        <div className="bg-card border b-line rounded-lg overflow-x-auto">
          <table className="w-full min-w-[720px] text-[13px] num">
            <caption className="sr-only">Outreach log: {filtered.length} entries</caption>
            <thead className="bg-soft border-b b-line t-muted uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th scope="col" className="text-left px-3 py-2 w-[90px]">Sent</th>
                <th scope="col" className="text-left px-3 py-2">Target</th>
                <th scope="col" className="text-left px-3 py-2 w-[110px]">Type</th>
                <th scope="col" className="text-left px-3 py-2 w-[80px]">Via</th>
                <th scope="col" className="text-left px-3 py-2">To</th>
                <th scope="col" className="text-left px-3 py-2 w-[110px]">Follow-up</th>
                <th scope="col" className="text-left px-3 py-2 w-[40px]"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const today = new Date().toISOString().split('T')[0]!;
                const due = r.follow_up_at && r.follow_up_at <= today;
                const isPendingDelete = pendingDelete === r.id;
                return (
                  <tr key={r.id} className="border-b b-line last:border-b-0 hover:bg-soft transition-colors">
                    <td className="px-3 py-2 t-muted">{fmtDate(r.sent_at)}</td>
                    <td className="px-3 py-2 t-ink font-medium">
                      {r.target_name}
                      <span className="t-dim ml-1.5 text-[12px]">· {r.target_kind}</span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[11px] uppercase tracking-wider font-semibold ${TYPE_STYLE[r.type]}`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="px-3 py-2 t-muted">
                      <span className="inline-flex items-center gap-1">
                        {r.method ? METHOD_ICON[r.method] : null} {r.method ?? '—'}
                      </span>
                    </td>
                    <td className="px-3 py-2 t-muted truncate max-w-[200px]">{r.sent_to ?? '—'}</td>
                    <td className="px-3 py-2">
                      {r.follow_up_at ? (
                        <span className={`inline-flex items-center gap-1 ${due ? 't-brick font-semibold' : 't-muted'}`}>
                          <Clock size={11} aria-hidden="true" /> {due ? 'due' : fmtDate(r.follow_up_at)}
                        </span>
                      ) : <span className="t-dim">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {isPendingDelete ? (
                        <div className="inline-flex items-center gap-1">
                          <button type="button" onClick={() => deleteRow(r.id)}
                            className="px-2 py-1 rounded text-[12px] num font-semibold bg-brick-soft t-brick hover:opacity-90">
                            Confirm
                          </button>
                          <button type="button" onClick={() => setPendingDelete(null)}
                            className="px-2 py-1 rounded text-[12px] num t-muted hover:t-ink">
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button type="button" onClick={() => setPendingDelete(r.id)}
                          aria-label={`Delete outreach entry to ${r.target_name}`}
                          className="btn-ghost btn-ghost-brick h-9 w-9 inline-flex items-center justify-center rounded">
                          <Trash2 size={13} aria-hidden="true" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
