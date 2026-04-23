'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';

const GROUPS: { title: string; items: { keys: string[]; label: string }[] }[] = [
  {
    title: 'Navigate',
    items: [
      { keys: ['j'],            label: 'Next row' },
      { keys: ['k'],            label: 'Previous row' },
      { keys: ['/'],            label: 'Focus search' },
      { keys: ['Esc'],          label: 'Clear search / close' },
      { keys: ['Enter'],        label: 'Open job detail' },
    ],
  },
  {
    title: 'Act on focused job',
    items: [
      { keys: ['i'], label: 'Mark interested' },
      { keys: ['e'], label: 'Draft email' },
      { keys: ['a'], label: 'Mark applied' },
      { keys: ['x'], label: 'Archive' },
    ],
  },
  {
    title: 'Jump between tabs',
    items: [
      { keys: ['g', 'f'], label: 'Queue' },
      { keys: ['g', 'c'], label: 'Companies' },
      { keys: ['g', 'o'], label: 'Outreach' },
      { keys: ['g', 's'], label: 'Settings' },
    ],
  },
  {
    title: 'This overlay',
    items: [
      { keys: ['?'], label: 'Show / hide shortcuts' },
    ],
  },
];

export default function ShortcutOverlay() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      if (e.key === '?') {
        e.preventDefault();
        setOpen(v => !v);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  return (
    <Modal onClose={() => setOpen(false)} labelledBy="shortcut-title" panelClassName="max-w-lg max-h-[80vh]">
      <div className="p-4 border-b b-line flex items-center justify-between">
        <h2 id="shortcut-title" className="font-serif-display text-[20px] t-ink">Keyboard shortcuts</h2>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded">
          <X size={16} aria-hidden="true" />
        </button>
      </div>
      <div className="p-4 overflow-y-auto scroll-thin flex-1 space-y-4">
        {GROUPS.map(g => (
          <section key={g.title}>
            <h3 className="t-muted num text-[11px] uppercase tracking-wider font-semibold mb-2">{g.title}</h3>
            <ul className="space-y-1.5">
              {g.items.map(item => (
                <li key={item.label} className="flex items-center justify-between gap-3 text-[13px]">
                  <span className="t-ink">{item.label}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {item.keys.map((k, i) => (
                      <kbd
                        key={i}
                        className="bg-soft border b-line rounded px-1.5 py-0.5 text-[12px] num font-semibold t-ink min-w-[24px] text-center"
                      >{k}</kbd>
                    ))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
