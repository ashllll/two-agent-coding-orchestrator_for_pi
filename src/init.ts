import fs from "node:fs/promises";
import { orchDir, orchPath } from "./paths.js";
import { DEFAULT_STATE, saveState } from "./state.js";

async function writeIfMissing(path: string, content: string, executable = false): Promise<void> {
  try {
    await fs.access(path);
    return;
  } catch {
    await fs.writeFile(path, content, "utf8");
    if (executable) await fs.chmod(path, 0o755);
  }
}

export async function initOrch(cwd?: string): Promise<void> {
  await fs.mkdir(orchDir(cwd), { recursive: true });
  await fs.mkdir(orchPath("runs", cwd), { recursive: true });

  await writeIfMissing(
    orchPath("todo.md", cwd),
    `# Goal

Describe the high-level goal here.

# Constraints

- Worker must not mark todo checkboxes.
- Worker must append progress to .orch/dev_log.md.
- Worker must stop after the assigned task.

# Tasks

- [ ] T1: Inspect the project and summarize the implementation plan
- [ ] T2: Implement the first focused change
- [ ] T3: Add or update tests
`
  );

  await writeIfMissing(
    orchPath("spec.md", cwd),
    `# Spec

Add detailed plan, acceptance criteria, and constraints here.
`
  );

  await writeIfMissing(
    orchPath("dev_log.md", cwd),
    `# Dev Log

`
  );

  await writeIfMissing(
    orchPath("checkpoint.md", cwd),
    `# Checkpoint

No checkpoint yet.
`
  );

  await writeIfMissing(
    orchPath("verify.sh", cwd),
    `#!/usr/bin/env bash
set -euo pipefail

# Replace this with your project verification command.
# Examples:
# npm test
# npm run lint
# pytest
# cargo test

echo "No verification configured yet."
`,
    true
  );

  await saveState({ ...DEFAULT_STATE }, cwd);
}
