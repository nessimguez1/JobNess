import { supabase } from './supabase';
import type { OutreachMethod, OutreachType } from '@jobness/shared';

export interface LogOutreachInput {
  companyId?: string;
  jobId?: string;
  type: OutreachType;
  sentTo?: string;
  method: OutreachMethod;
  subject?: string;
  body?: string;
  sentAt: string;        // ISO date (YYYY-MM-DD)
  followUpAt?: string;   // ISO date
  notes?: string;
}

/** Most recent sent_to used for this company, if any. Used to prefill the draft modal. */
export async function lastSentToForCompany(company: string): Promise<string | null> {
  if (!company) return null;
  const { data: jobs } = await supabase
    .from('jobs')
    .select('id')
    .eq('company', company);
  const jobIds = (jobs ?? []).map(j => (j as { id: string }).id);
  if (jobIds.length === 0) return null;
  const { data } = await supabase
    .from('outreach')
    .select('sent_to, sent_at')
    .in('job_id', jobIds)
    .not('sent_to', 'is', null)
    .order('sent_at', { ascending: false })
    .limit(1);
  const row = (data ?? [])[0] as { sent_to?: string } | undefined;
  return row?.sent_to ?? null;
}

export async function logOutreach(input: LogOutreachInput): Promise<{ error?: string }> {
  if (!input.companyId && !input.jobId) {
    return { error: 'companyId or jobId required' };
  }
  const row = {
    company_id:   input.companyId ?? null,
    job_id:       input.jobId ?? null,
    type:         input.type,
    sent_to:      input.sentTo ?? null,
    method:       input.method,
    subject:      input.subject ?? null,
    body:         input.body ?? null,
    sent_at:      input.sentAt,
    follow_up_at: input.followUpAt ?? null,
    notes:        input.notes ?? null,
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase.from('outreach') as any).insert(row);
  if (error) return { error: error.message };
  return {};
}
