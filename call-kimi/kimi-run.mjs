#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';

const args = process.argv.slice(2);
const kimiBin = process.env.KIMI_BIN || 'kimi';
const take = (name, d = null) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : d;
};
const has = name => args.includes(name);

const cwd = resolve(take('--cwd', process.cwd()));
const promptFile = take('--prompt-file');
const prompt = promptFile
  ? readFileSync(promptFile === '-' ? 0 : promptFile, 'utf8')
  : (take('--prompt') ?? (!process.stdin.isTTY ? readFileSync(0, 'utf8') : null));

const cont = has('--continue');
const interactive = has('--interactive') || !prompt;

const help = spawnSync(kimiBin, ['--help'], { encoding: 'utf8' });
if (help.error || help.status !== 0) die('kimi command not found on PATH');

if (interactive) {
  runInteractive();
} else {
  runPrompt().catch(err => die(err.message));
}

function runInteractive() {
  const a = [];
  if (cont) a.push('--continue');

  const child = spawnKimi(a, { cwd, stdio: 'inherit' });
  child.on('exit', c => process.exit(c ?? 1));
}

async function runPrompt() {
  const result = await runPromptOnce(cont);
  if (result.code !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.code ?? 1);
  }

  const { text, sessionId } = parsePromptJson(result.stdout);
  process.stdout.write(text);
  if (sessionId) printThinking(sessionId);
}

async function runPromptOnce(useContinue) {
  const a = [];
  if (useContinue) a.push('--continue');
  a.push('--prompt', prompt, '--output-format', 'stream-json');

  const child = spawnKimi(a, { cwd, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '', stderr = '';
  child.stdout.on('data', d => { stdout += d; });
  child.stderr.on('data', d => { stderr += d; });

  const code = await wait(child);
  return { code, stdout, stderr };
}

function parsePromptJson(s) {
  let text = '', sessionId = null;
  for (const line of s.split(/\r?\n/)) {
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    if (m.role === 'assistant' && typeof m.content === 'string') text += m.content;
    if (m.type === 'session.resume_hint') sessionId = m.session_id || sessionId;
  }
  return { text, sessionId };
}

function printThinking(sessionId) {
  const p = findSessionWire(sessionId);
  if (!p) return;
  const turns = new Map();
  for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    let m;
    try { m = JSON.parse(line); } catch { continue; }
    const e = m.event;
    if (m.type === 'context.append_loop_event' && e?.part?.type === 'think') {
      const k = e.turnId ?? '0';
      turns.set(k, [...(turns.get(k) || []), e.part.think || '']);
    }
  }
  const last = [...turns.values()].at(-1);
  if (last?.length) process.stderr.write(`\n[thinking]\n${last.join('\n')}\n`);
}

function findSessionWire(sessionId) {
  const home = process.env.KIMI_CODE_HOME || join(homedir(), '.kimi-code');
  const index = join(home, 'session_index.jsonl');
  if (!existsSync(index)) return null;
  for (const line of readFileSync(index, 'utf8').split(/\r?\n/).reverse()) {
    if (!line.includes(sessionId)) continue;
    try {
      const row = JSON.parse(line);
      const p = join(row.sessionDir, 'agents', 'main', 'wire.jsonl');
      return existsSync(p) ? p : null;
    } catch {}
  }
  return null;
}

function wait(child) {
  return new Promise(resolve => child.on('exit', resolve));
}

function spawnKimi(kimiArgs, opts) {
  return spawn(kimiBin, kimiArgs, opts);
}

function die(msg) {
  console.error(`[kimi-run] ${msg}`);
  process.exit(1);
}
