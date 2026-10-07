# Blixel skills

Agent skills for [Blixel](https://blixel.app). They work with Claude Code, Codex
and any other agent that reads `SKILL.md` skills.

| Skill | What it does |
| --- | --- |
| [`blixel`](skills/blixel/SKILL.md) | Uses the `blixel` CLI to list rooms and who is in them, check the current meeting, post to its chat, share windows into it, and search, read, export or follow transcripts. |

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

## Releasing

Each platform has its own manifests, and both point at the same `skills/`:

| | Marketplace | Plugin |
| --- | --- | --- |
| Claude Code | `.claude-plugin/marketplace.json` | `.claude-plugin/plugin.json` |
| Codex | `.agents/plugins/marketplace.json` | `.codex-plugin/plugin.json` |

Installs are cached by `version`, so raise it in both `plugin.json` files
together, or users of one platform keep the old skill.
