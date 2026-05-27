import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { projectRoot } from "./paths.js";
import { loadState, nowIso, saveState } from "./state.js";
import { countTasks, findNextOpenTask, markTaskDone } from "./todo.js";
import { getBlockedReason, hasDoneMarker, tailDevLog } from "./devlog.js";
import { runVerify } from "./verifier.js";
import { recoverPrompt, taskPrompt, verifyFailedPrompt } from "./prompts.js";

export class Orchestrator {
  private handlingAgentEnd = false;

  constructor(private readonly pi: ExtensionAPI) {}

  async dispatchNextTask(ctx: any): Promise<void> {
    const cwd = projectRoot();
    const state = await loadState(cwd);

    if (!state.enabled || state.status === "paused") return;

    const task = await findNextOpenTask(cwd);
    if (!task) {
      state.status = "done";
      state.enabled = false;
      state.currentTaskId = null;
      state.currentTaskTitle = null;
      await saveState(state, cwd);
      ctx.ui.notify("Orchestrator: all tasks complete.", "info");
      return;
    }

    const devTail = await tailDevLog(30, cwd);

    state.status = "waiting_agent";
    state.currentTaskId = task.id;
    state.currentTaskTitle = task.title;
    state.attempt = 0;
    state.lastError = null;
    if (!state.runId) state.runId = `run-${Date.now()}`;
    await saveState(state, cwd);

    ctx.ui.setStatus?.("orch", `orch: ${task.id} attempt ${state.attempt + 1}/${state.maxAttempts}`);

    const prompt = taskPrompt(task, devTail);
    if (ctx.isIdle?.()) {
      this.pi.sendUserMessage(prompt);
    } else {
      this.pi.sendUserMessage(prompt, { deliverAs: "followUp" });
    }
  }

  async onAgentStart(_event: any, _ctx: any): Promise<void> {
    const cwd = projectRoot();
    const state = await loadState(cwd);
    if (!state.enabled) return;
    state.lastAgentStartAt = nowIso();
    await saveState(state, cwd);
  }

  async onAgentEnd(_event: any, ctx: any): Promise<void> {
    if (this.handlingAgentEnd) return;
    this.handlingAgentEnd = true;

    try {
      const cwd = projectRoot();
      const state = await loadState(cwd);

      if (!state.enabled || state.status !== "waiting_agent" || !state.currentTaskId) return;

      state.lastAgentEndAt = nowIso();
      await saveState(state, cwd);

      const taskId = state.currentTaskId;
      const blocked = await getBlockedReason(taskId, cwd);
      if (blocked) {
        state.status = "paused";
        state.enabled = false;
        state.lastError = `[${taskId} BLOCKED] ${blocked}`;
        await saveState(state, cwd);
        ctx.ui.notify(`Orchestrator paused: ${taskId} blocked — ${blocked}`, "warning");
        return;
      }

      if (!(await hasDoneMarker(taskId, cwd))) {
        await this.recover(ctx, `Missing [${taskId} DONE] marker in .orch/dev_log.md`);
        return;
      }

      state.status = "verifying";
      await saveState(state, cwd);

      const verify = await runVerify(state.verifyCommand, cwd);
      state.lastVerifyAt = nowIso();
      await saveState(state, cwd);

      if (!verify.ok) {
        await this.recover(ctx, `Verification failed.\n${verify.output}`);
        return;
      }

      await markTaskDone(taskId, cwd);

      const nextState = await loadState(cwd);
      nextState.status = "running";
      nextState.currentTaskId = null;
      nextState.currentTaskTitle = null;
      nextState.attempt = 0;
      nextState.lastError = null;
      await saveState(nextState, cwd);

      const counts = await countTasks(cwd);
      ctx.ui.notify(`Orchestrator accepted ${taskId}. Progress: ${counts.done}/${counts.total}.`, "info");

      await this.dispatchNextTask(ctx);
    } finally {
      this.handlingAgentEnd = false;
    }
  }

  async recover(ctx: any, reason: string): Promise<void> {
    const cwd = projectRoot();
    const state = await loadState(cwd);
    if (!state.currentTaskId) return;

    state.attempt += 1;
    state.status = "recovering";
    state.lastError = reason;

    if (state.attempt > state.maxAttempts) {
      state.status = "error";
      state.enabled = false;
      await saveState(state, cwd);
      ctx.ui.notify(`Orchestrator stopped after ${state.maxAttempts} attempts: ${reason}`, "error");
      return;
    }

    await saveState(state, cwd);

    const msg = reason.startsWith("Verification failed")
      ? verifyFailedPrompt(state.currentTaskId, state.verifyCommand, reason)
      : recoverPrompt(state.currentTaskId, reason);

    state.status = "waiting_agent";
    await saveState(state, cwd);

    if (ctx.isIdle?.()) {
      this.pi.sendUserMessage(msg);
    } else {
      this.pi.sendUserMessage(msg, { deliverAs: "followUp" });
    }
  }
}
