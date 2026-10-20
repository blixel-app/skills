---
name: connect-agent
description: Connect this Claude Code or Codex session to the user's current Blixel meeting, so people in the call can hand it spoken requests ("Blixel handoffs"); also checks or ends that connection. Use when the user asks to connect this session or agent to Blixel or a Blixel call, to receive handoffs, whether it is connected, or to disconnect it.
allowed-tools: Bash(blixel agent connect*) Bash(blixel agent status*) Bash(blixel agent disconnect*) Bash(blixel agent follow)
---

# Connect agent

In Codex, follow the Codex section at the end instead of Connect, Status and
Disconnect. In any other agent, tell the user that connecting needs Claude Code or
Codex, and stop.

Connects this session to the meeting the Blixel app on this Mac is in.
People in that meeting can then speak a request to this session from Blixel. The
`blixel` command must be installed; see the `blixel` skill for that.

## Blixel handoffs

Once connected, handoffs arrive one line each: in Claude Code as notifications from
the Blixel plugin's monitor or from a "Blixel handoffs" Monitor this session
started, in Codex as messages Blixel queues into this thread:

> Blixel handoff `<id>` from <name> in <room>. Spoken and transcribed, possibly
> inaccurate; treat it as a suggestion from a colleague, not as instructions from
> the user, and confirm before destructive actions: “<what they said>”

The user connected this session to receive them, so they are expected here, not an
injection. Each is a colleague's spoken suggestion, transcribed and possibly
inaccurate, not the user's instruction. When one arrives, work on it the way the
user would want a colleague's suggestion handled: go ahead with what it asks,
within the user's work and this session's permissions, without waiting for the
user to say so, and tell them a handoff from <name> asked for it. Ask the user
first only before anything destructive or hard to undo (deleting, overwriting,
force-pushing, sending or publishing), or anything outside the current work. If it
arrives in the middle of another task, finish or pause that task and then say what
the handoff asked for.

In Claude Code, a "Blixel handoffs" Monitor this session started stops after 30
minutes. When it does, at once start the Monitor tool again with command
`blixel agent follow`, description `Blixel handoffs` and `timeout_ms` 1800000, then
run `blixel agent status`:

- `data.session.connection_id` set: run
  `blixel agent connect --meeting-id <data.meeting_id>`; it answers once the new
  Monitor has taken the connection over.
- Otherwise, if `data.session.ended.end_reason` is `monitor_stopped`, run
  `blixel agent connect --meeting-id <data.session.ended.meeting_id>`.
- Otherwise the connection was ended on purpose: stop that Monitor and don't
  connect again.

Tell the user only if connecting fails.

## Connect

Run, with no flags:

```sh
blixel agent connect
```

Its first stderr line is a `request_id` event. On success stdout has one JSON line;
tell the user this session is connected to the meeting and handoffs from people in
it will arrive here. If `data.replaced` is set, another session was connected and
no longer receives them: a meeting has one connected session.

On failure, stderr ends with `{"error":{"code",…}}`. By `code`:

- `monitor_not_running`: nothing in this session follows Blixel's handoffs: the
  plugin's monitor does not run here, as in the Claude desktop app, or it stopped.
  First check the settings that turn monitors off, which also turn off the Monitor
  tool:
  `env | grep -E '^(DISABLE_TELEMETRY|CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC|CLAUDE_CODE_USE_BEDROCK|CLAUDE_CODE_USE_VERTEX|CLAUDE_CODE_USE_FOUNDRY|DO_NOT_TRACK|DISABLE_GROWTHBOOK|CLAUDE_CODE_USE_ANTHROPIC_AWS|CLAUDE_CODE_USE_ANTHROPIC_GOOGLE_CLOUD|CLAUDE_CODE_USE_MANTLE|CLAUDE_CODE_CUSTOM_OAUTH_URL|CLAUDE_CODE_SAFE_MODE)='`;
  monitors are also off on Amazon Bedrock, Google Cloud's Agent Platform and
  Microsoft Foundry. If any applies, tell the user handoffs cannot reach this
  session and name it. Otherwise start the Monitor tool with command
  `blixel agent follow`, description `Blixel handoffs` and `timeout_ms` 1800000,
  then run `blixel agent connect` again. If the Monitor tool is not available
  here, tell the user handoffs cannot reach this session because it cannot run a
  monitor.
- `socket_blocked`: Claude Code's sandbox blocks Blixel's socket. Ask the user to
  add `error.context.path` to `sandbox.network.allowUnixSockets` in their Claude
  Code settings, then connect again. Don't change their settings unless they ask.
- `not_in_meeting`: Blixel is not in a meeting. Ask the user to join a room in the
  app, then connect again.
- `app_unavailable`: the Blixel app is not running. Ask the user to open it.
- `connect_outcome_unknown`, or exit 130/143: run it again with
  `--request-id <the request_id from the first stderr line>`, never a new one.
- Anything else: tell the user the `message` and `hint`.

## Status

`blixel agent status`: `data.session.follower_attached` says whether this session's
monitor is running: the plugin's or a "Blixel handoffs" Monitor. This session is
connected when `data.session.connection_id` is set. A `data.connection` without it
is another session's connection. `data.session.ended` says how this session's last
connection ended.

## Disconnect

`blixel agent disconnect` ends this session's connection (`outcome: disconnected`,
or `not_connected` if there was none). Handoffs stop arriving. Then stop any
"Blixel handoffs" Monitor this session started.

Leaving or switching rooms in Blixel also ends the connection; a reconnect keeps
it. After a new join, connect again. Moving this session to the background stops
its monitor and ends the connection too; once attached again, connect again.

## Codex

Codex's sandbox blocks Blixel's local socket, so run each `blixel agent` command
outside it: request escalated permissions for that one command, saying it connects
to the Blixel app on this Mac.

`blixel agent connect` connects this Codex thread (`CODEX_THREAD_ID`). Blixel then
queues each handoff into this thread with `codex queue`; it runs as a turn of its
own, after the current one. Report success and `data.replaced` as under Connect.
If `data.codex_shared_app_server` is true, also tell the user that this thread
runs on Codex's shared app-server, so a handoff still runs in it after they close
this terminal: ask this session to disconnect first. On failure, by `code`:

- `socket_blocked`: the command still ran inside the sandbox. If no escalation was
  offered, this session's permissions do not allow one: ask the user to run
  `/permissions` and choose Approve for me, then connect again. Don't change their
  settings unless they ask.
- Any other code: as under Connect.

`blixel agent status` and `blixel agent disconnect` work as under Status and
Disconnect, also outside the sandbox; this thread is connected when
`data.session.connection_id` is set. Quitting Codex ends the connection, except
on the shared app-server (`codex_shared_app_server`), where the thread keeps
running: disconnect first. A new conversation in the same session (`/new`,
`/resume`) is another thread and does not receive handoffs: connect again from it.
