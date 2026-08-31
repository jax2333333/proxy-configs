# Cloudflare 免费节点：视频研究与方案笔记

> 目的：把本项目参考视频、已验证资料、踩坑结论和后续架构固定记录在仓库中。GitHub `main` 为正式版本。
>
> 安全约定：本文件禁止写入真实 UUID、WS_PATH、ADMIN 密码、Cloudflare Token、ProxyIP 凭据、机场订阅等敏感信息。

## 用户提供的视频/搜索入口

1. https://www.youtube.com/watch?v=chcFg878840&t=661s
2. https://www.youtube.com/watch?v=K0_NC6Lg64c
3. https://www.youtube.com/shorts/S0uLH9XQhoE
4. https://www.youtube.com/results?search_query=%E7%99%BD%E5%AB%96+cf+%E6%95%99%E7%A8%8B+

## 已验证的第一条视频主题

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

## 下一步

1. 给当前 Worker 绑定自定义域名，例如 `cf.example.com`。
2. 使用自定义域名测试根路径/health。
3. 客户端测试：先用自定义域名作为 server；若本地 DNS 不稳定，再用 CF 优选 IP 作为 server，SNI/Host 仍保持自定义域名。
4. 如果普通站点能通但 ChatGPT/Cloudflare 站点不通，再加入 ProxyIP/链式代理。
5. 如果决定切换 edgetunnel/cfnew，先在本仓库创建独立子目录并记录上游 commit，不覆盖 JAX v1，便于回滚和审计。

## 关于视频解析完整性

第一条视频已经通过配套公开文章和项目文档交叉验证。第二条视频与 Shorts 的具体字幕/画面目前无法从公开索引完整提取；如果需要逐分钟、逐画面核对，请上传视频文件或字幕后再补充本笔记。不要根据无法访问的内容猜测细节。
