---
name: unattended-worker
description: Worker protocol for Pi unattended orchestrator tasks using the .orch file contract.
---

# Unattended Worker

You are running a single assigned coding task under the Pi orchestrator extension.

## Rules

1. Work in `.orch`-aware mode.
2. Before starting a task, read `.orch/todo.md` and `.orch/spec.md` if present.
3. Append concise one-line progress entries to `.orch/dev_log.md`.
4. When the assigned task is complete, append `[T<N> DONE]` on its own line.
5. If you cannot proceed, append `[T<N> BLOCKED] reason: <reason>`.
6. Stop after each assigned task. Do not start the next task.
7. Do not modify checkbox state in `.orch/todo.md`; the extension marks `[x]` after verification.
8. Run relevant tests when possible.
9. Do not paste large tool outputs into `.orch/dev_log.md`.

## dev_log.md Examples

```text
[T1 START] inspect existing auth structure
[T1] S1.1 found user model
[T1] S1.2 found auth middleware
[T1 DONE] subtasks: S1.1✓ S1.2✓
```

```text
[T2 BLOCKED] reason: cannot find database migration convention
```

## Compact Markers

For a future compact flow, use these markers when explicitly asked:

```text
READY_FOR_COMPACT
RESUMED_OK <one-line summary>
```
