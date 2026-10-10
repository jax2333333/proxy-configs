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

## 14. IPv6 国内外分流检查（原生 WAN 还是 OpenClash 代理）

适用于“客户端显示 IPv6、`curl -6` 正常，但不确定实际经 WAN 直连还是被 TUN/透明代理接管”的情况。先只读排查，不立即关闭 IPv6、修改防火墙或重写 YAML。参考 2026-10-11 [历史实测](./HISTORY.md)。

**一、客户端检查地址族（示例为 Mac/Linux 的 curl）**

```sh
for site in www.baidu.com www.qq.com www.bilibili.com; do
  echo "=== $site / default ==="
  curl --noproxy '*' -sS -L --connect-timeout 8 --max-time 20 -o /dev/null \
    -w 'HTTP=%{http_code} IP=%{remote_ip}\n' "https://$site"
  echo "=== $site / IPv6 only ==="
  curl -6 --noproxy '*' -sS -L --connect-timeout 8 --max-time 20 -o /dev/null \
    -w 'HTTP=%{http_code} IP=%{remote_ip}\n' "https://$site"
done
```

`IP=` 出现冒号形式的地址表明目标 IPv6；`--noproxy '*'` 排除显式 HTTP(S) 代理，但**无法绕过系统 TUN、主路由透明代理**。HTTP 501 等状态需与 TCP/TLS 失败区分，不能仅看 HTTP 状态码判断 IPv6 不通。

**二、R2S 检查原生 IPv6 / 源地址路由**

```sh
ip -6 addr show scope global
ip -6 route show default
ip -6 route show table all
ip -6 rule show
ifstatus wan
ifstatus wan6  # 不存在不等于 IPv6 断网，检查 WAN 本身
```

若默认路由形式为 `default from <源前缀> via <网关> dev <WAN接口>`，无源地址的 `ip -6 route get <目标IPv6>` 可能报 `Network unreachable`；使用 **实机当时查出的** WAN、LAN 的 IPv6 源地址分别复查：

```sh
ip -6 route get <目标IPv6> from <WAN当前IPv6>
ip -6 route get <目标IPv6> from <LAN当前IPv6>
```

不要将示例占位符直接复制执行；公网地址、接口名、`fwmark`、路由表号都是动态值。若有 `fwmark -> TUN/utun`，表示某些流量**可能**进入代理，不能直接推断被测连接的实际路径。

**三、指定单个 IPv6 目标并核对 WAN 抓包**

1. 用 `command -v tcpdump` 检查抓包工具。未安装时，先确认 `command -v apk; command -v opkg` 与发行版，再考虑对应包；不要盲装或改软件源。
2. R2S 在实机确认的 WAN 接口上执行 `tcpdump -ni <WAN接口> -c 20 'ip6 and host <目标IPv6>'`；其中占位符替换为真实接口及测试地址。
3. 同时在客户端执行（目标必须是可访问的该网站 IPv6）：

```sh
curl -6 --noproxy '*' \
  --resolve 'www.baidu.com:443:[<百度实际IPv6>]' \
  --connect-timeout 8 --max-time 20 \
  -sS -o /dev/null -w 'HTTP=%{http_code} IP=%{remote_ip}\n' \
  https://www.baidu.com
```

4. 观察对应 IPv6 客户端 ↔ 目标 IPv6 的双向 TCP 流量和客户端返回码。仅见目标 IP 不够，须核对**方向、接口、连接时间及协议**。有匹配双向通信可证明**该次连接**原生 WAN 通信；无匹配数据需要排查接口、过滤地址、VPN/TUN、DNS 与时间窗口，不能立即断言走代理。
5. 某些精简版 tcpdump 可能以 `UNSUPPORTED` 显示链路层但附十六进制数据；可先确认报文中的 IPv6（以太类型 `86dd`）、TCP（下一头 `06`）、443 端口等，不将该提示当作抓包失败。

**四、交叉核对 OpenClash**

```sh
grep -Ei 'baidu.com|qq.com|bilibili.com|v6.ident.me' /tmp/openclash.log | tail -30
```

- 显示 `using DIRECT` 或具体代理节点时，仅说明对应日志事件；要核实是否同次连接。
- **没有匹配日志，不等于确认直连**，尤其是 IP 直连、绕过透明代理、日志未覆盖或日志轮换场景。
- 外网 IPv6 的日志命中代理节点不能替代对国内 IPv6 的 WAN 抓包；也不能替代 DNS / WebRTC / IP 泄漏测试。
- 不改正式 `openclash/` YAML；如需修改，重新读取其当前正式 YAML 并单独授权验证。

