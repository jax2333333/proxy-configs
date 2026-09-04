#!/bin/sh

# Clear only the Provider cache whose private URL changed.
# Real URLs are read locally and are never written to logs or the state file.

set -u
umask 077

LOCAL_AIRPORT_FILE="${OPENCLASH_LOCAL_AIRPORT_FILE:-/etc/openclash/overwrite/local-airport.txt}"
CACHE_DIR="${OPENCLASH_PROVIDER_CACHE_DIR:-/etc/openclash/proxy_provider}"
STATE_FILE="${OPENCLASH_PROVIDER_URL_SHA_FILE:-/etc/openclash/provider-url-sha256}"
BACKUP_ROOT="${OPENCLASH_PROVIDER_BACKUP_DIR:-/etc/openclash/provider-cache-backup}"

ROWS_TMP=""
STATE_TMP=""
MERGE_TMP=""
RUN_ID="$(date '+%Y%m%d-%H%M%S')-$$"

log_message() {
  if command -v logger >/dev/null 2>&1; then
    logger -t openclash-provider-cache-guard "$*"
  else
    printf '%s\n' "provider-cache-guard: $*" >&2
  fi
}

cleanup() {
  [ -n "$ROWS_TMP" ] && rm -f "$ROWS_TMP"
  [ -n "$STATE_TMP" ] && rm -f "$STATE_TMP"
  [ -n "$MERGE_TMP" ] && rm -f "$MERGE_TMP"
}

trap cleanup 0 1 2 15

hash_url() {
  if command -v sha256sum >/dev/null 2>&1; then
    HASH_OUTPUT="$(printf '%s' "$1" | sha256sum)" || return 1
    printf '%s\n' "${HASH_OUTPUT%% *}"
    return 0
  fi

  if command -v openssl >/dev/null 2>&1; then
    HASH_OUTPUT="$(printf '%s' "$1" | openssl dgst -sha256)" || return 1
    printf '%s\n' "${HASH_OUTPUT##* }"
    return 0
  fi

  return 1
}

parse_provider_urls() {
  awk '
    function trim(value) {
      sub(/^[[:space:]]+/, "", value)
      sub(/[[:space:]]+$/, "", value)
      return value
    }

    function indentation(value, copy) {
      copy = value
      sub(/[^[:space:]].*$/, "", copy)
      return length(copy)
    }

    BEGIN {
      in_yaml = 0
      in_providers = 0
      provider = ""
      providers_indent = -1
      provider_indent = -1
      provider_key_indent = -1
    }

    {
      line = $0
      sub(/\r$/, "", line)
      content = trim(line)

      if (content == "[YAML]") {
        in_yaml = 1
        in_providers = 0
        provider = ""
        provider_key_indent = -1
        next
      }

      if (content ~ /^\[[^]]+\]$/) {
        in_yaml = 0
        in_providers = 0
        provider = ""
        provider_key_indent = -1
        next
      }

      if (!in_yaml || content == "" || content ~ /^[#;]/) {
        next
      }

      indent = indentation(line)

      if (content ~ /^proxy-providers:[[:space:]]*(#.*)?$/) {
        in_providers = 1
        providers_indent = indent
        provider = ""
        provider_key_indent = -1
        next
      }

      if (!in_providers) {
        next
      }

      if (indent <= providers_indent) {
        in_providers = 0
        provider = ""
        provider_key_indent = -1
        next
      }

      if (provider_key_indent < 0 && indent > providers_indent && content ~ /^[^:]+:[[:space:]]*(#.*)?$/) {
        provider_key_indent = indent
      }

      if (indent == provider_key_indent && content ~ /^[^:]+:[[:space:]]*(#.*)?$/) {
        provider = content
        sub(/:[[:space:]]*(#.*)?$/, "", provider)
        provider = trim(provider)
        if ((substr(provider, 1, 1) == "\"" && substr(provider, length(provider), 1) == "\"") ||
            (substr(provider, 1, 1) == "\047" && substr(provider, length(provider), 1) == "\047")) {
          provider = substr(provider, 2, length(provider) - 2)
        }
        provider_indent = indent
        next
      }

      if (provider != "" && indent > provider_indent && content ~ /^url:[[:space:]]*/) {
        url = content
        sub(/^url:[[:space:]]*/, "", url)

        if (substr(url, 1, 1) == "\"") {
          sub(/^\"/, "", url)
          sub(/\"[[:space:]]*(#.*)?$/, "", url)
        } else if (substr(url, 1, 1) == "\047") {
          sub(/^\047/, "", url)
          sub(/\047[[:space:]]*(#.*)?$/, "", url)
        } else {
          sub(/[[:space:]]+#.*$/, "", url)
        }

        url = trim(url)
        if (provider != "." && provider != ".." && provider !~ /\// && url != "" && !seen[provider]++) {
          printf "%s\t%s\n", provider, url
        }
        provider = ""
      }
    }
  ' "$LOCAL_AIRPORT_FILE"
}

backup_and_clear_provider() {
  PROVIDER_NAME="$1"
  CACHE_FOUND=0
  BACKUP_DIR="$BACKUP_ROOT/$RUN_ID"

  for CACHE_SUFFIX in "" ".yaml" ".yml"; do
    CACHE_FILE="$CACHE_DIR/$PROVIDER_NAME$CACHE_SUFFIX"

    if [ -L "$CACHE_FILE" ]; then
      log_message "Refusing symbolic-link cache for Provider '$PROVIDER_NAME'."
      return 1
    fi

    [ -f "$CACHE_FILE" ] || continue
    CACHE_FOUND=1

    if [ ! -d "$BACKUP_DIR" ] && ! mkdir -p "$BACKUP_DIR"; then
      log_message "Unable to create Provider cache backup directory."
      return 1
    fi

    if ! cp -p "$CACHE_FILE" "$BACKUP_DIR/$(basename "$CACHE_FILE")"; then
      log_message "Unable to back up cache for Provider '$PROVIDER_NAME'; cache preserved."
      return 1
    fi
  done

  for CACHE_SUFFIX in "" ".yaml" ".yml"; do
    CACHE_FILE="$CACHE_DIR/$PROVIDER_NAME$CACHE_SUFFIX"
    [ -f "$CACHE_FILE" ] || continue

    if ! rm -f "$CACHE_FILE"; then
      log_message "Unable to clear cache for Provider '$PROVIDER_NAME'."
      return 1
    fi
  done

  if [ "$CACHE_FOUND" -eq 1 ]; then
    log_message "Provider URL changed; backed up and cleared cache for '$PROVIDER_NAME'."
  else
    log_message "Provider URL changed; no existing cache found for '$PROVIDER_NAME'."
  fi

  return 0
}

if [ ! -r "$LOCAL_AIRPORT_FILE" ]; then
  log_message "Local Provider URL file is unavailable; cache preserved."
  exit 0
fi

STATE_DIR="$(dirname "$STATE_FILE")"
if [ ! -d "$STATE_DIR" ] && ! mkdir -p "$STATE_DIR"; then
  log_message "Unable to create the Provider URL fingerprint directory; cache preserved."
  exit 1
fi

ROWS_TMP="$(mktemp /tmp/provider-cache-guard.rows.XXXXXX)" || exit 1
if ! parse_provider_urls > "$ROWS_TMP" || [ ! -s "$ROWS_TMP" ]; then
  log_message "No valid Provider URL entries found; cache and fingerprints preserved."
  exit 0
fi

STATE_TMP="$(mktemp "$STATE_FILE.new.XXXXXX")" || exit 1
FIRST_RUN=0
[ -s "$STATE_FILE" ] || FIRST_RUN=1
HAD_ERROR=0
TAB="$(printf '\t')"

while IFS="$TAB" read -r PROVIDER_NAME PROVIDER_URL; do
  CURRENT_SHA="$(hash_url "$PROVIDER_URL")" || {
    log_message "SHA256 tool unavailable; cache and fingerprints preserved."
    exit 1
  }

  PREVIOUS_SHA=""
  if [ -s "$STATE_FILE" ]; then
    PREVIOUS_SHA="$(awk -F '\t' -v provider="$PROVIDER_NAME" '$1 == provider { print $2; exit }' "$STATE_FILE")"
  fi

  SHA_TO_STORE="$CURRENT_SHA"

  if [ "$FIRST_RUN" -eq 1 ] || [ -z "$PREVIOUS_SHA" ]; then
    log_message "Initialized URL fingerprint for Provider '$PROVIDER_NAME'; cache preserved."
  elif [ "$CURRENT_SHA" != "$PREVIOUS_SHA" ]; then
    if ! backup_and_clear_provider "$PROVIDER_NAME"; then
      SHA_TO_STORE="$PREVIOUS_SHA"
      HAD_ERROR=1
    fi
  fi

  printf '%s\t%s\n' "$PROVIDER_NAME" "$SHA_TO_STORE" >> "$STATE_TMP"
done < "$ROWS_TMP"

# Keep fingerprints for temporarily removed Providers so re-adding one with a
# different URL still invalidates its old cache.
if [ -s "$STATE_FILE" ]; then
  MERGE_TMP="$(mktemp "$STATE_FILE.merge.XXXXXX")" || exit 1
  awk -F '\t' '
    NR == FNR { seen[$1] = 1; print; next }
    NF >= 2 && !seen[$1] { print }
  ' "$STATE_TMP" "$STATE_FILE" > "$MERGE_TMP" || exit 1
  mv -f "$MERGE_TMP" "$STATE_TMP" || exit 1
  MERGE_TMP=""
fi

chmod 600 "$STATE_TMP" || exit 1
mv -f "$STATE_TMP" "$STATE_FILE" || exit 1
STATE_TMP=""

exit "$HAD_ERROR"
