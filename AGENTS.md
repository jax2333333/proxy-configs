# JAX Proxy Configs 维护规则

## 1. 仓库原则

- GitHub 仓库 `jax2333333/proxy-configs` 的 `main` 分支是唯一正式版本。
- 每次修改前必须先：
  1. `git status`
  2. 确认当前分支
  3. `git fetch origin`
  4. 确认本地状态与 `origin/main` 的关系
  5. 读取仓库当前实际文件
- 不允许根据聊天历史、旧代码、旧附件直接覆盖 GitHub 当前版本。
- 当前仓库文件永远优先于聊天中的旧配置。
- 如果本地存在未提交修改，必须先说明，不得擅自覆盖。

## 2. 仓库结构

本仓库主要维护：

- `shadowrocket/`：iPhone Shadowrocket 专用配置
- `clash-verge/`：macOS Clash Verge 专用配置
- `openclash/`：ImmortalWrt / OpenClash 专用配置

除非用户明确说“同步更新三套配置”，否则：

- 修改 OpenClash 时只修改 `openclash/`。
- 修改 Clash Verge 时只修改 `clash-verge/`。
- 修改 Shadowrocket 时只修改 `shadowrocket/`。
- 不允许顺手同步修改其他平台。

## 3. 敏感信息

严禁写入 GitHub：

- 机场真实订阅地址
- UUID
- API Token
- Private Key
- Password
- Cookie
- Authorization Header
- Cloudflare Token
- Cloudflare API Key
- Tunnel Secret
- WireGuard 私钥
- 任何账号凭据

真实机场订阅地址只允许保存在本地配置。

如果发现疑似敏感信息：

- 停止提交。
- 明确警告用户。
- 不将其加入 Git。

## 4. OpenClash

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

策略组需要保留现有逻辑，包括：

- Apple
- AI
- YouTube
- Spotify
- Telegram
- TikTok

并保持当前用户已经设定的平台偏好。

智能选择相关策略需要避免把以下节点作为正常高速节点，除非用户明确要求：

- 免费节点
- `0.01` 倍率节点
- `x0.01`
- `x0.1` 等明确低倍率测试节点

## 5. Clash Verge

`clash-verge/` 只维护 macOS Clash Verge 配置。

- 真实机场订阅 URL 不得写入 GitHub。
- 本地 Merge 中的订阅地址不得复制到仓库。
- 修改前检查当前 Merge / Override 结构。
- 保持现有分流组语义。
- 不因为 OpenClash 的配置变化自动同步 Clash Verge。
- 修改 YAML 后检查语法、缩进、重复键和 provider 引用。

## 6. Shadowrocket

`shadowrocket/` 只维护 iPhone Shadowrocket 配置。

修改 Shadowrocket 配置时：

- 保持最小化 MITM 原则。
- 不随意扩大 hostname。
- 只有确定需要 HTTPS 解密的网站才加入 MITM。
- 新增脚本前检查现有模块是否已经具备相同功能。
- 不因为单个网站需求扩大为全局 MITM。

## 7. JAX 网站净化中心

核心文件：

- `shadowrocket/toolkit/modules/site-cleaner.sgmodule`
- `shadowrocket/toolkit/scripts/site-cleaner.js`

维护规则：

- 用户提供一个网站 URL 并要求净化时，视为加入 JAX 网站净化中心。
- 修改前必须读取 GitHub 当前最新版。
- 先分析目标网站中的广告、横幅、弹窗、iframe、跳转、浮层及其它明显干扰元素。
- 尽量统一加入 `site-cleaner.js`。
- `site-cleaner.sgmodule` 只添加必要的 Rule、Script pattern、MITM hostname。
- MITM hostname 必须最小化。
- 禁止为了方便使用宽泛通配 hostname。
- 不影响网站登录、支付、核心交互和正常内容。

## 8. Cloudflare 免费节点相关内容

如果以后增加 Cloudflare 节点方案：

- 必须在 `proxy-configs` 仓库中新建独立目录管理。
- 与 Shadowrocket / Clash Verge / OpenClash 主配置分离。
- UUID、Token、密钥等敏感内容禁止写入 GitHub。
- 仓库中只保存模板、脚本、说明和不含凭据的配置。
- 修改前检查是否存在意外暴露公网信息或凭据的风险。

## 9. 修改原则

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

## 10. 验证

YAML 修改后必须检查：

- YAML 是否可解析
- 缩进
- 重复键
- 引用是否存在
- provider 名称
- proxy-group 引用
- rule-provider 引用
- DNS 结构
- script / module 路径

JavaScript 修改后检查：

- 基本语法
- 变量作用域
- JSON 解析
- 异常处理
- 是否可能破坏目标网页正常功能

修改完成后必须执行：

```sh
git diff
```

并向用户汇报：

- 修改了哪些文件
- 修改目的
- 验证结果
- 是否存在潜在风险

## 11. Git 安全

默认禁止自动执行：

- `git commit`
- `git push`
- `git push --force`
- `git reset --hard`
- `git clean -fd`
- `rebase main`
- 删除远程分支

除非用户明确授权。

标准流程：

1. `git status`
2. `git fetch origin`
3. 阅读最新文件
4. 修改
5. 验证
6. `git diff`
7. 向用户汇报
8. 用户确认后再 commit / push

## 12. 网络安全原则

修改代理配置时优先关注：

- DNS 泄露
- IPv6 泄露
- 代理绕过
- 错误直连
- 规则覆盖顺序
- 节点失效后的回退逻辑

不要宣称某个配置“绝对匿名”或“无法被识别”。

只能基于实际配置判断其：

- DNS 泄露风险
- IP 泄露风险
- 流量分流风险
- 配置错误风险
