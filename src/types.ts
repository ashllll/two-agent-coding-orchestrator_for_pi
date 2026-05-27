export type OrchStatus =
  | "idle"
  | "running"
  | "waiting_agent"
  | "verifying"
  | "recovering"
  | "paused"
  | "done"
  | "error";

export interface OrchState {
  version: 1;
  enabled: boolean;
  status: OrchStatus;
  currentTaskId: string | null;
  currentTaskTitle: string | null;
  attempt: number;
  maxAttempts: number;
  verifyCommand: string;
  lastError: string | null;
  lastAgentStartAt: string | null;
  lastAgentEndAt: string | null;
  lastVerifyAt: string | null;
  runId: string | null;
}

export interface OrchTask {
  id: string;
  title: string;
  line: string;
  done: boolean;
}

export interface VerifyResult {
  ok: boolean;
  skipped: boolean;
  command: string;
  output: string;
  exitCode: number | null;
}
