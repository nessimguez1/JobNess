import 'dotenv/config';
import cron from 'node-cron';
import express from 'express';
import { runAllScrapers } from './pipeline.js';
import { logger } from './utils/logger.js';

const app = express();
app.use(express.json());

app.post('/run', (req, res) => {
  if (req.headers['x-auth'] !== process.env['SCRAPER_SHARED_SECRET']) {
    res.status(401).end();
    return;
  }
  runAllScrapers().catch(err => logger.error({ err }, '/run pipeline failed'));
  res.json({ status: 'started' });
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

const port = process.env['PORT'] ?? 3001;
const server = app.listen(Number(port), () => {
  logger.info({ port }, 'scraper listening');
});
server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    logger.warn({ port }, 'port in use — scraper will run headless (no /run endpoint)');
  } else {
    logger.error({ err }, 'server error');
  }
});

// Twice daily: 07:30 and 19:00 Tel Aviv time
cron.schedule(
  '30 7 * * *',
  () => { runAllScrapers().catch(err => logger.error({ err }, 'cron 07:30 failed')); },
  { timezone: 'Asia/Jerusalem' },
);
cron.schedule(
  '0 19 * * *',
  () => { runAllScrapers().catch(err => logger.error({ err }, 'cron 19:00 failed')); },
  { timezone: 'Asia/Jerusalem' },
);

if (process.env['RUN_ON_BOOT'] === 'true') {
  runAllScrapers().catch(err => logger.error({ err }, 'boot run failed'));
}
