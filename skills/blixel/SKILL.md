---
name: blixel
description: Work with Blixel meetings through the `blixel` CLI — sign in to a Blixel server, list and create rooms, get a room's invite link, see who is in a room, check the running app's meeting, post to its chat, share windows into it, and list, search, read, export or follow the meeting transcripts recorded on this Mac. Use when the user mentions Blixel, a Blixel room, call or meeting, wants a room made or a link to one, its chat, sharing a window into a call, or wants notes, summaries or quotes from a Blixel transcript.
---

# Blixel CLI

`blixel` talks to two things:

- **The Blixel server** (`auth`, `connection`, `room`) with the CLI's own sign-in.
- **The Blixel app on this Mac** (`meeting`, `chat`, `window`) over a local socket, and
  **the transcript database** (`transcript`) on disk.

It never launches the app, joins a room or starts transcription. Those are the
person's to do in the app; say so when a task needs them.

## Before the first command

1. `command -v blixel`. If it is missing, Blixel is installed with
   `brew install --cask blixel-app/tap/blixel` (macOS 15+, Apple silicon). Ask
   before installing.
2. `blixel schema` lists every command with its `effect` and `requires`.
   `blixel schema <group> <command>` (separate words, e.g. `blixel schema chat send`)
   gives the exact arguments, result fields, error codes and retry notes. The
   installed CLI is the authority: read its schema before using a command for the
   first time rather than guessing flags. A command missing from the schema means
   the CLI is older than this skill; suggest `brew upgrade --cask blixel`.

## Reading output

- Success: one JSON line on stdout, `{"data":…,"schema_version":1}`. Use `data`.
- Failure: one JSON line on stderr,
  `{"error":{"category","code","exit_status","message","hint"?,"context"?}}`.
  Branch on the exit status, then on `code`. `message` and `hint` are prose for
  the person.
- Don't pass `--human`; it is for people and its wording changes.
- Ids are opaque strings. An absent key means none or not applicable.
- A missing thing is an error, never an empty success. `[]` from `connection list`
  or `window list` is a real answer.

## What needs the person's go-ahead

The schema's `effect` says what a command changes:

| effect | commands | rule |
| --- | --- | --- |
| `none`, `local_state` | status, listings, reads, export, `connection use` | run freely |
| `server` | `auth login`, `auth logout`, `room create` | only when asked |
| `meeting` | `chat send`, `window share`, `window unshare` | only when asked; everyone in the call sees it |

`chat send` posts **as the person**, in their name. Send only text they wrote or
approved. If you composed it (a summary, say), show it and get a yes first.
`window share` shows a window to everyone in the call, so confirm which window
when more than one could match.

`room invite` changes nothing, but its `url` is a bearer credential: anyone
holding it can ask to join. Give it to the person. Don't post it anywhere (chat,
files, issues) unless they ask for that.

## Signing in

`blixel auth status` shows the active connection without any network call.
`not_authenticated`, `no_connections` (exit 3) or a `credential` other than
`present` means sign-in is needed.

`blixel auth login [--server URL] [--name NAME]` opens the approval page in the
default browser and waits until the person approves. The link also goes to
**stderr** right away as a `device_authorization` event. A blocking shell call would hide that link until the
command ends, so run it in the background with stderr going to a file:

```sh
blixel auth login 2>/tmp/blixel-login.err >/tmp/blixel-login.out &
```

Read the event line from the stderr file. Give the person `verification_url_complete`
and `user_code` in case the browser didn't open in front of them, and tell them
to check that the page shows that code. Then wait for the command to exit and
read its result. In an SSH session the CLI doesn't open a browser; pass
`--no-browser` when the browser would open on a machine the person isn't using.
The server defaults to `https://blixel.app`.

Never print, ask for or store a token. The CLI keeps its own credentials, and they
are separate from the app's sign-in.

## Rooms

- `blixel room list` pages with `--limit` and `--cursor`. Pass `next_cursor` back
  as-is. No `next_cursor` means the end.
- `blixel room presence <room-id>` shows who the server sees right now. Names are
  not unique, and an empty list is **not** proof the room is empty. Say "the
  server reports no one" rather than "the room is empty".
- `blixel room create <name> [--policy open|allowlist]` makes a room the account
  administers and returns it with its `id`. `--policy` defaults to `open`, so anyone
  with the link can join. `allowlist` limits entry to people the room admits.
  Ask which one the person wants if they haven't said. `invalid_room` (exit 2)
  carries the server's reasons in `message`. `forbidden` means this account may
  not create rooms. It is never retried, and after a failure with no answer
  (`server_unreachable`, exit 130/143) the room may exist, so check `room list`
  before creating again.
- `blixel room invite <room-id>` returns `{room_id, name, url}`, the room's
  current join link. It never rotates the code, so links already shared keep
  working. `forbidden` means this account may not share that room.
- `--connection <name>` picks a connection other than the active one.

## The current meeting

`blixel room current` comes first for anything about a live call:

- `state`: `idle`, `connected` or `reconnecting`. Reconnecting is still in the call.
- `meeting_id`: required by every `chat` and `window` command. It changes
  on every join and stays the same across reconnects. Read it fresh. A stale one
  fails with `meeting_mismatch` and changes nothing; don't work around that
  by swapping in the new id without checking that the person still means this call.
- `transcription.transcript_id`: the live transcript, if one is running.

`app_unavailable` means Blixel isn't running. `app_not_responding` often means
the app is showing a dialog. Ask the person to look.

## Posting to chat

```sh
blixel chat send --meeting-id "$MEETING_ID" --request-id "$(uuidgen)" -- "$TEXT"
```

- Pick the request id yourself (`uuidgen`) and keep it, so a retry can reuse it.
- `--` before the text guards text that starts with `-`. Limit: 4,000 characters.
- `outcome: "queued"` means the app accepted it and started sending. Report it as
  sent to the app, not as delivered or seen.
- Retry **with the same request id** after `send_outcome_unknown`, exit 130/143,
  `chat_busy`, `chat_unavailable` or `reconnecting`. A repeat returns
  `replayed: true` and doesn't post twice. Never retry an unknown outcome with a
  new id: that can post the message twice.

## Sharing windows

```sh
blixel window list    --meeting-id "$MEETING_ID"
blixel window share <handle>   --meeting-id "$MEETING_ID"
blixel window unshare <handle> --meeting-id "$MEETING_ID"
blixel window status  --meeting-id "$MEETING_ID"
```

- Choose by `app` and `title` from `list`. Handles are opaque and die with the
  window, the call or the app, so list again rather than reuse an old one.
- `share` is never a toggle (`already_sharing` keeps sharing). Repeating `unshare`
  is safe (`not_sharing`).
- `share_outcome_unknown` or exit 130/143: don't repeat blindly. Run `status`.
  A handle under `starting` is still in progress, so check again. Under `shares`,
  it is shared. In neither, it isn't shared.
- `publication: "pending"` means it is not yet carried by the server (reconnect
  or republish in flight).
- `permission_required` (exit 4): the first time, macOS prompts inside Blixel.
  After that the person must allow Blixel in System Settings › Privacy & Security
  › Screen Recording.

## Transcripts

Transcription runs locally in the app. These commands read the database even
when the app isn't running.

- `blixel transcript list`: newest first, with `id`, `room_name`, `started_at`.
  No `ended_at` means it is still being written.
- `blixel transcript search "words"`: finds utterances with every word.
  `--meeting <id>` limits it to one transcript.
- `blixel transcript read <id>`: speaking order, paged with `--cursor`.
- `blixel transcript export <id> --format md|jsonl|txt [--output FILE]`: the
  whole transcript in one go, best for summarising. Without `--output` it prints
  the export itself. `--output` refuses to overwrite unless `--force` (ask
  first).
- `blixel transcript follow <id> | --current`: prints JSON Lines as they are
  written and **blocks** until the transcript's `ended` record. Run it in the
  background or with a timeout. To resume, pass the last processed record's `id`
  as `--after`. Delivery is at least once (dedupe by `id`), and a final line with
  no newline was cut off.

Records: `type` is `started`, `utterance`, `gap`, `paused` or `ended`. Utterances
carry `speaker_name`, `text` and `offset_ms`. `gap` and `paused` are stretches with
no transcript (`duration_ms`). Mention them when they affect a summary rather than
implying the transcript is complete.

A transcript with no `ended` and no running meeting was cut short by a crash.
`follow` would wait forever, so `export` it instead.

For the "summarise the call" flow and other recipes, see
[references/recipes.md](references/recipes.md).

## Errors

| exit | category | what to do |
| --- | --- | --- |
| 2 | usage | Fix the command. `context.valid` lists the choices. Check `blixel schema`. |
| 3 | authentication | Sign in (above). |
| 4 | authorization | `forbidden`: this account can't see it. `permission_required`: see sharing. |
| 5 | unavailable | Read `code`. Most mean "not now" (app closed, not in a meeting, reconnecting). |
| 6 | incompatible | The app and CLI versions differ. Suggest `brew upgrade --cask blixel`. |
| 7 | storage | `secret_store_unavailable` (e.g. over SSH): sign in again with `BLIXEL_TOKEN_STORAGE=file`. |
| 130/143 | cancelled | Interrupted. For chat or window, treat it as an unknown outcome. |
