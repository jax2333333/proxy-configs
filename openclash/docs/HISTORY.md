# OpenClash 历史与已验证结论

> 本文件只记录历史。**不能把这里的旧版本、旧软件版本、旧测速结果直接当成当前状态。** 当前事实必须重新读取 `main` 最新 YAML 和最新 Debug 日志。

## 1. 配置演进

### V5.1

- Apple 默认策略改为直连。
- 增加 Apple Intelligence / Apple Relay 规则集。
- Apple Intelligence 不单独新建策略组，统一交给 `🍎 Apple`。
- `push.apple.com` / APNs 高优先级直连。
- 修复 `apple-relay.cloudflare.com` 等可能掉入 MATCH 的问题。

### V5.2

- 增加 `Airport2` 正式 Provider 占位骨架。
- `Airport1` / `Airport2` 分别添加 `A1｜` / `A2｜` 节点名前缀。
- 真实机场 URL 继续只由 R2S 本地 `local-airport.txt` 覆写。

这一版同时解决了历史错误：本地只新增 `Airport2.url` 时，Mihomo 报 `has unset fields: type`。长期结论是：**新 Provider 必须先在 GitHub 正式 YAML 中有完整骨架，本地覆写才只写 URL。**

### V5.3

- 增加 `Airport3` 占位骨架。
- `Airport3` 节点统一前缀为 `网上搜刮|`。

### V5.4

- `Airport1` 只进入原有主智能、地区手动和地区故障转移。
- `Airport2` / `Airport3` 不再加入这些主分组。
- 新增 `♻️ 备用智能选择`，只使用 `Airport2` / `Airport3`。
- `🌐 全部节点` 仍包含所有 Provider。
- `🔮 节点选择` 增加 `♻️ 备用智能选择` 选项；其它功能组不直接增加该选项。

### V5.5

- Steam 国内下载规则源从 `jax2333333/ios_rule_script` 的 classical `SteamCN.yaml` 改为 MetaCubeX `steam@cn.mrs`。
- `steam_cn` 因此统一复用 `domain` MRS anchor，减少一个单独的 classical rule-provider 类型。
- MetaCubeX 的 `steam@cn` 本身已合并 `ios_rule_script/SteamCN` 数据，因此不再重复维护等价规则源。
- ZeroTier 直连规则从所有 `DST-PORT 9993` 收窄为 `NETWORK=UDP + DST-PORT=9993`，避免无关 TCP 9993 被高优先级直连。

这一版之前做过一次 `ios_rule_script` 与当前 MetaCubeX 规则源交叉审计，形成的长期维护结论是：**OpenClash 路由器端继续以 MetaCubeX MRS 规则为主；`ios_rule_script` 用于规则来源核对或补充没有等价 MRS 的专项规则，不为了“规则更多”重复叠加大型 classical 规则集。**

### V5.6

- 最新 Debug 确认“绕过中国大陆 IP”启用后，OpenClash 会在运行时向 Fake-IP Filter 自动加入 `rule-set:oc-cn-domain`，并指向 MetaCubeX `cn.mrs`。
- 实测 `nslookup whoami.akamai.net 127.0.0.1` 返回国内递归解析器地址而非 Fake-IP，确认 DNS / IP 泄漏检测域名仍会被 `cn.mrs` / `oc-cn-domain` 误分类。
- 不关闭“绕过中国大陆 IP”，也不整体移除 CN Fake-IP Filter；改为给 `browserleaks.com`、`browserleaks.net`、`whoami.akamai.net`、`whatismyip.akamai.com`、`surfshark.com` 设置海外 DoH 精确优先策略，并在 `cn_domain` 前强制走 `🔮 节点选择`。
- 最新 Debug 还捕获到目标为 Apple `17.x.x.x` 的 UDP 流量在无法恢复域名时落入 `🐟 漏网之鱼`，因此补充 `IP-CIDR,17.0.0.0/8,🍎 Apple,no-resolve`。
- Smart 分组过滤差异按用户明确意图保持不变：仅 `♻️ 智能选择` 与 `♻️ 日本智能` 保留 `免费|0.01` 排除，不自动统一其它 Smart 组。

后续版本请直接读 YAML 头部注释和 Git 历史，不在本文件假定某个版本号仍是最新版。

## 2. DNS Strict 历史验证

早期版本曾让默认 `nameserver` 使用国内 DoH，导致代理出口在日本，但 DNSLeakTest 仍主要显示中国移动 / 阿里等解析器。虽然这不一定是明文 UDP 53 泄漏，但不符合“境外域名不交给国内 DNS”的严格目标。

后续 DNS Strict 方案改为：

- 境外默认：Cloudflare / Google 等海外加密 DNS，并遵守规则。
- `cn_domain`：国内 DoH。
- `proxy-server-nameserver`：国内 DoH，解决节点 bootstrap / 死循环风险。
- DIRECT：国内 DoH。
- 不依赖 fallback 做境外分流。

历史验证结果：

- DNSLeakTest Extended：出口为日本，DNS 不再出现中国移动 / 阿里，主要为 Google 等海外解析器。
- ipleak：DNS 只看到 Cloudflare Tokyo / Google Japan 等海外解析器。
- WebRTC 未暴露本地真实地址。
- 当时没有观察到本地公网 IPv6 泄漏。

长期结论：**DNS 已有经过验证的稳定基线，没有新的证据时不要大改 DNS。**

## 3. BrowserLeaks 误分类事件

曾出现 BrowserLeaks 显示中国移动公网地址，而其它泄漏测试显示日本代理出口。日志证明：

```text
browserleaks.com:443 match RuleSet(cn_domain) using 🚀 直连
```

最初修复是在 `cn_domain` 之前加入：

```yaml
- DOMAIN-SUFFIX,browserleaks.com,🔮 节点选择
```

这解决了 BrowserLeaks 网页连接本身的误直连，但 2026-09-04 的运行时体检进一步确认：OpenClash 的 `oc-cn-domain` 仍会让 `whoami.akamai.net` 等泄漏检测后端进入 CN Fake-IP Filter / 国内解析路径。因此 V5.6 又增加了海外 DoH 精确策略与一组高优先级检测域名代理规则。

长期结论：**泄漏测试异常先区分“网页流量错误直连”和“DNS 检测后端被 CN 规则误分类”两层问题，不要把所有现象都归到 DNS，也不要为了单个域名拆掉整个 CN/Fake-IP 架构。**

## 4. IPv6 历史

曾经系统存在公网 IPv6，而 OpenClash IPv6 代理 / DNS 关闭，这会留下绕过代理的风险。之后关闭了公网 IPv6 出口，只保留必要的链路本地 / ZeroTier IPv6。

在后续 ipleak 中出现过日本代理出口 IPv6，但浏览器默认仍走代理 IPv4，系统没有公网 IPv6 默认 WAN 路由。该现象被判断为代理出口侧 IPv6 能力，不是本地 ISP IPv6 泄漏。

长期结论：**判断 IPv6 泄漏必须同时看系统路由、浏览器默认地址、OpenClash IPv6 设置，不能只看测试页是否显示一个 IPv6。**

## 5. R2S 性能 A/B 历史

当时在相近节点和相同测试文件上做过多轮对比：

- OpenClash 完整 Fake-IP TUN 的 Ookla 下载约 50 Mbps 左右，后续不同轮次也出现约 80 Mbps。
- Mac Clash Verge 同类测试约 300+ Mbps。
- R2S 直接使用 Mihomo 显式代理端口（mixed-port）进行 4 并发下载，约 340 Mbps。
- OpenClash Fake-IP Mix 4 并发约 227 Mbps；Ookla 约 193 Mbps。
- Fake-IP Mix + gVisor / Mixed、以及 Fake-IP 非 TUN 的多次 Ookla大致处于 175–200 Mbps 区间。
- 测速期间 R2S CPU 大量空闲，Mihomo 显式代理能达到 300+ Mbps，因此当时主要瓶颈不在 CPU、DNS 或机场上，而在完整透明 TUN 数据路径及架构开销。

安装并加载 `kmod-nft-tproxy` 后，完整 TUN 某轮测试从约 52 Mbps 提升到约 82 Mbps，但线路波动较大，不能把全部提升严格归因于单一包。

当时验证的平衡建议是：**Fake-IP 混合 + Mixed 栈**。但 OpenClash 官方对不同固件/Docker 场景有自己的兼容建议，因此后续每次性能问题都应结合当前日志和实际 A/B，不要直接照搬历史结果。

## 6. 依赖历史

历史 Debug 曾发现 fw4 环境缺少 `kmod-nft-tproxy`，随后已通过 LuCI 软件包安装并确认模块加载：`nft_tproxy`、`nf_tproxy_ipv4`、`nf_tproxy_ipv6`、`tun` 等存在。

长期结论：

- fw4 的非 TUN / Fake-IP 透明代理需要 `kmod-nft-tproxy`。
- TUN / Mix 还需要 `kmod-tun`。
- 若未来重装固件，不能因为历史上“装过”就假定仍存在，要从最新 Debug 日志重新确认。

## 7. YAML `off` 解析坑

历史上 `find-process-mode: off` 在 OpenClash 的 Ruby/Psych YAML 处理链中被 YAML 1.1 语义解释成布尔值，导致启动配置异常。修复为：

```yaml
find-process-mode: 'off'
```

长期结论：修改类似 `on/off/yes/no` 这类标量时，要考虑 OpenClash 的 YAML 解析链，不要随意去掉安全引号。

## 8. 配置订阅源迁移

曾长期使用一个 Gist Raw 地址作为 R2S 配置订阅。后来正式配置已经迁移到 `jax2333333/proxy-configs/main/openclash/`，但 R2S 仍指向旧 Gist，造成“GitHub 已是新版本，路由器更新后仍是旧版本”。

长期结论：OpenClash 的正式订阅源是仓库 Raw：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v5.yaml
```

## 9. Hysteria2 未完成问题

最近一次对话中，用户反馈 Hysteria2 节点测速没有速度。最新 Debug 已能看到 Hysteria2 相关节点域名正常解析，且该日志片段中没有 `quic-go` / `GSO` / `timeout` / `handshake` 错误，因此仍不足以确认根因，也不应仅凭测速为 0 就修改 GitHub 配置或开启“禁用 quic-go GSO”。

下一次继续时：

1. 使用发生故障当时的最新 Debug / Core Logs。
2. 检查 Hysteria2 实际节点参数和 QUIC / UDP 路径。
3. 若日志出现 `quic-go` / `GSO` / `timeout` / handshake 类问题，再按官方指南评估“禁用 quic-go GSO”。
4. 不要仅凭“测速为 0”就认定是机场或当前策略组代码错误。
