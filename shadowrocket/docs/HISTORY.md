# History & Experiments

> 历史只解释维护决策，不能替代 GitHub `main`。历史代码、版本和 commit 必须重新与当前实际文件核对。

## 主配置演进

历史上进行过 Apple PCC / Private Relay 分流修正、国内服务最小直连补丁、TikTok 与抖音规则梳理，以及 DNS、IPv6、UDP/QUIC 日志检查。当前是否仍保留某项实现，以 `main` 为准。

## 2026-09-04：P0 整理与 V6.3 / V6.3.1

本轮维护先处理两个 P0，再推进后续结构优化。

### P0：`ios_rule_script` fork 整理

- `jax2333333/ios_rule_script` 旧 `master` 与 Blackmatrix7 上游已分叉，不能继续假设它是最新规则源。
- 检查发现 fork 的独有提交主要为历史 `github-actions[bot]` 自动生成更新，没有用户本人提交需要保留为正式差异。
- 先建立归档分支 `archive/pre-upstream-sync-20260904` 保存旧状态，再将 fork `master` 对齐当时 Blackmatrix7 上游当前 SHA。
- 后续该 fork 可作为受控规则镜像，但使用前仍要确认是否与上游同步；不得因为“是自己的 fork”就默认它永远最新。

### P0：Umeng 规则冲突

- 主配置明确将 `cnlogs.umeng.com` 设为 DIRECT，以国内服务稳定性为优先。
- `general-adblock-safe.module` 曾同时包含 `DOMAIN,cnlogs.umeng.com,REJECT`，模块优先级可能覆盖主配置意图。
- 已从通用广告 Safe 模块移除该 REJECT，保留主配置 DIRECT；以后 Safe 模块不得重新制造这一冲突。

### V6.3：结构与规则源优化

- 新增 `[Rule]` 顶部 `JAX Overrides`，只放已验证的国内独立服务补丁；TikTok / 抖音共享 ByteDance 域名不得放入该区提前 DIRECT。
- 新增独立 `💻 GitHub` 策略组与 GitHub RULE-SET，便于 GitHub / Raw / GitHubusercontent 单独换节点和排障。
- 新增 `shadowrocket/rules/ai-core.list`，仅维护 OpenAI/ChatGPT、Claude、Gemini/AI Studio、明确 Copilot 等高置信度 AI 核心域名；避免 Stripe、Auth0、Sentry、Segment 等共享 SaaS 被宽泛归入 AI。
- 已逐项确认映射的核心 RULE-SET 迁移到同步后的 `jax2333333/ios_rule_script` fork；没有确认等价目录的规则仍保留原来源，不靠猜目录批量替换。
- TikTok 规则继续保持在抖音 DIRECT 规则之前；共享基础设施冲突时仍以 TikTok 地区/账号稳定优先。
- 用户明确要求跳过“统一所有地区节点倍率过滤”，因此该项未实施。

### 新增安全增强模块

- `httpdns-block-safe.sgmodule`：高置信度 HTTPDNS 专用域名/IP 纯规则阻断，零 MITM，用于降低 App 自带 HTTPDNS 绕过系统解析的机会。
- `proxy-stability.sgmodule`：`block-quic = all-proxy`，仅在需要时让代理 QUIC 回落 TCP/HTTP2；默认不写死进主配置。
- `webrtc-privacy.sgmodule`：最初设计为可选 WebRTC/STUN 隐私模块，后在 V6.3.1 将等价字段直接写入正式主配置；该模块现仅作为备用/迁移文件。
- `splash-adblock-safe.module` 收窄过宽规则，移除整个 `baidustatic.com` 的 REJECT，降低正常静态资源误伤风险。

### V6.3.1：WebRTC Privacy 默认启用

正式主配置 `[General]` 默认加入：

- `stun-response-ip = 1.0.0.1`
- `stun-response-ipv6 = ::1`

目的是让 STUN 返回替代地址，降低 WebRTC 暴露真实网络地址的风险。

已明确接受的兼容性代价：FaceTime、Google Meet、Discord 语音、网页视频会议等实时音视频可能出现建连失败、单向音频、视频异常或断开。

#### 固定排障决策

以后出现上述实时音视频异常时，**WebRTC Privacy 是 P0 第一优先级**：

1. 先检查 `webrtc-privacy.sgmodule` 是否被启用、重复导入或与主配置同时生效；如启用，先关闭模块。
2. 若仍异常，再临时撤销主配置 `stun-response-ip` / `stun-response-ipv6` 做 A/B。
3. 只有 WebRTC/STUN A/B 无法解释问题时，才继续检查 QUIC、DNS、节点、策略组、MITM、运营商或目标服务自身。
4. 后续 ChatGPT 接管时，只要用户提到 FaceTime、Meet、Discord 语音或网页视频会议异常，应主动提醒这一优先级。

## 2026-09-04：家庭 Wi-Fi Home Clean 架构

新增正式配置：

```text
shadowrocket/Jax-shadowrocket-home-clean.conf
```

### 背景

家庭网络已经由 OpenWrt / OpenClash 负责透明代理。若 iPhone 在家仍使用移动版 Shadowrocket 代理规则，会形成职责重复：Shadowrocket 先决定代理，再经过 OpenClash 二次处理，增加双层代理、DNS 竞争和故障定位复杂度。

因此新增独立 Home Clean 模式，把职责拆开：

```text
iPhone
→ Shadowrocket：广告/追踪/Rewrite/Script/MITM 净化
→ 正常流量 FINAL,DIRECT
→ 家庭 OpenWrt / OpenClash：DNS、国内/国外分流、最终代理节点
```

### 固定设计决策

- Home Clean 不包含机场节点、代理组、AI/TikTok/YouTube 等国外代理分流 RULE-SET。
- 正常流量统一 `FINAL,DIRECT`；Shadowrocket 的 DIRECT 只表示“不使用 Shadowrocket 节点”，并不绕过当前 Wi-Fi 网关。
- Home Clean 使用 `dns-server = system` / `fallback-dns-server = system`，不设置公网 DoH 与 `hijack-dns`，优先让家庭 OpenClash DNS 链路负责解析。
- 保持 IPv6 关闭，与当前 JAX 网络偏好一致。
- Home Clean 同样内置 WebRTC/STUN 隐私字段，因此 `webrtc-privacy.sgmodule` 不重复开启；实时音视频异常继续按 WebRTC P0 流程回退。
- `proxy-stability.sgmodule` 在 Home Clean 默认关闭，因为它只针对 Shadowrocket 自身的代理 QUIC，而家庭模式的实际代理由 OpenClash 完成。
- 不把 OpenClash Fake-IP 常用 `198.18.0.0/15` 加入 Home Clean 的 `tun-excluded-routes`。目标是让 Fake-IP 对应连接仍通过 Shadowrocket Toolkit 净化层，再以 DIRECT 交给网关/OpenClash。
- 推荐使用 Shadowrocket“场景”：家庭 Wi-Fi SSID → Home Clean；蜂窝数据 → `Jax-shadowrocket-v6.conf`。

### 维护边界

Home Clean 的目标是“本机净化层”，不能逐步膨胀成第二套 OpenClash。以后新增家庭规则时，先判断它属于：

- 广告/追踪/URL 清理/本机脚本 → Shadowrocket Toolkit；
- 国内/国外代理分流、节点选择、DNS/Fake-IP、代理 QUIC → OpenClash。

如果功能属于后一类，不应塞进 Home Clean。

## 2026-09-04：Bilibili / 美团首批 JAX 化与设备部署

### 首批 JAX 化

- 新增 `toolkit/modules/bilibili-clean-safe.module`：Bilibili 开屏、明确 Feed 广告对象与直播购物接口；只 MITM `app.bilibili.com`、`api.live.bilibili.com`，不处理 VIP、画质、账号资料、首页 Tab 或 Protobuf 广泛过滤。
- 新增 `toolkit/scripts/bilibili-feed-clean.js`：只识别明确广告标记（如 `ad_info` / `ad_info_v2` / `ad_av` / `vertical_ad_av`），自托管、无主动外联，解析或运行异常时 fail-open。
- Bilibili 原开屏脚本 `bilibili-splash-clean.js` 继续复用。
- 新增 `toolkit/modules/meituan-clean-safe.module`：只处理高置信度广告/统计域名、明确广告图片路径和营销接口；只 MITM `img.meituan.net`、`sqt.meituan.com`，不解密 `apimobile.meituan.com` 等核心业务 API，也不引入第三方 JS。
- `splash-adblock-safe.module` 已移除 Bilibili 专项 Script / MITM，恢复为通用广告 SDK / 开屏域名的网络级 REJECT 模块，避免与独立 Bilibili 模块重复。

### 当前设备部署状态

- 用户已在当前 iPhone 的 Shadowrocket 中完成 `bilibili-clean-safe.module` 与 `meituan-clean-safe.module` 的安装/启用。
- 这表示“部署完成”，**不等同于已确认长期稳定或所有广告场景均已净化**；后续仍以实际使用和日志为准。
- Bilibili 后续重点观察：首页推荐、竖屏 Feed、直播、播放历史、评论、搜索；异常时先单独关闭 `bilibili-clean-safe.module` 做 A/B。
- 美团后续重点观察：首页、外卖、订单、支付和图片加载；异常时先单独关闭 `meituan-clean-safe.module` 做 A/B。
- 两个模块均可在移动主配置和 Home Clean 场景下使用；Home Clean 仍保持“Shadowrocket 只净化、OpenClash 负责代理/分流”的职责边界。

## 抖音 / TikTok 去广告

### 域名 REJECT

可拦部分素材或统计，但不能稳定消除正常视频之间服务器插入的原生广告。

### 响应过滤

Feed 或短剧响应可通过自托管 JS 删除明确广告对象；不得因商品链接、购物锚点、直播或商家账号删除普通内容，解析失败必须原样放行。

### 实验边界

- 短剧 / 剧集的结构可能不同于普通 Feed。
- 递归识别需要限定内容候选、强广告标记、响应大小、深度和节点预算。
- 扩大 `*.amemv.com` response Script / MITM 范围会增加回归面；曾出现观看历史错误，必须做单变量 A/B。
- 大量 `amemv.com` 连接可能使用 UDP / QUIC，HTTPS response 脚本未必覆盖关键请求。
- `dig.bdurl.net` 的 REJECT 曾与功能异常有时间相关性，但未证明因果。
- 正常视频 CDN 可能同时承载广告和正片，不应直接封禁。

SQLite `.db` 也可能因 WAL 未完整导出而为空；应重新完整导出再分析。