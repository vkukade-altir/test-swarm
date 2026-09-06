# test-swarm

Read and follow the test-swarm skill (`.cursor/skills/test-swarm/SKILL.md`, or `~/.cursor/skills/test-swarm/SKILL.md`).

You are the coordinator. You must spawn local subagents for each slice. Do not write all tests in this chat. Tell the user what each worker is doing, in product words, as you go.

Ask **only** which git branch to open PRs against. Then run the swarm. Do not merge. Do not change product code. If Jest and Vitest are both missing, stop.

**Workers:** default **10**. A number in this message (`/test-swarm 4`, `/test-swarm 20`) always wins. Do not ask how many.
