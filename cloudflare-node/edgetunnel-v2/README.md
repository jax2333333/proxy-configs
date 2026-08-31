# JAX CF edgetunnel v2

这是 `proxy-configs` 中的 Cloudflare 免费节点 v2 试验/正式候选方案。

## 与 v1 的关系

- `cloudflare-node/worker.js`：JAX 自写最简 Worker，继续保留作为基线、排错和回滚版本。
- `cloudflare-node/edgetunnel-v2/`：基于固定版本 `cmliu/edgetunnel` 的完整方案，不覆盖 v1。

## 目标

- Cloudflare Pages + GitHub 自动构建
- VLESS / TLS / WS 等 edgetunnel 能力
- KV 管理配置
- 自定义域名作为 Host/SNI
- 支持优选入口和 ProxyIP / SOCKS5 / HTTP(S) 链式出站
- 不把 ADMIN、UUID、KEY、Cloudflare Token、代理凭据写入公开 GitHub
- 上游固定 commit，可审计、可回滚，不自动追随未知更新

## 构建方式

本目录不直接保存第三方 300KB+ `_worker.js`。

Cloudflare Pages 构建时运行：

```text
node sync-upstream.mjs
```

脚本只下载 `UPSTREAM.md` 中固定 commit 的：

- `_worker.js`
- `LICENSE`

并验证 Git blob SHA，成功后输出：

```text
dist/_worker.js
dist/LICENSE
```

Cloudflare Pages 的 Build output directory 使用：

```text
dist
```

## 推荐 Cloudflare 变量

敏感值全部在 Cloudflare Dashboard 中配置，不写 GitHub。

必须：

```text
ADMIN = 高强度随机管理密码
UUID  = UUIDv4
KEY   = 高强度随机订阅路径密钥
```

隐私建议：

```text
OFF_LOG = 1
```

保持：

```text
DEBUG = 不设置
```

可选：

```text
PROXYIP = 可信的自有/可信第三方反代地址
GO2SOCKS5 = 按需要配置
URL = 伪装主页地址或 1101
```

KV binding 名称必须为：

```text
KV
```

## 重要隐私说明

edgetunnel v2 的功能比 JAX v1 完整，但它不是“完全没有第三方依赖”的架构。

当前固定上游版本包含：

- 管理/登录静态页面来自 `edt-pages.github.io`；
- 如果没有设置自定义 `PROXYIP`，代码会使用作者提供的默认 ProxyIP fallback；
- 面板可以配置第三方优选 API / 订阅相关服务。

这意味着：如果目标是最大限度减少第三方元数据暴露，应逐步替换为自有/可信出站，不应把公共 ProxyIP 和公共优选 API 当成永久基础设施。

## 部署

见 `DEPLOY.md`。

## 安全规则

1. GitHub `main` 是本项目配置文档和构建逻辑的唯一正式版本。
2. ADMIN / UUID / KEY / Token / Proxy 凭据禁止提交 GitHub。
3. 每次升级 edgetunnel 前必须先读取上游最新代码和 CHANGELOG，再人工更新固定 commit。
4. 默认关闭调试日志，并设置 `OFF_LOG=1`。
5. 自定义域名优先，不把 `pages.dev` / `workers.dev` 当长期唯一入口。
6. CF 优选 IP 只表示客户端 → Cloudflare 的入口优化，不代表固定国家出口。
