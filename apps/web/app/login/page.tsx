'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      } else {
        setError('Wrong password.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-paper min-h-screen flex items-center justify-center paper-texture p-4">
      <div className="bg-card border b-line rounded-xl p-8 w-full max-w-sm shadow-modal">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-md bg-ink flex items-center justify-center" aria-hidden="true">
            <span className="t-paper text-[18px] font-semibold num">J</span>
          </div>
          <div>
            <h1 className="font-serif-display t-ink text-[20px] leading-none">JobNess</h1>
            <div className="num t-muted text-[11px] uppercase tracking-widest mt-1 font-semibold">terminal · private · v0.2</div>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3" noValidate>
          <label className="block">
            <span className="t-muted num text-[12px] uppercase tracking-wider mb-1.5 font-semibold block">Password</span>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-paper border b-line rounded-md px-3 py-2.5 text-[13px] min-h-10"
              autoFocus
              required
              aria-invalid={!!error}
              aria-describedby={error ? 'login-error' : undefined}
            />
          </label>
          {error && <div id="login-error" role="alert" className="t-brick text-[12px] num">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 rounded-md text-[13px] font-medium flex items-center justify-center gap-2 min-h-10"
          >
            <Lock size={13} aria-hidden="true" /> {loading ? 'Checking…' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
