import type { ScrapedJob } from '@jobness/shared';
import { logger } from '../utils/logger.js';

export async function run(): Promise<ScrapedJob[]> {
  if (!process.env['LINKEDIN_LI_AT_COOKIE']) {
    logger.info('LinkedIn posts skipped — no li_at cookie');
    return [];
  }
  // Phase 7: implement with Playwright when cookie is set
  logger.info('LinkedIn posts scraper not yet implemented');
  return [];
}
