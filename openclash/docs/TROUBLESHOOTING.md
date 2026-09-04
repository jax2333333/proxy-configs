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

### I. 本地 Provider URL 已更换，但节点仍是旧的

2026-09-04 已在 R2S 实机复现并验证。典型现象：

- `local-airport.txt` 已启用且 `config` 匹配当前配置。
- `/etc/openclash/config/<配置名>.yaml` 仍显示 GitHub 占位 URL；这是源配置，属于正常现象。
- `/etc/openclash/<配置名>.yaml` 的运行时 Provider URL 已被本地覆写成功。
- 新 URL 从 R2S 直接 `curl` 返回 HTTP 200，YAML 可解析、节点数量正常。
- 但 `/etc/openclash/proxy_provider/<Provider名>` 的 SHA256 与新下载文件不同，后台仍显示旧节点。

已确认机制：OpenClash 会把 HTTP Provider 的路径规范化为按 Provider 名固定的 `./proxy_provider/<name>.yaml` 一类路径，因此同名 Provider 更换 URL 后仍可能复用原有缓存。只看 `health-check.interval` 不足以判断是否重新下载订阅；健康检查与 Provider 内容更新是两件事。

推荐诊断：

1. 先确认当前 `config_path` 与运行时配置文件存在。
2. 查看运行时 `proxy-providers`，URL 必须脱敏后再贴到聊天或日志。
3. 从运行时 URL 下载到 `/tmp/<Provider>.fresh`，检查 HTTP 状态和 YAML 是否可解析。
4. 仅比较新文件与 `/etc/openclash/proxy_provider/<Provider>` 的大小、节点数、SHA256。
5. 新文件和缓存 SHA 不同，且新文件有效时，才进入缓存修复；不要先删除整个目录。

2026-09-04 已验证的恢复方式：先备份旧 Provider 文件，再将有效的新 Provider 文件原位替换，重启 OpenClash。重启后新 SHA 保持不变，OpenClash 后台重新加载新节点。

已部署并验证的自动方案是**本地 Provider URL 指纹守卫**：

- `/etc/openclash/custom/openclash_custom_overwrite.sh` 在 OpenClash 启动阶段调用 `/etc/openclash/scripts/provider-cache-guard.sh`。
- 守卫直接解析 `/etc/openclash/overwrite/local-airport.txt`，自动识别 Provider，仅在 `/etc/openclash/provider-url-sha256` 保存 Provider 名和 URL 的 SHA256，不保存真实 URL。
- 首次运行或首次发现某个 Provider 时只建立指纹，不清缓存；后续仅在该 Provider URL 指纹变化时备份并清除其精确缓存文件。
- 任一步骤失败时启动钩子不会阻止 OpenClash 继续启动；对应旧缓存会保留，失败 Provider 的旧指纹也会保留以便下次重试。

守卫异常时按以下顺序检查：

1. 确认两个脚本存在且权限为 `0755`，不要打印 `local-airport.txt` 内容。
2. 用 `logread -e openclash-provider-cache-guard` 查看守卫日志；日志只应包含 Provider 名和处理结果，不应出现 URL。
3. 确认 `/etc/openclash/provider-url-sha256` 只包含 Provider 名和 64 位 SHA256；该文件不应包含 `http://` 或 `https://`。
4. URL 变化后，确认旧文件进入 `/etc/openclash/provider-cache-backup/<时间-进程号>/`，并且只删除了对应 Provider 的缓存。
5. 若本地覆写使用了非标准结构，先对照 `OPERATIONS.md` 的 `[YAML]` → `proxy-providers` → Provider → `url` 层级；不要通过扩大删除范围来绕过解析失败。

真实 URL、Provider 节点内容和认证字段都只保留在 R2S 本地，不上传 GitHub。不要采用“每次重启都删除整个 Provider 缓存”的方式，因为机场暂时不可达时会降低启动可靠性。

实现自动守卫时要注意官方覆写顺序：`[Overwrite]` 与 `[YAML]` 都在 OpenClash 自身 YAML 处理之后运行，但第二阶段中 `[Overwrite]` 先执行、随后才合并 `[YAML]`。因此独立的缓存守卫 `[Overwrite]` 不应读取运行时 YAML 来期待看到 `local-airport.txt` 的新 URL，而应直接读取 R2S 本地私密 `local-airport.txt`，只计算 URL 指纹并决定是否删除对应缓存。

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
