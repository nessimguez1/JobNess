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

  if (loading) return <div className="t-dim text-[12px] num italic pt-10 text-center">Loading…</div>;

  return (
    <div>
      <h2 className="t-ink text-[24px] font-semibold leading-tight mb-1">Settings</h2>
      <div className="t-muted text-[12px] num mb-5">filters, sources, blocklist, CV</div>

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
                <div className="num t-ink text-[13px] font-semibold">{sliderVal.toLocaleString()}</div>
              </div>
              <input type="range" min="10000" max="50000" step="500"
                value={sliderVal}
                onChange={e => setSliderVal(parseInt(e.target.value))}
                onMouseUp={e => savePatch({ min_salary_nis: parseInt((e.target as HTMLInputElement).value) })}
                onTouchEnd={e => savePatch({ min_salary_nis: parseInt((e.target as HTMLInputElement).value) })}
                className="w-full" />
              <div className="flex justify-between text-[12px] num t-dim mt-1">
                <span>10K</span><span>30K</span><span>50K</span>
              </div>
            </div>
            <div>
              <div className="t-muted text-[12px] mb-2">Role focus</div>
              <div className="flex flex-wrap gap-2">
                {['Private Banking', 'Fintech BD', 'VC / IR', 'Tech BD'].map(r => (
                  <button key={r} onClick={() => toggleRole(r)}
                    className={`px-3 py-1.5 rounded-md border text-[12px] num font-medium transition-colors ${settings.role_focus.includes(r) ? 'bg-ink t-paper' : 'bg-card t-muted b-line hover:bg-soft'}`}
                    style={{ borderColor: settings.role_focus.includes(r) ? '#1a1815' : '' }}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="t-muted text-[12px] mb-2">Geography</div>
              <div className="flex flex-wrap gap-2">
                {['Israel', 'Remote EU', 'Remote US', 'Switzerland'].map(g => (
                  <button key={g} onClick={() => toggleGeo(g)}
                    className={`px-3 py-1.5 rounded-md border text-[12px] num font-medium transition-colors ${settings.geo.includes(g) ? 'bg-ink t-paper' : 'bg-card t-muted b-line hover:bg-soft'}`}
                    style={{ borderColor: settings.geo.includes(g) ? '#1a1815' : '' }}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card border b-line rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <Shield size={14} className="t-brick" />
            <div className="t-ink text-[14px] font-semibold">Discretion blocklist</div>
            <div className="t-dim text-[12px] num ml-auto">these never appear in feed</div>
          </div>
          <div className="flex flex-wrap gap-2 mb-3">
            {blocklist.map(b => (
              <div key={b.id} className="flex items-center gap-1.5 px-2.5 py-1 bg-brick-soft border b-brick-soft rounded-md t-brick text-[12px] num font-medium">
                <span>{b.pattern}</span>
                <button onClick={() => removeBlock(b.id)} className="hover:opacity-70"><X size={10} /></button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newBlock} onChange={e => setNewBlock(e.target.value)}
              placeholder="Add company to exclude..."
              className="flex-1 bg-paper border b-line rounded-md px-3 py-1.5 text-[12px]"
              onKeyDown={e => { if (e.key === 'Enter') addBlock(); }} />
            <button onClick={addBlock} className="px-3 py-1.5 rounded-md bg-card border b-line t-ink text-[12px] hover:bg-soft">Add</button>
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
                <div className="t-dim text-[12px] num">attached to every outgoing draft</div>
              </div>
            </div>
            <button className="t-ink text-[12px] num font-semibold hover:underline">Replace</button>
          </div>
        </div>

        <div className="bg-card border b-line rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={14} className="t-ink" />
            <div className="t-ink text-[14px] font-semibold">Sources &amp; refresh</div>
          </div>
          <div className="space-y-2 text-[12px]">
            {[
              { name: 'Greenhouse career pages', detail: '20+ companies monitored' },
              { name: 'Lever career pages', detail: '5+ companies monitored' },
              { name: 'LinkedIn Jobs', detail: 'coming soon' },
              { name: 'Drushim / AllJobs', detail: 'coming soon' },
            ].map(s => (
              <div key={s.name} className="flex items-center justify-between p-2.5 bg-soft border b-line rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ backgroundColor: '#3f5c2e' }} />
                  <span className="t-ink">{s.name}</span>
                </div>
                <div className="t-dim num text-[12px]">{s.detail}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[12px] t-dim num">Refresh cadence: twice daily (morning + evening)</div>
        </div>
      </div>
    </div>
  );
}
