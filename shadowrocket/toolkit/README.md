# JAX Shadowrocket Toolkit

一套与主配置解耦、可以单独开关的 Shadowrocket 工具模块。

> 维护原则：`shadowrocket/Jax-shadowrocket-v6.conf` 仍是正式主配置；Toolkit 只放增强功能，不把脚本逻辑直接塞进主配置。

## 目录

```text
shadowrocket/toolkit/
├── README.md
├── modules/
│   ├── privacy-lite.sgmodule
│   ├── url-cleaner-safe.sgmodule
│   ├── network-health.sgmodule
│   └── app-adblock-template.sgmodule
└── scripts/
    ├── url-cleaner.js
    ├── network-health.js
    └── app-adblock-template.js
```

## 1. Privacy Lite

用途：拦截一小组高置信度广告/统计域名。

特点：
- 不需要 HTTPS 解密 / MITM
- 不修改 App 响应正文
- 不拦截 AppsFlyer / Adjust / Branch 等可能影响登录、归因或 TikTok 正常行为的共享 SDK 域名
- 优先稳定，宁可少拦，不做“大而全”黑名单

模块地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/privacy-lite.sgmodule
```

## 2. URL Cleaner Safe

用途：删除常见追踪参数，例如：

```text
utm_source
utm_medium
utm_campaign
utm_term
utm_content
utm_id
fbclid
gclid
dclid
msclkid
igshid
mc_cid
mc_eid
si
```

安全设计：
- 只对 Google / YouTube / Reddit / X(Twitter) / Instagram / Facebook 的明确主机启用
- 不使用 `hostname = *`
- 不记录完整 URL，只在 Shadowrocket 日志里记录被删除的参数名

模块地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/url-cleaner-safe.sgmodule
```

注意：该模块需要当前 Shadowrocket 配置已经安装并信任 HTTPS 解密证书。

## 3. Network Health

用途：每天检查一次当前代理网络健康状态。

检查内容：
- Cloudflare Trace：出口 IP、国家/地区、PoP
- Google 连通性
- GitHub 连通性
- YouTube 连通性

默认行为：
- 正常时只写日志，不弹通知
- 任一检测失败时发送 Shadowrocket 通知
- 不需要 MITM

模块地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/network-health.sgmodule
```

## 4. App Adblock Template

用途：以后针对某一个 App 单独制作 API 级去广告模块时作为模板。

默认是完全禁用的示例，不会修改任何请求或响应。新增 App 去广告前应先抓取并确认：
1. 广告接口域名
2. URL pattern
3. Content-Type
4. 响应 JSON 结构
5. 是否需要 MITM

模块地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/app-adblock-template.sgmodule
```

## 推荐启用顺序

```text
1. privacy-lite.sgmodule
2. network-health.sgmodule
3. url-cleaner-safe.sgmodule
4. app-adblock-template.sgmodule（不要启用，仅作开发模板）
```

## 安全原则

- 不在 GitHub 保存机场订阅地址、Token、Cookie、账号密码或证书私钥。
- MITM 只给确实需要修改 HTTPS 内容的明确域名。
- 银行、支付、Apple ID、密码管理器等敏感服务不加入 Toolkit MITM。
- App 去广告采用“一 App 一模块”，避免通用脚本误伤。
- 修改前以 GitHub `main` 分支最新版为准。
