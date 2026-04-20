export function daysAgo(dateStr: string | undefined | null): number {
  if (!dateStr) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24)));
}

export function formatRelative(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function scoreTone(score: number) {
  if (score >= 85) return { text: 't-forest', bg: 'bg-forest-soft', border: 'b-olive-soft' };
  if (score >= 70) return { text: 't-ink',   bg: 'bg-soft',        border: 'b-line' };
  return                 { text: 't-dim',    bg: 'bg-soft',        border: 'b-line' };
}
