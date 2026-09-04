# History — 2026-09-04 Shared MITM Certificate

> 本文件只记录本次故障与验证结论。当前正式架构以 `CURRENT-MITM-CERTIFICATE.md` 和 GitHub `main` 实际配置为准。

## 现象

用户在 iPhone 上使用 Shadowrocket：

```text
5G / Mobile
→ YouTube 去广告正常

家庭 Wi-Fi / Home Clean
→ YouTube 广告重新出现
```

此前已确认家庭 Wi-Fi 后端由 OpenWrt / OpenClash 负责实际代理与分流，Home Clean 只负责本机广告 / Rewrite / Script / MITM 净化。

## 排查发现

`youtube-adblock.sgmodule` 在 GitHub `main` 中已经包含 YouTube 所需的 MITM hostname 和 http-response Script，因此最初没有证据表明脚本或仓库模块本身失效。

进一步检查 Home Clean 的 HTTPS 解密证书页面时，只看到“生成新的 CA 证书”，说明当前场景没有沿用 Mobile 已工作的 CA 解密状态。

关键判断：

- YouTube 去广告依赖对 `youtubei.googleapis.com` 等目标响应进行 HTTPS 解密；
- 模块里的 `[MITM] hostname` 只声明要解密哪些目标，不等于当前配置自动拥有可用 CA；
- Mobile 已工作的 CA 没有在 Home Clean 当前场景中有效共享，因此 response Script 无法看到需要处理的明文响应；
- 这比“OpenClash 把广告放回来了”更符合实际现象。

## 修复方案

复用 Mobile 已经工作的 Shadowrocket CA，在 iPhone 本机建立共享证书模块：

```text
JAX MITM Certificate
```

模块包含本机实际 `ca-p12` 和证书 passphrase，只保存在 Shadowrocket 本地；没有将任何证书私钥材料写入 GitHub。

同时保持：

```text
JAX MITM Certificate
+
JAX - YouTube AdBlock
```

开启，并确认 iOS“证书信任设置”对该 CA 为完全信任。

## 验证结果

用户完成共享证书操作后，在家庭 Wi-Fi / Home Clean 下重新测试 YouTube：

```text
✅ YouTube 去广告成功恢复
```

因此本次故障已通过实机 A/B 验证：**根因位于场景切换后的 MITM CA 有效状态，而不是 Home Clean 的 `FINAL,DIRECT` 架构，也不是 YouTube 模块代码缺失。**

## 长期维护结论

以后如果出现“同一个 MITM 模块在 Mobile 正常、Home Clean 失效”，优先检查：

1. 本地共享 CA 模块是否开启；
2. iOS 是否仍完全信任该 CA；
3. 目标模块是否开启；
4. 当前场景配置是否正确；
5. 重新连接 Shadowrocket、完全退出并重开目标 App；
6. 最后才检查脚本代码、QUIC / UDP、OpenClash 或目标服务变化。

安全边界保持不变：真实 `ca-p12`、私钥、passphrase 永远不进入 GitHub。
