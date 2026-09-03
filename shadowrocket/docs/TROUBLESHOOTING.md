# Troubleshooting & Log Analysis

## Shadowrocket SQLite 日志

按时间范围、Host / Domain、目标 IP / Port、DIRECT / PROXY / REJECT、命中规则、TCP Stream / UDP Relay、策略组 / 节点和故障窗口请求序列分析。

若导出的 `.db` 约 4096 bytes、header 正常、没有 table/view 且使用 WAL，则记录不足；数据可能仍在 `.db-wal`，应重新复现后完整导出。

连接日志可以证明域名是否出现、DIRECT / PROXY / REJECT、TCP / UDP 与命中规则；通常不能证明 HTTP URL path、JSON 实际结构或 http-response JS 已执行。涉及脚本时结合 Shadowrocket 脚本日志或不含敏感信息的诊断日志。

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

YouTube 异常按模块逐层停用，不直接改主配置。53/UDP 出现不等于 DNS 泄漏，应结合配置、劫持行为和实际泄漏测试。QUIC 的 UDP REJECT 可能强制 TCP，但会影响延迟、功耗与兼容性，必须专项验证。
