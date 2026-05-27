import path from "node:path";

export function projectRoot(): string {
  return process.cwd();
}

export function orchDir(cwd = projectRoot()): string {
  return path.join(cwd, ".orch");
}

export function orchPath(name: string, cwd = projectRoot()): string {
  return path.join(orchDir(cwd), name);
}
