# OpenWrt / ImmortalWrt 安全基线

## 1. WAN 管理面

默认不把以下服务直接开放公网：

- LuCI HTTP / HTTPS；
- SSH；
- Docker 管理端口；
- SMB / NFS；
- AdGuard Home 管理页；
- Transmission / qBittorrent 等管理页。

远程管理优先：

- WireGuard；
- Tailscale / ZeroTier 等受控 Overlay；
- SSH 隧道；
- 其它明确认证且最小暴露的方案。

## 2. SSH

建议：

- 强密码或 SSH Key；
- 限制 WAN 访问；
- 不上传私钥到 GitHub；
- 不在聊天最终汇报中完整复述密钥 / Token。

## 3. Firewall4 / nftables

现代 OpenWrt 使用 firewall4 / nftables；旧版 / 特殊 ImmortalWrt 必须先确认。

检查：

```sh
command -v fw4
fw4 print 2>/dev/null | head
nft list ruleset 2>/dev/null | head -100
uci show firewall
```

不要把旧 `iptables` 自定义脚本直接复制到 fw4 系统。自定义 nftables 也应避免与 fw4 自动生成规则冲突。

## 4. 端口转发

开放端口前确认：

- 是否真的需要公网；
- 服务是否有认证；
- 能否用 VPN 代替；
- 是否只需特定来源 IP；
- IPv4 和 IPv6 是否都会暴露。

UPnP 只在有明确需求时启用，并理解它允许内网设备动态申请端口映射。

## 5. 软件更新

升级前核对：

- 官方 / 可信固件源；
- 设备 target；
- 签名 / 校验；
- 第三方插件兼容；
- 备份；
- 回滚方案。

不要用未知来源固件或“一键升级”脚本覆盖主路由。

## 6. DNS 安全

加密 DNS 不等于匿名，也不等于不会泄漏。

要同时看：

- 请求从哪个接口出去；
- DIRECT / PROXY 分流；
- 浏览器 Secure DNS；
- IPv6；
- OpenClash 节点域名解析；
- 是否存在回退到 ISP DNS。

## 7. GitHub 安全

Public 仓库严禁：

- Password
- Cookie
- Token / API Key
- Secret
- SSH / WireGuard 私钥
- Authorization Header
- 验证码
- 机场订阅 / 节点认证
- DDNS / VPN 私人认证信息

配置示例使用占位符，例如：

```text
<REDACTED>
<YOUR_TOKEN>
<LOCAL_ONLY>
```

## 8. 日志脱敏

提交日志前检查：

- 公网 IP；
- 域名是否包含私人标识；
- Token / query string；
- Authorization；
- 用户名；
- DDNS 地址；
- 节点订阅。

需要共享时只保留诊断所需字段。
