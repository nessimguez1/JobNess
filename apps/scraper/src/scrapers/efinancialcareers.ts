import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';

// eFinancialCareers scraper stub. Phase 2 will implement.
//
// When you build it, query Israel ONLY:
//   https://www.efinancialcareers.com/jobs-Israel/Relationship_Manager
//   https://www.efinancialcareers.com/jobs-Israel/Private_Banker
//   https://www.efinancialcareers.com/jobs-Israel/Wealth_Manager
//   https://www.efinancialcareers.com/jobs-Israel/Family_Office
//
// Plus the global "remote" channel for Israel-friendly remote roles.
// Do NOT add Switzerland, UK, or Singapore queries — that geo is excluded.
//
// Implementation: plain fetch + node-html-parser. Throttle 1.5s between
// requests. No auth needed initially. Cards are .result-card with
// .result-title (anchor → URL), .result-employer, .result-location.

export async function run(): Promise<ScrapedJob[]> {
  logger.info('eFinancialCareers scraper not yet implemented (Phase 2)');
  return [];
}
