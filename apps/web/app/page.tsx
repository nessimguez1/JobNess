'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Inbox, Building2, Send, Settings as SettingsIcon, Lock, Keyboard } from 'lucide-react';
import Feed from '../components/Feed';
import Companies from '../components/Companies';
import Outreach from '../components/Outreach';
import Settings from '../components/Settings';
import ScrapeStatus from '../components/ScrapeStatus';
import ToastHost from '../components/Toast';
import ShortcutOverlay from '../components/ShortcutOverlay';

type Tab = 'feed' | 'companies' | 'outreach' | 'settings';

const TABS = [
  { k: 'feed'      as const, label: 'Queue',     icon: Inbox,         hint: 'f' },
  { k: 'companies' as const, label: 'Companies', icon: Building2,     hint: 'c' },
  { k: 'outreach'  as const, label: 'Outreach',  icon: Send,          hint: 'o' },
  { k: 'settings'  as const, label: 'Settings',  icon: SettingsIcon,  hint: 's' },
];

export default function Terminal() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const tabRefs = useRef<Record<Tab, HTMLButtonElement | null>>({
    feed: null, companies: null, outreach: null, settings: null,
  });
  const panelId = useId();

  // g-prefix tab jump: press g, then (f|c|o|s) within 900ms
  useEffect(() => {
    let gArmed = false;
    let gTimer: ReturnType<typeof setTimeout> | null = null;
    const disarm = () => { gArmed = false; if (gTimer) { clearTimeout(gTimer); gTimer = null; } };

    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;

      if (gArmed) {
        const map: Record<string, Tab> = { f: 'feed', c: 'companies', o: 'outreach', s: 'settings' };
        const target = map[e.key];
        if (target) {
          e.preventDefault();
          setActiveTab(target);
        }
        disarm();
        return;
      }
      if (e.key === 'g') {
        gArmed = true;
        gTimer = setTimeout(disarm, 900);
      }
    }

    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); disarm(); };
  }, []);

  function onTabKeyDown(e: React.KeyboardEvent, idx: number) {
    let next = idx;
    if (e.key === 'ArrowRight') next = (idx + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') next = (idx - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = TABS.length - 1;
    else return;
    e.preventDefault();
    const tab = TABS[next]!;
    setActiveTab(tab.k);
    tabRefs.current[tab.k]?.focus();
  }

  const ActiveIcon = TABS.find(t => t.k === activeTab)?.icon ?? Inbox;

  return (
    <div className="bg-paper t-ink min-h-screen paper-texture">
      <header className="border-b b-line-strong bg-paper sticky top-0 z-30">
        <div className="px-4 sm:px-5 py-3 flex items-center gap-3 sm:gap-5 flex-wrap">
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center shrink-0" aria-hidden="true">
              <span className="t-paper text-[15px] font-bold tracking-tight">J</span>
            </div>
            <span className="font-serif-display text-[20px] t-ink leading-none">JobNess</span>
          </div>

          <label className="sm:hidden relative flex-1 min-w-[160px]">
            <span className="sr-only">Section</span>
            <ActiveIcon size={13} aria-hidden="true" className="absolute left-2.5 top-1/2 -translate-y-1/2 t-ink pointer-events-none" />
            <select
              value={activeTab}
              onChange={e => setActiveTab(e.target.value as Tab)}
              className="appearance-none w-full bg-card border b-line rounded-md pl-7 pr-3 py-1.5 text-[13px] num font-medium t-ink cursor-pointer min-h-9"
            >
              {TABS.map(t => <option key={t.k} value={t.k}>{t.label}</option>)}
            </select>
          </label>

          <nav
            role="tablist"
            aria-label="Main sections"
            aria-orientation="horizontal"
            className="hidden sm:flex items-center gap-0.5 overflow-x-auto scroll-thin flex-1 min-w-0"
          >
            {TABS.map((t, idx) => {
              const selected = activeTab === t.k;
              const Icon = t.icon;
              return (
                <button
                  key={t.k}
                  ref={el => { tabRefs.current[t.k] = el; }}
                  role="tab"
                  id={`tab-${t.k}`}
                  type="button"
                  aria-selected={selected}
                  aria-controls={`${panelId}-${t.k}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setActiveTab(t.k)}
                  onKeyDown={e => onTabKeyDown(e, idx)}
                  title={`g then ${t.hint}`}
                  className={`min-h-9 px-3 py-1.5 rounded-md text-[13px] num font-medium flex items-center gap-1.5 transition-colors shrink-0 ${selected ? 'bg-card border b-line t-ink' : 'border border-transparent t-muted hover:t-ink hover:bg-soft'}`}
                >
                  <Icon size={13} aria-hidden="true" /> {t.label}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3 shrink-0">
            <ScrapeStatus />
            <button
              type="button"
              onClick={() => {
                const evt = new KeyboardEvent('keydown', { key: '?' });
                window.dispatchEvent(evt);
              }}
              aria-label="Keyboard shortcuts (?)"
              title="? for shortcuts"
              className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"
            >
              <Keyboard size={14} aria-hidden="true" />
            </button>
            <div className="w-px h-6 bg-softer hidden sm:block" aria-hidden="true" />
            <div className="text-[12px] num t-muted hidden sm:flex items-center gap-1.5">
              <Lock size={11} aria-hidden="true" /> Nessim G.
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 sm:px-6 py-5">
        <div className="max-w-[1100px] mx-auto">
          <div
            role="tabpanel"
            id={`${panelId}-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
          >
            {activeTab === 'feed'      && <Feed />}
            {activeTab === 'companies' && <Companies />}
            {activeTab === 'outreach'  && <Outreach />}
            {activeTab === 'settings'  && <Settings />}
          </div>
        </div>
      </main>

      <ToastHost />
      <ShortcutOverlay />
    </div>
  );
}
