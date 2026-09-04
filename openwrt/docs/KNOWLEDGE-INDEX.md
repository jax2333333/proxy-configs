# OpenWrt / ImmortalWrt 知识地图

## 先读

任何 OpenWrt / ImmortalWrt 任务：

1. `openwrt/README.md`
2. `openwrt/docs/CHATGPT-MAINTENANCE-PROMPT.md`
3. `openwrt/docs/CURRENT-STATE.md`
4. 本文件指定的专项文档
5. 需要修改时读取 R2S 实机当前值
6. 涉及 OpenClash 时再进入 `openclash/`

## 资料类型边界

### 当前状态

- `CURRENT-STATE.md`

只记录长期架构、已验证状态和当前维护边界。动态版本、端口、接口、服务值不得凭此文件硬套。

### 操作教程

- `OPERATIONS.md`
- `PERFORMANCE-OPTIMIZATION.md`
- `DNS-NETWORK.md`
- `SECURITY.md`
- `TROUBLESHOOTING.md`

教程说明“怎么查、怎么判断、怎么改、怎么回滚”，不是当前运行配置。

### 历史

- `HISTORY.md`

仅解释过去的研究基线和已验证结论。历史版本号不能当“最新版”。

### ChatGPT 工作规则

- `CHATGPT-MAINTENANCE-PROMPT.md`

## 按任务读取

### OpenWrt 全面体检 / R2S 全面体检

读取：

- `CURRENT-STATE.md`
- `OPERATIONS.md`
- `PERFORMANCE-OPTIMIZATION.md`
- `DNS-NETWORK.md`
- `SECURITY.md`
- `TROUBLESHOOTING.md`

先采集状态，不直接改配置。

### OpenWrt 加速优化 / R2S 性能优化

读取：

- `PERFORMANCE-OPTIMIZATION.md`
- `OPERATIONS.md`
- `TROUBLESHOOTING.md`

重点按：链路协商 → CPU/softirq → Packet Steering → IRQ → Flow Offloading → OpenClash → MTU → SQM 的顺序定位。

### SQM / Bufferbloat

读取：

- `PERFORMANCE-OPTIMIZATION.md`
- `REFERENCES.md`

如果 OpenClash 开启，同时读取 `openclash/` 当前配置。不要与硬件 Flow Offloading 同时启用 SQM。

### Flow Offloading

读取：

- `PERFORMANCE-OPTIMIZATION.md`
- `CURRENT-STATE.md`
- `REFERENCES.md`

硬件卸载必须确认当前 SoC/驱动支持；OpenClash / 策略路由场景必须实测兼容性。

### DNS / DHCP / DNS 泄漏

读取：

- `DNS-NETWORK.md`
- `TROUBLESHOOTING.md`

涉及 OpenClash 再读取：

- `openclash/README.md`
- `openclash/docs/KNOWLEDGE-INDEX.md`
- 当前 OpenClash YAML
- OpenClash DNS 相关专项文档

### Firewall / nftables / 端口转发

读取：

- `SECURITY.md`
- `DNS-NETWORK.md`
- `REFERENCES.md`

现代 OpenWrt 通常是 firewall4 / nftables，但实际系统必须先确认，不能把旧 iptables 教程直接套用。

### Wi‑Fi / AP

先确认问题在 R2S 还是独立 AP。R2S 本身不承担无线 AP 时，不在 R2S 上做 Wi‑Fi 参数优化。

### 升级 / 软件包 / 插件

读取：

- `OPERATIONS.md`
- `SECURITY.md`
- `HISTORY.md`

先确认系统发行版、版本、target、内核和包管理器；不要假设 `apk` 或 `opkg`。

### 存储 / Docker / extroot / 磁盘

读取：

- `OPERATIONS.md`
- `TROUBLESHOOTING.md`

高写入数据优先放外置存储；关注供电、文件系统、挂载、SMART、日志写入和 overlay 空间。

### 故障排查

读取：

- `TROUBLESHOOTING.md`
- 对应专项文档

按：物理链路 → 接口 → WAN → 路由/NAT → 防火墙 → DNS → 代理 → 应用 的顺序排查。

### 历史原因 / 为什么这样设计

读取：

- `HISTORY.md`
- `REFERENCES.md`

历史结论在执行前必须重新回到当前实机验证。
