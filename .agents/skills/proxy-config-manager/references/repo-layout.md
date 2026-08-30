# Repository Layout

Canonical repository: `jax2333333/proxy-configs`

## Managed top-level areas

```text
proxy-configs/
├── shadowrocket/
├── clash-verge/
└── openclash/
```

Treat the actual current GitHub tree as authoritative. Do not assume a file exists merely because it is listed in this reference.

## Shadowrocket special area

The JAX website cleaner is maintained only through these canonical files when they exist in the repository:

```text
shadowrocket/toolkit/modules/site-cleaner.sgmodule
shadowrocket/toolkit/scripts/site-cleaner.js
```

For a website-cleaner request, do not create a second parallel cleaner unless the user explicitly asks for a separate module.

## File discovery

Before editing:

1. Inspect the relevant directory in the latest `main` branch.
2. Identify the actual active configuration file(s), imports, scripts, rule providers, and templates.
3. Follow existing naming conventions rather than inventing a parallel structure.

If repository structure has changed since this reference was written, follow the repository and update this reference only when the user wants the skill itself revised.
