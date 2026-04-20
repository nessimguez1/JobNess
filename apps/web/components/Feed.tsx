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
  jobs,
  onMove,
  onOpen,
  onTrash,
  onDraftEmail,
}: {
  title: string;
  icon: React.ReactNode;
  jobs: Job[];
  onMove: (id: string, col: Job['column_name']) => void;
  onOpen: (job: Job) => void;
  onTrash: (id: string) => void;
  onDraftEmail: (job: Job) => void;
}) {
  return (
    <div className="flex flex-col bg-soft border b-line rounded-lg min-w-[310px] w-[310px]">
      <div className="flex items-center justify-between px-3 py-2.5 border-b b-line">
        <div className="flex items-center gap-2">
          <span className="t-muted">{icon}</span>
          <span className="t-ink text-[13px] font-semibold">{title}</span>
        </div>
        <span className="t-dim num text-[11px] bg-card px-1.5 rounded border b-line">{jobs.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto scroll-thin p-2 space-y-2" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {jobs.length === 0 ? (
          <div className="text-center py-12 t-dim text-[11px] num italic">empty</div>
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
      <div className="flex items-center justify-center h-64 t-dim text-[12px] num">loading jobs…</div>
    );
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto scroll-thin pb-2">
        <Column title="Inbox"     icon={<Inbox   size={13} />} jobs={byCol('inbox')}     onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
        <Column title="Interested" icon={<Heart   size={13} />} jobs={byCol('interested')} onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
        <Column title="Applied"   icon={<Send    size={13} />} jobs={byCol('applied')}   onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
        <Column title="Archive"   icon={<Archive size={13} />} jobs={byCol('archive')}   onMove={moveJob} onOpen={setSelectedJob} onTrash={trashJob} onDraftEmail={setEmailJob} />
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
