import fs from "node:fs/promises";
import { orchDir, orchPath } from "./paths.js";
import type { OrchState } from "./types.js";

export const DEFAULT_STATE: OrchState = {
  version: 1,
  enabled: false,
  status: "idle",
  currentTaskId: null,
  currentTaskTitle: null,
  attempt: 0,
  maxAttempts: 3,
  verifyCommand: "bash .orch/verify.sh",
  lastError: null,
  lastAgentStartAt: null,
  lastAgentEndAt: null,
  lastVerifyAt: null,
  runId: null,
};

export async function loadState(cwd?: string): Promise<OrchState> {
  try {
    const raw = await fs.readFile(orchPath("state.json", cwd), "utf8");
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_STATE };
  }
}

export async function saveState(state: OrchState, cwd?: string): Promise<void> {
  await fs.mkdir(orchDir(cwd), { recursive: true });
  await fs.writeFile(orchPath("state.json", cwd), JSON.stringify(state, null, 2) + "\n", "utf8");
}

export function nowIso(): string {
  return new Date().toISOString();
}
