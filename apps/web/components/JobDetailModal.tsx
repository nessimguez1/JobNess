'use client';

import { X, Heart, Trash2, Mail, ExternalLink, Linkedin, Globe, UserCheck } from 'lucide-react';
import type { Job } from '@jobness/shared';
import { scoreTone } from './utils';

interface Props {
  job: Job;
  onClose: () => void;
  onDraftEmail: (job: Job) => void;
  onMove: (id: string, col: Job['column_name']) => void;
  onTrash: (id: string) => void;
}

export default function JobDetailModal({ job, onClose, onDraftEmail, onMove, onTrash }: Props) {
  const tone = scoreTone(job.score);
  const bullets = Array.isArray(job.match_bullets) ? job.match_bullets : [];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg"
      style={{ backgroundColor: 'rgba(26, 24, 21, 0.35)' }}
      onClick={onClose}
    >
      <div
        className="bg-card border b-line rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col modal-panel shadow-modal"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-5 border-b b-line flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className="w-11 h-11 rounded-md bg-soft border b-line flex items-center justify-center shrink-0">
              <span className="text-[12px] t-ink font-semibold num">{job.mono ?? job.company.slice(0, 2).toUpperCase()}</span>
            </div>
            <div className="min-w-0">
              <div className="t-muted text-[12px] num mb-0.5">{job.company}</div>
              <div className="t-ink text-[22px] leading-tight font-semibold">{job.title}</div>
              <div className="t-muted text-[12px] num mt-1">
                {[job.location, job.salary_text].filter(Boolean).join(' · ')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-2.5 py-1 rounded-md border num font-semibold ${tone.bg} ${tone.border}`}>
              <span className={`text-[14px] ${tone.text}`}>{job.score}</span>
              <span className="t-dim text-[12px]">/100</span>
            </div>
            <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
          </div>
        </div>

        <div className="overflow-y-auto scroll-thin p-5 space-y-5">
          {job.fit_note && (
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider mb-2 font-semibold">Why it fits</div>
              <div className="t-ink text-[14px] leading-relaxed">{job.fit_note}</div>
            </div>
          )}

          {bullets.length > 0 && (
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider mb-2 font-semibold">Match points</div>
              <ul className="space-y-1.5">
                {bullets.map((b, i) => (
                  <li key={i} className="t-ink text-[13px] flex items-start gap-2">
                    <span className="t-forest mt-1">▸</span><span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {job.description && (
            <div>
              <div className="t-dim num text-[12px] uppercase tracking-wider mb-2 font-semibold">Description</div>
              <p className="t-ink text-[13px] leading-relaxed">{job.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <a href={job.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
              <div>
                <div className="t-dim num text-[9px] uppercase tracking-wider font-semibold">Posting</div>
                <div className="t-ink text-[12px]">{job.source}</div>
              </div>
              <ExternalLink size={14} className="t-muted" />
            </a>
            {job.company_linkedin && (
              <a href={job.company_linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
                <div>
                  <div className="t-dim num text-[9px] uppercase tracking-wider font-semibold">Company</div>
                  <div className="t-ink text-[12px]">LinkedIn</div>
                </div>
                <Linkedin size={14} className="t-muted" />
              </a>
            )}
            {job.company_site && (
              <a href={job.company_site} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
                <div>
                  <div className="t-dim num text-[9px] uppercase tracking-wider font-semibold">Company</div>
                  <div className="t-ink text-[12px]">Website</div>
                </div>
                <Globe size={14} className="t-muted" />
              </a>
            )}
            {job.hm_linkedin && (
              <a href={job.hm_linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-amber-soft rounded-md bg-amber-soft transition-colors">
                <div>
                  <div className="t-amber num text-[9px] uppercase tracking-wider font-semibold">Hiring Mgr</div>
                  <div className="t-ink text-[12px]">LinkedIn</div>
                </div>
                <UserCheck size={14} className="t-amber" />
              </a>
            )}
          </div>
        </div>

        <div className="p-4 border-t b-line flex items-center justify-between gap-2 bg-paper">
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onTrash(job.id); onClose(); }}
              className="btn-ghost btn-ghost-brick px-3 py-1.5 rounded text-[12px] num flex items-center gap-1.5"
            >
              <Trash2 size={12} /> Trash
            </button>
            {job.column_name !== 'interested' && job.column_name !== 'applied' && (
              <button
                onClick={() => { onMove(job.id, 'interested'); onClose(); }}
                className="btn-ghost btn-ghost-sage px-3 py-1.5 rounded text-[12px] num flex items-center gap-1.5"
              >
                <Heart size={12} /> Interested
              </button>
            )}
          </div>
          <button
            onClick={() => onDraftEmail(job)}
            className="btn-primary px-4 py-2 rounded-md text-[13px] font-medium flex items-center gap-2"
          >
            <Mail size={13} /> Draft Email
          </button>
        </div>
      </div>
    </div>
  );
}
