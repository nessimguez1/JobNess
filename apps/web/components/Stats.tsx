'use client';

import { useState, useEffect } from 'react';
import { Globe, Linkedin, Briefcase } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface JobRow {
  id: string;
  column_name: string;
  source: string;
  company: string;
  score: number | null;
  created_at: string;
}

function sourceIcon(source: string, size = 11) {
  if (source === 'LinkedIn') return <Linkedin size={size} />;
  if (source === 'Drushim') return <Briefcase size={size} />;
  return <Globe size={size} />;
}

export default function Stats() {
  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('jobs').select('id,column_name,source,company,score,created_at')
      .then(({ data }) => {
        if (data) setJobs(data as JobRow[]);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="t-dim text-[12px] num italic pt-10 text-center">Loading…</div>;

  const interested = jobs.filter(j => j.column_name === 'interested').length;
  const applied = jobs.filter(j => j.column_name === 'applied').length;
  const scored = jobs.filter(j => j.score !== null);
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((a, j) => a + (j.score ?? 0), 0) / scored.length) : null;

  const bySource = jobs.reduce<Record<string, number>>((acc, j) => {
    acc[j.source] = (acc[j.source] ?? 0) + 1;
    return acc;
  }, {});
  const maxSource = Math.max(...Object.values(bySource), 1);

  const pbKeywords = ['bank', 'pictet', 'lombard', 'rothschild', 'syz', 'mirabaud', 'bordier', 'reyl', 'julius'];
  const ftKeywords = ['melio', 'rapyd', 'payoneer', 'pagaya', 'etoro', 'tipalti', 'papaya', 'riskified', 'nuvei', 'payments', 'fintech', 'checkout', 'wise', 'airwallex', 'deel', 'lemonade', 'fiverr'];
  const vcKeywords = ['team8', 'aleph', 'ourcrowd', 'venture', 'capital', 'fund'];

  function classify(company: string) {
    const c = company.toLowerCase();
    if (pbKeywords.some(k => c.includes(k))) return 'Private Banking';
    if (vcKeywords.some(k => c.includes(k))) return 'VC / IR';
    if (ftKeywords.some(k => c.includes(k))) return 'Fintech BD';
    return 'Other';
  }

  const byType = jobs.reduce<Record<string, number>>((acc, j) => {
    const t = classify(j.company);
    acc[t] = (acc[t] ?? 0) + 1;
    return acc;
  }, {});
  const maxType = Math.max(...Object.values(byType), 1);

  const now = new Date();
  const days14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });
  const byDay: Record<string, number> = {};
  for (const j of jobs) {
    const day = j.created_at.slice(0, 10);
    byDay[day] = (byDay[day] ?? 0) + 1;
  }
  const activity = days14.map(d => byDay[d] ?? 0);
  const maxActivity = Math.max(...activity, 1);

  return (
    <div>
      <h2 className="t-ink text-[24px] font-semibold leading-tight mb-1">Pipeline</h2>
      <div className="t-muted text-[12px] num mb-5">current state of the hunt</div>

      <div className="space-y-4">
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Jobs Surfaced', value: jobs.length },
            { label: 'Interested', value: interested },
            { label: 'Applied', value: applied },
            { label: 'Avg Score', value: avgScore !== null ? avgScore : '—' },
          ].map(m => (
            <div key={m.label} className="bg-card border b-line rounded-lg p-4">
              <div className="t-dim num text-[12px] uppercase tracking-wider mb-2 font-semibold">{m.label}</div>
              <div className="num t-ink text-[34px] leading-none font-semibold">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-card border b-line rounded-lg p-5">
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-4 font-semibold">By Source</div>
            {Object.keys(bySource).length === 0 ? (
              <div className="t-dim text-[12px] num italic">No data yet</div>
            ) : (
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
                      <div className="h-full bg-ink" style={{ width: `${(count / maxSource) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-card border b-line rounded-lg p-5">
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-4 font-semibold">By Role Type</div>
            {Object.keys(byType).length === 0 ? (
              <div className="t-dim text-[12px] num italic">No data yet</div>
            ) : (
              <div className="space-y-3">
                {Object.entries(byType).map(([type, count]) => (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="t-ink text-[12px]">{type}</div>
                      <span className="num text-[12px] t-ink font-semibold">{count}</span>
                    </div>
                    <div className="h-1.5 bg-soft rounded-full overflow-hidden">
                      <div className="h-full bg-ink" style={{ width: `${(count / maxType) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-card border b-line rounded-lg p-5">
          <div className="t-dim num text-[12px] uppercase tracking-wider mb-4 font-semibold">Last 14 days — jobs scraped</div>
          {jobs.length === 0 ? (
            <div className="t-dim text-[12px] num italic py-8 text-center">Run a scrape to see activity</div>
          ) : (
            <>
              <div className="h-28 flex items-end justify-between gap-1">
                {activity.map((v, i) => (
                  <div key={i} className="flex-1 bg-ink rounded-t" style={{ height: `${Math.max((v / maxActivity) * 100, 3)}%`, opacity: 0.3 + (i / 14) * 0.7 }} />
                ))}
              </div>
              <div className="flex justify-between text-[12px] num t-dim mt-2">
                <span>14d ago</span><span>today</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
