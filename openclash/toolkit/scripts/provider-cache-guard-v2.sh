#!/bin/sh

# OpenClash Provider Cache Guard v2
# Detect both URL changes and Provider content changes.
# Real subscription URLs are only read locally and never logged.

set -u
umask 077

CACHE_DIR="${OPENCLASH_PROVIDER_CACHE_DIR:-/etc/openclash/proxy_provider}"
STATE_FILE="${OPENCLASH_PROVIDER_CONTENT_SHA_FILE:-/etc/openclash/provider-content-sha256}"
LOCAL_CONFIG="${OPENCLASH_LOCAL_CONFIG:-/etc/openclash/config/openclash_by_jax_v6.1.yaml}"
BACKUP_DIR="${OPENCLASH_PROVIDER_BACKUP_DIR:-/etc/openclash/provider-cache-backup}"

log(){ logger -t openclash-provider-cache-guard-v2 "$*" 2>/dev/null || printf '%s\n' "$*"; }

sha256(){
    if command -v sha256sum >/dev/null 2>&1; then
        sha256sum "$1" | awk '{print $1}'
    else
        openssl dgst -sha256 "$1" | awk '{print $NF}'
    fi
}

backup_clear(){
    name="$1"
    file="$CACHE_DIR/$name"
    [ -f "$file" ] || return 0

    mkdir -p "$BACKUP_DIR" || return 1
    cp -p "$file" "$BACKUP_DIR/${name}.$(date +%Y%m%d-%H%M%S)" || return 1
    rm -f "$file" || return 1
    log "Provider cache refreshed: $name"
}

[ -f "$LOCAL_CONFIG" ] || exit 0

TMP="$(mktemp)" || exit 1
trap 'rm -f "$TMP"' EXIT

awk '
/^  [^ ]+:/ {gsub(":","",$1); p=$1}
/^[ ]+url:/ {print p}' "$LOCAL_CONFIG" | sort -u > "$TMP"

for provider in $(cat "$TMP"); do
    cache="$CACHE_DIR/$provider"
    [ -f "$cache" ] || continue

    current="$(sha256 "$cache")"
    old=""
    [ -f "$STATE_FILE" ] && old="$(grep "^$provider " "$STATE_FILE" | awk '{print $2}')"

    if [ -n "$old" ] && [ "$current" != "$old" ]; then
        backup_clear "$provider"
    fi

    grep -v "^$provider " "$STATE_FILE" 2>/dev/null > "$STATE_FILE.tmp" || true
    printf '%s %s\n' "$provider" "$current" >> "$STATE_FILE.tmp"
    mv "$STATE_FILE.tmp" "$STATE_FILE"
done

chmod 600 "$STATE_FILE" 2>/dev/null || true
