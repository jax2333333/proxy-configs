# Troubleshooting & Log Analysis

## Shadowrocket SQLite 日志

按时间范围、Host / Domain、目标 IP / Port、DIRECT / PROXY / REJECT、命中规则、TCP Stream / UDP Relay、策略组 / 节点和故障窗口请求序列分析。

若导出的 `.db` 约 4096 bytes、header 正常、没有 table/view 且使用 WAL，则记录不足；数据可能仍在 `.db-wal`，应重新复现后完整导出。

连接日志可以证明域名是否出现、DIRECT / PROXY / REJECT、TCP / UDP 与命中规则；通常不能证明 HTTP URL path、JSON 实际结构或 http-response JS 已执行。涉及脚本时结合 Shadowrocket 脚本日志或不含敏感信息的诊断日志。

## 先确认当前运行模式

排障前先确认 Shadowrocket 当前实际使用哪个正式配置：

```text
外出 4G / 5G
→ Jax-shadowrocket-v6.conf
→ Shadowrocket 自己负责 DNS / 分流 / 代理

家庭 Wi-Fi
→ Jax-shadowrocket-home-clean.conf
→ Shadowrocket 只净化
→ 正常流量 DIRECT 给 OpenClash
```

如果场景选错，后续看节点、DNS、规则日志都可能得出错误结论。

## 家庭 Wi-Fi Home Clean

### 预期行为

Home Clean 主规则只有最终：

```text
FINAL,DIRECT
```

因此普通国内/国外请求在 Shadowrocket 日志里看到 `DIRECT` 是正常现象。这里的 DIRECT 仅表示“不使用 Shadowrocket 节点”；流量仍继续经过家庭 Wi-Fi 网关，由 OpenClash 决定最终直连还是代理。

### 家里国外网站打不开 / AI 不通

固定排查顺序：

1. 确认当前场景确实选中 `Jax-shadowrocket-home-clean.conf`，全局路由模式是“配置/场景”，不是“代理”或错误配置。
2. 暂时关闭 Shadowrocket，只通过同一 Wi-Fi 测试国外网站：如果仍不通，优先属于 OpenClash / 家庭 DNS / 节点 / 网关问题，不应给 Home Clean 添加 Shadowrocket 代理组。
3. 如果关闭 Shadowrocket 正常、开启 Home Clean 异常，再检查最近启用的 Toolkit 模块，先做单模块 A/B。
4. 确认 Home Clean 仍为 `dns-server = system` / `fallback-dns-server = system`，没有被加入公网 DoH 或 `hijack-dns`。
5. 检查 Home Clean 的 `tun-excluded-routes` 没有加入 OpenClash Fake-IP 常用 `198.18.0.0/15`。
6. 只有确认是 Shadowrocket 本机净化层导致时，才修改 Home Clean 或模块；否则去 OpenClash 层继续排查。

### 家里广告过滤/脚本不生效

1. 确认 Shadowrocket 隧道实际保持连接，而不是仅仅切到“直连”全局模式后让配置/模块不参与。
2. 确认 Home Clean 作为当前配置运行，模块开关实际开启。
3. 若目标模块需要 MITM，确认 Shadowrocket 证书仍已安装、信任且目标 hostname 在模块中。
4. OpenClash 使用 Fake-IP 时，确认 `198.18.0.0/15` 没被加入 Home Clean 的 `tun-excluded-routes`。
5. 用一个已知 REJECT 域名或 URL Cleaner 做低风险验证；不要一次启用更多通用广告模块来“补救”。

### 家庭 DNS 异常

Home Clean 的设计目标是不抢 OpenClash DNS 控制权：

```text
dns-server = system
fallback-dns-server = system
```

没有 `hijack-dns`。如果家里出现 DNS 异常：

1. 先比较 Shadowrocket 关闭 vs Home Clean 开启；
2. 再检查 OpenWrt DHCP 下发 DNS、OpenClash DNS/Fake-IP 当前状态；
3. 不把移动版 Cloudflare/Google/AliDNS DoH 直接复制进 Home Clean；
4. App 自带 HTTPDNS 另按 `httpdns-block-safe.sgmodule` 做 A/B。

### 场景没有自动切换

1. Wi-Fi 场景 SSID 必须与家里 Wi-Fi 名称完全一致；
2. 蜂窝场景应绑定 `Jax-shadowrocket-v6.conf`；
3. 首页“全局路由”需要实际选择“场景”；
4. 若系统询问 Wi-Fi/位置相关权限，确认 Shadowrocket 有识别 SSID 所需权限；
5. 检查“设置 → 隧道/按需求连接”中的包含所有网络/按需求设置是否干扰场景行为。

## A/B 智能组没有节点

当前移动配置的 A/B 智能组依赖节点名称前缀的 `policy-regex-filter` 做来源隔离，而不是把真实机场订阅地址写进仓库。

当前设备实际命名格式：

```text
A | 香港 01
A | 日本 01
B | 香港 01
B | 日本 01
```

其中 `B | 日本 01` 已作为本次实测样本确认。

固定排查顺序：

1. 先看实际节点名称，确认有 A/B 前缀；可保留原始名称，如 `A | 原始节点名` / `B | 原始节点名`。
2. 检查当前正式配置的来源正则是否允许竖线两侧空格：`^A\s*\|\s*` / `^B\s*\|\s*`。
3. 旧 V6.7 使用的 `^A\|` / `^B\|` 只能匹配无空格 `A|节点` / `B|节点`，遇到 `B | 日本 01` 会导致整个 A/B 智能组为空。
4. 再检查地区关键词是否命中，例如日本组需要节点名中存在日本 / JP / Japan / Tokyo 等当前配置允许的关键词。
5. 当前正式架构依赖前缀正则筛选节点；代理分组编辑页里的“订阅”开关没有手工开启，本身不代表配置异常，也不是这次无节点的根因。
6. 修复后重新加载配置，进入 `A|智能选择` / `B|智能选择` 与对应地区组确认节点已出现。

2026-09-25 已验证：V6.7.1 使用允许空格的前缀正则后恢复正常，同时继续兼容旧的 `A|节点` / `B|节点` 无空格写法。

## 机场节点名称重复与策略选择重置（2026-10-30）

### 重名：B 机场实机反馈已解决

用户的 B 订阅本地重命名脚本曾将节点名称压缩为“地区 + 编号”，丢弃原始线路等区分信息；不同节点可能被改成相同名称，无法仅凭同名认定是同一节点。改为保留机场原名并添加 `B | ` 前缀后，用户反馈重复问题已解决。该结果为用户手机反馈，不代表机场原订阅保证名称唯一。

下面是同一逻辑的 A / B 本地订阅脚本。B 已获用户反馈解决，A 为对应脚本，尚待手机实测。替换前备份旧脚本，分别在各机场的订阅脚本位置保存并更新对应订阅；真实订阅和凭据仅保留本机。

```javascript
// A 机场：B 机场将下面两处 A 换成 B
var t = $server.title || "";

if (/(免费|公益|剩余|流量|到期|套餐|官网|频道|群组|客服|0\.01倍|0\.1倍|x0\.01|x0\.1)/i.test(t)) {
    return false;
}

if (/^A\s*\|\s*/i.test(t)) {
    $server.title = t;
} else {
    $server.title = "A | " + t;
}

return true;
```

该筛选保持原条件，按名称匹配可能误排包含相关文字的正常节点；如果机场原名本身相同，脚本不负责去重。地区组依赖原始名称关键词：当前日本组含日本、JP、Japan、Tokyo、东京、東京、NRT、KIX，但不含大阪 / Osaka；实际节点若仅含后者，需要核对现行配置再决定是否修改正则。

### 节点选择跳回 A：仍待复现

用户曾反馈手动选择 B 日本后，`🎯 节点选择` 经常显示为 `A|智能选择`。当前仓库移动配置为 `select`，并指定 `policy-select-name=A|智能选择`；B 日本组为 `url-test`，组内节点可自动变化。默认值、重名与重置之间的因果尚未证实，B 重名解决也不等于选择重置已解决。

固定网络和移动配置下先手选 B 日本，分别观察仅等待、更新 B 订阅、更新移动配置、重连及切换网络后的上级组选择；每次只改变一项并记录触发时刻。若重置仍发生，核对手机实际配置、场景与客户端版本，再决定下一步。

## HTTPDNS

移动主配置 `hijack-dns = :53` 处理传统 DNS，不代表 App 自带 HTTPDNS/HTTPS HTTPDNS 一定经过同一解析链路。Home Clean 不设置 `hijack-dns`，传统 DNS 优先交给家庭 OpenClash 链路。

当前 `httpdns-block-safe.sgmodule` 采用零 MITM 的高置信度阻断。若开启后出现某个 App 登录、图片、定位或首屏异常：

1. 先只关闭 `httpdns-block-safe.sgmodule`；
2. 完全退出并重开目标 App；
3. 若恢复，记录异常 Host / IP，再判断是删除单条规则还是继续保留；
4. 不因为单一 App 异常直接扩大 MITM 到微信、支付宝、京东等业务 API。

传统 53/UDP 出现本身不等于 DNS 泄漏，应结合当前所用配置、实际命中规则和 DNS 泄漏测试判断。

## 抖音商城「我的订单」移动数据网络异常（2026-10-19：实机验收通过）

### 现象与对照测试

| 场景 | 抖音订单页结果 |
| --- | --- |
| 家庭 Wi-Fi + Home Clean | 正常 |
| 蜂窝数据 + 原 Mobile 配置 | 提示「网络异常」 |
| 蜂窝数据 + 原 Mobile 配置，关闭 TikTok / 抖音 / 红果广告净化模块 | 仍提示「网络异常」 |
| 蜂窝数据，完全断开 Shadowrocket VPN | 正常 |
| 蜂窝数据，更新 Mobile 精确直连规则，广告净化模块关闭 | 正常 |
| 蜂窝数据，保持修复规则并重新开启广告净化模块 | 正常 |

以上成功/失败情况来自用户在 iPhone 上的实际复测；最后两项已验收，说明此案例的订单功能修复与当前抖音净化模块可共存。家庭和蜂窝不仅配置不同、底层网络也不同，因此不能仅凭两者对照判断 DNS 或网关的根因。

### 故障前证据与判断

- 故障前 Shadowrocket SQLite 日志 `1(2).db` 的既有分析记录显示：抖音电商请求 `ecomuser.snssdk.com` 被送至 `🎵 TikTok` 策略下的 B 机场日本代理；同一故障窗口中其他部分 `ecombdapi.com`、`jinritemai.com` 电商域名走 DIRECT。后续定位相似故障时应以**新抓取的当前日志**复核。
- 当时 Mobile 正式配置中的宽泛规则 `DOMAIN-SUFFIX,snssdk.com,🎵 TikTok` 会覆盖该电商子域；`snssdk.com` 同时是 TikTok/抖音共享基础设施，不能整体改为 DIRECT。
- 关闭整个抖音广告净化模块并未恢复订单；只修改该子域路由后恢复，重新启用模块仍正常。综合 A/B 测试，**错误代理是本次订单页异常的高可信根因**，而非证明所有抖音订单故障都由此引起。
- 本次没有新的修复后 SQLite 抓包或 HTTP 状态码证据；验收依据为用户实机功能测试，不声称已经逐个验证电商所有接口。

### 已纳入 GitHub main 的最小修复

正式文件：`shadowrocket/Jax-shadowrocket-v6.conf`，在 `[Rule]` 的 TikTok `RULE-SET` 与 `DOMAIN-SUFFIX,snssdk.com` **之前**设置：

```ini
# 抖音电商订单接口直连
DOMAIN,ecomuser.snssdk.com,🌐 全球直连
```

`🌐 全球直连` 在该配置中指向 `DIRECT`。对应已提交的配置修复：[e4e74f74](https://github.com/jax2333333/proxy-configs/commit/e4e74f74d7c4da174f549be6137351aac42cd9af)。

不修改 Home Clean、不改 DNS / IPv6 / MITM、不扩大 `*.snssdk.com` 的直连、不调整 TikTok 其他域名的地区分流；此规则应作为**已实机验证的精确例外**持续保留，除非后续有新的复现证据。

### 相同症状的固定排查 / 回滚

1. 确认当前实际网络与生效配置：家庭指定 SSID 应为 Home Clean；蜂窝/其他未知网络应为 Mobile。不要把 Home Clean 用作外部网络的常驻替代方案。
2. 在同一蜂窝网络分别测试 Shadowrocket VPN 开/关，并单独关闭抖音广告模块做 A/B。模块关闭仍异常时，不要继续盲目扩大 REJECT / MITM。
3. 检查 iPhone Mobile 是否已更新 GitHub 当前配置、是否使用配置/场景路由，以及精确 `ecomuser.snssdk.com` 规则是否**早于** TikTok 的 `RULE-SET` 和 `DOMAIN-SUFFIX,snssdk.com`。
4. 如仍复现，清空日志后只重现一次订单页，记录 `ecomuser.snssdk.com` 及相关电商域名的 DIRECT / PROXY / REJECT、策略组、连接错误和时间；必要时再按证据检查 DNS / HTTPDNS / 其他模块。不要把整个 `snssdk.com`、`bytegecko.com` 或 `ecombdapi.com` 一律改为直连。
5. 如果精确规则对其他已验证功能造成回归，仅回退 Mobile 文件中的这一条精确规则并重新加载，再逐项复测订单与 TikTok；修改仓库仍需遵循 `AGENTS.md` 的授权流程。

本记录仅存公共域名、规则和脱敏结论，不上传原始 SQLite 日志、账户订单、Cookie、Token 或真实机场地址。

## 红果短剧：家庭无广告、外出仍有广告（2026-10-27：待实机复测）

### 日志与当前修复

- 用户报告家庭 OpenClash 场景无广告，外出使用 Shadowrocket 时仍有广告；两种网络的拦截链路不同，不能据此认定家庭效果全部来自 OpenClash。
- 本次 Shadowrocket SQLite 日志中，8 个 `*-reading-ad.qznovelvod.com` 主机共出现 44 条连接，41 条 DIRECT、3 条 PROXY，没有 REJECT。正常播放另有 21 个其他 `qznovelvod.com` 主机，不应整域封锁。
- 模块原规则 `DOMAIN-SUFFIX,reading-ad.qznovelvod.com,REJECT` 只能覆盖该主机及点分隔子域，不能匹配 `v96-reading-ad.qznovelvod.com`、`v5-ex-reading-ad.qznovelvod.com` 等连字符前缀；这是可由当前配置确认的匹配缺口。
- `tiktok-douyin-adblock.module` v7 保留原后缀规则，并补充：

```ini
DOMAIN-WILDCARD,*-reading-ad.qznovelvod.com,REJECT
```

本次保持现有抖音 response Script、MITM、DNS、IPv6 和场景分流设置。红果继续使用域名层拦截；静态匹配通过不等于实际广告展示已经消失。

### 仍需检查的模块生效问题

同一份日志中，模块已列出的 `dig.bdurl.net`、`ads3-normal-lq.zijieapi.com`、`ads5-normal-lq.zijieapi.com`、`p3-ad-sign.byteimg.com` 合计还有 66 条连接被 DIRECT / PROXY 放行，其他时段则能命中精确 REJECT。仅补充 CDN 规则不能证明这项运行状态差异已经解决；模块是否启用、重新编译是否成功、是否存在其他模块覆盖，需在手机当前外出场景核实。

### 固定复测与回滚

1. 更新手机上的远程模块，确认描述为 `v7 · 2026-10-27`，保持模块开启；关闭 Wi-Fi，用蜂窝数据启用 `Jax-shadowrocket-v6.conf`，重新使用 / 编译当前配置。
2. 在“测试规则”分别输入 `https://ads3-normal-lq.zijieapi.com/` 与 `https://v96-reading-ad.qznovelvod.com/`，预期均为 REJECT。第一项仍被放行时先查模块加载 / 覆盖，不继续扩大广告域名或 MITM。
3. 完全退出红果，清空连接日志，重新打开并复现原广告场景；记录复现时间并导出新的 `.db`。核对广告域名是否 REJECT，以及正常播放、切集是否仍可用；已缓存的广告不能单独证明新规则失败。
4. 若仅规则测试通过但广告仍出现，继续按新日志定位广告来源；连接级记录不能证明抖音 response Script 执行，也不能据此扩大红果 MITM。
5. 若出现新的播放异常，先只撤销本次新增的 `DOMAIN-WILDCARD` 规则并重新加载，做单变量 A/B；不要同时改变节点、DNS 或其他模块。

此记录只保存脱敏统计和公开域名；v7 的手机实际去广告效果尚待用户验收，不上传原始 SQLite 日志、请求参数或认证材料。

## 抖音广告

- `p*-ad-sign.byteimg.com` 等素材域名被 REJECT，不代表服务器插入视频广告一定消失。
- 短剧 / 剧集可能经正常视频 CDN 播放广告与正片，不能简单封禁 `douyinvod.com` 或 `dyseries.douyinvod.com`。
- Feed / 剧集广告应从响应中识别明确广告对象，不能只依赖 CDN REJECT。
- 宽泛 `*.amemv.com` http-response / MITM 有回归风险；UDP Relay / QUIC 也意味着 HTTPS response 脚本未必覆盖关键请求。

### A/B 推荐顺序

1. 关闭整个 TikTok / 抖音净化模块。
2. 若恢复，问题属于模块。
3. 保留 MITM、移除 Script 做单变量诊断：若恢复，检查 Script / 匹配；否则检查 MITM 范围。
4. 单独撤销可疑 REJECT 规则验证。
5. 最后才考虑 UDP / QUIC 回退 TCP，不一开始扩大影响面。

`dig.bdurl.net` 的 REJECT 与观看历史异常曾有时间相关性，但不是已证明根因，必须通过单变量 A/B 决定是否保留。

## YouTube、DNS、IPv6 与 QUIC

YouTube 异常按模块逐层停用，不直接改正式配置。IPv6 当前默认关闭，但每次仍以当前所用配置实际 `[General]` 为准。

`proxy-stability.sgmodule` 设置 `block-quic = all-proxy`，只阻断走 Shadowrocket 代理连接的 QUIC，DIRECT 不受影响。它属于移动模式可选稳定性实验，不是默认修复手段。若移动模式实测需要，可以长期保持开启；Home Clean 正常流量为 DIRECT，`all-proxy` 通常不会作用于这些连接，家庭真实代理 QUIC/UDP 仍由 OpenClash 处理，因此无需为了回家/出门反复切换模块。

推荐移动模式 QUIC A/B：

1. 保持节点与策略组不变；
2. 只开启 `proxy-stability.sgmodule`；
3. 测试 YouTube 首开、拖动进度、Google/GitHub 与常用 App；
4. 对比 4G/5G 与 Wi-Fi；
5. 若没有明确收益则保持关闭。

家庭 Home Clean 出现国外网站/YouTube 代理 QUIC 问题时，应优先在 OpenClash 层分析，不通过开启 `proxy-stability.sgmodule` 代替网关排障。

## WebRTC / STUN — 实时音视频故障 P0 排查

当前两个正式配置均默认启用 WebRTC Privacy：`[General]` 中包含 `stun-response-ip` / `stun-response-ipv6`。`toolkit/modules/webrtc-privacy.sgmodule` 仅保留为备用模块，不应与正式配置重复启用。

### 适用症状

只要出现以下任一情况，**先执行本节，不要先改 DNS、节点、QUIC 或 MITM**：

- FaceTime 无法建立通话、接通后无声音/无画面；
- Google Meet 建连失败、单向音频、视频异常；
- Discord 语音无法加入、无声音、频繁断开；
- Safari/浏览器网页视频会议、WebRTC 通话异常；
- 其它实时音视频出现与 Shadowrocket 开启明显相关的兼容性问题。

### P0 固定排查顺序

1. **第一优先检查 `webrtc-privacy.sgmodule`**：确认它是否被启用、重复导入，或与当前正式配置的 STUN 隐私字段同时生效；若已启用，先关闭该模块。
2. 重新加载 Shadowrocket 配置，完全退出并重开 FaceTime / Meet / Discord / 浏览器后复测。
3. 若 `webrtc-privacy.sgmodule` 本来就未启用，或关闭后仍异常，则临时撤销当前所用配置 `[General]` 中：
   - `stun-response-ip = 1.0.0.1`
   - `stun-response-ipv6 = ::1`
4. 再次重新加载配置并复测。若恢复，优先判定为 WebRTC/STUN 隐私设置兼容性问题。
5. 只有上述 A/B 无法解释问题时，才继续检查 `proxy-stability.sgmodule`、UDP/QUIC、策略组/节点、DNS、MITM、目标服务状态或运营商/家庭网络。

### ChatGPT 接管规则

后续任何新对话中，只要用户反馈 **FaceTime、Google Meet、Discord 语音、网页视频会议**等实时音视频异常，ChatGPT 应主动提醒：**先排查 `webrtc-privacy.sgmodule` / WebRTC Privacy 层，这是 P0 第一优先级。**

## 规则源与策略组

当前移动主配置中部分核心 RULE-SET 引用用户同步维护的 `jax2333333/ios_rule_script` fork。出现某服务突然全部落入 FINAL 或规则集更新失败时：

1. 检查对应 Raw URL 是否存在；
2. 确认 `ios_rule_script` fork 是否仍与 Blackmatrix7 上游同步；
3. 检查目标策略组名称是否仍存在，并确认最终兜底仍为 `FINAL,🎯 节点选择`；
4. GitHub 流量优先检查独立 `🐙 GitHub` 组；
5. 不在没有验证等价映射时批量替换剩余规则源。

Home Clean 不引用这些国外代理 RULE-SET；如果家庭模式某国外服务路由异常，应先去 OpenClash 检查对应规则/策略，而不是把移动主配置 RULE-SET 复制进 Home Clean。