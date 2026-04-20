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
