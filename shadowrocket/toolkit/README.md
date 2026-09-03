# JAX Shadowrocket Toolkit

一套与主配置解耦、可以单独开关的 Shadowrocket 工具模块。

> 维护原则：`shadowrocket/Jax-shadowrocket-v6.conf` 仍是正式主配置；Toolkit 只放增强功能，不把实验脚本逻辑直接塞进主配置。
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
│   ├── 51cg1-clean.sgmodule
│   └── app-adblock-template.sgmodule
└── scripts/
    ├── url-cleaner.js
    ├── network-health.js
    ├── youtube-adblock-local.js
    ├── 51cg1-clean.js
    └── app-adblock-template.js
```

当前共 **22 个模块**。

## ① 基础推荐

| 模块 | 建议 | MITM | 说明 |
|---|---|---|---|
| `privacy-lite.sgmodule` | ✅ 常开 | 否 | 高置信度广告/统计域名，低误伤 |
| `network-health.sgmodule` | ✅ 常开 | 否 | 每天 09:05 检查出口与 Google / GitHub / YouTube，异常才通知 |
| `url-cleaner-safe.sgmodule` | ✅ 推荐 | 少量明确域名 | 清理 UTM、fbclid、gclid、YouTube `si` 等追踪参数 |
| `httpdns-block-safe.sgmodule` | ✅ 推荐，先观察 | 否 | 阻止常见 App 自带 HTTPDNS 绕过系统解析；不 MITM 业务 API |

`httpdns-block-safe.sgmodule` 只使用高置信度 HTTPDNS 专用域名与少量专用 IP，不照搬社区规则中的微信、支付宝、京东等业务 API MITM。若某 App 出现解析、登录或加载异常，先单独关闭本模块做 A/B。

## ② 网络 / 隐私实验模块

| 模块 | 默认 | 用途 | 风险 / 回退 |
|---|---|---|---|
| `proxy-stability.sgmodule` | ❌ 按需 | `block-quic = all-proxy`，仅让代理流量从 QUIC 回落 TCP/HTTP2 | 可能改变延迟、功耗或部分 App 行为；异常直接关闭 |
| `webrtc-privacy.sgmodule` | ❌ 按需 | 用替代 STUN 地址降低 WebRTC 暴露真实网络地址的风险 | 可能影响 FaceTime、Meet、Discord、网页实时音视频 |

这两个模块故意不写进主配置，确保可以单独 A/B 和快速回退。

## ③ 按实际使用的 App 开启

| 模块 | 用途 | MITM |
|---|---|---|
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

YouTube 模块只保留这一份。不要同时启用旧仓库 URL、重复导入副本或其它作用相同的 YouTube MITM 模块，以免同一响应被重复改写。

## ④ 网页专用净化

| 模块 | 用途 | MITM |
|---|---|---|
| `51cg1-clean.sgmodule` | 清理 51cg1.com 外链图片横幅、外部 iframe、明显广告容器与残留占位 | `51cg1.com`、`www.51cg1.com` |

站点专用模块不做全局网页过滤；脚本只处理本机已截获内容，不主动外发 Cookie、Header 或浏览历史。

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

`splash-adblock-safe.module` 不再封整个 `baidustatic.com`，避免正常静态资源被 Safe 模块误伤。

异常排查顺序：

```text
1. 先关闭 webrtc-privacy / proxy-stability 等实验模块
2. 再关闭 splash-adblock-safe.module
3. 再关闭 general-adblock-safe.module
4. 再关闭对应 App / 网站专用模块
5. HTTPDNS / URL Cleaner 做单独 A/B
6. 最后才检查基础 privacy-lite
```

## ⑥ 开发模板

`app-adblock-template.sgmodule`：❌ 不启用，仅作为以后制作 App API 级净化模块的模板。

## 推荐日常组合

### 稳定优先

```text
✅ privacy-lite.sgmodule
✅ network-health.sgmodule
✅ url-cleaner-safe.sgmodule
✅ httpdns-block-safe.sgmodule（首次开启后观察常用 App）
✅ 自己实际使用的 App 专用模块
✅ youtube-adblock.sgmodule（需要 YouTube 去广告时）
✅ 51cg1-clean.sgmodule（访问该网站时）
❌ proxy-stability.sgmodule（出现代理 QUIC 稳定性问题再开）
❌ webrtc-privacy.sgmodule（有明确 WebRTC 隐私需求再开）
❌ general-adblock-safe.module
❌ splash-adblock-safe.module
❌ app-adblock-template.sgmodule
```

## 22 个模块 Raw 地址

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

# 网页专用
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/51cg1-clean.sgmodule

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

## 与正式主配置的关系

Toolkit 不替代：

```text
shadowrocket/Jax-shadowrocket-v6.conf
```

主配置负责策略组、DNS 和长期稳定分流；`shadowrocket/rules/` 保存 JAX 自托管规则集；Toolkit 负责可选增强功能。
