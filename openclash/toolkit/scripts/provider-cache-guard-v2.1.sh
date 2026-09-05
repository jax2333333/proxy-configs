#!/bin/sh

# OpenClash Provider Cache Guard v2.1
# Dual provider edition: Airport-A / Airport-B compatible
# Detect provider content changes without exposing subscription URLs.

set -u
umask 077

CACHE_DIR="${OPENCLASH_PROVIDER_CACHE_DIR:-/etc/openclash/proxy_provider}"
STATE_FILE="${OPENCLASH_PROVIDER_CONTENT_SHA_FILE:-/etc/openclash/provider-content-sha256}"
CONFIG_FILE="${OPENCLASH_ACTIVE_CONFIG:-/etc/openclash/config/openclash_by_jax_v6.1.yaml}"
BACKUP_DIR="${OPENCLASH_PROVIDER_BACKUP_DIR:-/etc/openclash/provider-cache-backup}"

log(){ logger -t openclash-provider-cache-guard-v2.1 "$*" 2>/dev/null || echo "$*"; }

hash_file(){
    sha256sum "$1" 2>/dev/null | awk '{print $1}'
}

[ -r "$CONFIG_FILE" ] || exit 0
mkdir -p "$BACKUP_DIR" "$CACHE_DIR"

providers=$(awk '
/^proxy-providers:/ {p=1;next}
p && /^[[:space:]]{2}[^[:space:]][^:]*:/ {gsub(":","",$1);print $1}
p && /^[^[:space:]]/ {p=0}
' "$CONFIG_FILE")

[ -n "$providers" ] || exit 0

TMP="$(mktemp)"
trap 'rm -f "$TMP"' EXIT

for provider in $providers; do
    cache="$CACHE_DIR/$provider"
    [ -f "$cache" ] || continue

    sha="$(hash_file "$cache")"
    [ -n "$sha" ] || continue

    old=""
    [ -f "$STATE_FILE" ] && old="$(grep "^$provider " "$STATE_FILE" 2>/dev/null | awk '{print $2}')"

    if [ -n "$old" ] && [ "$old" != "$sha" ]; then
        cp -p "$cache" "$BACKUP_DIR/${provider}.$(date +%Y%m%d-%H%M%S)"
        rm -f "$cache"
        log "Provider content changed, cache cleared: $provider"
    else
        log "Provider checked: $provider"
    fi

    echo "$provider $sha" >> "$TMP"
done

chmod 600 "$TMP"
mv -f "$TMP" "$STATE_FILE"
