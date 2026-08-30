# JAX Proxy Configs

集中维护 JAX 的三套代理客户端配置，以及自用 Cloudflare 节点代码。后续以本仓库 `main` 分支作为主要维护版本，原 Gist 保留作历史来源/备份。

## 配置目录

| 客户端 / 项目 | 路径 | 当前版本 |
| --- | --- | --- |
| Shadowrocket | `shadowrocket/Jax-shadowrocket-v6.conf` | V6.2.1 FINAL |
| Clash Verge Rev / Mihomo | `clash-verge/clash-verge-by-jax.yaml` | V2.2 GitHub Template |
| OpenClash / Mihomo Smart | `openclash/openclash_by_jax_v5.yaml` | V5.1 |
| Cloudflare Workers VLESS | `cloudflare-node/` | JAX CF Node v1 |

## Raw 地址

### Shadowrocket
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-v6.conf`

### Clash Verge
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/clash-verge/clash-verge-by-jax.yaml`

### OpenClash
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v5.yaml`

### Cloudflare Worker
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/cloudflare-node/worker.js`

## 安全约定

- 本仓库目前为 **Public**，禁止提交真实机场订阅 URL、Token、密码、Cookie、API Key、Cloudflare UUID / Secret 等敏感信息。
- Clash Verge 配置不保存 `proxy-providers.Airport1` 的真实订阅，订阅由本地「订阅扩展配置 / Merge」注入。
- OpenClash 的 `proxy-providers.Airport1.url` 仅保留 `https://example.com/airport.yaml` 占位地址，真实订阅在本地填写。
- Shadowrocket 的 `update-url` 已迁移到本仓库 Raw 地址。
- Cloudflare 节点真实 `UUID`、`WS_PATH`、API Token 等只保存在 Cloudflare Secrets / 本地，不提交 GitHub。
- 每次修改前应检查 YAML/配置语法、策略组引用、规则顺序以及是否意外加入敏感信息。

## 原始 Gist 来源

- Shadowrocket: `3745fc1bc0d793346c2caae32fdc3d35`
- Clash Verge: `50ddce2fe0f2e587a80b94f6c9ed49eb`
- OpenClash: `e578e785ab374a2ae4d4bfd4d3c91593`

## 后续维护原则

三套客户端配置可以独立修改，也可以进行跨客户端规则同步；Cloudflare 节点代码独立维护在 `cloudflare-node/`。涉及 Apple、AI、TikTok、YouTube、Microsoft、Telegram、Netflix、DNS、节点筛选等公共逻辑时，先判断三个客户端的语法差异，再分别落地，避免机械复制导致兼容问题。
