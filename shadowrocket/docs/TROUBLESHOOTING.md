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

## HTTPDNS

移动主配置 `hijack-dns = :53` 处理传统 DNS，不代表 App 自带 HTTPDNS/HTTPS HTTPDNS 一定经过同一解析链路。Home Clean 不设置 `hijack-dns`，传统 DNS 优先交给家庭 OpenClash 链路。

当前 `httpdns-block-safe.sgmodule` 采用零 MITM 的高置信度阻断。若开启后出现某个 App 登录、图片、定位或首屏异常：

1. 先只关闭 `httpdns-block-safe.sgmodule`；
2. 完全退出并重开目标 App；
3. 若恢复，记录异常 Host / IP，再判断是删除单条规则还是继续保留；
4. 不因为单一 App 异常直接扩大 MITM 到微信、支付宝、京东等业务 API。

传统 53/UDP 出现本身不等于 DNS 泄漏，应结合当前所用配置、实际命中规则和 DNS 泄漏测试判断。

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