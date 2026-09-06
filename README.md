# test-swarm

AI agents write tests for your React or React Native app until **almost all of the JavaScript ran** — not only the happy tap.

That bar is **95% of both**:

- **Lines** — 95% of the code ran during tests.
- **Branches** — 95% of the yes/no paths ran too (errors, empty states, disabled buttons).

Run this in your **app** repo. `/test-swarm` or `Run test-swarm.` Optional: `/test-swarm 20` (default 10).

It asks which git branch to open PRs against. Then it splits the app, runs agents in parallel, and opens PRs. It does not merge. It does not change how the app works.

A test only counts if removing that piece of app code would make the test fail.

## Install

From the app repo:

```bash
git clone --depth 1 https://github.com/vkukade-altir/test-swarm.git /tmp/test-swarm
mkdir -p .cursor/skills .cursor/commands
cp -R /tmp/test-swarm/skills/test-swarm .cursor/skills/test-swarm
cp /tmp/test-swarm/skills/test-swarm/commands/test-swarm.md .cursor/commands/test-swarm.md
```

Copy the **inner** `skills/test-swarm` folder, not this whole repo. Stay in the app. Then `/test-swarm`, or read `.cursor/skills/test-swarm/SKILL.md` and run.

Claude Code: `/plugin marketplace add vkukade-altir/test-swarm` then `/plugin install test-swarm@test-swarm`. Same `cp` if that fails.

Needs Jest or Vitest already. No test runner → stop; do not add packages.

## Safety

No editing the app, no merge, no force-push, no `.env`, no deleting `node_modules`. Test copies go **next to** your repo. You review the PRs.

## React and React Native

Both. Jest/Vitest on app JavaScript — not a full browser click-through, not a real phone.

**Web** — pages, forms, routing, clicks, empty/error states. Network faked. Not Playwright/Cypress.

**Native** — screens, taps, navigation. Camera, biometrics, payments SDKs faked. Not `ios/` `android/`, not system popups, not the simulator.

Styles, theme, translations, and generated types are skipped so the score stays honest.
