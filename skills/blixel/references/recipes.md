# Recipes

`$PID` is `participation_id` from `blixel room current`, read fresh each time.

## Summarise a call

1. Find it. Use `room current` → `transcription.transcript_id` for the call in
   progress, or `transcript list` to match `room_name` and `started_at` for a past
   call.
2. `blixel transcript export <id> --format md`. This is the whole transcript as
   of now in one read.
3. Summarise: decisions, action items with owners, open questions. Attribute by
   `speaker_name`, and say where `gap` or `paused` stretches left holes.
4. If the person wants it in the call's chat, show the text, get a yes, then
   `chat send` with a fresh `uuidgen` request id. Check that `room current` still
   shows the same `participation_id` first.

## Find what was said about something

`blixel transcript search "every word"` across all transcripts, newest first.
Each hit has `meeting_id` and `offset_ms`. For context around a hit,
`transcript read <meeting_id>` and page to the nearby `offset_ms`. Quote
`speaker_name` and the time (`at`).

## Watch a live call

```sh
blixel transcript follow --current > /tmp/blixel-follow.jsonl 2>/tmp/blixel-follow.err &
```

Read the file as it grows. Each line is a record with a numeric `id`, so track
the last one handled. If the watcher is restarted, use
`follow <transcript_id> --after <last id>` rather than `--current`, which would
pick whatever call is live by then. It exits by itself after `ended`. Stop it
with SIGINT when no longer needed.

## Share a window

1. `blixel window list --participation-id "$PID"`.
2. Match the person's description against `app` and `title`. If several match
   or none do, show the candidates and ask.
3. `blixel window share <handle> --participation-id "$PID"` → `started` or
   `already_sharing`.
4. Confirm with `window status`: `publication: "live"` means others are seeing it.

To stop everything shared, take `shares` from `window status` and run
`window unshare` for each handle.

## Who is in a room

`blixel room list` → find the room by `name` → `blixel room presence <id>`.
Report the names and the `observed_at` time. If no one is listed, say the server
reports no one, not that the room is empty.

## Make a room and hand out its link

1. Check `blixel room list` for a room with that name already. Names aren't
   unique, so ask before making a second one.
2. `blixel room create "<name>"`, with `--policy allowlist` if only admitted
   people should get in. Keep `id` from the result.
3. `blixel room invite <id>` → give the person `url`. Post it somewhere else only
   if they ask: anyone holding it can ask to join.

The CLI can't join the room. The person opens the link, or picks the room in the
app.

## Switch servers

`blixel connection list` shows each connection's `name`, `server` and `active`.
Use `--connection <name>` for one command, or `blixel connection use <name>` to
change the default (a local change, but tell the person).
