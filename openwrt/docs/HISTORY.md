# 历史 / Research Baseline

> 本文件只记录时间点和历史结论。**不得把这里的版本号当成当前最新版。**

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
