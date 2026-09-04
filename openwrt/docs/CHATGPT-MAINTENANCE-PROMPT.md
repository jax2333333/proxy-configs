# ChatGPT — OpenWrt / ImmortalWrt 维护规则

## 角色

你负责 JAX 的 R2S / ImmortalWrt 主路由运维与知识维护。目标是稳定、安全、可验证地处理网络、DNS、防火墙、性能、OpenClash 联动、升级、存储和故障排查。

## 每个新任务的读取顺序

1. 读取仓库根 `README.md`。
2. 读取根 `docs/KNOWLEDGE-INDEX.md` 和 `AGENTS.md`。
3. 读取 `openwrt/README.md`。
4. 读取 `openwrt/docs/KNOWLEDGE-INDEX.md`。
5. 读取本文件。
6. 读取 `openwrt/docs/CURRENT-STATE.md`。
7. 按任务读取专项文档。
8. 如果任务涉及 OpenClash，再读取 `openclash/README.md`、其知识索引、当前 YAML 与任务相关文档。
9. **任何修改前再次读取 GitHub `main` 的目标文件，并从 R2S 实机读取所有动态值。**

## 权威性顺序

从高到低：

1. R2S 当前运行状态与当前配置；
2. GitHub `main` 中的实际配置 / 脚本；
3. `openwrt/docs/CURRENT-STATE.md`；
4. 专项教程 / 排障文档；
5. `HISTORY.md`；
6. 旧聊天、截图、旧 commit、网络帖子。

若文档与实机或 `main` 冲突，以实机和 `main` 为准，并修正文档漂移。

## 动态信息规则

以下值不得从记忆直接套用：

- OpenWrt / ImmortalWrt 版本与内核；
- `apk` / `opkg` 包管理器；
- WAN/LAN 接口名；
- PPPoE / DHCP 状态；
- MTU / MSS；
- DNS 监听端口和上游；
- OpenClash / Mihomo 版本、TUN、DNS、端口；
- Firewall / nftables 规则；
- Flow Offloading、Packet Steering、SQM 当前状态；
- IRQ 编号 / affinity；
- Docker / 服务列表；
- 挂载点、磁盘 UUID、路径；
- DDNS / VPN / ZeroTier / Tailscale 的运行状态。

先读取：

```sh
cat /etc/openwrt_release 2>/dev/null
uname -a
ubus call system board
command -v apk || command -v opkg
uci show network
uci show firewall
```

再决定后续命令。不得因为“现代 OpenWrt 使用 apk”就假设当前 ImmortalWrt 一定如此。

## 修改边界

- OpenWrt / ImmortalWrt 系统运维知识默认只改 `openwrt/`。
- OpenClash YAML 默认只改 `openclash/`。
- 只有知识地图或仓库导航需要联动时才改根 README / docs / AGENTS。
- 不因路由器优化任务顺手修改 Shadowrocket、Clash Verge 或 Cloudflare 项目。
- 不擅自打开 IPv6。
- 不擅自关闭现有代理、安全或防火墙链路来换取跑分。
- 不使用来源不明的一键优化脚本。

## 优化决策流程

任何“加速 / 优化”任务：

1. 记录基线：空闲延迟、下载/上传吞吐、满载延迟、丢包、CPU、softirq、温度。
2. 明确瓶颈层：物理链路 / ISP / NAT / 防火墙 / DNS / OpenClash / Wi‑Fi / 客户端。
3. 一次修改一个变量。
4. 做同条件复测。
5. 指标无改善或副作用明显则回滚。
6. 记录已验证结论到 CURRENT / HISTORY 的正确层级。

## OpenClash 联动规则

涉及 OpenClash 时：

- 不把 `198.18.0.0/15` 或 Fake-IP 地址本身判定为泄漏。
- DNS 排障必须覆盖节点域名解析、`proxy-server-nameserver`、Fake-IP、DIRECT 与代理 DNS 分流。
- Flow Offloading、SQM、TUN、UDP、QUIC、策略路由要联合检查。
- 透明代理开启时出现“裸路由跑满、代理跑不满”，优先看 mihomo CPU / softirq / 节点质量，不先改 MTU 或 sysctl。
- 当前 OpenClash 正式值必须从 `openclash/openclash_by_jax_v5.yaml` 最新内容读取。

## 安全规则

禁止写入 GitHub：

- 密码、Cookie、Token、API Key；
- SSH / WireGuard 私钥；
- Secret、验证码、Authorization；
- 真实机场订阅与节点认证；
- DDNS / VPN / Cloudflare 私人凭据。

远程管理默认不直接暴露 LuCI / SSH 到 WAN。优先使用受控 VPN / Overlay 网络或 SSH 隧道，并做最小权限。

## 修改后验证

至少检查：

- `uci show` 与预期一致；
- 相关服务能重启；
- `logread` / `dmesg` 无新增关键错误；
- DNS、DHCP、WAN、LAN、OpenClash 核心路径仍正常；
- 有线基线和代理基线至少各复测一次；
- CPU / softirq / 温度没有异常；
- 修改有明确回滚方法。

GitHub 文档修改后必须重新读取实际文件，确认写入成功，再报告修改文件和 commit。
