# Current MITM Certificate Sharing

> 本文件记录 Shadowrocket 多正式配置之间的当前 MITM / HTTPS 解密证书约定。证书本体、PKCS#12 内容、私钥和密码均只保存在 iPhone 本机，不进入 GitHub。

## 当前正式设计

Shadowrocket 当前有两个正式配置：

- `Jax-shadowrocket-v6.conf`：外出 / 蜂窝 / 非家庭 Wi-Fi。
- `Jax-shadowrocket-home-clean.conf`：家庭 Wi-Fi，只负责本机净化，正常流量 `FINAL,DIRECT` 交给 OpenClash。

需要 HTTPS 解密的 Toolkit 模块（例如 `youtube-adblock.sgmodule`）会在模块自己的 `[MITM] hostname` 中声明目标域名；两个正式主配置不保存 CA 私钥材料。

为了避免场景从 Mobile 切到 Home Clean 后 HTTPS 解密失效，当前已验证采用一个 **仅存于 Shadowrocket 本机的共享证书模块**，本机名称为：

```text
JAX MITM Certificate
```

其作用是让 Mobile 与 Home Clean 共用同一张已经在 iOS 中安装并“完全信任”的 Shadowrocket CA。

## 多设备固定原则

新增第二台、第三台 iPhone / iPad 时，默认采用：

```text
每台设备生成自己的 Shadowrocket CA
→ 该设备内部用 JAX MITM Certificate
→ 只在该设备的 Mobile 与 Home Clean 之间共享
```

不把同一份 CA 私钥作为“全家设备通用证书”批量复制。这样即使某一台设备的本地证书材料泄露，也不会自动扩大到其它设备。

只有明确执行旧机迁移、且确实需要保留原 CA 时，才考虑通过受信任的设备到设备方式迁移；日常新增设备优先重新生成独立 CA。

完整新设备流程见：`IOS-NEW-DEVICE-SETUP.md`。

## 固定安全边界

- `ca-p12`、CA 私钥、证书密码 / passphrase 不得写入 `jax2333333/proxy-configs`。
- 不在聊天中发送或截图暴露 `ca-p12`、密码、私钥内容。
- 不把共享证书材料加入 `Jax-shadowrocket-v6.conf`、`Jax-shadowrocket-home-clean.conf`、Toolkit module 或任何 Raw 配置。
- GitHub 只记录架构、操作方法和故障结论，不保存可用于解密的认证材料。
- MITM hostname 仍按模块最小化维护，禁止为了省事使用 `hostname=*`。

## 与 YouTube 模块的关系

`youtube-adblock.sgmodule` 当前负责：

- YouTube 所需的 MITM hostname；
- QUIC / UDP 回退规则；
- URL Rewrite；
- `youtube-adblock-local.js` 的 http-response protobuf 过滤。

共享证书模块只解决 **“当前配置是否拥有可用并受信任的 CA”**，不替代 YouTube 模块自己的 hostname / Script / Rewrite。

因此两者都需要有效：

```text
JAX MITM Certificate（本机共享 CA）
+
youtube-adblock.sgmodule（目标域名 + 去广告逻辑）
```

## 已验证运行状态

2026-09-04 已在实际设备验证：

```text
5G / Mobile
→ YouTube 去广告正常

家庭 Wi-Fi / Home Clean
→ 未共享 CA 时 YouTube 广告重新出现
→ 启用本地 JAX MITM Certificate，共享 Mobile 已工作的 CA
→ iOS 保持完全信任
→ 重新连接 Shadowrocket、重启 YouTube
→ YouTube 去广告恢复成功
```

这说明 Home Clean 的 `FINAL,DIRECT` 本身不会阻止 Shadowrocket Toolkit 的 HTTPS 解密 / response Script；关键前提是 Shadowrocket 隧道、模块和共享 CA 在当前场景下实际生效。

## 2026-09-06：主动验证 HTTPS 解密的方法

抖音广告排障中已实际验证一个低风险判断方法：

1. 保持当前 Shadowrocket 场景与目标模块开启；
2. 用 Safari / Chrome iOS 主动访问模块 `[MITM] hostname` 覆盖的测试域名；
3. 回到 Shadowrocket 数据日志查看该请求。

本次访问：

```text
https://api.amemv.com/
```

随后日志中可以看到完整 HTTPS URL：

```text
https://api.amemv.com/favicon.ico
```

并能看到浏览器完整 User-Agent，而不是只有：

```text
api.amemv.com:443
TCP Stream
```

因此可确认该次浏览器请求已经进入 HTTP 层可见状态，说明以下基础链路可用：

```text
共享 CA
+ iOS 完全信任
+ 当前模块 hostname 匹配
+ 当前 Shadowrocket 场景
```

### 诊断边界

这个主动测试只能证明 **MITM 基础链路对该浏览器请求有效**，不能单独证明某个目标 App 的所有 HTTPS 请求都一定能被解密。

App 仍可能因为以下原因只显示连接级日志：

- 证书固定 / App 自身 TLS 校验；
- QUIC / UDP；
- 使用了其它没有加入 MITM 的主机名；
- 请求没有落到当前 response Script 的 pattern；
- 目标响应不是脚本能够处理的格式。

因此以后不能再使用“APP 一栏必须显示字面值 `MITM`”作为唯一判据，也不能因为 Safari 主动测试成功就直接认定 App 内 response Script 已经执行。优先结合 **完整 HTTPS URL、User-Agent、Script 日志和 App 实际请求**综合判断。

详细抖音实测见：`HISTORY-DOUYIN-ADBLOCK-20260906.md`。

## 固定诊断优先级

若以后出现：

```text
5G / Mobile 去广告正常
但
家庭 Wi-Fi / Home Clean 又出现广告
```

第一优先检查：

1. 当前场景是否确实为 Home Clean；
2. `JAX MITM Certificate` 本地模块是否开启；
3. iOS“证书信任设置”中该 CA 是否仍为完全信任；
4. 对应需要 MITM 的目标模块是否开启；
5. 完全退出目标 App，断开并重连 Shadowrocket 后复测；
6. 如仍不确定，使用上面的主动验证方法确认 MITM 基础链路；
7. 基础链路正常后，才进一步检查 hostname、Script 日志、QUIC / OpenClash 链路或 App 自身 TLS 行为。

不要因为 Home Clean 下出现广告就先给 Home Clean 添加代理组、代理节点或移动版 DNS。
