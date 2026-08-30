# Common Rules

## Canonical repository

- Repository: `jax2333333/proxy-configs`
- Canonical branch: `main`
- The latest repository version is authoritative.
- Read the latest version before every modification.
- Never replace repository content using a stale chat copy.

## Platform isolation

Repository areas:

- `shadowrocket/`
- `clash-verge/`
- `openclash/`

Modify only the requested platform by default.

Only modify all three when the user explicitly requests a three-platform synchronized update.

## Subscription handling

Real airport/provider subscription addresses are local-only and must not be committed.

- Clash Verge: the real subscription stays in the local Merge/setup.
- OpenClash: the repository keeps placeholders instead of real subscription URLs.
- Shadowrocket: do not add real provider/subscription credentials to the repository.

If a repository template requires a subscription field, preserve or create a clearly recognizable placeholder rather than a real URL.

## Node filtering defaults

Exclude nodes whose names indicate unwanted free or multiplier nodes, including the user's established patterns such as:

- `免费`
- `x2`
- `x1.5`
- `x0.01`
- `x0.1`

When implementing regex filters, account for harmless formatting variation where reasonable, but avoid a regex so broad that valid nodes are removed.

## Region preferences

Common preferred proxy regions:

1. Japan
2. Taiwan
3. Singapore
4. United States

Hong Kong is not a preferred region for the AI strategy group and should be excluded from AI selection unless the user explicitly changes this preference.

Do not force these region preferences onto a group whose current semantics require something else.

## Service strategy intent

When existing configuration supports these groups, preserve dedicated handling for services such as:

- AI services
- YouTube
- Google
- Telegram
- TikTok
- Spotify
- Microsoft
- OneDrive
- Apple
- final/fallback traffic

Apple should prefer `DIRECT` unless the user requests otherwise or troubleshooting evidence shows a reason to change it.

## Network defaults

- IPv6: disabled by default.
- DNS leakage protection: prioritize correctness and consistency.
- Respect the active platform's native DNS model; do not copy DNS syntax between products.
- Fake-IP is preferred where already established and compatible.
- Do not change the user's tested TUN stack merely for stylistic consistency.

## Naming and ordering

- Preserve existing emoji, Chinese group names, and group ordering unless the user requests changes.
- Preserve stable names referenced by rules or other groups.
- Before creating a new group, search for an existing equivalent group and extend it if appropriate.
- Keep `DIRECT` priority/order consistent with the user's existing design when editing service groups.

## Update quality checks

Before finalizing a change:

1. Search for duplicate rules and duplicate strategy groups.
2. Verify all rule targets refer to existing strategy groups.
3. Verify renamed groups have all references updated.
4. Confirm placeholders remain placeholders.
5. Confirm unrelated files were not changed.
6. Confirm no accidental broad formatting rewrite occurred.
