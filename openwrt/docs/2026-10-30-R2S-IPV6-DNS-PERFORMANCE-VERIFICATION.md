# 2026-10-30 R2S / OpenClash IPv6、DNS 与性能体检记录

> **性质：一次性实机检测快照，不是当前配置副本。** 数据来自当日用户提供的 R2S SSH 命令、Mac mini 终端与 Metacubexd 截图。运行值、IP 前缀、端口、进程、版本可能变化；下次维护必须重新从实机读取。为避免将家庭公网/组网细节放入 Public GitHub，地址仅保留必要前缀或通用示例，**不记录完整动态公网地址、真实机场地址和凭据**。

## 结论 / 此轮停止验证

- **已验证**：R2S PPPoE 上 IPv6 自动协商、DHCPv6 的公网 IPv6 与 /60 PD、LAN /64 分配；带源前缀的 IPv6 默认路由；Mac 通过 IPv6 访问外网；OpenClash IPv6 Fake-IP 响应；国外 IPv6 TCP 进入 Mihomo 并走机场节点；国内网站获取真实 AAAA、HTTPS 200 且中国 IPv6 绕过规则有命中；OpenClash nftables/TUN/IPv4 fwmark 策略路由；国内低延迟；CPU/内存/温度无明显空闲瓶颈。
- **DNS 证据有限但积极**：WAN 53 端口抓包中观察到解析 `doh.pub` 的明文引导查询，发给配置的阿里/腾讯 DNS；测试窗口未观察到普通网站域名被明文发往运营商 DNS。不能推论“零 DNS 泄漏”，DoH/DoT/故障场景均未全面审计。
- **性能未定论**：Cloudflare/Google 部分 IP 的 ICMP 丢包或延迟偏高；路由器自身 ICMP 被 OpenClash 打标，不能把这些 Ping 结果等同于裸 PPPoE 的国际链路丢包，也未做满载吞吐和 bufferbloat 测试。
- **本次实机变更仅 Docker 服务**：用户执行 `/etc/init.d/dockerd stop` 和 `disable`，之后 `enabled` 返回退出码 1；OpenClash 进程仍在，国内 Ping 正常。Docker/OpenList 包仍安装；未执行卸载或磁盘清理。
- **处理决定**：结束本轮验证；维持 IPv6、DNS、Fake-IP、Mix、TUN、路由和防火墙配置；后续如需清理闲置服务或调速，另起单项有回滚方案的任务。

## 1. 当日环境（运行快照）

| 层级 | 已观察事实 |
| --- | --- |
| 主路由 | NanoPi R2S，ImmortalWrt 25.12.1（终端欢迎信息） |
| WAN | PPPoE；IPv4 为运营商私有 `10.0.0.0/8` 范围地址（存在 CGNAT 特征，公网入站需另测）；PPPoE MTU 1492 |
| IPv6 | `network.wan.ipv6=auto`；动态 `wan_6` 为 `up=true`；获得全球单播 IPv6、运营商 /60 PD，LAN 使用其中 /64。测试中前缀发生过变化，非长期固定值 |
| OpenClash | 实际进程运行 `/etc/openclash/openclash_by_jax_v6.1.yaml`；**不是**仓库 `openclash/` 里正式双机场 IPv6 YAML 的文件名；不得用本报告替代两者差异核查 |
| 网络代理 | `proxy_mode=rule`、`en_mode=fake-ip-mix`、`ipv6_mode=3`、`ipv6_enable=1`、`ipv6_dns=1`、`china_ip6_route=1`、`router_self_proxy=1`，均为当日 UCI 输出 |
| Fake-IP | IPv4 `198.18.0.1/16`、IPv6 `fdfe:dcba:9876::1/64`（本地测试值，不是公网地址） |
| DNS | dnsmasq 监听 :53；Mihomo DNS 监听 :7874；WAN 入站 `REJECT`、转发 `DROP`；不因监听公网地址就断言公网可访问 |
| 其它服务 | ZeroTier 仍在使用，**不得因清理无用包而删除**；Docker 与 OpenList 软件包仍安装 |

## 2. IPv6、分流和 DNS 证据

1. R2S `ifstatus wan_6` 返回 `up=true`，/60 PD 分配给 LAN /64；`uci -q get network.wan.ipv6` 返回 `auto`，`uci show network.wan6` 不存在符合动态接口语义；**不要擅自新增 WAN6**。
2. `ip -6 route get <公网目标>` 在未指定源地址时曾返回 `Network unreachable`；分别指定实际 WAN 与 LAN IPv6 源地址后均返回 `via fe80::... dev pppoe-wan`。这是带 `from` 条件路由的表现，不能仅凭无源查询失败判定 IPv6 断网。
3. R2S 对 Cloudflare IPv6 的 Ping 4/4 与 10/10 成功；Mac 使用运营商分配的 LAN /64 源地址 Ping 同一目标 4/4 成功；这些结果只证明所测 ICMPv6 路径。
4. Mac `dig @192.168.1.1` 对国外域名返回 IPv6 Fake-IP，例如 `fdfe:dcba:9876::...`；Mac 路由该目的地址经局域网网关。关闭 Mac Clash Verge TUN 后，国外网站查询仍呈现代理出口地址；Metacubexd 随后捕获 `speed.cloudflare.com:443` 的 IPv6 `Redir(tcp)`，命中 `MATCH`，最终走 B 机场日本节点。**仅验证这一实际请求，不意味着全部国外流量都已验证**。
5. 百度/Bilibili 的 AAAA 查询返回真实中国公网 IPv6，Mac `curl -6` 均返回 HTTP 200；Metacubexd 搜索未见连接，符合 nftables 提前绕过的可能性。中国 IPv6 地址集合 `@china_ip6_route` 在 `openclash_mangle_v6` 中累计计数从 5692 增至 6055，证明有流量命中，但**不能将全部增量归因于两次网站测试**。
6. 当日生效 YAML 的 `dns`：`enable=true`、`ipv6=true`、`enhanced-mode=fake-ip`、`respect-rules=true`；国外默认 `1.1.1.1/8.8.8.8` 的 DoH（带 `#RULES`）；中国域名、DIRECT 与节点服务器解析使用国内 DoH；引导 `default-nameserver` 为 `223.5.5.5`、`119.29.29.29`；无 `fallback`。
7. WAN `tcpdump` 的 UDP/TCP 53 端口检测仅在所给日志片段内观察到对 `doh.pub` 的 A/AAAA 明文引导解析，目标为 `119.29.29.29` 与 `223.5.5.5`。专门监听杭州移动四个当时下发的 DNS IP:53 的测试窗口没有匹配输出。PPPoE 上显示的 `UNSUPPORTED` 是抓包解码表现，不是“连接失败”证据。**这些测试不能覆盖加密 DNS、应用私有 DNS 或 OpenClash 故障回退**。
8. dnsmasq `noresolv=0` 且 `resolv-file` 指向自动生成的接口 DNS 文件；文件含当时运营商 IPv4/IPv6 DNS。说明有候选上游配置，**不能据此证明已经外发**，也不能凭当次零匹配保证故障时不会使用。暂不擅自修改 `noresolv`、DNS 重定向或删运营商 DNS。

## 3. 防火墙、性能与路由诊断

| 检查 | 当日证据 | 解释 / 边界 |
| --- | --- | --- |
| WAN 防火墙 | `input=REJECT`、`forward=DROP`；筛选输出未发现 WAN 放行 53/7874 的专门规则 | 未发现明显公网 DNS 开放配置；外网连通探测未做 |
| IPv6 TUN / 透明代理 | `utun` IPv6 转发、`openclash_v6` 链计数非零 | 规则确实在处理流量，**不等于所有命中都使用机场** |
| CPU / 内存 / 温度 | 单次 `top` 约 70% CPU idle；温度约 49.1°C；可用内存约 586 MiB | 空闲状态健康，未验证高负载下单核/softirq 饱和 |
| 存储 | overlay 使用约 20%；`/rom` 100% 为只读固件正常情况 | `/opt/docker` 为独立约 20GB 挂载，未清理 |
| 网卡 | eth0 `rx_dropped` 14741→14761，增 20；pppoe-wan `rx_dropped` 6041→6041；`rx_errors` 与 `rx_missed_errors` 均 0；eth0 `ethtool` CRC/FIFO/overflow/missed 为 0 | 累计 dropped 不能直接当公网业务丢包，需按增量和业务症状判断 |
| 连接跟踪 | 1290 / 62976 | 当次未接近上限 |
| Flow Offloading | 两项 UCI 读取无值 | 未显式配置；不能仅据此证明运行时是否启用，保持现状 |
| 国内 Ping | `223.5.5.5` 约 6.55–6.72ms / 0%；`119.29.29.29` 约 8.78ms / 0% | 国内基础连通良好 |
| 境外 Ping | `1.1.1.1` 20%、23%、20% 丢包（不同小样本），约 37–46ms；`1.0.0.1` 197.5ms / 5%；`8.8.8.8` 41.3ms / 5%；Cloudflare IPv6 约 215ms / 0% | 目标、Anycast、ICMP 策略与代理接管可影响结果；不据此定性裸 ISP 质量 |
| HTTPS | R2S 上访问 `www.cloudflare.com` 5/5 HTTP 200，总耗时约 0.66–0.90s | `router_self_proxy=1`，连接耗时可能包含本机透明代理，**不能当原生出口 RTT** |
| Traceroute | ICMP 国内第 1–5 跳部分可见，国外 UDP/ICMP 多跳 `* * *` | 不能单凭星号断定丢包或境外 ISP 故障 |
| IPv4 策略路由 | 普通 `ip route get` → `pppoe-wan`；带 `mark 0x162` → `utun`、table 354；ICMP 标记计数 Ping 前后 80→85，恰与发送 5 包相符 | **已证实路由器自身 ICMP 请求被 OpenClash 打标**，故 Ping 不能视为裸 PPPoE 基线 |

## 4. Docker / OpenList 清理状态

- 当日 `docker ps -a` 为空；已执行 `/etc/init.d/dockerd stop` 和 `disable`，`enabled` 检查退出码为 1。之后 OpenClash 进程仍可见，国内 Ping 4/4 成功。**尚未用停用后的 pgrep 再次确认 dockerd/containerd 两进程完全退出**。
- 已安装包包括 `docker`、`dockerd`、`docker-compose`、`containerd`、`luci-app-dockerman`、中文语言包，以及 `openlist`、`luci-app-openlist`、中文语言包。**未执行 `apk del`，未完成卸载预演，OpenList 运行/自启状态未完成复核**。
- `/opt/docker` 独立分区和 `docker0` 残留仅为观察到的状态，不是立即删除或格式化的理由。
- 如后续清理：先查进程、配置/数据与依赖 → 停止并禁用服务 → `apk del --simulate` 审核影响 → 经明确授权再卸载 → 验证 OpenClash、LAN/WAN、ZeroTier、DNS。不要删除实际在用的 ZeroTier 或共享网络依赖。

## 5. 下次只有出现问题才继续

1. 业务实际卡顿时，用同时间窗口比较有线客户端的国内、原生国际、代理国际 TCP/UDP 吞吐与满载延迟；记录 CPU 单核、softirq、温度、节点与线路，不再靠单目标 Ping 调参。
2. DNS 安全若需更严格结论：测试 DNS 上游 IP/端口、DoH 路由、应用私有 DNS；特别注意 OpenClash 关闭或重启时 dnsmasq 的回退行为，先有回滚再改。
3. 对长期运行的 Docker/OpenList 清理，可另开任务执行依赖模拟和受控卸载；未提供模拟结果前不实际删除。
4. Flow Offloading、SQM、MTU、IRQ 和 Packet Steering 不做无对照的“全开式”优化。
5. **任何新对话重新采集实机运行值**；本报告不代表当前最新状态，也不代表 GitHub 正式 IPv6 YAML 已与本地运行文件同步。
