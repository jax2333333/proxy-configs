# JAX Cloudflare Node

一个尽量精简、完全自用的 Cloudflare Workers VLESS 节点实现。

## 设计目标

- Cloudflare Workers Free 可部署
- VLESS + WebSocket + TLS
- 只支持 TCP，不支持 UDP / MUX / BT / PT
- 不依赖公共 ProxyIP
- 不依赖第三方订阅转换服务
- 不在 GitHub 中保存真实 UUID、WS Path、Token、API Key
- 可用于 Shadowrocket、Clash Verge Rev、OpenClash / Mihomo
- GitHub `main` 分支作为代码唯一正式版本

## 文件

- `worker.js`：Worker 主程序
- `wrangler.jsonc`：Cloudflare Workers / GitHub Builds 正式部署配置，不包含秘密
- `wrangler.toml.example`：Wrangler TOML 参考模板
- `.gitignore`：避免本地 secrets / Wrangler 文件误提交

## 1. 准备 UUID 和 WS Path

在本地生成 UUID：

```bash
uuidgen | tr '[:upper:]' '[:lower:]'
```

生成随机 WebSocket Path：

```bash
printf '/jax-%s\n' "$(openssl rand -hex 12)"
```

示例仅用于说明：

```text
UUID    = 00000000-0000-4000-8000-000000000000
WS_PATH = /jax-0123456789abcdef01234567
```

不要把真实值提交到本仓库。

## 2. 推荐：GitHub → Cloudflare 自动部署

Cloudflare Dashboard：

1. 进入 `Workers & Pages`。
2. 选择 `Create application`。
3. 在 `Import a repository` 旁选择 `Get started`。
4. 连接 GitHub，并选择仓库 `jax2333333/proxy-configs`。
5. Production branch 选择 `main`。
6. Worker / Project name 必须设置为：

```text
jax-cf-node
```

7. Root directory 设置为：

```text
cloudflare-node
```

8. Build command 留空。
9. Deploy command 使用默认：

```text
npx wrangler deploy
```

10. 保存并部署。

部署完成以后，后续修改 `cloudflare-node/` 并提交到 GitHub `main`，Cloudflare 可以自动构建并重新部署。

建议在 Cloudflare 的 Build watch paths 中只包含：

```text
cloudflare-node/**
```

这样修改 Shadowrocket、Clash Verge 或 OpenClash 配置时不会触发 CF Worker 重建。

## 3. 设置 Cloudflare Secrets

进入：

```text
Workers & Pages
→ jax-cf-node
→ Settings
→ Variables and Secrets
```

新增两个 `Secret`：

```text
UUID
WS_PATH
```

值分别填写你在第 1 步生成的真实 UUID 和随机路径。

注意：必须选择 `Secret`，不要使用普通明文变量。保存后执行 Deploy。

## 4. 可选：Wrangler 手动部署

如果不使用 GitHub Builds，可进入本目录直接运行：

```bash
npx wrangler secret put UUID
npx wrangler secret put WS_PATH
npx wrangler deploy
```

本仓库的 `wrangler.jsonc` 本身不保存任何 Secret。

## 5. 域名

优先推荐给 Worker 绑定自己的 Cloudflare Custom Domain，例如：

```text
cf.example.com
```

也可以先使用 Cloudflare 自动分配的：

```text
jax-cf-node.<你的 workers.dev 子域>.workers.dev
```

客户端中的 `server`、`Host`、`SNI/servername` 必须使用你实际部署的域名。

## 6. Shadowrocket

手动添加 VLESS 节点：

```text
类型：VLESS
地址：cf.example.com
端口：443
UUID：<YOUR_UUID>
传输：WebSocket
TLS：开启
SNI：cf.example.com
Host：cf.example.com
Path：<YOUR_WS_PATH>
UDP：关闭
```

节点名称建议：

```text
☁️ CF-Auto
```

## 7. Clash Verge Rev / OpenClash / Mihomo

模板：

```yaml
proxies:
  - name: "☁️ CF-Auto"
    type: vless
    server: cf.example.com
    port: 443
    uuid: YOUR_UUID
    network: ws
    tls: true
    servername: cf.example.com
    udp: false
    ws-opts:
      path: /YOUR_WS_PATH
      headers:
        Host: cf.example.com
```

注意：真实 UUID、域名和 WS Path 应只保存在客户端本地配置或 Cloudflare Secrets 中，不要直接提交到这个 Public 仓库。

## 8. 当前限制

本项目刻意保持精简：

- 只处理 VLESS TCP 请求。
- 不实现 UDP 转发，因此不适合作为游戏节点。
- 不提供固定国家 / 地区出口，不能把 Cloudflare Worker 当成固定日本、美国或新加坡 VPS。
- 不适合 BT / PT、大流量下载、长期 4K 视频主力线路。
- Cloudflare Workers 的出站 TCP 无法连接 Cloudflare 自身 IP 范围，因此部分目标可能无法通过此最简实现访问。
- 第一阶段不使用 ProxyIP；如果实际测试确实存在必要，再单独评估自建或可信 ProxyIP，而不是直接接入公共 ProxyIP。

## 9. 建议测试顺序

部署完成后依次测试：

1. Google
2. GitHub
3. ChatGPT
4. YouTube
5. Telegram
6. 移动网络 / 家宽分别测速和稳定性测试

如果基础版本稳定，再考虑增加第二个 `☁️ CF-Best` 优选入口节点。优选 IP 只优化“客户端 → Cloudflare”这一段，不代表获得固定国家出口。

## 安全约定

- 本目录所在仓库为 Public。
- 禁止提交真实 UUID、Cloudflare API Token、Account ID、私有 Cookie、密码、真实机场订阅地址等敏感信息。
- 修改 `worker.js` 前以 GitHub `main` 分支最新版为准。
- 不默认引入第三方 ProxyIP、订阅转换器或外部节点池。
