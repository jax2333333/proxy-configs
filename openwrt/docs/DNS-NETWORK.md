# DNS、DHCP 与网络链路

## 1. 先画清楚 DNS 链

不要把“DNS”当成单个服务。可能存在：

```text
客户端
→ dnsmasq
→ OpenClash / Mihomo DNS
→ 国内 / 海外上游
→ 代理或直连出口
```

也可能额外存在：

- odhcpd；
- Unbound；
- AdGuard Home；
- DoH / DoT / DoQ；
- VPN 自带 DNS。

每增加一层，都要检查监听端口、上游方向、缓存和回环。

## 2. dnsmasq / odhcpd

通常：

- dnsmasq 负责 DHCP / DNS 缓存与转发；
- odhcpd 负责 IPv6 RA / DHCPv6 等功能。

实际职责以当前配置和软件包为准。

检查：

```sh
uci show dhcp
ss -lntup 2>/dev/null | grep -E '(:53|:67|:68|:547)\b'
logread -e dnsmasq
```

## 3. 避免 DNS 端口冲突和回环

典型问题：

- dnsmasq 和 AdGuard Home 同时抢 53；
- dnsmasq 上游指向 OpenClash，而 OpenClash 又指回 dnsmasq；
- DoH 客户端监听和代理 DNS 监听重复；
- 节点域名只能经代理解析，导致 OpenClash 启动死循环。

排障先列出：

```sh
ss -lntup
uci show dhcp
```

再看 OpenClash 当前 DNS 配置。

## 4. OpenClash / Fake-IP 联动

涉及 OpenClash 时，必须从当前 YAML确认：

- `enhanced-mode`；
- Fake-IP 范围；
- `nameserver`；
- `proxy-server-nameserver`；
- `nameserver-policy`；
- `respect-rules`；
- DIRECT / CN 域名的 DNS 路径。

`198.18.x.x` 一类地址可能是 Fake-IP，不应单独判定为 DNS 泄漏或异常。

节点域名解析必须能在代理建立前工作，避免“DNS 需要代理、代理又需要 DNS”的闭环。

## 5. DNS 泄漏判断

至少区分：

- 客户端系统 DNS；
- 路由器上游 DNS；
- OpenClash 代理 DNS；
- 浏览器 Secure DNS；
- IPv6 DNS。

所谓“泄漏”必须结合期望路由判断，不能仅凭看到某个 DNS 服务商名字就下结论。

## 6. IPv6

当前用户偏好：IPv6 默认关闭。

未来若启用：

- 同时检查 WAN6；
- RA / DHCPv6；
- DNS；
- OpenClash IPv6 支持；
- 规则；
- IPv6 出口 IP；
- WebRTC / 浏览器泄漏；
- VPN / Overlay 网络。

不要只在一个页面打开 IPv6 开关。

## 7. DHCP / 静态租约

修改前先看：

```sh
uci show dhcp
cat /tmp/dhcp.leases 2>/dev/null
```

静态租约用于服务器、NAS、打印机等固定管理需求；不要为普通客户端无意义地全部固定 IP。

## 8. VLAN / DSA

现代 OpenWrt 设备常用 DSA，但实际 target / 版本可能不同。

配置 VLAN 前先确认：

- `ubus call system board`
- `ip -d link`
- `uci show network`
- LuCI 当前设备/桥结构

不要照搬旧 `swconfig` 教程到 DSA 设备。

## 9. 网络分层排障

顺序：

1. 网线 / PHY / link；
2. IP / route；
3. WAN 获取 / PPPoE；
4. NAT / firewall；
5. DNS；
6. OpenClash / VPN；
7. 应用。

能 ping IP 不能解析域名，优先看 DNS；连网关都不通，不要先改 DNS。
