/**
 * Mock SAPS receiver for local runs and tests: `SAPS_WEBHOOK_SECRET=... npx tsx scripts/mock-saps.ts`
 * Listens on port 4010 (path /saps), checks the HMAC signature and prints the payload.
 */
import { createServer } from 'node:http';
import { createHmac, timingSafeEqual } from 'node:crypto';

const secret = process.env.SAPS_WEBHOOK_SECRET ?? '';

createServer((req, res) => {
  const chunks: Buffer[] = [];
  req.on('data', (c) => chunks.push(c));
  req.on('end', () => {
    const body = Buffer.concat(chunks).toString('utf8');
    const given = String(req.headers['x-connecttransit-signature'] ?? '');
    const expected = 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
    const ok = given.length === expected.length && timingSafeEqual(Buffer.from(given), Buffer.from(expected));
    console.log(ok ? 'VERIFIED' : 'BAD SIGNATURE', body);
    res.statusCode = ok ? 200 : 401;
    res.end(ok ? 'ok' : 'bad signature');
  });
}).listen(4010, () => console.log('mock SAPS receiver on :4010'));
