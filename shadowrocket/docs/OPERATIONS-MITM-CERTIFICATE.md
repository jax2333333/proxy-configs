# Operations — Shared MITM Certificate

> 目标：让 `Jax-shadowrocket-v6.conf` 与 `Jax-shadowrocket-home-clean.conf` 共用同一张已经工作的 Shadowrocket CA，避免场景切换后 HTTPS 解密失效。

## 适用前提

优先用于以下场景：

- Mobile / 5G 下需要 MITM 的模块已经工作正常；
- Home Clean 下同一模块失效；
- iPhone 已经安装并完全信任 Mobile 当前使用的 Shadowrocket CA。

如果 Mobile 自己也不能正常解密，不应直接复制证书模块，应先修复 Mobile 的 HTTPS 解密和 iOS 证书信任。

## 1. 从已工作的 Mobile 配置复制 CA 内容

在 Shadowrocket 中进入：

```text
配置
→ Jax-shadowrocket-v6.conf 右侧 ⓘ
→ HTTPS 解密
→ 证书
→ 当前证书右侧 ⓘ
→ 复制
```

这里使用“复制”，不是把 `.p12` 导出后在 iPhone“文件”中打开。

导出的 `.p12` / `.pfx` 属于 PKCS#12 证书容器，不是普通文本文件，在“文件”App 中无法像 TXT / PDF 一样直接查看属于正常现象。

## 2. 获取当前证书实际密码

在 Mobile 的 HTTPS 解密设置中确认当前 CA 的实际 passphrase。

不要依赖猜测默认密码；如果已经自定义，以设备当前实际值为准。

## 3. 新建本地共享证书模块

在 Shadowrocket 中进入：

```text
配置
→ 模块
→ +
→ 新建模块
```

本机建议名称：

```text
JAX MITM Certificate
```

模块结构：

```ini
#!name=JAX MITM Certificate
#!desc=JAX 本机共享 MITM CA；禁止上传 GitHub

[MITM]
enable=true
ca-passphrase=<本机实际证书密码>
ca-p12=<从已工作的 Mobile 证书复制得到的内容>
```

### 安全要求

- 上述完整模块 **只保存在 iPhone 本机**。
- 不把真实 `ca-p12` 或 `ca-passphrase` 写入 GitHub、Notion、聊天、公开 Gist 或云端配置。
- 不截图包含 `ca-p12`、密码、私钥的页面。
- GitHub 文档只能保存占位符示例，不能保存真实材料。

## 4. 开启共享证书模块

在：

```text
Shadowrocket
→ 配置
→ 模块
```

确认：

```text
✅ JAX MITM Certificate
```

需要 MITM 的功能模块也必须同时开启。例如 YouTube：

```text
✅ JAX MITM Certificate
✅ JAX - YouTube AdBlock
```

共享 CA 只提供解密能力，不替代 YouTube 模块里的 hostname、Rewrite 或 Script。

## 5. 确认 iOS 完全信任 CA

进入：

```text
iPhone 设置
→ 通用
→ 关于本机
→ 证书信任设置
```

确认当前 Shadowrocket CA 已启用：

```text
✅ 完全信任
```

证书已经安装但没有“完全信任”时，HTTPS 解密仍可能无法工作。

## 6. Home Clean 验证

连接家庭 Wi-Fi 后：

1. 确认场景切换到 `Jax-shadowrocket-home-clean.conf`；
2. 确认 `JAX MITM Certificate` 开启；
3. 确认目标模块（例如 `youtube-adblock.sgmodule`）开启；
4. 完全划掉目标 App；
5. 断开 Shadowrocket；
6. 重新连接 Shadowrocket，等待数秒；
7. 重新打开目标 App 测试。

YouTube 建议连续播放多个容易出现片头 / 中插广告的视频确认结果，不只测试单个视频。

## 7. 已验证结果

2026-09-04 实机验证：

```text
Mobile / 5G：YouTube 去广告正常
Home Clean：共享 CA 前出现广告
启用 JAX MITM Certificate 后：Home Clean YouTube 去广告恢复
```

该结果说明 Home Clean 的 `FINAL,DIRECT` 与 Toolkit MITM 并不冲突；正常流量仍交给 OpenClash，而 Shadowrocket 可以先在本机完成 HTTPS 解密、Rewrite / Script 处理。

## 8. 回滚

如果共享证书模块导致异常：

1. 先单独关闭 `JAX MITM Certificate` 做 A/B；
2. 不修改两个正式配置；
3. 恢复原先已工作的单配置 HTTPS 解密方式；
4. 再检查 CA 信任、目标模块 hostname 和脚本日志。

整个回滚过程不需要修改 GitHub 正式配置。
