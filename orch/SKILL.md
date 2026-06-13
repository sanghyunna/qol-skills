---
name: orch
description: "Use when the user wants the active agent to orchestrate delegated agent work instead of doing heavy execution directly: decompose goals, dispatch focused workers, schedule parallel or dependent tasks, avoid mid-flight steering, validate outputs, integrate results, and report verified outcomes."
---

# Orch

When invoked, act as the orchestrator, not the worker.

Design and operate bounded loops that prompt other agents. Preserve the main thread for planning, scheduling, validation, integration, and user judgment. Delegate substantial research, analysis, implementation, testing, debugging, review, or content production to worker agents.

Use the host environment's available delegation mechanism. Workers may be called subagents, agents, tasks, tools, roles, or delegates.

## Workflow

1. Define the goal, constraints, and acceptance criteria.
2. Split work into bounded tasks with clear artifacts or scope.
3. Choose the simplest reliable pattern: sequential, parallel fan-out, maker-checker, or adaptive replanning.
4. Dispatch workers with self-contained prompts.
5. Monitor status without steering, interrupting, or chatting with active workers.
6. Re-engage only after completion, failure, timeout, blocker, or explicit request for input.
7. Collect outputs, failures, blockers, and evidence.
8. Validate results before claiming completion.
9. Integrate accepted outputs.
10. Run another round only for concrete gaps.
11. Stop when the goal is met, blocked, repeating, too costly, or needs human judgment.

## Delegation

Each worker prompt should include:

- role
- objective
- relevant context
- owned artifacts or scope
- allowed actions and permissions
- boundaries and things not to touch
- dependencies
- validation requirement
- output format
- stop condition

Do not assume a worker can see the parent conversation. Include the context it needs or point it to the source artifacts it should inspect.

Prefer artifact-bound scopes:

- **Explorer**: inspect specified sources, return findings, no edits.
- **Implementer**: change specified artifacts only, verify, return changed items and risks.
- **Reviewer**: inspect specified output only, no edits, return blocking findings first.
- **Tester**: run or add specified checks, report evidence and failures.
- **Integrator**: combine accepted worker outputs, resolve conflicts, preserve boundaries.

Avoid vague scopes like "fix this", "review everything", "improve it", or "look around and decide".

## Scheduling

Run independent tasks in parallel. Serialize dependent tasks.

Avoid shared-state conflicts. If multiple workers need the same artifact, assign one owner or have workers produce proposals for the orchestrator to merge.

Maintain a compact task ledger with owner, status, scope, dependencies, validation requirement, result, and next action.

## Validation

Use the lightest reliable validation method:

- direct inspection for small, low-risk work
- test or check commands for behavioral changes
- independent reviewer for risky work
- maker-checker loop when output quality matters

Validation must produce evidence: passing checks, inspected diffs, logs, screenshots, citations, reproduction steps, or explicit no-blocking-findings.

## Output

Keep the final response concise:

- delegated work
- completed work
- validation evidence
- remaining work or decisions needed

Do not paste worker chatter. Summarize outcomes and evidence.
