/**
 * A minimal headless-Chrome driver shared by make-icons and make-portraits.
 *
 * It speaks the DevTools protocol over Node's built-in WebSocket, so the
 * asset scripts still need nothing from npm. Node 22+ ships WebSocket
 * enabled; on Node 20 it sits behind --experimental-websocket, and
 * ensureWebSocket() re-runs the calling script with that flag added.
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import path from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Call first thing in a script. Never returns if it had to relaunch. */
export function ensureWebSocket() {
  if (typeof globalThis.WebSocket === 'function') return;
  const r = spawnSync(process.execPath, ['--experimental-websocket', ...process.argv.slice(1)], { stdio: 'inherit' });
  process.exit(r.status ?? 1);
}

function findBrowser() {
  const env = process.env;
  const candidates = [
    env.CHROME_PATH,
    env.PROGRAMFILES && path.join(env.PROGRAMFILES, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env.LOCALAPPDATA && path.join(env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    env['PROGRAMFILES(X86)'] && path.join(env['PROGRAMFILES(X86)'], 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ];
  return candidates.find((p) => p && existsSync(p));
}

/**
 * Starts a throwaway headless browser and attaches to its first page.
 * Returns `send(method, params)`, `evaluate(expression)` and `close()`.
 */
export async function launchChrome({ profileDir, port = 9444 }) {
  const bin = findBrowser();
  if (!bin) throw new Error('Chrome or Edge not found. Set CHROME_PATH to the browser executable.');

  const chrome = spawn(bin, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profileDir}`,
    '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
    '--allow-file-access-from-files', 'about:blank',
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 80 && !target; i++) {
    await sleep(250);
    try {
      target = (await fetch(`http://127.0.0.1:${port}/json/list`).then((r) => r.json())).find((t) => t.type === 'page');
    } catch { /* not listening yet */ }
  }
  if (!target) { chrome.kill(); throw new Error(`${bin} did not start. Set CHROME_PATH.`); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (e) => {
    const m = JSON.parse(e.data);
    if (!pending.has(m.id)) return;
    const { resolve, reject } = pending.get(m.id);
    pending.delete(m.id);
    m.error ? reject(new Error(m.error.message)) : resolve(m.result);
  });
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const i = ++id;
      pending.set(i, { resolve, reject });
      ws.send(JSON.stringify({ id: i, method, params }));
    });

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) {
      throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
    }
    return r.result.value;
  };

  const close = async () => {
    ws.close();
    chrome.kill();
    await sleep(600); // let the profile's lock files go before removing it
    await rm(profileDir, { recursive: true, force: true }).catch(() => {});
  };

  return { send, evaluate, close };
}
