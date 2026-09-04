# OpenClash 知识索引

本文件只负责“去哪里读”，避免把当前配置、历史、教程和 ChatGPT 规则混在一起。

## 新 ChatGPT 接管顺序

1. `../README.md` — 项目入口、边界、当前架构摘要。
2. `CHATGPT-MAINTENANCE-PROMPT.md` — AI 行为、读取顺序、安全与 GitHub 规则。
3. `../openclash_by_jax_v6.yaml` — **当前正式配置，main 最新版永远优先。**
4. 根据任务选择下面的专项文档。
5. OpenClash 官方用户指南入口：`https://raw.githubusercontent.com/vernesong/OpenClash/dev/.github/skills/openclash-user-guide/SKILL.md`，按其路由表读取对应章节。

## 任务 → 应读取文件

| 任务 | 先读 | 再读 / 外部参考 |
|---|---|---|
| 了解当前架构、Provider、DNS、策略组 | `CURRENT-STATE.md` + 当前 YAML | OpenClash 指南相关章节 |
| 修改任何 YAML | 当前 YAML + `CHATGPT-MAINTENANCE-PROMPT.md` | Mihomo Wiki / OpenClash 指南 |
| 新增/删除机场 Provider | `OPERATIONS.md` + 当前 YAML | Mihomo proxy-providers 文档 |
| 修改 A/B 地区 Smart、手动节点组或 AI 选择 | 当前 YAML + `CURRENT-STATE.md` | Mihomo proxy-groups / Smart 资料 |
| R2S 更新不到 GitHub 最新配置 | `OPERATIONS.md` + `TROUBLESHOOTING.md` | OpenClash `12-subscribe-config.md` |
| 本地 `local-airport.txt` 覆写 | `OPERATIONS.md` | OpenClash `16-overwrite-module-format.md` |
| Provider URL 已变化但节点不更新 | `OPERATIONS.md` + `TROUBLESHOOTING.md` + `../toolkit/scripts/` | OpenClash `01-architecture.md`、`16-overwrite-module-format.md` |
| DNS 泄漏、Fake-IP、DNS 策略 | 当前 YAML + `CURRENT-STATE.md` + `TROUBLESHOOTING.md` | OpenClash `09-settings-dns-ac-ipv6.md` + Mihomo DNS 文档 |
| 运行模式 / TUN / Mix / 性能 | `HISTORY.md` + `TROUBLESHOOTING.md` | OpenClash `08-settings-mode-traffic.md` |
| Hysteria2 / TUIC / QUIC 异常 | `TROUBLESHOOTING.md` | OpenClash `08-settings-mode-traffic.md`、`14-diagnostics.md`、Mihomo Issues |
| 启动失败、节点不通、日志异常 | `TROUBLESHOOTING.md` | OpenClash `03-errors.md`、`13-logs.md`、`14-diagnostics.md` |
| 想知道以前为什么这样设置 | `HISTORY.md` | 对照当前 YAML，历史不可直接当现状 |
| 从零恢复 R2S OpenClash 配置 | `OPERATIONS.md` | OpenClash `12-subscribe-config.md`、`16-overwrite-module-format.md` |

## 信息分层

### 当前正式配置

- `../openclash_by_jax_v6.yaml`
- GitHub `main` 最新内容是唯一权威。
- `CURRENT-STATE.md` 是便于阅读的说明，不允许覆盖 YAML 的事实。

### ChatGPT 工作规则

- `CHATGPT-MAINTENANCE-PROMPT.md`
- 仓库根目录 `AGENTS.md` 和 `.agents/skills/proxy-config-manager/` 若当前 AI 环境会自动读取，也应同时遵守；冲突时以用户最新明确指令和 GitHub 当前正式状态为准。

### 操作教程

- `OPERATIONS.md`
- 只记录“怎么做”，不作为当前运行配置副本。
- `../toolkit/scripts/` 保存可部署到 R2S 的无凭据工具脚本；脚本默认路径和实际状态仍应在路由器上核对。

### 故障与诊断

- `TROUBLESHOOTING.md`
- 遵循“先 Debug 日志，再精确命令，再修复”的官方流程。

### 历史信息

- `HISTORY.md`
- 包含已做过的测试、旧版本变更、曾经遇到的坑。
- 历史性能数字、旧软件版本、旧运行模式只用于避免重复试错，不能直接假定仍然有效。

## 不应存入 GitHub 的知识

任何真实机场订阅 URL、账号密码、Cookie、Token、API Key、SSH 私钥、Secret、验证码、授权头、私人 UUID/密钥等只属于本地/私有运行环境，不进入本知识库。
