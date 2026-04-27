'use client';

import { useEffect, useState, useCallback } from 'react';

export interface ToastAction {
  label: string;
  onClick: () => void | Promise<void>;
}

export interface ToastPayload {
  message: string;
  action?: ToastAction;
  durationMs?: number;
}

interface InternalToast extends ToastPayload {
  id: number;
}

const EVT = 'jobness:toast';

export const toast = {
  show(payload: ToastPayload) {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent<ToastPayload>(EVT, { detail: payload }));
  },
};

export default function ToastHost() {
  const [items, setItems] = useState<InternalToast[]>([]);

  const dismiss = useCallback((id: number) => {
    setItems(xs => xs.filter(x => x.id !== id));
  }, []);

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<ToastPayload>).detail;
      const id = Date.now() + Math.random();
      const item: InternalToast = { id, ...detail };
      setItems(xs => [...xs, item]);
      const ms = detail.durationMs ?? 5000;
      setTimeout(() => dismiss(id), ms);
    }
    window.addEventListener(EVT, onToast);
    return () => window.removeEventListener(EVT, onToast);
  }, [dismiss]);

  if (items.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-2 pointer-events-none"
    >
      {items.map(t => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto bg-ink t-paper px-3.5 py-2 rounded-lg shadow-modal flex items-center gap-3 max-w-[360px] fade-in"
        >
          <span className="text-[13px] num truncate">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={async () => {
                await t.action!.onClick();
                dismiss(t.id);
              }}
              className="min-h-9 px-2 -my-1 text-[12px] num font-semibold underline decoration-dotted underline-offset-2 hover:decoration-solid shrink-0 inline-flex items-center"
            >
              {t.action.label}
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
