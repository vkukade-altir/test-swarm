# test-swarm

This repository is a skill pack. Run it **inside the user's app repo**, not as the app.

When asked to install or run test-swarm (including when given only this GitHub URL):

1. Stay in the **app** working directory. Clone this pack to `/tmp/test-swarm` (or similar). Do not `cd` there to work.
2. Copy `skills/test-swarm` → app `.cursor/skills/test-swarm`. Copy `skills/test-swarm/commands/test-swarm.md` → app `.cursor/commands/test-swarm.md`. Do not copy the whole git repo into `.cursor/skills/test-swarm`.
3. Read the app's `.cursor/skills/test-swarm/SKILL.md` in **this** conversation and follow it. Do not wait for a new chat.
4. Ask only which git branch to open PRs against. Spawn local subagents. Tell the user what each worker is doing. Do not merge. Do not change product code. If there is no Jest or Vitest, stop.
