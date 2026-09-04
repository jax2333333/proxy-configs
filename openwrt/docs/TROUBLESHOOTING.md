# OpenWrt / ImmortalWrt 故障排查

## 总原则

不要先“重启所有服务”或“恢复出厂”。按层定位：

```text
电源 / 温度
→ 网线 / PHY
→ 接口 / IP
→ WAN / PPPoE
→ 路由 / NAT
→ Firewall
→ DNS
→ OpenClash / VPN
→ 应用
```

## 1. 完全不能上网

先看：

```sh
ip -br link
ip -br addr
ip route
ubus call network.interface dump
logread | tail -200
```

然后区分：

- WAN 没地址；
- 默认路由缺失；
- PPPoE 失败；
- 防火墙；
- DNS；
- OpenClash。

## 2. 能 ping IP，不能打开域名

```sh
nslookup openwrt.org 127.0.0.1
uci show dhcp
ss -lntup 2>/dev/null | grep ':53'
logread -e dnsmasq
```

OpenClash 开启时继续检查其 DNS 链，不直接把上游 DNS 全换掉。

## 3. 裸路由快，OpenClash 慢

检查：

```sh
top
cat /proc/softirqs
cat /proc/interrupts
```

再比较：

- 节点速度；
- 单核 mihomo CPU；
- TUN / 透明代理；
- UDP / QUIC；
- Flow Offloading；
- DNS；
- 温度。

不要先改 MTU / sysctl。

## 4. 下载满载后全家延迟暴涨

典型 bufferbloat。

步骤：

1. 记录空闲 ping；
2. 记录下载 / 上传满载 ping；
3. 测稳定峰值带宽；
4. 评估 SQM / CAKE；
5. SQM 起始整形值约峰值 90% 附近；
6. 关闭硬件 Flow Offloading；
7. 逐步调节并复测。

## 5. 网速只有约 100 Mbps

先查链路：

```sh
ip -br link
ethtool <实际接口>
```

重点排除：

- 网线；
- 交换机 / 光猫端口；
- 只协商 100 Mbps；
- USB 网卡异常；
- 供电；
- 驱动日志。

## 6. CPU 很高

区分：

- 用户进程；
- `ksoftirqd`;
- mihomo；
- Docker；
- irq；
- 温度降频。

命令：

```sh
top
cat /proc/softirqs
cat /proc/interrupts
dmesg | tail -100
```

## 7. DNS 偶发卡死

重点找：

- 53 端口冲突；
- dnsmasq / AdGuard / OpenClash 回环；
- 上游 DoH 超时；
- 节点域名解析死循环；
- IPv6 DNS 残留；
- 浏览器 Secure DNS 绕过。

## 8. 修改 Flow Offloading 后代理异常

立即做 A/B：

1. 记录当前值；
2. 关闭 Flow Offloading；
3. 重启 firewall；
4. 复测代理 / DNS / UDP；
5. 若恢复正常，先保留关闭状态，再分析兼容性。

不要为了 Speedtest 强行保留有路由语义副作用的卸载。

## 9. SQM 开启后速度明显下降

检查：

- 整形速率是否过低；
- 绑定接口是否正确；
- CPU 是否打满；
- CAKE 参数是否过复杂；
- 是否错误启用硬件 Flow Offloading；
- OpenClash 是否额外消耗 CPU。

## 10. 磁盘 / overlay 满

```sh
df -h
du -h -d 1 /overlay 2>/dev/null | sort -h
du -h -d 1 /tmp 2>/dev/null | sort -h
```

不要直接删除未知文件。先定位日志、Docker、缓存或包占用。

## 11. 输入日志路径后出现 Permission denied

例如：

```sh
/tmp/openclash_debug.log
```

Shell 会把它当“程序”执行，因此可能返回 `Permission denied`。

读取日志应使用：

```sh
cat /tmp/openclash_debug.log
less /tmp/openclash_debug.log
tail -200 /tmp/openclash_debug.log
```

只有确定它是脚本且有正确 shebang / 权限时才执行。

## 12. 修改后无法进 LuCI / SSH

优先：

- 保持当前 SSH 会话不要退出；
- 检查 LAN 地址、路由和 firewall；
- 用 `uci changes` 查看未提交改动；
- 有明确回滚值时恢复；
- 必要时使用 failsafe / 串口恢复。

不要在没有备份和恢复路径时批量改 network + firewall。

## 13. 故障信息最小采集模板

```sh
echo '=== release ==='
cat /etc/openwrt_release 2>/dev/null
ubus call system board
uname -a

echo '=== resources ==='
uptime
free
df -h

echo '=== network ==='
ip -br link
ip -br addr
ip route
ubus call network.interface dump

echo '=== cpu ==='
cat /proc/interrupts
cat /proc/softirqs

echo '=== logs ==='
logread | tail -200
dmesg | tail -200
```

提交到 GitHub / 聊天前先脱敏。
