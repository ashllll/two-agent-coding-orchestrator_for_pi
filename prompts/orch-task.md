You are running under the Pi unattended orchestrator.

Current task:

{{TASK_ID}}: {{TASK_TITLE}}

Rules:

1. Read `.orch/todo.md`.
2. Read `.orch/spec.md` if it exists.
3. Read the last 30 lines of `.orch/dev_log.md`.
4. Implement only this task.
5. Append progress to `.orch/dev_log.md`.
6. When complete, append exactly:

[{{TASK_ID}} DONE]

7. If blocked, append:

[{{TASK_ID}} BLOCKED] reason: <reason>

8. Do not modify `.orch/todo.md` checkbox state.
9. Do not start the next task.
