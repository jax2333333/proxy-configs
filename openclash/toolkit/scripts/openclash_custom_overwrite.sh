#!/bin/sh

# Repository template for /etc/openclash/custom/openclash_custom_overwrite.sh.
# Merge this call into an existing custom overwrite script instead of replacing
# unrelated local customizations.

PROVIDER_CACHE_GUARD="/etc/openclash/scripts/provider-cache-guard.sh"

if [ -r "$PROVIDER_CACHE_GUARD" ]; then
  /bin/sh "$PROVIDER_CACHE_GUARD" || {
    if command -v logger >/dev/null 2>&1; then
      logger -t openclash-provider-cache-guard "Guard failed; OpenClash startup will continue."
    fi
  }
elif command -v logger >/dev/null 2>&1; then
  logger -t openclash-provider-cache-guard "Guard script not found; OpenClash startup will continue."
fi

exit 0
