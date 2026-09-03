# History & Experiments

> 历史只解释维护决策，不能替代 GitHub `main`。历史代码、版本和 commit 必须重新与当前实际文件核对。

## 主配置演进

历史上进行过 Apple PCC / Private Relay 分流修正、国内服务最小直连补丁、TikTok 与抖音规则梳理，以及 DNS、IPv6、UDP/QUIC 日志检查。当前是否仍保留某项实现，以 `main` 为准。

## 抖音 / TikTok 去广告

### 域名 REJECT

可拦部分素材或统计，但不能稳定消除正常视频之间服务器插入的原生广告。

### 响应过滤

Feed 或短剧响应可通过自托管 JS 删除明确广告对象；不得因商品链接、购物锚点、直播或商家账号删除普通内容，解析失败必须原样放行。

### 实验边界

- 短剧 / 剧集的结构可能不同于普通 Feed。
- 递归识别需要限定内容候选、强广告标记、响应大小、深度和节点预算。
- 扩大 `*.amemv.com` response Script / MITM 范围会增加回归面；曾出现观看历史错误，必须做单变量 A/B。
- 大量 `amemv.com` 连接可能使用 UDP / QUIC，HTTPS response 脚本未必覆盖关键请求。
- `dig.bdurl.net` 的 REJECT 曾与功能异常有时间相关性，但未证明因果。
- 正常视频 CDN 可能同时承载广告和正片，不应直接封禁。

SQLite `.db` 也可能因 WAL 未完整导出而为空；应重新完整导出再分析。
