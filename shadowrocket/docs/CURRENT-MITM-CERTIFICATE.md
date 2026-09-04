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
4. `youtube-adblock.sgmodule` 是否开启；
5. 完全退出目标 App，断开并重连 Shadowrocket 后复测；
6. 上述均正常后，才进一步检查 hostname、Script 日志、QUIC / OpenClash 链路。

不要因为 Home Clean 下出现广告就先给 Home Clean 添加代理组、代理节点或移动版 DNS。
