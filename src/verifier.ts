import { exec } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import { orchPath, projectRoot } from "./paths.js";
import type { VerifyResult } from "./types.js";

const execAsync = promisify(exec);

export async function runVerify(command = "bash .orch/verify.sh", cwd = projectRoot()): Promise<VerifyResult> {
  try {
    await fs.access(orchPath("verify.sh", cwd));
  } catch {
    return {
      ok: true,
      skipped: true,
      command,
      output: "Skipped: .orch/verify.sh not found.",
      exitCode: 0,
    };
  }

  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: 10 * 60 * 1000,
      maxBuffer: 1024 * 1024,
    });
    return {
      ok: true,
      skipped: false,
      command,
      output: [stdout, stderr].filter(Boolean).join("\n").trim(),
      exitCode: 0,
    };
  } catch (error: any) {
    return {
      ok: false,
      skipped: false,
      command,
      output: [error?.stdout, error?.stderr, error?.message].filter(Boolean).join("\n").trim(),
      exitCode: typeof error?.code === "number" ? error.code : null,
    };
  }
}
