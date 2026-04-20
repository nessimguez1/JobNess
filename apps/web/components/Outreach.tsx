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
  email:    <Mail size={11} />,
  linkedin: <Linkedin size={11} />,
  website:  <Globe size={11} />,
};

const TYPE_STYLE: Record<OutreachType, string> = {
  cold:        'bg-steel-soft t-steel',
  speculative: 'bg-amber-soft t-amber',
  warm:        'bg-forest-soft t-forest',
  linkedin:    'bg-soft t-muted',
};

export default function Outreach() {
  const [rows, setRows]       = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ]             = useState('');
  const [type, setType]       = useState<'all' | OutreachType>('all');
  const [scope, setScope]     = useState<'all' | 'pending' | 'due'>('all');

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
      jobName.set(j.id, `${j.company} — ${j.title}`);
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
    if (!confirm('Delete this outreach entry? This cannot be undone.')) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('outreach') as any).delete().eq('id', id);
    setRows(prev => prev.filter(r => r.id !== id));
  }

  return (
    <>
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h2 className="t-ink text-[24px] font-semibold leading-tight">Outreach</h2>
          <div className="t-muted text-[12px] num mt-1">
            {stats.total} sent · {stats.pending} with follow-up · {stats.due > 0 && <span className="t-amber font-semibold">{stats.due} due today</span>}{stats.due === 0 && 'none due'}
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5 pb-4 border-b b-line">
        <div className="relative flex-1 min-w-[240px] max-w-[360px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 t-dim" />
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search company, recipient, subject…"
            className="w-full bg-card border b-line rounded-md pl-8 pr-3 py-1.5 text-[12px] placeholder:t-dim" />
        </div>

        <div className="relative">
          <select value={type} onChange={e => setType(e.target.value as 'all' | OutreachType)}
            className="appearance-none bg-card border b-line rounded-md pl-3 pr-7 py-1.5 text-[12px] num cursor-pointer">
            <option value="all">All types</option>
            <option value="cold">Cold</option>
            <option value="speculative">Speculative</option>
            <option value="warm">Warm</option>
            <option value="linkedin">LinkedIn</option>
          </select>
          <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 t-dim pointer-events-none" />
        </div>

        <div className="flex items-center gap-0.5 bg-card border b-line rounded-md p-0.5">
          {(['all', 'pending', 'due'] as const).map(s => (
            <button key={s} onClick={() => setScope(s)}
              className={`px-2.5 py-1 rounded text-[12px] num font-medium capitalize transition-colors ${scope === s ? 'bg-ink t-paper' : 't-muted hover:t-ink'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card border b-line rounded-md h-[52px] shimmer" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Send size={20} className="mx-auto mb-3 t-dim" />
          <div className="t-dim text-[12px] num max-w-[280px] mx-auto">
            {rows.length === 0
              ? 'No outreach yet. Draft an email from Feed or Companies and click Mark Applied / Mark Contacted.'
              : 'No outreach matches your filters.'}
          </div>
        </div>
      ) : (
        <div className="bg-card border b-line rounded-lg overflow-hidden">
          <table className="w-full text-[12px] num">
            <thead className="bg-soft border-b b-line t-dim uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="text-left px-3 py-2 w-[90px]">Sent</th>
                <th className="text-left px-3 py-2">Target</th>
                <th className="text-left px-3 py-2 w-[110px]">Type</th>
                <th className="text-left px-3 py-2 w-[60px]">Via</th>
                <th className="text-left px-3 py-2">To</th>
                <th className="text-left px-3 py-2 w-[110px]">Follow-up</th>
                <th className="text-left px-3 py-2 w-[40px]"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => {
                const today = new Date().toISOString().split('T')[0]!;
                const due = r.follow_up_at && r.follow_up_at <= today;
                return (
                  <tr key={r.id} className="border-b b-line last:border-b-0 hover:bg-soft transition-colors">
                    <td className="px-3 py-2 t-muted">{fmtDate(r.sent_at)}</td>
                    <td className="px-3 py-2 t-ink font-medium">
                      {r.target_name}
                      <span className="t-dim ml-1.5 text-[11px]">· {r.target_kind}</span>
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
                        <span className={`inline-flex items-center gap-1 ${due ? 't-amber font-semibold' : 't-muted'}`}>
                          <Clock size={10} /> {due ? 'due' : fmtDate(r.follow_up_at)}
                        </span>
                      ) : <span className="t-dim">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <button onClick={() => deleteRow(r.id)}
                        className="btn-ghost btn-ghost-brick p-1 rounded" title="Delete entry">
                        <Trash2 size={12} />
                      </button>
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
