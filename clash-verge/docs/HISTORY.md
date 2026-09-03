# Clash Verge 配置历史与已验证决策

本文件只记录**历史原因、已淘汰方案和已经验证过的结论**。它不是当前正式配置；当前状态必须读取 `../clash-verge-by-jax.yaml`。

## 1. 从 Gist 迁移到 GitHub main

早期 Clash Verge 配置曾使用 GitHub Gist 托管。当前长期方案已经迁移到：

```text
jax2333333/proxy-configs
└─ main
   └─ clash-verge/clash-verge-by-jax.yaml
```

旧 Gist 只作为历史来源/备份，不再作为正式 Source of Truth。

## 2. 机场订阅从公共文件移到本地 Merge

早期公共配置曾存在真实机场订阅地址暴露风险。

最终安全方案：

- GitHub 只保存公共 YAML。
- Clash Verge 本地 Merge 注入 `proxy-providers.Airport1`。
- 真实订阅 URL 不进入仓库。

如果旧公开历史曾包含有效秘密，应轮换订阅，而不是只依赖删除当前文本。

## 3. V2 系列配置检查

曾对 Clash Verge YAML 做过完整语法和 Mihomo 字段核查，主要确认：

- `cache-algorithm: arc` 有效。
- Fake-IP 与 `fake-ip-filter-mode` 结构有效。
- `proxy-server-nameserver` 用于代理节点域名解析。
- DNS server 支持 `#代理组` 形式。
- `include-all-providers`、`filter`、`exclude-filter` 可用于策略组。
- TUN `mixed` 是可用栈。
- macOS 不应依赖 Linux-only 的 `auto-redirect`。
- MRS 的 domain/ipcidr behavior 与当前 Rule Provider 用法相符。

## 4. 已淘汰：`apple_ip.mrs` 与 `steam_ip.mrs`

曾实际检查对应 meta-rules-dat URL，发现：

- `geoip/apple.mrs` 不存在/404。
- `geoip/steam.mrs` 不存在/404。

因此当前方案不再依赖它们。

不要因为看到旧聊天/旧 YAML 又把这两个 Provider 加回来，除非未来重新验证目标文件已经存在并且确实需要。

## 5. Steam 当前设计来源

验证到 `geosite/steam@cn.mrs` 存在，因此 Steam 调整为：

```text
steam@cn.mrs
   ↓
📥 Steam 下载

steam.mrs
   ↓
🎮 Steam 商店
```

并要求 `steam@cn` 规则在 `steam` 通用规则之前。

## 6. 节点筛选正则修复

旧筛选正则曾把裸 `2` 放入排除条件。

风险：节点名中只要包含数字 2，就可能被错误排除，例如：

```text
JP-02
US-2
2026...
```

最终改为：

- 地区使用正向 `filter`。
- 倍率/免费/流量提示使用 `exclude-filter`。
- 策略组使用 `include-all-providers`。

这样不需要用复杂的“地区 + 大段负向 lookahead”一次完成所有逻辑。

## 7. `include-all` → `include-all-providers`

旧方案使用 `include-all` 时，可能把本地出站对象一起纳入组中，导致需要额外排除 `🚀 直连`。

当前设计使用 Provider 维度引入机场节点，使本地直连和机场节点池职责更清晰。

## 8. fallback 健康检查补全

地区故障转移组已改为显式健康检测 URL + interval + lazy 的结构，避免仅配置 interval 而缺少清晰检测目标。

精确值以最新 YAML 为准。

## 9. 国内流量组

早期中国大陆规则直接指向 `🚀 直连`。

后来增加：

```text
🇨🇳 国内流量
```

规则改为：

```text
cn_domain / cn_ip
       ↓
🇨🇳 国内流量
```

这样 Dashboard 中能看见国内流量策略，并保留临时切换能力。

私有网络 / LAN 规则仍应保持固定直连语义，不与国内公网流量混在一起。

## 10. `🐟 漏网之鱼` 的含义

`🐟 漏网之鱼` 不是额外 Rule Provider，而是最终：

```text
MATCH
  ↓
🐟 漏网之鱼
```

它负责所有未命中前序分类规则的流量。

Mihomo 的 `GLOBAL` UI 项与这个 MATCH 兜底不是同一概念。

## 11. API 暴露收紧

旧配置曾将 Mihomo external controller 监听到所有地址且没有 Secret，存在局域网无认证 API 风险。

模板后续改为只绑定本机回环地址。

是否允许 LAN 设备使用代理端口是另一件事，不应因为收紧 API 就自动破坏局域网代理需求。

## 12. DNS 架构调整

当前稳定意图来自一次完整核查：

- 国内域名 → 国内 DoH。
- Provider 节点域名 → 独立国内 DNS 路径。
- 境外默认 DNS → Cloudflare / Google DoH，通过主代理组连接。
- DIRECT 出口有独立 DNS 路径。

具体服务器、端口和策略以最新 YAML 为准。

## 13. 运行日志：Microsoft Warning

曾实际观察：

- `web.vortex.data.microsoft.com` 偶发 `dns resolve failed: couldn't find ip`。
- `mobile.events.data.microsoft.com` 偶发直连 `i/o timeout`。

同时大量 Microsoft 核心域名仍正常。

结论：单个遥测域名异常不足以证明整个 Microsoft 分组或 DNS 架构有问题，不应为了消除 warning 强行把 Microsoft 全部改走代理。

## 14. 运行日志：TUN 重启瞬态

Windows 日志曾在 TUN 重启瞬间集中出现大量：

```text
Auto detect interface ... get empty name
interface not found
```

随后很快出现物理接口重新识别（例如 WLAN），之后十几分钟没有继续 warning，ChatGPT / Google / GitHub 全部恢复。

结论：

- **集中在重启瞬间且快速恢复** → 先视为 TUN 网卡重建瞬态。
- **持续存在且无法联网** → 才作为真正 TUN 故障处理。

不要只按 warning 总条数判断严重程度。

## 15. 运行值可能被 Clash Verge 覆写

曾发现仓库 YAML 与日志最终值存在差异，例如 TUN stack / mixed-port。

这说明 Clash Verge 自身设置或 Merge 可以继续改写远程配置。

因此排障时必须区分：

- GitHub 正式模板值。
- Clash Verge 本地设置。
- Mihomo 最终运行值。

## 16. `badjs.weixinbridge.com`

在日志/规则讨论中确认该域名属于微信前端 JavaScript 错误/异常上报服务。

长期处理原则：

- 看到该域名不代表恶意行为。
- 不要只因名称包含 `badjs` 就拦截。
- 如需隐私型阻断，应另行评估微信 WebView / 页面错误上报副作用。

## 17. 后续维护

历史文档只用于避免重复踩坑。

任何未来配置改动：

1. 先读 GitHub `main` 当前 YAML。
2. 再读本历史，确认是否正在重新引入旧问题。
3. 修改后更新必要文档。
4. 重新读取 `main` 验证提交结果。
