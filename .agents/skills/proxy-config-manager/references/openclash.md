# OpenClash Module

Read this file for OpenClash, OpenWrt, Mihomo, DNS, TUN, Fake-IP, rule-provider, or OpenClash log troubleshooting tasks.

## Scope

Default repository scope: `openclash/`

Do not modify `shadowrocket/` or `clash-verge/` during an OpenClash-only task.

## Environment assumptions

The user's established environment has used:

- OpenWrt/ImmortalWrt
- OpenClash with Mihomo
- Firewall4 / nftables
- dnsmasq forwarding
- Fake-IP
- TUN
- gVisor as a preferred tested stack
- IPv6 disabled

Treat the live/current repository and logs as more authoritative than these historical defaults.

## Concepts to handle

- Mihomo YAML
- OpenClash-specific integration
- `proxy-groups`
- `proxy-providers`
- `rule-providers`
- `rules`
- `dns`
- `fake-ip-range`
- `fake-ip-filter`
- `proxy-server-nameserver`
- `respect-rules`
- DNS hijacking
- dnsmasq forwarding
- TUN stack
- Firewall4/nftables interactions

## Subscription rule

Never place the real airport subscription URL in GitHub. Keep only placeholders in repository-managed files.

## YAML validation

After any YAML modification:

1. Parse YAML with a real parser when available.
2. Check indentation and list/map nesting.
3. Check for duplicate keys when possible.
4. Check strategy-group references.
5. Check provider references.
6. Check rule targets.
7. Check DNS field names against the active Mihomo/OpenClash syntax.
8. Preserve placeholders.

A previously encountered error pattern is:

`did not find expected alphabetic or numeric character while scanning an alias`

When this appears, inspect YAML aliases/anchors and unintended `*` or `&` characters first, then inspect indentation and malformed scalar syntax. Do not assume every occurrence has the same cause.

## DNS troubleshooting

When diagnosing DNS:

1. Separate OpenClash/Mihomo resolver behavior from dnsmasq behavior.
2. Identify which component is listening on port 53 and where queries are forwarded.
3. Check whether DNS hijacking is active and intended.
4. Check bootstrap resolvers and `proxy-server-nameserver` dependencies.
5. Check whether `respect-rules` creates a routing dependency that is satisfiable.
6. Check Fake-IP mode/filter behavior.
7. Check for accidental system/ISP DNS escape paths.
8. Avoid changing several DNS layers at once unless evidence requires it.

## TUN troubleshooting

Do not switch TUN stacks casually.

The user has previously compared gVisor and mixed behavior. Preserve the working stack unless logs/tests indicate a reason to change it or the user explicitly requests comparison/testing.

## Log interpretation

Classify findings as:

- fatal startup/config error
- functional error affecting traffic
- recoverable warning
- informational message

Do not rewrite configuration to silence harmless warnings.

When a log references an automatically supplied default (for example a fallback resolver), distinguish that from a real missing configuration that breaks service.
