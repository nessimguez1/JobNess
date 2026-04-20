'use client';

import { useState } from 'react';
import { Inbox, Building2, Send, BarChart2, Settings as SettingsIcon, Lock } from 'lucide-react';
import Feed from '../components/Feed';
import Companies from '../components/Companies';
import Outreach from '../components/Outreach';
import Stats from '../components/Stats';
import Settings from '../components/Settings';
import ScrapeStatus from '../components/ScrapeStatus';

type Tab = 'feed' | 'companies' | 'outreach' | 'stats' | 'settings';

export default function Terminal() {
  const [activeTab, setActiveTab] = useState<Tab>('feed');

  return (
    <div className="app-font bg-paper t-ink min-h-screen paper-texture">
      <header className="border-b b-line-strong bg-paper sticky top-0 z-30">
        <div className="px-5 py-3 flex items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-ink flex items-center justify-center shrink-0">
              <span className="t-paper text-[15px] font-bold tracking-tight">J</span>
            </div>
            <span className="font-semibold text-[15px] t-ink tracking-tight">JobNess</span>
          </div>

          <nav className="flex items-center gap-0.5">
            {([
              { k: 'feed' as const,      label: 'Feed',      icon: <Inbox       size={13} /> },
              { k: 'companies' as const, label: 'Companies', icon: <Building2   size={13} /> },
              { k: 'outreach' as const,  label: 'Outreach',  icon: <Send        size={13} /> },
              { k: 'stats' as const,     label: 'Stats',     icon: <BarChart2   size={13} /> },
              { k: 'settings' as const,  label: 'Settings',  icon: <SettingsIcon size={13} /> },
            ]).map(t => (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k)}
                className={`px-3 py-1.5 rounded-md text-[12px] num font-medium flex items-center gap-1.5 transition-colors ${activeTab === t.k ? 'bg-card border b-line t-ink' : 'border border-transparent t-muted hover:t-ink hover:bg-soft'}`}
              >
                {t.icon} {t.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-3">
            <ScrapeStatus />
            <div className="w-px h-6 bg-softer" />
            <div className="text-[12px] num t-muted flex items-center gap-1.5">
              <Lock size={11} /> Nessim G.
            </div>
          </div>
        </div>
      </header>

      <main className="px-6 py-5">
        <div className="max-w-[1400px] mx-auto">
          {activeTab === 'feed' && <Feed />}
          {activeTab === 'companies' && <Companies />}
          {activeTab === 'outreach' && <Outreach />}
          {activeTab === 'stats' && <Stats />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
}
