# OpenClash 日常操作与恢复

本文记录“怎么做”，不作为当前配置副本。Provider、端口、组名等实际值以 `main` 最新 YAML 为准。

## 1. R2S 使用 GitHub 正式配置

OpenClash 配置订阅应按实际机场数量选择对应 Raw：

双机场：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_双机场.yaml
```

单机场：

```text
https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_单机场.yaml
```

LuCI 中进入：`服务 → OpenClash → 配置订阅`，确认订阅地址与当前所选模式一致，然后保存并更新配置。

旧 Gist 曾导致“GitHub 已更新但 R2S 仍拉到旧版本”。以后不把 Gist 当正式源。

## 2. 本地真实机场订阅

真实机场订阅地址不得写入 GitHub。R2S 使用运行状态页顶部的“覆写模块”创建/维护本地 `local-airport.txt`。

入口：`服务 → OpenClash → 运行状态 → 顶部「覆写模块」`。

覆写文件必须有段头，并且 Provider 键必须与所选正式 YAML 一致。

双机场模板：

```ini
[YAML]
proxy-providers:
  Airport-A:
    url: "真实订阅地址 1"

  Airport-B:
    url: "真实订阅地址 2"
```

单机场模板：

```ini
[YAML]
proxy-providers:
  Airport-A:
    url: "真实订阅地址"
```

真实 URL 只存在路由器本地。不要把这个文件原样上传仓库、Issue、公开聊天或截图。若切换单/双机场模式，必须同步检查本地 Provider 键与当前正式 YAML 是否一致，否则占位 URL 可能无法被正确覆盖。

## 3. 为什么本地只写 URL

GitHub 正式 YAML 已为每个 Provider 定义完整骨架，例如：

```yaml
AirportX:
  url: "https://example.com/airportX.yaml"
  type: http
  interval: 86400
  health-check:
    enable: true
    url: https://www.gstatic.com/generate_204
    interval: 300
```

OpenClash `[YAML]` 覆写会对 Hash 做深度合并，因此本地可以只覆盖 `url`，其余字段继续沿用 GitHub 正式配置。

**新增 Provider 的正确顺序：**

1. 先读取 GitHub `main` 最新 YAML。
2. 在 GitHub 正式 YAML 中增加完整 Provider 骨架，URL 使用占位地址。
3. 检查其策略组归属和节点前缀。
4. 提交并重新读取 GitHub 验证。
5. R2S 更新 GitHub 配置。
6. 最后在本地 `local-airport.txt` 只新增真实 URL。

如果反过来先在本地新增一个 GitHub 从未定义过的 Provider，而只写 `url`，Mihomo 会因为缺少 `type` 等必填字段而启动失败。这个问题历史上出现过：`parse proxy provider ... has unset fields: type`。

### 3.1 更换既有 Provider URL 时的缓存陷阱

2026-09-04 在 R2S 实机确认：修改 `local-airport.txt` 中既有 Provider 的真实订阅 URL 后，运行时 YAML 已成功得到新 URL，但节点仍可能继续来自旧 Provider 缓存。

原因不是订阅被写死在 GitHub，而是 OpenClash 会把 HTTP Provider 的 `path` 规范化为按 Provider 名固定的本地路径（例如 `./proxy_provider/<Provider名>.yaml`；不同版本运行时可能去掉扩展名），因此“同名 Provider 换 URL”仍可能复用 `/etc/openclash/proxy_provider/<Provider名>` 的旧文件。`health-check.interval` 只负责健康检查，不等同于重新下载订阅。

本次已验证的诊断链：

1. `/etc/openclash/config/<配置名>.yaml` 继续保留 GitHub 占位 URL 是正常现象；不要据此判断覆写失败。
2. 检查 `/etc/openclash/<配置名>.yaml` 的运行时 `proxy-providers`，确认本地覆写已进入运行配置；输出时必须脱敏 URL。
3. 直接从运行时 URL 下载到 `/tmp/<Provider>.fresh`，只比较 HTTP 状态、文件大小、节点数和 SHA256，不回显真实 URL 或节点认证信息。
4. 若新订阅 HTTP 200、YAML 可解析且 SHA256 与 `/etc/openclash/proxy_provider/<Provider>` 不同，即可确认旧 Provider 缓存未更新。
5. 修复时先备份旧缓存，再用新下载文件原位替换对应 Provider，重启 OpenClash；2026-09-04 已验证重启后新 SHA 保持不变，后台重新加载新节点。

不要为了这个问题修改 GitHub 中的占位 URL，也不要无脑删除整个 `proxy_provider/` 目录。

**已验证的长期方案：Provider URL 指纹守卫。** 仓库中的 `toolkit/scripts/provider-cache-guard.sh` 直接读取 R2S 本地 `local-airport.txt`，自动识别 `proxy-providers` 下的 Provider 和 URL，只把 `Provider 名<TAB>SHA256` 保存到 `/etc/openclash/provider-url-sha256`。这里的 SHA256 是根据 URL 计算的指纹；真实 URL 不写入状态文件，也不输出到日志。

守卫行为：

- 第一次运行：建立 URL 指纹，不删除任何缓存。
- URL 未变化：保留该 Provider 缓存。
- URL 变化：先把同名缓存备份到 `/etc/openclash/provider-cache-backup/<时间-进程号>/`，再只删除 `/etc/openclash/proxy_provider/` 下该 Provider 的无扩展名、`.yaml` 或 `.yml` 文件，最后更新指纹。
- URL 文件不可读、无法识别 Provider、缺少 SHA256 工具或备份失败：保留缓存；备份/删除失败时不更新该 Provider 指纹，供下次启动重试。
- 不使用通配符清理，也不删除整个 `proxy_provider/` 目录。

仓库文件与 R2S 部署路径：

| 仓库文件 | R2S 路径 |
|---|---|
| `openclash/toolkit/scripts/provider-cache-guard.sh` | `/etc/openclash/scripts/provider-cache-guard.sh` |
| `openclash/toolkit/scripts/openclash_custom_overwrite.sh` | `/etc/openclash/custom/openclash_custom_overwrite.sh` |

两个脚本部署后应设为 `0755`。`openclash_custom_overwrite.sh` 是最小启动钩子模板；若 R2S 的同名文件已有其它自定义逻辑，应先备份并只合并对 `/etc/openclash/scripts/provider-cache-guard.sh` 的调用，不能整文件覆盖。启动链路为：

```text
OpenClash restart
  → openclash_custom_overwrite.sh
  → provider-cache-guard.sh
  → 比较本地 Provider URL SHA256
  → 必要时备份并清理对应缓存
  → Mihomo 按运行时 Provider URL 加载或重新下载
```

2026-09-04 已在 R2S（ImmortalWrt + OpenClash + Mihomo Meta）验证上述启动链路、首次运行不清缓存、URL 不变保留缓存，以及 URL 变化后定向清理并重新下载节点。

注意 OpenClash 官方覆写执行顺序：`[Overwrite]` 与 `[YAML]` 都在 OpenClash 自身 `yml_change.sh` / `yml_rules_change.sh` 之后执行，但同一轮中 `[Overwrite]` 先于 `[YAML]`。因此缓存守卫若做成独立 `[Overwrite]` 模块，应直接读取本地私密文件 `/etc/openclash/overwrite/local-airport.txt` 的 URL 来计算指纹，而不能假设此时运行时 YAML 已经完成 `local-airport.txt` 的 `[YAML]` URL 合并。

## 4. GitHub 维护标准流程

任何 OpenClash 配置修改：

1. 根据当前运行模式重新读取 `main` 中的 `openclash/openclash_by_jax_双机场.yaml` 或 `openclash/openclash_by_jax_单机场.yaml`，不要用聊天旧副本。
2. 明确这次变更影响的 Provider / 策略组 / DNS / Rules。
3. 只做必要的最小修改。
4. 检查 YAML 语法、缩进、重复键、Provider/组/规则引用。
5. 检查所有机场 URL 仍是占位地址，无敏感信息。
6. 写入 GitHub。
7. **重新读取写后的文件**，确认真实结果。
8. 向用户报告改了哪些文件、验证结果和 commit。
9. R2S 手动/自动更新配置后，再观察 OpenClash 日志。

除非用户明确说“同步更新三套配置”，这个流程只操作 `openclash/`。

## 5. 从零恢复

路由器重装或 OpenClash 配置丢失时：

1. 安装 OpenClash/Mihomo 所需依赖；具体包和版本以 OpenClash 官方指南与当前固件为准，不照抄历史版本。
2. 在“配置订阅”添加与当前单/双机场模式对应的本仓库 Raw URL。
3. 更新配置，让占位 Provider YAML 下载到本地。
4. 在“运行状态 → 覆写模块”新建 `local-airport.txt`，第一行写 `[YAML]`，填入本地真实机场 URL。
5. 启用覆写模块并重启 OpenClash。
6. 检查 Provider 是否成功下载、策略组是否出现预期节点。
7. 生成 Debug 日志确认依赖、DNS、路由和防火墙没有异常。
8. 用 ipleak / DNSLeakTest 等检查 DNS、IPv4/IPv6、WebRTC；判断结果时区分代理出口 IPv6 与本地 ISP IPv6。

## 6. 更新后验证重点

双机场配置至少确认：

- `Airport-A` / `Airport-B` 均存在，节点前缀分别为 `A|` / `B|`。
- `A|智能选择` / `B|智能选择` 分别只使用对应 Provider。
- 香港、日本、台湾、美国、新加坡各有 A/B 地区 Smart，共 10 个地区 Smart。
- `🖐️ 手动选择` 与 `🛠️ 节点测速` 聚合两个 Provider。
- 不存在旧的 `♻️智能选择`、`♻️AI智能选择`、`🌐 全部节点` 或地区手动组引用。

单机场配置至少确认：

- 只有 `Airport-A`，不存在 `Airport-B` / `B|` 体系。
- 存在 `智能选择` 与香港、日本、台湾、美国、新加坡 5 个地区 Smart。
- `🖐️ 手动选择` 与 `🛠️ 节点测速` 只使用 `Airport-A`。

两套配置都要继续检查：

- `🤖 AI`、YouTube、Telegram、GitHub、Netflix、TikTok、Steam 等应用组引用均存在。
- DNS、Apple、Steam、ZeroTier、browserleaks 等现有规则未被无关改动。
- Provider URL 仍为占位值，仓库中没有真实订阅或其它凭据。
- 如果要求 AI 严格排除香港，不能只检查显式地区 Smart；还要检查未过滤的总 Smart 是否仍能选到香港节点。

## 7. 配置订阅更新异常

如果 GitHub 已经更新但 R2S 看不到最新版本：

- 先核对 GitHub `main` 中所选 YAML 的当前内容/提交，以及 R2S 配置订阅实际下载的文件是否一致。
- 检查 OpenClash“配置订阅”的地址是否仍是旧 Gist。
- 检查运行日志中的下载 URL、curl 错误和 `Config File Tested Faild` 等信息。
- 必要时生成 Debug 日志，不要反复覆盖配置碰运气。

## 8. 覆写模块规则

OpenClash 官方要求覆写模块至少包含 `[General]`、`[Overwrite]`、`[YAML]` 之一，否则整个文件会被跳过。普通静态 YAML 覆写优先使用 `[YAML]`；只有需要动态条件/循环时才考虑 `[Overwrite]`。

## 9. 双机场 IPv6 实验版（2026-10-11；尚未实机验收）

**角色与安全边界**

- 基于 GitHub `main` 的 `openclash_by_jax_双机场.yaml` 新建**独立实验文件** `openclash/openclash_by_jax_双机场_IPv6.yaml`，不替换默认 IPv4 正式版。
- Raw 地址：`https://raw.githubusercontent.com/jax2333333/proxy-configs/main/openclash/openclash_by_jax_双机场_IPv6.yaml`。
- 实验版仅与基线存在 3 项 YAML 差异：顶层 `ipv6: true`、`dns.ipv6: true`，以及 `dns.fake-ip-range6: fdfe:dcba:9876::1/64`。A/B Provider、Smart、DNS 分流、应用规则保留；Provider URL 在 GitHub 仍是占位值。
- **导入 YAML 不等于打开 R2S 全套 IPv6**。OpenClash 插件的 `ipv6_enable`（IPv6 代理）、`ipv6_dns`（AAAA 解析）、`fakeip_range6`（IPv6 Fake-IP）与运行时 YAML / IPv6 防火墙链需要一起核对。详见上游 `09-settings-dns-ac-ipv6.md` §9.5；不能把这份文件称为“已验证不会 IPv6 泄漏”。

**安全测试顺序（不要一次全部打开）**

1. 测试前在 `服务 → OpenClash → 配置管理` 记录当前正式配置文件，备份 LuCI 中当前可用配置与覆写状态，确认原双机场 IPv4 配置正常且随时可切回。
2. 在 `网络 → 接口` 核查 PPPoE 的 IPv6/WAN6 协商状态、IPv6 默认路由、运营商是否下发 IPv6-PD；没有实际可用的 IPv6 出站路径时，不要据此推断代理性能。建议**先只在 R2S 自身测试 WAN IPv6**，不向 LAN 设备广播 IPv6 RA/DHCPv6 或 IPv6 DNS，以免客户端绕过 IPv4 代理。
3. 通过 `服务 → OpenClash → 配置订阅` 新增独立的 IPv6 实验 Raw 订阅并更新，或通过 `服务 → OpenClash → 配置管理` 导入实验 YAML。注意：**配置管理“上传配置文件”可能自动选择新配置；“切换 / Switch”会重启核心**，操作前确认备份和回退通道。
4. **尤其注意本地机场覆写匹配**：现有 `local-airport.txt` 可能只匹配原配置的完整路径（如 `/etc/openclash/config/jax-双机场-GitHub.yaml`）。测试版实际源配置若是 `/etc/openclash/config/openclash_by_jax_双机场_IPv6.yaml`，应在覆写模块齿轮参数中改为**实验配置的完整实际路径**，或建立另一份仅匹配实验配置的本地覆写模块。不要为了方便无条件改为 `all`，否则切到单机场 YAML 时可能错误插入 `Airport-B`。真实 A/B URL 仅存在 R2S 本地；切勿公开显示或提交。
5. 在 `服务 → OpenClash → 插件设置 → IPv6` 核对 IPv6 代理选项，并核对允许 IPv6 DNS 解析及 Fake-IP v6 池；启用与否以阶段性测试结果决定。插件会在启动时改写部分 YAML 字段并重建 IPv6 防火墙链。**不要只看源 YAML 的 `ipv6: true` 就断言实际已接管 IPv6**。
6. 使用现有 LAN DNS 经路由器 IPv4 地址转发到 Mihomo；不向 LAN 分配独立 IPv6 DNS。原日志显示 dnsmasq 启用了 DNS 重绑定保护，ULA 格式的 IPv6 Fake-IP（`fdfe:...`）可能被 dnsmasq 丢弃，须检查 AAAA 实测。按官方 `09-settings-dns-ac-ipv6.md` §9.5 的策略核验“过滤 IPv6 AAAA 记录”和上游设置；**不要为修复单个现象盲目全局关闭 DNS 防护**。
7. 检查 Provider A/B 节点已加载、运行时 Provider URL（只输出“有效/无效”，不输出明文）、IPv6 默认路由、Mihomo DNS AAAA、OpenClash IPv6 nft 规则链、IPv6 连接是否按策略分流，以及 WebRTC / DNS / ISP IPv6 泄漏。先检查 **国内 IPv6 直连和海外 IPv6 代理**；与相同节点 IPv4 基准比较延迟、丢包与吞吐，晚高峰另测。不要根据 `ipv6: true` 推断 SS/VMess/Hy2 节点已走 IPv6——还取决于机场入口是否支持 AAAA、路由及协议。
8. 以上测试未完成时，不把 IPv6 版改为 README 默认正式版，不让 LAN 全面开启 IPv6。

**回退**

1. 到 `服务 → OpenClash → 配置管理` **切回原双机场 IPv4 正式配置**。
2. 把 `local-airport.txt` 的匹配范围恢复到原配置的**实际完整路径**；若为实验版另建了覆写模块，将其关闭。
3. 将测试时打开的 OpenClash IPv6 代理/IPv6 DNS/Fake-IP v6 设置恢复至之前的基线，重启 OpenClash。若测试时还更改了 WAN6 / LAN RA / DHCPv6，按事先备份逐项恢复。
4. 从最新 Debug 日志确认当前运行 YAML、A/B Provider、DNS 与防火墙；完成 IPv4/IPv6 和 DNS 泄漏复查。任何回退都**不能用删除全体 Provider 缓存**替代。

本章节是**操作指南和待验证方案**；R2S 尚未按本章节完成 IPv6 验收。
