'use client';

import { Heart, Mail, Trash2, RotateCcw, Send, X, Linkedin, ExternalLink, Globe, Briefcase, MapPin, Check } from 'lucide-react';
import type { Job } from '@jobness/shared';
import { scoreTone, formatRelative, daysAgo } from './utils';

const AVATAR_COLORS = ['#e6ece0', '#e4ebf2', '#f2e9cc', '#f2e4e0', '#ede8f2', '#e4ede0'];
function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length]!;
}

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
      className="bg-card border b-line rounded-lg p-4 hover:shadow-md hover:-translate-y-[1px] transition-all duration-150 fade-in cursor-pointer"
      onClick={() => onOpen(job)}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-md flex items-center justify-center shrink-0" style={{ backgroundColor: avatarColor(job.company) }}>
            <span className="text-[13px] t-ink font-bold num">{job.mono ?? job.company.slice(0, 2).toUpperCase()}</span>
          </div>
          <div className="min-w-0">
            <div className="t-muted text-[12px] font-medium truncate">{job.company}</div>
            <div className="t-dim text-[12px] num flex items-center gap-1">
              <SourceIcon source={job.source} size={10} />
              <span>{job.source}</span>
              {postedDays !== undefined && <><span>·</span><span>{formatRelative(postedDays)}</span></>}
            </div>
          </div>
        </div>
        <div className={`px-2.5 py-1 rounded-md border text-[13px] num font-bold shrink-0 ${tone.bg} ${tone.border}`}>
          <span className={tone.text}>{job.score}</span>
        </div>
      </div>

      <div className="text-[15px] leading-snug t-ink font-semibold mb-3">{job.title}</div>

      {job.location && (
        <div className="flex items-center gap-1.5 text-[12px] t-muted mb-1.5 num">
          <MapPin size={10} /><span className="truncate">{job.location}</span>
        </div>
      )}

      {job.salary_text && (
        <div className="text-[12px] t-amber num mb-2.5 font-semibold">{job.salary_text}</div>
      )}

      {!isArchived && job.fit_note && (
        <div className="text-[12px] t-muted leading-snug mb-3 border-l-2 border-[#3a5a7a] pl-3">{job.fit_note}</div>
      )}

      {isApplied && job.applied_at && (
        <div className="text-[12px] t-forest num mb-2 flex items-center gap-1">
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
