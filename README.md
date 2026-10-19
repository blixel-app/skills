# Blixel skills

Agent skills for [Blixel](https://blixel.app). They work with Claude Code, Codex
and any other agent that reads `SKILL.md` skills.

| Skill | What it does |
| --- | --- |
| [`blixel`](skills/blixel/SKILL.md) | Uses the `blixel` CLI to list rooms and who is in them, check the current meeting, post to its chat, share windows into it, and search, read, export or follow transcripts. |
| [`connect-agent`](skills/connect-agent/SKILL.md) | Connects a Claude Code or Codex session to your current Blixel meeting, so people in the call can hand it spoken requests. |

## Requirements

Blixel 0.12 or later, which puts the `blixel` command on your `PATH`:

```sh
brew install --cask blixel-app/tap/blixel
```

## Install

Claude Code:

```sh
claude plugin marketplace add blixel-app/skills
claude plugin install blixel@blixel-app
```

Codex:

```sh
codex plugin marketplace add blixel-app/skills
codex plugin add blixel@blixel-app
```

Any other agent that reads `SKILL.md` skills:

```sh
npx skills add blixel-app/skills
```

Or copy `skills/blixel` into the agent's skills folder.

## Then ask your agent

- "Summarise my last Blixel call and post the action items to the chat."
- "Who's in the design room right now?"
- "Share my Figma window into the call."
- "What did we decide about the release in yesterday's standup?"

The agent asks before anything that others in the call will see: chat messages
and window sharing.

## Connecting Claude Code or Codex to a call

Run `/blixel:connect-agent` in the Claude Code session that should take requests
while Blixel is in a meeting. People in the call can then speak a request to it
from Blixel; each arrives in that session as a "Blixel handoff" line, framed as a
colleague's suggestion rather than your instruction, and the agent asks you before
anything destructive. A meeting has one connected session: connecting another
replaces it. Leaving the room ends the connection.

The plugin's monitor delivers the handoffs, so the session needs Claude Code
monitors: they don't run when `DISABLE_TELEMETRY` or
`CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set, or on Amazon Bedrock, Google
Cloud's Agent Platform or Microsoft Foundry. If the session's monitor has stopped,
restart Claude Code. With Claude Code's Bash sandbox on, add the socket path that
`blixel agent connect` reports to `sandbox.network.allowUnixSockets`.

In Codex, ask the session to connect to the Blixel call. Start it with
`--no-daemon`: Blixel cannot tell when a session on Codex's shared app-server
closes, so it refuses to connect one. Blixel queues each handoff into that thread
with `codex queue`, and Codex runs it after any turn in progress. Codex's sandbox
blocks Blixel's local socket, so approve running `blixel agent` outside the
sandbox when Codex asks; that needs an approval policy that asks, such as
`-a on-request`. Quitting Codex ends the connection.

## Releasing

Each platform has its own manifests, and both point at the same `skills/`:

| | Marketplace | Plugin |
| --- | --- | --- |
| Claude Code | `.claude-plugin/marketplace.json` | `.claude-plugin/plugin.json` |
| Codex | `.agents/plugins/marketplace.json` | `.codex-plugin/plugin.json` |

Installs are cached by `version`, so raise it in both `plugin.json` files
together, or users of one platform keep the old skill.
