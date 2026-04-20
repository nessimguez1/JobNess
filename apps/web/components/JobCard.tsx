'use client';

import { Heart, Mail, Trash2, RotateCcw, Send, X, Linkedin, ExternalLink, Globe, Briefcase, MapPin, Check } from 'lucide-react';
import type { Job } from '@jobness/shared';
import { scoreTone, formatRelative, daysAgo } from './utils';

function SourceIcon({ source, size = 10 }: { source: string; size?: number }) {
  if (source === 'LinkedIn') return <Linkedin size={size} />;
  if (source === 'CareerPage') return <Globe size={size} />;
  if (source === 'Drushim') return <Briefcase size={size} />;
  return <Globe size={size} />;
}

interface Props {
  job: Job;
  onMove: (id: string, col: Job['column_name']) => void;
  onOpen: (job: Job) => void;
  onTrash: (id: string) => void;
  onDraftEmail: (job: Job) => void;
}

export default function JobCard({ job, onMove, onOpen, onTrash, onDraftEmail }: Props) {
  const isApplied = job.column_name === 'applied';
  const isArchived = job.column_name === 'archive';
  const tone = scoreTone(job.score);
  const postedDays = daysAgo(job.posted_at);
  const appliedDays = daysAgo(job.applied_at);

  return (
    <div
      className="bg-card border b-line rounded-lg p-3 card-hover fade-in cursor-pointer"
      onClick={() => onOpen(job)}
    >
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md bg-soft border b-line flex items-center justify-center shrink-0">
            <span className="text-[10px] t-ink font-semibold num">{job.mono ?? job.company.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="t-ink text-[13px] font-medium truncate">{job.company}</div>
            <div className="t-dim text-[10px] num flex items-center gap-1">
              <SourceIcon source={job.source} size={10} />
              <span>{job.source}</span>
              {postedDays !== undefined && <><span>·</span><span>{formatRelative(postedDays)}</span></>}
            </div>
          </div>
        </div>
        <div className={`px-1.5 py-0.5 rounded-md border text-[11px] num font-semibold shrink-0 ${tone.bg} ${tone.border}`}>
          <span className={tone.text}>{job.score}</span>
        </div>
      </div>

      <div className="text-[14px] leading-snug t-ink font-medium mb-1.5">{job.title}</div>

      {job.location && (
        <div className="flex items-center gap-1.5 text-[11px] t-muted mb-1.5 num">
          <MapPin size={10} /><span className="truncate">{job.location}</span>
        </div>
      )}

      {job.salary_text && (
        <div className="text-[11px] t-amber num mb-2.5 font-semibold">{job.salary_text}</div>
      )}

      {!isArchived && job.fit_note && (
        <div className="text-[12px] t-muted leading-snug mb-3 bg-soft rounded-md p-2 border b-line">{job.fit_note}</div>
      )}

      {isApplied && job.applied_at && (
        <div className="text-[11px] t-forest num mb-2 flex items-center gap-1">
          <Check size={10} /> applied {formatRelative(appliedDays)}
        </div>
      )}

      <div
        className="flex items-center justify-between gap-1 pt-2 border-t b-line"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-0.5">
          {job.column_name === 'inbox' && (
            <>
              <button onClick={() => onMove(job.id, 'interested')} className="btn-ghost btn-ghost-sage p-1.5 rounded" title="Interested"><Heart size={13} /></button>
              <button onClick={() => onDraftEmail(job)} className="btn-ghost p-1.5 rounded" title="Draft email"><Mail size={13} /></button>
              <button onClick={() => onTrash(job.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Trash"><Trash2 size={13} /></button>
            </>
          )}
          {job.column_name === 'interested' && (
            <>
              <button onClick={() => onDraftEmail(job)} className="btn-ghost btn-ghost-steel p-1.5 rounded" title="Draft email"><Send size={13} /></button>
              <button onClick={() => onMove(job.id, 'inbox')} className="btn-ghost p-1.5 rounded" title="Back"><RotateCcw size={13} /></button>
              <button onClick={() => onTrash(job.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Trash"><Trash2 size={13} /></button>
            </>
          )}
          {job.column_name === 'applied' && (
            <>
              <button onClick={() => onMove(job.id, 'interested')} className="btn-ghost p-1.5 rounded" title="Back to interested"><RotateCcw size={13} /></button>
              <button onClick={() => onTrash(job.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Rejected"><X size={13} /></button>
            </>
          )}
          {job.column_name === 'archive' && (
            <button onClick={() => onMove(job.id, 'inbox')} className="btn-ghost p-1.5 rounded" title="Restore"><RotateCcw size={13} /></button>
          )}
        </div>
        <div className="flex items-center gap-1">
          {job.company_linkedin && (
            <a href={job.company_linkedin} target="_blank" rel="noreferrer" className="btn-ghost p-1 rounded" onClick={e => e.stopPropagation()}><Linkedin size={12} /></a>
          )}
          {job.company_site && (
            <a href={job.company_site} target="_blank" rel="noreferrer" className="btn-ghost p-1 rounded" onClick={e => e.stopPropagation()}><ExternalLink size={12} /></a>
          )}
        </div>
      </div>
    </div>
  );
}
