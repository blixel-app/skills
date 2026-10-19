#!/bin/sh
# After /clear or a compaction the conversation no longer holds the skill's
# text, while the session's connection and monitor carry on: without it the
# model refuses handoffs as background notifications.
status=$(blixel agent status 2>/dev/null) || exit 0
# One JSON line with sorted keys: "session" is data's last key, and
# connection_id sits in it only while this session is connected.
case $status in
*'"session":{"claude_pid":'*',"connection_id":"'*) ;;
*) exit 0 ;;
esac
echo "This Claude Code session is connected to the user's Blixel meeting: the user ran the Blixel connect-agent skill to receive handoffs before this conversation was cleared or compacted."
sed -n '/^## Blixel handoffs$/,/^## Connect$/p' "$(dirname "$0")/../SKILL.md" | sed '1d;$d'
