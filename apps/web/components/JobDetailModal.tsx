'use client';

import { X, Heart, Trash2, Mail, ExternalLink, Linkedin, Globe, UserCheck } from 'lucide-react';
import type { Job } from '@jobness/shared';
import { scoreTone } from './utils';
import Modal from './Modal';

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
  const titleId = `job-detail-title-${job.id}`;

  return (
    <Modal onClose={onClose} labelledBy={titleId} panelClassName="max-w-2xl max-h-[85vh]">
      <div className="p-5 border-b b-line flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-11 h-11 rounded-md bg-soft border b-line flex items-center justify-center shrink-0" aria-hidden="true">
            <span className="text-[13px] t-ink font-semibold num">{job.mono ?? job.company.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="t-muted text-[12px] num mb-0.5">{job.company}</div>
            <h2 id={titleId} className="t-ink text-[22px] leading-tight font-semibold">{job.title}</h2>
            <div className="t-muted text-[12px] num mt-1">
              {[job.location, job.salary_text].filter(Boolean).join(' · ')}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`px-2.5 py-1 rounded-md border num font-semibold ${tone.bg} ${tone.border}`}
            aria-label={`Match score ${job.score} out of 100`}
          >
            <span className={`text-[14px] ${tone.text}`}>{job.score}</span>
            <span className="t-dim text-[12px]" aria-hidden="true">/100</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"
          ><X size={16} aria-hidden="true" /></button>
        </div>
      </div>

      <div className="overflow-y-auto scroll-thin p-5 space-y-5">
        {job.fit_note && (
          <section>
            <h3 className="t-muted num text-[11px] uppercase tracking-wider mb-2 font-semibold">Why it fits</h3>
            <div className="t-ink text-[14px] leading-relaxed">{job.fit_note}</div>
          </section>
        )}

        {bullets.length > 0 && (
          <section>
            <h3 className="t-muted num text-[11px] uppercase tracking-wider mb-2 font-semibold">Match points</h3>
            <ul className="space-y-1.5">
              {bullets.map((b, i) => (
                <li key={`${b}-${i}`} className="t-ink text-[13px] flex items-start gap-2">
                  <span className="t-forest mt-1" aria-hidden="true">▸</span><span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {job.description && (
          <section>
            <h3 className="t-muted num text-[11px] uppercase tracking-wider mb-2 font-semibold">Description</h3>
            <p className="t-ink text-[13px] leading-relaxed">{job.description}</p>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href={job.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
            <div>
              <div className="t-muted num text-[11px] uppercase tracking-wider font-semibold">Posting</div>
              <div className="t-ink text-[13px]">{job.source}</div>
            </div>
            <ExternalLink size={14} className="t-muted" aria-hidden="true" />
          </a>
          {job.company_linkedin && (
            <a href={job.company_linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
              <div>
                <div className="t-muted num text-[11px] uppercase tracking-wider font-semibold">Company</div>
                <div className="t-ink text-[13px]">LinkedIn</div>
              </div>
              <Linkedin size={14} className="t-muted" aria-hidden="true" />
            </a>
          )}
          {job.company_site && (
            <a href={job.company_site} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-line rounded-md bg-soft hover:border-b-line-strong transition-colors">
              <div>
                <div className="t-muted num text-[11px] uppercase tracking-wider font-semibold">Company</div>
                <div className="t-ink text-[13px]">Website</div>
              </div>
              <Globe size={14} className="t-muted" aria-hidden="true" />
            </a>
          )}
          {job.hm_linkedin && (
            <a href={job.hm_linkedin} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 border b-olive-soft rounded-md bg-forest-soft transition-colors">
              <div>
                <div className="t-forest num text-[11px] uppercase tracking-wider font-semibold">Hiring Mgr</div>
                <div className="t-ink text-[13px]">LinkedIn</div>
              </div>
              <UserCheck size={14} className="t-forest" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="p-4 border-t b-line flex flex-wrap items-center justify-between gap-2 bg-paper">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { onTrash(job.id); onClose(); }}
            className="btn-ghost btn-ghost-brick min-h-9 px-3 rounded text-[13px] num inline-flex items-center gap-1.5"
          >
            <Trash2 size={13} aria-hidden="true" /> Trash
          </button>
          {job.column_name !== 'interested' && job.column_name !== 'applied' && (
            <button
              type="button"
              onClick={() => { onMove(job.id, 'interested'); onClose(); }}
              className="btn-ghost btn-ghost-sage min-h-9 px-3 rounded text-[13px] num inline-flex items-center gap-1.5"
            >
              <Heart size={13} aria-hidden="true" /> Interested
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDraftEmail(job)}
          className="btn-primary min-h-10 px-4 rounded-md text-[13px] font-medium inline-flex items-center gap-2"
        >
          <Mail size={13} aria-hidden="true" /> Draft Email
        </button>
      </div>
    </Modal>
  );
}
