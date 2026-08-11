#!/bin/sh
# Periodic refresh of the places dataset — the server cron entrypoint, and the
# same script used for local/dev runs so it stays continuously tested.
#
# Stages (default: all three, in order):
#   fetch    download raw Geofabrik extracts + Natural Earth boundaries
#   extract  osmium-filter raw extracts into places-/pois-/streets- files
#   ingest   load filtered files into Postgres (atomic table swap)
#
# Raw and filtered files are both kept under the data dir so any stage can be
# re-run alone (e.g. tweak filtering, then `refresh-places.sh extract ingest`).
#
#   data/raw/<region>-latest.osm.pbf(.ok)   raw extracts (.ok = validated)
#   data/filtered/{places,pois,streets}-<region>.osm.pbf
#   data/ne_countries.geojson
#
# Usage: refresh-places.sh [-d data-dir] [-r region]... [stage]...
#   -r  Geofabrik region path, repeatable; e.g. -r europe -r north-america,
#       or a sub-region like -r europe/slovakia (default: the 8 continents)
#
# The ingest stage requires DB_URL, DB_USER and DB_PASSWORD in the environment.
# Set SLACK_ALERT_WEBHOOK_URL to get a Slack message when any step fails
# (the cron runs unattended); leave it unset for dev/local runs.
# Requires: curl, osmium (https://osmcode.org/osmium-tool/), pnpm.
set -eu

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
DATA_DIR="$SCRIPT_DIR/../data"
REGIONS=""

# set -e makes every failure (bad download, corrupt extract, osmium error,
# ingest abort) exit non-zero, so one EXIT trap catches them all. CURRENT_STEP
# tracks what was running so the alert says where it broke.
CURRENT_STEP="startup"
on_exit() {
  status=$?
  if [ "$status" -ne 0 ] && [ -n "${SLACK_ALERT_WEBHOOK_URL:-}" ]; then
    curl -sS --max-time 10 -X POST -H 'Content-type: application/json' \
      --data "{\"text\":\":rotating_light: places dataset refresh failed: $CURRENT_STEP (exit $status)\"}" \
      "$SLACK_ALERT_WEBHOOK_URL" || true
  fi
}
trap on_exit EXIT

while getopts d:r: opt; do
  case $opt in
    d) DATA_DIR=$OPTARG ;;
    r) REGIONS="$REGIONS $OPTARG" ;;
    *) exit 2 ;;
  esac
done
shift $((OPTIND - 1))
STAGES="${*:-fetch extract ingest}"
[ -n "$REGIONS" ] || REGIONS="africa antarctica asia australia-oceania central-america europe north-america south-america"

RAW_DIR="$DATA_DIR/raw"
FILTERED_DIR="$DATA_DIR/filtered"
mkdir -p "$RAW_DIR" "$FILTERED_DIR"

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
    echo "=== downloading Natural Earth country boundaries"
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
      echo "=== $region: raw extract is fresh, skipping fetch"
      continue
    fi
    CURRENT_STEP="downloading $region"
    echo "=== $region: downloading"
    # Never resume a partial file (no -C) — Geofabrik rebuilds "latest" daily,
    # and resuming across builds splices a corrupt PBF; each retry re-downloads
    # from scratch. --speed-limit/--speed-time abort (and retry) a stall.
    rm -f "$raw" "$raw.ok"
    curl -sL --fail --retry 10 --retry-all-errors --speed-limit 10240 --speed-time 60 \
      -o "$raw" "https://download.geofabrik.de/$region-latest.osm.pbf"
    osmium fileinfo "$raw" > /dev/null
    touch "$raw.ok"
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
    echo "=== $region: extracting settlements"
    osmium tags-filter "$raw" n/place \
      -o "$FILTERED_DIR/places-$s.osm.pbf" --overwrite
    echo "=== $region: extracting POIs"
    osmium tags-filter "$raw" \
      nwr/amenity=cafe,restaurant,pub,bar,fast_food \
      nwr/leisure=park,garden \
      nwr/tourism=attraction,museum \
      -o "$FILTERED_DIR/pois-$s.osm.pbf" --overwrite
    echo "=== $region: extracting streets"
    osmium tags-filter "$raw" \
      w/highway=residential,living_street,pedestrian,primary,secondary,tertiary,unclassified \
      -o "$FILTERED_DIR/streets-$s.osm.pbf" --overwrite
  done
fi

if has_stage ingest; then
  CURRENT_STEP="ingesting: $REGIONS"
  # Explicit check instead of ${VAR:?} — a :? failure bypasses the EXIT trap's
  # status propagation in bash 3.2 (macOS /bin/sh), silently exiting 0
  if [ -z "${DB_URL:-}" ] || [ -z "${DB_USER:-}" ] || [ -z "${DB_PASSWORD:-}" ]; then
    echo "!!! ingest stage needs DB_URL, DB_USER and DB_PASSWORD" >&2
    exit 1
  fi
  files=""
  for region in $REGIONS; do
    s=$(slug "$region")
    files="$files $FILTERED_DIR/places-$s.osm.pbf $FILTERED_DIR/pois-$s.osm.pbf $FILTERED_DIR/streets-$s.osm.pbf"
  done
  echo "=== ingesting: $REGIONS"
  cd "$SCRIPT_DIR/.."
  # shellcheck disable=SC2086 # word-splitting of $files is intended
  NODE_OPTIONS=--max-old-space-size=8192 \
    pnpm ingest:places --countries "$DATA_DIR/ne_countries.geojson" $files
fi

echo "=== done: $STAGES"
