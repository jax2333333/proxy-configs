# JAX OpenClash 配置项目

> [!IMPORTANT]
> ## 🚨 新对话 / ChatGPT 快速接管
> **给新 ChatGPT：** 这是 `jax2333333/proxy-configs` 的 OpenClash 子项目。`main` 是唯一正式版本。读取 openclash/README.md ，再按 `docs/KNOWLEDGE-INDEX.md` 读取 `docs/CHATGPT-MAINTENANCE-PROMPT.md`、当前 YAML 和任务相关文档。**修改前必须重新读取 main；默认只改 `openclash/`；禁止把任何真实订阅或凭据写入 GitHub。**

## 项目目标

这套配置用于 R2S / ImmortalWrt 上的 OpenClash（Mihomo），长期目标是：

- 国内流量低延迟直连，国外流量按规则走代理。
- DNS 优先防泄漏，避免境外域名回落到 ISP / 国内解析器。
- Fake-IP 为主，保持现有规则、DNS、Smart 分组和应用分流逻辑。
- IPv6 默认保持关闭公网出口，除非后续有明确需求并重新验证泄漏风险。
- 配置尽量由 GitHub 管理；机场真实订阅地址只保留在 R2S 本地覆写模块。
- 修改以“最小变更、可验证、可回滚”为原则，不为优化而无关重构。

## 当前正式配置

当前维护两套正式配置，按实际机场数量选择：

- 双机场：[`openclash_by_jax_双机场.yaml`](./openclash_by_jax_双机场.yaml)
- 单机场：[`openclash_by_jax_单机场.yaml`](./openclash_by_jax_单机场.yaml)

**IPv6 实验版（非正式、不自动切换）**：[`openclash_by_jax_双机场_IPv6.yaml`](./openclash_by_jax_双机场_IPv6.yaml)。以当前双机场 IPv4 正式版为基线，仅启用 Mihomo IPv6、DNS AAAA 和 IPv6 Fake-IP 地址池；需要配合 R2S 的 WAN6 / OpenClash IPv6 代理 / DNS 防泄漏逐项验收。**原双机场 IPv4 YAML 仍是默认正式版**，部署与回滚见 [`docs/OPERATIONS.md`](./docs/OPERATIONS.md)。

> 配置版本、端口、Provider、策略组、DNS 字段等会变化。**不要把本 README 当成运行配置副本；任何修改前都必须重新读取所选 YAML 的 `main` 最新内容。** 当前状态以 GitHub `main` 中实际 YAML 为准。

R2S 配置订阅应按使用模式读取本仓库 Raw：

双机场：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_双机场.yaml
```

单机场：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_单机场.yaml
```

旧 Gist 不再作为正式源；如果 R2S 更新后仍是旧版本，先检查配置订阅地址是否与当前所选模式一致。

## 当前架构

```text
GitHub main
  ├─ openclash/openclash_by_jax_双机场.yaml
  ├─ openclash/openclash_by_jax_单机场.yaml
  │    └─ 两套正式 YAML 的 Provider URL 均为占位值
  └─ openclash/toolkit/scripts/
       └─ Provider URL 缓存守卫及启动钩子模板
            ▼
R2S OpenClash 配置订阅 + 本地部署工具脚本
  ├─ GitHub 正式 YAML
  └─ 本地覆写 local-airport.txt
       └─ 只保存真实机场订阅 URL，不进 GitHub
            ▼
OpenClash 启动时检查 URL 指纹 → 必要时清理对应 Provider 缓存 → Mihomo
```

### Provider / 策略分工

双机场配置当前结构：

| Provider | 定位 | 节点前缀 | 总 Smart | 地区 Smart | 手动/测速聚合 |
|---|---|---|---:|---:|---:|
| `Airport-A` | 主力机场 | `A|` | ✅ | ✅ | ✅ |
| `Airport-B` | 辅助机场 | `B|` | ✅ | ✅ | ✅ |

双机场 YAML 当前只对香港、日本、台湾、美国、新加坡建立 A/B 独立地区 Smart，共 10 个地区 Smart 组；另有 `A|智能选择`、`B|智能选择` 两个总 Smart。`🖐️ 手动选择` 与 `🛠️ 节点测速` 直接聚合两个 Provider，不存在“地区手动组”、`🌐 全部节点`、`♻️智能选择` 或 `♻️AI智能选择`。

单机场配置只保留 `Airport-A`，不添加 A/B 节点前缀，使用 `智能选择`、5 个地区 Smart、`🖐️ 手动选择` 和 `🛠️ 节点测速`。

`🤖 AI` 当前显式列出的地区 Smart 不含香港，但两套 YAML 都仍包含一个未按地区过滤的总 Smart（双机场为 `A|智能选择`，单机场为 `智能选择`）。因此当前配置不能描述为“严格排除全部香港路径”；如果要收紧这一点，应单独修改 YAML 并验证。

### Provider URL 缓存守卫

R2S 已验证：同名 HTTP Provider 更换 URL 后，OpenClash 可能继续使用 `/etc/openclash/proxy_provider/` 中的旧缓存。仓库提供 [`provider-cache-guard.sh`](./toolkit/scripts/provider-cache-guard.sh) 和 [`openclash_custom_overwrite.sh`](./toolkit/scripts/openclash_custom_overwrite.sh) 部署模板，在启动阶段比较 URL 的 SHA256；只有 URL 变化时才备份并清除对应 Provider 缓存。首次运行只建立指纹，不删除缓存，真实 URL 永远不会写入状态文件或日志。

部署、回滚与验证步骤见 [`docs/OPERATIONS.md`](./docs/OPERATIONS.md)；故障判断见 [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md)。本地已有自定义覆写逻辑时，只合并守卫调用，不要直接覆盖原文件。

## 当前长期偏好

- Apple 默认直连，同时保留代理可选项；Apple Intelligence / Relay 统一交给 `🍎 Apple`。
- APNs / `push.apple.com` 优先直连。
- AI、YouTube、Telegram、GitHub、Netflix、TikTok、Steam、Microsoft、OneDrive 等保持独立策略语义。
- 路由器端规则以 MetaCubeX `meta-rules-dat` 的 MRS 规则为主；`ios_rule_script` 主要用于规则来源核对或补充没有等价 MRS 的专项规则，避免重复叠加大型 classical 规则集。
- Steam 国内下载与商店仍使用独立规则集识别，但统一进入 `🎮 Steam` 策略组。
- ZeroTier 控制 / 打洞仅对 **UDP 9993** 设置高优先级直连。
- 智能选择通常排除明显“免费 / 0.01 倍率”等低质量节点；是否进一步排除其它倍率，必须读当前 YAML 后再改。
- `browserleaks.com` 保留高优先级代理规则，避免被 `cn_domain` 误分类后直连。
- DNS 当前设计为：境外默认使用海外加密 DNS；中国域名和 DIRECT 使用国内 DoH；节点域名使用国内 DoH 避免启动死循环。详细字段以当前 YAML 为准。

## 知识文件

- [`docs/KNOWLEDGE-INDEX.md`](./docs/KNOWLEDGE-INDEX.md) — 任务到知识文件的导航地图。
- [`docs/CHATGPT-MAINTENANCE-PROMPT.md`](./docs/CHATGPT-MAINTENANCE-PROMPT.md) — ChatGPT 角色、读取顺序、行为和安全规则。
- [`docs/CURRENT-STATE.md`](./docs/CURRENT-STATE.md) — 当前架构和长期有效设计说明；正式值仍以 YAML 为准。
- [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) — R2S 配置订阅、本地覆写、恢复与日常更新流程。
- [`docs/TROUBLESHOOTING.md`](./docs/TROUBLESHOOTING.md) — 日志优先的故障诊断和常见问题。
- [`docs/HISTORY.md`](./docs/HISTORY.md) — 历史版本、已验证实验和已解决问题；**历史信息不是当前配置。**

## 安全边界

严禁提交到 GitHub：真实机场订阅 URL、密码、Cookie、Token、API Key、SSH 私钥、Secret、验证码、Authorization Header、UUID/私钥类认证信息或其它私人凭据。

仓库中的 Provider URL 必须是占位地址。真实机场地址只允许在 R2S 本地 `local-airport.txt` 中保存。若聊天、截图或日志出现真实凭据，维护时必须脱敏，不能复制回仓库。

## OpenClash 权威参考

所有 OpenClash 功能设置与故障诊断，在回答或修改前先读取官方维护的 OpenClash 用户指南入口，并按其路由表只加载相关章节：

```text
https://raw.githubusercontent.com/vernesong/OpenClash/dev/.github/skills/openclash-user-guide/SKILL.md
```

如果指南未覆盖，再查 Mihomo Wiki、OpenClash/Mihomo 源码与 Issues；不要凭记忆猜字段或根因。
