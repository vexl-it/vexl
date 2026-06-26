#!/usr/bin/env bash
#
# Listen to the React Native JS console logs of a (non-dev / release) iOS build,
# the iOS counterpart of:  adb logcat -c && adb logcat -s ReactNativeJS:V
#
# React Native writes to the iOS unified log via RCTLog (see node_modules/
# react-native/React/Base/RCTLog.mm) using os_log under subsystem
# "com.facebook.react.log". console.* therefore shows up as logs emitted by the
# React framework binary, tagged "(React)" in the device syslog.
#
#   Simulator -> `simctl spawn ... log stream` filtered by that subsystem.
#   Device    -> `idevicesyslog` (libimobiledevice) filtered to "(React)" lines.
#
# NOTE (device): the iPhone must be UNLOCKED — iOS suppresses third-party app
# os_log output while locked, so you'll see nothing until you unlock it.
#
# NOTE (truncation): this script never truncates — full multi-line messages are
# kept, and -f matches whole entries (not single lines). BUT iOS os_log itself
# caps one message at ~1 KB, so a console.* longer than that is truncated by the
# OS *before* any listener sees it (confirmed: a 2.4 KB payload cut at ~1021 B).
# This is unavoidable on release builds. To see long logs in full, use a dev
# build + Metro (those bypass os_log) or split the log call to stay under ~1 KB.
#
# NOTE (device ids): idevicesyslog uses the usbmuxd UDID (40-char, e.g.
# 00008140-...), which is DIFFERENT from the CoreDevice UUID shown by
# `xcrun devicectl list devices`. Always take the id from --list-devices below.
#
# Usage:
#   ./listen-ios-logs.sh                 # auto: booted simulator, else the connected device
#   ./listen-ios-logs.sh --list-devices  # list simulators + devices you can listen on
#   ./listen-ios-logs.sh -d <id>         # simulator UDID / "booted" / device UDID
#   ./listen-ios-logs.sh -d              # pick from running devices interactively
#   ./listen-ios-logs.sh -f <filter>     # only entries containing <filter> (literal, case-insensitive)
#   ./listen-ios-logs.sh --native        # all app logs, not just React Native
#
# Examples:
#   ./listen-ios-logs.sh -f '📳V2'
#   ./listen-ios-logs.sh -d 00008140-001610CA0E10801C -f notification

set -euo pipefail

DEVICE=""
FILTER=""
NATIVE=0
PICK=0

list_devices() {
  echo "== Booted simulators (use the UDID or \"booted\" with -d) =="
  xcrun simctl list devices booted 2>/dev/null | grep -E "Booted" || echo "  (none booted)"
  echo
  echo "== Connected devices (use the UDID with -d) =="
  if command -v idevice_id >/dev/null 2>&1; then
    local any=0
    for udid in $(idevice_id -l 2>/dev/null); do
      any=1
      printf "  %s  %s\n" "$udid" "$(ideviceinfo -u "$udid" -k DeviceName 2>/dev/null || echo '?')"
    done
    if [[ $any -eq 0 ]]; then echo "  (none connected)"; fi
  else
    echo "  (idevicesyslog not installed — \`brew install libimobiledevice\`)"
  fi
  return 0
}

# Interactive picker over running devices (booted simulators + connected
# devices). Sets DEVICE. Used when -d is given without a value.
pick_device() {
  local vals=() labels=() udid name
  while IFS= read -r line; do
    udid=$(grep -oE '[0-9A-Fa-f-]{36}' <<<"$line" | head -1)
    [[ -z "$udid" ]] && continue
    name=$(sed -E 's/^[[:space:]]*(.*) \([0-9A-Fa-f-]{36}\).*/\1/' <<<"$line")
    vals+=("$udid"); labels+=("[sim]    $name ($udid)")
  done < <(xcrun simctl list devices booted 2>/dev/null | grep -E "Booted")
  if command -v idevice_id >/dev/null 2>&1; then
    for udid in $(idevice_id -l 2>/dev/null); do
      name=$(ideviceinfo -u "$udid" -k DeviceName 2>/dev/null | sed -e 's/[[:space:]]*$//')
      vals+=("$udid"); labels+=("[device] ${name:-?} ($udid)")
    done
  fi
  if [[ ${#vals[@]} -eq 0 ]]; then
    echo "No running simulators or connected devices. Try: $0 --list-devices" >&2
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
    --list-devices) list_devices; exit 0 ;;
    -d)
      if [[ $# -ge 2 && "$2" != -* ]]; then DEVICE="$2"; shift 2; else PICK=1; shift; fi
      ;;
    -f) FILTER="${2:?-f needs a filter}"; shift 2 ;;
    --native) NATIVE=1; shift ;;
    -h | --help) sed -n '2,38p' "$0" | sed 's/^# \{0,1\}//'; exit 0 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

# -d with no value -> let the user choose from running devices.
if [[ "$PICK" -eq 1 ]]; then
  pick_device
fi

# Default device: a booted simulator if any, otherwise the one connected device.
if [[ -z "$DEVICE" ]]; then
  if xcrun simctl list devices booted 2>/dev/null | grep -q "Booted"; then
    DEVICE="booted"
  elif command -v idevice_id >/dev/null 2>&1 && [[ -n "$(idevice_id -l 2>/dev/null)" ]]; then
    DEVICE="$(idevice_id -l 2>/dev/null | head -1)"
  else
    echo "No booted simulator or connected device. Try: $0 --list-devices" >&2
    exit 1
  fi
fi

is_simulator() {
  [[ "$1" == "booted" ]] && return 0
  xcrun simctl list devices 2>/dev/null | grep -qF "$1"
}

if is_simulator "$DEVICE"; then
  # Simulator: filter the unified log by the React Native subsystem.
  if [[ "$NATIVE" -eq 1 ]]; then
    PREDICATE='process BEGINSWITH[c] "Vexl"'
  else
    PREDICATE='subsystem == "com.facebook.react.log"'
  fi
  [[ -n "$FILTER" ]] && PREDICATE="$PREDICATE && eventMessage CONTAINS[c] \"$FILTER\""
  echo "→ Streaming iOS logs from simulator '$DEVICE' (Ctrl-C to stop)" >&2
  exec xcrun simctl spawn "$DEVICE" log stream \
    --level debug --style compact --predicate "$PREDICATE"
fi

# Physical device: idevicesyslog firehose, kept to the app's log entries.
# An entry's first line carries the "(React)" / "Vexl…" tag; its continuation
# lines (multi-line messages) do not, so an awk state machine keeps both.
if ! command -v idevicesyslog >/dev/null 2>&1; then
  echo "idevicesyslog not found. Install it: brew install libimobiledevice" >&2
  exit 1
fi
if [[ "$NATIVE" -eq 1 ]]; then
  PAT='^Vexl'        # any log emitted by the app process
else
  PAT='\(React\)'    # React Native logs only (JS console.* + RN native)
fi
echo "→ Streaming iOS logs from device '$DEVICE' (must be UNLOCKED; Ctrl-C to stop)" >&2
STREAM=(idevicesyslog -u "$DEVICE")
# A log entry = one timestamped line plus any continuation lines (multi-line
# messages have no tag/timestamp on the continuation lines). We never split an
# entry: with -f we emit the WHOLE entry if any of its lines matches (literal,
# case-insensitive), so messages are never truncated. fflush() keeps output
# real-time even when the pipeline is redirected/piped.
TS_RE='/^[A-Za-z]{3}[ ]+[0-9]+[ ][0-9][0-9]:[0-9][0-9]:[0-9][0-9]/'
if [[ -n "$FILTER" ]]; then
  FILTER_LC=$(printf '%s' "$FILTER" | tr '[:upper:]' '[:lower:]')
  exec "${STREAM[@]}" | awk -v pat="$PAT" -v flt="$FILTER_LC" '
    function emit(  i) {
      if (n > 0 && keep && hit) { for (i = 0; i < n; i++) print buf[i]; fflush() }
      n = 0; hit = 0
    }
    '"$TS_RE"' { emit(); keep = ($4 ~ pat) }
    { buf[n++] = $0; if (index(tolower($0), flt) > 0) hit = 1 }
    END { emit() }'
else
  exec "${STREAM[@]}" | awk -v pat="$PAT" '
    '"$TS_RE"' { show = ($4 ~ pat) }
    show { print; fflush() }'
fi
