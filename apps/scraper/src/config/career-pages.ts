export interface CareerPageTarget {
  company: string;
  slug: string;
  ats: 'greenhouse' | 'lever' | 'workday' | 'custom';
  website?: string;
}

// Phase 2: Melio only. Expand in Phase 5 with full list from BUILD_SPEC.md.
export const CAREER_PAGES: CareerPageTarget[] = [
  { company: 'Melio', slug: 'melio', ats: 'greenhouse', website: 'https://meliopayments.com' },
];
