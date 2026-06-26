#!/usr/bin/env bash
#
# Send a test push notification to a device via the Expo push API.
# Used while developing notification handling — see
# docs/notification-rewrite-context.md.
#
# Grab the device token from the app: Debug screen -> "Copy notification token"
# (it copies an ExponentPushToken[...]).
#
# Usage:
#   ./send-test-notif.sh <token> <silent|system> [--ack]
#
# Or set the token once and just pass the mode:
#   export EXPO_PUSH_TOKEN="ExponentPushToken[xxx]"
#   ./send-test-notif.sh silent
#   ./send-test-notif.sh system --ack
#
# silent  -> data-only: no title/body. Routes to the Android background task;
#            _contentAvailable wakes iOS in the background.
# system  -> visible tray notification (also hits the foreground listener when
#            the app is open).
#
# Tail the device while testing:  adb logcat | grep '📳V2'

set -euo pipefail

usage() {
  echo "Usage: $0 <token> <silent|system> [--ack]" >&2
  echo "   or: EXPO_PUSH_TOKEN=... $0 <silent|system> [--ack]" >&2
}

ACKNOWLEADGE_ON_RECEIVE=false
ARGS=()

for ARG in "$@"; do
  case "$ARG" in
    --ack)
      ACKNOWLEADGE_ON_RECEIVE=true
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    --*)
      echo "Unknown option '$ARG'." >&2
      usage
      exit 1
      ;;
    *)
      ARGS+=("$ARG")
      ;;
  esac
done

# Allow `./send-test-notif.sh <mode>` with the token coming from $EXPO_PUSH_TOKEN.
if [[ "${ARGS[0]:-}" == "silent" || "${ARGS[0]:-}" == "system" ]]; then
  if [[ "${#ARGS[@]}" -gt 1 ]]; then
    echo "Too many arguments." >&2
    usage
    exit 1
  fi

  TOKEN="${EXPO_PUSH_TOKEN:-}"
  MODE="${ARGS[0]}"
else
  if [[ "${#ARGS[@]}" -gt 2 ]]; then
    echo "Too many arguments." >&2
    usage
    exit 1
  fi

  TOKEN="${ARGS[0]:-${EXPO_PUSH_TOKEN:-}}"
  MODE="${ARGS[1]:-system}"
fi

if [[ -z "$TOKEN" ]]; then
  echo "No token. Pass one as the first arg or set EXPO_PUSH_TOKEN." >&2
  usage
  exit 1
fi

case "$MODE" in
  silent | system) ;;
  *)
    echo "Mode must be 'silent' or 'system' (got '$MODE')." >&2
    exit 1
    ;;
esac

if [[ "$TOKEN" != ExponentPushToken\[* ]]; then
  echo "⚠️  Token doesn't look like an ExponentPushToken[...] — sending anyway." >&2
fi

SENT_AT="$(date +%s)"
DATA_STRING="{\\\"acknowleadgeOnReceive\\\":\\\"$ACKNOWLEADGE_ON_RECEIVE\\\",\\\"_tag\\\":\\\"DebugDummyNotificationData\\\"}"

if [[ "$MODE" == "silent" ]]; then
  read -r -d '' BODY <<JSON || true
{
  "to": "$TOKEN",
  "priority": "high",
  "_contentAvailable": true,
  "data": {
    "acknowleadgeOnReceive": "$ACKNOWLEADGE_ON_RECEIVE",
    "_tag": "DebugDummyNotificationData",
    "dataString": "$DATA_STRING"
  }
}
JSON
else
  read -r -d '' BODY <<JSON || true
{
  "to": "$TOKEN",
  "title": "V2 $MODE test",
  "body": "hello from send-test-notif.sh ($SENT_AT)",
  "priority": "high",
  "data": {
    "acknowleadgeOnReceive": "$ACKNOWLEADGE_ON_RECEIVE",
    "_tag": "DebugDummyNotificationData",
    "dataString": "$DATA_STRING"
  }
}
JSON
fi

echo "→ Sending $MODE notification to ${TOKEN:0:24}… ack=$ACKNOWLEADGE_ON_RECEIVE" >&2

RESPONSE="$(curl -sS -X POST https://exp.host/--/api/v2/push/send \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d "$BODY")"

if command -v jq >/dev/null 2>&1; then
  echo "$RESPONSE" | jq .
else
  echo "$RESPONSE"
fi

# Expo replies with a ticket: {"data":{"status":"ok",...}}. A "status":"error"
# with "DeviceNotRegistered" means the token is stale — re-copy it from the app.
