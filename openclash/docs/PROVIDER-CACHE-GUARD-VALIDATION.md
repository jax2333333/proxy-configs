# Provider Cache Guard v3.1.3.1 实机验证记录

> 本文记录 R2S 实机测试过程，不包含任何真实机场订阅、URL、Token 或节点凭据。

## 环境

- 设备：R2S
- 系统：ImmortalWrt
- 服务：OpenClash
- Core：Mihomo Meta

## 测试版本

脚本：

```text
openclash/toolkit/scripts/provider-cache-guard-v3.1.3.1.sh
```

部署路径：

```text
/etc/openclash/scripts/provider-cache-guard-v3.1.3.1.sh
```

状态文件：

```text
/etc/openclash/provider-cache-v3.1.3.1.sha256
```

日志：

```text
/tmp/provider-cache-guard-v3.1.3.1.log
```

## 验证结果

### 1. 首次初始化

正常输出：

```text
[FOUND] Airport-A nodes=57
[INIT] Airport-A sha saved
[FOUND] Airport-B nodes=65
[INIT] Airport-B sha saved
```

结论：

- 正确识别 Provider。
- 正确统计节点数量。
- 首次运行不会误删除缓存。

## 2. 稳定检测

正常输出：

```text
[CHECK] Airport-A unchanged nodes=57
[CHECK] Airport-B unchanged nodes=65
```

结论：

- SHA 指纹稳定。
- Provider 内容未变化时保持缓存。

## 3. 异常文件保护

测试方式：

将 Provider 临时替换为极小测试文件。

结果：

```text
[FOUND] Airport-A nodes=0 size=5B
[INVALID] Airport-A file too small skip
```

结论：

- 空文件或异常小文件不会覆盖有效 Provider。
- 避免错误订阅响应导致节点丢失。

## 4. 内容变化检测

测试方式：

修改 Provider 内容后恢复。

结果：

```text
[CHANGE] Airport-A content changed
[BACKUP] saved /etc/openclash/provider-cache-backup/...
[ACTION] removed cache Airport-A
```

结论：

- 可以检测 Provider 内容变化。
- 自动备份旧缓存。
- 仅处理变化 Provider，不影响其它 Provider。

## 5. 恢复验证

恢复原 Provider 后：

```text
[INIT] Airport-A sha saved
[CHECK] Airport-A unchanged nodes=57
```

结论：

- 状态文件重新建立正常。
- 后续检测恢复稳定。

## 当前长期方案

Provider Cache Guard 负责解决：

> 机场订阅 URL 已更新，但 OpenClash 因 Provider 缓存机制继续使用旧节点。

维护原则：

1. GitHub 只保存脚本和文档。
2. 真实订阅只保存在路由器本地。
3. 不删除整个 `proxy_provider` 目录。
4. 只针对变化 Provider 做备份和缓存刷新。
5. 修改脚本后必须先在 R2S 实机测试，再作为正式版本。

