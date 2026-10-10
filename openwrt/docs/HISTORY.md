# 历史 / Research Baseline

> 本文件只记录时间点和历史结论。**不得把这里的版本号当成当前最新版。**

## 2026-10-11 — 原生 IPv6 与 OpenClash 国内外分流实测

> **历史实测快照**：依据当日 Mac mini、R2S 终端命令与 WAN 抓包。仅记录已观察到的现象，不将临时 IPv6 地址、接口名或代理节点当作长期固定配置。本次没有修改系统网络、防火墙或 OpenClash YAML。

### 已验证的事实

1. **Mac mini 访问国内网站**：默认（未强制地址族）的 `curl --noproxy '*'` 对百度、QQ、B站均选中 IPv6 目标；百度和 B站返回 HTTP 200；QQ 返回 HTTP 501，表示收到 HTTP 响应，不等同于 IPv6 连接失败。百度显式 `curl -6 --resolve` 固定目标 IPv6 再测返回 HTTP 200。
2. **R2S 原生 IPv6**：`pppoe-wan` 有公网 IPv6 地址，`br-lan` 有分配的公网 IPv6 网段；`ip -6 route show default` 存在带 `from <源前缀>` 约束、经 PPPoE 上游链路本地网关的 IPv6 默认路由。直接 `ip -6 route get <目标IPv6>` 曾得到 `Network unreachable`；分别加上 WAN 和 LAN 的真实源 IPv6 地址之后均返回经 `pppoe-wan` 的路由。**不能据无源地址的失败判断 IPv6 出口不存在。**
3. **策略路由**：实机 `ip -6 rule` 存在特定 `fwmark` 指向单独路由表，表内默认出口为 `utun`；这说明存在代理/TUN 分流路径，但**单看路由表不能确定某条连接进入代理**。
4. **国内 IPv6 直连证据**：R2S 在 `pppoe-wan` 上对百度目标 IPv6 抓包，捕获到 LAN 客户端公网 IPv6 与百度服务器 IPv6 之间的双向 TCP 443 报文（握手、TLS ClientHello/SNI 可识别 `www.baidu.com`）；对应 Mac mini `curl` 返回 HTTP 200。抓包统计为 **20 captured、32 received by filter、0 dropped by kernel**。精简版 tcpdump 显示 `UNSUPPORTED` 和十六进制，仍可辨认 IPv6/TCP 与通信方向；该提示不能当作链路失败。本次 **百度连接确实经 R2S 原生 IPv6 WAN 出口直接通信，而非经远端代理节点中转**。
5. **国外 IPv6 分流**：此前 `v6.ident.me:443` 的 OpenClash 日志命中日本代理节点，说明该次国外 IPv6 连接受代理规则处理。
6. **日志缺失的边界**：对百度、QQ、B站执行 `grep` OpenClash 普通日志没有匹配行，**单独无法证明直连**；应结合指定目标地址和同次 WAN 抓包判断。`ifstatus wan6` 返回接口不存在亦不能推断 IPv6 被禁用：当时 PPPoE WAN 本身已获 IPv6。

### 结论与未验证范围

- **已确认**：此次测试中的百度 IPv6 为 R2S 原生 PPPoE WAN 直连；国外 `v6.ident.me` 在单次日志中由日本代理处理；WAN/LAN 源地址指定的 IPv6 出口路由存在。
- **未确认**：QQ 和 B站各自是否始终 DIRECT；所有中国域名/IPv6 地址的分流；所有境外 IPv6 的代理规则；DNS、WebRTC、各终端及其他 IPv6 泄漏情形。
- **注意**：长期策略仍为“IPv6 默认关闭，启用需额外验收”，但 **2026-10-11 实机确实观察到 IPv6 已启用**。这是现场状态与默认策略的区别；不在此次文档记录中擅自关闭或开启 IPv6。
- 复核方法见 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) 的“IPv6 国内外分流检查”。


## 2026-09-04 — OpenWrt / ImmortalWrt 知识库建立

本次整理建立 `openwrt/` 子项目，将以下内容与 OpenClash 配置分离：

- OpenWrt / ImmortalWrt 基础运维；
- R2S 性能体检；
- Packet Steering / IRQ；
- Software / Hardware Flow Offloading；
- SQM / CAKE；
- DNS / DHCP / Firewall；
- OpenClash 联动；
- 安全 / 升级 / 存储；
- 故障排查。

### 当日外部资料基线

当日核对 OpenWrt 官方资料时：

- OpenWrt 稳定系列为 25.12，官方版本历史页列出的当前服务版本为 25.12.5；
- 25.12 系列从 `opkg` 转为 `apk`；
- Attended Sysupgrade 在 25.12 新装系统中默认集成；
- 官方 SQM 文档建议先测基线，并指出硬件 Flow Offloading 与 SQM 不兼容；软件 Flow Offloading 可与 SQM 共存；
- 官方性能文档把 Packet Steering、IRQ / RPS、Flow Offloading 分成不同优化层。

这些是 **2026-09-04 的研究背景**。用户实际运行 ImmortalWrt 时，未来每次都必须重新读取实机版本与发行说明。

## R2S 硬件基线

FriendlyELEC 官方资料确认 NanoPi R2S：

- RK3328；
- Quad-core Cortex-A53；
- 1 GB DDR4；
- 双千兆以太网，其中一个通过 USB 3.0 转千兆网卡。

因此早期聊天中若出现“R2S 双核”等说法，应视为错误历史信息，不再采用。

## 已废弃的维护思路

以下做法不再作为默认方案：

- 所有“加速开关”一次全开；
- 不测基线直接调 sysctl；
- 把 OpenClash 性能问题简单归因于 OpenWrt NAT；
- 把 Fake-IP 地址直接判定为 DNS 泄漏；
- 不区分 R2S 路由瓶颈与独立 AP Wi‑Fi 瓶颈；
- 从旧聊天复制接口名、端口、版本或 IRQ 编号。
