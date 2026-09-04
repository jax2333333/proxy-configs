# JAX Shadowrocket Toolkit

一套与两个正式配置解耦、可以单独开关的 Shadowrocket 工具模块。

> 维护原则：`shadowrocket/Jax-shadowrocket-v6.conf` 与 `shadowrocket/Jax-shadowrocket-home-clean.conf` 都是正式配置；Toolkit 只放增强功能，不把实验脚本逻辑直接塞进正式配置。
> 模块统一由 `jax2333333/proxy-configs` 的 `main` 维护；修改前始终重新读取 GitHub 实际文件。

## 统一目录

```text
shadowrocket/toolkit/
├── README.md
├── modules/
│   ├── privacy-lite.sgmodule
│   ├── network-health.sgmodule
│   ├── url-cleaner-safe.sgmodule
│   ├── httpdns-block-safe.sgmodule
│   ├── proxy-stability.sgmodule
│   ├── webrtc-privacy.sgmodule
│   ├── general-adblock-safe.module
│   ├── splash-adblock-safe.module
│   ├── bilibili-clean-safe.module
│   ├── meituan-clean-safe.module
│   ├── amap-clean.module
│   ├── taobao-clean.module
│   ├── jd-clean.module
│   ├── xianyu-clean.module
│   ├── xiaohongshu-clean.module
│   ├── weibo-clean.module
│   ├── wechat-article-clean.module
│   ├── fanqie-adblock.module
│   ├── qimao-adblock.module
│   ├── webtoon-adblock.module
│   ├── wandou-privacy.module
│   ├── youtube-adblock.sgmodule
│   ├── tiktok-douyin-adblock.module
│   ├── site-cleaner.sgmodule
│   └── app-adblock-template.sgmodule
└── scripts/
    ├── app-adblock-template.js
    ├── bilibili-feed-clean.js
    ├── bilibili-splash-clean.js
    ├── douyin-feed-adblock.js
    ├── network-health.js
    ├── site-cleaner.js
    ├── url-cleaner.js
    └── youtube-adblock-local.js
```

当前共 **25 个模块**、**8 个脚本**。实际清单始终以 `main` 的 `toolkit/modules/` 与 `toolkit/scripts/` 目录为准。

> `51cg1-clean.sgmodule` / `51cg1-clean.js` 已不再作为独立模块维护。51cg1 现统一由 `site-cleaner.sgmodule` + `site-cleaner.js` 管理，手机端不要继续保留旧的 51cg1 独立模块副本。

## ① 基础推荐

| 模块 | 建议 | MITM | 说明 |
|---|---|---|---|
| `privacy-lite.sgmodule` | ✅ 常开 | 否 | 高置信度广告/统计域名，低误伤 |
| `network-health.sgmodule` | ✅ 常开 | 否 | 每天 09:05 检查出口与 Google / GitHub / YouTube，异常才通知 |
| `url-cleaner-safe.sgmodule` | ✅ 推荐 | 少量明确域名 | 清理 UTM、fbclid、gclid、YouTube `si` 等追踪参数 |
| `httpdns-block-safe.sgmodule` | ✅ 推荐，先观察 | 否 | 阻止常见 App 自带 HTTPDNS 绕过系统解析；不 MITM 业务 API |

`httpdns-block-safe.sgmodule` 只使用高置信度 HTTPDNS 专用域名与少量专用 IP，不照搬社区规则中的微信、支付宝、京东等业务 API MITM。若某 App 出现解析、登录或加载异常，先单独关闭本模块做 A/B。

这四个基础模块在移动主配置和 Home Clean 中都可以使用。Home Clean 的正常流量最终 `DIRECT` 给家庭 OpenClash，并不影响模块中的 REJECT / Rewrite / Script 作为本机净化层生效。

## ② 网络 / 隐私增强

| 模块 | 移动模式 | Home Clean | 用途 | 风险 / 回退 |
|---|---|---|---|---|
| `proxy-stability.sgmodule` | ⚙️ 按需，可常开 | ✅ 可保持开启，通常基本不生效 | `block-quic = all-proxy`，仅让 Shadowrocket 自己的代理流量从 QUIC 回落 TCP/HTTP2 | 是否启用主要看移动模式实测；Home Clean 正常流量是 DIRECT，不要求回家关闭 |
| `webrtc-privacy.sgmodule` | ℹ️ 备用 | ℹ️ 备用 | 与正式配置相同的 STUN 替代地址设置，用于迁移/独立配置场景 | 两个正式配置均已内置，不要重复开启；实时音视频异常按 WebRTC P0 回退 |

`proxy-stability.sgmodule` 的关键点是 **`all-proxy` 只匹配 Shadowrocket 的 PROXY 连接**。Home Clean 最终 `FINAL,DIRECT`，所以即使模块开关一直保持开启，家庭模式通常也没有 Shadowrocket PROXY 流量可供它处理；OpenClash 后续在路由器层把国外流量代理出去，不会被这个 Shadowrocket 模块再次处理。若移动模式确认开启后更稳定，可以让模块长期保持开启，无需随家庭 Wi-Fi / 蜂窝场景来回开关。

当前 **WebRTC Privacy 已写入两个正式配置并默认生效**，无需再在 Shadowrocket 模块页额外开启 `webrtc-privacy.sgmodule`。该模块保留只是为了独立模块使用、迁移或以后快速拆分。

## ③ 按实际使用的 App 开启

| 模块 | 用途 | MITM |
|---|---|---|
| `bilibili-clean-safe.module` | Bilibili 开屏 + 明确 Feed 广告对象 + 直播购物接口；不碰 VIP/画质/账号 | `app.bilibili.com`、`api.live.bilibili.com` |
| `meituan-clean-safe.module` | 美团高置信度广告/统计域名 + 明确图片/营销接口；不解密核心推荐/订单 API | `img.meituan.net`、`sqt.meituan.com` |
| `amap-clean.module` | 高德地图开屏/营销净化 | `m5.amap.com` |
| `taobao-clean.module` | 淘宝广告/开屏营销净化 | `guide-acs.m.taobao.com` |
| `jd-clean.module` | 京东广告/统计域名 | 否 |
| `xianyu-clean.module` | 闲鱼开屏、广告曝光、部分营销推荐 | `acs.m.goofish.com`、`g-acs.m.goofish.com` |
| `xiaohongshu-clean.module` | 小红书广告素材、惊喜弹窗、营销入口 | `edith.xiaohongshu.com`、`www.xiaohongshu.com` |
| `weibo-clean.module` | 微博开屏/广告素材/部分统计 | 否 |
| `wechat-article-clean.module` | 微信公众号文章广告/商品推广 | `mp.weixin.qq.com` |
| `fanqie-adblock.module` | 番茄小说 / 红果相关广告 | 少量广告域名 |
| `qimao-adblock.module` | 七猫小说广告 | 少量广告域名 |
| `webtoon-adblock.module` | WEBTOON 广告 SDK / 广告关键词 | 否 |
| `wandou-privacy.module` | 豌豆清单广告/追踪保护 | 否 |
| `youtube-adblock.sgmodule` | YouTube / YouTube Music 去广告实验模块 | YouTube 明确域名 |
| `tiktok-douyin-adblock.module` | TikTok 安全优先；拦截高置信度字节广告域名，并过滤抖音 `amemv.com` JSON Feed / 短剧明确广告对象 | `*.amemv.com` |

这些 App 专用模块同样可用于 Home Clean：Shadowrocket 只负责本机净化，随后把剩余正常流量交给 OpenClash。

`bilibili-clean-safe.module` 已接管原来位于 `splash-adblock-safe.module` 中的 Bilibili 专项逻辑。当前只过滤明确的开屏、Feed 广告对象与直播购物接口，不照搬社区脚本里的 VIP、画质、首页 Tab 重排或 Protobuf 广泛过滤；脚本解析失败时原样放行。若 Bilibili 首页、竖屏 Feed 或直播功能异常，先单独关闭本模块做 A/B。

`meituan-clean-safe.module` 首版故意不 MITM `apimobile.meituan.com` 等核心业务 API，也不引入第三方 JS。若广告仍存在，先通过日志确认真实广告 URL，再做最小增量扩展；不要直接扩大为 `*.meituan.com` / `*.meituan.net`。

`tiktok-douyin-adblock.module` 属于干预程度较高的专项模块：它会对 `*.amemv.com` 做 HTTPS response 脚本处理。若抖音出现观看历史、推荐流、短剧、搜索、评论或账号页异常，优先关闭本模块做 A/B，不要先扩大 MITM 或封锁整个 ByteDance 共享域名。

YouTube 模块只保留这一份。不要同时启用旧仓库 URL、重复导入副本或其它作用相同的 YouTube MITM 模块，以免同一响应被重复改写。

## ④ 网站净化中心

| 模块 | 用途 | MITM |
|---|---|---|
| `site-cleaner.sgmodule` | JAX 统一网页净化中心：51cg1.com、wnacg.com 使用网页响应净化；missav.ws 当前只做网络级广告域名拦截；另含抖音历史记录精确直连修复 | `51cg1.com`、`www.51cg1.com`、`wnacg.com`、`www.wnacg.com` |

网站净化采用统一模块维护，不再“一网站一个旧模块”。当前 `site-cleaner.sgmodule` 明确不对 `missav.ws` 主站 MITM，以避免 Cloudflare 验证循环；脚本只处理本机已截获内容，不主动外发 Cookie、Header 或浏览历史。

## ⑤ 通用广告模块：按需

`general-adblock-safe.module` 与 `splash-adblock-safe.module` 会和 Privacy Lite、App 专用模块产生一定规则重叠，因此默认不双开。

推荐顺序：

```text
基础推荐 + 对应 App 专用模块
↓
仍有大量第三方 App SDK 广告 → general-adblock-safe.module
↓
主要问题仍是开屏广告 → 单独测试 splash-adblock-safe.module
```

`splash-adblock-safe.module` 当前只做通用广告 SDK / 开屏域名的网络级 REJECT，**不再包含 Bilibili Script/MITM**。Bilibili 请使用独立 `bilibili-clean-safe.module`。模块不封整个 `baidustatic.com`，避免正常静态资源被 Safe 模块误伤。已经大量启用 App 专用净化模块时，通常不建议再常开它；否则会增加规则重叠和排障变量。

异常排查顺序：

```text
1. WebRTC / 实时音视频异常 → 先查重复 webrtc-privacy，再撤销当前配置 STUN 字段
2. 抖音 Feed / 历史 / 短剧 / 评论异常 → 先关闭 tiktok-douyin-adblock.module 做 A/B
3. 移动代理 QUIC 异常 → 关闭 proxy-stability.sgmodule 做 A/B
4. Home Clean 国外访问异常 → 先查 OpenClash / 场景 / DNS，不给 Home Clean 加代理组
5. Bilibili 首页 / Feed / 直播异常 → 关闭 bilibili-clean-safe.module
6. 美团图片 / 页面资源异常 → 关闭 meituan-clean-safe.module
7. 再关闭 splash-adblock-safe.module
8. 再关闭 general-adblock-safe.module
9. 再关闭对应 App / 网站专用模块
10. HTTPDNS / URL Cleaner 做单独 A/B
11. 最后才检查基础 privacy-lite
```

## ⑥ 开发模板

`app-adblock-template.sgmodule`：❌ 不启用，仅作为以后制作 App API 级净化模块的模板。

## 推荐日常组合

### 外出 4G / 5G

```text
✅ Jax-shadowrocket-v6.conf 内置 WebRTC Privacy
✅ privacy-lite.sgmodule
✅ network-health.sgmodule
✅ url-cleaner-safe.sgmodule
✅ httpdns-block-safe.sgmodule（首次开启后观察常用 App）
✅ 自己实际使用的 App 专用模块
✅ bilibili-clean-safe.module（使用 Bilibili 时）
✅ meituan-clean-safe.module（使用美团时）
✅ youtube-adblock.sgmodule（需要 YouTube 去广告时）
✅ site-cleaner.sgmodule（需要网站净化时）
🟠 tiktok-douyin-adblock.module（需要抖音/TikTok 广告净化时；出现 App 功能异常优先关闭 A/B）
⚙️ proxy-stability.sgmodule（按需；若实测有收益可长期保持开启）
ℹ️ webrtc-privacy.sgmodule（备用，不与正式配置重复启用）
❌ general-adblock-safe.module
❌ splash-adblock-safe.module（大量 App 专用模块已开启时建议关闭）
❌ app-adblock-template.sgmodule
```

### 家庭 Wi-Fi Home Clean

```text
✅ Jax-shadowrocket-home-clean.conf
✅ privacy-lite.sgmodule
✅ network-health.sgmodule
✅ url-cleaner-safe.sgmodule
✅ httpdns-block-safe.sgmodule（首次开启后观察常用 App）
✅ 自己实际使用的 App 专用模块
✅ bilibili-clean-safe.module（使用 Bilibili 时）
✅ meituan-clean-safe.module（使用美团时）
✅ youtube-adblock.sgmodule（需要时）
✅ site-cleaner.sgmodule（需要网站净化时）
🟠 tiktok-douyin-adblock.module（需要时；异常优先单独关闭 A/B）

✅/按需 proxy-stability.sgmodule（可以保持开启；Home Clean 下通常基本不生效）
ℹ️ webrtc-privacy.sgmodule（Home Clean 已内置，不重复开启）
❌ general-adblock-safe.module（除非基础/专用模块仍不够）
❌ splash-adblock-safe.module（大量 App 专用模块已开启时建议关闭）
❌ app-adblock-template.sgmodule
```

## 25 个模块 Raw 地址

```text
# 基础工具
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/privacy-lite.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/network-health.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/url-cleaner-safe.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/httpdns-block-safe.sgmodule

# 可选网络 / 隐私
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/proxy-stability.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/webrtc-privacy.sgmodule

# 通用广告
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/general-adblock-safe.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/splash-adblock-safe.module

# App 专用
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/bilibili-clean-safe.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/meituan-clean-safe.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/amap-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/taobao-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/jd-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/xianyu-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/xiaohongshu-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/weibo-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/wechat-article-clean.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/fanqie-adblock.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/qimao-adblock.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/webtoon-adblock.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/wandou-privacy.module
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/youtube-adblock.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/tiktok-douyin-adblock.module

# 网站净化中心
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/site-cleaner.sgmodule

# 开发模板
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/app-adblock-template.sgmodule
```

## MITM / 隐私原则

- 禁止 `hostname = *`。
- MITM 只给确实需要修改 HTTPS 内容的明确域名。
- 银行、支付、Apple ID、密码管理器等敏感服务不加入 Toolkit MITM。
- 不在 GitHub 保存机场订阅地址、Token、Cookie、账号密码、UUID、API Key 或证书私钥。
- App/网站净化采用“一服务一模块”，出现问题可以单独关闭。
- JS 默认 fail-open，不主动外发认证材料或浏览数据。

## 与两个正式配置的关系

Toolkit 不替代：

```text
shadowrocket/Jax-shadowrocket-v6.conf
shadowrocket/Jax-shadowrocket-home-clean.conf
```

移动主配置负责 Shadowrocket 自己的策略组、DNS、代理和长期稳定分流；Home Clean 只负责把正常流量 DIRECT 给家庭 OpenClash；两个正式配置都包含 WebRTC/STUN 隐私。`shadowrocket/rules/` 保存移动配置需要的 JAX 自托管规则集；Toolkit 负责可选增强功能。
