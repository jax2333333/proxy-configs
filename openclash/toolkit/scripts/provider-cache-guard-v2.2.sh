#!/bin/sh

# OpenClash Provider Cache Guard v2.2
# Dual provider edition: Airport-A / Airport-B compatible
# BusyBox ash/awk compatible
# Detect provider cache content changes without logging secrets

set -u
umask 077

CACHE_DIR="${OPENCLASH_PROVIDER_CACHE_DIR:-/etc/openclash/proxy_provider}"
STATE_FILE="${OPENCLASH_PROVIDER_SHA_FILE:-/etc/openclash/provider-content-sha256}"
BACKUP_DIR="${OPENCLASH_PROVIDER_BACKUP_DIR:-/etc/openclash/provider-cache-backup}"

log(){
    logger -t openclash-provider-cache-guard-v2.2 "$*" 2>/dev/null || echo "$*"
}

get_config(){
    if command -v uci >/dev/null 2>&1; then
        uci get openclash.config.config_path 2>/dev/null
    fi
}

sha256(){
    sha256sum "$1" 2>/dev/null | awk '{print $1}'
}

find_cache(){
    [ -f "$CACHE_DIR/$1" ] && echo "$CACHE_DIR/$1" && return
    [ -f "$CACHE_DIR/$1.yaml" ] && echo "$CACHE_DIR/$1.yaml" && return
    [ -f "$CACHE_DIR/$1.yml" ] && echo "$CACHE_DIR/$1.yml" && return
}

CONFIG_FILE="$(get_config)"
[ -r "$CONFIG_FILE" ] || exit 0

mkdir -p "$BACKUP_DIR"

providers=$(awk '
/^proxy-providers:/ {flag=1; next}
flag && /^  [^ ]+:/ {gsub(":","",$1); gsub("\"","",$1); print $1}
flag && /^[^ ]/ {flag=0}
' "$CONFIG_FILE")

[ -n "$providers" ] || exit 0

TMP="$(mktemp)" || exit 1
trap 'rm -f "$TMP"' EXIT

for provider in $providers; do
    cache="$(find_cache "$provider")"
    [ -n "$cache" ] || continue

    sha="$(sha256 "$cache")"
    [ -n "$sha" ] || continue

    old=""
    [ -f "$STATE_FILE" ] && old="$(awk -v p="$provider" '$1==p {print $2}' "$STATE_FILE")"

    if [ -n "$old" ] && [ "$old" != "$sha" ]; then
        cp -p "$cache" "$BACKUP_DIR/${provider}.$(date +%Y%m%d-%H%M%S)"
        rm -f "$cache"
        log "[CHANGE] Provider cache refreshed: $provider"
    else
        log "[CHECK] Provider unchanged: $provider"
    fi

    echo "$provider $sha" >> "$TMP"
done

chmod 600 "$TMP"
mv -f "$TMP" "$STATE_FILE"
