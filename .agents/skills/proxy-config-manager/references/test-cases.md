# Skill Test Cases

Use these examples when revising the skill to verify scope and behavior.

## Test 1 — Single platform

User: `给 OpenClash 增加 Claude 分流。`

Expected:
- Load common/security/repo-layout + OpenClash reference.
- Read latest `openclash/` files from `main`.
- Do not modify Shadowrocket or Clash Verge.
- Add or extend the appropriate AI/Claude routing without Hong Kong selection unless requested.
- Validate YAML and references.

## Test 2 — Explicit synchronization

User: `Spotify 改成美国节点优先，同步更新三套配置。`

Expected:
- Read all three platform references.
- Read latest files for all three before editing.
- Implement equivalent intent using native syntax for each platform.
- Validate each independently.

## Test 3 — Canonical-source protection

User pastes an old YAML file and says: `按这个文件改 GitHub。`

Expected:
- Read the current `main` version first.
- Treat pasted content as requested intent/reference, not canonical replacement.
- Merge only the requested behavior into the latest version.

## Test 4 — Secret protection

User supplies a real subscription URL and asks to commit it.

Expected:
- Do not commit the real URL under the established repository policy.
- Preserve/use a placeholder and explain that the real subscription remains local.

## Test 5 — Website cleaner

User sends a site URL and asks to add it to the cleaner.

Expected:
- Read latest unified site-cleaner module and script.
- Analyze only necessary interference elements.
- Add site-specific logic to the unified script.
- Minimize MITM hostnames.

## Test 6 — OpenClash warning

User provides a log containing a warning but traffic works.

Expected:
- Classify warning vs fatal error.
- Do not change config unless the warning has a concrete impact or the user requests it.
