import type { OrchTask } from "./types.js";

export function taskPrompt(task: OrchTask, devLogTail: string): string {
  return `You are running under the Pi unattended orchestrator.

Current task:

${task.id}: ${task.title}

Rules:

1. Read .orch/todo.md.
2. Read .orch/spec.md if it exists.
3. Review this recent .orch/dev_log.md tail:

\`\`\`
${devLogTail || "(empty)"}
\`\`\`

4. Implement only this task.
5. Append concise one-line progress entries to .orch/dev_log.md.
6. When complete, append exactly:

[${task.id} DONE]

7. If blocked, append exactly:

[${task.id} BLOCKED] reason: <reason>

8. Do not modify .orch/todo.md checkbox state.
9. Do not start the next task.`;
}

export function recoverPrompt(taskId: string, reason: string): string {
  return `The Pi unattended orchestrator did not accept completion for ${taskId}.

Reason:

${reason}

Expected completion marker in .orch/dev_log.md:

[${taskId} DONE]

Please inspect current state, continue if incomplete, and append the exact marker only when the task is actually complete.

If blocked, append:

[${taskId} BLOCKED] reason: <reason>

Do not start another task.`;
}

export function verifyFailedPrompt(taskId: string, command: string, output: string): string {
  return `Verification failed for ${taskId}.

Command:

${command}

Output:

\`\`\`
${output.slice(0, 12000)}
\`\`\`

Fix the failure. When complete, append exactly:

[${taskId} DONE]

Do not start another task.`;
}
