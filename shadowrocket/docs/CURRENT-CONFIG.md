# Current Configuration Rules

> 本文件记录长期约定，不是完整配置副本。版本、字段、规则顺序、策略组和模块清单必须读取 GitHub `main` 的实际文件。

## 正式边界

- 外出 4G / 5G 主配置：`shadowrocket/Jax-shadowrocket-v6.conf`
- 家庭 Wi-Fi 净化配置：`shadowrocket/Jax-shadowrocket-home-clean.conf`
- 自托管规则：`shadowrocket/rules/`
- Toolkit：`shadowrocket/toolkit/`
- 未经明确要求，不修改 OpenClash 或 Clash Verge。

## 两种正式运行模式

### 1. 外出 4G / 5G

`Jax-shadowrocket-v6.conf` 由 Shadowrocket 自己负责：

- DNS 与 DNS 防绕行基础；
- 国内 / 国外规则分流；
- AI、TikTok、YouTube、GitHub、Apple 等策略组；
- 实际代理节点选择；
- Toolkit 广告/隐私/脚本增强。

### 2. 家庭 Wi-Fi：只净化，不代理

`Jax-shadowrocket-home-clean.conf` 专门用于家里已经由 OpenWrt / OpenClash 负责透明代理的网络。

固定职责链：

```text
iPhone
→ Shadowrocket
  ├─ Toolkit 命中：REJECT / URL Rewrite / Script / MITM
  └─ 正常流量：DIRECT
→ OpenWrt / OpenClash
  ├─ 国内：DIRECT
  └─ 国外：OpenClash 代理
```

家庭模式长期约定：

1. 不在家庭配置中加入机场节点、Shadowrocket 代理组或国外分流 RULE-SET。
2. `[Rule]` 最终保持 `FINAL,DIRECT`；这里的 DIRECT 仅代表“不使用 Shadowrocket 节点”，流量仍继续经过当前 Wi-Fi 网关。
3. `dns-server = system`，让 iOS 使用家庭网络提供的系统 DNS，继续由 OpenWrt / OpenClash 接管解析。
4. 家庭配置不指定 Cloudflare / Google / AliDNS 公网 DoH，也不设置 `hijack-dns`，避免 Shadowrocket 与 OpenClash 重复抢 DNS 控制权。
5. 不把 OpenClash Fake-IP 常用网段 `198.18.0.0/15` 加入家庭配置的 `tun-excluded-routes`，避免 Fake-IP 连接绕过 Shadowrocket Toolkit 净化层。
6. `proxy-stability.sgmodule` 在家庭模式默认关闭。Shadowrocket 本身不承担代理，代理 QUIC/UDP 稳定性应由 OpenClash 层处理。
7. 启用的 Toolkit 广告、URL Cleaner、HTTPDNS、App 专用模块仍可作为 iPhone 本机净化层使用。
8. Shadowrocket“场景”可按家庭 Wi-Fi SSID 使用 Home Clean，蜂窝网络使用移动主配置。

## 长期约定

### DNS / IPv6 / WebRTC

移动主配置长期采用 IPv6 默认关闭、显式 DNS 和 DNS 劫持等设计，但具体服务器、字段和值可变化。每次诊断读取当前 `[General]`；53/UDP 需结合劫持设置、系统解析和实际泄漏测试判断，不为单个 DNS 问题破坏既有分流。

家庭配置的 DNS 原则与移动配置不同：以 `system` 为主，优先保留 OpenWrt / OpenClash 的家庭 DNS 链路。不能把移动版公网 DoH / `hijack-dns` 无脑复制到家庭版。

App 自带 HTTPDNS 属于另一层解析绕过。当前采用独立 `toolkit/modules/httpdns-block-safe.sgmodule` 做高置信度纯规则阻断，不在正式配置中扩大业务 API MITM。

WebRTC Privacy 当前在移动主配置和家庭配置中默认启用：使用 `stun-response-ip` / `stun-response-ipv6` 为 STUN 返回替代地址，降低真实网络地址通过 WebRTC 暴露的风险。`toolkit/modules/webrtc-privacy.sgmodule` 仅保留为独立备用/迁移模块，不需要与正式配置重复启用。

#### WebRTC 固定排障优先级

凡出现 **FaceTime、Google Meet、Discord 语音、网页视频会议**等实时音视频的建连失败、单向音频、无视频、通话中断或明显异常，**优先排查 WebRTC Privacy 层**，不要先改 DNS、节点、QUIC 或扩大 MITM：

1. 第一优先检查 `toolkit/modules/webrtc-privacy.sgmodule` 是否被启用、重复导入或与当前正式配置同时生效；如已启用，先关闭该模块复测。
2. 若模块未启用或关闭后仍异常，再临时撤销当前所用配置 `[General]` 中 `stun-response-ip` 与 `stun-response-ipv6` 两个字段，重新加载配置并复测。
3. 只有 WebRTC Privacy A/B 无法解释问题时，才继续检查 `proxy-stability.sgmodule`、UDP/QUIC、策略组、节点、DNS、MITM 或目标服务自身状态。
4. 后续 ChatGPT 接管项目时，遇到上述实时音视频故障，应主动提醒用户先执行这一优先排查流程。

### 移动配置路由

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
- 家庭 Home Clean 不需要复制这些代理分流 RULE-SET；实际国外代理规则由 OpenClash 负责。

### Toolkit

广告和清理功能模块化、可独立关闭；不使用全局 MITM，脚本优先自托管并在解析失败时原样放行。修改模块前读取 `toolkit/README.md`、目标 module/script 与当前所用正式配置相关字段，避免重复或冲突。

`proxy-stability.sgmodule`（`block-quic = all-proxy`）仍属于可选实验增强；移动模式按需开启，家庭 Home Clean 默认关闭。

`webrtc-privacy.sgmodule` 仅作为独立备用模块；两个正式配置已默认包含等价的 STUN 隐私字段，不建议重复启用。实时音视频异常时，它属于第一优先排查对象。

## 修改前检查

### 修改移动主配置

读取真实配置后检查 `[General]`、`[Rule]` 顺序、`JAX Overrides`、TikTok/抖音先后关系、`FINAL`、DNS、IPv6、UDP/QUIC、WebRTC/STUN、目标策略组、远程 RULE-SET 可访问性、模块冲突和 MITM hostname 合并方式。

### 修改家庭 Home Clean

额外确认：

- 没有新增代理节点/代理组；
- `dns-server = system`；
- 没有公网 DoH / `hijack-dns`；
- `198.18.0.0/15` 没有被加入 `tun-excluded-routes`；
- `FINAL,DIRECT` 仍是最终兜底；
- 没有把 OpenClash 应负责的国外分流逻辑复制到 Shadowrocket 家庭配置。
