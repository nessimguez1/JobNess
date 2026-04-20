'use client';

import { useState } from 'react';
import { Inbox, Target, BarChart2, Settings as SettingsIcon, RefreshCw, Lock } from 'lucide-react';
import Feed from '../components/Feed';
import Targets from '../components/Targets';
import Stats from '../components/Stats';
import Settings from '../components/Settings';

type Tab = 'feed' | 'targets' | 'stats' | 'settings';

export default function Terminal() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');
  const [refreshing, setRefreshing] = useState(false);

  async function triggerRefresh() {
    setRefreshing(true);
    try {
      await fetch('/api/scraper/run', { method: 'POST' });
    } finally {
      setTimeout(() => setRefreshing(false), 2000);
    }
  }

  return (
    <div className="app-font bg-paper t-ink min-h-screen paper-texture">
      <header className="border-b b-line bg-paper sticky top-0 z-30">
        <div className="px-6 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center">
              <span className="t-paper text-[15px] font-semibold num">N</span>
            </div>
            <div>
              <div className="t-ink text-[16px] font-semibold leading-none">Terminal</div>
              <div className="num t-dim text-[9px] uppercase tracking-widest mt-0.5">v0.2 · private</div>
            </div>
          </div>

          <nav className="flex items-center gap-0.5">
            {([
              { k: 'feed' as const,     label: 'Feed',     icon: <Inbox    size={13} /> },
              { k: 'targets' as const,  label: 'Targets',  icon: <Target   size={13} /> },
              { k: 'stats' as const,    label: 'Stats',    icon: <BarChart2 size={13} /> },
              { k: 'settings' as const, label: 'Settings', icon: <SettingsIcon size={13} /> },
            ]).map(t => (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k)}
                className={`px-3 py-1.5 rounded-md text-[12px] num font-medium flex items-center gap-1.5 transition-colors ${activeTab === t.k ? 'bg-ink t-paper' : 't-muted hover:t-ink hover:bg-soft'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <button
              onClick={triggerRefresh}
              className="btn-ghost p-1.5 rounded"
              title="Refresh now"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            </button>
            <div className="w-px h-6 bg-softer" />
            <div className="text-[12px] num t-muted flex items-center gap-1.5">
              <Lock size={11} /> Nessim G.
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-5">
        {activeTab === 'feed' && <Feed />}

        {activeTab === 'targets' && <Targets />}
        {activeTab === 'stats' && <Stats />}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  );
}
