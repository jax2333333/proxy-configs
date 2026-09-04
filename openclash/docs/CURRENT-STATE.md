# 当前状态说明

> 本文用于快速理解当前 OpenClash 设计。**真正的正式配置永远是 `main` 分支的 `openclash/openclash_by_jax_v6.yaml`。** 若本文与 YAML 不一致，以 YAML 为准并更新本文。

## 1. 项目边界

- 设备侧：R2S / ImmortalWrt / OpenClash / Mihomo。
- 仓库侧：`jax2333333/proxy-configs`。
- OpenClash 只维护 `openclash/`。
- 除非用户明确说“同步更新三套配置”，否则不能联动修改 Clash Verge / Shadowrocket。
- 软件版本、内核版本、LuCI 选项实际值会变化；遇到问题时从最新 Debug 日志读取，不在这里写死。

## 2. 配置来源关系

正式 YAML：

```text
openclash/openclash_by_jax_v6.yaml
```

R2S 订阅源：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_v6.yaml
```

本地私密覆写：`local-airport.txt`。它只保存真实订阅 URL，并通过 `[YAML]` 深度合并覆盖 GitHub 中的 Provider 占位 URL。

旧 Gist 不是正式源。

## 3. Provider 设计

当前正式 YAML 定义两个 Provider，GitHub 中均使用占位 URL：

- `Airport-A`：主力机场，节点名前缀 `A|`。
- `Airport-B`：辅助机场，节点名前缀 `B|`。

当前策略隔离原则：

- 香港、日本、新加坡、美国、台湾、韩国、英国、德国均建立 A/B 独立 Smart 组和手动节点组。
- 每个 `A|地区智能/节点` 只使用 `Airport-A`；每个 `B|地区智能/节点` 只使用 `Airport-B`。
- `♻️智能选择` 是 16 个 A/B 地区 Smart 组的统一入口。
- `🌐 全部节点` 使用两个 Provider。
- 不再使用备用智能组或 fallback 故障转移组。
- `♻️AI智能选择` 只匹配非香港的七个地区；`🤖 AI` 不提供香港智能、香港手动节点、总智能或全部节点入口，避免间接选入香港出口。

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
- OpenClash 启用“绕过中国大陆 IP”后，运行时还会自动注入 `oc-cn-domain` 到 Fake-IP Filter；它同样使用 MetaCubeX `cn.mrs`。
- 因 `cn.mrs` 可能误收录 DNS / IP 泄漏检测域名，当前对 `browserleaks.com`、`browserleaks.net`、`whoami.akamai.net`、`whatismyip.akamai.com`、`surfshark.com` 设置海外 DoH 精确优先策略。不要为了这一问题关闭“绕过中国大陆 IP”或整体移除 CN Fake-IP Filter。

这一套 DNS Strict 思路曾通过 DNSLeakTest / ipleak 验证，历史结果见 `HISTORY.md`。后续不要为了单个域名问题一次性改动多个 DNS 层。

## 5. 应用与规则语义

当前配置保留独立策略语义：

- `🤖 AI`
- `📺 YouTube`
- `✈️ Telegram`
- `🐙 GitHub`
- `🍎 Apple`
- `💻 Microsoft`
- `☁️ OneDrive`
- `🎬 Netflix`
- `🎵 TikTok`
- `🎮 Steam`
- `🐟 漏网之鱼`

长期规则：

- Apple 默认直连，但保留手动代理选择；Apple Intelligence / Relay 交给 `🍎 Apple`。
- `push.apple.com` 高优先级直连。
- Apple 官方 IPv4 网段 `17.0.0.0/8` 交给 `🍎 Apple`，用于兜住无法恢复域名的纯 IP / QUIC 流量，避免掉入 `🐟 漏网之鱼`。
- Steam 国内下载 CDN 与商店仍由 `steam@cn.mrs` / `steam.mrs` 分别识别，但统一进入 `🎮 Steam`。
- ZeroTier 控制 / 打洞只对 **UDP 9993** 设置高优先级直连，不再无条件放行 TCP 9993。
- DNS / IP 泄漏检测域名在中国大陆规则之前强制走 `🔮 节点选择`，并配合 DNS `nameserver-policy` 使用海外 DoH，避免 `cn_domain` / `oc-cn-domain` 误分类导致国内解析器暴露。
- 广告规则集进入全局拦截。

### 规则源维护原则

- 路由器端主规则优先使用 MetaCubeX `meta-rules-dat` 的 MRS `domain` / `ipcidr` 规则集，减少重复来源和大型 classical 规则。
- `meta-rules-dat` 的部分分类本身已经合并 blackmatrix7 / `ios_rule_script` 数据，例如 `cn`、`onedrive`、`steam@cn`；存在等价 MRS 时，不重复叠加同类 classical 规则。
- `jax2333333/ios_rule_script` 可用于核对规则来源或补充 MetaCubeX 没有的专项规则，但不作为整套 OpenClash 规则的默认替代源。
- 不为了“规则更多”直接加入超大型 `AdvertisingLite`、`ChinaMaxNoIP` 或 Apple/Microsoft classical 大合集；如发生误分流，优先添加精确例外或选择更合适的专项 MRS。

## 6. Smart 设计

当前 YAML 使用 Mihomo Smart 策略组。是否启用 LightGBM、采集数据、容差、测速地址等参数必须读取当前 YAML，不在本文锁死。

V6 Smart 结构：

- 两个 Provider 在八个地区中完全分组，形成 16 个地区 Smart 组。
- 地区 Smart 组负责在单机场、单地区内自动选择；`♻️智能选择` 负责人工选择所需地区 Smart 入口。
- `♻️AI智能选择` 同时使用两个 Provider，但通过正向地区过滤和香港排除过滤限制候选节点。
- 所有 Smart 组继续排除明确免费、`0.01` 和 `x0.1` 低倍率节点；手动地区组仍保留完整候选以便诊断。
- `uselightgbm`、`collectdata`、`interval` 和 `tolerance` 的当前值必须直接读取 YAML。

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
