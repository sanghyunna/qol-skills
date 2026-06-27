#!/usr/bin/env node
// codex-run.mjs - minimal universal one-shot codex call.
// Concurrency-safe by construction: each run is a self-contained process that
// spawns its OWN codex app-server and talks to it over its own stdio. No shared
// files, sockets, locks, or temp paths; the only output is this process's stdout.
// => any number of agents can run this at the same time without colliding.
// Usage: node codex-run.mjs [--cwd DIR] [--model SLUG] (--prompt TEXT | --prompt-file PATH | stdin)
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';

const arg = (n, d) => { const i = process.argv.indexOf(n); return i >= 0 ? process.argv[i + 1] : d; };
const cwd = arg('--cwd', process.cwd());
const model = arg('--model', null);
const pf = arg('--prompt-file', null);
const prompt = pf ? readFileSync(pf === '-' ? 0 : pf, 'utf8')
                  : (arg('--prompt', null) ?? readFileSync(0, 'utf8'));

const child = spawn('codex', ['app-server', '-c', 'sandbox_mode="workspace-write"'],
  { cwd, stdio: ['pipe', 'pipe', 'ignore'], shell: true });

let id = 0, buf = '', out = '', done = false;
const pend = new Map();
const send = (m, p) => { const i = ++id; child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, method: m, params: p }) + '\n'); return new Promise(r => pend.set(i, r)); };
const reply = (i, r) => child.stdin.write(JSON.stringify({ jsonrpc: '2.0', id: i, result: r }) + '\n');
const finish = c => { if (done) return; done = true; process.stdout.write(out); try { child.kill(); } catch {} process.exit(c); };

child.stdout.on('data', d => {
  buf += d;
  for (let nl; (nl = buf.indexOf('\n')) >= 0;) {
    const line = buf.slice(0, nl).trim(); buf = buf.slice(nl + 1);
    if (!line) continue;
    let m; try { m = JSON.parse(line); } catch { continue; }
    if (m.id && (m.result !== undefined || m.error !== undefined)) { const r = pend.get(m.id); pend.delete(m.id); if (r) r(m.result); }
    else if (m.method && m.id !== undefined) reply(m.id, { decision: /fileChange|commandExecution/.test(m.method) ? 'acceptForSession' : 'approved_for_session' });
    else if (m.method === 'item/agentMessage/delta') out += (m.params?.delta ?? m.params?.text ?? '');
    else if (m.method === 'turn/completed') finish(0);
    else if (m.method === 'turn/failed' || m.method === 'thread/error') finish(1);
  }
});
child.on('exit', c => finish(c || 1));

(async () => {
  await send('initialize', { clientInfo: { name: 'codex-run', version: '1' } });
  const t = await send('thread/start', { cwd, model: model || undefined, approvalPolicy: 'never' });
  const threadId = t.thread?.id ?? t.threadId ?? t.id;
  await send('turn/start', { threadId, model: model || undefined, input: [{ type: 'text', text: prompt }] });
})().catch(() => finish(1));
