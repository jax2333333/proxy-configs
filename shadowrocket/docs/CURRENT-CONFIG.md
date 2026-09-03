# Current Configuration Rules

> 本文件记录长期约定，不是完整配置副本。版本、字段、规则顺序、策略组和模块清单必须读取 GitHub `main` 的实际文件。

## 正式边界

- 主配置：`shadowrocket/Jax-shadowrocket-v6.conf`
- 自托管规则：`shadowrocket/rules/`
- Toolkit：`shadowrocket/toolkit/`
- 未经明确要求，不修改 OpenClash 或 Clash Verge。

## 长期约定

### DNS / IPv6 / WebRTC

主配置长期采用 IPv6 默认关闭、显式 DNS 和 DNS 劫持等设计，但具体服务器、字段和值可变化。每次诊断读取当前 `[General]`；53/UDP 需结合劫持设置、系统解析和实际泄漏测试判断，不为单个 DNS 问题破坏既有分流。

App 自带 HTTPDNS 属于另一层解析绕过。当前采用独立 `toolkit/modules/httpdns-block-safe.sgmodule` 做高置信度纯规则阻断，不在主配置中扩大业务 API MITM。

WebRTC Privacy 当前在正式主配置中默认启用：使用 `stun-response-ip` / `stun-response-ipv6` 为 STUN 返回替代地址，降低真实网络地址通过 WebRTC 暴露的风险。该设置可能影响 FaceTime、Google Meet、Discord 语音或网页实时音视频；若出现异常，优先撤销这两个字段做 A/B。`toolkit/modules/webrtc-privacy.sgmodule` 仅保留为独立备用/迁移模块，不需要与主配置重复启用。

### 路由

- `[Rule]` 顶部 `JAX Overrides` 只放已经验证的国内独立服务补丁；不得把可能与 TikTok 共享基础设施的 ByteDance 域名提前 DIRECT。
- Apple 维持独立策略和既有直连优先设计。
- TikTok 维持独立策略与地区稳定优先；TikTok 规则必须先于抖音 DIRECT 规则。
- GitHub 使用独立 `💻 GitHub` 策略组。
- AI 使用 `rules/ai-core.list`，仅放高置信度核心服务域名，避免 Stripe、Auth0、Sentry、Segment 等共享 SaaS 被宽泛归入 AI。
- 国内站点出现 FINAL / 代理异常时，先以日志验证，再考虑最小显式直连补丁。
- 策略组名称视为稳定接口。

### 规则来源

- 用户同步维护的 `jax2333333/ios_rule_script` 可作为 Blackmatrix7 规则的受控镜像；使用前确认 fork 已与上游同步。
- 已逐项确认目录映射的核心规则可引用该 fork。
- 没有确认等价映射的规则源不得靠猜测替换；当前仍允许少量既有 `yfamilys.com` 规则继续保留。
- JAX 自己需要严格控制边界的规则放入 `shadowrocket/rules/`，不复制大而全社区列表。

### Toolkit

广告和清理功能模块化、可独立关闭；不使用全局 MITM，脚本优先自托管并在解析失败时原样放行。修改模块前读取 `toolkit/README.md`、目标 module/script 与主配置相关规则，避免重复或冲突。

`proxy-stability.sgmodule`（`block-quic = all-proxy`）仍属于可选实验增强，不写死到主配置；出现兼容性问题直接关闭模块做 A/B。

`webrtc-privacy.sgmodule` 仅作为独立备用模块；正式主配置已默认包含等价的 STUN 隐私字段，不建议重复启用。

## 修改前检查

读取真实配置后检查 `[General]`、`[Rule]` 顺序、`JAX Overrides`、TikTok/抖音先后关系、`FINAL`、DNS、IPv6、UDP/QUIC、WebRTC/STUN、目标策略组、远程 RULE-SET 可访问性、模块冲突和 MITM hostname 合并方式。
