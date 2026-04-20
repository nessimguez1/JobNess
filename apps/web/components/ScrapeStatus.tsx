'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Check, AlertTriangle, Loader2 } from 'lucide-react';
import type { ScrapeRun } from '@jobness/shared';

interface StatusResponse {
  is_running: boolean;
  last_started_at: string | null;
  last_completed_at: string | null;
  total_jobs_new: number;
  total_jobs_found: number;
  sources: ScrapeRun[];
}

function fmtClock(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function sourceIcon(s: ScrapeRun) {
  if (s.status === 'running') return <Loader2 size={10} className="animate-spin t-steel" />;
  if (s.status === 'ok')      return <Check     size={10} className="t-forest" />;
  return <AlertTriangle size={10} className="t-brick" />;
}

export const SCRAPE_COMPLETE_EVENT = 'jobness:scrape-complete';

export default function ScrapeStatus() {
  const [status, setStatus]   = useState<StatusResponse | null>(null);
  const [open, setOpen]       = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [trigError, setTrigError]   = useState('');
  const prevRunning = useRef(false);

  async function fetchStatus() {
    try {
      const res = await fetch('/api/scraper/status', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json() as StatusResponse;
      if (prevRunning.current && !data.is_running) {
        window.dispatchEvent(new CustomEvent(SCRAPE_COMPLETE_EVENT, { detail: data }));
      }
      prevRunning.current = data.is_running;
      setStatus(data);
    } catch {
      // silent — poll will retry
    }
  }

  useEffect(() => {
    fetchStatus();
  }, []);

  useEffect(() => {
    if (!status?.is_running) return;
    const id = window.setInterval(fetchStatus, 3000);
    return () => window.clearInterval(id);
  }, [status?.is_running]);

  async function trigger() {
    if (status?.is_running || triggering) return;
    setTriggering(true);
    setTrigError('');
    try {
      const res = await fetch('/api/scraper/run', { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error ?? 'Request failed');
      }
    } catch (err) {
      setTrigError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setTriggering(false);
      // Give the pipeline a second to create its first scrape_runs row, then poll.
      setTimeout(fetchStatus, 800);
    }
  }

  const running = status?.is_running ?? false;
  const summary = running
    ? 'Running…'
    : status?.last_completed_at
      ? `${fmtClock(status.last_completed_at)} · +${status.total_jobs_new}`
      : 'Never run';

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <button
          onClick={trigger}
          disabled={running || triggering}
          className="btn-ghost p-1.5 rounded disabled:opacity-40"
          title={running ? 'Run in progress' : 'Run scrapers now'}
        >
          <RefreshCw size={13} className={running || triggering ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={() => setOpen(o => !o)}
          className="text-[11px] num t-muted hover:t-ink transition-colors flex items-center gap-1"
          title="Scrape status"
        >
          <span className={running ? 't-steel font-semibold' : ''}>{summary}</span>
        </button>
      </div>

      {trigError && (
        <div className="absolute right-0 top-full mt-1 bg-card border b-line rounded-md px-2 py-1 text-[11px] t-brick num z-40 whitespace-nowrap">
          {trigError}
        </div>
      )}

      {open && status && (
        <div
          className="absolute right-0 top-full mt-1.5 w-[280px] bg-card border b-line rounded-lg shadow-modal z-40 p-3"
          onMouseLeave={() => setOpen(false)}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="t-dim num text-[11px] uppercase tracking-wider font-semibold">Last run</div>
            <div className="t-muted text-[11px] num">{fmtClock(status.last_started_at)}</div>
          </div>

          {status.sources.length === 0 ? (
            <div className="t-dim text-[12px] num py-2">No runs yet.</div>
          ) : (
            <div className="space-y-1">
              {status.sources.map(s => (
                <div key={s.source} className="flex items-center justify-between text-[12px] num">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {sourceIcon(s)}
                    <span className="t-ink font-medium truncate">{s.source}</span>
                  </div>
                  <div className="t-muted shrink-0">
                    {s.status === 'running' ? (
                      <span className="t-steel">running…</span>
                    ) : s.status === 'failed' ? (
                      <span className="t-brick" title={s.error ?? ''}>failed</span>
                    ) : (
                      <span>{s.jobs_found} found · +{s.jobs_new}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-3 pt-2 border-t b-line flex items-center justify-between text-[11px] num">
            <span className="t-dim">Total new</span>
            <span className="t-ink font-semibold">+{status.total_jobs_new}</span>
          </div>

          {status.sources.some(s => s.status === 'failed') && (
            <div className="mt-2 pt-2 border-t b-line space-y-1">
              {status.sources.filter(s => s.status === 'failed' && s.error).map(s => (
                <div key={s.source} className="text-[11px] t-brick">
                  <span className="font-semibold">{s.source}:</span> {s.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
