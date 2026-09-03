# 当前状态 / Current State

本文件只记录**长期有效的当前架构和已验证状态**。版本号、端口、DNS、TUN、Provider、策略组顺序、上游 commit 等动态值仍以 `main` 当前实际配置为准。

## 仓库目标

统一维护：

- iPhone / iOS：Shadowrocket；
- macOS：Clash Verge Rev / Mihomo；
- R2S / ImmortalWrt：OpenClash / Mihomo；
- 自用 Cloudflare 节点：v1 自写 Worker + v2 edgetunnel Pages。

目标不是把所有平台合成一份配置，而是：**共享长期策略思想，分别按各客户端语法落地，并由 GitHub `main` 统一保存可公开的正式模板和知识。**

## 总体架构

```text
GitHub main
├─ Shadowrocket 公共配置 / Toolkit / 规则
├─ Clash Verge 公共 Mihomo 模板 + 本地 Merge 注入真实订阅
├─ OpenClash 公共 Mihomo 模板 + R2S 本地覆写注入真实订阅
└─ Cloudflare Node
   ├─ v1 自写 Worker：基线 / 排错 / 回滚
   └─ v2 edgetunnel：当前优先方案
      ├─ GitHub 固定上游 commit
      ├─ 构建时校验 Git blob SHA
      ├─ Cloudflare Pages
      ├─ Cloudflare Secrets + KV
      ├─ 自定义域名 / TLS / VLESS / WS
      └─ CF 优选入口 + ProxyIP/可选链式出站
```

## Shadowrocket 当前长期状态

权威入口：`shadowrocket/README.md`。

长期设计：

- Mobile 配置负责蜂窝和所有非家庭/未知 Wi-Fi 的代理与分流；
- Home Clean 只在明确的家庭 Wi-Fi 使用，Shadowrocket 负责 Toolkit 净化，正常流量 DIRECT 交给家庭 OpenClash；
- Home Clean 是窄范围例外，Mobile 是安全兜底；
- MITM 最小化，不使用 `hostname=*`；
- AI、GitHub、Apple、TikTok 等保持既有独立策略语义；
- TikTok / 抖音共享基础设施的规则顺序不能随意破坏；
- 网站净化中心只维护必要的 module/script/hostname，不扩大为全局 MITM。

实际版本、规则顺序、DNS、模块状态必须重新读取 `shadowrocket/` 当前文件。

## Clash Verge 当前长期状态

权威入口：`clash-verge/README.md`。

长期设计：

- GitHub 保存公共 Mihomo 模板；真实机场订阅只在 Clash Verge 本地 Merge 注入；
- Fake-IP，IPv6 默认关闭；
- TUN、DNS、策略组、Rule Provider 以实际 YAML 为准；
- 节点地区保留香港、日本、新加坡、美国的智能/手动/故障转移语义；
- 应用层保留 AI、YouTube、Telegram、GitHub、Apple、Microsoft、Netflix、TikTok、Steam 等独立组；
- 自动选择排除明显免费/低倍率/套餐提示类节点；精确正则读 YAML；
- 排障时必须同时考虑 GitHub YAML、本地 Merge、Clash Verge 设置和运行日志。

## OpenClash 当前长期状态

权威入口：`openclash/README.md`。

长期设计：

- R2S / ImmortalWrt 上运行 OpenClash / Mihomo；
- GitHub YAML 只含 Provider 占位地址，真实机场订阅在 R2S 本地覆写；
- Fake-IP 为主，IPv6 默认关闭；
- DNS 优先防泄漏：境外、DIRECT/中国域名、节点域名分别按当前 YAML 的设计解析；
- Apple 默认直连但保留代理选择，AI/YouTube/Telegram/GitHub/Netflix/TikTok/Steam/Microsoft/OneDrive 等保持独立策略；
- MetaCubeX MRS 为路由器端主要规则体系，`ios_rule_script` 主要用于核对/补充；
- 多 Provider 的职责和节点前缀以当前 README/YAML 为准。

## Cloudflare Node 当前正式状态

权威入口：`cloudflare-node/README.md`。

### v2：当前优先方案

当前已经验证的架构为：

```text
GitHub main
→ cloudflare-node/edgetunnel-v2/
→ node sync-upstream.mjs
→ 固定 cmliu/edgetunnel 快照 + Git blob 完整性校验
→ Cloudflare Pages
→ Secrets / KV
→ 专用自定义域名
→ VLESS + TLS + WebSocket
→ CF 优选入口
→ edgetunnel 出站 / ProxyIP
```

长期有效结论：

- Pages Git 部署已经验证可工作；
- `ADMIN` / `UUID` / `KEY` 必须保存在 Cloudflare Secret，`OFF_LOG=1`，默认不开 `DEBUG`；
- KV binding 名称必须为 `KV`；
- 根路径出现 nginx 伪装页是正常行为，管理入口通过 edgetunnel 的 login/admin 路由；
- 自定义域名比把 `pages.dev` / `workers.dev` 当唯一长期入口更合适；
- CF 优选入口实际能显著提升大陆移动网络下的吞吐，已经验证从低速/卡顿提升到可稳定播放 4K60 的水平；
- 客户端使用优选 IP 时，`server` 可以是 CF 优选 IP，而 `Host` / `SNI` 必须保持实际自定义域名；
- `client → Cloudflare` 的优选与 `Cloudflare → 目标站` 的 ProxyIP 是两个不同层级；
- 当前固定上游如果未配置自有 `PROXYIP`，可能使用上游作者的默认 fallback，因此不能描述为“零第三方依赖”；
- 公共 ProxyIP / 公共优选 API / 公共订阅转换器只应作为可替换外部依赖，不当作永久可信基础设施。

真实 ADMIN、UUID、KEY、订阅 Token、运行域名、优选 IP、ProxyIP 凭据不写入 Public GitHub；需要时从 Cloudflare Dashboard / 本地客户端读取。

### v1：保留基线

`cloudflare-node/worker.js` 是自写的精简 VLESS Worker：

- 保留用于协议基线、排错和回滚；
- 功能明显少于 v2；
- 历史上曾遇到 Workers Git 自动构建没有真正触发、`workers.dev` 入口解析/可达性异常等问题；
- 不因 v2 已可用而删除。

## 固定偏好

- 优先用 GitHub + Cloudflare Dashboard 完成部署和维护，能不用 PowerShell 时不强制使用 PowerShell；
- Windows 10 做 Cloudflare IP 优选时优先使用 CFData-WEB 本地 Web UI；
- 优选结果看丢包、延迟、实际吞吐，不只看 ping；
- 最终保留少量 3～5 个实际高速候选，避免塞入大量低质量 IP；
- 视频/大流量验证优先看实际 Connection Speed / Buffer，而不是仅看节点延迟；
- 更新上游前审查变化、固定版本、先测试、可回滚；
- 所有代理相关变更优先考虑 DNS 泄漏、IPv6 绕过、错误直连、规则顺序和回退逻辑。

## 当前已知维护问题

在中国大陆网络环境下，Cloudflare 自定义域名的默认解析路径可能出现不可达、重置或线路质量差；这不等同于 Cloudflare 项目被平台封禁。已验证可通过 CF 优选入口改善节点连接。

如果关闭 Clash 后无法直接访问 edgetunnel 后台，而又需要在直连环境运行 CFData，应使用本地 Hosts / SwitchHosts 或路由器本地 DNS 覆写，把后台域名临时指向一个已验证可达的 CF 优选 IP。**这些真实运行映射不要提交 Public GitHub。**
