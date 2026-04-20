'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Send, Linkedin, Check, Copy, AlertCircle, Lock, Sparkles, Loader2 } from 'lucide-react';
import type { Job, OutreachLog, OutreachMethod } from '@jobness/shared';

type EmailTab = 'cold' | 'warm' | 'linkedin';

const CONTEXT_PLACEHOLDER: Record<EmailTab, string> = {
  cold:     'Optional: what drew you to this role? (e.g. they just raised Series B, you know their product, a mutual connection…)',
  warm:     'Required: what did they write or do? (e.g. their LinkedIn post about X, their talk at Y conference…)',
  linkedin: 'Optional: something specific about them or their company',
};

interface Props {
  job: Job;
  onClose: () => void;
  onMarkApplied: (id: string, log: OutreachLog) => void;
}

export default function EmailModal({ job, onClose, onMarkApplied }: Props) {
  const [tab, setTab]           = useState<EmailTab>('cold');
  const [context, setContext]   = useState('');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [copied, setCopied]     = useState(false);

  // Outreach log fields
  const today = new Date().toISOString().split('T')[0]!;
  const [sentTo,      setSentTo]      = useState('');
  const [method,      setMethod]      = useState<OutreachMethod>('email');
  const [outreachDate, setOutreachDate] = useState(today);
  const [followUpAt,  setFollowUpAt]  = useState('');

  useEffect(() => {
    setSubject('');
    setBody('');
    setContext('');
    setGenError('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, job.id]);

  // sync method default to tab
  useEffect(() => {
    if (tab === 'linkedin') setMethod('linkedin');
    else setMethod('email');
  }, [tab]);

  const generate = async () => {
    if (tab === 'warm' && !context.trim()) return;
    setGenerating(true);
    setGenError('');
    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          type: tab,
          title: job.title,
          company: job.company,
          fit_note: job.fit_note,
          match_bullets: job.match_bullets,
          context: context || undefined,
          description: job.description || undefined,
          company_site: job.company_site || undefined,
        }),
      });
      const data = await res.json() as { body?: string; subject?: string; error?: string };
      if (!res.ok || !data.body) throw new Error(data.error ?? 'Generation failed');
      setBody(data.body);
      if (data.subject) setSubject(data.subject);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    const text = tab === 'linkedin' ? body : `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const handleMarkApplied = () => {
    const log: OutreachLog = { outreach_method: method, outreach_date: outreachDate };
    if (sentTo.trim())  log.sent_to      = sentTo.trim();
    if (followUpAt)     log.follow_up_at = followUpAt;
    onMarkApplied(job.id, log);
    onClose();
  };

  const canGenerate = tab !== 'warm' || context.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg"
      style={{ backgroundColor: 'rgba(26, 24, 21, 0.4)' }}
      onClick={onClose}
    >
      <div
        className="bg-card border b-line rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col modal-panel shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b b-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-soft border b-line flex items-center justify-center">
              <Mail size={14} className="t-ink" />
            </div>
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider font-semibold">Draft for</div>
              <div className="t-ink text-[14px] font-medium">{job.company} — {job.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>

        {/* Tabs */}
        <div className="flex items-center border-b b-line bg-paper">
          {([
            { k: 'cold'     as const, label: 'Cold Apply',  icon: <Send     size={12} /> },
            { k: 'warm'     as const, label: 'Warm Intro',  icon: <Mail     size={12} /> },
            { k: 'linkedin' as const, label: 'LinkedIn DM', icon: <Linkedin size={12} /> },
          ]).map(t => (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              className={`px-4 py-2.5 text-[12px] num flex items-center gap-1.5 border-b-2 transition-colors ${tab === t.k ? 't-ink font-semibold' : 't-muted border-transparent hover:t-ink'}`}
              style={{ borderBottomColor: tab === t.k ? '#1a1815' : 'transparent' }}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 overflow-y-auto scroll-thin flex-1">

          {/* Subject (cold + warm only) */}
          {tab !== 'linkedin' && (
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">Subject</div>
              <input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Generated with email…"
                className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim"
              />
            </div>
          )}

          {/* Context + Generate */}
          <div>
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">
              {tab === 'warm' ? 'What did they write or do?' : 'Context (optional)'}
            </div>
            <div className="flex gap-2">
              <input
                value={context}
                onChange={e => setContext(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !generating && canGenerate) generate(); }}
                placeholder={CONTEXT_PLACEHOLDER[tab]}
                className="flex-1 bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim"
              />
              <button
                onClick={generate}
                disabled={generating || !canGenerate}
                className="px-3 py-2 rounded-md bg-ink t-paper text-[12px] font-medium flex items-center gap-1.5 disabled:opacity-40 shrink-0"
              >
                {generating
                  ? <><Loader2 size={12} className="animate-spin" /> Writing…</>
                  : <><Sparkles size={12} /> Generate</>}
              </button>
            </div>
            {genError && <div className="text-[12px] text-red-500 mt-1">{genError}</div>}
            {tab === 'warm' && !context.trim() && (
              <div className="text-[12px] t-dim mt-1">Fill in what they wrote or did to unlock generation.</div>
            )}
          </div>

          {/* Email body */}
          <div>
            <div className="t-dim num text-[12px] uppercase tracking-wider mb-1.5 font-semibold">
              {tab === 'linkedin' ? 'Message' : 'Body'}
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={tab === 'linkedin' ? 7 : 12}
              placeholder={generating ? '' : 'Click Generate above to draft with AI…'}
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none placeholder:t-dim"
            />
          </div>

          {/* Outreach log */}
          <div className="border b-line rounded-lg p-3 space-y-2.5 bg-soft">
            <div className="t-dim num text-[12px] uppercase tracking-wider font-semibold">Log outreach</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="t-dim num text-[12px] mb-1">Date sent</div>
                <input
                  type="date"
                  value={outreachDate}
                  onChange={e => setOutreachDate(e.target.value)}
                  className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[12px] num"
                />
              </div>
              <div>
                <div className="t-dim num text-[12px] mb-1">Sent to</div>
                <input
                  value={sentTo}
                  onChange={e => setSentTo(e.target.value)}
                  placeholder="Name, email, or LinkedIn…"
                  className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[12px] placeholder:t-dim"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="t-dim num text-[12px] mb-1">Via</div>
                <div className="flex gap-1">
                  {(['email', 'linkedin', 'website'] as OutreachMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`px-2.5 py-1 rounded text-[12px] num font-medium capitalize border transition-colors ${method === m ? 'bg-ink t-paper border-ink' : 'bg-paper b-line t-dim hover:t-ink'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <div className="t-dim num text-[12px] mb-1">Follow-up reminder</div>
                <input
                  type="date"
                  value={followUpAt}
                  onChange={e => setFollowUpAt(e.target.value)}
                  className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[12px] num"
                />
              </div>
            </div>
          </div>

          {!job.fit_note && (
            <div className="flex items-start gap-2 p-2.5 bg-amber-soft border b-amber-soft rounded-md text-[12px] t-amber">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <div><span className="font-semibold">Fit analysis missing</span> — email quality will be lower. Add context above to compensate.</div>
            </div>
          )}
          {tab === 'cold' && (
            <div className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[12px] t-steel">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <div><span className="font-semibold">Reminder: </span>attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail before sending.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t b-line flex items-center justify-between gap-2 bg-paper">
          <div className="flex items-center gap-2 text-[12px] t-dim num">
            <Lock size={11} /> drafts never leave your browser
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={copy}
              disabled={!body}
              className="px-3 py-1.5 rounded-md bg-card border b-line t-ink text-[12px] flex items-center gap-1.5 hover:border-b-line-strong disabled:opacity-40"
            >
              {copied ? <><Check size={12} className="t-forest" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <button
              onClick={handleMarkApplied}
              className="btn-primary px-4 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5"
            >
              <Check size={12} /> Mark Applied
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
