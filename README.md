# two-agent-coding-orchestrator_for_pi

A Pi-native unattended workflow extension.

This project adapts the useful protocol ideas from `two-agent-coding-orchestrator` to Pi, but it does **not** use tmux screen scraping or Claude Code TUI state regexes.

## Current MVP

Implemented commands:

- `/orch:init` — create `.orch/` files in the current project
- `/orch:run` — start the unattended loop
- `/orch:status` — show current state and recent dev log
- `/orch:pause` — pause after the current turn
- `/orch:resume` — resume automatic dispatch
- `/orch:stop` — stop the workflow and clear current task
- `/orch:tail [N]` — show last N lines of `.orch/dev_log.md`
- `/orch:verify` — run `.orch/verify.sh` manually

MVP flow:

```text
todo.md -> dispatch T<N> -> Pi agent works -> dev_log marker -> verify.sh -> mark [x] -> next task
```

## Install locally

From a project that uses Pi:

```bash
mkdir -p .pi/extensions
cp -r path/to/two-agent-coding-orchestrator_for_pi .pi/extensions/orchestrator
pi
/reload
```

Or test directly:

```bash
pi -e ./src/index.ts
```

## Usage

Inside Pi:

```text
/orch:init
```

Edit:

```text
.orch/todo.md
.orch/verify.sh
```

Then run:

```text
/orch:run
```

## File protocol

```text
.orch/
  todo.md          # orchestrator-owned task list
  spec.md          # optional detailed plan
  dev_log.md       # worker-owned append-only progress log
  checkpoint.md    # compact/resume context
  state.json       # extension-owned state
  verify.sh        # verification command
  runs/            # future run artifacts
```

The worker must append:

```text
[T1 DONE]
```

or:

```text
[T1 BLOCKED] reason: ...
```

The extension, not the model, marks `todo.md` as done after verification.

## Roadmap

- Retry cooldown and `.orch/error-history.log`
- Compact protocol using `READY_FOR_COMPACT` / `RESUMED_OK`
- UI status widget
- Pseudo sub-agents: coder/tester/reviewer phases
- RPC sub-agents via `pi --mode rpc`
- Git worktree isolation
- Automatic report generation
