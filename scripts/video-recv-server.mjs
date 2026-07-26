/**
 * Tiny zero-dependency receive server for browser-recorded videos.
 * The in-page recorder (scripts/record-lottie-video.js) POSTs its WebM blob
 * here, and it lands in renders/.
 *
 *   node scripts/video-recv-server.mjs   # listens on :5198
 */
import http from 'node:http';
import { createWriteStream, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'renders');
mkdirSync(out, { recursive: true });

http
  .createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }
    if (req.method === 'POST') {
      const name = new URL(req.url, 'http://x').searchParams.get('name').replace(/[^\w.-]/g, '');
      const ws = createWriteStream(join(out, name));
      req.pipe(ws).on('finish', () => {
        console.log('saved', name);
        res.end('ok');
      });
    } else res.end('up');
  })
  .listen(5198, () => console.log('recv on :5198 → renders/'));
