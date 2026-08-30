---
name: proxy-config-manager
description: Maintain JAX's proxy configurations in the GitHub repository jax2333333/proxy-configs. Use for Shadowrocket, Clash Verge, OpenClash, proxy groups, routing rules, DNS, Fake-IP, TUN, site-cleaner, policy updates, troubleshooting, validation, and synchronized changes across the three platforms. Always treat the latest main-branch repository state as canonical and protect secrets.
compatibility: Works with Agent Skills-compatible clients. Live repository maintenance requires authenticated GitHub read/write access; without it, produce a safe patch or exact change plan instead of claiming a commit was made.
metadata:
  author: jax
  version: "1.0.0"
---

# Proxy Config Manager

Use this skill to maintain the proxy configurations in `jax2333333/proxy-configs` safely and consistently.

## Core principle

The `main` branch of `jax2333333/proxy-configs` is the only canonical configuration source.

Never overwrite repository files from an old chat snippet, memory, cached copy, or user-pasted historical version without first reading the current repository version.

## Required references

For every task, first read:

- `references/common-rules.md`
- `references/security-rules.md`
- `references/repo-layout.md`

Then read exactly the platform reference(s) needed:

- Shadowrocket: `references/shadowrocket.md`
- Clash Verge: `references/clash-verge.md`
- OpenClash: `references/openclash.md`

If the user explicitly requests **“同步更新三套配置”**, read all three platform references and update all three platforms consistently.

## Determine scope

Default to the platform explicitly named by the user.

If the platform is not named, infer it only when the request clearly maps to one platform or one known repository path. Do not silently modify multiple platforms.

Only modify all three platforms when the user explicitly asks for a synchronized three-platform update, such as:

- “同步更新三套配置”
- “三套一起更新”
- another unmistakable instruction to update Shadowrocket + Clash Verge + OpenClash together

A request about Shadowrocket must not modify Clash Verge or OpenClash unless the user explicitly asks for synchronization. Apply the same isolation rule to every platform.

## Repository workflow

When GitHub access is available, follow this order:

1. Open `jax2333333/proxy-configs` and read the latest `main` branch version of every file that may be changed.
2. Read nearby files only when needed to understand references, imports, providers, scripts, or naming conventions.
3. Check the current file for existing equivalent rules/groups/hosts before adding anything. Avoid duplicates.
4. Apply the smallest change that satisfies the request. Do not reformat unrelated sections.
5. Preserve comments, ordering conventions, placeholders, and the repository's existing style unless the task requires a change.
6. Run the platform-specific checks from the relevant reference file.
7. Run the security checks from `references/security-rules.md` before any write or commit.
8. Review the final diff for accidental deletion, unrelated edits, leaked secrets, duplicate rules, and broken references.
9. Commit only after the changed content has passed the checks available in the current environment.
10. Report exactly what changed, which files changed, what was validated, and any limitation that could not be verified.

If GitHub write access is unavailable, do not claim the repository was updated. Instead, provide the exact patch or replacement block based on the latest readable version.

## Change discipline

- Prefer surgical edits over full-file rewrites.
- Preserve user-established strategy-group names unless renaming is explicitly requested.
- Do not remove an existing rule merely because it appears redundant unless its behavior is understood and the removal is required.
- Do not introduce experimental DNS, TUN, scripting, or MITM behavior unless requested or clearly necessary to solve the reported problem.
- For troubleshooting, diagnose first; change only the part supported by the evidence.
- When logs are provided, distinguish warnings from fatal errors and avoid changing working configuration just to silence harmless messages.

## Shared behavioral defaults

Use the common defaults in `references/common-rules.md`, including:

- Apple prefers direct connection.
- IPv6 remains disabled unless the user explicitly asks to test or enable it.
- Protect against DNS leakage.
- AI groups exclude Hong Kong nodes.
- Preferred proxy regions are Japan, Taiwan, Singapore, and the United States when applicable.
- Exclude nodes matching the user's multiplier/free-node filters.

These are defaults, not permission to rewrite unrelated configuration.

## Synchronized three-platform changes

When the user explicitly requests synchronization across all three platforms:

1. Read the latest repository state for all affected files first.
2. Translate the requested behavior into each platform's native configuration model; do not mechanically copy syntax across platforms.
3. Keep policy intent consistent even when implementation syntax differs.
4. Validate each platform independently.
5. Summarize any unavoidable behavioral difference among the three platforms.

## Output format after maintenance

Keep the completion report concise:

- **Target:** platform(s)
- **Changed:** files and behavior
- **Validation:** checks performed and result
- **Security:** confirm no subscription URL, token, password, key, UUID, or other prohibited secret was introduced
- **Commit:** commit identifier/link when available; otherwise clearly say no repository write occurred
- **Notes:** only meaningful caveats or required local steps

## Common triggers

Use this skill for requests such as:

- “给 OpenClash 增加 Claude 分流”
- “Clash Verge 的 Spotify 改成美国节点优先”
- “检查 Shadowrocket 配置并更新 GitHub”
- “OpenClash 日志里 DNS 有问题，帮我排查”
- “把这个网站加入网站净化中心”
- “同步更新三套配置”
- “检查 YAML 有没有问题”
