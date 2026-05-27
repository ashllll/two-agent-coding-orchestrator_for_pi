import fs from "node:fs/promises";
import { orchPath } from "./paths.js";
import type { OrchTask } from "./types.js";

const TASK_RE = /^- \[( |x|X)\]\s+(T\d+):\s+(.+)$/;

export async function readTodo(cwd?: string): Promise<string> {
  return await fs.readFile(orchPath("todo.md", cwd), "utf8");
}

export function parseTasks(markdown: string): OrchTask[] {
  return markdown
    .split(/\r?\n/)
    .map((line) => {
      const match = line.match(TASK_RE);
      if (!match) return null;
      return {
        id: match[2],
        title: match[3].trim(),
        line,
        done: match[1].toLowerCase() === "x",
      } satisfies OrchTask;
    })
    .filter((task): task is OrchTask => task !== null);
}

export async function findNextOpenTask(cwd?: string): Promise<OrchTask | null> {
  const todo = await readTodo(cwd);
  return parseTasks(todo).find((task) => !task.done) ?? null;
}

export async function countTasks(cwd?: string): Promise<{ total: number; done: number; open: number }> {
  const tasks = parseTasks(await readTodo(cwd));
  const done = tasks.filter((task) => task.done).length;
  return { total: tasks.length, done, open: tasks.length - done };
}

export async function markTaskDone(taskId: string, cwd?: string): Promise<void> {
  const todoPath = orchPath("todo.md", cwd);
  const markdown = await fs.readFile(todoPath, "utf8");
  const lines = markdown.split(/\r?\n/);
  let found = false;

  const next = lines.map((line) => {
    const match = line.match(TASK_RE);
    if (!match || match[2] !== taskId) return line;
    found = true;
    return line.replace("- [ ]", "- [x]").replace("- [X]", "- [x]");
  });

  if (!found) {
    throw new Error(`Task ${taskId} not found in .orch/todo.md`);
  }

  await fs.writeFile(todoPath, next.join("\n"), "utf8");
}
