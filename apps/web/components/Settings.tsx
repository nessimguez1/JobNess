'use client';

import { useState, useEffect } from 'react';
import { Sliders, Shield, FileText, RefreshCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Settings as SettingsRow } from '@jobness/shared';

interface BlocklistRow {
  id: number;
  pattern: string;
}

export default function Settings() {
  const [settings, setSettings] = useState<SettingsRow>({
    id: 1,
    min_salary_nis: 18000,
    role_focus: ['Private Banking', 'Fintech BD', 'VC / IR', 'Tech BD'],
    geo: ['Israel', 'Remote EU', 'Remote US'],
  });
  const [blocklist, setBlocklist] = useState<BlocklistRow[]>([]);
  const [newBlock, setNewBlock] = useState('');
  const [loading, setLoading] = useState(true);
  const [sliderVal, setSliderVal] = useState(18000);

  useEffect(() => {
    Promise.all([
      supabase.from('settings').select('*').eq('id', 1).single(),
      supabase.from('blocklist').select('*').order('id'),
    ]).then(([{ data: s }, { data: b }]) => {
      if (s) { setSettings(s as SettingsRow); setSliderVal((s as SettingsRow).min_salary_nis); }
      if (b) setBlocklist(b as BlocklistRow[]);
      setLoading(false);
    });
  }, []);

  async function savePatch(patch: Partial<SettingsRow>) {
    setSettings(prev => ({ ...prev, ...patch }));
    await supabase.from('settings').update(patch).eq('id', 1);
  }

  async function addBlock() {
    const pattern = newBlock.trim();
    if (!pattern) return;
    const { data } = await supabase.from('blocklist').insert({ pattern }).select().single();
    if (data) {
      setBlocklist(prev => [...prev, data as BlocklistRow]);
      setNewBlock('');
    }
  }

  async function removeBlock(id: number) {
    setBlocklist(prev => prev.filter(b => b.id !== id));
    await supabase.from('blocklist').delete().eq('id', id);
  }

  const toggleRole = (r: string) => {
    const roles = settings.role_focus.includes(r)
      ? settings.role_focus.filter(x => x !== r)
      : [...settings.role_focus, r];
    savePatch({ role_focus: roles });
  };

  const toggleGeo = (g: string) => {
    const geo = settings.geo.includes(g)
      ? settings.geo.filter(x => x !== g)
      : [...settings.geo, g];
    savePatch({ geo });
  };

  if (loading) return <div className="t-muted text-[13px] num italic pt-10 text-center">Loading…</div>;

  return (
    <div>
      <h2 className="t-ink text-[24px] font-semibold leading-tight mb-1">Settings</h2>
      <div className="t-muted text-[13px] num mb-5">filters, sources, blocklist, CV</div>

      <div className="max-w-3xl space-y-4">
        <section className="bg-card border b-line rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Sliders size={15} className="t-ink" aria-hidden="true" />
            <h3 className="t-ink text-[14px] font-semibold">Filters</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block">
                <div className="flex items-center justify-between mb-2">
                  <span className="t-muted text-[13px]">Minimum monthly salary (NIS)</span>
                  <span className="num t-ink text-[13px] font-semibold" aria-live="polite">{sliderVal.toLocaleString()}</span>
                </div>
                <input type="range" min="10000" max="50000" step="500"
                  value={sliderVal}
                  onChange={e => setSliderVal(parseInt(e.target.value))}
                  onMouseUp={e => savePatch({ min_salary_nis: parseInt((e.target as HTMLInputElement).value) })}
                  onTouchEnd={e => savePatch({ min_salary_nis: parseInt((e.target as HTMLInputElement).value) })}
                  aria-label="Minimum monthly salary in NIS"
                  aria-valuetext={`${sliderVal.toLocaleString()} NIS`}
                  className="w-full" />
              </label>
              <div className="flex justify-between text-[12px] num t-muted mt-1" aria-hidden="true">
                <span>10K</span><span>30K</span><span>50K</span>
              </div>
            </div>
            <div>
              <div className="t-muted text-[13px] mb-2">Role focus</div>
              <div role="group" aria-label="Role focus" className="flex flex-wrap gap-2">
                {['Private Banking', 'Fintech BD', 'VC / IR', 'Tech BD'].map(r => {
                  const active = settings.role_focus.includes(r);
                  return (
                    <button type="button" key={r} onClick={() => toggleRole(r)}
                      aria-pressed={active}
                      className={`min-h-9 px-3 rounded-md border text-[13px] num font-medium transition-colors ${active ? 'bg-ink t-paper b-ink' : 'bg-card t-muted b-line hover:bg-soft hover:t-ink'}`}>
                      {r}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <div className="t-muted text-[13px] mb-2">Geography</div>
              <div role="group" aria-label="Geography" className="flex flex-wrap gap-2">
                {['Israel', 'Remote EU', 'Remote US', 'Switzerland'].map(g => {
                  const active = settings.geo.includes(g);
                  return (
                    <button type="button" key={g} onClick={() => toggleGeo(g)}
                      aria-pressed={active}
                      className={`min-h-9 px-3 rounded-md border text-[13px] num font-medium transition-colors ${active ? 'bg-ink t-paper b-ink' : 'bg-card t-muted b-line hover:bg-soft hover:t-ink'}`}>
                      {g}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card border b-line rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={15} className="t-brick" aria-hidden="true" />
            <h3 className="t-ink text-[14px] font-semibold">Discretion blocklist</h3>
            <div className="t-muted text-[12px] num ml-auto">these never appear in feed</div>
          </div>
          <ul className="flex flex-wrap gap-2 mb-3" aria-label="Blocked companies">
            {blocklist.map(b => (
              <li key={b.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-brick-soft border b-brick-soft rounded-md t-brick text-[13px] num font-medium">
                <span>{b.pattern}</span>
                <button type="button" onClick={() => removeBlock(b.id)} aria-label={`Remove ${b.pattern} from blocklist`} className="hover:opacity-70 inline-flex items-center"><X size={12} aria-hidden="true" /></button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input value={newBlock} onChange={e => setNewBlock(e.target.value)}
              placeholder="Add company to exclude..."
              aria-label="Add company to blocklist"
              className="flex-1 bg-paper border b-line rounded-md px-3 py-1.5 text-[13px] min-h-9"
              onKeyDown={e => { if (e.key === 'Enter') addBlock(); }} />
            <button type="button" onClick={addBlock} className="min-h-9 px-3 rounded-md bg-card border b-line t-ink text-[13px] hover:bg-soft">Add</button>
          </div>
        </section>

        <section className="bg-card border b-line rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={15} className="t-ink" aria-hidden="true" />
            <h3 className="t-ink text-[14px] font-semibold">Master CV</h3>
          </div>
          <div className="flex items-center justify-between p-3 bg-soft rounded-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-card flex items-center justify-center" aria-hidden="true">
                <FileText size={15} className="t-ink" />
              </div>
              <div>
                <div className="t-ink text-[13px] num font-medium">CV_Nessim_Guez.pdf</div>
                <div className="t-muted text-[12px] num">attached to every outgoing draft</div>
              </div>
            </div>
            <button type="button" className="t-ink text-[13px] num font-semibold hover:underline min-h-9">Replace</button>
          </div>
        </section>

        <section className="bg-card border b-line rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={15} className="t-ink" aria-hidden="true" />
            <h3 className="t-ink text-[14px] font-semibold">Sources &amp; refresh</h3>
          </div>
          <ul className="space-y-2 text-[13px]">
            {[
              { name: 'Greenhouse career pages', detail: '20+ companies monitored' },
              { name: 'Lever career pages', detail: '5+ companies monitored' },
              { name: 'LinkedIn Jobs', detail: 'coming soon' },
              { name: 'Drushim / AllJobs', detail: 'coming soon' },
            ].map(s => (
              <li key={s.name} className="flex items-center justify-between p-2.5 bg-soft rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: 'var(--forest)' }} aria-hidden="true" />
                  <span className="t-ink">{s.name}</span>
                </div>
                <div className="t-muted num text-[12px]">{s.detail}</div>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-[12px] t-muted num">Refresh cadence: twice daily (morning + evening)</div>
        </section>
      </div>
    </div>
  );
}
