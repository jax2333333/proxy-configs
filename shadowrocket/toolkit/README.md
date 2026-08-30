# JAX Shadowrocket Toolkit

一套与主配置解耦、可以单独开关的 Shadowrocket 工具模块。

> 维护原则：`shadowrocket/Jax-shadowrocket-v6.conf` 仍是正式主配置；Toolkit 只放增强功能，不把脚本逻辑直接塞进主配置。
> 旧仓库 `jax2333333/shadowrocket-config` 不再作为模块维护源；模块统一迁移到本目录。

## 统一目录

```text
shadowrocket/toolkit/
├── README.md
├── modules/
│   ├── privacy-lite.sgmodule
│   ├── url-cleaner-safe.sgmodule
│   ├── network-health.sgmodule
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
│   └── app-adblock-template.sgmodule
└── scripts/
    ├── url-cleaner.js
    ├── network-health.js
    ├── youtube-adblock-local.js
    └── app-adblock-template.js
```

## 分组管理

### A. 基础工具

- `privacy-lite.sgmodule`：高置信度隐私/追踪拦截，不需要 MITM。
- `url-cleaner-safe.sgmodule`：清理常见 URL 追踪参数，仅对明确站点做最小 MITM。
- `network-health.sgmodule`：定时检查代理出口、Google、GitHub、YouTube 等网络状态。

### B. 通用广告

- `general-adblock-safe.module`：常见广告 SDK / 追踪域名的轻量规则拦截。
- `splash-adblock-safe.module`：常见开屏广告 SDK 的轻量规则拦截。

> 两个通用模块与部分 App 专用模块存在规则重叠。不要为了“拦得更多”无脑全部开启；出现 App 异常时优先关闭通用模块排查。

### C. App 专用净化

- `amap-clean.module`：高德地图。
- `taobao-clean.module`：淘宝。
- `jd-clean.module`：京东。
- `xianyu-clean.module`：闲鱼。
- `xiaohongshu-clean.module`：小红书。
- `weibo-clean.module`：微博。
- `wechat-article-clean.module`：微信公众号文章。
- `fanqie-adblock.module`：番茄小说 / 红果相关广告。
- `qimao-adblock.module`：七猫小说。
- `webtoon-adblock.module`：WEBTOON。
- `wandou-privacy.module`：豌豆清单隐私保护。
- `youtube-adblock.sgmodule`：YouTube / YouTube Music 去广告实验模块；脚本完全自托管。

### D. 开发模板

- `app-adblock-template.sgmodule`：以后新增 App API 级净化时复制使用，默认不要启用。

## Raw 地址规则

所有模块统一使用：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/<模块文件名>
```

所有脚本统一使用：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/scripts/<脚本文件名>
```

YouTube 模块当前脚本地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/scripts/youtube-adblock-local.js
```

## 推荐基础启用顺序

```text
1. privacy-lite.sgmodule
2. network-health.sgmodule
3. url-cleaner-safe.sgmodule
4. 按实际使用的 App 开启对应专用模块
5. general-adblock-safe / splash-adblock-safe 按需开启
6. app-adblock-template.sgmodule 不启用，仅作开发模板
```

## MITM / 隐私原则

- 不使用 `hostname = *`。
- MITM 只给确实需要修改 HTTPS 内容的明确域名。
- 银行、支付、Apple ID、密码管理器等敏感服务不加入 Toolkit MITM。
- 不在 GitHub 保存机场订阅地址、Token、Cookie、账号密码或证书私钥。
- App 净化采用“一 App 一模块”，出现问题可以单独关闭。
- YouTube 脚本不主动联网、不上传 Cookie/Header/播放密钥，仅处理 Shadowrocket 本地截获的响应。
- 修改前以 GitHub `main` 分支最新版为准。

## 与正式主配置的关系

Toolkit 不替代：

```text
shadowrocket/Jax-shadowrocket-v6.conf
```

主配置负责节点、策略组、DNS 和基础分流；Toolkit 负责可选增强功能。除非明确需要，不把 Toolkit 内容合并进主配置。
