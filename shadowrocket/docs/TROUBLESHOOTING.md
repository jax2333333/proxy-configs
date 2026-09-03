# Troubleshooting & Log Analysis

## Shadowrocket SQLite 日志

按时间范围、Host / Domain、目标 IP / Port、DIRECT / PROXY / REJECT、命中规则、TCP Stream / UDP Relay、策略组 / 节点和故障窗口请求序列分析。

若导出的 `.db` 约 4096 bytes、header 正常、没有 table/view 且使用 WAL，则记录不足；数据可能仍在 `.db-wal`，应重新复现后完整导出。

连接日志可以证明域名是否出现、DIRECT / PROXY / REJECT、TCP / UDP 与命中规则；通常不能证明 HTTP URL path、JSON 实际结构或 http-response JS 已执行。涉及脚本时结合 Shadowrocket 脚本日志或不含敏感信息的诊断日志。

## HTTPDNS

主配置 `hijack-dns = :53` 处理传统 DNS，不代表 App 自带 HTTPDNS/HTTPS HTTPDNS 一定经过同一解析链路。

当前 `httpdns-block-safe.sgmodule` 采用零 MITM 的高置信度阻断。若开启后出现某个 App 登录、图片、定位或首屏异常：

1. 先只关闭 `httpdns-block-safe.sgmodule`；
2. 完全退出并重开目标 App；
3. 若恢复，记录异常 Host / IP，再判断是删除单条规则还是继续保留；
4. 不因为单一 App 异常直接扩大 MITM 到微信、支付宝、京东等业务 API。

传统 53/UDP 出现本身不等于 DNS 泄漏，应结合 `hijack-dns`、实际命中规则和 DNS 泄漏测试判断。

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

YouTube 异常按模块逐层停用，不直接改主配置。IPv6 当前默认关闭，但每次仍以主配置实际 `[General]` 为准。

`proxy-stability.sgmodule` 设置 `block-quic = all-proxy`，只阻断走代理连接的 QUIC，DIRECT 不受影响。它属于可选稳定性实验，不是默认修复手段。出现延迟升高、耗电变化、某 App 加载异常时关闭模块复测。

推荐 QUIC A/B：

1. 保持节点与策略组不变；
2. 只开启 `proxy-stability.sgmodule`；
3. 测试 YouTube 首开、拖动进度、Google/GitHub 与常用 App；
4. 对比 4G/5G 与 Wi-Fi；
5. 若没有明确收益则保持关闭。

## WebRTC / STUN

`webrtc-privacy.sgmodule` 使用 `stun-response-ip` / `stun-response-ipv6` 返回替代地址以降低 WebRTC 暴露真实网络地址的风险。

它可能影响 FaceTime、Google Meet、Discord 语音、网页视频会议等实时通信，因此默认按需启用。出现通话建立失败、单向音频或视频异常时，首先关闭该模块复测。

## 规则源与策略组

主配置 V6.3 中部分核心 RULE-SET 引用用户同步维护的 `jax2333333/ios_rule_script` fork。出现某服务突然全部落入 FINAL 或规则集更新失败时：

1. 检查对应 Raw URL 是否存在；
2. 确认 `ios_rule_script` fork 是否仍与 Blackmatrix7 上游同步；
3. 检查目标策略组名称是否仍存在；
4. GitHub 流量优先检查独立 `💻 GitHub` 组；
5. 不在没有验证等价映射时批量替换剩余规则源。
