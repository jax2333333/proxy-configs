#!/bin/sh

# OpenClash Provider Cache Guard v3.1.1
# Dual provider edition: Airport-A / Airport-B
# Fix provider discovery, init state, node count logging.

set -u
umask 077

CACHE_DIR="${OPENCLASH_PROVIDER_CACHE_DIR:-/etc/openclash/proxy_provider}"
STATE_FILE="${OPENCLASH_PROVIDER_STATE_FILE:-/etc/openclash/provider-cache-v3.1.1.sha256}"
BACKUP_DIR="${OPENCLASH_PROVIDER_BACKUP_DIR:-/etc/openclash/provider-cache-backup}"
CONFIG_FILE="${OPENCLASH_ACTIVE_CONFIG:-/etc/openclash/config/openclash_by_jax_v6.1.yaml}"
LOG_FILE="/tmp/provider-cache-guard-v3.1.1.log"

log(){ echo "$(date '+%F %T') $*" >> "$LOG_FILE"; }

hash_file(){ sha256sum "$1" 2>/dev/null | awk '{print $1}'; }

[ -r "$CONFIG_FILE" ] || exit 0
mkdir -p "$CACHE_DIR" "$BACKUP_DIR"

TMP="$(mktemp)" || exit 1
trap 'rm -f "$TMP"' EXIT

# Parse proxy-providers names
awk '
/^proxy-providers:/ {found=1; next}
found && /^[[:space:]]{2}[A-Za-z0-9_-]+:/ {gsub(":","",$1); print $1}
found && /^[^[:space:]]/ {exit}
' "$CONFIG_FILE" > "$TMP"

[ -s "$TMP" ] || exit 0

NEW="$(mktemp)" || exit 1
trap 'rm -f "$TMP" "$NEW"' EXIT

for provider in $(cat "$TMP"); do
    file="$CACHE_DIR/$provider"

    if [ ! -f "$file" ]; then
        log "[WAIT] $provider missing"
        continue
    fi

    sha="$(hash_file "$file")"
    nodes="$(grep -c 'name:' "$file" 2>/dev/null || echo 0)"
    old=""

    [ -f "$STATE_FILE" ] && old="$(grep "^$provider " "$STATE_FILE" 2>/dev/null | awk '{print $2}')"

    if [ -z "$old" ]; then
        log "[INIT] $provider sha saved nodes=$nodes"
    elif [ "$old" != "$sha" ]; then
        cp -p "$file" "$BACKUP_DIR/${provider}.$(date +%Y%m%d-%H%M%S)"
        rm -f "$file"
        log "[CHANGE] $provider changed nodes=$nodes backup+remove"
        continue
    else
        log "[CHECK] $provider unchanged nodes=$nodes"
    fi

    echo "$provider $sha" >> "$NEW"
done

mv "$NEW" "$STATE_FILE"
chmod 600 "$STATE_FILE" 2>/dev/null || true
