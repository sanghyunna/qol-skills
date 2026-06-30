---
name: call-kimi
description: Invoke Kimi Code through a tiny wrapper around its prompt and TUI modes. Use when delegating a coding or analysis task to Kimi, resuming the latest Kimi session, launching interactive Kimi with visible thinking, or avoiding repeated Kimi CLI boilerplate.
---

# call-kimi

Delegate work to Kimi Code without rewriting the same CLI flags.

Use `kimi-run.mjs` next to this file:

```bash
node "<skill-dir>/kimi-run.mjs" --cwd <repo-dir> --prompt "your task for Kimi"
```

## What the wrapper does

- Uses `kimi -p --output-format stream-json` and streams assistant output as it arrives.
- Always emits available thinking to stderr: live from TUI, or captured from Kimi's session wire after prompt-mode runs.
- Launches the interactive TUI when the user needs visible thinking and live session control.
- Keeps concurrency safe by spawning one Kimi process per invocation and never sharing temp files, sockets, or locks inside the wrapper.

## Common commands

One-shot delegation:

```bash
node kimi-run.mjs --cwd . --prompt "Review the current diff"
```

Continue the latest Kimi session for the working directory:

```bash
node kimi-run.mjs --cwd . --continue --prompt "Now implement the smallest fix"
```

Start real interactive Kimi with live thinking:

```bash
node kimi-run.mjs --cwd . --interactive
node kimi-run.mjs --cwd . --interactive --continue
```

Force a specific executable when PATH is weird:

```bash
KIMI_BIN=/path/to/kimi node kimi-run.mjs --cwd . --prompt "Review the current diff"
```

## Behavior

- Prompt mode uses `kimi -p --output-format stream-json` and does not buffer the response.
- Interactive mode launches the Kimi TUI directly with inherited stdio.
- Do not add backend/model/json/debug flags. The wrapper exists to hide Kimi CLI differences, not expose them.
