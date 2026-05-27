import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { initOrch } from "./init.js";
import { Orchestrator } from "./orchestrator.js";
import { projectRoot } from "./paths.js";
import { loadState, saveState } from "./state.js";
import { countTasks } from "./todo.js";
import { tailDevLog } from "./devlog.js";
import { runVerify } from "./verifier.js";

export default function (pi: ExtensionAPI) {
  const orch = new Orchestrator(pi);

  pi.registerCommand("orch:init", {
    description: "Initialize .orch files for unattended workflow",
    handler: async (_args, ctx) => {
      await initOrch(projectRoot());
      ctx.ui.notify("Initialized .orch/. Edit .orch/todo.md and .orch/verify.sh, then run /orch:run.", "info");
    },
  });

  pi.registerCommand("orch:run", {
    description: "Start unattended workflow",
    handler: async (_args, ctx) => {
      const state = await loadState(projectRoot());
      state.enabled = true;
      state.status = "running";
      await saveState(state, projectRoot());
      await orch.dispatchNextTask(ctx);
    },
  });

  pi.registerCommand("orch:pause", {
    description: "Pause unattended workflow after current turn",
    handler: async (_args, ctx) => {
      const state = await loadState(projectRoot());
      state.enabled = false;
      state.status = "paused";
      await saveState(state, projectRoot());
      ctx.ui.notify("Orchestrator paused.", "info");
    },
  });

  pi.registerCommand("orch:resume", {
    description: "Resume unattended workflow",
    handler: async (_args, ctx) => {
      const state = await loadState(projectRoot());
      state.enabled = true;
      state.status = "running";
      await saveState(state, projectRoot());
      await orch.dispatchNextTask(ctx);
    },
  });

  pi.registerCommand("orch:stop", {
    description: "Stop unattended workflow and clear current task",
    handler: async (_args, ctx) => {
      const state = await loadState(projectRoot());
      state.enabled = false;
      state.status = "idle";
      state.currentTaskId = null;
      state.currentTaskTitle = null;
      await saveState(state, projectRoot());
      ctx.ui.notify("Orchestrator stopped.", "info");
    },
  });

  pi.registerCommand("orch:status", {
    description: "Show unattended workflow status",
    handler: async (_args, ctx) => {
      const state = await loadState(projectRoot());
      const counts = await countTasks(projectRoot()).catch(() => ({ total: 0, done: 0, open: 0 }));
      const tail = await tailDevLog(10, projectRoot());

      ctx.ui.notify(
        [
          `status: ${state.status}`,
          `enabled: ${state.enabled}`,
          `current: ${state.currentTaskId ?? "-"} ${state.currentTaskTitle ?? ""}`.trim(),
          `attempt: ${state.attempt}/${state.maxAttempts}`,
          `tasks: ${counts.done}/${counts.total} done, ${counts.open} open`,
          `lastError: ${state.lastError ?? "-"}`,
          "",
          "dev_log tail:",
          tail || "(empty)",
        ].join("\n"),
        state.status === "error" ? "error" : "info"
      );
    },
  });

  pi.registerCommand("orch:tail", {
    description: "Show last N lines of .orch/dev_log.md",
    handler: async (args, ctx) => {
      const n = Number.parseInt(args.trim(), 10);
      ctx.ui.notify(await tailDevLog(Number.isFinite(n) ? n : 30, projectRoot()) || "(empty)", "info");
    },
  });

  pi.registerCommand("orch:verify", {
    description: "Run .orch/verify.sh manually",
    handler: async (_args, ctx) => {
      const state = await loadState(projectRoot());
      const result = await runVerify(state.verifyCommand, projectRoot());
      ctx.ui.notify(
        [
          `verify: ${result.ok ? "ok" : "failed"}${result.skipped ? " (skipped)" : ""}`,
          `command: ${result.command}`,
          "",
          result.output || "(no output)",
        ].join("\n"),
        result.ok ? "info" : "error"
      );
    },
  });

  pi.on("agent_start", async (event, ctx) => orch.onAgentStart(event, ctx));
  pi.on("agent_end", async (event, ctx) => orch.onAgentEnd(event, ctx));
}
