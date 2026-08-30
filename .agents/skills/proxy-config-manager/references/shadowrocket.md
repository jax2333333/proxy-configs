# Shadowrocket Module

Read this file for Shadowrocket configuration, modules, scripts, MITM, rewrite rules, or JAX website cleaner tasks.

## Scope

Default repository scope: `shadowrocket/`

Do not modify `clash-verge/` or `openclash/` during a Shadowrocket-only task.

## Configuration concepts

Understand and preserve the semantics of sections such as:

- `[General]`
- `[Proxy]`
- `[Proxy Group]`
- `[Rule]`
- `[Host]`
- `[URL Rewrite]`
- `[Script]`
- `[MITM]`

Also handle `.sgmodule` and JavaScript rewrite scripts according to the current repository style.

## Validation

After an edit:

1. Check section headers and line syntax.
2. Check that every rule target refers to a valid policy/group name.
3. Check for duplicated rules, rewrite patterns, scripts, or MITM hostnames.
4. Check that script URLs/paths point to the intended current repository files.
5. Keep MITM hostnames minimal.
6. Preserve comments and ordering where possible.
7. Do not broaden interception merely to make a rewrite easier.

## JAX website cleaner

When the user sends a website URL and asks to add it to the website cleaner, or the established workflow implies that intent:

1. Read the latest versions of:
   - `shadowrocket/toolkit/modules/site-cleaner.sgmodule`
   - `shadowrocket/toolkit/scripts/site-cleaner.js`
2. Analyze the site behavior using available web/network evidence when needed.
3. Identify only the necessary ad banners, popups, overlays, iframes, redirect handlers, or other targeted interference.
4. Add site-specific logic to the existing unified `site-cleaner.js`; avoid creating fragmented per-site scripts.
5. Add only the necessary module rules/script patterns/MITM hostnames to `site-cleaner.sgmodule`.
6. Keep MITM hostname scope minimal and explicit.
7. Confirm the change does not affect unrelated sites.

If the site cannot be reliably analyzed, make the narrowest evidence-based change and clearly state the limitation.

## YouTube/ad-removal caution

Do not promise that a client-side rule can permanently remove every server-side or dynamically inserted YouTube ad. Treat ad handling as a best-effort compatibility task and preserve normal playback as the highest priority.
