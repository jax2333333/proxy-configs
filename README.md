# JAX Proxy Configs

> [!IMPORTANT]
> ## 🚨 新对话 / ChatGPT 快速接管
> 仓库 `jax2333333/proxy-configs`，分支 `main`。先读本 README，再按 `docs/KNOWLEDGE-INDEX.md` 定位资料；修改前重新读取 `main` 最新实际文件，并遵守 `docs/CHATGPT-MAINTENANCE-PROMPT.md` 与 `AGENTS.md`。

集中维护 JAX 的 Shadowrocket、Clash Verge / Mihomo、OpenClash / Mihomo，以及自用 Cloudflare 节点方案。**GitHub `main` 是本仓库唯一正式版本。** 聊天记录、截图、旧 commit、旧附件和文档示例都不能替代 `main` 中的当前实际文件。

## 当前正式入口

| 项目 | 正式入口 | 实际配置 / 说明 |
| --- | --- | --- |
| Shadowrocket | `shadowrocket/README.md` | `shadowrocket/Jax-shadowrocket-v6.conf`、`shadowrocket/Jax-shadowrocket-home-clean.conf` |
| Clash Verge Rev / Mihomo | `clash-verge/README.md` | `clash-verge/clash-verge-by-jax.yaml` |
| OpenClash / Mihomo | `openclash/README.md` | `openclash/openclash_by_jax_v5.yaml` |
| Cloudflare Node | `cloudflare-node/README.md` | v2 `cloudflare-node/edgetunnel-v2/` 为当前优先方案；v1 `worker.js` 保留为基线/回滚 |

版本号、端口、DNS、TUN、策略组、Provider、上游 commit 等会变化的信息，**必须读取对应正式文件的最新内容**，不要从本 README 或聊天历史中推断。

## 当前整体架构

```text
GitHub main
├─ shadowrocket/       iPhone / iOS
├─ clash-verge/        Clash Verge Rev / Mihomo
├─ openclash/          R2S / ImmortalWrt / OpenClash
├─ cloudflare-node/    Cloudflare 节点 v1 + edgetunnel v2
├─ docs/               仓库级知识地图、当前状态、教程、历史、排错
└─ AGENTS.md           仓库操作与代理配置安全规则
```

长期边界：

- 三套客户端默认独立维护；除非用户明确要求同步，不顺手改其它平台。
- GitHub 只保存公共模板、规则、脚本、文档和不含凭据的构建逻辑。
- 真实机场订阅、Cloudflare Secrets、节点 UUID、订阅 Token、管理密码、认证材料只保存在本地或对应服务的 Secret/变量系统中。
- Cloudflare v2 当前采用固定上游快照 + 完整性校验；不自动追随第三方 `main`。
- Cloudflare 优选 IP 优化的是“客户端 → Cloudflare”入口；ProxyIP / SOCKS5 / HTTP(S) 处理的是 Cloudflare 出站，二者不要混为一谈。

## 知识结构

- `docs/CHATGPT-MAINTENANCE-PROMPT.md`：ChatGPT 角色、读取顺序、行为、安全和验证规则。
- `docs/KNOWLEDGE-INDEX.md`：任务 → 应读取文件的知识地图。
- `docs/CURRENT-STATE.md`：当前正式架构、已验证状态、长期偏好；动态值仍以实际配置为准。
- `docs/OPERATIONS.md`：仓库维护、恢复、Cloudflare 部署/优选/更新等操作流程。
- `docs/TROUBLESHOOTING.md`：常见故障、日志判断与检查顺序。
- `docs/HISTORY.md`：历史方案、迁移过程、已淘汰做法；**历史信息不是当前配置。**
- `AGENTS.md`：执行修改时必须遵守的仓库级安全与最小变更规则。

各子项目已经有自己的 README / docs。进入具体任务后，按 `docs/KNOWLEDGE-INDEX.md` 继续读取，避免一次加载无关资料。

## Raw 地址

### Shadowrocket
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-v6.conf`

### Clash Verge
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/clash-verge/clash-verge-by-jax.yaml`

### OpenClash
`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v5.yaml`

Cloudflare v2 通过 `cloudflare-node/edgetunnel-v2/` 的 Pages 构建流程部署，不使用包含真实凭据的公开 Raw 节点配置。

## 安全红线

本仓库为 **Public**。禁止提交：

- 真实机场订阅 URL
- 密码、Cookie、Token、API Key
- SSH / WireGuard / 其它私钥
- UUID、Secret、Authorization Header、验证码
- Cloudflare ADMIN / KEY / API Token / 订阅 Token
- 真实节点分享链接、包含认证信息的二维码内容
- 其它私人认证信息

如果敏感信息曾在聊天、截图、日志或公开历史中出现，不要再复制进仓库；必要时应轮换凭据。

## 维护总原则

1. 修改前重新读取 `main` 的当前入口、目标配置和任务相关文档。
2. 以实际配置文件为权威值，不用文档快照覆盖动态字段。
3. 最小修改，不无关重构，不擅自改组名、路由语义、DNS/IPv6/TUN 边界。
4. 修改后做语法/引用/安全检查，并重新读取 GitHub 实际结果。
5. 用户要求提交时，提交后报告修改文件、验证结果和 commit；未获提交授权时遵守 `AGENTS.md` 的 Git 安全规则。
