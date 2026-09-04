# 性能、加速与延迟优化

## 核心原则

“加速”不是一个开关。先确定瓶颈：

```text
物理链路
→ 网卡协商 / USB NIC
→ WAN / PPPoE
→ NAT / Firewall
→ CPU / softirq
→ OpenClash / Mihomo
→ DNS
→ SQM / QoS
→ Wi‑Fi / 客户端
```

每次只改变一个变量，并保存修改前后的数据。

## 1. Packet Steering

现代多核 OpenWrt 设备通常值得测试 Packet Steering。它通过软件把网络包处理分散到多个 CPU。

适合先测试的场景：

- 路由转发时单核 softirq 高；
- 总 CPU 不满但单核打满；
- 千兆转发无法跑满。

不要只看“是否开启”，要比较：

- 吞吐；
- 满载延迟；
- 每核负载；
- `/proc/softirqs`；
- `/proc/interrupts`。

R2S 为四核 Cortex-A53，Packet Steering 是优先候选，但仍以实测结果为准。

## 2. IRQ / irqbalance / RPS

先看：

```sh
cat /proc/interrupts
cat /proc/softirqs
```

再判断是否有单 IRQ / 单核异常集中。

`irqbalance` 是自动方案，但不是必然更快。ARM SoC、USB 网卡、透明代理等场景可能需要手动 affinity；只有已经测到 IRQ 瓶颈才做手工绑定。

不要复制其它设备的 IRQ 编号，因为 IRQ 会随内核、驱动和启动变化。

## 3. Software Flow Offloading

软件 Flow Offloading 通过减少 established flow 经过完整 Netfilter 路径的成本来提高吞吐并降低 CPU 压力。

使用原则：

- 适合作为裸路由 / NAT 性能优化候选；
- 与 OpenClash / 策略路由 / 透明代理同时使用时必须实测；
- 发生代理绕过、规则异常、UDP 异常时，先关闭 Flow Offloading 对比；
- 不把“能跑满”作为唯一指标，同时看延迟和规则正确性。

## 4. Hardware Flow Offloading

只有在 **当前 SoC、驱动和发行版明确支持** 时考虑。

风险：

- 可能绕过部分 CPU 网络处理；
- 与 SQM / QoS 不兼容；
- 可能影响复杂策略路由、透明代理、统计或过滤链。

对 R2S 不假设存在可用硬件卸载；先以当前系统能力为准。

## 5. SQM / CAKE / Bufferbloat

SQM 的目标是控制队列延迟，而不是把峰值带宽数字做大。

典型起点：

- qdisc：CAKE；
- script：`piece_of_cake.qos`；
- 上下行整形从实测稳定峰值约 90% 附近开始；
- 根据满载延迟与吞吐逐步调高或调低。

重要兼容性：

- 硬件 Flow Offloading 与 SQM 不兼容；
- OpenWrt 文档说明软件 Flow Offloading 可以与 SQM 共存；
- 但在 OpenClash / 透明代理环境仍必须做实际链路测试。

如果开启 SQM 后速度下降：

1. 看 CPU 是否满；
2. 看单核 / softirq；
3. 确认整形接口；
4. 确认上下行填写单位和值；
5. 临时关闭 OpenClash 对比；
6. 不先堆高级 CAKE 参数。

## 6. MTU / MSS

不要用固定值“优化所有线路”。

先确认：

- WAN 类型；
- PPPoE / DHCP；
- 当前接口 MTU；
- 路径 MTU；
- 是否存在 VPN / 隧道。

PPPoE 等封装可能降低有效 MTU，但实际值必须从当前链路判断。出现特定网站打不开、TLS 卡住、上传异常时才重点检查 MTU / MSS。

不要在普通千兆家庭网络随意启用 Jumbo Frame。

## 7. OpenClash 性能

代理开启后速度下降，按顺序看：

1. 节点自身速度 / 延迟；
2. Mihomo CPU 是否单核打满；
3. `softirq`；
4. TUN stack / 透明代理模式；
5. UDP / QUIC；
6. DNS 是否超时；
7. Flow Offloading 是否冲突；
8. 规则是否导致错误绕路；
9. 温度 / 降频。

不要用修改 TCP sysctl 掩盖节点或代理瓶颈。

## 8. DNS 与“网页打开速度”

DNS 优化不能只追求最低 ping。

关注：

- 是否命中正确区域；
- 是否泄漏；
- 是否出现回环；
- 缓存是否重复；
- 节点域名是否能在代理启动前解析；
- DoH/DoT 本身是否绕远。

DNS 慢与下载带宽慢是不同问题。

## 9. 不推荐的“万能优化”

默认不采用：

- 来源不明的一键加速脚本；
- 不理解用途的大批 sysctl；
- 任意放大 conntrack；
- 无条件开启 BBR / qdisc 组合；
- 同时开启多个 QoS/SQM；
- 同时改 IRQ、MTU、Flow Offload、DNS 再测速；
- 为追求 Speedtest 关闭防火墙或代理安全链。

## 10. 评价标准

保留优化的条件：

- 吞吐确有提升，或
- 满载延迟明显下降，或
- CPU / softirq 明显改善，且
- DNS / 防火墙 / OpenClash 路由语义没有被破坏。

否则回滚。
