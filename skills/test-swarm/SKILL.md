---
name: test-swarm
description: >-
  Runs parallel local agents in git worktrees that write JS/TS tests until 95%
  lines and 95% branches, then opens one PR per slice. Use when the user says
  test-swarm, /test-swarm, 95% coverage, coverage swarm, or asks to raise test
  coverage with parallel agents. Supports Jest and Vitest. React and React Native.
---

# test-swarm

You are the **coordinator**. Subagents write tests. You do not write slice tests in this chat.

## Order

1. **Find the app.** If the workspace root is not a JS/TS git repo, look one level down for a folder with both `package.json` and `.git`. Work there. Do not stop at “not a git repo” on a parent folder.
2. **Install.** If `.cursor/skills/test-swarm/SKILL.md` is missing, fetch https://raw.githubusercontent.com/vkukade-altir/test-swarm/main/README.md and run its install block (`rm -rf` the clone and dest first so a second run does not fail or nest the folder). Stay in the app. Do not `cd` into the clone.
3. **Then** ask the base branch. **Then** check git + Jest/Vitest.

Do not run the git/runner stop checks before install.

## The only question

Ask which git branch to open PRs against. That is the **base**. Wait for the answer. Then go.

Do not ask about the 95% floor, worker count, test runner, or what to skip.

**Workers:** default **10**. If they named a count (`/test-swarm 20`, "use 4"), use that number. Always wins, including above 10. Do not cap. Do not ask.

After install: if this is still not a JS/TS git repo, stop. If Jest **and** Vitest are missing from package.json / lockfile, **stop**. Do not add packages. Tell them this skill needs a test runner already in the repo. If `gh` cannot open PRs, still write tests and report local branches.

## Keep the user informed

You are running this for the person who owns the product. After every spawn, every worker finish, every PR, every send-back, and at least whenever you are waiting on workers: one short update in product words.

Example: "Login screens: tests in progress." / "Checkout: PR opened." / "Settings: sent back — branches still short."

Do not dump logs, file paths, or coverage JSON. Name the slice the way they would (login, settings, home).

## Spawn (mandatory)

For each claimed unit you **must** spawn a **local** subagent:

- Cursor: Task tool, `subagent_type` `generalPurpose`, `run_in_background` true, **omit** `model` (inherit parent). Never `cloud`.
- Claude Code: the environment's Agent/Task tool, **same model as you**, local, not a lighter stand-in.

Prompt = `.test-swarm/worker.md` filled in + standing orders below.

If you cannot spawn subagents, **STOP** and tell the user. Do not silently write every folder in this one chat (overlapping edits, easy to touch the live checkout).

Never spawn two writers on the same `paths`.

## Safety


Forbidden. If a worker does one of these, stop that worker.

- Change product behavior, screens, native `ios/` `android/`, or app config
- Merge PRs, `git push --force`, `--no-verify`, `git reset --hard`, `git checkout --` of product files, `git clean`
- Delete the repo, `rm -rf node_modules` in the **main** checkout, `rm -rf` the user's home
- Read or write `.env`, credentials, keystores, secrets
- `npm publish`, `pod install`, Gradle, Fastlane, store submit
- Hit real production APIs; mock network
- Cloud agents
- `istanbul ignore` / `v8 ignore` / lowering the 95% floor
- Stage or commit the user's **pre-existing** dirty files in the main checkout
- Work in the user's current checkout except writing `.test-swarm/` and reading coverage. Tests go in worktrees.

Do not raise the project's global `coverageThreshold`. The gate is this program.

## Done

`node .test-swarm/coverage-gate.cjs` exits 0 after a full coverage run = **95% lines and 95% branches** on testable app JS/TS (`.test-swarm/untestable.globs`).

## Standing orders (every worker)

Paste into every spawn:

1. Branch off the base. Never merge, rebase, or cherry-pick into it.
2. PRs use `--base <base>`. Do not merge.
3. Local worktree only. Inherit parent model. No cloud. No cheaper model.
4. Tests only under your `paths`. Test helpers only. No product edits.
5. A test is valid only if removing the production branch under test would make it fail. No mock of the file under test. No "renders correctly" as the only assertion. No import-only coverage.
6. Match existing test style. React web: `@testing-library/react` if present, else the repo's pattern. React Native: `@testing-library/react-native` or `react-test-renderer` if present. Mock native SDKs. Do not drive OS UI or a simulator.
7. Your glob must reach **95% lines and 95% branches** (minus untestable). Iterate until it does.
8. If you need a product change to test something, skip it and report. Do not patch production.
9. Push only your test branch. Forbidden: force push, `--no-verify`, merge, other units' paths, coverage ignore, `.env`, deleting `node_modules` on the main repo.

## Setup (once)

1. Skill dir = `.cursor/skills/test-swarm` or `~/.cursor/skills/test-swarm`. Copy scripts into the **app** repo:

```bash
mkdir -p .test-swarm
cp -R "<skill>/scripts/." .test-swarm/
cp "<skill>/untestable.defaults" .test-swarm/untestable.defaults
chmod +x .test-swarm/claim-slice.sh
```

`units.tsv` columns (tab): `id`, `state`, `branch`, `worktree`, `paths`. See `units.example.tsv`.

2. Detect `yarn` / `npm` / `pnpm`. Detect Jest vs Vitest. Detect React Native (`react-native` in package.json) vs React web. Source root: `src/`, else `app/`, else first app package under `packages/`. Write `.test-swarm/config`:

```
BASE=<branch they named>
SRC=<source root>
RUNNER=jest|vitest
PM=yarn|npm|pnpm
KIND=react|react-native
FLOOR=95
WORKERS=10
```

3. Write `.test-swarm/untestable.globs` from `untestable.defaults`, plus this repo's honest skip list (native passthroughs, generated, biometric OS sheets, widgets). Do **not** exclude app APIs, screens, or hooks because they call a network or SDK — mock the edge.

4. If `BASE` is not a local ref: `git fetch origin <BASE>` and use `origin/<BASE>` for worktree create. Do not checkout it in the user's dirty tree.

5. Do not commit `.test-swarm/` unless needed. `claim-slice.sh` copies it into each worktree.

## Loop

Max workers = `WORKERS`. No overlapping in-flight paths.

1. Run the existing suite once. If it fails, unit `0`: **one** worker, mocks/setup files only, no product changes, until green. PR. Do not merge. Continue. If there are zero tests, skip this — go to coverage with `collectCoverageFrom` on `$SRC`.

2. Full coverage (json-summary). Always pass `collectCoverageFrom` for `$SRC` (minus styles/types) so a repo with almost no tests still produces `coverage/coverage-summary.json`.

Jest:

```bash
<pm> jest --watchman=false --coverage --coverageReporters=json-summary --coverageReporters=text-summary --forceExit --collectCoverageFrom='<src>/**/*.{js,jsx,ts,tsx}'
```

Vitest:

```bash
<pm> vitest run --coverage --coverage.reporter=json-summary --coverage.reporter=text
```

Use the repo's test script if it already runs Jest/Vitest; still require json-summary.

3. `node .test-swarm/coverage-gate.cjs` — PASS: stop, report before/after to the user.

4. FAIL: `node .test-swarm/report-coverage.cjs`. Fill `units.tsv` — one disjoint folder (or huge file) per row. Prefer top-level folders under `$SRC`.

5. `.test-swarm/claim-slice.sh <id>` for the next free units.

6. Spawn workers (see Spawn). Tell the user what started.

7. Worker done: under 95/95 → same worker back, tell the user why. At 95/95 → they push and `gh pr create --base <base>`. Never merge. Tell the user the PR link in product words.

8. Repeat from step 2 until the gate passes. Empty queue and still red → new unit from top uncovered files. Never reuse an in-flight path.

## Slice rules

- One writer per path.
- Worktrees are **siblings** of the app repo: `../<repo>-wt-<id>`. Symlink `node_modules` from the main repo. Do not run `yarn install` in every worktree if the symlink worked.
- Keep going after a PR is open. Do not wait for merge.
- Tests live in `__tests__/` or the repo's existing layout.

## Report when done

Before vs after, in the two percentages (lines = how much code ran; branches = how many yes/no paths ran). PR links. What was skipped and why (cannot unit-test vs needs a product change).
