# OpenClash Provider Cache Guard

## Current version

`provider-cache-guard-v3.1.3.1`

Status: Production Ready

## Purpose

解决 OpenClash Provider 同名订阅更新后仍使用旧缓存的问题。

核心流程：

```
OpenClash启动
    ↓
Provider Cache Guard Hook
    ↓
扫描 Airport Provider
    ↓
SHA256 + 节点数量 + 文件大小检查
    ↓
异常保护 / 缓存清理
```

## Supported Provider

当前验证环境：

- Airport-A
- Airport-B

检测路径：

```
/etc/openclash/proxy_provider/
```

## Protection

### SHA256变化检测

正常：

```
[CHECK] Airport-A unchanged
```

变化：

```
[CHANGE] Airport-A content changed
[BACKUP] saved ...
[ACTION] removed cache Airport-A
```

### 异常订阅保护

防止：

- 空文件
- HTML错误页
- 下载失败内容
- 节点数量异常

测试结果：

```
[INVALID] Airport-A file too small skip
```

不会删除正常缓存。

## Verified Test

Airport-A:

```
nodes=57
size=494575B
```

Airport-B:

```
nodes=65
size=51360B
```

测试通过：

- 初始化 SHA
- 重复检查无变化
- 模拟文件损坏保护
- 模拟内容变化备份和清理

## Deployment

脚本：

```
openclash/toolkit/scripts/provider-cache-guard-v3.1.3.1.sh
```

运行位置：

```
/etc/openclash/scripts/
```

Hook：

```
/etc/openclash/custom/openclash_custom_overwrite.sh
```

## Security Rules

禁止提交：

- 真实机场订阅 URL
- UUID
- Token
- 密码
- Cookie
- 私钥

GitHub 只保存：

- 脚本
- 文档
- 测试流程
