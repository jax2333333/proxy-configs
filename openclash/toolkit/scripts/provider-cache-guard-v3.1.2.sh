#!/bin/sh

# OpenClash Provider Cache Guard v3.1.2
# Dynamic Airport-* provider detection
# No subscription URL / credential storage

CACHE_DIR="/etc/openclash/proxy_provider"
STATE_FILE="/etc/openclash/provider-cache-v3.1.2.sha256"
LOG_FILE="/tmp/provider-cache-guard-v3.1.2.log"
BACKUP_DIR="/etc/openclash/provider-cache-backup"

log(){
    echo "$(date '+%F %T') $*" >> "$LOG_FILE"
}

sha256(){
    sha256sum "$1" 2>/dev/null | awk '{print $1}'
}

mkdir -p "$BACKUP_DIR"
touch "$STATE_FILE"

for FILE in "$CACHE_DIR"/Airport-*; do

    [ -f "$FILE" ] || continue

    PROVIDER="$(basename "$FILE")"

    NODES=$(grep -c "name:" "$FILE" 2>/dev/null)

    SHA=$(sha256 "$FILE")

    [ -n "$SHA" ] || continue

    log "[FOUND] $PROVIDER nodes=$NODES"

    OLD=$(grep "^$PROVIDER " "$STATE_FILE" 2>/dev/null | awk '{print $2}')

    if [ -z "$OLD" ]; then

        sed -i "/^$PROVIDER /d" "$STATE_FILE"

        echo "$PROVIDER $SHA" >> "$STATE_FILE"

        log "[INIT] $PROVIDER sha saved"

        continue
    fi

    if [ "$OLD" = "$SHA" ]; then

        log "[CHECK] $PROVIDER unchanged nodes=$NODES"

    else

        log "[CHANGE] $PROVIDER content changed"

        cp -p "$FILE" \
        "$BACKUP_DIR/${PROVIDER}.$(date +%Y%m%d-%H%M%S)"

        rm -f "$FILE"

        sed -i "/^$PROVIDER /d" "$STATE_FILE"

        log "[ACTION] removed cache $PROVIDER"

    fi

done

chmod 600 "$STATE_FILE"
