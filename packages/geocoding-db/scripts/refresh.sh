#!/bin/sh
# Fully automated refresh of the geocoding dataset — run it with no arguments
# (`pnpm refresh:geocoding`) and it downloads, transforms, uploads and swaps
# the dataset in one go, logging progress as it works. The same script backs
# the local/dev seeding so it stays continuously tested.
#
# Stages (default: all three, in order):
#   fetch    download raw Geofabrik extracts + Natural Earth boundaries
#   extract  osmium-filter raw extracts into places-/pois-/streets- files
#   ingest   load filtered files into Postgres (atomic table swap: the live
#            dataset is replaced completely or not at all — any failure leaves
#            the previous dataset serving)
#
# Raw and filtered files are both kept under the data dir so any stage can be
# re-run alone (e.g. tweak filtering, then `refresh.sh extract ingest`).
#
#   data/raw/<region>-latest.osm.pbf(.ok)   raw extracts (.ok = validated)
#   data/filtered/{places,pois,streets}-<region>.osm.pbf
#   data/ne_countries.geojson
#   data/refresh.log                        progress log, appended per run
#
# Usage: refresh.sh [-c config-file] [-d data-dir] [-r region]... [stage]...
#   -c  config file with the access keys (KEY=value lines, shell-sourced);
#       defaults to the package's .env when it exists (see .env.example).
#       Variables already set in the environment take precedence.
#   -r  Geofabrik region path, repeatable; e.g. -r europe -r north-america,
#       or a sub-region like -r europe/slovakia (default: the 8 continents)
#
# The ingest stage needs GEOCODING_DB_URL, GEOCODING_DB_USER and
# GEOCODING_DB_PASSWORD (from the config file or the environment). Set
# SLACK_ALERT_WEBHOOK_URL to get a Slack message when the run finishes or
# fails; leave it unset for dev/local runs. Requires: curl, osmium
# (https://osmcode.org/osmium-tool/), pnpm.
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DATA_DIR="$SCRIPT_DIR/../data"
CONFIG_FILE=""
REGIONS=""

# set -e makes every failure (bad download, corrupt extract, osmium error,
# ingest abort) exit non-zero, so one EXIT trap catches them all. CURRENT_STEP
# tracks what was running so the alert says where it broke.
CURRENT_STEP="startup"
on_exit() {
  status=$?
  if [ "$status" -ne 0 ]; then
    log "!!! refresh failed at: $CURRENT_STEP (exit $status)"
    slack_notify ":rotating_light: geocoding dataset refresh failed: $CURRENT_STEP (exit $status)"
  fi
}
trap on_exit EXIT

slack_notify() {
  [ -n "${SLACK_ALERT_WEBHOOK_URL:-}" ] || return 0
  curl -sS --max-time 10 -X POST -H 'Content-type: application/json' \
    --data "{\"text\":\"$1\"}" "$SLACK_ALERT_WEBHOOK_URL" || true
}

# Progress log: timestamped, on stdout and appended to data/refresh.log
# (LOG_FILE is set after the data dir exists; until then stdout only).
LOG_FILE=""
log() {
  line="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$line"
  [ -n "$LOG_FILE" ] && echo "$line" >> "$LOG_FILE" || true
}

# Loads access keys from the config file without overriding variables that are
# already set in the environment (so ad-hoc overrides keep working).
load_config() {
  [ -f "$1" ] || return 0
  _url=${GEOCODING_DB_URL:-} _user=${GEOCODING_DB_USER:-}
  _pass=${GEOCODING_DB_PASSWORD:-} _hook=${SLACK_ALERT_WEBHOOK_URL:-}
  set -a
  # shellcheck disable=SC1090 # the config path is user-supplied by design
  . "$1"
  set +a
  [ -n "$_url" ] && GEOCODING_DB_URL=$_url
  [ -n "$_user" ] && GEOCODING_DB_USER=$_user
  [ -n "$_pass" ] && GEOCODING_DB_PASSWORD=$_pass
  [ -n "$_hook" ] && SLACK_ALERT_WEBHOOK_URL=$_hook
  return 0
}

while getopts c:d:r: opt; do
  case $opt in
    c) CONFIG_FILE=$OPTARG ;;
    d) DATA_DIR=$OPTARG ;;
    r) REGIONS="$REGIONS $OPTARG" ;;
    *) exit 2 ;;
  esac
done
shift $((OPTIND - 1))
STAGES="${*:-fetch extract ingest}"
# A mistyped stage (or an option after the first stage — getopts stops at the
# first positional) would otherwise no-op the whole run and report success.
for stage in $STAGES; do
  case $stage in
    fetch | extract | ingest) ;;
    *)
      echo "!!! unknown stage: $stage (valid stages: fetch extract ingest)" >&2
      exit 2
      ;;
  esac
done
# The ingest stage cd's into the package dir, so a relative -d path must be
# made absolute before any stage records it.
mkdir -p "$DATA_DIR"
DATA_DIR=$(cd "$DATA_DIR" && pwd)
[ -n "$REGIONS" ] || REGIONS="africa antarctica asia australia-oceania central-america europe north-america south-america"

[ -n "$CONFIG_FILE" ] || CONFIG_FILE="$SCRIPT_DIR/../.env"
load_config "$CONFIG_FILE"

RAW_DIR="$DATA_DIR/raw"
FILTERED_DIR="$DATA_DIR/filtered"
mkdir -p "$RAW_DIR" "$FILTERED_DIR"
LOG_FILE="$DATA_DIR/refresh.log"

log "=== refresh started: stages [$STAGES], regions [$REGIONS]"

# Region paths may contain slashes (europe/slovakia) — flatten for filenames.
slug() { echo "$1" | tr / -; }
has_stage() { case " $STAGES " in *" $1 "*) return 0 ;; *) return 1 ;; esac; }

# A raw file validated within this window is reused instead of re-downloaded,
# which makes a crashed fetch resumable without ever serving week-old data.
# Overridable for dev seeding, where a weeks-old extract is perfectly fine.
FRESH_MINUTES=${FRESH_MINUTES:-$((20 * 60))}

if has_stage fetch; then
  if [ ! -f "$DATA_DIR/ne_countries.geojson" ]; then
    CURRENT_STEP="downloading Natural Earth country boundaries"
    log "=== downloading Natural Earth country boundaries"
    # Download to a temp file and validate before moving into place, so a
    # failed or truncated download is never cached as the real file.
    ne_tmp="$DATA_DIR/ne_countries.geojson.tmp"
    rm -f "$ne_tmp"
    curl -sSL --fail --retry 3 -o "$ne_tmp" \
      "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_0_countries.geojson"
    NE_TMP="$ne_tmp" node -e 'JSON.parse(require("fs").readFileSync(process.env.NE_TMP, "utf8"))'
    mv "$ne_tmp" "$DATA_DIR/ne_countries.geojson"
  fi
  for region in $REGIONS; do
    raw="$RAW_DIR/$(slug "$region")-latest.osm.pbf"
    if [ -f "$raw.ok" ] && [ -n "$(find "$raw.ok" -mmin "-$FRESH_MINUTES" 2>/dev/null)" ]; then
      log "=== $region: raw extract is fresh, skipping fetch"
      continue
    fi
    CURRENT_STEP="downloading $region"
    log "=== $region: downloading"
    # Never resume a partial file (no -C) — Geofabrik rebuilds "latest" daily,
    # and resuming across builds splices a corrupt PBF; each retry re-downloads
    # from scratch. --speed-limit/--speed-time abort (and retry) a stall.
    rm -f "$raw" "$raw.ok"
    curl -sL --fail --retry 10 --retry-all-errors --speed-limit 10240 --speed-time 60 \
      -o "$raw" "https://download.geofabrik.de/$region-latest.osm.pbf"
    osmium fileinfo "$raw" > /dev/null
    touch "$raw.ok"
    log "=== $region: downloaded and validated"
  done
fi

if has_stage extract; then
  for region in $REGIONS; do
    s=$(slug "$region")
    raw="$RAW_DIR/$s-latest.osm.pbf"
    if [ ! -f "$raw.ok" ]; then
      CURRENT_STEP="extracting $region (no validated raw extract)"
      echo "!!! $region: no validated raw extract at $raw — run the fetch stage first" >&2
      exit 1
    fi
    CURRENT_STEP="extracting $region"
    log "=== $region: extracting settlements"
    osmium tags-filter "$raw" n/place \
      -o "$FILTERED_DIR/places-$s.osm.pbf" --overwrite
    log "=== $region: extracting POIs"
    osmium tags-filter "$raw" \
      nwr/amenity=cafe,restaurant,pub,bar,fast_food \
      nwr/leisure=park,garden \
      nwr/tourism=attraction,museum \
      -o "$FILTERED_DIR/pois-$s.osm.pbf" --overwrite
    log "=== $region: extracting streets"
    osmium tags-filter "$raw" \
      w/highway=residential,living_street,pedestrian,primary,secondary,tertiary,unclassified \
      -o "$FILTERED_DIR/streets-$s.osm.pbf" --overwrite
  done
fi

if has_stage ingest; then
  CURRENT_STEP="ingesting: $REGIONS"
  # Explicit check instead of ${VAR:?} — a :? failure bypasses the EXIT trap's
  # status propagation in bash 3.2 (macOS /bin/sh), silently exiting 0
  if [ -z "${GEOCODING_DB_URL:-}" ] || [ -z "${GEOCODING_DB_USER:-}" ] || [ -z "${GEOCODING_DB_PASSWORD:-}" ]; then
    echo "!!! ingest stage needs GEOCODING_DB_URL, GEOCODING_DB_USER and GEOCODING_DB_PASSWORD (set them in $CONFIG_FILE or the environment)" >&2
    exit 1
  fi
  files=""
  for region in $REGIONS; do
    s=$(slug "$region")
    files="$files $FILTERED_DIR/places-$s.osm.pbf $FILTERED_DIR/pois-$s.osm.pbf $FILTERED_DIR/streets-$s.osm.pbf"
  done
  log "=== ingesting: $REGIONS"
  cd "$SCRIPT_DIR/.."
  # shellcheck disable=SC2086 # word-splitting of $files is intended
  NODE_OPTIONS=--max-old-space-size=8192 \
    pnpm ingest:geocoding --countries "$DATA_DIR/ne_countries.geojson" $files
fi

log "=== done: $STAGES"
slack_notify ":white_check_mark: geocoding dataset refresh completed: stages [$STAGES], regions [$REGIONS]"
