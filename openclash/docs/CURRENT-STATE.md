# 当前状态说明

> 本文用于快速理解当前 OpenClash 设计。
>
> 正式配置永远以 `main` 分支中的 YAML 文件为准。

当前维护配置入口（2026-10-11 起）：

- IPv6 双机场主维护：`openclash/openclash_by_jax_双机场_IPv6.yaml`
- 普通双机场同步维护：`openclash/openclash_by_jax_双机场.yaml`

**新维护规则（2026-10-11，用户明确指定）**：双机场以后以 `openclash/openclash_by_jax_双机场_IPv6.yaml` 作为主维护版；未明确要求只修改一个版本时，必须**同时修改** `openclash/openclash_by_jax_双机场.yaml` 普通双机场版。两版共同的 Provider、规则、策略组、Smart、DNS 分流等逻辑应同步，保留顶层 IPv6、DNS AAAA、IPv6 Fake-IP 池等专属差异，不允许整份覆盖。`openclash/openclash_by_jax_单机场.yaml` 单机场版不自动联动。每次修改都要重新读取两份 main 最新文件、分别校验、比对非预期差异，并报告提交。不代表自动切换 R2S 正在运行的配置，也不代表 DNS/IP/WebRTC 泄漏已完成全面验收。

原有单机场入口仍独立：

-   双机场： `openclash/openclash_by_jax_双机场.yaml`

-   单机场： `openclash/openclash_by_jax_单机场.yaml`

若本文与 YAML 不一致，以 GitHub main 中实际 YAML 为准，并同步更新本文。

------------------------------------------------------------------------

# 1. 项目边界

设备侧：

-   R2S
-   ImmortalWrt
-   OpenClash
-   Mihomo

仓库：

`jax2333333/proxy-configs`

OpenClash 维护范围：

`openclash/`

除非明确要求同步修改，否则不联动修改：

-   Clash Verge
-   Shadowrocket

------------------------------------------------------------------------

# 2. 配置入口

## 双机场配置

主维护：`openclash/openclash_by_jax_双机场_IPv6.yaml`；普通双机场默认同步：`openclash/openclash_by_jax_双机场.yaml`。R2S 正在使用哪个文件需另行验证。

文件：

`openclash/openclash_by_jax_双机场.yaml`

适用：

-   两个机场订阅
-   主备机场组合
-   A/B节点隔离管理

Provider：

-   Airport-A
-   Airport-B

节点前缀：

-   A\|
-   B\|

------------------------------------------------------------------------

## 单机场配置

文件：

`openclash/openclash_by_jax_单机场.yaml`

适用：

-   单机场用户
-   简化策略
-   降低维护复杂度

Provider：

-   Airport-A

特点：

-   删除 Airport-B
-   删除 B\|体系
-   使用统一智能选择

------------------------------------------------------------------------

# 3. Provider安全规则

GitHub公开仓库允许：

-   Provider名称
-   配置结构
-   占位URL

禁止：

-   真实机场订阅URL
-   UUID
-   Token
-   密钥
-   密码

真实订阅只保存在本地私密覆写文件。

GitHub只保存：

`url: XXXXXXXXX`

------------------------------------------------------------------------

# 4. DNS / Fake-IP设计

长期设计：

-   IPv6 双机场主维护版：`ipv6: true`、`dns.ipv6: true`，含 `dns.fake-ip-range6`。
-   普通双机场版：`ipv6: false`、`dns.ipv6: false`，不含 `dns.fake-ip-range6`。
-   dns.enhanced-mode: fake-ip
-   Fake-IP范围：198.18.0.1/16
-   respect-rules: true

原则：

-   境外服务使用海外加密DNS
-   国内域名使用国内DoH
-   proxy-server-nameserver避免解析死循环
-   保留private_domain和cn_domain

DNS检测相关域名保持海外解析优先：

-   browserleaks.com
-   browserleaks.net
-   whoami.akamai.net
-   whatismyip.akamai.com
-   surfshark.com

------------------------------------------------------------------------

# 5. 应用策略

保留独立策略：

-   🤖 AI
-   📺 YouTube
-   ✈️ Telegram
-   🐙 GitHub
-   🍎 Apple
-   💻 Microsoft
-   ☁️ OneDrive
-   🎬 Netflix
-   🎵 TikTok
-   🎮 Steam
-   🐟 漏网之鱼

双机场 `🔮 节点选择` 与 `🤖 AI` 的可选列表已移除 `🚀 直连`（2026-10-11）；这不改变独立直连规则，也不移除其它策略组的直连选项。

阿里云验证码/安全检测相关域名：双机场 YAML 已加入 `DOMAIN-SUFFIX,aliapp.org,🚀 直连`，位于 `cn_domain` 和 `MATCH` 之前，使 `ynuf.aliapp.org` 不再默认走兜底代理。单机场 YAML 未修改。

当前两套 YAML 的 `🤖 AI` 都显式列出日本、新加坡、美国、台湾地区 Smart，但同时保留一个未按地区过滤的总 Smart 入口；因此当前状态不应描述为“严格排除全部香港路径”。

------------------------------------------------------------------------

# 6. Smart设计

双机场：

-   `A|智能选择` / `B|智能选择` 两个总 Smart 独立
-   香港、日本、台湾、美国、新加坡分别建立 A/B 地区 Smart，共 10 个地区 Smart
-   `🖐️ 手动选择` 与 `🛠️ 节点测速` 直接聚合两个 Provider

双机场地区 Smart 测速地址（2026-10-11）：

-   A 机场香港、日本、台湾、美国、新加坡共 5 个地区 Smart：`https://chatgpt.com/cdn-cgi/trace`。
-   B 机场对应的 5 个地区 Smart：`https://www.youtube.com/generate_204`。
-   `A|智能选择` / `B|智能选择`、`🛠️ 节点测速`、`Airport-A` / `Airport-B` Provider 健康检查仍保留原来的 `https://www.gstatic.com/generate_204`；这次不调整订阅更新与健康检查频率。
-   这些 URL 用于连通性与延迟测试，并非实际下载吞吐测试。ChatGPT 在部分地区可能限制访问，尤其需关注 A 机场香港 Smart 的实机结果。

单机场：

-   `智能选择` 作为总 Smart
-   香港、日本、台湾、美国、新加坡各一个地区 Smart
-   `🖐️ 手动选择` 与 `🛠️ 节点测速` 使用 `Airport-A`

地区 Smart 当前排除：

-   免费节点
-   0.01倍率
-   x0.1倍率

当前 YAML 的 Smart 组显式配置 `url`、`interval`、`tolerance`；地区 Smart 另外配置 `filter`、`exclude-filter`、`exclude-type`。是否增加其它 Smart 参数必须以当前 Mihomo/Smart 文档与实际 YAML 为准，不在本文写死。

------------------------------------------------------------------------

# 7. Provider缓存保护

当前启动钩子调用的维护入口：

`openclash/toolkit/scripts/provider-cache-guard.sh`

版本化的 `provider-cache-guard-v*.sh` 文件保留用于历史/迭代参考，不作为当前启动钩子的默认入口。

当前守卫功能：

-   对本地 Provider URL 计算 SHA256 指纹
-   检测同名 Provider URL 是否变化
-   URL 变化时精确备份并清理该 Provider 的缓存文件
-   首次运行只建立指纹，不清缓存
-   读取、哈希、备份或删除异常时优先保留缓存并允许 OpenClash 继续启动

用于解决：

同名 HTTP Provider 更换 URL 后仍复用旧缓存的问题。

------------------------------------------------------------------------

# 8. 配置选择

两个机场：

优先维护 `openclash_by_jax_双机场_IPv6.yaml`，并默认同步 `openclash_by_jax_双机场.yaml`。

一个机场：

使用：

`openclash_by_jax_单机场.yaml`

------------------------------------------------------------------------

# 9. 修改原则

所有修改必须：

1.  main是唯一正式版本。
2.  修改前读取GitHub最新文件。
3.  不根据旧聊天内容覆盖。
4.  不提交真实机场信息。
5.  默认只修改openclash目录。
6.  YAML变化后同步更新知识库。

------------------------------------------------------------------------

# 10. 未完成问题

Hysteria2测速异常：

历史出现测速无速度。

后续处理：

不要直接修改配置。

先检查：

-   OpenClash Debug日志
-   QUIC
-   UDP路径
-   GSO
-   节点参数
-   核心错误日志
