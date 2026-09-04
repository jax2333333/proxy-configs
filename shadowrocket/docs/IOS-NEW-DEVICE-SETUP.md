# iOS New Device Setup — JAX Shadowrocket

> 目标：以后新增 iPhone / iPad 时，从零快速部署与当前已验证设备一致的 Shadowrocket 架构，并且不把私人订阅、证书私钥或密码写入 GitHub。
>
> 正式仓库：`jax2333333/proxy-configs`；唯一正式分支：`main`。开始安装前先读取 `shadowrocket/README.md` 与本文件，并以 `main` 当前实际配置 / 模块为准。

## 一、最终目标架构

新设备完成后应形成下面的固定结构：

```text
外出 / 蜂窝 / 非家庭 Wi-Fi
→ Jax-shadowrocket-v6.conf
→ Shadowrocket 负责 DNS / 分流 / 代理 / Toolkit

家庭指定 Wi-Fi
→ Jax-shadowrocket-home-clean.conf
→ Shadowrocket 只负责 Toolkit 净化
→ 正常流量 FINAL,DIRECT
→ 家庭 OpenWrt / OpenClash 负责 DNS / 分流 / 实际代理
```

场景固定为：

```text
家庭指定 SSID → Home Clean
蜂窝数据      → Mobile
默认/其它网络 → Mobile
```

**Home Clean 是窄范围例外，Mobile 是安全兜底。** 不允许把“任意 Wi-Fi / 所有 Wi-Fi”绑定 Home Clean。

---

## 二、新设备最重要的安全原则

### 1. 每台 iOS 设备使用自己的 CA

日常新增设备时，推荐：

```text
设备 A：自己的 Shadowrocket CA
设备 B：自己的 Shadowrocket CA
设备 C：自己的 Shadowrocket CA
```

每台设备内部再用本地 `JAX MITM Certificate` 模块，让该设备自己的 Mobile 与 Home Clean 共用同一张 CA。

**不要为了省事把旧设备的 CA 私钥批量复制给所有新设备。** 这样可以把单台设备的证书私钥暴露风险限制在该设备本身。

只有明确做“旧机迁移”且确实需要保留旧 CA 时，才考虑通过受信任的设备到设备方式迁移；这不属于日常新增设备的默认流程。

### 2. 以下内容永远只保存在本机

- 机场 / 节点真实订阅地址；
- `ca-p12`；
- CA 私钥；
- `ca-passphrase` / 证书密码；
- Cookie、Token、API Key、UUID、Authorization、验证码等私人认证材料。

不得把这些内容写入 GitHub、公开 Gist、Notion、聊天记录或截图。

---

## 三、一页快速安装流程

以后新设备按以下顺序操作即可：

```text
1. 安装 Shadowrocket
2. 本地添加机场 / 节点订阅
3. 导入 Mobile 正式配置
4. 导入 Home Clean 正式配置
5. 在新设备生成一张新的 Shadowrocket CA
6. 安装 CA，并在 iOS 中开启“完全信任”
7. 把本机 CA 做成 JAX MITM Certificate 本地模块
8. 导入并开启基础 Toolkit + 实际需要的专项模块
9. 建立 家庭 SSID / 蜂窝 / 默认 三层场景
10. 先测试 5G / Mobile
11. 再测试家庭 Wi-Fi / Home Clean
12. 完成验收后再交付日常使用
```

下面是完整操作。

---

## 四、步骤 1：安装 Shadowrocket

在新 iOS 设备安装 Shadowrocket。

首次运行时允许建立 VPN 配置。后面设置场景按 SSID 自动切换时，如果 iOS / Shadowrocket 请求与 Wi-Fi SSID 识别有关的位置权限，也需要允许，否则场景可能无法正确识别家庭 Wi-Fi。

---

## 五、步骤 2：本地添加机场 / 节点订阅

`Jax-shadowrocket-v6.conf` 不在 GitHub 中保存真实机场订阅地址；移动策略组使用设备本地已有节点进行匹配。

因此新设备必须先在 Shadowrocket **本地**添加当前使用的机场 / 节点订阅，并执行一次更新。

完成后先确认：

```text
✅ 节点列表能看到实际节点
✅ 香港 / 日本 / 新加坡 / 美国等常用地区节点存在
✅ 没有把真实订阅 URL 写入 GitHub
```

如果新设备导入 Mobile 配置后策略组为空，第一优先检查这一项。

---

## 六、步骤 3：导入两个正式配置

### Mobile：外出 / 蜂窝 / 非家庭 Wi-Fi

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-v6.conf
```

用途：Shadowrocket 自己负责 DNS、规则分流、策略组与实际代理；也是酒店、公司、咖啡店、机场、朋友家等未知 Wi-Fi 的默认兜底。

### Home Clean：家庭 Wi-Fi

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-home-clean.conf
```

用途：Shadowrocket 只负责本机净化；正常流量保持 `FINAL,DIRECT` 交给家庭 OpenWrt / OpenClash。

导入后不要把两个配置的职责混在一起，也不要把 Mobile 的公网 DoH、机场节点或代理 RULE-SET 复制进 Home Clean。

---

## 七、步骤 4：在新设备生成独立 CA

新设备建议从 Mobile 配置建立本机 CA：

```text
Shadowrocket
→ 配置
→ Jax-shadowrocket-v6.conf 右侧 ⓘ
→ HTTPS 解密
→ 证书
→ 生成新的 CA 证书
```

生成后按 iOS 提示安装证书描述文件。

### 安装描述文件

通常进入：

```text
iPhone / iPad 设置
→ 通用
→ VPN 与设备管理
→ 找到刚生成的 Shadowrocket CA
→ 安装
```

### 开启完全信任

安装后还必须进入：

```text
设置
→ 通用
→ 关于本机
→ 证书信任设置
→ 找到 Shadowrocket CA
→ 开启“完全信任”
```

只安装而没有“完全信任”，HTTPS 解密模块可能仍然无法工作。

---

## 八、步骤 5：建立本机共享 MITM 证书模块

目的不是把 CA 上传到 GitHub，而是让 **同一台设备**上的 Mobile 与 Home Clean 共用刚刚生成的 CA。

### 1. 从本机 Mobile CA 复制内容

```text
配置
→ Jax-shadowrocket-v6.conf 右侧 ⓘ
→ HTTPS 解密
→ 证书
→ 当前证书右侧 ⓘ
→ 复制
```

这里使用“复制”。`.p12` / `.pfx` 是 PKCS#12 容器，不需要在 iOS“文件”App 中打开。

### 2. 确认本机证书实际密码

在当前 CA / HTTPS 解密设置中确认实际 passphrase。不要猜默认密码。

### 3. 新建本地模块

```text
Shadowrocket
→ 配置
→ 模块
→ +
→ 新建模块
```

本机模块名称固定建议：

```text
JAX MITM Certificate
```

模块模板：

```ini
#!name=JAX MITM Certificate
#!desc=JAX 本机共享 MITM CA；禁止上传 GitHub

[MITM]
enable=true
ca-passphrase=<本机实际证书密码>
ca-p12=<本机复制得到的证书内容>
```

保存并开启：

```text
✅ JAX MITM Certificate
```

**真实 `ca-passphrase` 与 `ca-p12` 永远只留在当前设备。**

更详细的证书说明见：`OPERATIONS-MITM-CERTIFICATE.md`。

---

## 九、步骤 6：导入 Toolkit 模块

完整清单与当前 Raw URL 始终以：

```text
shadowrocket/toolkit/README.md
```

为准。

### 基础推荐

新设备优先安装并开启：

```text
✅ privacy-lite.sgmodule
✅ network-health.sgmodule
✅ url-cleaner-safe.sgmodule
✅ httpdns-block-safe.sgmodule
```

当前 Raw 地址：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/privacy-lite.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/network-health.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/url-cleaner-safe.sgmodule
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/httpdns-block-safe.sgmodule
```

### 当前已验证需要的 YouTube 去广告

```text
✅ youtube-adblock.sgmodule
```

Raw：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/youtube-adblock.sgmodule
```

YouTube 去广告需要同时满足：

```text
✅ JAX MITM Certificate
+
✅ JAX - YouTube AdBlock
+
✅ iOS 完全信任当前 CA
```

### 网站净化中心

需要网页净化时开启：

```text
✅ site-cleaner.sgmodule
```

Raw：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/toolkit/modules/site-cleaner.sgmodule
```

### App 专用模块

只安装实际使用的模块，例如高德、淘宝、京东、闲鱼、小红书、微博、微信文章、抖音 / TikTok 等。不要为了“功能越多越好”一次性把全部高干预模块开启。

### 默认不要重复开启

两个正式配置已经内置 WebRTC / STUN 隐私字段，因此：

```text
ℹ️ webrtc-privacy.sgmodule：备用，不与正式配置重复开启
```

`general-adblock-safe.module`、`splash-adblock-safe.module` 默认也不作为新设备基础必开项，避免和 App 专用模块产生过多重叠。

`proxy-stability.sgmodule` 只有在 Mobile 实测确实更稳定时再开启；如果确认有收益，可以长期保持开启，Home Clean 下正常流量为 DIRECT，通常基本不受它影响。

---

## 十、步骤 7：建立自动场景

进入 Shadowrocket 的场景设置，建立三层结构。

### 家庭 Wi-Fi

```text
网络类型：Wi-Fi
SSID：<实际家庭 Wi-Fi 名称>
路由模式：配置
配置文件：Jax-shadowrocket-home-clean.conf
备注：JAX Home Clean
```

只绑定明确确认后端由 OpenWrt / OpenClash 接管的家庭 SSID。

### 蜂窝数据

```text
网络类型：蜂窝数据
路由模式：配置
配置文件：Jax-shadowrocket-v6.conf
备注：JAX Mobile
```

### 默认 / 其它网络

```text
网络类型：默认
路由模式：配置
配置文件：Jax-shadowrocket-v6.conf
备注：JAX Default / External Wi-Fi
```

最终一定是：

```text
家庭指定 SSID → Home Clean
蜂窝数据      → Mobile
默认/其它网络 → Mobile
```

---

## 十一、步骤 8：5G / Mobile 验收

先关闭 Wi-Fi，使用蜂窝数据。

确认：

```text
✅ 当前场景 / 配置 = Jax-shadowrocket-v6.conf
✅ 节点策略组有可用节点
✅ Google / GitHub / YouTube 等国际服务可访问
✅ 国内常用服务正常
✅ YouTube 连续测试多个视频无片头 / 中插广告
```

如果 Mobile 本身不能正常代理或 MITM，不要继续把问题带到 Home Clean；先把 Mobile 修好。

---

## 十二、步骤 9：家庭 Wi-Fi / Home Clean 验收

连接家庭 Wi-Fi。

确认：

```text
✅ 当前场景 / 配置 = Jax-shadowrocket-home-clean.conf
✅ 普通 Shadowrocket 流量显示 DIRECT 属于正常现象
✅ 国外网站仍能访问（由家庭 OpenClash 后续代理）
✅ JAX MITM Certificate 开启
✅ YouTube AdBlock 开启
✅ YouTube 连续测试多个视频仍然去广告
```

Home Clean 的正确链路是：

```text
iPhone
→ Shadowrocket Toolkit：MITM / Rewrite / Script / REJECT
→ 正常流量 FINAL,DIRECT
→ 家庭 OpenWrt / OpenClash
→ 国内 DIRECT / 国外代理
```

这不是“双层代理”。

---

## 十三、新设备故障快速定位

### A. Mobile 策略组没有节点

先检查：

```text
本机机场 / 节点订阅是否已添加并更新
```

不要把私人订阅地址补进 GitHub 配置。

### B. 5G / Mobile 能去广告，Home Clean 又出现 YouTube 广告

固定优先级：

```text
1. 当前场景是否 Home Clean
2. JAX MITM Certificate 是否开启
3. iOS 是否仍“完全信任”当前 CA
4. youtube-adblock.sgmodule 是否开启
5. 完全退出 YouTube
6. 断开并重新连接 Shadowrocket
7. 再测试多个视频
```

2026-09-04 已实机验证，这一问题通过设备内共享 CA 后恢复。

### C. 5G 与家庭 Wi-Fi 都有 YouTube 广告

优先检查：

```text
CA 是否安装 + 完全信任
JAX MITM Certificate 是否开启
YouTube 模块是否开启
```

再查模块 hostname / Script，而不是先改代理规则。

### D. 家庭 Wi-Fi 国外网站打不开

先关闭 Shadowrocket，在同一家庭 Wi-Fi 直接测试。

- 关闭 Shadowrocket 也打不开：优先属于家庭 OpenClash / DNS / 节点 / 网关问题，不给 Home Clean 添加 Shadowrocket 代理组。
- 关闭 Shadowrocket 正常、开启 Home Clean 异常：再检查 Shadowrocket Toolkit / 场景 / DNS 边界。

如果确认进入 OpenClash 故障排查，按 OpenClash 官方流程先生成调试日志：

```text
LuCI：服务 → OpenClash → 运行日志 → 生成日志
```

或 SSH：

```sh
/usr/share/openclash/openclash_debug.sh
```

拿到日志后再继续定位，不盲改 Home Clean。

### E. FaceTime / Google Meet / Discord 语音 / 网页视频会议异常

按项目固定 P0：

```text
先检查是否重复启用了 webrtc-privacy.sgmodule
→ 再对正式配置中的 stun-response-ip / stun-response-ipv6 做 A/B
→ 最后才查 QUIC / DNS / 节点 / MITM
```

---

## 十四、新设备最终验收清单

全部勾选后才算完成：

```text
□ Shadowrocket 已安装并能建立 VPN
□ 私人机场 / 节点订阅只保存在本机，节点列表正常
□ Mobile 正式配置已导入
□ Home Clean 正式配置已导入
□ 新设备已生成自己的 CA
□ CA 描述文件已安装
□ iOS 已开启该 CA 的“完全信任”
□ JAX MITM Certificate 本地模块已创建并开启
□ 基础 Toolkit 已安装
□ YouTube AdBlock 已安装并开启
□ 家庭 SSID → Home Clean
□ 蜂窝 → Mobile
□ 默认 / 其它 Wi-Fi → Mobile
□ 5G 国际访问正常
□ 5G YouTube 去广告正常
□ 家庭 Wi-Fi 国际访问正常
□ 家庭 Wi-Fi YouTube 去广告正常
```

---

## 十五、后续维护原则

- 新设备安装时先读取 GitHub `main` 当前文档和实际配置，不照抄旧聊天截图。
- 正式配置 / Toolkit 更新继续从 `main` 获取。
- 本机 `JAX MITM Certificate` 永远是本地敏感配置，不参与 GitHub 自动更新，也不提交仓库。
- 每台新设备默认生成独立 CA；只在该设备内部让 Mobile / Home Clean 共享。
- 如果以后新增第二个家庭 AP / SSID，逐个明确绑定 Home Clean；不要把所有 Wi-Fi 泛化成 Home Clean。
- 出现故障先判断属于 Shadowrocket 本机净化层还是家庭 OpenClash 网关层，避免职责混淆。
