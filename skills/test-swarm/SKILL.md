---
name: test-swarm
description: >-
  Runs parallel local agents in git worktrees that write JS/TS tests until 95%
  lines and 95% branches, then opens one PR per slice. Use when the user says
  test-swarm, 95% coverage, coverage swarm, or asks to raise test coverage with
  parallel agents. Supports Jest and Vitest. React and React Native included.
---

# test-swarm

You are the coordinator. Run this in the user's JS/TS repo (React / React Native included). Figure everything out. Do not ask questions except the one below.

## The only question

Ask which git branch to open PRs against. That is the **base**. Wait for the answer. Then go.

Do not ask about the 95% floor, worker count, test runner, or what to skip. Detect those.

If this is not a JS/TS git repo, stop and say so. If `gh` cannot open PRs, still write tests and report local branches.

## Done

`node .test-swarm/coverage-gate.cjs` exits 0 after a full coverage run.

That is **95% lines and 95% branches** on testable app JS/TS (denylist in `.test-swarm/untestable.globs`). Do not lower the floors. Do not `istanbul ignore` (or `v8 ignore`) to pass. Do not raise the project's global `coverageThreshold` — the gate is this program.

Never merge. Never `git push --force`. Never `--no-verify`. Never change product behavior. Tests only.

## Standing orders (every worker)

Paste into every spawn:

1. Branch off the base. Never merge, rebase, or cherry-pick into it.
2. PRs use `--base <base>`. Do not merge the PR.
3. Local worktree only. No cloud agents. Inherit the parent model. Do not pass a cheaper model.
4. Write only tests under your unit `paths`. Test helpers only. No product edits.
5. A test is valid only if removing the production branch under test would make it fail. No mock of the file under test. No "renders correctly" as the only assertion. No import-only coverage.
6. Match existing test style. Mock native SDKs (camera, biometrics, payments sheets). Do not drive OS UI.
7. Your glob must reach **95% lines and 95% branches** (minus `untestable.globs`). Iterate until it does.
8. If you need a product change to test something, skip it and report. Do not patch production to make the test easy.
9. Forbidden: force push, `--no-verify`, merge into base, editing another unit's paths, coverage ignore comments.

## Setup (once)

1. Find this skill directory (repo `skills/test-swarm` or `~/.cursor/skills/test-swarm`). Copy `scripts/` into the project:

```bash
mkdir -p .test-swarm
cp -R "<skill>/scripts/." .test-swarm/
cp "<skill>/untestable.defaults" .test-swarm/untestable.defaults
chmod +x .test-swarm/claim-slice.sh
```

`.test-swarm/units.tsv` columns (tab-separated): `id`, `state`, `branch`, `worktree`, `paths`. Example: `.test-swarm/units.example.tsv`.

2. Detect package manager (`yarn.lock` / `pnpm-lock.yaml` / `package-lock.json`). Detect runner: Jest if `jest.config.*` or `jest` in package.json, else Vitest if `vitest.config.*` or `vitest` in package.json. Detect source root: `src/`, else `app/`, else first app package under `packages/`. Write `.test-swarm/config`:

```
BASE=<the branch they named>
SRC=<source root>
RUNNER=jest|vitest
PM=yarn|npm|pnpm
FLOOR=95
WORKERS=10
```

If the user named a worker count in the same message, use that number.

3. Inspect the repo. Write `.test-swarm/untestable.globs` (one path per line, `#` comments ok). Start from `untestable.defaults` in this skill, then add what this repo cannot honestly unit-test (native passthroughs, generated files, Face ID / biometric OS sheets, widgets). Do **not** exclude app APIs, screens, or hooks just because they call a network or native SDK — mock the edge, keep the file in the score.

4. Do not commit `.test-swarm/` unless a worker needs a file in git. Scripts are copied into each worktree by `claim-slice.sh`.

## Loop

Default max **10** local workers. Paths must not overlap an in-flight unit.

1. Run the existing test suite. If any suite fails, that is unit `0`: one worker, mocks/`jest.setup`/`vitest.setup` only, no product changes, until green. Open a PR. Do not merge. Continue.

2. Full coverage run (json-summary). Use the repo’s existing test command if it already runs Jest or Vitest; add the coverage flags. Otherwise:

Jest:

```bash
<pm> jest --watchman=false --coverage --coverageReporters=json-summary --coverageReporters=text-summary --forceExit
```

Vitest:

```bash
<pm> vitest run --coverage --coverage.reporter=json-summary --coverage.reporter=text
```

Write `coverage/coverage-summary.json`. If the tool puts it elsewhere, point `COVERAGE_SUMMARY` at it when running the gate.

3. `node .test-swarm/coverage-gate.cjs` — if PASS, stop and report before/after.

4. If FAIL: `node .test-swarm/report-coverage.cjs`. Build or update `.test-swarm/units.tsv` from the report: one row per disjoint folder or large file. Prefer existing top-level folders under `$SRC`. Split a folder that is still huge.

5. Claim the next queued units whose `paths` do not overlap in-flight work: `.test-swarm/claim-slice.sh <id>`

6. Spawn a worker per claimed unit. Prompt: `.test-swarm/worker.md` with base, paths, branch, worktree filled in. Inherit parent model.

7. When a worker reports done: if its glob is under 95/95, send the **same** worker back. Do not open a "good enough" PR. If at 95/95, they push and `gh pr create --base <base>`. Never merge.

8. Repeat from step 2 until the gate passes. When the queue is empty and the gate is still red, add a new unit from the report's top uncovered files (new branch off base, new worktree). Never reuse an in-flight path.

## Slice rules

- One writer per path. Never two workers on the same files.
- Worktrees are siblings of the repo, named `<repo>-wt-<id>`. Symlink `node_modules` from the main repo.
- Keep going after a PR is open. Do not wait for the human except merge (they merge nothing until they say so).
- Skip denylist files. Tests live next to the product file in `__tests__/` or the repo's existing test layout.

## Report when done

Before vs after: lines % and branches % on the testable glob. List PR URLs. Name anything still skipped and why (untestable vs needs a product change).
