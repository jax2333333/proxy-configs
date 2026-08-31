# Cloudflare 免费节点：视频研究与方案笔记

> 目的：把本项目参考视频、已验证资料、踩坑结论和后续架构固定记录在仓库中。GitHub `main` 为正式版本。
>
> 安全约定：本文件禁止写入真实 UUID、WS_PATH、ADMIN 密码、Cloudflare Token、ProxyIP 凭据、机场订阅等敏感信息。

## 用户提供的视频/搜索入口

1. https://www.youtube.com/watch?v=chcFg878840&t=661s
2. https://www.youtube.com/watch?v=K0_NC6Lg64c
3. https://www.youtube.com/shorts/S0uLH9XQhoE
4. https://www.youtube.com/results?search_query=%E7%99%BD%E5%AB%96+cf+%E6%95%99%E7%A8%8B+

## 第一条视频：已验证主题

视频 `chcFg878840` 与 2026 年 4 月公开的零度博客配套教程对应，主题是：

- 免费/自有域名托管到 Cloudflare
- 使用 Cloudflare Workers / Pages 部署 edgetunnel
- 使用 KV 保存面板配置
- 绑定自定义子域名，而不是只依赖 `workers.dev`
- VLESS / Trojan 等协议
- 面板生成多客户端订阅
- 可选优选 IP / 优选域名
- 可选 ProxyIP / 链式代理解决 Cloudflare Worker 原生出站限制

上游项目：

- cmliu/edgetunnel: https://github.com/cmliu/edgetunnel
- byJoey/cfnew: https://github.com/byJoey/cfnew

## 第二条视频：已上传并逐段分析

用户已上传完整视频文件，对应第二个 YouTube 视频 `K0_NC6Lg64c`。视频约 16 分 58 秒，1920×1080，主要流程如下。

### 0:00–2:00：直接部署 edgetunnel 到 Cloudflare Pages

- 视频直接使用 `cmliu/edgetunnel` 项目。
- 下载/准备 `edgetunnel-main.zip`。
- 在 Cloudflare `Workers 和 Pages` 中使用“上传项目”方式创建 Pages 站点。
- 画面中项目部署到类似 `ed-xxx.pages.dev` 的 Pages 域名。

这说明视频作者并没有自己编写 VLESS Worker，而是完整使用 edgetunnel 的 Pages 部署方式。

### 2:00–4:30：配置管理后台 ADMIN 与 KV

- 在 Pages 设置中添加 `ADMIN` 环境变量，作为 `/admin` 管理后台口令。
- 视频演示值使用简单示例密码；JAX 正式方案不得照搬弱密码。
- 新建/绑定 KV namespace，变量名使用 `KV`。
- KV 用于持久化 edgetunnel 面板里的节点、订阅和优选设置。

JAX 安全调整：

- `ADMIN` 必须使用高强度随机值，优先以 Secret 形式保存。
- GitHub 不保存 ADMIN、UUID、订阅 Token 等真实值。
- KV 可以用，但应把管理后台视为高权限入口，不公开分享管理地址和密码。

### 4:30–6:00：edgetunnel 2.1 管理后台生成节点/订阅

视频画面显示的后台版本为 `v2.1.20260811`。

后台提供：

- 获取 VLESS 节点链接
- 二维码
- 自适应订阅
- 自定义优选订阅
- “开始优选”
- “订阅接口”
- “链式代理”

画面中的自定义优选格式支持：

```text
IP:端口#节点名称
```

例如 Cloudflare IPv4 + 443/2053/2087/2096/8443 等 TLS 端口。

### 6:00–10:30：CF 优选 IP 实测

视频把 edgetunnel 生成的订阅导入 v2rayN，测试多个 Cloudflare 优选入口。

画面中出现：

- 188.164.248.x
- 104.18.33.x
- 8.35.211.x
- 172.66.x.x

节点名称包含“CF 电信优选”等，延迟大约 80–90 ms 的示例。

视频也出现部分 WebSocket 连接报错，说明公开优选 IP 并不是全部可用，必须实际测速筛选。

随后使用 Google Fiber Speed Test 做速度展示，视频中的一次示例约为：

- Ping: 87 ms
- Download: 1196 Mbps
- Upload: 66 Mbps

该速度只代表视频作者当时网络/线路，不能当作中国大陆家庭网络的普遍结果。

### 10:30–14:30：第三方优选 IP 来源和本地扫描工具

视频进一步使用公开优选 IP 数据源和扫描工具。

明确看到的一个来源：

```text
https://raw.githubusercontent.com/LancelotRar/best-cf-ips/main/best-cf-ipv4.txt
```

视频还展示 `CFData-WEB` 一类本地扫描工具（localhost 页面），扫描约 6534 个地址并按 Cloudflare 数据中心归类，示例包含：

- SIN / Singapore
- NRT / Tokyo
- SJC / San Jose
- LAX / Los Angeles
- FRA / Frankfurt
- AMS / Amsterdam

这类扫描工具的意义是：从用户自己的当前网络出发测 RTT/可达性，而不是盲信别人公布的“优选 IP”。

### 14:30–16:58：聚合多个公开优选源并导入测试

视频最后把多个第三方优选源/域名放进 edgetunnel 的“自定义优选”区域，然后生成大量 VLESS 节点导入 v2rayN。

画面里可见的来源包括：

- `bestcf.pages.dev/...`
- `cf.090227.xyz/...`
- `raw.githubusercontent.com/LancelotRar/best-cf-ips/...`
- `bestcf.030101.xyz`
- `cdn.2020111.xyz`
- `cdns.doon.eu.org`
- `cf.0sm.com`
- `cf.877771.xyz`
- `cf.877774.xyz`
- `cf.900501.xyz`
- `cfip.1323123.xyz`
- `cfip.cfcdn.vip`

这些属于第三方公开优选来源，不应默认视为可信基础设施。

### 第二条视频真正值得采用的部分

推荐吸收：

1. 用 edgetunnel 成熟实现，而不是继续自己从零补全所有 VLESS/订阅/ProxyIP 细节。
2. 使用 KV 持久化管理配置。
3. 自定义域名作为 Host/SNI。
4. 把“优选入口”和“Worker 出站 ProxyIP”分开理解。
5. 优选 IP 必须在用户自己的网络上测试。
6. 保留多个入口，自动/手动淘汰失效 IP。

不建议原样照搬：

1. 使用弱 ADMIN 密码。
2. 将大量第三方公开优选源全部长期信任。
3. 把别人测速结果当成自己的线路结论。
4. 把公开优选 IP 当成固定地区出口。
5. 把 Pages/Worker 管理后台链接和订阅 Token 公开分享。

## 2026-08 核对后的关键事实

### 1. 不应把 workers.dev 当作唯一入口

Cloudflare 官方建议生产 Worker 使用 Custom Domain 或 Route；`workers.dev` 更适合作为入门和个人/爱好用途。

本项目已经实际遇到：客户端连接 `jax-cf-node.*.workers.dev` 时，DNS 解析到错误地址并超时，而浏览器通过其他 DNS/代理路径访问时又能看到 Worker 页面。因此后续正式节点必须使用自定义域名，并支持“server = CF 优选 IP/域名，SNI/Host = 自定义 Worker 域名”的方式，避免依赖 `workers.dev` DNS。

### 2. Worker 原生 connect() 有硬限制

Cloudflare Workers 的 `cloudflare:sockets connect()` 可以建立出站 TCP，但官方明确说明：不能连接 Cloudflare 自己的 IP ranges。

因此一个“纯 connect()、没有 ProxyIP/链式代理”的 VLESS Worker，会出现：

- 部分普通目标可直连
- Cloudflare 托管目标可能失败
- ChatGPT 等大量使用 Cloudflare 的服务不能保证可用

这不是客户端参数能完全解决的问题。

### 3. ProxyIP 的真正作用

ProxyIP 不是所谓“CF 优选 IP”。

- CF 优选 IP：优化 `客户端 -> Cloudflare` 入口
- ProxyIP / SOCKS5 / HTTP(S) 链式代理：优化或补足 `Cloudflare Worker -> 目标站` 出站

使用第三方 ProxyIP 会增加第三方依赖。对 HTTPS 流量，转发方通常仍不能看到 TLS 内部明文，但能看到连接元数据，因此优先考虑：

1. 自有/可信出站代理
2. 明确可替换的 ProxyIP
3. 最后才考虑公共 ProxyIP

不要把公共 ProxyIP、订阅转换器当成“完全无隐私风险”。

### 4. edgetunnel / cfnew 比最简 Worker 完整

2026 年当前版本已经包含：

- VLESS / Trojan（edgetunnel 还支持 Shadowsocks）
- WS / gRPC / XHTTP（视项目版本）
- KV 管理面板
- 自定义路径
- 多客户端订阅生成
- ProxyIP / SOCKS5 / HTTP(S) 出站代理
- 优选 IP / 优选订阅
- DNS/UDP 的兼容处理

代价是代码量和攻击面显著大于 JAX 最简 Worker，因此如果采用上游方案，应该固定版本、保留来源、不要直接运行来源不明的二次打包脚本。

## JAX 方案调整结论

### v1（当前最简 Worker）

优点：

- 代码短，容易审计
- UUID / WS_PATH 只放 Cloudflare Secret
- 无第三方订阅转换器

缺点：

- `workers.dev` 在部分网络环境可能被 DNS 污染/不可达
- Cloudflare 自身 IP ranges 无法通过原生 `connect()` 访问
- 没有可切换 ProxyIP / 链式代理
- 适合作为教学/基线测试，不适合作为最终主力节点

### v2（推荐正式方案）

目标架构：

```text
Shadowrocket / Clash Verge / OpenClash
        |
        |  VLESS + WS/TLS
        v
CF 优选 IP / 优选域名（可选）
        |
        | SNI + Host = 自定义 Worker 域名
        v
Cloudflare Worker / Pages
        |
        +-- 普通目标：直接 connect()
        |
        +-- CF 托管/直连失败目标：ProxyIP 或可信链式代理
        v
Internet
```

必须：

- 自定义 Cloudflare 子域名
- VLESS + TLS
- 随机 UUID
- 随机路径
- Secret 不进 GitHub
- 可本地导入 Shadowrocket / Clash Verge / OpenClash

推荐：

- 优先使用自定义域名作为 Host/SNI
- 客户端入口可使用经过本地测速的 Cloudflare 优选 IP/域名
- ProxyIP 做成可选 Secret/变量，不写死在源码
- 默认关闭第三方订阅转换器
- 默认关闭或最小化访问日志
- 上游代码采用固定版本/固定 commit，不直接自动跟随未知更新
- 若采用 edgetunnel，优先使用“固定上游版本 + 自有 KV + 自有 ADMIN + 自有域名”，而不是整合大量公开第三方服务

## 下一步

1. 给当前 Worker 绑定自定义域名，例如 `cf.example.com`。
2. 使用自定义域名测试根路径/health。
3. 客户端测试：先用自定义域名作为 server；若本地 DNS 不稳定，再用 CF 优选 IP 作为 server，SNI/Host 仍保持自定义域名。
4. 如果普通站点能通但 ChatGPT/Cloudflare 站点不通，再加入 ProxyIP/链式代理。
5. 并行新建一个 `edgetunnel` 测试部署，不覆盖 JAX v1；验证 Pages/KV/ADMIN/订阅后再决定是否作为正式 v2。
6. 优选 IP 优先采用本地测速结果；公共列表只作为候选来源，不作为唯一来源。

## 关于视频解析完整性

- 第一条视频已经通过配套公开文章和项目文档交叉验证。
- 第二条视频已由用户上传原始 MP4，并完成逐段画面分析；上述流程均来自视频实际画面。
- 第三条 Shorts 尚未上传原始视频，公开索引不足以逐帧确认；收到视频文件后再补充。
