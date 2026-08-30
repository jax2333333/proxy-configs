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

## 最终启用方案

### ① 建议常开

| 模块 | 建议 | MITM | 说明 |
|---|---|---|---|
| `privacy-lite.sgmodule` | ✅ 常开 | 否 | 高置信度广告/统计域名，低误伤；不全局封 AppsFlyer / Adjust / Branch |
| `network-health.sgmodule` | ✅ 常开 | 否 | 每天 09:05 检查出口与 Google / GitHub / YouTube；异常才通知 |
| `url-cleaner-safe.sgmodule` | ✅ 推荐 | 是，少量域名 | 清理 UTM、fbclid、gclid、YouTube `si` 等追踪参数 |

URL Cleaner 只 MITM Google、YouTube、Reddit、X/Twitter、Instagram、Facebook 等明确站点，不使用 `hostname=*`。

### ② 按实际使用的 App 开启

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

### ③ 通用广告模块：按需，不建议一开始全部打开

`general-adblock-safe.module` 与 `splash-adblock-safe.module` 都会拦截常见广告 SDK，和 Privacy Lite、番茄、七猫、WEBTOON、豌豆等模块存在规则重叠。

推荐策略：

```text
默认：先不开通用广告模块
↓
使用常开基础模块 + 对应 App 专用模块
↓
如果仍有大量第三方 App 开屏/SDK 广告
再开启 general-adblock-safe.module
↓
如果主要问题是开屏广告，可再测试 splash-adblock-safe.module
```

`general-adblock-safe.module` 和 `splash-adblock-safe.module` 可以技术上同时开启，但收益有较多重复，出现 App 异常时排查更困难，因此不建议默认双开。

### ④ 开发模板

`app-adblock-template.sgmodule`：❌ 不启用。

仅作为以后制作某个 App API 级净化模块的模板。

## 推荐的日常组合

### 稳定优先

```text
✅ privacy-lite.sgmodule
✅ network-health.sgmodule
✅ url-cleaner-safe.sgmodule
✅ youtube-adblock.sgmodule（需要 YouTube 去广告时）
✅ 自己实际使用的 App 专用模块
❌ general-adblock-safe.module
❌ splash-adblock-safe.module
❌ app-adblock-template.sgmodule
```

### 广告拦截加强版

在稳定优先组合基础上，再增加：

```text
✅ general-adblock-safe.module
```

如果仍有明显开屏广告，再单独测试：

```text
✅ splash-adblock-safe.module
```

一旦出现 App 启动异常、图片缺失、登录/加载失败，排查顺序：

```text
1. 先关闭 splash-adblock-safe.module
2. 再关闭 general-adblock-safe.module
3. 再关闭对应 App 专用模块
4. 最后才检查基础 privacy-lite / URL Cleaner
```

## 18 个模块最新地址

```text
# 基础工具
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/privacy-lite.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/network-health.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/url-cleaner-safe.sgmodule

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

# 开发模板
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/app-adblock-template.sgmodule
```

## iPhone 迁移步骤

旧 `shadowrocket-config` Raw 地址已经不再维护。iPhone 上如果还保存旧模块，建议：

```text
Shadowrocket → 配置 → 模块
1. 删除旧 shadowrocket-config 地址导入的模块
2. 使用上面的 proxy-configs 新地址重新添加
3. 按“稳定优先”组合启用
4. 确认 YouTube、淘宝/闲鱼、小红书等常用 App 正常
5. 再逐步开启更多专用或通用广告模块
```

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
