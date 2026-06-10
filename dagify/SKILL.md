---
name: dagify
description: Use when the user wants a task decomposed into a DAG of subtasks, executed with parallel subagents, then reviewed by independent stronger subagents for code integrity and plan alignment.
---

# Dagify

When invoked, act as the coordinator for a DAG-based multi-agent workflow.

## Workflow

1. Turn the task or plan into a compact DAG of subtasks.
2. Make dependencies explicit.
3. Run all currently unblocked subtasks in parallel with subagents.
4. Give each subagent a bounded prompt with the relevant context, dependency notes, and expected output.
5. Prefer clear ownership boundaries when assigning work, but choose the boundaries based on the actual task and codebase.
6. After each wave completes, integrate the results before starting dependent subtasks.
7. When the full DAG is complete, spawn two independent stronger review subagents:
   - **Integrity reviewer**: check syntax, tests, build/type/lint issues, runtime hazards, and code defects.
   - **Alignment reviewer**: compare the implementation against the original request and DAG plan; check missing requirements, scope drift, and unjustified assumptions.
8. Address actionable reviewer findings before finalizing.

## Output

Keep the final response concise:

- DAG summary
- implementation summary
- reviewer results
- tests or checks run

If a subtask is skipped or blocked, state why.
