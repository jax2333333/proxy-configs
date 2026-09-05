# OpenClash Provider Cache Guard v3 维护记录

## 问题背景

在双机场架构下，修改 YAML 中的 Provider 订阅地址后，OpenClash 仍可能继续加载旧节点。

实际原因：

```text
YAML proxy-provider URL 更新
        ↓
OpenClash 仍读取旧缓存
        ↓
/etc/openclash/proxy_provider/
        ↓
节点列表没有刷新
```

OpenClash Provider 缓存目录是关键检查位置。

---

## 当前架构

Provider：

| Provider | 角色 |
|---|---|
| Airport-A | 主力机场 |
| Airport-B | 辅助机场 |

缓存目录：

```text
/etc/openclash/proxy_provider/
```

状态文件：

```text
/etc/openclash/provider-cache-v3.sha256
```

脚本：

```text
/etc/openclash/scripts/provider-cache-guard-v3.sh
```

启动调用：

```text
/etc/openclash/custom/openclash_start.sh
```

---

## v3 工作逻辑

启动时：

```text
OpenClash Start
      ↓
openclash_start.sh
      ↓
provider-cache-guard-v3.sh
      ↓
计算 Airport-A/B Provider SHA256
      ↓
与 provider-cache-v3.sha256 比较
```

无变化：

```text
[CHECK] Airport-A unchanged
[CHECK] Airport-B unchanged
```

变化：

```text
[CHANGE] Airport-A content changed
[ACTION] removed cache Airport-A
```

只处理变化的 Provider，不影响另一机场。

---

## 本次排查过程

### 发现问题

修改机场订阅后：

- YAML 已更新
- Provider 文件仍为旧节点
- OpenClash 重启后仍加载旧缓存

检查：

```bash
ls -lh /etc/openclash/proxy_provider/
```

确认 Airport-A / Airport-B 缓存存在。

---

## 验证结果

已验证：

### 1. Provider 文件存在

```text
Airport-A
Airport-B
```

### 2. SHA 初始化成功

示例：

```text
Airport-A <sha256>
Airport-B <sha256>
```

### 3. 无变化检测正常

```text
[CHECK] Airport-A unchanged
[CHECK] Airport-B unchanged
```

### 4. 模拟变化检测正常

测试：

```bash
echo "#test" >> /etc/openclash/proxy_provider/Airport-A
```

结果：

```text
[CHANGE] Airport-A content changed
[ACTION] removed cache Airport-A
```

Airport-B 不受影响。

---

## 注意事项

1. 不要把真实机场订阅 URL 写入 GitHub。
2. Provider 缓存状态只保存 SHA256，不保存订阅内容。
3. 测试修改 Provider 后必须恢复文件，否则会持续触发变化检测。
4. 删除缓存后，需要 OpenClash 重新生成 Provider。

---

## 故障排查流程

### 节点没有更新

先检查：

```bash
ls -lh /etc/openclash/proxy_provider/
```

查看 Provider 内容：

```bash
grep -c "name:" /etc/openclash/proxy_provider/Airport-A
grep -c "name:" /etc/openclash/proxy_provider/Airport-B
```

查看守卫状态：

```bash
cat /tmp/provider-cache-guard-v3.log
```

查看 SHA：

```bash
cat /etc/openclash/provider-cache-v3.sha256
```

---

## 当前结论

Provider Cache Guard v3 已完成双机场环境验证：

- Airport-A / Airport-B 独立检测
- SHA256 状态管理
- 启动自动检查
- 缓存异常定位
- 防止订阅更新后继续使用旧节点

后续如升级，建议在 v3 基础上增加 pending-refresh 状态管理，避免删除缓存后等待 OpenClash重新生成期间重复触发。
