# 知识地图 / Knowledge Index

本文件用于告诉新的 ChatGPT：**不同任务应该读取哪些文件**。不要一次性把整个仓库当成同一个配置，也不要把历史资料当成正式状态。

## 先读什么

任何任务先读：

1. 根 `README.md`
2. 本文件 `docs/KNOWLEDGE-INDEX.md`
3. `AGENTS.md`
4. 目标子目录 `README.md`
5. `main` 中的实际目标配置 / 脚本或实际运行状态

然后只读取当前任务对应的专项资料。

---

## 资料类型边界

### 当前正式配置

权威值来自实际配置 / 脚本 / 构建文件：

- `shadowrocket/Jax-shadowrocket-v6.conf`
- `shadowrocket/Jax-shadowrocket-home-clean.conf`
- `clash-verge/clash-verge-by-jax.yaml`
- `openclash/openclash_by_jax_v5.yaml`
- `cloudflare-node/worker.js`（v1 基线）
- `cloudflare-node/wrangler.jsonc`（v1）
- `cloudflare-node/edgetunnel-v2/sync-upstream.mjs`（v2 构建与 pin）
- `cloudflare-node/edgetunnel-v2/UPSTREAM.md`（v2 固定上游信息）

OpenWrt / ImmortalWrt 系统运行值目前以 R2S 实机为权威，不在 Public GitHub 镜像整份 `/etc/config/*`。

动态值必须从这些文件或实际运行环境重新读取。

### 当前状态说明

- 根：`docs/CURRENT-STATE.md`
- Shadowrocket：`shadowrocket/README.md` + `shadowrocket/docs/` 中的 CURRENT 文档
- Clash Verge：`clash-verge/README.md` + `clash-verge/docs/`
- OpenClash：`openclash/README.md` + `openclash/docs/CURRENT-STATE.md`
- OpenWrt / ImmortalWrt：`openwrt/README.md` + `openwrt/docs/CURRENT-STATE.md`
- Cloudflare：`cloudflare-node/README.md` + `cloudflare-node/edgetunnel-v2/README.md`

### 操作教程

- 根：`docs/OPERATIONS.md`
- Shadowrocket：`shadowrocket/docs/OPERATIONS.md`
- Clash Verge：`clash-verge/docs/INSTALL-AND-RECOVERY.md`
- OpenClash：`openclash/docs/OPERATIONS.md`
- OpenWrt / ImmortalWrt：`openwrt/docs/OPERATIONS.md` + 专项 docs
- Cloudflare v1 Windows：`cloudflare-node/WINDOWS10-SETUP.md`
- Cloudflare v2 Pages：`cloudflare-node/edgetunnel-v2/DEPLOY.md`

### 历史 / 研究资料

只能用于理解原因，不得直接当成当前配置：

- 根：`docs/HISTORY.md`
- 各子目录 `docs/HISTORY.md`
- `cloudflare-node/RESEARCH-VIDEOS.md`
- `cloudflare-node/research/`

### ChatGPT / Agent 工作规则

- `docs/CHATGPT-MAINTENANCE-PROMPT.md`
- `AGENTS.md`
- 各子项目自己的 `docs/CHATGPT-MAINTENANCE-PROMPT.md`

---

## 按任务读取

### 1. 仓库整体状态 / 新对话接管

读取：

- `README.md`
- `docs/CURRENT-STATE.md`
- `docs/CHATGPT-MAINTENANCE-PROMPT.md`
- `AGENTS.md`

如果用户随后指定某个平台，再进入对应子目录。

### 2. Shadowrocket 主配置 / 场景切换 / DNS / 策略组

读取：

- `shadowrocket/README.md`
- `shadowrocket/docs/KNOWLEDGE-INDEX.md`
- `shadowrocket/Jax-shadowrocket-v6.conf`
- 家庭 Wi-Fi 任务再读 `shadowrocket/Jax-shadowrocket-home-clean.conf`
- 按 Shadowrocket 子索引继续读取对应 docs

默认只改 `shadowrocket/`。

### 3. JAX 网站净化中心 / 单网站净化

读取：

- `shadowrocket/README.md`
- `shadowrocket/toolkit/README.md`
- `shadowrocket/toolkit/modules/site-cleaner.sgmodule`
- `shadowrocket/toolkit/scripts/site-cleaner.js`
- 必要时读取目标网站现状

原则：MITM 最小化，不用 `hostname=*`，不破坏登录/支付/核心交互。

### 4. Clash Verge / Mihomo

读取：

- `clash-verge/README.md`
- `clash-verge/docs/KNOWLEDGE-INDEX.md`
- `clash-verge/clash-verge-by-jax.yaml`
- 任务相关的 `clash-verge/docs/*.md`

真实机场 Provider URL 在本地 Merge，不从聊天复制到 GitHub。

### 5. OpenClash / R2S / ImmortalWrt 代理配置

读取：

- `openclash/README.md`
- `openclash/docs/KNOWLEDGE-INDEX.md`
- `openclash/openclash_by_jax_v5.yaml`
- 任务相关 `openclash/docs/*.md`
- 涉及 OpenClash 功能设置时按该 README 指向的官方 OpenClash 用户指南加载对应章节

真实 Provider URL 在 R2S 本地覆写，不写 GitHub。

### 6. OpenWrt / ImmortalWrt 系统运维 / R2S 性能

读取：

- `openwrt/README.md`
- `openwrt/docs/KNOWLEDGE-INDEX.md`
- `openwrt/docs/CHATGPT-MAINTENANCE-PROMPT.md`
- `openwrt/docs/CURRENT-STATE.md`
- 任务相关 `openwrt/docs/*.md`
- R2S 实机当前状态

默认只改 `openwrt/`。涉及 OpenClash YAML 时，再进入 `openclash/`，不要复制配置到 `openwrt/`。

### 7. Cloudflare 免费节点 — 总览

先读：

- `cloudflare-node/README.md`
- `docs/CURRENT-STATE.md` 的 Cloudflare 部分
- `docs/TROUBLESHOOTING.md` 的 Cloudflare 部分

然后判断是 v1 还是 v2。

### 8. Cloudflare v2 / edgetunnel / Pages / KV / 优选

读取：

- `cloudflare-node/edgetunnel-v2/README.md`
- `cloudflare-node/edgetunnel-v2/DEPLOY.md`
- `cloudflare-node/edgetunnel-v2/UPSTREAM.md`
- `cloudflare-node/edgetunnel-v2/sync-upstream.mjs`
- 优选/维护任务再读 `docs/OPERATIONS.md`
- 背景研究才读 `cloudflare-node/RESEARCH-VIDEOS.md`、`cloudflare-node/research/`

注意：真实 ADMIN、UUID、KEY、订阅 Token、运行域名、优选 IP、ProxyIP 凭据通常不在 Public GitHub。需要时从 Cloudflare Dashboard / 本地客户端读取，不要从旧聊天硬编码。

### 9. Cloudflare v1 / 自写 Worker

读取：

- `cloudflare-node/README.md`
- `cloudflare-node/worker.js`
- `cloudflare-node/wrangler.jsonc`
- `cloudflare-node/WINDOWS10-SETUP.md`

v1 当前主要用于基线、排错和回滚。不要因 v2 已验证就删除。

### 10. Cloudflare 上游升级

读取：

- `cloudflare-node/edgetunnel-v2/UPSTREAM.md`
- `cloudflare-node/edgetunnel-v2/sync-upstream.mjs`
- 上游 `cmliu/edgetunnel` 最新 CHANGELOG / `_worker.js` / release
- `docs/OPERATIONS.md`

必须人工审查后同时更新 commit 和 blob SHA，先 Preview/Test，再生产验证。

### 11. 故障排查

先读：

- `docs/TROUBLESHOOTING.md`
- 目标子项目自己的 TROUBLESHOOTING 文档
- 当前实际日志和实际配置

不要先改配置再找原因。

### 12. 历史原因 / “为什么这样设计”

读取：

- `docs/HISTORY.md`
- 目标子项目的 `docs/HISTORY.md`
- Cloudflare 视频/研究资料（如相关）

历史结论必须回到当前实际配置验证后才能用于修改。
