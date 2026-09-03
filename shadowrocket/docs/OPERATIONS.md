# Operations

## 两个正式配置

### 外出 / 蜂窝 / 非家庭 Wi-Fi

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-v6.conf
```

用途：Shadowrocket 自己负责 DNS、规则分流、策略组和代理节点。除明确受信家庭 SSID 外，酒店、公司、商场、咖啡店、机场、朋友家等其它 Wi-Fi 也应使用此配置。

### 家庭 Wi-Fi：只净化，不代理

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-home-clean.conf
```

用途：Shadowrocket 只作为 iPhone 本机的 Toolkit 净化层；正常流量 `FINAL,DIRECT` 继续交给家庭 OpenWrt / OpenClash 做最终国内直连、国外代理与 DNS。

## 从零恢复 Shadowrocket

1. 从 GitHub `main` 获取当前两个正式配置。
2. 在 Shadowrocket 中分别导入或更新移动主配置与 Home Clean 配置。
3. 按需添加 Toolkit 模块；涉及 MITM 时确认 Shadowrocket 证书已正确安装并信任。
4. 高风险模块逐个启用和测试，不一次性开启全部实验功能。
5. 使用“场景”建立三层兜底：家庭指定 SSID → Home Clean；蜂窝 → Mobile；默认/其它网络 → Mobile。

## 设置家庭 Wi-Fi / 蜂窝 / 其它 Wi-Fi 自动切换

目标：

```text
家庭指定 Wi-Fi
→ Jax-shadowrocket-home-clean.conf
→ Shadowrocket 只净化
→ OpenClash 代理/分流

蜂窝网络
→ Jax-shadowrocket-v6.conf
→ Shadowrocket 自己代理/分流

其它 Wi-Fi / 未命中网络
→ 默认场景
→ Jax-shadowrocket-v6.conf
→ Shadowrocket 自己代理/分流
```

### 1. 先导入两个配置

在 Shadowrocket 的配置页面通过 URL 导入：

```text
# 移动主配置
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-v6.conf

# 家庭净化配置
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/shadowrocket/Jax-shadowrocket-home-clean.conf
```

### 2. 新建家庭 Wi-Fi 场景

进入：

```text
Shadowrocket 首页
→ 全局路由
→ 场景
→ 添加场景
```

建议填写：

```text
网络类型：Wi-Fi
SSID：家里 Wi-Fi 的实际名称（必须完全一致）
路由模式：配置
配置文件：Jax-shadowrocket-home-clean.conf
备注：JAX Home Clean
```

只把**明确确认后端有 OpenWrt / OpenClash** 的家庭 SSID 加入 Home Clean。不要创建“所有 Wi-Fi → Home Clean”的泛化规则。

### 3. 新建蜂窝网络场景

继续添加：

```text
网络类型：蜂窝数据
路由模式：配置
配置文件：Jax-shadowrocket-v6.conf
备注：JAX Mobile
```

默认蜂窝接口通常不需要额外填写；如果设备存在多个蜂窝网络接口，再通过 Shadowrocket“设置 → 诊断 → 网络”确认实际接口。

### 4. 新建默认兜底场景

继续添加：

```text
网络类型：默认
路由模式：配置
配置文件：Jax-shadowrocket-v6.conf
备注：JAX Default / External Wi-Fi
```

这个场景负责所有没有命中家庭指定 SSID、也不是明确蜂窝规则的网络。它是外部 Wi-Fi 的安全兜底。

典型行为：

```text
酒店 Wi-Fi
公司 Wi-Fi
商场 / 咖啡店 Wi-Fi
机场 Wi-Fi
朋友家 Wi-Fi
其它未知 Wi-Fi
        ↓
没有命中家庭 SSID
        ↓
默认场景
        ↓
Jax-shadowrocket-v6.conf
```

**不要让这些网络回落 Home Clean。** Home Clean 的最终规则是 `FINAL,DIRECT`，其设计前提是后端家庭网关继续由 OpenClash 代理；外部 Wi-Fi 通常没有这个条件。

### 5. 启用场景模式

回到：

```text
Shadowrocket 首页
→ 全局路由
→ 场景
```

保持 Shadowrocket 隧道开启。若需要脚本、模块、MITM 持续工作，优先使用“始终开启”或合适的按需求连接设置。

首次按 SSID 建场景时，如果系统要求位置相关权限，需要允许 Shadowrocket 获取识别 Wi-Fi SSID 所需的权限；否则场景列表的网络识别状态可能不能正常更新。

### 6. 场景最终检查表

建议最终只有以下职责关系：

```text
家庭指定 SSID → Home Clean
蜂窝数据      → Mobile
默认/其它网络 → Mobile
```

如果家里以后增加第二个 SSID / AP，或有个人旅行路由器且也明确由 OpenClash 接管，可单独再添加一个受信 Wi-Fi 场景；不要修改默认场景为 Home Clean。

SSID 不是强身份校验。如果在其它地点碰到与家里完全同名的 SSID，有疑问时手动确认当前配置并优先使用 Mobile。

## 家庭 Home Clean 验证

切到家庭 Wi-Fi 后，不要只看“Shadowrocket 已连接”，至少做下面几项验证。

### A. 确认当前配置

场景应选择：

```text
Jax-shadowrocket-home-clean.conf
```

### B. 确认正常流量没有使用 Shadowrocket 节点

Home Clean 不包含代理节点或代理策略组，主规则最终为：

```text
FINAL,DIRECT
```

如果普通请求显示为 DIRECT，这是预期行为。

### C. 确认国外网站仍可访问

如果国外网站可以正常访问，说明：

```text
Shadowrocket DIRECT
→ 家庭网关
→ OpenClash 继续透明代理
```

这不是“双层代理”。

### D. 确认 DNS 仍由家庭网络负责

Home Clean 必须保持：

```text
dns-server = system
fallback-dns-server = system
```

并且不要加入公网 DoH 或 `hijack-dns`。实际 DNS 链路应结合 OpenWrt / OpenClash 当前配置和泄漏测试确认。

### E. 确认 Toolkit 生效

优先验证低风险模块：

```text
privacy-lite.sgmodule
url-cleaner-safe.sgmodule
httpdns-block-safe.sgmodule
```

再验证自己实际使用的 App 专用模块。不要为了验证家庭模式同时启用 `general-adblock-safe`、`splash-adblock-safe` 等更多变量。

### F. OpenClash Fake-IP 注意事项

家庭配置不要把：

```text
198.18.0.0/15
```

加入 `tun-excluded-routes`。如果 OpenClash 使用该 Fake-IP 网段，直接从 Shadowrocket TUN 排除它可能让相关连接绕开 Toolkit 净化层。

## 外部 Wi-Fi 验证

连接一个非家庭 Wi-Fi 后，确认场景使用：

```text
Jax-shadowrocket-v6.conf
```

而不是 Home Clean。

如果外部 Wi-Fi 下看到当前配置仍是 Home Clean，优先检查：

1. 家庭场景是否误写成任意 Wi-Fi；
2. 默认场景是否缺失；
3. 默认场景是否错误指向 Home Clean；
4. 外部 Wi-Fi 是否恰好与家庭 SSID 同名。

修复原则是让未知/公共网络回落移动主配置，而不是给 Home Clean 增加代理规则。

## 家庭模式模块建议

建议：

```text
✅ privacy-lite.sgmodule
✅ network-health.sgmodule
✅ url-cleaner-safe.sgmodule
✅ httpdns-block-safe.sgmodule
✅ 实际使用的 App / 网站专用模块
✅ youtube-adblock.sgmodule（有需求时）

✅/按需 proxy-stability.sgmodule（若外出移动模式需要，可长期保持开启；Home Clean 下通常基本不生效）
ℹ️ webrtc-privacy.sgmodule（两个正式配置已经内置，不重复开启）
❌ general-adblock-safe.module（除非基础/专用模块仍不够）
❌ splash-adblock-safe.module（最后单独测试）
❌ app-adblock-template.sgmodule
```

`proxy-stability.sgmodule` 的 `block-quic = all-proxy` 只针对 Shadowrocket 自己的代理连接。Home Clean 的正常流量最终 `FINAL,DIRECT`，因此即使模块保持开启，通常也没有 Shadowrocket PROXY 流量可供它阻断 QUIC；家庭实际代理 QUIC 仍由 OpenClash 负责。

如果外出移动模式已经确认开启 `proxy-stability.sgmodule` 有收益，可以让它长期保持开启，**不需要回家关闭、出门再打开**。只有移动模式出现延迟升高、耗电变化或 App 兼容性问题时，才关闭该模块做 A/B。

## WebRTC / 实时音视频 P0 回退

无论当前使用移动主配置还是 Home Clean，只要出现 FaceTime、Google Meet、Discord 语音或网页视频会议异常：

1. 第一优先检查并关闭重复启用的 `webrtc-privacy.sgmodule`；
2. 若没有重复模块或关闭后仍异常，临时撤销当前配置中的：

```text
stun-response-ip = 1.0.0.1
stun-response-ipv6 = ::1
```

3. 重新加载配置并完全退出/重开目标 App 做 A/B；
4. 只有 WebRTC/STUN 无法解释时，再查 QUIC、DNS、节点、MITM、运营商或目标服务。

## 添加或更新 Toolkit 模块

1. 从 `main` 读取当前模块 Raw 地址。
2. 在 Shadowrocket 中打开“配置 → 模块”，新增或更新模块。
3. 断开 Shadowrocket，完全退出目标 App，重连后重新打开 App 验证。
4. 出现异常时先关闭刚更新的模块并做 A/B 验证。

## 修改 GitHub 文档或配置

```text
读取 main 最新文件
→ 检查差异与作用域
→ 最小修改
→ 语法 / 安全 / 规则检查
→ git diff
→ 向用户报告
→ 用户明确授权后 commit / push
→ 重新读取 main 实际结果
```

基础检查：

```bash
git status
git branch --show-current
git pull --ff-only origin main
git diff --check
git diff
```

只暂存用户许可范围内的文件。提交前检查 Token、password、secret、authorization、Cookie、UUID、真实订阅地址和 SSH 私钥头；发现真实凭据立即停止提交。

## 故障回滚

先判断当前使用的是移动主配置还是 Home Clean，再关闭刚更新或刚开启的模块。若恢复，保持正式配置不动，回退该模块到上一正式 commit，再按日志定位最小修复。
