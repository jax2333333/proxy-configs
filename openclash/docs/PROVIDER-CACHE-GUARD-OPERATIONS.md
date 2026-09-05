# Provider Cache Guard v3.1.3.1 操作指南

## 目的

解决 OpenClash / Mihomo 中 HTTP Provider 更换订阅地址后，同名 Provider 继续使用旧缓存的问题。

适用于：

- R2S
- ImmortalWrt
- OpenClash
- Mihomo Meta
- 多机场 Provider 架构

## 当前验证环境

- Provider-A：Airport-A
- Provider-B：Airport-B
- 节点数量验证：
  - Airport-A: 57 nodes
  - Airport-B: 65 nodes

## 已验证流程

### 1. 首次运行

行为：

- 读取本地 Provider 信息
- 计算 URL SHA256 指纹
- 保存状态
- 不删除缓存

示例日志：

```
[FOUND] Airport-A nodes=57
[INIT] Airport-A sha saved
```

### 2. 正常检查

URL 未变化：

```
[CHECK] Airport-A unchanged nodes=57
```

保持现有缓存，不重复下载。

### 3. 异常订阅保护

如果 Provider 文件异常：

- 文件过小
- 节点数量为 0
- 下载失败

例如：

```
[FOUND] Airport-A nodes=0 size=5B
[INVALID] Airport-A file too small skip
```

守卫会跳过处理，避免错误覆盖正常缓存。

### 4. URL 内容变化

检测到变化：

```
[CHANGE] Airport-A content changed
[BACKUP] saved /etc/openclash/provider-cache-backup/...
[ACTION] removed cache Airport-A
```

执行：

1. 备份旧缓存
2. 删除对应 Provider 缓存
3. 更新 SHA 状态
4. 等待 OpenClash 重新加载

## Hook

入口：

```
/etc/openclash/custom/openclash_custom_overwrite.sh
```

调用：

```
/etc/openclash/scripts/provider-cache-guard-v3.1.3.1.sh
```

日志：

```
/tmp/provider-cache-guard-v3.1.3.1.log
```

## 当前测试结果

2026-09-05：

- Airport-A 初始化成功
- Airport-B 初始化成功
- Airport-A 异常小文件保护成功
- Airport-A 内容变化检测成功
- Airport-A 缓存备份成功
- Airport-A 缓存清理成功
- 重启后重新建立 SHA 成功
- Airport-B 保持稳定

## 安全规则

禁止写入 GitHub：

- 真实订阅 URL
- UUID
- Token
- 密码
- Cookie
- 私钥

GitHub 只保存无凭据脚本和维护文档。

真实机场信息只保存在 R2S 本地覆写模块。
