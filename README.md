# test-swarm

AI agents write tests for your React or React Native app until almost all of the JavaScript actually ran in tests.

**95% of lines** — 95% of the code ran during tests.  
**95% of branches** — 95% of the yes/no paths ran too (errors, empty states, disabled buttons), not only the happy tap.

Run this **inside your app repo**, not inside this GitHub repo.

```
/test-swarm
```

or say `Run test-swarm.` Optional: `/test-swarm 20` for 20 agents. Default is 10. Whatever number you type wins.

It asks **one** thing: which git branch to open PRs against. Then it measures what is untested, splits the app into slices, and runs agents in parallel (each on its own copy of the repo). You get PRs. It does **not** merge. It does **not** change how the app works.

A test only counts if removing that piece of app code would make the test fail.

## You need

- A React or React Native git repo (JavaScript or TypeScript)
- **Jest or Vitest already in the project** (this skill will not add packages)
- Cursor or Claude Code, with permission to spawn **subagents**
- Optional: `gh` logged in, if you want PRs on GitHub

If there is no test runner, the agent must **stop** and tell you. It must not silently install software.

## Safety

The agent may have permission to run commands without asking. This skill still forbids:

- Editing app behavior, screens, or native `ios/` `android/` projects
- Merging PRs, force-push, `git reset --hard`, deleting your repo or `node_modules`
- Touching `.env`, secrets, or production servers
- Publishing packages, running `pod install` / Gradle as part of this skill
- Working in your dirty main checkout (it uses separate copies next to your repo)

It **will** create folders named like `your-app-wt-login` next to your repo, write test files, `git push` those test branches, and open PRs. It will **not** merge them. You review.

## Install

**Cursor — this project** (slash command `/test-swarm` works here):

From your **app** repo:

```bash
git clone --depth 1 https://github.com/vkukade-altir/test-swarm.git /tmp/test-swarm
mkdir -p .cursor/skills .cursor/commands
cp -R /tmp/test-swarm/skills/test-swarm .cursor/skills/test-swarm
cp /tmp/test-swarm/skills/test-swarm/commands/test-swarm.md .cursor/commands/test-swarm.md
```

Open a **new** chat, then `/test-swarm`.

**Cursor — every project on this machine:**

```bash
git clone --depth 1 https://github.com/vkukade-altir/test-swarm.git ~/.cursor/skills/test-swarm-src
cp -R ~/.cursor/skills/test-swarm-src/skills/test-swarm ~/.cursor/skills/test-swarm
```

Then say `Run test-swarm` in any app repo (slash `/test-swarm` still needs the project copy of the command file above).

**Claude Code**

```
/plugin marketplace add vkukade-altir/test-swarm
/plugin install test-swarm@test-swarm
```

If that fails, from your app repo run the same `cp` commands as Cursor project install, then say `Run test-swarm`.

**Or paste this to any agent in your app repo**

> Clone https://github.com/vkukade-altir/test-swarm, copy `skills/test-swarm` into `.cursor/skills/test-swarm` and the command file into `.cursor/commands/test-swarm.md`, read that skill, then run test-swarm. Do not change app behavior. Do not merge.

## What happens

1. Asks which branch PRs should target.
2. Finds yarn/npm/pnpm and Jest or Vitest. Stops if neither test runner exists.
3. If today’s tests are already red, it fixes **test setup** only, then continues.
4. Skips native OS UI, generated files, and data-only files so 95% stays honest.
5. Starts parallel subagents on separate folders. The main agent is the coordinator: it must spawn those workers, not write all tests itself. It tells you what each worker is doing as it goes.
6. Opens PRs. Never merges. Never changes product behavior.

## React and React Native

Both work. Same skill. Tests run in Jest/Vitest on your app JavaScript — not a full click-through in the browser, and not a real phone.

**React (web)**  
Pages, buttons, forms, routing, data helpers. Clicks, empty states, errors. Network is faked. Not Playwright/Cypress. Not CSS-only files.

**React Native**  
Screens, taps, navigation, session logic, data helpers. Confirm / Stop / Continue and the cases behind them. Camera, Face ID, and payments SDKs are faked. Not the native `ios/` / `android/` projects. Not the system Face ID or permission popups. Not driving the simulator.

Styles, theme, translations, and generated types are skipped on both so the score stays honest.
