# test-swarm

Parallel agents write tests until **95% lines and 95% branches** on your JS/TS app.

You install this once. In any React, React Native, or JS/TS repo:

```
/test-swarm
```

or `Run test-swarm.` Optional: `/test-swarm 20` to run 20 agents. Default is 10. Whatever number you type wins.

The agent asks **one** thing: which git branch to open PRs against. Then it measures coverage, splits the app into slices, runs agents in parallel git worktrees, and opens one PR per slice. It does not merge.

## Install

**Cursor**

```bash
git clone --depth 1 https://github.com/vkukade-altir/test-swarm.git ~/.cursor/skills/test-swarm-src
cp -R ~/.cursor/skills/test-swarm-src/skills/test-swarm ~/.cursor/skills/test-swarm
mkdir -p ~/.cursor/commands
cp ~/.cursor/skills/test-swarm/commands/test-swarm.md ~/.cursor/commands/test-swarm.md
```

For a project (teammates get `/test-swarm`), from the JS/TS repo:

```bash
git clone --depth 1 https://github.com/vkukade-altir/test-swarm.git /tmp/test-swarm
mkdir -p .cursor/skills .cursor/commands
cp -R /tmp/test-swarm/skills/test-swarm .cursor/skills/test-swarm
cp /tmp/test-swarm/skills/test-swarm/commands/test-swarm.md .cursor/commands/test-swarm.md
```

**Claude Code**

```
/plugin marketplace add vkukade-altir/test-swarm
/plugin install test-swarm@test-swarm
```

Or copy [`CLAUDE.md`](CLAUDE.md) into the project.

## What it does

1. Asks which branch PRs should target.
2. Detects yarn/npm/pnpm and Jest or Vitest.
3. Makes the existing suite green if it is red (mocks only, no product changes).
4. Skips native OS UI, generated files, and data-only files so the 95% number stays honest.
5. Spawns local agents on disjoint folders (10 unless you named another count). Each must hit 95/95 on its slice.
6. Opens PRs. Never merges. Never changes product behavior.

A test only counts if deleting the production branch it names would make it fail.
