# JAX Proxy Configs 维护规则

## 1. 仓库原则

- GitHub 仓库 `jax2333333/proxy-configs` 的 `main` 分支是唯一正式版本。
- 每次修改前必须先确认分支、读取远端 `main` 最新状态与当前实际文件。
- 不允许根据聊天历史、旧代码、旧附件直接覆盖 GitHub 当前版本。
- 当前仓库文件永远优先于聊天中的旧配置。
- 如果使用本地 Git 且存在未提交修改，必须先说明，不得擅自覆盖。

## 2. 仓库结构

本仓库主要维护：

- `shadowrocket/`：iPhone Shadowrocket 专用配置
- `clash-verge/`：macOS Clash Verge 专用配置
- `openclash/`：ImmortalWrt / OpenClash 专用配置
- `openwrt/`：R2S / OpenWrt / ImmortalWrt 系统运维知识
- `cloudflare-node/`：Cloudflare 节点方案

除非用户明确要求跨项目同步，否则：

- 修改 OpenClash 时只修改 `openclash/`。
- 修改 OpenWrt / ImmortalWrt 运维知识时只修改 `openwrt/`。
- 修改 Clash Verge 时只修改 `clash-verge/`。
- 修改 Shadowrocket 时只修改 `shadowrocket/`。
- 修改 Cloudflare 节点时只修改 `cloudflare-node/`。
- 仓库知识结构变化才联动根 README / docs / AGENTS。

## 3. 敏感信息

严禁写入 GitHub：

- 机场真实订阅地址
- UUID
- API Token
- Private Key
- Password
- Cookie
- Authorization Header
- Cloudflare Token / API Key / Tunnel Secret
- WireGuard / SSH 私钥
- DDNS / VPN 私人认证信息
- 任何账号凭据

真实机场订阅地址只允许保存在本地配置。

如果发现疑似敏感信息：

- 停止提交。
- 明确警告用户。
- 不将其加入 Git。

## 4. OpenWrt / ImmortalWrt

`openwrt/` 维护系统运维、网络、性能、DNS、防火墙、升级、存储、安全和故障知识。

长期原则：

- 当前场景是 R2S + ImmortalWrt 主路由，并运行 OpenClash。
- 动态系统值从 R2S 实机读取，不从聊天写死。
- 优化遵守“基线 → 单项修改 → 复测 → 保留/回滚”。
- Packet Steering、IRQ、Flow Offloading、SQM、MTU 与 OpenClash 联动判断。
- 不使用来源不明的一键优化脚本。
- IPv6 默认保持关闭，除非用户明确要求并重新验证。
- `openwrt/` 不复制 OpenClash YAML；OpenClash 配置仍归 `openclash/`。

## 5. OpenClash

`openclash/` 只维护 OpenClash 配置。

当前长期原则：

- 主路由环境为 ImmortalWrt + OpenClash。
- IPv6 默认关闭。
- 使用 Fake-IP 模式。
- Fake-IP 范围保持现有设计。
- TUN 优先使用当前已经验证的方案。
- DNS 配置必须优先考虑防止 DNS 泄露。
- Respect Rules 相关 DNS 设置必须保持完整。
- 不要因为解决一个 DNS 问题而破坏已有代理分流。

策略组需要保留现有逻辑，包括 Apple、AI、YouTube、Spotify、Telegram、TikTok，并保持当前用户已经设定的平台偏好。

智能选择相关策略需要避免把免费、0.01 / x0.01 / x0.1 等明确低倍率测试节点作为正常高速节点，除非用户明确要求。

## 6. Clash Verge

`clash-verge/` 只维护 macOS Clash Verge 配置。

- 真实机场订阅 URL 不得写入 GitHub。
- 本地 Merge 中的订阅地址不得复制到仓库。
- 修改前检查当前 Merge / Override 结构。
- 保持现有分流组语义。
- 不因为 OpenClash 的配置变化自动同步 Clash Verge。
- 修改 YAML 后检查语法、缩进、重复键和 provider 引用。

## 7. Shadowrocket

`shadowrocket/` 只维护 iPhone Shadowrocket 配置。

- 保持最小化 MITM 原则。
- 不随意扩大 hostname。
- 只有确定需要 HTTPS 解密的网站才加入 MITM。
- 新增脚本前检查现有模块是否已经具备相同功能。
- 不因为单个网站需求扩大为全局 MITM。

## 8. JAX 网站净化中心

核心文件：

- `shadowrocket/toolkit/modules/site-cleaner.sgmodule`
- `shadowrocket/toolkit/scripts/site-cleaner.js`

维护规则：

- 用户提供一个网站 URL 并要求净化时，视为加入 JAX 网站净化中心。
- 修改前必须读取 GitHub 当前最新版。
- 先分析广告、横幅、弹窗、iframe、跳转、浮层及其它干扰元素。
- 尽量统一加入 `site-cleaner.js`。
- `site-cleaner.sgmodule` 只添加必要的 Rule、Script pattern、MITM hostname。
- MITM hostname 必须最小化。
- 不影响登录、支付、核心交互和正常内容。

## 9. Cloudflare 免费节点相关内容

- 必须在 `cloudflare-node/` 独立管理。
- 与 Shadowrocket / Clash Verge / OpenClash 主配置分离。
- UUID、Token、密钥等敏感内容禁止写入 GitHub。
- 仓库中只保存模板、脚本、说明和不含凭据的配置。
- 修改前检查是否存在意外暴露公网信息或凭据的风险。

## 10. 修改原则

所有修改遵守：

- 最小修改。
- 不无关重构。
- 不擅自改变现有策略组名称。
- 不擅自删除已有规则。
- 不擅自改变代理逻辑。
- 不擅自打开 IPv6。
- 不为了“优化”而重写整个配置。
- 保留现有注释和目录设计。

如果用户只要求解决一个问题，只修改解决该问题所需的最小范围。

## 11. 验证

YAML 修改后检查：

- YAML 是否可解析
- 缩进 / 重复键
- provider / proxy-group / rule-provider 引用
- DNS 结构
- script / module 路径

JavaScript 修改后检查：

- 基本语法
- 变量作用域
- JSON 解析
- 异常处理
- 是否可能破坏目标网页正常功能

OpenWrt / ImmortalWrt 修改后检查：

- 动态值来自实机
- 相关服务能正常启动
- `logread` / `dmesg`
- LAN/WAN/DNS/OpenClash 核心路径
- 有线基线
- CPU / softirq / 温度
- 明确回滚方法

GitHub 修改完成后必须重新读取修改后的实际文件，并向用户汇报修改文件、目的、验证结果、潜在风险和 commit。

## 12. Git 安全

默认禁止自动执行高风险 Git 操作，包括 force push、hard reset、clean、rebase main 和删除远程分支。

`git commit` / push 只有用户明确授权时执行。本次若用户明确要求“写入 GitHub并告诉 commit”，视为已授权正常提交到 `main`，但仍必须在提交前重新读取最新 `main`，并保证快进更新。

## 13. 网络安全原则

修改代理或路由配置时优先关注：

- DNS 泄露
- IPv6 泄露
- 代理绕过
- 错误直连
- 规则覆盖顺序
- 节点失效后的回退逻辑
- 管理面公网暴露

不要宣称某个配置“绝对匿名”或“无法被识别”。

## 14. 模型与推理强度提醒

每个新的实际任务开始前，先判断任务复杂度，以及完成该任务所推荐的模型与推理强度。

- 查看文件、搜索、简单文字修改：Terra · 轻 / 中。
- 常规仓库维护、单文件 YAML 修改、简单规则调整、Git 操作：Terra · 中。
- OpenClash、Clash Verge、Shadowrocket 配置修改，以及 DNS、Fake-IP、TUN、策略组、规则匹配、MITM：Terra · 高。
- OpenWrt / ImmortalWrt 系统优化、SQM、IRQ、Flow Offloading、DNS 与 OpenClash 联动：Sol · 高。
- 同时检查多个平台、复杂网络安全审计、高风险架构重构：Sol · 极高 / Max。

当前档位已合适时简短提示一次后继续；需要切换时说明推荐档位并等待用户切换。
