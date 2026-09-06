# test-swarm

Read and follow the test-swarm skill (`.cursor/skills/test-swarm/SKILL.md`, or `~/.cursor/skills/test-swarm/SKILL.md`). If that file is missing, follow the README install (GitHub URL → clone → copy inner `skills/test-swarm`), **then** read the skill.

If the workspace root is not a git repo, look one level down for `package.json` + `.git` and work there. Install first. Then ask the PR base branch. Then check for Jest/Vitest.

You are the coordinator. You must spawn local subagents for each slice. Do not write all tests in this chat. Tell the user what each worker is doing, in product words, as you go.

Ask **only** which git branch to open PRs against. Then run the swarm. Do not merge. Do not change product code. After install, if Jest and Vitest are both missing, stop.

**Workers:** default **10**. A number in this message (`/test-swarm 4`, `/test-swarm 20`) always wins. Do not ask how many.
