#!/usr/bin/env bash
#
# Listen to the React Native JS console logs of a (non-dev / release) Android
# build:  adb logcat -c && adb logcat -s ReactNativeJS:V
#
# `logcat -c` clears the buffer first, then we tail only the ReactNativeJS tag
# at verbose level — i.e. the JS console.* output.
#
# Usage:
#   ./listen-android-logs.sh                 # stream JS logs from the only/default device
#   ./listen-android-logs.sh --list-devices  # list devices you can listen on
#   ./listen-android-logs.sh -d <deviceId>   # adb device/emulator id (see --list-devices)
#   ./listen-android-logs.sh -d              # pick from running devices interactively
#   ./listen-android-logs.sh -f <filter>     # only entries containing <filter> (literal, case-insensitive)
#   ./listen-android-logs.sh --native        # show all tags, not just ReactNativeJS
#
# Examples:
#   ./listen-android-logs.sh -f '📳V2'
#   ./listen-android-logs.sh -d emulator-5554 -f notification

set -euo pipefail

DEVICE=""
FILTER=""
PICK=0
TAG_SPEC=(-s ReactNativeJS:V)

# Interactive picker over running adb devices. Sets DEVICE. Used when -d is
# given without a value.
pick_device() {
  local vals=() labels=() serial state model
  while IFS=$'\t ' read -r serial state model; do
    [[ -z "$serial" || "$serial" == "List" ]] && continue
    [[ "$state" != "device" ]] && continue
    model=$(sed -nE 's/.*model:([^ ]+).*/\1/p' <<<"$model")
    vals+=("$serial"); labels+=("$serial ${model:+($model)}")
  done < <(adb devices -l)
  if [[ ${#vals[@]} -eq 0 ]]; then
    echo "No running devices. Try: $0 --list-devices" >&2
    exit 1
  fi
  if [[ ${#vals[@]} -eq 1 ]]; then
    DEVICE="${vals[0]}"
    echo "→ Using the only running device: ${labels[0]}" >&2
    return 0
  fi
  echo "Select a device to listen on:" >&2
  local label PS3="#? "
  select label in "${labels[@]}"; do
    if [[ -n "$label" ]]; then DEVICE="${vals[$((REPLY - 1))]}"; break; fi
    echo "Invalid choice — enter a number from the list." >&2
  done
  echo "→ Selected: $label" >&2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --list-devices) adb devices -l; exit 0 ;;
    -d)
      if [[ $# -ge 2 && "$2" != -* ]]; then DEVICE="$2"; shift 2; else PICK=1; shift; fi
      ;;
    -f) FILTER="${2:?-f needs a filter}"; shift 2 ;;
    --native) TAG_SPEC=(); shift ;;
    -h | --help) sed -n '2,19p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# -d with no value -> let the user choose from running devices.
if [[ "$PICK" -eq 1 ]]; then
  pick_device
fi

# -s <id> targets a specific device; omitted, adb uses the only connected one.
ADB=(adb)
[[ -n "$DEVICE" ]] && ADB=(adb -s "$DEVICE")

echo "→ Streaming Android JS logs${DEVICE:+ from $DEVICE} (Ctrl-C to stop)" >&2

"${ADB[@]}" logcat -c

# A log entry = one timestamped line plus continuation lines (multi-line
# messages carry no header on their continuation lines). With -f we emit the
# WHOLE entry if any of its lines matches (literal, case-insensitive), so
# messages are never truncated. fflush() keeps output real-time when piped.
if [[ -n "$FILTER" ]]; then
  FILTER_LC=$(printf '%s' "$FILTER" | tr '[:upper:]' '[:lower:]')
  exec "${ADB[@]}" logcat "${TAG_SPEC[@]}" | awk -v flt="$FILTER_LC" '
    function emit(  i) {
      if (n > 0 && hit) { for (i = 0; i < n; i++) print buf[i]; fflush() }
      n = 0; hit = 0
    }
    /^[0-9][0-9]-[0-9][0-9] [0-9][0-9]:[0-9][0-9]:[0-9][0-9]/ { emit() }
    { buf[n++] = $0; if (index(tolower($0), flt) > 0) hit = 1 }
    END { emit() }'
else
  exec "${ADB[@]}" logcat "${TAG_SPEC[@]}"
fi
