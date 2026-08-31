# Upstream pin

JAX CF edgetunnel v2 uses a **pinned** upstream snapshot instead of following `main` automatically.

- Upstream: `cmliu/edgetunnel`
- License: GPL-2.0
- Upstream branch: `main`
- Pinned commit: `fb3212257e3527447d7368010b378f7e449444b4`
- Commit date: 2026-08-29
- edgetunnel application version inside `_worker.js`: `2026-08-11 14:45:22`
- `_worker.js` Git blob SHA: `551bdc740a920b63279da9111f9f6058cb684147`
- `LICENSE` Git blob SHA: `d159169d1050894d3ea3b98e1c965c4058208fe1`

`sync-upstream.mjs` downloads only these pinned files during the Cloudflare Pages build and verifies their Git blob SHA before writing `dist/`.

## Upgrade policy

Do not change the commit hash merely because upstream has a newer release.

Before an upgrade:

1. Read the upstream changelog and latest `_worker.js`.
2. Check environment-variable and KV compatibility.
3. Review changes related to ProxyIP, SOCKS5/HTTP(S), subscription generation, admin authentication and logging.
4. Update the pinned commit and expected Git blob hashes together.
5. Deploy to a preview/test Pages project first.
6. Only promote after Clash Verge and Shadowrocket tests pass.

## Third-party dependency warning

The pinned upstream implementation is not a zero-third-party design. At this snapshot it contains external dependencies/behaviour, including:

- static admin/login pages loaded from `edt-pages.github.io`;
- a built-in default ProxyIP fallback derived from the author's `*.proxyip.cmliussss.net` service when no custom `PROXYIP` is configured;
- optional public subscription/optimization APIs depending on panel configuration.

Therefore do not describe this v2 as a fully private self-hosted proxy. For lower metadata exposure, use your own trusted `PROXYIP` / SOCKS5 / HTTP(S) egress and avoid public optimization/subscription-conversion services.
