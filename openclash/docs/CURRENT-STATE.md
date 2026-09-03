# 当前状态说明

> 本文用于快速理解当前 OpenClash 设计。**真正的正式配置永远是 `main` 分支的 `openclash/openclash_by_jax_v5.yaml`。** 若本文与 YAML 不一致，以 YAML 为准并更新本文。

## 1. 项目边界

- 设备侧：R2S / ImmortalWrt / OpenClash / Mihomo。
- 仓库侧：`jax2333333/proxy-configs`。
- OpenClash 只维护 `openclash/`。
- 除非用户明确说“同步更新三套配置”，否则不能联动修改 Clash Verge / Shadowrocket。
- 软件版本、内核版本、LuCI 选项实际值会变化；遇到问题时从最新 Debug 日志读取，不在这里写死。

## 2. 配置来源关系

正式 YAML：

```text
openclash/openclash_by_jax_v5.yaml
```

R2S 订阅源：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v5.yaml
```

本地私密覆写：`local-airport.txt`。它只保存真实订阅 URL，并通过 `[YAML]` 深度合并覆盖 GitHub 中的 Provider 占位 URL。

旧 Gist 不是正式源。

## 3. Provider 设计

当前正式 YAML 定义三个 Provider，GitHub 中均使用占位 URL：

- `Airport1`：主机场，节点名前缀 `A1｜`。
- `Airport2`：备用机场，节点名前缀 `A2｜`。
- `Airport3`：搜刮来源，节点名前缀 `网上搜刮|`。

当前策略隔离原则：

- 主智能选择、香港/日本/狮城/美国智能、地区手动组和地区故障转移只使用 `Airport1`。
- `♻️ 备用智能选择` 只使用 `Airport2`、`Airport3`。
- `🌐 全部节点` 使用所有 Provider。
- `🔮 节点选择` 可以选择 `♻️ 备用智能选择`。
- 其它功能策略组不直接增加 `♻️ 备用智能选择`；如果功能组通过 `🔮 节点选择` 间接选到备用组，这是正常的嵌套行为。

未来若 Provider 数量或名称变化，先修改正式 YAML，再同步更新本文；不要反过来根据本文覆盖 YAML。

## 4. DNS / Fake-IP 设计

当前正式 YAML 的长期设计目标：

- `ipv6: false`。
- `dns.enhanced-mode: fake-ip`。
- Fake-IP 范围保持 `198.18.0.1/16`，除非有明确兼容性原因。
- `respect-rules: true`。
- 默认境外解析使用海外加密 DNS，并显式遵守路由规则。
- `cn_domain` 使用国内 DoH，保证国内 CDN 与低延迟。
- `direct-nameserver` 使用国内 DoH。
- `proxy-server-nameserver` 使用国内 DoH，避免代理节点域名解析形成启动死循环。
- `private_domain`、`cn_domain` 等保留在 Fake-IP 过滤逻辑中。

这一套 DNS Strict 思路曾通过 DNSLeakTest / ipleak 验证，历史结果见 `HISTORY.md`。后续不要为了单个域名问题一次性改动多个 DNS 层。

## 5. 应用与规则语义

当前配置保留独立策略语义：

- `🤖 AI`
- `📺 YouTuBe`
- `✈️ Telegram`
- `🐙 GitHub`
- `🍎 Apple`
- `💻 Microsoft`
- `☁️ OneDriver`
- `🎬 NETFLIX`
- `🎵 TikTok`
- `🎮 Steam 商店`
- `📥 Steam 下载`
- `🐟 漏网之鱼`

长期规则：

- Apple 默认直连，但保留手动代理选择；Apple Intelligence / Relay 交给 `🍎 Apple`。
- `push.apple.com` 高优先级直连。
- Steam 国内下载 CDN 与商店规则分离。
- ZeroTier 9993 直连。
- `browserleaks.com` 在中国大陆规则之前强制走 `🔮 节点选择`，防止 `cn_domain` 误分类直连。
- 广告规则集进入全局拦截。

## 6. Smart 设计

当前 YAML 使用 Mihomo Smart 策略组。是否启用 LightGBM、采集数据、容差、测速地址等参数必须读取当前 YAML，不在本文锁死。

主智能选择通常排除“免费 / 0.01”类明显低质量节点。备用智能选择主要用于 Airport2 / Airport3，不要无意把它们混回主地区组。

## 7. 运行模式与性能

GitHub YAML 不完全决定 OpenClash 的透明代理运行模式；部分运行模式、TUN 栈、DNS 劫持和流量控制由 LuCI/UCI 在启动时处理。

历史 A/B 测试显示，在当时的 R2S 环境里：完整 Fake-IP TUN 路径明显慢于 Mix / 非 TUN，而显式代理端口可以达到更高吞吐。最后验证过的平衡方案是 Fake-IP 混合 + Mixed 栈；但这属于**历史验证基线，不等于现在路由器实际正在使用的值**。实际状态必须从最新 Debug 日志或 LuCI 读取。

## 8. IPv6

历史上曾发现“系统公网 IPv6 开启 + OpenClash IPv6 代理关闭”会形成绕过风险，因此随后关闭了公网 IPv6 出口。后续如果要重新启用 IPv6，必须重新检查：

- WAN/LAN 是否获得公网 IPv6。
- OpenClash IPv6 代理和 DNS 设置。
- 默认 IPv6 路由。
- ipleak / WebRTC / DNS 泄漏结果。

代理出口侧出现日本/海外 IPv6 不等于本地 ISP IPv6 泄漏，要结合浏览器默认地址和系统路由判断。

## 9. 尚未完成的问题

Hysteria2 节点曾出现“测速无速度”的现象，目前没有确认根因。下一次继续处理时不要先改配置，先获取最新 OpenClash Debug 日志，再检查 QUIC/GSO、UDP 路径、节点参数和核心错误。详细流程见 `TROUBLESHOOTING.md`。
