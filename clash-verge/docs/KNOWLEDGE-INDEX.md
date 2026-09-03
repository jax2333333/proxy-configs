# Clash Verge Knowledge Index

本文件是知识地图。新 ChatGPT 不需要一次读取全部文档，应按任务最小化加载。

## 必读入口

任何 Clash Verge 任务先读：

1. `../README.md`
2. `../../AGENTS.md`
3. `CHATGPT-MAINTENANCE-PROMPT.md`
4. 当前任务需要的专项文档
5. 真正准备修改时读取最新 `../clash-verge-by-jax.yaml`

## 任务路由表

| 任务 | 必读文件 | 说明 |
| --- | --- | --- |
| 新对话快速接管 | `../README.md` → `CHATGPT-MAINTENANCE-PROMPT.md` | 建立范围、Source of Truth、安全规则 |
| 查看当前正式配置 | `../clash-verge-by-jax.yaml` | YAML 本身是唯一正式配置，不以文档快照替代 |
| 修改 DNS / Fake-IP | `CHATGPT-MAINTENANCE-PROMPT.md` + 最新 YAML | 同时检查 `nameserver`、`proxy-server-nameserver`、`direct-nameserver`、策略组连接关系 |
| 修改 TUN | `TROUBLESHOOTING.md` + 最新 YAML | 先确认系统、Clash Verge 本地覆写与运行日志 |
| 修改策略组 / 节点筛选 | 最新 YAML + `HISTORY.md` | 保留 `filter + exclude-filter`、Provider 注入和既有组语义 |
| 修改 Rule Provider / Rules | 最新 YAML + `HISTORY.md` | 先验证外部 MRS 当前存在，再检查规则顺序 |
| Steam 分流 | 最新 YAML + `HISTORY.md` | 国内 `steam@cn` 应先于通用 Steam 规则 |
| 新设备安装 | `INSTALL-AND-RECOVERY.md` + 最新 YAML | GitHub Remote + 本地 Merge |
| 换电脑 / 恢复配置 | `INSTALL-AND-RECOVERY.md` | GitHub 不保存机场秘密，需重新恢复本地 Merge |
| 日志异常 | `TROUBLESHOOTING.md` + 用户日志 + 最新 YAML | 区分启动瞬态与持续故障 |
| `interface not found` | `TROUBLESHOOTING.md` | 重点看错误持续时间和何时重新识别物理网卡 |
| Microsoft warning | `TROUBLESHOOTING.md` | 单个遥测域名失败不等于整体 DNS 失败 |
| `badjs.weixinbridge.com` | `TROUBLESHOOTING.md` | 微信前端 JS 错误/遥测域名；不要仅因名称直接判定异常 |
| 查看历史为什么这样改 | `HISTORY.md` | 包含旧 Gist、Steam、MRS 404、正则、TUN 等历史 |
| 安全审计 | `CHATGPT-MAINTENANCE-PROMPT.md` + 最新 YAML | 扫描订阅 URL / Token / Key / Secret / API 暴露 |
| 同步三套配置 | 根 `AGENTS.md` + 三个平台最新文件 | 仅用户明确说“同步更新三套配置”时执行 |

## 当前配置的权威层级

从高到低：

1. GitHub `main` 中 `clash-verge-by-jax.yaml` 当前内容。
2. Clash Verge 最终运行配置 / 日志（用于确认应用本地覆写后的实际行为）。
3. 本目录维护文档（用于解释意图、流程、历史）。
4. 旧 Gist / Notion / 聊天记录 / 附件。

如果第 1 与第 3 不一致，以第 1 为准，并在本次维护中同步修正文档。

如果第 1 与第 2 不一致，不要马上改 GitHub；先检查 Clash Verge 自身设置和 Merge 是否覆写。

## 外部资料路由

Mihomo 字段、底层行为或错误原因无法从本仓库确定时：

1. 读取 OpenClash 用户指南入口，按其要求路由到权威资料。
2. 查 Mihomo Wiki / Meta-Docs。
3. 内核行为查 Mihomo 源码。
4. Bug / 报错查 Mihomo Issues。

不要凭印象补全未知字段。
