'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Mail, Send, Linkedin, Check, Copy, AlertCircle, Lock, Sparkles, Loader2, FileText } from 'lucide-react';
import type { Job, OutreachLog, OutreachMethod } from '@jobness/shared';
import { copyEmail } from '../lib/signature';
import { logOutreach, lastSentToForCompany } from '../lib/outreach';
import Modal from './Modal';

type EmailTab = 'cover_letter' | 'cold' | 'linkedin';

const CONTEXT_PLACEHOLDER: Record<EmailTab, string> = {
  cover_letter: 'Optional: anything specific about the role or team to reference',
  cold:         'Optional: what drew you to this role (recent raise, product angle, mutual connection…)',
  linkedin:     'Optional: something specific about them or their company',
};

interface Props {
  job: Job;
  onClose: () => void;
  onMarkApplied: (id: string, log: OutreachLog) => void;
}

export default function EmailModal({ job, onClose, onMarkApplied }: Props) {
  const [tab, setTab]           = useState<EmailTab>('cover_letter');
  const [context, setContext]   = useState('');
  const [subject, setSubject]   = useState('');
  const [body, setBody]         = useState('');
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);

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

  useEffect(() => {
    let cancelled = false;
    lastSentToForCompany(job.company).then(prev => {
      if (!cancelled && prev) setSentTo(prev);
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [job.id]);

  useEffect(() => {
    if (tab === 'linkedin') setMethod('linkedin');
    else setMethod('email');
  }, [tab]);

  const generate = async () => {
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

  const copyAndLog = async () => {
    if (!body || submitting || done) return;
    setSubmitting(true);
    try {
      await copyEmail({
        kind: tab === 'linkedin' ? 'linkedin' : 'email',
        ...(tab !== 'linkedin' ? { subject } : {}),
        body,
      });
      const log: OutreachLog = { outreach_method: method, outreach_date: outreachDate };
      if (sentTo.trim())  log.sent_to      = sentTo.trim();
      if (followUpAt)     log.follow_up_at = followUpAt;
      onMarkApplied(job.id, log);
      await logOutreach({
        jobId: job.id,
        type: tab,
        method,
        sentAt: outreachDate,
        ...(sentTo.trim()   ? { sentTo: sentTo.trim() } : {}),
        ...(followUpAt      ? { followUpAt }           : {}),
        ...(subject.trim()  ? { subject: subject.trim() } : {}),
        ...(body.trim()     ? { body: body.trim() }       : {}),
      });
      setDone(true);
      setTimeout(onClose, 700);
    } finally {
      setSubmitting(false);
    }
  };

  // Auto-generate on open / tab change. All three tabs auto-generate — none of
  // them requires upfront context (context is optional for all).
  const autoGenFiredFor = useRef<string>('');
  useEffect(() => {
    const key = `${job.id}:${tab}`;
    if (autoGenFiredFor.current === key) return;
    autoGenFiredFor.current = key;
    void generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, job.id]);

  // Cmd/Ctrl+Enter triggers the primary action from anywhere in the modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        void copyAndLog();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const canGenerate = true;
  const titleId = `email-modal-title-${job.id}`;

  return (
    <Modal onClose={onClose} labelledBy={titleId} panelClassName="max-w-3xl max-h-[90vh]">
      <div className="p-4 border-b b-line flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-md bg-soft border b-line flex items-center justify-center shrink-0" aria-hidden="true">
            <Mail size={14} className="t-ink" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="t-muted num text-[11px] uppercase tracking-wider font-semibold">Draft for</div>
            <h2 id={titleId} className="t-ink text-[14px] font-medium truncate">{job.company} · {job.title}</h2>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded shrink-0"
        ><X size={16} aria-hidden="true" /></button>
      </div>

      <div className="px-4 py-3 border-b b-line bg-paper">
        <div role="tablist" aria-label="Email type" className="inline-flex items-center gap-0.5 bg-card border b-line rounded-md p-0.5 overflow-x-auto scroll-thin max-w-full">
          {([
            { k: 'cover_letter' as const, label: 'Cover Letter', icon: <FileText size={13} aria-hidden="true" /> },
            { k: 'cold'         as const, label: 'Cold Mail',    icon: <Send     size={13} aria-hidden="true" /> },
            { k: 'linkedin'     as const, label: 'LinkedIn DM',  icon: <Linkedin size={13} aria-hidden="true" /> },
          ]).map(t => (
            <button
              type="button"
              key={t.k}
              role="tab"
              aria-selected={tab === t.k}
              onClick={() => setTab(t.k)}
              className={`px-2.5 min-h-9 rounded text-[13px] num font-medium flex items-center gap-1.5 shrink-0 transition-colors ${tab === t.k ? 'bg-ink t-paper' : 't-muted hover:t-ink'}`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3 overflow-y-auto scroll-thin flex-1">
        {tab !== 'linkedin' && (
          <label className="block">
            <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">Subject</span>
            <input
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="Generated with email…"
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim min-h-10"
            />
          </label>
        )}

        <div>
          <label className="block">
            <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">
              Context (optional)
            </span>
            <div className="flex gap-2">
              <input
                value={context}
                onChange={e => setContext(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !generating && canGenerate) generate(); }}
                placeholder={CONTEXT_PLACEHOLDER[tab]}
                className="flex-1 bg-paper border b-line rounded-md px-3 py-2 text-[13px] placeholder:t-dim min-h-10"
              />
              <button
                type="button"
                onClick={generate}
                disabled={generating || !canGenerate}
                className="min-h-10 px-3 rounded-md bg-ink t-paper text-[13px] font-medium flex items-center gap-1.5 disabled:opacity-40 shrink-0"
              >
                {generating
                  ? <><Loader2 size={13} className="animate-spin" aria-hidden="true" /> Writing…</>
                  : <><Sparkles size={13} aria-hidden="true" /> Generate</>}
              </button>
            </div>
          </label>
          {genError && (
            <div role="alert" className="text-[12px] t-brick mt-1.5 flex items-center gap-2">
              <span>{genError}</span>
              <button type="button" onClick={generate} className="underline hover:no-underline">Try again</button>
            </div>
          )}
        </div>

        <label className="block">
          <span className="block t-muted num text-[11px] uppercase tracking-wider mb-1.5 font-semibold">
            {tab === 'linkedin' ? 'Message' : 'Body'}
          </span>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            rows={tab === 'linkedin' ? 7 : tab === 'cover_letter' ? 18 : 12}
            placeholder={generating ? '' : 'Click Generate above to draft with AI…'}
            className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none placeholder:t-dim"
          />
        </label>

        {(tab === 'cold' || tab === 'cover_letter') && (
          <div role="note" className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[13px] t-steel">
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div><span className="font-semibold">Reminder: </span>attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail before sending.</div>
          </div>
        )}
        {!job.fit_note && (
          <div role="note" className="flex items-start gap-2 p-2.5 bg-brick-soft border b-brick-soft rounded-md text-[13px] t-brick">
            <AlertCircle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
            <div><span className="font-semibold">Fit analysis missing.</span> Email quality will be lower. Add context above to compensate.</div>
          </div>
        )}

        <section aria-labelledby="log-outreach-heading" className="rounded-lg p-3 space-y-2.5 bg-soft">
          <h3 id="log-outreach-heading" className="t-muted num text-[11px] uppercase tracking-wider font-semibold">Log this outreach</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className="block t-muted num text-[12px] mb-1">Date sent</span>
              <input
                type="date"
                value={outreachDate}
                onChange={e => setOutreachDate(e.target.value)}
                className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[13px] num min-h-9"
              />
            </label>
            <label className="block">
              <span className="block t-muted num text-[12px] mb-1">Sent to</span>
              <input
                value={sentTo}
                onChange={e => setSentTo(e.target.value)}
                placeholder="Name, email, or LinkedIn…"
                className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[13px] placeholder:t-dim min-h-9"
              />
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <div className="t-muted num text-[12px] mb-1">Via</div>
              <div role="radiogroup" aria-label="Send method" className="flex gap-1 flex-wrap">
                {(['email', 'linkedin', 'website'] as OutreachMethod[]).map(m => (
                  <button
                    type="button"
                    key={m}
                    role="radio"
                    aria-checked={method === m}
                    onClick={() => setMethod(m)}
                    className={`px-2.5 min-h-9 rounded text-[13px] num font-medium capitalize border transition-colors ${method === m ? 'bg-ink t-paper b-ink' : 'bg-paper b-line t-muted hover:t-ink'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <label className="block">
              <span className="block t-muted num text-[12px] mb-1">Follow-up reminder</span>
              <input
                type="date"
                value={followUpAt}
                onChange={e => setFollowUpAt(e.target.value)}
                className="w-full bg-paper border b-line rounded-md px-2.5 py-1.5 text-[13px] num min-h-9"
              />
            </label>
          </div>
        </section>
      </div>

      <div className="p-3 border-t b-line flex flex-wrap items-center justify-between gap-2 bg-paper">
        <div className="flex items-center gap-2 text-[12px] t-muted num">
          <Lock size={12} aria-hidden="true" /> drafts never leave your browser
        </div>
        <button
          type="button"
          onClick={copyAndLog}
          disabled={!body || submitting || done}
          title="Copy the draft and log this as applied (Cmd/Ctrl+Enter)"
          className="btn-primary min-h-10 px-4 rounded-md text-[13px] font-semibold flex items-center gap-2 disabled:opacity-40"
        >
          {done
            ? <><Check size={14} aria-hidden="true" /> Copied &amp; logged</>
            : submitting
              ? <><Loader2 size={14} className="animate-spin" aria-hidden="true" /> Logging…</>
              : <><Copy size={14} aria-hidden="true" /> Copy &amp; log applied</>}
        </button>
      </div>
    </Modal>
  );
}
