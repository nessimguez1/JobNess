'use client';

import { useState, useEffect } from 'react';
import { X, Mail, Send, Linkedin, Check, Copy, AlertCircle, Lock } from 'lucide-react';
import type { Job } from '@jobness/shared';

type EmailTab = 'cold' | 'warm' | 'linkedin';

function genEmails(job: Job) {
  const bullets = Array.isArray(job.match_bullets) ? job.match_bullets : [];
  const matchLines = bullets.map(b => `• ${b}`).join('\n');
  const cold = {
    subject: `Application — ${job.title} — Nessim Guez`,
    body: `Dear Hiring Team,

I'm writing to apply for the ${job.title} role at ${job.company}. My profile maps cleanly to what the position requires:

${matchLines}

A brief summary: I'm currently a Relationship Manager at UBP (Tel Aviv) where I originate and service HNWI clients across Israel and France, working with Geneva on KYC and onboarding. Before UBP, I spent time inside the Israeli tech ecosystem (IATI) and in wealth at Tafnit Discount. I'm a native trilingual (French, English, Hebrew) with ten years lived in the United States.

I'd welcome a conversation about how this background could contribute to ${job.company}. My CV is attached.

Best regards,
Nessim Guez
nessimguez1@gmail.com | +972 54 649 5846
linkedin.com/in/nessim-guez`,
  };
  const warm = {
    subject: `${job.title} — quick note before I apply`,
    body: `Hi,

Saw the ${job.title} opening at ${job.company} and wanted to reach out directly before going through the standard channel.

Quick context: I'm at UBP covering HNWI clients across Israel and France, reporting into the French desk. Prior to UBP, IATI (Israeli tech ecosystem) and Tafnit Discount. Trilingual FR/EN/HE, based in Tel Aviv.

Two reasons the fit feels sharp for ${job.company}:
${matchLines}

Would 15 minutes next week work to discuss? Happy to send the CV ahead of the call.

Best,
Nessim
+972 54 649 5846`,
  };
  const linkedin = {
    subject: `LinkedIn DM — ${job.company}`,
    body: `Hi — saw the ${job.title} role at ${job.company} and the fit is sharp:

I'm at UBP covering French-speaking HNWI clients in TLV/Paris, trilingual FR/EN/HE, with prior exposure to the IL tech ecosystem via IATI. Would 15 min next week work to discuss? I'll send the CV ahead.

— Nessim`,
  };
  return { cold, warm, linkedin };
}

interface Props {
  job: Job;
  onClose: () => void;
  onMarkApplied: (id: string) => void;
}

export default function EmailModal({ job, onClose, onMarkApplied }: Props) {
  const [tab, setTab] = useState<EmailTab>('cold');
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState<'EN' | 'FR'>('EN');
  const emails = genEmails(job);
  const [subject, setSubject] = useState(emails[tab].subject);
  const [body, setBody] = useState(emails[tab].body);

  useEffect(() => {
    setSubject(emails[tab].subject);
    setBody(emails[tab].body);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, job.id]);

  const copy = () => {
    const text = tab === 'linkedin' ? body : `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

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
        <div className="p-4 border-b b-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-soft border b-line flex items-center justify-center">
              <Mail size={14} className="t-ink" />
            </div>
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider font-semibold">Draft for</div>
              <div className="t-ink text-[14px] font-medium">{job.company} — {job.title}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>

        <div className="flex items-center border-b b-line bg-paper">
          {([
            { k: 'cold' as const, label: 'Cold Apply', icon: <Send size={12} /> },
            { k: 'warm' as const, label: 'Warm Intro', icon: <Mail size={12} /> },
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
          <div className="ml-auto flex items-center gap-1 pr-3">
            <button onClick={() => setLang('EN')} className={`px-2 py-1 text-[10px] num rounded font-semibold ${lang === 'EN' ? 'bg-ink t-paper' : 't-dim'}`}>EN</button>
            <button onClick={() => setLang('FR')} className={`px-2 py-1 text-[10px] num rounded font-semibold ${lang === 'FR' ? 'bg-ink t-paper' : 't-dim'}`}>FR</button>
          </div>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto scroll-thin">
          {tab !== 'linkedin' && (
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Subject</div>
              <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px]" />
            </div>
          )}
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">
              {tab === 'linkedin' ? 'Message' : 'Body'}
            </div>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={tab === 'linkedin' ? 6 : 14}
              className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none"
            />
          </div>
          {tab !== 'linkedin' && (
            <div className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[11px] t-steel">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold">Reminder: </span>
                attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail before sending.
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t b-line flex items-center justify-between gap-2 bg-paper">
          <div className="flex items-center gap-2 text-[11px] t-dim num">
            <Lock size={11} /> drafts never leave your browser
          </div>
          <div className="flex items-center gap-2">
            <button onClick={copy} className="px-3 py-1.5 rounded-md bg-card border b-line t-ink text-[12px] flex items-center gap-1.5 hover:border-b-line-strong">
              {copied ? <><Check size={12} className="t-forest" /> Copied</> : <><Copy size={12} /> Copy</>}
            </button>
            <button
              onClick={() => { onMarkApplied(job.id); onClose(); }}
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
