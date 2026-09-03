# JAX Cloudflare Node

> [!IMPORTANT]
> ## 🚨 新对话 / ChatGPT 快速接管
> 仓库 `jax2333333/proxy-configs`，分支 `main`。先读根 `README.md` 和 `docs/KNOWLEDGE-INDEX.md`，再读本 README；修改前重新读取 `main` 当前实际文件。真实 ADMIN / UUID / KEY / Token / 订阅链接 / 优选 IP / 认证信息不得写入 Public GitHub。

本目录维护 JAX 的自用 Cloudflare 节点方案。当前采用“两代并存”结构：**v2 edgetunnel 为优先方案，v1 自写 Worker 保留为基线、排错和回滚。**

## 当前结构

```text
cloudflare-node/
├─ README.md                     # 本入口
├─ worker.js                     # v1 自写最简 VLESS Worker
├─ wrangler.jsonc                # v1 Workers 配置
├─ wrangler.toml.example         # v1 参考模板
├─ WINDOWS10-SETUP.md            # v1 / Windows 历史操作教程
├─ RESEARCH-VIDEOS.md            # 视频研究汇总（历史/研究，不是正式配置）
├─ research/                     # 分视频/专项研究笔记
└─ edgetunnel-v2/
   ├─ README.md                  # v2 设计与安全边界
   ├─ DEPLOY.md                  # Pages 从零部署
   ├─ UPSTREAM.md                # 固定上游 commit / blob SHA
   ├─ sync-upstream.mjs          # 构建时下载并校验固定上游
   └─ .gitignore
```

## 当前优先方案：edgetunnel v2

正式读取顺序：

1. `edgetunnel-v2/README.md`
2. `edgetunnel-v2/UPSTREAM.md`
3. `edgetunnel-v2/sync-upstream.mjs`
4. 部署任务再读 `edgetunnel-v2/DEPLOY.md`
5. 排障/优选再读根 `docs/OPERATIONS.md` 与 `docs/TROUBLESHOOTING.md`

长期架构：

```text
GitHub main
→ 固定 cmliu/edgetunnel 上游快照
→ sync-upstream.mjs 校验 Git blob SHA
→ Cloudflare Pages
→ Production Secrets + KV
→ 专用自定义域名
→ VLESS + TLS + WebSocket
→ CF 优选入口
→ edgetunnel / ProxyIP / 可选链式出站
```

当前已经验证：

- Pages Git build 可以从本仓库自动构建固定上游；
- ADMIN / KV / 节点生成可正常工作；
- 自定义域名和 TLS 可正常使用；
- Clash Verge 可使用 edgetunnel 原生 VLESS / 自适应订阅；
- CFData-WEB 本地优选能显著改善中国大陆移动网络到 Cloudflare 的实际吞吐；
- 优选时 `server` 可换成 CF 优选 IP，但 `Host` / `SNI` 必须保持实际自定义域名；
- CF 优选入口与 ProxyIP 是两层不同问题。

真实部署域名、ADMIN、UUID、KEY、订阅 Token、优选 IP、ProxyIP 凭据不在本 Public 仓库保存。需要当前值时从 Cloudflare Dashboard / 本地客户端读取。

## v2 Secrets / KV 原则

敏感值在 Cloudflare Production 环境配置：

```text
ADMIN = 高强度随机密码（Secret）
UUID  = UUIDv4（Secret）
KEY   = 高强度随机密钥（Secret）
OFF_LOG = 1
DEBUG = 默认不设置
```

KV binding 名称固定为：

```text
KV
```

注意：当前固定 edgetunnel 上游不是“零第三方依赖”。如果没有自定义 `PROXYIP`，上游可能使用作者默认 fallback；面板还支持公共优选/订阅服务。正式长期使用应把这些都视为可替换外部依赖。

## Cloudflare 优选长期原则

- 优选 IP 优化的是 **客户端 → Cloudflare**；
- ProxyIP / SOCKS5 / HTTP(S) 优化的是 **Cloudflare → 目标站**；
- 不只看 ping，必须看丢包、延迟稳定性和真实吞吐；
- Windows 10 当前优先使用 CFData-WEB 本地 Web UI；
- 实际吞吐测速尽量单线程/单候选，避免多个 IP 互抢带宽；
- 最终保留少量 3～5 个高速候选即可；
- 视频验证看 YouTube Stats for Nerds 的 Connection Speed / Buffer Health 等实际指标；
- 本地优选时如果必须关闭 Clash，而后台默认域名直连不可达，可用 SwitchHosts / Hosts 临时固定到已验证 CF IP；运行映射不写 Public GitHub。

## v1：自写 Worker 基线

v1 文件：

- `worker.js`
- `wrangler.jsonc`
- `wrangler.toml.example`
- `WINDOWS10-SETUP.md`

设计目标：精简、VLESS + WebSocket + TLS、TCP-only、Secrets 与源码分离。

v1 已完成协议基线验证，但功能少于 v2，历史上还遇到：

- Cloudflare Workers Git 自动 Build 未真正触发；
- 线上仍停留 `Hello world` 默认 Worker；
- `workers.dev` 在实际网络中解析/可达性异常；
- 入口正确后仍需要考虑 Cloudflare 出站限制。

因此 v1 当前不作为首选长期方案，但保留用于：

- 协议排错；
- v2 故障隔离；
- 回滚基线；
- 验证 Cloudflare Workers Runtime 行为。

## 上游更新规则

v2 不自动追随 `cmliu/edgetunnel/main`。

更新必须：

1. 读取当前 `UPSTREAM.md`；
2. 审查上游最新 release / changelog / `_worker.js`；
3. 检查 ADMIN、KV、ProxyIP、订阅、链式代理和日志兼容性；
4. 同时更新固定 commit 与对应 Git blob SHA；
5. Preview/Test；
6. Clash Verge / Shadowrocket + Google / YouTube / ChatGPT 实测；
7. 再进入生产。

不要在 Cloudflare Dashboard 直接手改 `_worker.js` 作为正式长期维护方式。

## 安全红线

禁止提交：

- ADMIN / UUID / KEY；
- Cloudflare API Token / API Key；
- 订阅 Token / 完整分享链接；
- Cookie / Authorization / 密码；
- ProxyIP / SOCKS5 / HTTP(S) 认证凭据；
- 私钥和其它账号认证信息。

研究视频、公开第三方方案和公共 ProxyIP 只能作为参考，不自动升级为正式依赖。

## 文档入口

- 当前跨项目状态：`../docs/CURRENT-STATE.md`
- 日常维护 / CFData 优选 / 后台直连：`../docs/OPERATIONS.md`
- 常见故障：`../docs/TROUBLESHOOTING.md`
- 历史迁移：`../docs/HISTORY.md`
- v2 设计：`edgetunnel-v2/README.md`
- v2 部署：`edgetunnel-v2/DEPLOY.md`
- v2 上游固定：`edgetunnel-v2/UPSTREAM.md`
