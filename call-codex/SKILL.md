---
name: call-codex
description: Invoke the Codex CLI headlessly through a tiny concurrency-safe wrapper that drives `codex app-server` over JSON-RPC. Use when you need to run or delegate a coding/analysis task to codex from the command line, or run several codex calls in parallel without them colliding.
---

# call-codex

Delegate a one-shot task to the Codex CLI. Each call spawns its own `codex app-server`, talks to it over JSON-RPC, auto-accepts approvals, and prints codex's final output to stdout. No shared state - any number of calls can run at once.

## Quick start

Run the `codex-run.mjs` next to this file:

```bash
node "<skill-dir>/codex-run.mjs" --cwd <repo-dir> --prompt "your task for codex"
```

- **Output:** codex's final message on stdout. Exit 0 = ok, non-zero = failed.
- **Prompt:** `--prompt "..."`, or `--prompt-file <path>` (`-` = stdin), or piped stdin.
- **`--cwd <dir>`** where codex reads/edits (sandbox = workspace-write). Default: current dir.
- **`--model <slug>`** optional; defaults to codex's configured model.

## Parallel use

Every invocation is a self-contained process (its own app-server, no shared files/sockets/locks), so concurrent calls never interfere:

```bash
node codex-run.mjs --cwd a --prompt "..." > a.txt &
node codex-run.mjs --cwd b --prompt "..." > b.txt &
wait
```

## Requires

`codex` CLI on PATH and logged in (check with `codex login status`).
