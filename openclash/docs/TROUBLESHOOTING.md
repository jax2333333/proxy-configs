# OpenClash 故障诊断手册

本文遵循 OpenClash 官方指南的排障顺序：**先 Debug 日志 → 日志不足再给精确查询命令 → 确认根因后再修改 LuCI / YAML / 覆写。** 不允许先猜配置。

## 1. 第一动作：生成 Debug 日志

LuCI：

```text
服务 → OpenClash → 运行日志 → 生成日志
```

SSH / LuCI 终端：

```sh
/usr/share/openclash/openclash_debug.sh
```

输出：

```text
/tmp/openclash_debug.log
```

Debug 日志会包含系统信息、依赖、内核、插件/覆写设置、配置文件、防火墙、路由、TUN、接口、DNS、网络连通性、Mihomo API、最近日志和活动连接。优先使用最新一次生成的日志，不用旧日志推断当前状态。

## 2. 常见故障速查

### A. `parse proxy provider ... has unset fields: type`

历史根因：本地覆写新增了一个 GitHub 正式 YAML 从未完整定义过的 Provider，只提供 `url`，导致 Mihomo 缺少必填 `type`。

检查：

- 读取 `main` 最新 YAML 中对应 `proxy-providers`。
- 确认 Provider 已有完整骨架。
- 本地 `local-airport.txt` 才只覆盖 URL。

修复时不要把真实 URL 写进 GitHub。

### B. GitHub 已更新，R2S 仍是旧版本

历史根因：OpenClash 配置订阅仍指向旧 Gist，而正式配置已经迁移到仓库 Raw。

正式 Raw：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v5.yaml
```

检查“配置订阅”实际地址和运行日志中的下载地址。OpenClash 更新流程会下载、YAML 校验、新旧对比后再替换配置；不能只看 GitHub 页面判断路由器已更新。

### C. `find-process-mode: off` 解析异常

历史上 OpenClash/Ruby YAML 处理链曾把未加引号的 `off` 解释为布尔值。当前正式 YAML 使用：

```yaml
find-process-mode: 'off'
```

不要无理由移除引号。

### D. BrowserLeaks 显示中国运营商出口

历史上不是 DNS 泄漏，而是 `browserleaks.com` 被 `cn_domain` 规则集误分类，导致直连。日志曾明确显示命中 `RuleSet(cn_domain)`。

当前正式 YAML 已在中国规则之前放置：

```yaml
- DOMAIN-SUFFIX,browserleaks.com,🔮 节点选择
```

如果再次发生，先看实时连接日志确认实际命中规则；不要先重写 DNS。

### E. DNSLeakTest / ipleak 出现国内 DNS

检查顺序：

1. 先看当前 YAML 的 `nameserver`、`nameserver-policy`、`proxy-server-nameserver`、`direct-nameserver` 和 `respect-rules`。
2. 生成 Debug 日志检查 dnsmasq → Mihomo DNS 转发链。
3. 判断出现的国内 DNS 是用于国内直连域名/节点 bootstrap，还是境外查询真正泄漏。
4. 不要一次同时改 nameserver、dnsmasq、fallback、Fake-IP 过滤和防火墙劫持。

历史 DNS Strict 方案曾验证境外泄漏测试只看到 Google / Cloudflare 等海外解析器，见 `HISTORY.md`。

### F. IPv6 看起来“泄漏”

历史策略是关闭本地公网 IPv6，因为“OpenClash IPv6 代理关闭 + 系统公网 IPv6 开启”可能绕过代理。

若 ipleak 显示海外 IPv6，要先区分：

- 浏览器默认是否仍是代理 IPv4。
- 系统是否存在公网 IPv6 默认路由。
- 显示的 IPv6 是否只是代理出口侧能力。

代理出口出现海外 IPv6 不自动等于本地 ISP IPv6 泄漏。

### G. Hysteria2 节点测速无速度

这是目前**尚未确认根因**的问题，不能直接修改 GitHub 配置。

先生成最新 Debug 日志，重点看：

- Hysteria2 节点实际解析后的参数。
- Core Logs 中 `quic-go` / `GSO` / `timeout` / `handshake` / `network` / `udp` 等错误。
- 当前 Linux 内核、Mihomo 核心和 OpenClash 设置。
- UDP / QUIC 是否可用。
- Provider 健康检查是否只有延迟失败，还是实际节点不可用。

OpenClash 官方指南指出：Linux 内核 6.6+ 环境下，Hysteria / Hysteria2 / TUIC 等 QUIC 节点若出现超时、断流、握手失败，可在 `服务 → OpenClash → 插件设置 → 模式设置` 尝试开启“禁用 quic-go GSO”，但必须优先结合日志判断。

注意：OpenClash 的“禁用 LAN 客户端 QUIC”选项并不等同于禁用 Mihomo 自身的 Hysteria2 出站 QUIC，不能因为看到 QUIC 开关就直接下结论。

### H. TUN / Mix 性能明显低

先确认这不是节点或带宽瓶颈。历史 A/B 中显式代理端口可跑到约 340 Mbps，而完整 TUN 路径显著更低，且 R2S CPU 仍有大量空闲，因此当时主要瓶颈不是 CPU，也不是机场节点。

检查：

- 当前运行模式和 TUN 栈。
- `kmod-tun`、`kmod-nft-tproxy` 是否安装/加载。
- 同一个节点、同一个测试文件、相近时间进行 A/B。
- 不要用单线程下载的一次结果直接判定路由器性能。

OpenClash fw4 环境的 Fake-IP/TUN/Mix 都依赖 `kmod-nft-tproxy`，TUN/Mix 还需要 `kmod-tun`。

## 3. 日志不足时的安全查询

以下命令只应在路由器 SSH 或 LuCI 终端执行；先有 Debug 日志，再按症状选择，不需要全部运行。

```sh
# 🟢 核心是否运行
pidof clash

# 🟢 最近错误
 tail -50 /tmp/openclash.log | grep -iE 'error|fatal|timeout|refused|reset|quic|gso'

# 🟢 内核模块
lsmod | grep -E 'tun|nft_tproxy|inet_diag'

# 🟢 当前代理模式
curl -s http://127.0.0.1:9090/configs | grep '"mode"'

# 🟢 DNS 端口
netstat -tlnp | grep 7874

# 🟢 TUN 策略路由
ip rule show | grep 0x162
```

任何带修改、重启、清缓存或更新订阅的命令都有副作用，使用前先说明风险。

## 4. 官方参考路由

排障时优先读取 OpenClash 用户指南入口，再按路由表加载：

- `03-errors.md` — 错误关键字。
- `08-settings-mode-traffic.md` — TUN/Mix、QUIC、GSO。
- `09-settings-dns-ac-ipv6.md` — DNS / IPv6。
- `12-subscribe-config.md` — 订阅更新。
- `13-logs.md` — Debug 日志。
- `14-diagnostics.md` — 决策树和 CLI。
- `16-overwrite-module-format.md` — 覆写模块。

入口：

```text
https://raw.githubusercontent.com/vernesong/OpenClash/dev/.github/skills/openclash-user-guide/SKILL.md
```
