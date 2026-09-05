#!/bin/sh

# OpenClash Provider Cache Guard v3.1.3.1
# Dynamic Airport-* provider detection
# BusyBox compatible

CACHE_DIR="/etc/openclash/proxy_provider"

STATE_FILE="/etc/openclash/provider-cache-v3.1.3.1.sha256"

LOG_FILE="/tmp/provider-cache-guard-v3.1.3.1.log"

BACKUP_DIR="/etc/openclash/provider-cache-backup"


MIN_NODES=5

MIN_SIZE=10240


log(){

    echo "$(date '+%F %T') $*" >> "$LOG_FILE"

}


sha256(){

    sha256sum "$1" 2>/dev/null | awk '{print $1}'

}


mkdir -p "$BACKUP_DIR"

touch "$STATE_FILE"



for FILE in "$CACHE_DIR"/Airport-*;
do

    [ -f "$FILE" ] || continue


    PROVIDER="$(basename "$FILE")"


    SIZE=$(wc -c < "$FILE" 2>/dev/null | tr -d ' ')

    [ -n "$SIZE" ] || SIZE=0


    NODES=$(grep -c "name:" "$FILE" 2>/dev/null)

    [ -n "$NODES" ] || NODES=0


    SHA=$(sha256 "$FILE")


    [ -n "$SHA" ] || continue



    log "[FOUND] $PROVIDER nodes=$NODES size=${SIZE}B"



    if [ "$SIZE" -lt "$MIN_SIZE" ]; then

        log "[INVALID] $PROVIDER file too small skip"

        continue

    fi



    if [ "$NODES" -lt "$MIN_NODES" ]; then

        log "[INVALID] $PROVIDER nodes=$NODES skip"

        continue

    fi



    OLD=$(grep "^$PROVIDER " "$STATE_FILE" 2>/dev/null | awk '{print $2}')



    if [ -z "$OLD" ]; then


        sed -i "/^$PROVIDER /d" "$STATE_FILE"


        echo "$PROVIDER $SHA" >> "$STATE_FILE"


        log "[INIT] $PROVIDER sha saved"


        continue

    fi




    if [ "$OLD" = "$SHA" ]; then


        log "[CHECK] $PROVIDER unchanged nodes=$NODES"


        continue

    fi




    log "[CHANGE] $PROVIDER content changed"



    BACKUP_FILE="$BACKUP_DIR/${PROVIDER}.$(date +%Y%m%d-%H%M%S)"



    cp -p "$FILE" "$BACKUP_FILE"



    if [ $? -eq 0 ]; then

        log "[BACKUP] saved $BACKUP_FILE"

    else

        log "[ERROR] backup failed $PROVIDER"

        continue

    fi



    rm -f "$FILE"



    if [ ! -f "$FILE" ]; then

        log "[ACTION] removed cache $PROVIDER"

    fi



    sed -i "/^$PROVIDER /d" "$STATE_FILE"


done


chmod 600 "$STATE_FILE"
