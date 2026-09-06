# test-swarm

AI agents write tests for your React or React Native app until almost all of the JavaScript is actually exercised.

**95% of lines** means 95% of the code ran during tests.  
**95% of branches** means 95% of the yes/no paths ran too — not just the happy tap, but the error, empty, and disabled cases.

You install this once. Then in your repo:

```
/test-swarm
```

or `Run test-swarm.` Optional: `/test-swarm 20` to run 20 agents. Default is 10. Whatever number you type wins.

The agent asks **one** thing: which git branch to open PRs against. Then it measures what is untested, splits the app into slices, runs agents in parallel (each on its own copy of the repo), and opens one PR per slice. It does not merge. It does not change how the app works.

A test only counts if removing that piece of app code would make the test fail.

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
2. Finds your package manager and test runner (Jest or Vitest).
3. Fixes a red test suite first if needed (test setup only — no app behavior changes).
4. Skips native OS UI, generated files, and data-only files so the 95% is honest.
5. Runs local agents on separate folders (10 unless you named another count). Each folder must hit 95% of lines and 95% of yes/no paths.
6. Opens PRs. Never merges. Never changes product behavior.

## React and React Native

Both work. Same skill. Tests run in Jest/Vitest on your app JavaScript — not a full click-through in the browser, and not a real phone.

**React (web)**  
Pages, buttons, forms, routing, data helpers. Clicks, empty states, errors. Network is faked. Not Playwright/Cypress. Not CSS-only files.

**React Native**  
Screens, taps, navigation, session logic, data helpers. Confirm / Stop / Continue and the cases behind them. Camera, Face ID, and payments SDKs are faked. Not the native `ios/` / `android/` projects. Not the system Face ID or permission popups. Not driving the simulator.

Styles, theme, translations, and generated types are skipped on both so the score stays honest.
