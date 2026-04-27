'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Inbox, Search, CheckCircle2, TrendingUp } from 'lucide-react';
import type { Job, OutreachLog } from '@jobness/shared';
import { supabase } from '../lib/supabase';
import QueueRow from './QueueRow';
import JobDetailModal from './JobDetailModal';
import EmailModal from './EmailModal';
import { toast } from './Toast';

type Filter = 'active' | 'due' | 'inbox' | 'interested' | 'applied' | 'archive';

const FILTER_LABEL: Record<Filter, string> = {
  active:     'Active',
  due:        'Due today',
  inbox:      'New',
  interested: 'Interested',
  applied:    'Applied',
  archive:    'Archive',
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0]!;
}

function priority(j: Job, today: string): number {
  if (j.column_name === 'archive') return -1;
  if (j.column_name === 'applied' && j.follow_up_at && j.follow_up_at <= today) return 10_000 + (j.score ?? 0);
  if (j.column_name === 'interested') return 5_000 + (j.score ?? 0);
  if (j.column_name === 'inbox')      return 2_000 + (j.score ?? 0);
  if (j.column_name === 'applied')    return 500   + (j.score ?? 0);
  return 0;
}

function matchesFilter(j: Job, f: Filter, today: string): boolean {
  if (f === 'active')     return j.column_name !== 'archive';
  if (f === 'due')        return j.column_name === 'applied' && !!j.follow_up_at && j.follow_up_at <= today;
  if (f === 'archive')    return j.column_name === 'archive';
  return j.column_name === f;
}

function daysSince(iso: string | null | undefined): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

export default function Feed() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<Job | null>(null);
  const [filter, setFilter] = useState<Filter>('active');
  const [query, setQuery] = useState('');
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const loadJobs = useCallback(async () => {
    const { data } = await supabase.from('jobs').select('*');
    setJobs((data as Job[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadJobs(); }, [loadJobs]);

  useEffect(() => {
    const handler = () => { loadJobs(); };
    window.addEventListener('jobness:scrape-complete', handler);
    return () => window.removeEventListener('jobness:scrape-complete', handler);
  }, [loadJobs]);

  const today = todayStr();

  const queue = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs
      .filter(j => matchesFilter(j, filter, today))
      .filter(j => !needle || `${j.company} ${j.title} ${j.location ?? ''}`.toLowerCase().includes(needle))
      .sort((a, b) => priority(b, today) - priority(a, today));
  }, [jobs, filter, today, query]);

  const stats = useMemo(() => {
    const active = jobs.filter(j => j.column_name !== 'archive');
    const due = active.filter(j => j.column_name === 'applied' && j.follow_up_at && j.follow_up_at <= today).length;
    const interested = active.filter(j => j.column_name === 'interested').length;
    const inbox = active.filter(j => j.column_name === 'inbox').length;
    const appliedThisWeek = active.filter(j => {
      const d = daysSince(j.applied_at ?? null);
      return j.column_name === 'applied' && d !== null && d <= 7;
    }).length;
    return { total: active.length, due, interested, inbox, appliedThisWeek };
  }, [jobs, today]);

  const scoredCount = jobs.filter(j => j.score !== null && j.score !== undefined).length;

  const moveJob = useCallback(async (id: string, col: Job['column_name']) => {
    const prev = jobs.find(j => j.id === id);
    if (!prev) return;
    const statusMap: Record<Job['column_name'], Job['status']> = {
      inbox: 'new', interested: 'interested', applied: 'applied', archive: 'rejected',
    };
    const update: Partial<Job> = { column_name: col, status: statusMap[col] };
    if (col === 'applied' && !prev.applied_at) update.applied_at = new Date().toISOString();
    setJobs(arr => arr.map(j => j.id === id ? { ...j, ...update } : j));
    await supabase.from('jobs').update(update).eq('id', id);

    const prevCol = prev.column_name;
    if (prevCol !== col) {
      toast.show({
        message: `Moved ${prev.company} → ${FILTER_LABEL[col as Filter] ?? col}`,
        action: {
          label: 'Undo',
          onClick: async () => {
            const revert: Partial<Job> = { column_name: prevCol, status: statusMap[prevCol] };
            if (col === 'applied' && !prev.applied_at) revert.applied_at = null as unknown as string;
            setJobs(arr => arr.map(j => j.id === id ? { ...j, ...revert } : j));
            await supabase.from('jobs').update(revert).eq('id', id);
          },
        },
      });
    }
  }, [jobs]);

  const trashJob = useCallback(async (id: string) => {
    const prev = jobs.find(j => j.id === id);
    if (!prev) return;
    const update = { column_name: 'archive' as const, status: 'rejected' as const, trashed_at: new Date().toISOString() };
    setJobs(arr => arr.map(j => j.id === id ? { ...j, ...update } : j));
    await supabase.from('jobs').update(update).eq('id', id);

    toast.show({
      message: `Archived ${prev.company}`,
      action: {
        label: 'Undo',
        onClick: async () => {
          const revert = { column_name: prev.column_name, status: prev.status, trashed_at: null as unknown as string };
          setJobs(arr => arr.map(j => j.id === id ? { ...j, ...revert } : j));
          await supabase.from('jobs').update(revert).eq('id', id);
        },
      },
    });
  }, [jobs]);

  const markApplied = useCallback(async (id: string, log?: OutreachLog) => {
    const update: Partial<Job> = {
      column_name: 'applied',
      status: 'applied',
      applied_at: log?.outreach_date ? new Date(log.outreach_date).toISOString() : new Date().toISOString(),
      ...log,
    };
    setJobs(arr => arr.map(j => j.id === id ? { ...j, ...update } : j));
    await supabase.from('jobs').update(update).eq('id', id);
  }, []);

  // Keyboard navigation within the queue
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (emailJob || selectedJob) return;
      const target = e.target as HTMLElement | null;
      const isTyping = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
      if (isTyping && e.key !== 'Escape') return;

      if (e.key === '/' && !isTyping) {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === 'Escape') {
        setQuery('');
        (document.activeElement as HTMLElement | null)?.blur?.();
        return;
      }

      const idx = queue.findIndex(j => j.id === focusedId);
      const cur = idx >= 0 ? queue[idx] : undefined;

      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = queue[Math.min((idx < 0 ? -1 : idx) + 1, queue.length - 1)];
        if (next) { setFocusedId(next.id); scrollRowIntoView(next.id); }
        return;
      }
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = queue[Math.max(idx - 1, 0)];
        if (next) { setFocusedId(next.id); scrollRowIntoView(next.id); }
        return;
      }
      if (!cur) return;
      if (e.key === 'Enter') { e.preventDefault(); setSelectedJob(cur); }
      else if (e.key === 'i' && cur.column_name !== 'interested') { e.preventDefault(); moveJob(cur.id, 'interested'); }
      else if (e.key === 'e') { e.preventDefault(); setEmailJob(cur); }
      else if (e.key === 'x' && cur.column_name !== 'archive') { e.preventDefault(); trashJob(cur.id); }
      else if (e.key === 'a' && cur.column_name !== 'applied') { e.preventDefault(); moveJob(cur.id, 'applied'); }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [queue, focusedId, emailJob, selectedJob, moveJob, trashJob]);

  function scrollRowIntoView(id: string) {
    const el = listRef.current?.querySelector(`[data-job-id="${id}"]`) as HTMLElement | null;
    el?.focus?.();
    el?.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
  }

  return (
    <>
      <div className="flex items-end justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h2 className="t-ink text-[24px] sm:text-[28px] font-semibold leading-tight tracking-tight">Queue</h2>
          <div className="t-muted text-[13px] num mt-1 flex items-center gap-2 flex-wrap">
            {loading ? 'loading…' : (
              <>
                <span><span className="t-ink font-semibold">{stats.total}</span> active</span>
                <span aria-hidden="true">·</span>
                <span><span className="t-ink font-semibold">{stats.inbox}</span> new</span>
                <span aria-hidden="true">·</span>
                <span><span className="t-ink font-semibold">{stats.interested}</span> interested</span>
                {stats.due > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 t-brick font-semibold">
                      <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-brick" />
                      {stats.due} due today
                    </span>
                  </>
                )}
                {stats.appliedThisWeek > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 t-forest font-semibold">
                      <TrendingUp size={11} aria-hidden="true" /> {stats.appliedThisWeek} this week
                    </span>
                  </>
                )}
              </>
            )}
          </div>
        </div>
        <div className="t-muted text-[12px] num">{scoredCount}/{jobs.length} scored</div>
      </div>

      <div className="flex items-center gap-2 mb-5 flex-wrap">
        <label className="relative flex-1 min-w-[200px] max-w-[360px]">
          <span className="sr-only">Search queue</span>
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 t-dim" aria-hidden="true" />
          <input
            ref={searchRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Filter (/ to focus)"
            className="w-full bg-card border b-line rounded-md pl-8 pr-3 py-1.5 text-[13px] placeholder:t-dim min-h-9"
          />
        </label>

        <div role="radiogroup" aria-label="Queue filter" className="flex items-center gap-0.5 bg-card border b-line rounded-md p-0.5 overflow-x-auto scroll-thin">
          {(['active', 'due', 'inbox', 'interested', 'applied', 'archive'] as Filter[]).map(f => {
            const selected = filter === f;
            const count = f === 'active' ? stats.total
                        : f === 'due' ? stats.due
                        : f === 'inbox' ? stats.inbox
                        : f === 'interested' ? stats.interested
                        : f === 'applied' ? jobs.filter(j => j.column_name === 'applied').length
                        : jobs.filter(j => j.column_name === 'archive').length;
            return (
              <button
                key={f}
                role="radio"
                aria-checked={selected}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-2.5 min-h-9 rounded text-[13px] num font-medium flex items-center gap-1.5 shrink-0 transition-colors ${selected ? 'bg-ink t-paper' : 't-muted hover:t-ink'}`}
              >
                {FILTER_LABEL[f]}
                <span className={`text-[11px] font-semibold ${selected ? 'opacity-80' : 'opacity-60'}`}>{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="bg-card border b-line rounded-lg p-4 h-[88px] shimmer" aria-hidden="true" />
          ))}
        </div>
      ) : queue.length === 0 ? (
        <div className="bg-card border b-line rounded-lg py-16 text-center">
          <Inbox size={24} className="mx-auto mb-3 t-dim" aria-hidden="true" />
          <div className="t-muted text-[13px] num max-w-[320px] mx-auto">
            {filter === 'due' ? 'Nothing due today. Nice.'
             : filter === 'archive' ? 'Archive is empty.'
             : query ? `No matches for "${query}".`
             : 'No jobs yet. Scraper runs twice daily.'}
          </div>
          {filter === 'due' && stats.appliedThisWeek > 0 && (
            <div className="mt-3 inline-flex items-center gap-1.5 t-forest text-[12px] num">
              <CheckCircle2 size={13} aria-hidden="true" />
              {stats.appliedThisWeek} application{stats.appliedThisWeek === 1 ? '' : 's'} out this week
            </div>
          )}
        </div>
      ) : (
        <div ref={listRef} className="space-y-2">
          {queue.map((j, i) => (
            <QueueRow
              key={j.id}
              job={j}
              index={i}
              isFocused={focusedId === j.id}
              isDueToday={j.column_name === 'applied' && !!j.follow_up_at && j.follow_up_at <= today}
              onMove={moveJob}
              onOpen={setSelectedJob}
              onTrash={trashJob}
              onDraftEmail={setEmailJob}
            />
          ))}
        </div>
      )}

      {selectedJob && !emailJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onDraftEmail={j => { setEmailJob(j); setSelectedJob(null); }}
          onMove={moveJob}
          onTrash={trashJob}
        />
      )}
      {emailJob && (
        <EmailModal
          job={emailJob}
          onClose={() => setEmailJob(null)}
          onMarkApplied={markApplied}
        />
      )}
    </>
  );
}
