'use client';

import { useState, useEffect, useCallback } from 'react';
import { Inbox, Heart, Send, Archive } from 'lucide-react';
import type { Job, OutreachLog } from '@jobness/shared';
import { supabase } from '../lib/supabase';
import JobCard from './JobCard';
import JobDetailModal from './JobDetailModal';
import EmailModal from './EmailModal';

function Column({
  title,
  icon,
  emptyIcon,
  jobs,
  emptyMessage,
  accentColor,
  onMove,
  onOpen,
  onTrash,
  onDraftEmail,
}: {
  title: string;
  icon: React.ReactNode;
  emptyIcon: React.ReactNode;
  jobs: Job[];
  emptyMessage: string;
  accentColor: string;
  onMove: (id: string, col: Job['column_name']) => void;
  onOpen: (job: Job) => void;
  onTrash: (id: string) => void;
  onDraftEmail: (job: Job) => void;
}) {
  return (
    <div className="flex flex-col bg-soft border b-line rounded-lg w-full" style={{ borderTopColor: accentColor, borderTopWidth: '3px' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b b-line">
        <div className="flex items-center gap-2">
          <span className="t-muted">{icon}</span>
          <span className="t-ink text-[13px] font-semibold">{title}</span>
        </div>
        <span className="t-dim num text-[12px] bg-card px-2 py-0.5 rounded border b-line font-semibold">{jobs.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {jobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full min-h-[200px] gap-3">
            <span className="t-dim">{emptyIcon}</span>
            <p className="text-[13px] t-dim text-center max-w-[160px] leading-relaxed">{emptyMessage}</p>
          </div>
        ) : (
          jobs.map(j => (
            <JobCard key={j.id} job={j} onMove={onMove} onOpen={onOpen} onTrash={onTrash} onDraftEmail={onDraftEmail} />
          ))
        )}
      </div>
    </div>
  );
}

export default function Feed() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [emailJob, setEmailJob] = useState<Job | null>(null);

  useEffect(() => {
    supabase
      .from('jobs')
      .select('*')
      .order('score', { ascending: false })
      .then(({ data }) => {
        setJobs((data as Job[]) ?? []);
        setLoading(false);
      });
  }, []);

  const moveJob = useCallback(async (id: string, col: Job['column_name']) => {
    const statusMap: Record<Job['column_name'], Job['status']> = {
      inbox: 'new',
      interested: 'interested',
      applied: 'applied',
      archive: 'rejected',
    };
    const update: Partial<Job> = { column_name: col, status: statusMap[col] };
    if (col === 'applied') update.applied_at = new Date().toISOString();
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...update } : j));
    await supabase.from('jobs').update(update).eq('id', id);
  }, []);

  const trashJob = useCallback(async (id: string) => {
    const update = { column_name: 'archive' as const, status: 'rejected' as const, trashed_at: new Date().toISOString() };
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...update } : j));
    await supabase.from('jobs').update(update).eq('id', id);
  }, []);

  const markApplied = useCallback(async (id: string, log?: OutreachLog) => {
    const update: Partial<Job> = {
      column_name: 'applied',
      status: 'applied',
      applied_at: log?.outreach_date
        ? new Date(log.outreach_date).toISOString()
        : new Date().toISOString(),
      ...log,
    };
    setJobs(prev => prev.map(j => j.id === id ? { ...j, ...update } : j));
    await supabase.from('jobs').update(update).eq('id', id);
  }, [setJobs]);

  const byCol = (col: Job['column_name']) => jobs.filter(j => j.column_name === col);

  if (loading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {['Inbox', 'Interested', 'Applied', 'Archive'].map(col => (
          <div key={col} className="flex flex-col bg-soft border b-line rounded-lg w-full">
            <div className="flex items-center justify-between px-3 py-2.5 border-b b-line">
              <div className="h-4 w-20 bg-card rounded animate-pulse" />
              <div className="h-4 w-6 bg-card rounded animate-pulse" />
            </div>
            <div className="p-2 space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card border b-line rounded-lg p-3 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-md bg-soft animate-pulse shrink-0" />
                    <div className="space-y-1.5 flex-1">
                      <div className="h-3 bg-soft rounded animate-pulse w-3/4" />
                      <div className="h-2.5 bg-soft rounded animate-pulse w-1/2" />
                    </div>
                    <div className="h-5 w-8 bg-soft rounded animate-pulse" />
                  </div>
                  <div className="h-3.5 bg-soft rounded animate-pulse w-full" />
                  <div className="h-3 bg-soft rounded animate-pulse w-5/6" />
                  <div className="h-8 bg-soft rounded animate-pulse w-full" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-4 gap-4">
        <Column title="Inbox"      icon={<Inbox   size={13} />} emptyIcon={<Inbox   size={20} />} accentColor="#9c9585" jobs={byCol('inbox')}      emptyMessage="No new matches yet. Scraper runs twice daily." onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
        <Column title="Interested" icon={<Heart   size={13} />} emptyIcon={<Heart   size={20} />} accentColor="#3f5c2e" jobs={byCol('interested')} emptyMessage="Heart a job from Inbox to track it here."        onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
        <Column title="Applied"    icon={<Send    size={13} />} emptyIcon={<Send    size={20} />} accentColor="#3a5a7a" jobs={byCol('applied')}    emptyMessage="Mark a job Applied after you send your email."   onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
        <Column title="Archive"    icon={<Archive size={13} />} emptyIcon={<Archive size={20} />} accentColor="#9c9585" jobs={byCol('archive')}    emptyMessage="Passed or rejected jobs land here."               onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
      </div>

      {selectedJob && !emailJob && (
        <JobDetailModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onDraftEmail={j => { setEmailJob(j); setSelectedJob(null); }}
          onMove={moveJob}
          onTrash={trashJob}
        />
      )}
      {emailJob && (
        <EmailModal
          job={emailJob}
          onClose={() => setEmailJob(null)}
          onMarkApplied={markApplied}
        />
      )}
    </>
  );
}
