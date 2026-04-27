'use client';

import { memo, useState } from 'react';
import { Heart, Mail, Trash2, RotateCcw, Send, X, Linkedin, ExternalLink, Check, Clock, MapPin } from 'lucide-react';
import type { Job } from '@jobness/shared';
import { formatRelative, daysAgo, scoreTone } from './utils';

const STATUS_META: Record<Job['column_name'], { label: string; dot: string; text: string }> = {
  inbox:      { label: 'new',        dot: 'var(--line-strong)', text: 't-muted' },
  interested: { label: 'interested', dot: 'var(--forest)',      text: 't-forest' },
  applied:    { label: 'applied',    dot: 'var(--steel)',       text: 't-steel' },
  archive:    { label: 'archive',    dot: 'var(--text-dim)',    text: 't-dim' },
};

interface Props {
  job: Job;
  index?: number;
  isFocused: boolean;
  isDueToday: boolean;
  onMove: (id: string, col: Job['column_name']) => void;
  onOpen: (job: Job) => void;
  onTrash: (id: string) => void;
  onDraftEmail: (job: Job) => void;
}

function QueueRowImpl({ job, index = 0, isFocused, isDueToday, onMove, onOpen, onTrash, onDraftEmail }: Props) {
  const [showFit, setShowFit] = useState(false);
  const status = STATUS_META[job.column_name];
  const tone = scoreTone(job.score);
  const postedDays = daysAgo(job.posted_at);
  const appliedDays = daysAgo(job.applied_at);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onOpen(job);
    }
  };

  return (
    <article
      data-queue-row
      data-job-id={job.id}
      tabIndex={0}
      role="button"
      aria-label={`${job.company}, ${job.title}, ${status.label}`}
      onClick={() => onOpen(job)}
      onKeyDown={handleKey}
      style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
      className={`group relative bg-card border rounded-lg px-4 py-3 transition-all cursor-pointer row-stagger ${isFocused ? 'b-ink shadow-md' : 'b-line hover:b-line-strong'}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1.5 h-1.5 rounded-full mt-2 shrink-0"
          style={{ backgroundColor: status.dot }}
          aria-hidden="true"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h3 className="text-[16px] font-semibold tracking-tight t-ink leading-tight truncate max-w-full">{job.company}</h3>
            <span className="t-muted text-[11px] num uppercase tracking-wider font-semibold">{status.label}</span>
            {isDueToday && (
              <span className="inline-flex items-center gap-1 t-brick text-[11px] num uppercase tracking-wider font-bold">
                <Clock size={10} aria-hidden="true" /> due today
              </span>
            )}
          </div>

          <div className="t-ink text-[14px] leading-snug mt-0.5">{job.title}</div>

          <div className="flex items-center gap-3 mt-1.5 text-[12px] t-muted num flex-wrap">
            {job.location && (
              <span className="inline-flex items-center gap-1">
                <MapPin size={11} aria-hidden="true" />{job.location}
              </span>
            )}
            {job.salary_text && <span className="t-ink font-semibold">{job.salary_text}</span>}
            {postedDays !== undefined && <span>{formatRelative(postedDays)}</span>}
            {job.column_name === 'applied' && job.applied_at && (
              <span className="inline-flex items-center gap-1 t-steel">
                <Check size={11} aria-hidden="true" />applied {formatRelative(appliedDays)}
              </span>
            )}
          </div>

          {job.fit_note && (
            <div className="mt-1.5">
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setShowFit(v => !v); }}
                className="min-h-9 -mx-1 px-1 inline-flex items-center t-muted text-[12px] num underline decoration-dotted underline-offset-2 hover:t-ink"
                aria-expanded={showFit}
              >
                {showFit ? 'hide fit' : 'why it fits'}
              </button>
              {showFit && (
                <div
                  className="text-[13px] t-muted leading-snug mt-1 pl-3 border-l border-line fade-in"
                  onClick={e => e.stopPropagation()}
                >
                  {job.fit_note}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-start gap-2 shrink-0">
          <div
            className={`px-2 py-0.5 rounded border text-[13px] num font-bold ${tone.bg} ${tone.border}`}
            aria-label={`Match score ${job.score} out of 100`}
          >
            <span className={tone.text}>{job.score}</span>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-end gap-0.5 mt-2 pt-2 border-t b-line opacity-60 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
        onClick={e => e.stopPropagation()}
        onKeyDown={e => e.stopPropagation()}
      >
        {job.company_linkedin && (
          <a href={job.company_linkedin} target="_blank" rel="noreferrer" aria-label={`${job.company} on LinkedIn`}
             className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded">
            <Linkedin size={13} aria-hidden="true" />
          </a>
        )}
        {job.company_site && (
          <a href={job.company_site} target="_blank" rel="noreferrer" aria-label={`${job.company} website`}
             className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded">
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        )}

        <span className="w-px h-5 bg-softer mx-1" aria-hidden="true" />

        {job.column_name === 'inbox' && (
          <>
            <button type="button" onClick={() => onMove(job.id, 'interested')} aria-label="Mark interested (i)" className="btn-ghost btn-ghost-sage h-9 w-9 inline-flex items-center justify-center rounded"><Heart size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onDraftEmail(job)}           aria-label="Draft email (e)"    className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"><Mail size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onMove(job.id, 'applied')}   aria-label="Mark applied (a)"   className="btn-ghost btn-ghost-steel h-9 w-9 inline-flex items-center justify-center rounded"><Check size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onTrash(job.id)}             aria-label="Archive (x)"        className="btn-ghost btn-ghost-brick h-9 w-9 inline-flex items-center justify-center rounded"><Trash2 size={14} aria-hidden="true" /></button>
          </>
        )}
        {job.column_name === 'interested' && (
          <>
            <button type="button" onClick={() => onDraftEmail(job)}            aria-label="Draft email (e)"   className="btn-ghost btn-ghost-steel h-9 w-9 inline-flex items-center justify-center rounded"><Send size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onMove(job.id, 'applied')}    aria-label="Mark applied (a)"  className="btn-ghost btn-ghost-steel h-9 w-9 inline-flex items-center justify-center rounded"><Check size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onMove(job.id, 'inbox')}      aria-label="Back to new"       className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"><RotateCcw size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onTrash(job.id)}              aria-label="Archive (x)"       className="btn-ghost btn-ghost-brick h-9 w-9 inline-flex items-center justify-center rounded"><Trash2 size={14} aria-hidden="true" /></button>
          </>
        )}
        {job.column_name === 'applied' && (
          <>
            <button type="button" onClick={() => onMove(job.id, 'interested')} aria-label="Back to interested" className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"><RotateCcw size={14} aria-hidden="true" /></button>
            <button type="button" onClick={() => onTrash(job.id)} aria-label="Mark rejected"                    className="btn-ghost btn-ghost-brick h-9 w-9 inline-flex items-center justify-center rounded"><X size={14} aria-hidden="true" /></button>
          </>
        )}
        {job.column_name === 'archive' && (
          <button type="button" onClick={() => onMove(job.id, 'inbox')} aria-label="Restore to new" className="btn-ghost h-9 w-9 inline-flex items-center justify-center rounded"><RotateCcw size={14} aria-hidden="true" /></button>
        )}
      </div>
    </article>
  );
}

export default memo(QueueRowImpl);
