'use client';

import { useState, useEffect } from 'react';
import { Target, Globe, Linkedin, Plus, X, Star, Edit3, AlertCircle, Copy, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Target as TargetRow } from '@jobness/shared';

function genMono(name: string): string {
  return name.trim().split(/\s+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase();
}

function genEmail(target: TargetRow) {
  return {
    subject: `Speculative note — ${target.name}`,
    body: `Dear ${target.name} Team,

I'm writing on a speculative basis. I follow ${target.name} closely and the trajectory of the firm fits tightly with where I'd like to build the next chapter of my career.

Brief context: I'm currently a Relationship Manager at UBP (Tel Aviv) covering HNWI clients across Israel and France. Before UBP, the Israeli tech ecosystem at IATI and wealth at Tafnit Discount. Native trilingual (FR / EN / HE), ten years lived in the United States, with a live referral network across Tel Aviv and Paris.

If there is any appetite for a conversation — now or in the coming months — I would be delighted to share my CV and discuss how I could contribute.

Best regards,
Nessim Guez
nissimguez2@gmail.com | +972 54 649 5846
linkedin.com/in/nessim-guez`,
  };
}

function TargetEmailModal({ target, onClose }: { target: TargetRow; onClose: () => void }) {
  const email = genEmail(target);
  const [subject, setSubject] = useState(email.subject);
  const [body, setBody] = useState(email.body);
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 modal-bg" style={{ backgroundColor: 'rgba(26, 24, 21, 0.4)' }} onClick={onClose}>
      <div className="bg-card border b-line rounded-xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col modal-panel shadow-modal" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b b-line flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-soft border b-line flex items-center justify-center">
              <Target size={14} className="t-ink" />
            </div>
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider font-semibold">Speculative outreach</div>
              <div className="t-ink text-[14px] font-medium">{target.name}</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost p-1.5 rounded"><X size={16} /></button>
        </div>

        <div className="p-4 space-y-3 overflow-y-auto scroll-thin">
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Subject</div>
            <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px]" />
          </div>
          <div>
            <div className="t-dim num text-[10px] uppercase tracking-wider mb-1.5 font-semibold">Body</div>
            <textarea value={body} onChange={e => setBody(e.target.value)} rows={14} className="w-full bg-paper border b-line rounded-md px-3 py-2 text-[13px] leading-relaxed resize-none" />
          </div>
          <div className="flex items-start gap-2 p-2.5 bg-steel-soft border b-steel-soft rounded-md text-[11px] t-steel">
            <AlertCircle size={13} className="mt-0.5 shrink-0" />
            <div>Attach <span className="num font-semibold">CV_Nessim_Guez.pdf</span> in Gmail. Destination: check {target.name}&apos;s website or LinkedIn.</div>
          </div>
        </div>

        <div className="p-3 border-t b-line flex items-center justify-end gap-2 bg-paper">
          <button onClick={copy} className="btn-primary px-4 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5">
            {copied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy to clipboard</>}
          </button>
        </div>
      </div>
    </div>
  );
}

function TargetCard({ target, onDraft, onRemove }: {
  target: TargetRow;
  onDraft: (t: TargetRow) => void;
  onRemove: (id: string) => void;
}) {
  const isHigh = target.priority === 'high';
  return (
    <div className="bg-card border b-line rounded-lg p-4 card-hover fade-in">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-md bg-soft border b-line flex items-center justify-center shrink-0">
            <span className="text-[12px] t-ink font-semibold num">{target.mono ?? genMono(target.name)}</span>
          </div>
          <div className="min-w-0">
            <div className="t-ink text-[16px] leading-tight font-semibold">{target.name}</div>
            <div className="t-muted text-[11px] num flex items-center gap-1.5 mt-0.5">
              {target.type && <span>{target.type}</span>}
              {target.type && target.location && <span>·</span>}
              {target.location && <span>{target.location}</span>}
            </div>
          </div>
        </div>
        <div className={`${isHigh ? 'bg-amber-soft t-amber' : 'bg-soft t-muted'} text-[10px] num uppercase tracking-wider flex items-center gap-1 px-2 py-1 rounded font-semibold`}>
          <Star size={10} fill="currentColor" /> {target.priority}
        </div>
      </div>

      {target.notes && (
        <div className="t-ink text-[12px] leading-relaxed mb-3 bg-soft rounded-md p-2.5 border b-line">{target.notes}</div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2 border-t b-line">
        <div className="flex items-center gap-1">
          {target.website && <a href={target.website} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded" title="Website"><Globe size={12} /></a>}
          {target.linkedin && <a href={target.linkedin} target="_blank" rel="noreferrer" className="btn-ghost p-1.5 rounded" title="LinkedIn"><Linkedin size={12} /></a>}
          <button onClick={() => onRemove(target.id)} className="btn-ghost btn-ghost-brick p-1.5 rounded" title="Remove"><X size={12} /></button>
        </div>
        <button onClick={() => onDraft(target)} className="btn-primary px-3 py-1.5 rounded-md text-[11px] num font-medium flex items-center gap-1.5">
          <Edit3 size={11} /> Draft email
        </button>
      </div>
    </div>
  );
}

export default function Targets() {
  const [targets, setTargets] = useState<TargetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [emailTarget, setEmailTarget] = useState<TargetRow | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    supabase.from('targets').select('*').order('created_at', { ascending: false })
      .then(({ data }) => {
        if (data) setTargets(data as TargetRow[]);
        setLoading(false);
      });
  }, []);

  async function addTarget() {
    const name = newName.trim();
    if (!name) return;
    const dbRow = { id: `t_${Date.now()}`, name, mono: genMono(name), priority: 'med' };
    const uiRow: TargetRow = { ...dbRow, priority: 'med', created_at: new Date().toISOString() };
    const { error } = await supabase.from('targets').insert(dbRow);
    if (!error) {
      setTargets(prev => [uiRow, ...prev]);
      setNewName('');
      setShowAdd(false);
    }
  }

  async function removeTarget(id: string) {
    setTargets(prev => prev.filter(t => t.id !== id));
    await supabase.from('targets').delete().eq('id', id);
  }

  const high = targets.filter(t => t.priority === 'high');
  const rest = targets.filter(t => t.priority !== 'high');

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="t-ink text-[24px] font-semibold leading-tight">Target Companies</h2>
          <div className="t-muted text-[12px] num mt-1">
            {targets.length} {targets.length === 1 ? 'company' : 'companies'} · speculative outreach list
          </div>
        </div>
        {showAdd ? (
          <div className="flex items-center gap-2">
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Company name..."
              className="bg-card border b-line rounded-md px-3 py-1.5 text-[12px] w-56"
              onKeyDown={e => e.key === 'Enter' && addTarget()} autoFocus />
            <button onClick={addTarget} className="btn-primary px-3 py-1.5 rounded-md text-[12px] font-medium">Add</button>
            <button onClick={() => { setShowAdd(false); setNewName(''); }} className="btn-ghost p-1.5 rounded"><X size={13} /></button>
          </div>
        ) : (
          <button onClick={() => setShowAdd(true)} className="btn-primary px-3 py-1.5 rounded-md text-[12px] font-medium flex items-center gap-1.5">
            <Plus size={13} /> Add company
          </button>
        )}
      </div>

      {loading ? (
        <div className="t-dim text-[12px] num italic pt-10 text-center">Loading…</div>
      ) : targets.length === 0 ? (
        <div className="t-dim text-[12px] num italic pt-10 text-center">No targets yet — add companies you want to reach out to speculatively.</div>
      ) : (
        <div className="space-y-6">
          {high.length > 0 && (
            <div>
              <div className="t-dim num text-[10px] uppercase tracking-wider mb-3 font-semibold">High priority</div>
              <div className="grid grid-cols-2 gap-3">
                {high.map(t => <TargetCard key={t.id} target={t} onDraft={setEmailTarget} onRemove={removeTarget} />)}
              </div>
            </div>
          )}
          {rest.length > 0 && (
            <div>
              {high.length > 0 && <div className="t-dim num text-[10px] uppercase tracking-wider mb-3 font-semibold">Other</div>}
              <div className="grid grid-cols-2 gap-3">
                {rest.map(t => <TargetCard key={t.id} target={t} onDraft={setEmailTarget} onRemove={removeTarget} />)}
              </div>
            </div>
          )}
        </div>
      )}

      {emailTarget && <TargetEmailModal target={emailTarget} onClose={() => setEmailTarget(null)} />}
    </>
  );
}
