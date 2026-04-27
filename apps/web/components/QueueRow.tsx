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

const ACTION_BTN = 'inline-flex items-center justify-center h-8 w-8 rounded transition-colors';

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

  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

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
      className={`group relative bg-card border rounded-md px-4 py-2.5 transition-colors cursor-pointer row-stagger ${isFocused ? 'b-ink shadow-md' : 'b-line-strong hover:b-ink'}`}
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
            <span className="t-muted text-[10px] num uppercase tracking-[0.08em] font-bold">{status.label}</span>
            {isDueToday && (
              <span className="inline-flex items-center gap-1 t-brick text-[10px] num uppercase tracking-[0.08em] font-bold">
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
            {job.company_linkedin && (
              <a
                href={job.company_linkedin}
                target="_blank"
                rel="noreferrer"
                aria-label={`${job.company} on LinkedIn`}
                onClick={stop}
                className="inline-flex items-center t-muted hover:t-ink"
              >
                <Linkedin size={12} aria-hidden="true" />
              </a>
            )}
            {job.company_site && (
              <a
                href={job.company_site}
                target="_blank"
                rel="noreferrer"
                aria-label={`${job.company} website`}
                onClick={stop}
                className="inline-flex items-center t-muted hover:t-ink"
              >
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            )}
          </div>

          {job.fit_note && (
            <div className="mt-1.5">
              <button
                type="button"
                onClick={e => { stop(e); setShowFit(v => !v); }}
                className="min-h-8 -mx-1 px-1 inline-flex items-center t-muted text-[12px] num underline decoration-dotted underline-offset-2 hover:t-ink"
                aria-expanded={showFit}
              >
                {showFit ? 'hide fit' : 'why it fits'}
              </button>
              {showFit && (
                <div
                  className="text-[13px] t-muted leading-snug mt-1 pl-3 border-l border-line fade-in"
                  onClick={stop}
                >
                  {job.fit_note}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 shrink-0" onClick={stop} onKeyDown={stop}>
          <div
            className={`px-2 py-0.5 rounded-sm border text-[13px] num font-bold ${tone.bg} ${tone.border}`}
            aria-label={`Match score ${job.score} out of 100`}
          >
            <span className={tone.text}>{job.score}</span>
          </div>

          <div className="flex items-center gap-0.5 -mr-1.5">
            {job.column_name === 'inbox' && (
              <>
                <button type="button" onClick={() => onMove(job.id, 'interested')} aria-label="Mark interested (i)" className={`${ACTION_BTN} btn-ghost btn-ghost-sage`}><Heart size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onDraftEmail(job)}           aria-label="Draft email (e)"    className={`${ACTION_BTN} btn-ghost`}><Mail size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onMove(job.id, 'applied')}   aria-label="Mark applied (a)"   className={`${ACTION_BTN} btn-ghost btn-ghost-steel`}><Check size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onTrash(job.id)}             aria-label="Archive (x)"        className={`${ACTION_BTN} btn-ghost btn-ghost-brick`}><Trash2 size={14} aria-hidden="true" /></button>
              </>
            )}
            {job.column_name === 'interested' && (
              <>
                <button type="button" onClick={() => onDraftEmail(job)}            aria-label="Draft email (e)"   className={`${ACTION_BTN} btn-ghost btn-ghost-steel`}><Send size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onMove(job.id, 'applied')}    aria-label="Mark applied (a)"  className={`${ACTION_BTN} btn-ghost btn-ghost-steel`}><Check size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onMove(job.id, 'inbox')}      aria-label="Back to new"       className={`${ACTION_BTN} btn-ghost`}><RotateCcw size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onTrash(job.id)}              aria-label="Archive (x)"       className={`${ACTION_BTN} btn-ghost btn-ghost-brick`}><Trash2 size={14} aria-hidden="true" /></button>
              </>
            )}
            {job.column_name === 'applied' && (
              <>
                <button type="button" onClick={() => onMove(job.id, 'interested')} aria-label="Back to interested" className={`${ACTION_BTN} btn-ghost`}><RotateCcw size={14} aria-hidden="true" /></button>
                <button type="button" onClick={() => onTrash(job.id)} aria-label="Mark rejected"                    className={`${ACTION_BTN} btn-ghost btn-ghost-brick`}><X size={14} aria-hidden="true" /></button>
              </>
            )}
            {job.column_name === 'archive' && (
              <button type="button" onClick={() => onMove(job.id, 'inbox')} aria-label="Restore to new" className={`${ACTION_BTN} btn-ghost`}><RotateCcw size={14} aria-hidden="true" /></button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

export default memo(QueueRowImpl);
