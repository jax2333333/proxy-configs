# Provider Cache Guard 更新记录

## v3.1.3.1 - 2026-09-05

## 背景

解决 OpenClash Provider 更新后缓存未及时替换的问题。

历史问题：

- 机场订阅 URL 已变化。
- OpenClash 仍读取旧 provider cache。
- 重启 OpenClash 后部分情况下不会重新拉取。

因此增加 Provider 内容校验机制。

---

## 实机验证环境

- 路由器：R2S
- 系统：ImmortalWrt
- 服务：OpenClash
- Provider：Airport-A / Airport-B

---

## v3.1.3.1 功能

### 1. Provider 自动识别

支持：

- Airport-A
- Airport-B

记录：

```
FOUND Airport-A nodes=57
FOUND Airport-B nodes=65
```

---

### 2. SHA256 内容校验

首次运行保存：

```
provider-cache-v3.1.3.1.sha256
```

后续检测：

- 内容未变化 → 保持缓存
- 内容变化 → 执行保护流程

---

### 3. 异常文件保护

测试：

```
Airport-A size=5B
nodes=0
```

结果：

```
[INVALID] Airport-A file too small skip
```

避免错误订阅覆盖有效节点。

---

### 4. 内容变化处理

检测到变化：

```
[CHANGE] Airport-A content changed
```

执行：

1. 备份旧状态
2. 删除对应缓存
3. 保留其它 Provider 正常运行

验证：

```
[BACKUP] saved /etc/openclash/provider-cache-backup/Airport-A.xxx
[ACTION] removed cache Airport-A
```

---

## 当前验证结论

通过以下测试：

- Provider 初始化 ✅
- SHA 校验 ✅
- 不变检测 ✅
- 小文件保护 ✅
- 内容变化检测 ✅
- 自动备份 ✅
- Airport-A / Airport-B 独立处理 ✅

---

## 部署脚本

```
openclash/toolkit/scripts/provider-cache-guard-v3.1.3.1.sh
```

默认运行位置：

```
/etc/openclash/scripts/
```

---

## 安全规则

禁止写入：

- 真实机场 URL
- Token
- UUID
- 密钥
- 密码

GitHub 只保存通用维护脚本和验证流程。
