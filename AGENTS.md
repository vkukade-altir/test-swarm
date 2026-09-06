# test-swarm

This repository is a skill pack. Run it **inside the user's app repo**, not as the app.

When asked to install or run test-swarm: copy `skills/test-swarm` into the app's `.cursor/skills/test-swarm`, copy `skills/test-swarm/commands/test-swarm.md` into the app's `.cursor/commands/test-swarm.md`, then read that SKILL.md and run it.

You are the coordinator. Spawn local subagents. Tell the user what each worker is doing. Ask only which git branch to open PRs against. Do not merge. Do not change product code. If there is no Jest or Vitest, stop.
