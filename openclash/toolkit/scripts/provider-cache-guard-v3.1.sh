#!/bin/sh

# OpenClash Provider Cache Guard v3.1
# Dual provider edition: Airport-A / Airport-B compatible
# Detect provider cache changes, backup before removal, and avoid repeated deletion loops.

set -u
umask 077

CACHE_DIR="${OPENCLASH_PROVIDER_CACHE_DIR:-/etc/openclash/proxy_provider}"
STATE_FILE="${OPENCLASH_PROVIDER_STATE_FILE:-/etc/openclash/provider-cache-v3.1.sha256}"
STATUS_FILE="${OPENCLASH_PROVIDER_STATUS_FILE:-/etc/openclash/provider-cache-v3.1.status}"
BACKUP_DIR="${OPENCLASH_PROVIDER_BACKUP_DIR:-/etc/openclash/provider-cache-backup}"
CONFIG_FILE="${OPENCLASH_ACTIVE_CONFIG:-/etc/openclash/config/openclash_by_jax_v6.1.yaml}"
LOG_FILE="/tmp/provider-cache-guard-v3.1.log"

log(){
    echo "$(date '+%F %T') $*" >> "$LOG_FILE"
}

hash_file(){
    sha256sum "$1" 2>/dev/null | awk '{print $1}'
}

record_status(){
    grep -v "^$1 " "$STATUS_FILE" 2>/dev/null > "$STATUS_FILE.tmp" || true
    echo "$1 $2" >> "$STATUS_FILE.tmp"
    mv "$STATUS_FILE.tmp" "$STATUS_FILE"
}

[ -r "$CONFIG_FILE" ] || exit 0
mkdir -p "$CACHE_DIR" "$BACKUP_DIR"

tmp="$(mktemp)" || exit 1
trap 'rm -f "$tmp"' EXIT

awk '
/^proxy-providers:/ {p=1;next}
p && /^[[:space:]]{2}[^[:space:]][^:]*:/ {gsub(":","",$1);print $1}
p && /^[^[:space:]]/ {p=0}
' "$CONFIG_FILE" > "$tmp"

[ -s "$tmp" ] || exit 0

for provider in $(cat "$tmp"); do
    file="$CACHE_DIR/$provider"

    if [ ! -f "$file" ]; then
        log "[WAIT] $provider missing, waiting for OpenClash refresh"
        continue
    fi

    sha="$(hash_file "$file")"
    [ -n "$sha" ] || continue

    old=""
    [ -f "$STATE_FILE" ] && old="$(grep "^$provider " "$STATE_FILE" 2>/dev/null | awk '{print $2}')"

    if [ -n "$old" ] && [ "$old" != "$sha" ]; then
        cp -p "$file" "$BACKUP_DIR/${provider}.$(date +%Y%m%d-%H%M%S)"
        rm -f "$file"
        record_status "$provider" "pending-refresh"
        log "[CHANGE] $provider changed, backup created and cache removed"
        continue
    fi

    record_status "$provider" "normal"
    echo "$provider $sha" >> "$STATE_FILE.tmp"
    log "[CHECK] $provider unchanged"
done

if [ -f "$STATE_FILE.tmp" ]; then
    mv "$STATE_FILE.tmp" "$STATE_FILE"
    chmod 600 "$STATE_FILE" 2>/dev/null || true
fi

chmod 600 "$STATUS_FILE" 2>/dev/null || true
