import fs from "node:fs/promises";
import { orchPath } from "./paths.js";

export async function ensureDevLog(cwd?: string): Promise<void> {
  try {
    await fs.access(orchPath("dev_log.md", cwd));
  } catch {
    await fs.writeFile(orchPath("dev_log.md", cwd), "# Dev Log\n\n", "utf8");
  }
}

export async function tailDevLog(n = 30, cwd?: string): Promise<string> {
  try {
    const raw = await fs.readFile(orchPath("dev_log.md", cwd), "utf8");
    const lines = raw.split(/\r?\n/);
    return lines.slice(Math.max(0, lines.length - n)).join("\n").trimEnd();
  } catch {
    return "";
  }
}

export async function hasDoneMarker(taskId: string, cwd?: string): Promise<boolean> {
  try {
    const raw = await fs.readFile(orchPath("dev_log.md", cwd), "utf8");
    return new RegExp(`^\\[${taskId} DONE\\](?:\\s|$)`, "m").test(raw);
  } catch {
    return false;
  }
}

export async function getBlockedReason(taskId: string, cwd?: string): Promise<string | null> {
  try {
    const raw = await fs.readFile(orchPath("dev_log.md", cwd), "utf8");
    const match = raw.match(new RegExp(`^\\[${taskId} BLOCKED\\]\\s*reason:\\s*(.+)$`, "m"));
    return match?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}
