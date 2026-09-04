# JAX OpenWrt / ImmortalWrt 运维知识库

> [!IMPORTANT]
> ## 🚨 新对话 / ChatGPT 快速接管
> **给新 ChatGPT：** 仓库 `jax2333333/proxy-configs`，分支 `main`。这是 `openwrt/` 子项目。先读本 README，再按 `openwrt/docs/KNOWLEDGE-INDEX.md` 读取维护规则、当前状态和任务相关文档。**修改前必须重新读取 `main`；动态系统值必须从 R2S 实机读取；禁止把任何密码、Token、私钥或认证信息写入 GitHub。**

## 项目目标

本子项目用于长期维护 JAX 的 OpenWrt / ImmortalWrt 主路由运维知识，重点服务当前 **NanoPi R2S + ImmortalWrt + OpenClash** 场景。

目标：

- 新对话无需重新解释背景即可快速接管 R2S 主路由运维。
- 把“当前正式状态、历史、操作教程、ChatGPT 工作规则”严格分开。
- 任何优化都遵守：**先测基线 → 单项修改 → 复测 → 保留或回滚**。
- 网络性能、DNS、OpenClash、SQM、Flow Offloading、IRQ、Packet Steering 等按整条数据路径联合判断。
- 动态值不写死在总提示词里；版本、接口、端口、服务、包管理器等必须从 `main` 当前配置或 R2S 实机重新读取。
- 所有变更可验证、可回滚，不使用来源不明的“一键优化脚本”。

## 当前架构边界

```text
Internet
   │
   ▼
R2S / ImmortalWrt
   ├─ 路由 / NAT / Firewall
   ├─ DHCP / DNS
   ├─ OpenClash / Mihomo
   └─ 其它路由服务
   │
   ▼
独立 AP / LAN 设备
```

- R2S 负责主路由；无线 AP 与路由性能应分层排查。
- OpenClash 的正式 YAML 仍由 `openclash/` 子项目维护，本子项目不复制或覆盖它。
- OpenWrt / ImmortalWrt 的运行时配置目前不把整份 `/etc/config/*` 直接镜像到 Public GitHub；需要修改时先从实机读取当前值并脱敏。
- R2S 硬件为 RK3328 四核 Cortex-A53、1 GB RAM、双千兆网口，其中一口通过 USB 3.0 转千兆网卡；性能判断要考虑 CPU、softirq、USB 网卡路径和散热。

## 当前正式资料

| 类型 | 权威文件 |
| --- | --- |
| 当前状态 | `docs/CURRENT-STATE.md` |
| ChatGPT 工作规则 | `docs/CHATGPT-MAINTENANCE-PROMPT.md` |
| 任务知识地图 | `docs/KNOWLEDGE-INDEX.md` |
| 日常操作 / 体检 / 备份 | `docs/OPERATIONS.md` |
| 性能 / 加速 / SQM | `docs/PERFORMANCE-OPTIMIZATION.md` |
| DNS / DHCP / 网络 | `docs/DNS-NETWORK.md` |
| 安全 | `docs/SECURITY.md` |
| 故障排查 | `docs/TROUBLESHOOTING.md` |
| 历史与日期基线 | `docs/HISTORY.md` |
| 官方参考 | `docs/REFERENCES.md` |

> **注意：** 本知识库不是 R2S 当前运行配置的副本。实际版本、接口名、端口、服务、插件和 UCI 值，以 R2S 实机与 GitHub `main` 的对应正式配置为准。

## 长期运维原则

1. **先观察，后修改。** 先采集系统、网络、CPU、IRQ、日志和基线测速。
2. **一次只改一个变量。** Packet Steering、Flow Offloading、SQM、IRQ affinity、MTU 等不要一起盲开。
3. **透明代理是额外变量。** OpenClash / Mihomo 可能改变转发、DNS、UDP、TUN、策略路由路径，不能直接套用裸 OpenWrt 加速模板。
4. **DNS 以完整链路判断。** 客户端 → dnsmasq/odhcpd → OpenClash/其它解析器 → 上游 DNS → 代理出口。
5. **Wi‑Fi 与路由分层。** 先用有线客户端验证 R2S，再判断独立 AP 的无线问题。
6. **SQM 是延迟治理，不是单纯提速。** 优先解决 bufferbloat；吞吐可能下降是正常代价。
7. **Flow Offloading 以兼容性为前提。** 软件卸载优先测试；硬件卸载只有确认平台支持且不与 SQM/策略链冲突时才考虑。
8. **不盲目调 sysctl。** 所有参数必须能解释作用、适用条件、风险和回滚方式。
9. **升级前备份。** 大版本升级尤其要核对设备 target、保留包、第三方插件和配置迁移风险。
10. **GitHub `main` 是唯一正式知识版本。** 聊天、截图、旧 commit、旧教程只作参考。

## 安全红线

Public GitHub 禁止写入：

- 密码、Cookie、Token、API Key
- SSH / WireGuard / Tailscale 等私钥或 Secret
- 验证码、Authorization Header
- 真实机场订阅、节点认证信息
- 私人 DDNS / VPN / Cloudflare 凭据
- 其它私人认证信息

私网地址、接口名等若只是运行时信息，也不要为了方便长期写死；仅在确有维护价值且已确认不含认证信息时记录。

## 常用操作关键词

以后可以直接对新 ChatGPT 说：

- `OpenWrt 全面体检`
- `OpenWrt 加速优化`
- `OpenWrt DNS 体检`
- `OpenWrt 网络排障`
- `OpenWrt SQM 调优`
- `OpenWrt Flow Offloading 调优`
- `OpenWrt Wi‑Fi 优化`
- `OpenWrt 安全体检`
- `OpenWrt 升级检查`
- `OpenWrt 存储优化`
- `OpenWrt OpenClash 联动体检`
- `R2S 性能全面体检`
