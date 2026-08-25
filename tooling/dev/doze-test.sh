#!/usr/bin/env bash
# Interactive tester for the vexl background notification socket (Doze & co).
#
# Drives a connected Android device over adb: force/unforce Doze, toggle
# airplane mode, kill the app process, and watch the socket service react.
# Usage: tooling/dev/doze-test.sh [device-serial]   (default: first adb device)
set -euo pipefail

PKG=it.vexl.nextstaging
WAKE_TAG=backgroundnotificationsocket.WAKE

DEVICE=${1:-$(adb devices | awk 'NR>1 && $2=="device" {print $1; exit}')}
if [ -z "$DEVICE" ]; then
  echo "No adb device found." >&2
  exit 1
fi
ADB="adb -s $DEVICE"

status() {
  echo "── device ────────────────────────────────────────────"
  echo "serial: $DEVICE  time: $($ADB shell date +%T)"
  echo "doze:   $($ADB shell dumpsys deviceidle get deep)"
  echo "── app / service ─────────────────────────────────────"
  local pid
  pid=$($ADB shell pidof "$PKG" | tr -d '[:space:]' || true)
  echo "pid:    ${pid:-<not running>}"
  $ADB shell dumpsys activity services "$PKG" 2>/dev/null |
    grep -E "isForeground=|createTime" | sed 's/^ */        /' || true
  echo "── notification ──────────────────────────────────────"
  $ADB shell dumpsys notification --noredact 2>/dev/null |
    grep -A30 "NotificationRecord.*|239|" |
    grep -E "android.title=|android.text=" | sed 's/^ */        /' ||
    echo "        NOT POSTED (dismissed or service down)"
  echo "── wake alarm ────────────────────────────────────────"
  $ADB shell dumpsys alarm 2>/dev/null | grep -A3 "$WAKE_TAG" |
    grep -oE "whenElapsed=\+[0-9]+m[0-9]+s" | head -1 ||
    echo "        no wake alarm scheduled"
  echo "── last socket log lines ─────────────────────────────"
  $ADB logcat -d -s VexlBackgroundSocket 2>/dev/null | tail -3
}

wait_for_alarm_fire() {
  echo "Watching the wake alarm. Leave the device alone: any app start or"
  echo "process kill re-arms the alarm and restarts the countdown."
  echo "The alarm fired when the countdown jumps back up. Ctrl-C to stop."
  local prev=999 mins
  while true; do
    mins=$($ADB shell dumpsys alarm 2>/dev/null | grep -A3 "$WAKE_TAG" |
      grep -oE "whenElapsed=\+[0-9]+m" | head -1 | grep -oE "[0-9]+" || true)
    echo "$(date +%T) remaining=${mins:-?}m"
    if [ -n "$mins" ] && [ "$prev" -le 2 ] && [ "$mins" -ge 10 ]; then
      echo "ALARM FIRED AND RE-ARMED ✅"
      $ADB logcat -d -s VexlBackgroundSocket 2>/dev/null | tail -3
      return
    fi
    prev=${mins:-999}
    sleep 60
  done
}

kill_app() {
  local pid
  pid=$($ADB shell pidof "$PKG" | tr -d '[:space:]' || true)
  if [ -z "$pid" ]; then
    echo "App not running."
    return
  fi
  $ADB shell "run-as $PKG kill -9 $pid" || true
  echo -n "Killed pid $pid, waiting for sticky restart"
  while true; do
    local newpid
    newpid=$($ADB shell pidof "$PKG" | tr -d '[:space:]' || true)
    if [ -n "$newpid" ] && [ "$newpid" != "$pid" ]; then
      echo " → resurrected as pid $newpid ✅"
      return
    fi
    echo -n "."
    sleep 3
  done
}

echo "vexl background socket tester — device $DEVICE"
while true; do
  cat <<'MENU'

  1) status                    5) airplane mode OFF
  2) force deep Doze           6) kill app process (resurrection test)
  3) unforce Doze              7) wait for wake alarm to fire
  4) airplane mode ON          8) tail socket logs (Ctrl-C to stop)
  q) quit (unforces Doze)
MENU
  read -r -p "> " choice
  case "$choice" in
    1) status ;;
    2) $ADB shell dumpsys deviceidle force-idle deep ;;
    3) $ADB shell dumpsys deviceidle unforce ;;
    4) $ADB shell cmd connectivity airplane-mode enable ;;
    5) $ADB shell cmd connectivity airplane-mode disable ;;
    6) kill_app ;;
    7) wait_for_alarm_fire ;;
    8) $ADB logcat -s VexlBackgroundSocket || true ;;
    q)
      $ADB shell dumpsys deviceidle unforce >/dev/null || true
      exit 0
      ;;
    *) echo "?" ;;
  esac
done
