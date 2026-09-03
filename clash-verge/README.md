# Clash Verge / Mihomo — JAX

> ## 🚨 新对话 / ChatGPT 快速接管
> 仓库 `jax2333333/proxy-configs`，分支 `main`。先读 `../AGENTS.md`、本 README、`docs/CHATGPT-MAINTENANCE-PROMPT.md`、`docs/KNOWLEDGE-INDEX.md`，再按索引读取任务相关文件。`main` 是唯一正式版本；修改前重新读取实际文件；只改 `clash-verge/`；真实机场订阅只保存在本地 Merge。

## 项目目标

维护一套可长期托管、可恢复、可审计的 Clash Verge Rev / Mihomo 配置：

- GitHub 只保存公共配置模板。
- 真实机场订阅与认证信息留在本地。
- DNS、TUN、策略组、规则与节点筛选集中维护。
- 新设备只需导入 GitHub Raw 配置，再恢复本地 Merge 即可接管。
- 后续 ChatGPT 不依赖旧聊天内容，先从 GitHub `main` 读取当前实际状态。

## 当前唯一正式配置

正式配置文件：

- `clash-verge/clash-verge-by-jax.yaml`

Raw 地址：

- `https://raw.githubusercontent.com/jax2333333/proxy-configs/main/clash-verge/clash-verge-by-jax.yaml`

**重要：实际端口、版本号、DNS 地址、TUN 参数、策略组顺序、Rule Provider 等会变化的信息，以 `main` 分支中该 YAML 的最新内容为准，不以本文或聊天记录中的快照为准。**

当前 YAML 顶部标识为 **JAX V2.2 GitHub Template**。如果以后版本变化，应优先读取 YAML，而不是继续使用这里的版本字符串。

## 当前架构

```text
GitHub main
└─ clash-verge/clash-verge-by-jax.yaml
   ├─ 公共 Mihomo 配置
   ├─ DNS / Fake-IP
   ├─ TUN
   ├─ 策略组
   ├─ Rule Providers
   └─ Rules
        +
Clash Verge 本地「订阅扩展配置 / Merge」
└─ proxy-providers.Airport1
   └─ 真实机场订阅 URL（仅本地）
        ↓
Clash Verge Rev
        ↓
Mihomo 最终运行配置
```

注意：Clash Verge 自身设置或 Merge 可能继续覆写 YAML，因此**GitHub 配置 ≠ 必然等于最终运行值**。排障时应同时检查当前 YAML、Clash Verge 本地设置和运行日志。

## 已完成状态

当前正式方案已经完成并验证以下设计：

- GitHub 主配置与真实机场订阅分离。
- Fake-IP 模式，IPv6 默认关闭。
- TUN 使用 `mixed` 作为仓库模板目标栈；macOS 不配置 Linux-only 的 `auto-redirect`。
- 国内域名使用国内 DNS 路径；境外默认 DNS 使用 Cloudflare / Google DoH 并通过代理组连接。
- `proxy-server-nameserver` 单独负责机场节点域名解析。
- 节点组使用 `include-all-providers` 接收本地 Merge 注入的 Provider。
- 节点筛选采用 `filter` + `exclude-filter`，避免旧式复杂负向正则误伤节点名。
- 保留香港、日本、新加坡、美国的智能选择、手动选择和故障转移组。
- 已建立 `🇨🇳 国内流量` 和 `🐟 漏网之鱼` 两层语义：国内规则可见可切换，最终未命中流量进入 MATCH 兜底。
- Steam 国内下载/CDN 使用 `steam@cn.mrs`，并置于 Steam 商店规则之前。
- 已移除曾经不存在/404 的 `apple_ip.mrs`、`steam_ip.mrs` 依赖。
- Mihomo API 模板只监听本机回环地址，避免无认证 API 暴露到局域网。
- 已通过实际日志验证 AI、Google、GitHub、YouTube、国内直连、广告拦截和漏网兜底能按预期命中。

## 当前策略语义

具体组名、默认顺序与候选项必须读取最新 YAML。长期语义如下：

- `🔮 节点选择`：主要人工入口。
- `♻️ 智能选择`：全 Provider 自动测速选择。
- 地区智能组：香港 / 日本 / 狮城 / 美国。
- 地区手动组：香港 / 日本 / 狮城 / 美国。
- 地区故转组：对应地区的 fallback。
- 应用组：AI、YouTube、Telegram、GitHub、Apple、Microsoft、OneDrive、Netflix、TikTok、Steam 等。
- `🇨🇳 国内流量`：中国大陆域名/IP 分流，默认策略由当前 YAML 与运行时选择决定。
- `🐟 漏网之鱼`：最终 `MATCH` 兜底。
- `🛑 全局拦截`：广告/拦截规则入口。

节点筛选长期原则：不要把“免费、流量/套餐提示、明显低倍率测试节点、现有配置明确排除的倍率节点”作为正常自动高速节点。**精确排除表达式以最新 YAML 为准。**

## 文件结构

```text
clash-verge/
├─ README.md
├─ clash-verge-by-jax.yaml          # 当前唯一正式配置
└─ docs/
   ├─ CHATGPT-MAINTENANCE-PROMPT.md # ChatGPT 角色、读取顺序、修改/安全规则
   ├─ KNOWLEDGE-INDEX.md             # 任务 → 应读取文件的知识地图
   ├─ INSTALL-AND-RECOVERY.md        # 从零安装、迁移、恢复教程
   ├─ TROUBLESHOOTING.md             # 日志与常见故障排查
   └─ HISTORY.md                     # 历史迁移、已淘汰方案、已验证修复
```

## 维护边界

这个目录只负责 Clash Verge。除非用户明确说 **“同步更新三套配置”**，否则：

- 不修改 `openclash/`。
- 不修改 `shadowrocket/`。
- 不把其他客户端的语法机械复制到 Clash Verge。

## 安全红线

GitHub 仓库为 Public。严禁写入：

- 真实机场订阅 URL
- 密码、Cookie、Token、API Key
- UUID / Secret / Private Key
- 验证码、Authorization Header
- SSH 私钥或其他私人认证信息

如果敏感信息曾经出现在公开历史中，应建议用户**重置/轮换凭据**；不要在文档、提交信息或聊天回复中再次完整复述。

## 文档入口

- ChatGPT 如何接管与修改：`docs/CHATGPT-MAINTENANCE-PROMPT.md`
- 不同任务应该读什么：`docs/KNOWLEDGE-INDEX.md`
- 新设备安装 / 恢复：`docs/INSTALL-AND-RECOVERY.md`
- 日志异常 / TUN / DNS / Provider：`docs/TROUBLESHOOTING.md`
- 为什么当前配置这样设计：`docs/HISTORY.md`
