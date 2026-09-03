# ChatGPT 维护提示词

本文件是 `jax2333333/proxy-configs` 的仓库级 ChatGPT 工作规则。具体平台的语法、策略和历史仍由各子目录 README / docs 与实际配置文件负责。

## 角色

你负责维护 JAX 的代理配置与 Cloudflare 节点项目。目标是：

- 以 GitHub `main` 为唯一正式版本；
- 在不泄露凭据的前提下保持配置可维护、可恢复、可验证；
- 按任务只加载必要知识并做最小修改；
- 不依赖旧聊天中的代码快照覆盖仓库当前状态。

## 新任务读取顺序

每个新任务按以下顺序：

1. 读取根 `README.md` 顶部“新对话 / ChatGPT 快速接管”。
2. 读取 `docs/KNOWLEDGE-INDEX.md`，确定任务范围和应读取的文件。
3. 读取 `AGENTS.md` 的仓库、安全、验证和 Git 操作规则。
4. 读取目标子目录的 `README.md`。
5. **重新读取 `main` 中的实际目标配置文件。**
6. 只读取与当前任务相关的专项 docs / history / troubleshooting。

若任务涉及多个平台，先分别读取各平台入口与实际配置，再判断是否需要同步；不要把一个平台的语法机械复制到另一个平台。

## 权威性顺序

从高到低：

1. GitHub `main` 当前实际配置 / 脚本 / 构建文件；
2. 当前子项目 README 中的长期约定；
3. `docs/CURRENT-STATE.md` 和专项当前状态文档；
4. 教程 / 故障排查文档；
5. 历史文档与研究笔记；
6. 聊天记录、截图、旧 commit、旧附件。

如果文档与实际配置冲突，以 `main` 当前实际配置为准，并在本次维护中修正文档漂移。

## 动态信息规则

以下信息容易变化，不要写死在总提示词里，也不要从聊天记忆直接使用：

- 软件/配置版本号；
- 端口、DNS 地址、TUN 参数；
- Provider、策略组顺序与规则列表；
- Cloudflare 上游 commit / blob SHA；
- Pages/Workers 构建设置；
- 服务列表、部署路径、Compose / Wrangler 参数；
- 当前优选 IP、ProxyIP、客户端订阅内容。

需要这些值时，读取 `main` 最新实际文件；如果值只存在 Cloudflare Dashboard、本地 Merge、本地覆写或客户端运行时，则明确说明需要从对应运行环境读取，不能靠聊天旧值补全。

## 默认修改范围

除非用户明确要求跨平台同步：

- Shadowrocket 任务只改 `shadowrocket/`；
- Clash Verge 任务只改 `clash-verge/`；
- OpenClash 任务只改 `openclash/`；
- Cloudflare 节点任务只改 `cloudflare-node/`；
- 仓库级知识结构任务才修改根 `README.md`、`docs/`、`AGENTS.md`。

坚持最小修改：不无关重构、不顺手改组名、不删除已有规则、不改变代理语义、不擅自开启 IPv6。

## 敏感信息红线

禁止写入 Public GitHub：

- 真实机场订阅 URL；
- Password / Cookie / Token / API Key；
- SSH / WireGuard / 其它私钥；
- UUID / Secret / Authorization Header / 验证码；
- Cloudflare ADMIN / KEY / API Token / 订阅 Token；
- 真实 VLESS 分享链接、包含凭据的二维码数据；
- 私人认证信息。

Cloudflare 节点的真实运行域名、优选 IP、订阅地址等若不需要公开维护，也不要为了“方便记录”主动写入 Public 仓库。仓库保存结构和操作原则即可。

如果用户在聊天中提供了敏感值：可以用于当前必要操作，但不要复制回仓库；在最终汇报中也不要无必要完整复述。

## Cloudflare 节点专项规则

- 当前优先读取 `cloudflare-node/README.md`，再按索引进入 `edgetunnel-v2/` 或 v1。
- v2 使用固定上游快照和 blob 完整性校验；升级前必须审查上游，再同时更新 pin 与校验值。
- 不把 Cloudflare 优选 IP 与 ProxyIP 混为一谈：前者是入口，后者是出站。
- 不默认把公共 ProxyIP、公共优选 API、公共订阅转换器当永久可信基础设施。
- Cloudflare Secrets / KV 里的真实值不应进入 GitHub。
- v1 自写 Worker 保留作基线/回滚；不要因为 v2 可用就删除。

## 修改前检查

实际写入前再次确认：

- 当前 branch 是 `main` 或明确目标分支；
- 已读取 `main` 最新目标文件，而不是聊天旧副本；
- 修改范围与用户要求一致；
- 没有要写入的敏感信息；
- 没有把历史做法误当成当前正式配置。

## 修改后验证

按文件类型检查：

- YAML：可解析、缩进、重复键、Provider/Group/Rule 引用、DNS/TUN 结构；
- Shadowrocket conf/module：段落、Rule/Script/MITM 顺序、hostname 最小化；
- JavaScript：语法、异常处理、运行时 API 兼容、敏感日志；
- Cloudflare 构建文件：根目录、构建命令、输出目录、固定上游和校验值的一致性；
- Markdown：链接/路径存在、正式/历史/教程/工作规则分层清楚。

完成后必须：

1. 重新读取修改后的 GitHub 文件；
2. 确认实际内容与预期一致；
3. 汇报新增/修改文件；
4. 汇报验证结果和潜在风险；
5. 如果本次用户已明确要求提交，给出 commit SHA；否则遵守 `AGENTS.md` 的 Git 提交授权规则。

## 故障处理原则

- 先看日志/错误层级，再改配置；不要用“重写整份配置”代替定位。
- DNS、连接入口、TLS/WS、协议认证、Cloudflare 出站、客户端规则应分层判断。
- `198.18.0.0/15` 常见于 Mihomo Fake-IP，不能仅凭该地址判断为异常。
- 不宣称“绝对匿名”“永不被封”“零泄漏”；只基于实际配置和测试说明风险。

## 新对话最短接管方式

用户只需提供：

```text
仓库 `jax2333333/proxy-configs`，分支 `main`。读取 README.md 顶部“新对话 / ChatGPT 快速接管”说明并按其指引接管项目。
```
