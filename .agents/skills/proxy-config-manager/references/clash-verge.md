# Clash Verge Module

Read this file for Clash Verge / Mihomo desktop configuration maintenance.

## Scope

Default repository scope: `clash-verge/`

Do not modify `shadowrocket/` or `openclash/` during a Clash Verge-only task.

## Local subscription rule

The real airport subscription is local-only.

Never place the real subscription URL into GitHub. Keep the GitHub configuration compatible with the user's local Merge workflow and preserve placeholders where required.

## Concepts to handle

- Mihomo YAML
- Merge behavior
- `proxy-groups`
- `proxy-providers`
- `rule-providers`
- `rules`
- DNS
- Fake-IP
- TUN
- node filtering and region regex

## Validation

After editing YAML:

1. Parse/validate YAML when a parser is available.
2. Check indentation and list/map structure manually even if parsing succeeds.
3. Check duplicate YAML keys when tooling supports it.
4. Check every rule target exists.
5. Check every referenced provider/group exists.
6. Check group recursion/cycles are not introduced.
7. Check node-filter regex does not unintentionally remove all usable nodes.
8. Confirm the real local subscription URL is absent from the diff.
9. Confirm IPv6 remains disabled unless the task explicitly changes it.

## DNS and Fake-IP

Preserve the user's established DNS-leak protection and Fake-IP design unless the request specifically concerns them.

When changing DNS:

- reason about bootstrap/resolver dependencies,
- avoid circular resolver paths,
- keep foreign DNS resolution compatible with proxy routing,
- do not copy OpenClash/dnsmasq-specific syntax into Clash Verge.

## Service groups

Preserve the established intent for dedicated service groups and Apple direct preference. AI selection should continue excluding Hong Kong unless explicitly changed.
