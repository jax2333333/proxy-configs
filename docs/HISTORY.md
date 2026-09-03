# 历史记录 / History

> 本文件只用于理解迁移原因、踩坑和已淘汰方案。**历史信息不是当前正式配置。** 修改前必须回到 `main` 当前实际文件验证。

## 1. 仓库统一维护

早期 Shadowrocket、Clash Verge、OpenClash 配置曾分别来自 Gist / 本地文件。后来统一迁移到：

```text
jax2333333/proxy-configs
main
```

历史 Gist 标识：

- Shadowrocket：`3745fc1bc0d793346c2caae32fdc3d35`
- Clash Verge：`50ddce2fe0f2e587a80b94f6c9ed49eb`
- OpenClash：`e578e785ab374a2ae4d4bfd4d3c91593`

这些只作历史来源/备份，不再作为正式配置源。

## 2. 三客户端知识固化

Shadowrocket、Clash Verge、OpenClash 后续分别建立了：

- 子目录 README；
- ChatGPT Maintenance Prompt；
- Knowledge Index；
- Current State / Current Config；
- Operations / Install & Recovery；
- Troubleshooting；
- History。

目的：新对话不依赖聊天记录，先从 GitHub `main` 接管。

本次又增加根 `docs/`，负责仓库级导航和跨项目长期规则，不替代各子项目自己的详细知识。

## 3. Cloudflare v1：自写最简 Worker

第一阶段目标是建立一个尽量简单、完全自用的 Cloudflare Workers VLESS 节点：

- VLESS + WebSocket + TLS；
- TCP-only；
- UUID / WS Path 放 Cloudflare Secrets；
- 代码在 `cloudflare-node/worker.js`；
- GitHub 不保存凭据。

### v1 部署踩坑

曾出现 Cloudflare Worker 线上仍是默认 `Hello world`，而 GitHub 自动 Build 没真正触发。GitHub App 权限正常，但 Cloudflare 最近建置为空、版本都显示手动部署。

最终曾通过 Cloudflare 网页编辑器手工复制正式 `worker.js` 验证代码上线；根页面由 `Hello world` 变为 `Not Found`，说明正式 Worker 生效。

### v1 入口问题

客户端连接 `workers.dev` 时，曾解析到异常的非 Cloudflare IP 并 `i/o timeout`。这说明问题发生在 Worker 收到连接之前，促使方案转向：

- 自定义域名；
- Cloudflare 优选入口；
- 不把 `workers.dev` 当长期唯一入口。

### v1 局限

- 功能少；
- TCP-only；
- 没有成熟面板/KV/订阅/优选管理；
- Cloudflare 出站到部分 Cloudflare 托管目标需要额外处理；
- 不适合作为长期主方案，但保留作基线、排错和回滚。

## 4. 教程研究 → edgetunnel v2

根据多条 Cloudflare 免费节点/白嫖教程和实际测试，方案逐步从“自写最简 Worker”转向：

```text
Cloudflare Pages
+ edgetunnel
+ ADMIN / UUID / KEY Secrets
+ KV
+ 自定义域名
+ VLESS / WS / TLS
+ 优选入口
+ ProxyIP / 可选链式出站
```

相关研究保存于：

- `cloudflare-node/RESEARCH-VIDEOS.md`
- `cloudflare-node/research/`

研究资料只是方案来源，正式实现以 `cloudflare-node/edgetunnel-v2/` 当前文件为准。

## 5. v2 供应链固定

没有直接让 Cloudflare 每次抓第三方上游 `main`。正式设计改为：

- 固定 `cmliu/edgetunnel` commit；
- 构建时下载 `_worker.js` / LICENSE；
- 计算并验证 Git blob SHA；
- 校验失败则停止构建；
- 固定信息写 `UPSTREAM.md`；
- 更新必须人工审查。

这比无条件跟随上游更容易审计和回滚。

## 6. v2 Pages 部署验证

经过 Workers/Pages 入口选择的排查后，最终确认 v2 应使用 **Pages Git build**：

```text
Root: cloudflare-node/edgetunnel-v2
Build: node sync-upstream.mjs
Output: dist
Production: main
```

后续完成：

- Production Secrets；
- `KV` binding；
- admin/login；
- 自定义域名；
- VLESS 原生节点/自适应订阅。

根路径出现 nginx 伪装页面属于 edgetunnel 正常行为，不是部署失败。

## 7. v2 连接与速度排查

最初客户端直接使用自定义域名默认 Cloudflare IP 时出现过：

- `connection forcibly closed`；
- timeout；
- 能用但 YouTube 4K 严重卡顿。

检查 edgetunnel 原生节点后确认 Path、Host、SNI 等参数正确，进一步定位为“本地网络 → Cloudflare 入口线路”质量问题。

使用 CFData-WEB 本地优选后，找到 0% 丢包、低延迟且高吞吐的 Cloudflare 入口。客户端把 `server` 换为优选 IP、继续保持自定义域名作为 Host/SNI 后，YouTube 4K60 从低速卡顿提升到高吞吐、可稳定播放。

由此固定两个概念：

- **CF 优选 IP**：优化客户端 → Cloudflare；
- **ProxyIP**：处理 Cloudflare → 目标站出站。

二者不能混用。

## 8. 中国大陆直连后台问题

实际环境中出现：

- 开 Clash 可访问 edgetunnel 后台；
- 关闭 Clash 后后台域名可能打不开；
- 但做 CFData 本地优选又希望关闭代理。

解决思路：用 SwitchHosts / Windows hosts / 路由器本地 DNS，把后台域名临时指向一个已验证可达的 CF 优选 IP。这样仍以原域名做 HTTPS/SNI，但入口不走默认解析。

真实域名/IP 映射属于运行资料，不写 Public GitHub。

## 9. 后续维护方向

当前不再追求“不断换新脚本/公共服务”，而是：

1. 保持 v2 固定上游、可审计；
2. 保留 v1 基线；
3. 定期在本地网络重测 CF 优选入口；
4. 逐步减少对默认公共 ProxyIP / 公共订阅服务的依赖；
5. 上游更新先审查、测试、可回滚；
6. 敏感运行参数留在 Cloudflare / 本地，不进入 Public GitHub。
