# 当前状态 / Current State

> 本文件只记录长期有效的架构与维护状态。**动态值不以此文件为权威。**

## 当前场景

- 主路由硬件：NanoPi R2S。
- 系统：ImmortalWrt 系。
- 代理层：OpenClash / Mihomo。
- 无线：由独立 AP 承担，R2S 路由性能与 Wi‑Fi 性能需要分层诊断。
- GitHub：
  - OpenWrt / ImmortalWrt 运维知识：`openwrt/`
  - OpenClash 正式 YAML：`openclash/`
  - `main` 为唯一正式版本。

## R2S 静态硬件特征

R2S 基于 Rockchip RK3328：

- 四核 Cortex-A53；
- 1 GB DDR4；
- 双千兆网口；
- 一个网口走 SoC GMAC，另一个为 USB 3.0 转千兆网卡路径。

因此优化时不能只看“总 CPU 占用”，还要关注：

- 单核是否打满；
- `softirq`；
- 网卡 IRQ / RPS；
- USB 网卡路径；
- 温度与降频；
- OpenClash / Mihomo 单进程负载。

## 当前长期网络偏好

- 稳定性和低延迟优先于单次跑分。
- DNS 泄漏风险优先处理。
- IPv6 默认保持关闭，除非用户明确要求启用并重新做完整泄漏/兼容性验证。
- OpenClash 常用 Fake-IP / TUN 体系；具体值以 `openclash/` 当前 YAML 为准。
- 优化必须先测基线，单项改动，复测后决定保留或回滚。

## 2026-10-11 IPv6 实机观测（区别于长期默认策略）

- 2026-10-11 的 R2S 实机输出显示：PPPoE WAN 和 LAN 已有公网 IPv6 地址/前缀；带源地址限制的 IPv6 默认路由在显式指定 WAN、LAN 源地址时可匹配到 PPPoE 出口。
- Mac mini 默认访问百度、QQ、B站时连接目标均为 IPv6；其中百度通过 R2S `pppoe-wan` 抓包已确认双向 TCP 443 原生 IPv6 直连。国外 `v6.ident.me` 当次日志命中 OpenClash 日本代理节点。
- 以上为**特定时间、特定站点的实测快照**，不代表全部 IPv6 流量规则、DNS/WebRTC/IP 泄漏已完成全面验收；不同于“默认希望关闭 IPv6”的长期偏好，亦**不等于 GitHub 正式 OpenClash YAML 已启用 IPv6**。
- 详细证据和复测边界：[HISTORY.md](./HISTORY.md)；可复用排查步骤：[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)。实际状态必须每次从 R2S 重新读取。

## 当前已完成

已建立 OpenWrt / ImmortalWrt 专用知识体系，覆盖：

- 系统与 UCI 基础运维；
- 网络、DHCP、DNS；
- Firewall4 / nftables 认知；
- Packet Steering、IRQ / irqbalance；
- Software / Hardware Flow Offloading；
- SQM / CAKE / bufferbloat；
- MTU / MSS；
- OpenClash 联动；
- Wi‑Fi 与主路由分层；
- 安全、备份、升级；
- 存储 / Docker 基础；
- 常见故障与体检流程。

## 当前没有写入 GitHub 的内容

以下内容故意不写死：

- 当前 ImmortalWrt 版本 / 内核；
- 当前包管理器；
- WAN/LAN 真实接口名与 MTU；
- PPPoE 账号；
- DNS 真实运行端口；
- 当前安装服务/插件；
- OpenClash 运行时端口；
- DDNS / VPN / ZeroTier / Tailscale 凭据；
- `/etc/config/*` 的完整实机副本。

需要这些值时，从 R2S 实机读取。

## 后续维护方向

1. 每次全面体检后，把“长期有效且已验证”的结论更新到本文件。
2. 一次性故障、旧版本问题、已淘汰做法放 `HISTORY.md`。
3. 可复用命令与步骤放 `OPERATIONS.md` / `TROUBLESHOOTING.md`。
4. OpenClash 配置值继续只在 `openclash/` 维护。
5. 如果未来需要 Git 管理 `/etc/config/*`，先设计脱敏模板和恢复机制，不直接上传实机完整配置。
