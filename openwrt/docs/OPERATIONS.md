# OpenWrt / ImmortalWrt 操作手册

## 1. 每次接管先做只读体检

先确认系统，不假设版本或包管理器：

```sh
cat /etc/openwrt_release 2>/dev/null
uname -a
ubus call system board
uptime
date
command -v apk || command -v opkg
```

资源：

```sh
free
df -h
mount
top -bn1 | head -40
cat /proc/loadavg
```

温度（路径存在时）：

```sh
for z in /sys/class/thermal/thermal_zone*/temp; do
  [ -r "$z" ] && echo "$z: $(cat "$z")"
done
```

网络：

```sh
ip -br link
ip -br addr
ip route
ubus call network.interface dump
uci show network
uci show dhcp
uci show firewall
```

CPU / IRQ：

```sh
cat /proc/interrupts
cat /proc/softirqs
grep -E 'processor|model name|BogoMIPS' /proc/cpuinfo
```

日志：

```sh
logread | tail -200
dmesg | tail -200
```

如果 OpenClash 相关，再进入 `openclash/` 的体检流程。

## 2. 性能基线

优先用有线客户端。

至少记录：

- 空闲 ping；
- 下载峰值；
- 上传峰值；
- 下载满载时延迟；
- 上传满载时延迟；
- 丢包；
- CPU 每核占用；
- softirq；
- 温度；
- 代理开启 / 关闭各一组。

局域网性能优先用 `iperf3`，互联网性能再用多个测速源。不要用单个 Speedtest 结果判断路由器瓶颈。

## 3. 网卡协商

如果系统有 `ethtool`：

```sh
ethtool eth0
ethtool eth1
```

重点：

- `Speed`
- `Duplex`
- `Link detected`
- 错包 / 丢包

接口名必须以实机 `ip -br link` 为准。

如果千兆设备只协商到 100 Mbps，先查网线、端口、供电和 PHY，不先改 OpenClash。

## 4. 配置备份

修改关键网络配置前：

```sh
sysupgrade -b /tmp/openwrt-backup.tar.gz
```

如果该命令在当前 ImmortalWrt 不可用，先停止并确认发行版对应备份方式。

同时建议导出关键 UCI：

```sh
uci export network
uci export dhcp
uci export firewall
```

含凭据的备份文件只保存在本地安全位置，不上传 Public GitHub。

## 5. 服务管理

通用模式：

```sh
/etc/init.d/<service> status
/etc/init.d/<service> restart
logread -e <service>
```

服务名必须先确认：

```sh
ls /etc/init.d/
```

不要从旧聊天写死服务列表。

## 6. 软件包操作

先判断：

```sh
command -v apk
command -v opkg
```

OpenWrt 新旧发行版的包管理器不同；ImmortalWrt 也必须按实际版本判断。

不要为了“更新系统”批量升级所有基础包。路由器大版本 / 内核相关升级优先走发行版正式固件升级流程，并先核对 target、第三方插件、配置兼容性和回滚方案。

## 7. 升级前检查

必须确认：

- 设备型号与 target/subtarget；
- 当前系统 / 内核；
- 可用空间；
- 第三方内核模块；
- OpenClash / Docker / VPN 等关键服务；
- 包管理器；
- 配置备份；
- 新版本已知问题；
- 是否支持保留配置升级。

大版本升级不要仅凭“版本更新”执行，先读对应发行说明。

## 8. 存储 / Docker

原则：

- Docker、下载器、数据库、高频日志尽量放外置存储。
- 内置 overlay 保留系统和轻量配置。
- 检查磁盘供电、文件系统、SMART（设备支持时）、挂载稳定性和剩余空间。
- 避免把大量临时写入放到闪存。
- extroot 修改前必须有可恢复启动介质和配置备份。

常用检查：

```sh
df -h
mount
block info 2>/dev/null
cat /etc/config/fstab 2>/dev/null
```

## 9. 修改后验收

每次修改至少：

```sh
logread | tail -100
dmesg | tail -100
ip -br link
ip route
```

然后验证：

- LAN 上网；
- DNS；
- OpenClash（如开启）；
- 下载 / 上传；
- 满载延迟；
- CPU / softirq；
- 温度。

指标没有明确改善，就不要为了“理论更优”保留修改。
