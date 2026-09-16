/**
 * Resolves every external link in the generated page. Network-dependent, so it
 * is a manual check (`npm run links`), not part of CI.
 *
 * Some hosts answer automated requests with 403/999 while serving the page
 * normally in a browser — those are reported as "blocked", not broken.
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(path.join(ROOT, 'index.html'), 'utf8');
const urls = [...new Set([...html.matchAll(/href="(https?:\/\/[^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&')))].sort();

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36';
const BOT_BLOCKED = new Set([403, 405, 429, 999]);

let broken = 0;
console.log(`\n  Checking ${urls.length} external links\n`);

for (const url of urls) {
  let status = 0, note = '';
  for (const method of ['HEAD', 'GET']) {
    try {
      const ctl = AbortSignal.timeout(20000);
      const res = await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA }, signal: ctl });
      status = res.status;
      if (res.ok) break;
    } catch (e) { note = e.name; }
  }
  const mark = status >= 200 && status < 400 ? '✓' : BOT_BLOCKED.has(status) ? '~' : '✗';
  if (mark === '✗') broken += 1;
  console.log(`   ${mark} ${String(status || note).padEnd(5)} ${url}`);
}

console.log(broken ? `\n  ${broken} link(s) need attention\n` : '\n  No broken links. (~ = host blocks automated requests)\n');
process.exit(broken ? 1 : 0);
